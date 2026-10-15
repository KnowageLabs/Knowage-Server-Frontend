<template>
    <div class="dossier-designer" data-test="dossier-designer">
        <!-- One centered column: the template card and the list/detail area have the same width -->
        <div class="dossier-designer__column column no-wrap">
            <q-banner v-if="oldVersion" dense class="dossier-designer__old" data-test="old-version-banner">
                <template #avatar>
                    <q-icon name="warning" size="20px" />
                </template>
                {{ $t('documentExecution.dossier.warning.oldVersion') }}
            </q-banner>
            <DossierDesignerTemplateCard
                v-else
                :template="template"
                :name-valid="nameValid"
                :prefix-valid="prefixValid"
                :can-scan="canScan"
                :scanning="scanning"
                :needs-scan="needsScan"
                :show-run="mode === 'details'"
                :run-disabled-reason="runDisabledReason"
                @pick-file="pickFile"
                @scan="findPlaceholders()"
                @run="emit('run')"
            />
            <input ref="fileInput" type="file" accept=".docx, .pptx" class="hidden" data-test="template-file-input" @change="onFileChange" />

            <div v-if="!oldVersion" class="dossier-designer__body row no-wrap col">
                <q-card class="dossier-designer__list">
                    <q-scroll-area class="fit">
                        <DossierDesignerPlaceholderList :placeholders="template.placeholders" :selected-name="selectedName" :missing="missing" :incomplete="incomplete" @select="selectPlaceholder" @remove="removePlaceholder" />
                    </q-scroll-area>
                </q-card>
                <div class="dossier-designer__content col">
                    <!-- The hint sits outside the scroll area, so it can center in the full height -->
                    <q-scroll-area v-if="selectedPlaceholder" class="fit">
                        <DossierDesignerPlaceholderDetail :placeholder="selectedPlaceholder" :mode="mode" :sheet-count="sheets[selectedPlaceholder.imageName] ?? 1" :dossier-drivers="dossierDrivers" @link="documentDialogVisible = true" @reset="resetPlaceholder" />
                    </q-scroll-area>
                    <KnHint v-else-if="template.placeholders.length === 0" title="documentExecution.dossier.designerDialog.placeholders" hint="documentExecution.dossier.designer.noPlaceholders" data-test="no-placeholders-hint" />
                    <KnHint v-else title="documentExecution.dossier.designerDialog.placeholders" hint="documentExecution.dossier.designerDialog.noPlaceholdersHint" data-test="no-selection-hint" />
                </div>
            </div>
        </div>

        <DossierDocumentSelectionDialog v-if="documentDialogVisible" :visible="documentDialogVisible" :workspace="mode === 'workspace'" @close="documentDialogVisible = false" @apply="linkDocument" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { v4 as uuidv4 } from 'uuid'
import axios from '@/axios.js'
import mainStore from '@/App.store'
import KnHint from '@/components/UI/KnHint.vue'
import { extendedAlphanumeric } from '@/helpers/commons/regexHelper'
import type { iDossierDesignerState, iDossierTemplate, iPlaceholder } from './DossierTemplate'
import { getDossierDriverLinkType, getDossierDriverParameterUrlName, getDossierDynamicDriverUrlName, mergeDossierPlaceholderParameters, normalizeDossierTemplate, serializeDossierDriver, serializeInheritDriverForPersist } from './DossierDesignerDriversHelper'
import descriptor from './DossierDesignerDescriptor.json'
import DossierDesignerTemplateCard from './DossierDesignerTemplateCard.vue'
import DossierDesignerPlaceholderList from './DossierDesignerPlaceholderList.vue'
import DossierDesignerPlaceholderDetail from './DossierDesignerPlaceholderDetail.vue'
import DossierDocumentSelectionDialog from './DossierDocumentSelectionDialog.vue'

const props = defineProps<{ document: any | null; mode: 'details' | 'workspace' }>()
const emit = defineEmits<{ (e: 'state', state: iDossierDesignerState): void; (e: 'run'): void }>()

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()

const dossierContext = import.meta.env.VITE_KNOWAGEDOSSIER_CONTEXT
const knowageContext = import.meta.env.VITE_KNOWAGE_CONTEXT

const template = ref<iDossierTemplate>(emptyTemplate())
const oldVersion = ref(false)
const hasSavedTemplate = ref(false)
const uploadedFile = ref<File | null>(null)
const uuid = ref('')
const needsScan = ref(false)
const scanning = ref(false)
const selectedName = ref<string | null>(null)
const missing = ref(new Set<string>())
const sheets = ref<Record<string, number>>({})
// Placeholders whose document drivers are already merged in this session
const driversLoaded = new Set<string>()
const documents = ref<any[]>([])
const dossierDrivers = ref<any[]>([])
const documentDialogVisible = ref(false)
const snapshot = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
// The prefix watcher must not flag a scan for values written by the load
let loading = false

const userId = computed(() => (store.user as any)?.userUniqueIdentifier)
const documentId = computed(() => props.document?.id)
const selectedPlaceholder = computed(() => template.value.placeholders.find((placeholder) => placeholder.imageName === selectedName.value) ?? null)

const nameValid = computed(() => !!template.value.name && extendedAlphanumeric.test(template.value.name))
const prefixValid = computed(() => !!template.value.prefix && extendedAlphanumeric.test(template.value.prefix))
const canScan = computed(() => nameValid.value && prefixValid.value && !scanning.value)

const linkedPlaceholders = computed(() => template.value.placeholders.filter((placeholder) => placeholder.label && !missing.value.has(placeholder.imageName)))
// Linked placeholders with a document driver that has no link type: the save cannot serialize them
const incomplete = computed(() => new Set(props.mode === 'details' ? linkedPlaceholders.value.filter((placeholder) => !placeholder.viewId && placeholder.parameters?.some((driver) => !getDossierDriverLinkType(driver))).map((placeholder) => placeholder.imageName) : []))
const hasUntypedDriver = computed(() => incomplete.value.size > 0)

const dirty = computed(() => !!uploadedFile.value || buildSnapshot() !== snapshot.value)
const invalidReason = computed<string | null>(() => {
    if (oldVersion.value) return 'documentExecution.dossier.warning.oldVersion'
    if (!nameValid.value) return 'documentExecution.dossier.designer.fileMissing'
    if (!prefixValid.value) return 'documentExecution.dossier.designer.prefixMissing'
    if (needsScan.value) return 'documentExecution.dossier.designer.rescanNeeded'
    if (hasUntypedDriver.value) return 'documentExecution.dossier.designer.driverTypeMissing'
    return null
})
const valid = computed(() => !invalidReason.value)
const runDisabledReason = computed(() => (!hasSavedTemplate.value || dirty.value ? 'documentExecution.dossier.designer.runDisabled' : null))

watch([dirty, valid, invalidReason], () => emit('state', { dirty: dirty.value, valid: valid.value, invalidReason: invalidReason.value }), { immediate: true })

watch(
    () => template.value.prefix,
    () => {
        if (!loading) needsScan.value = true
    }
)

watch(documentId, (newId, oldId) => {
    if (newId !== oldId) reload()
})

watch(
    () => props.document?.drivers,
    (drivers) => (dossierDrivers.value = drivers ?? []),
    { immediate: true }
)

onMounted(async () => {
    await Promise.all([reload(), loadDocuments()])
})

function emptyTemplate(): iDossierTemplate {
    return { type: '', name: '', prefix: '', placeholders: [], uploadable: false, downloadable: false }
}

function getDossierType(fileName: string): string {
    return fileName.indexOf('.docx') == -1 ? 'PPT_TEMPLATE_V2' : 'DOC_TEMPLATE'
}

// What the save writes, without the values that only the UI fills (driver metadata, the default sheet), so opening the tab does not make it dirty
function buildSnapshot(): string {
    const value = template.value
    return JSON.stringify({
        name: value.name,
        prefix: value.prefix ?? '',
        uploadable: !!value.uploadable,
        downloadable: !!value.downloadable,
        placeholders: value.placeholders
            .filter((placeholder) => placeholder.label && !missing.value.has(placeholder.imageName))
            .map((placeholder) => ({
                imageName: placeholder.imageName,
                label: placeholder.label,
                viewId: placeholder.viewId ?? placeholder.views?.selected?.id ?? null,
                sheetWidth: Number(placeholder.sheetWidth),
                sheetHeight: Number(placeholder.sheetHeight),
                deviceScaleFactor: Number(placeholder.deviceScaleFactor),
                sheetNumber: placeholder.sheetNumber ?? 1,
                parameters: (placeholder.parameters ?? [])
                    .filter((driver) => getDossierDriverLinkType(driver))
                    .map((driver) => ({ urlName: getDossierDriverParameterUrlName(driver), type: getDossierDriverLinkType(driver), value: driver.value ?? null, dossierUrlName: getDossierDynamicDriverUrlName(driver) ?? null }))
            }))
    })
}

async function reload() {
    loading = true
    template.value = emptyTemplate()
    oldVersion.value = false
    hasSavedTemplate.value = false
    uploadedFile.value = null
    uuid.value = ''
    needsScan.value = false
    missing.value = new Set()
    sheets.value = {}
    driversLoaded.clear()
    selectedName.value = null

    if (documentId.value) {
        store.setLoading(true)
        await axios
            .get(`${dossierContext}/api/dossierdocument/dossierTemplate?user_id=${userId.value}&documentId=${documentId.value}`)
            .then((response: any) => {
                if (response.data.type === 'PPT_TEMPLATE') {
                    oldVersion.value = true
                    return
                }
                if (!response.data.name) return
                const loaded = normalizeDossierTemplate({ ...response.data, placeholders: response.data.placeholders ?? [] })
                loaded.type = getDossierType(loaded.name)
                loaded.placeholders.forEach((placeholder: any) => {
                    if (placeholder.viewId != null) {
                        placeholder.views = { selected: { id: placeholder.viewId }, availableViews: [] }
                        placeholder.source = 'VIEWS'
                    }
                    delete placeholder.viewId
                })
                template.value = loaded
                hasSavedTemplate.value = true
            })
            .finally(() => store.setLoading(false))
    }

    snapshot.value = buildSnapshot()
    // The prefix watcher runs after this tick, so release the flag one tick later
    setTimeout(() => (loading = false))

    // The saved template keeps only the linked placeholders: scan the stored file to show the others too
    if (hasSavedTemplate.value && documentId.value) await findPlaceholders(true).catch(() => undefined)
}

async function loadDocuments() {
    await axios.get(`${knowageContext}/restful-services/2.0/documents/listDocument`).then((response: any) => (documents.value = response.data.item ?? []))
}

function pickFile() {
    if (!fileInput.value) return
    fileInput.value.value = ''
    fileInput.value.click()
}

function onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    uploadedFile.value = file
    uuid.value = uuidv4()
    template.value.name = file.name
    template.value.type = getDossierType(file.name)
    needsScan.value = true
}

async function importTemplateFile(): Promise<boolean> {
    const formData = new FormData()
    formData.append('file', uploadedFile.value as File)
    formData.append('uuid', uuid.value)
    return axios
        .post(`${knowageContext}/restful-services/dossier/importTemplateFile`, formData, { headers: { 'X-Disable-Errors': 'true' } })
        .then((response: any) => response.data?.STATUS !== 'KO')
        .catch(() => false)
}

async function validateTemplateFile(): Promise<boolean> {
    const formData = new FormData()
    if (props.mode === 'details') formData.append('documentId', '' + documentId.value)
    formData.append('uuid', uuid.value)
    formData.append('prefix', '' + template.value.prefix)
    formData.append('fileName', template.value.name)
    return axios
        .post(`${dossierContext}/api/dossiervalidator/validateDocument?user_id=${userId.value}`, formData, { headers: { 'X-Disable-Errors': 'true' } })
        .then(() => true)
        .catch(() => false)
}

async function findPlaceholders(silent = false) {
    scanning.value = true
    store.setLoading(true)
    try {
        // A new file is imported and validated first; the stored file of the document was validated when it was uploaded (the validator needs the uuid)
        if (uploadedFile.value) {
            if (!(await importTemplateFile())) {
                store.setError({ title: t('common.error.generic'), msg: t('documentExecution.dossier.templateUploadError') })
                return
            }
            if (!(await validateTemplateFile())) {
                store.setError({ title: t('common.error.generic'), msg: t('documentExecution.dossier.designerDialog.errorDuringValidation') })
                return
            }
        }

        const endpoint = template.value.type === 'DOC_TEMPLATE' ? 'docplaceholders' : 'pptplaceholders'
        const params = new URLSearchParams({ fileName: template.value.name, prefix: template.value.prefix ?? '', user_id: userId.value })
        if (uploadedFile.value) params.append('uuid', uuid.value)
        else params.append('documentId', '' + documentId.value)

        const response: any = await axios.get(`${dossierContext}/api/dossierdocument/${endpoint}?${params.toString()}`)
        const names: string[] = (response.data ?? []).map((element: any) => element.name)
        mergePlaceholders(names, silent)
    } finally {
        scanning.value = false
        store.setLoading(false)
    }
}

// Same name keeps its configuration, a new name gets the default sizes, a name the scan did not find stays, marked, and is not saved
function mergePlaceholders(names: string[], silent = false) {
    const byName = new Map(template.value.placeholders.map((placeholder) => [placeholder.imageName, placeholder]))
    const found = names.map((name) => byName.get(name) ?? ({ imageName: name, ...descriptor.defaultPlaceholderSize } as iPlaceholder))
    const notFound = template.value.placeholders.filter((placeholder) => !names.includes(placeholder.imageName))
    const added = names.filter((name) => !byName.has(name)).length

    template.value.placeholders = [...found, ...notFound]
    missing.value = new Set(notFound.map((placeholder) => placeholder.imageName))
    needsScan.value = false

    if (silent && notFound.length === 0) return
    if (names.length === 0) {
        store.setInfo({ title: t('common.information'), msg: t('documentExecution.dossier.designerDialog.noPlaceholdersFound') })
        return
    }
    $q.notify({ type: 'info', message: t('documentExecution.dossier.designer.scanResult', { found: names.length, added: added, missing: notFound.length }) })
}

function removePlaceholder(name: string) {
    template.value.placeholders = template.value.placeholders.filter((placeholder) => placeholder.imageName !== name)
    missing.value.delete(name)
    missing.value = new Set(missing.value)
    if (selectedName.value === name) selectedName.value = null
}

async function selectPlaceholder(name: string) {
    selectedName.value = name
    const placeholder = selectedPlaceholder.value
    if (!placeholder?.label || placeholder.viewId || placeholder.views) return
    // Saved templates do not keep the document id: find it by label to show the drivers and the sheets
    const docId = placeholder.docId ?? documents.value.find((document) => document.DOCUMENT_LABEL === placeholder.label)?.DOCUMENT_ID
    const tasks: Promise<any>[] = []
    if (props.mode === 'details' && docId && !driversLoaded.has(placeholder.imageName)) tasks.push(loadParameters(placeholder, docId))
    if (sheets.value[placeholder.imageName] === undefined) tasks.push(loadSheets(placeholder, placeholder.label, false))
    await Promise.all(tasks)
}

async function linkDocument(row: any) {
    documentDialogVisible.value = false
    const placeholder = selectedPlaceholder.value
    if (!placeholder) return

    placeholder.parameters = []
    delete (placeholder as any).source
    delete placeholder.views
    delete placeholder.viewId
    delete placeholder.sheetNumber
    delete sheets.value[placeholder.imageName]

    if (row.type === 'VIEW') {
        placeholder.viewId = row.id
        placeholder.label = row.documentLabel
    } else {
        placeholder.label = row.DOCUMENT_LABEL
        if (props.mode === 'details') await loadParameters(placeholder, row.DOCUMENT_ID)
    }

    const label = row.documentLabel || row.DOCUMENT_LABEL || row.label
    if (label) await loadSheets(placeholder, label, true)
}

function resetPlaceholder() {
    const placeholder = selectedPlaceholder.value
    if (!placeholder) return
    placeholder.label = undefined
    placeholder.source = ''
    placeholder.parameters = []
    delete placeholder.viewId
    delete placeholder.views
    delete sheets.value[placeholder.imageName]
}

async function loadParameters(placeholder: iPlaceholder, docId: number | string) {
    driversLoaded.add(placeholder.imageName)
    await axios.get(`${knowageContext}/restful-services/2.0/documentdetails/${docId}/drivers`).then((response: any) => {
        if (response.data.length > 0) {
            placeholder.parameters = mergeDossierPlaceholderParameters(placeholder.parameters, response.data)
            placeholder.source = 'DRIVERS'
        } else if (placeholder.parameters) {
            placeholder.parameters = []
        }
    })
}

// The number of sheets of the linked document. Only a new link writes the default sheet, so a reload does not change the template.
// The engine needs sheetNumber for every document with sheets, also with one sheet (it fails on a null attribute).
async function loadSheets(placeholder: iPlaceholder, label: string, setDefault: boolean) {
    let count = 0
    try {
        const response: any = await axios.get(`${knowageContext}/restful-services/1.0/documents/${encodeURIComponent(label)}/template`, { headers: { 'X-Disable-Errors': 'true' } })
        if (Array.isArray(response.data?.sheets)) count = response.data.sheets.length
    } catch {
        count = 0
    }
    sheets.value[placeholder.imageName] = Math.max(count, 1)
    if (setDefault && count > 0 && placeholder.sheetNumber == null) placeholder.sheetNumber = 1
}

// Port of the old handleDrivers: static and dynamic links are serialized, an inherit link copies the driver to the dossier and becomes dynamic
async function buildTemplateToSave(targetDocument: any): Promise<{ template: iDossierTemplate; driversChanged: boolean } | null> {
    let driversChanged = false
    const objToSave = normalizeDossierTemplate(template.value)
    objToSave.placeholders = objToSave.placeholders.filter((placeholder) => placeholder.label && !missing.value.has(placeholder.imageName))

    for (const placeholder of objToSave.placeholders) {
        if (placeholder.source === 'VIEWS' || placeholder.views) {
            delete (placeholder as any).parameters
            placeholder.viewId = placeholder.views?.selected?.id ?? placeholder.viewId
            delete (placeholder as any).views
            continue
        }
        delete (placeholder as any).views

        for (let j = 0; j < (placeholder.parameters?.length ?? 0); j++) {
            const driver = placeholder.parameters[j]
            const linkType = getDossierDriverLinkType(driver)
            const parameterUrlName = getDossierDriverParameterUrlName(driver)
            const notHandled = () => store.setError({ title: t('common.error.generic'), msg: t('documentExecution.dossier.designerDialog.driverNotHandled', { driverName: driver.label, placeholderName: placeholder.imageName }) })

            if (linkType === 'static' || linkType === 'dynamic') {
                const serialized = serializeDossierDriver(driver)
                if (!serialized) {
                    notHandled()
                    return null
                }
                placeholder.parameters[j] = serialized
            } else if (linkType === 'inherit') {
                driversChanged = true
                const existing = dossierDrivers.value.find((candidate) => candidate.parameterUrlName === parameterUrlName)
                if (existing) {
                    placeholder.parameters[j] = { urlName: existing.parameterUrlName, type: 'dynamic', dossierUrlName: existing.parameterUrlName }
                    continue
                }
                const newDriver = serializeInheritDriverForPersist(driver, targetDocument?.id, dossierDrivers.value.length || 1)
                if (!newDriver?.biObjectID || !newDriver.parameterUrlName) {
                    notHandled()
                    return null
                }
                try {
                    await axios.post(`${knowageContext}/restful-services/2.0/documentdetails/${newDriver.biObjectID}/drivers`, newDriver, { headers: { 'X-Disable-Errors': 'true' } })
                } catch {
                    store.setError({ title: t('common.error.generic'), msg: t('documentExecution.documentDetails.drivers.persistError') })
                    return null
                }
                placeholder.parameters[j] = { urlName: newDriver.parameterUrlName, type: 'dynamic', dossierUrlName: newDriver.parameterUrlName }
                await axios.get(`${knowageContext}/restful-services/2.0/documentdetails/${newDriver.biObjectID}/drivers`).then((response: any) => (dossierDrivers.value = response.data ?? []))
            } else {
                notHandled()
                return null
            }
        }
    }
    return { template: objToSave, driversChanged }
}

// Saves the template of the document (or of documentOverride, a dossier just created in the workspace). The caller shows the success message.
async function save(documentOverride?: any): Promise<{ ok: boolean; driversChanged: boolean }> {
    const targetDocument = documentOverride ?? props.document
    template.value.type = getDossierType(template.value.name)

    store.setLoading(true)
    try {
        const result = await buildTemplateToSave(targetDocument)
        if (!result) return { ok: false, driversChanged: false }

        const objToSend: any = { template: result.template }
        if (targetDocument?.id) objToSend.id = targetDocument.id
        if (uploadedFile.value) objToSend.uuid = uuid.value

        const saved = await axios
            .post(`${dossierContext}/api/dossierdocument/saveTemplate?user_id=${userId.value}`, objToSend)
            .then(() => true)
            .catch(() => false)
        if (!saved) return { ok: false, driversChanged: result.driversChanged }

        uploadedFile.value = null
        uuid.value = ''
        hasSavedTemplate.value = true
        snapshot.value = buildSnapshot()
        return { ok: true, driversChanged: result.driversChanged }
    } finally {
        store.setLoading(false)
    }
}

defineExpose({ save, reload, dirty, valid, invalidReason })
</script>

<style lang="scss" scoped>
.dossier-designer {
    height: 100%;
    min-height: 0;
    background-color: var(--kn-color-background);

    // Same width and edge as the Informations tab: 1200 px, 16 px from the edge
    &__column {
        height: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px;
        gap: 16px;
        box-sizing: border-box;
    }

    &__old {
        background-color: var(--kn-message-warning-background-color);
        color: var(--kn-message-warning-color);
        border-radius: 4px;
    }

    &__body {
        min-height: 0;
        gap: 16px;
    }

    &__list {
        flex: 0 0 280px;
        width: 280px;
        overflow: hidden;
        background-color: var(--kn-editor-panel-background);

        // q-scroll-area lets its content grow wider than the column; keep it at the column width, so long names get an ellipsis
        :deep(.q-scrollarea__content) {
            width: 100%;
        }
    }

    // The scroll area would cut the card shadows: pad its content and pull the area out by the same amount, so the cards keep the column edges
    &__content {
        min-width: 0;
        margin: -3px;

        :deep(.q-scrollarea__content) {
            width: 100%;
            padding: 3px;
        }
    }
}
</style>

<style lang="scss">
// Card header shared by the designer cards: compact, as the Informations tab cards
.dossier-designer-card {
    border-radius: 4px;
    background-color: #fff;

    &__header {
        min-height: 40px;
        padding-top: 4px;
        padding-bottom: 4px;
    }

    &__badge {
        font-size: 10px;
        line-height: 12px;
        padding: 1px 6px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    // Icon and label of the compact header buttons on one center line
    &__action .q-btn__content {
        align-items: center;
        line-height: 1;
    }
}
</style>
