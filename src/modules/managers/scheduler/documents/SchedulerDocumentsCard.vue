<template>
    <q-card data-tour-id="scheduler-documents">
        <q-card-section class="scheduler-card__header row items-center no-wrap">
            <div class="kn-editor-card-label col">{{ $t('common.documents') }}</div>
            <q-btn flat dense no-caps size="sm" color="accent" :icon="addPanelOpen ? 'close' : 'add'" :label="addPanelOpen ? $t('common.close') : $t('managers.scheduler.addDocuments')" class="q-ma-none q-py-none q-px-xs" data-test="add-documents-button" @click="toggleAddPanel" />
        </q-card-section>
        <q-separator />

        <div v-if="addPanelOpen" class="scheduler-documents__add">
            <q-input v-model="treeFilter" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" class="q-mb-sm">
                <template #append><q-icon name="search" /></template>
            </q-input>
            <q-scroll-area class="scheduler-documents__tree">
                <q-tree :nodes="nodes" node-key="key" :filter="treeFilter ?? ''" default-expand-all dense no-selection-unset no-transition no-nodes-label="" :no-results-label="$t('common.info.noDataFound')">
                    <template #default-header="{ node }">
                        <div class="row items-center no-wrap full-width scheduler-documents__node">
                            <q-icon :name="node.isDocument ? 'description' : 'folder'" class="scheduler-documents__node-icon q-mr-sm" />
                            <span class="col ellipsis">{{ node.label }}</span>
                            <template v-if="node.isDocument">
                                <q-icon v-if="isAdded(node.data)" name="check" color="positive" size="18px" class="q-mr-sm"><q-tooltip :delay="500">{{ $t('managers.scheduler.added') }}</q-tooltip></q-icon>
                                <q-btn v-else flat dense no-caps size="sm" color="accent" icon="add" :label="$t('common.add')" class="q-py-none q-px-xs" @click.stop="addDocument(node.data)" />
                            </template>
                        </div>
                    </template>
                </q-tree>
            </q-scroll-area>
        </div>

        <q-card-section class="q-py-sm">
            <q-banner v-if="deletedDocuments.length > 0" dense rounded class="bg-warning q-mb-sm">
                <template #avatar><q-icon name="warning" /></template>
                {{ $t('managers.scheduler.deletedDocumentsWarning') }}
            </q-banner>
            <div v-if="documents.length === 0" class="text-grey-7 q-py-sm">{{ $t('managers.scheduler.noDocumentsInfo') }}</div>
            <div v-for="(document, index) in documents" :key="index" class="scheduler-documents__row row items-center no-wrap" data-test="document-row">
                <q-icon :name="document.deleted ? 'error' : 'description'" :class="document.deleted ? 'text-negative' : 'scheduler-documents__node-icon'" size="20px" class="q-mr-sm" />
                <div class="col scheduler-documents__name">
                    <div class="ellipsis">
                        <span class="text-weight-medium">{{ document.name }}</span>
                        <span v-if="folderPaths[document.name]" class="text-grey-7 text-caption q-ml-sm">{{ folderPaths[document.name] }}</span>
                    </div>
                    <div v-if="document.condensedParameters?.trim()" class="text-grey-7 text-caption ellipsis">{{ document.condensedParameters }}</div>
                </div>
                <q-icon v-if="document.parameters?.length > 0 && !parameterValuesSet(document.parameters)" name="warning" color="warning" size="20px" class="q-mr-sm" :data-test="'warning-icon-' + document.name">
                    <q-tooltip :delay="500">{{ $t('managers.scheduler.parametersWarningTooltip') }}</q-tooltip>
                </q-icon>
                <q-btn v-if="document.parameters?.length > 0" flat dense no-caps size="sm" icon="tune" :label="$t('managers.scheduler.parametersCount', { n: document.parameters.length })" class="kn-editor-action q-mr-xs" @click="openDocumentParameterDialog(document, index)" />
                <q-btn flat round dense size="sm" icon="delete" class="kn-editor-action" @click="removeDocumentConfirm(index)">
                    <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                </q-btn>
            </div>
        </q-card-section>

        <SchedulerDocumentParameterDialog :visible="documentParameterDialogVisible" :prop-parameters="selectedDocument?.parameters" :roles="roles" :deleted-params="deletedParams" :document-label="documentLabel" @close="closeDocumentParameterDialog" @set-parameters="onParametersSet" />
    </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import axios, { AxiosResponse } from 'axios'
import { iFile } from '../Scheduler'
import { condensedParameters } from '../schedulerHelpers'
import SchedulerDocumentParameterDialog from './SchedulerDocumentParameterDialog.vue'

interface iTreeNode {
    key: string
    id: number
    label: string
    data: any
    isDocument?: boolean
    children?: iTreeNode[]
}

const props = defineProps<{ documents: any[] }>()
const emit = defineEmits<{ (e: 'loading', value: boolean): void }>()

const { t } = useI18n()
const $q = useQuasar()

const files = ref<iFile[]>([])
const addPanelOpen = ref(false)
const treeFilter = ref<string | null>('')
const selectedDocument = ref<any>(null)
const selectedIndex = ref(-1)
const documentParameterDialogVisible = ref(false)
const roles = ref<any[]>([])
const deletedParams = ref<any[]>([])
const documentLabel = ref('')

const deletedDocuments = computed(() => props.documents.filter((document: any) => document.deleted))

const folderPaths = computed(() => {
    const paths = {} as Record<string, string>
    files.value.forEach((file: any) => file.biObjects?.forEach((document: any) => (paths[document.label] = file.path)))
    return paths
})

const nodes = computed(() => createNodeTree(files.value))

onMounted(loadFiles)

async function loadFiles() {
    if (files.value.length > 0) return
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/folders/?includeDocs=true`).then((response: AxiosResponse<any>) => (files.value = response.data))
}

// Folders first, then the visible documents; empty folders are hidden, as in the old selection dialog
function createNodeTree(folders: iFile[]): iTreeNode[] {
    const sorted = [...folders].sort((a: iFile, b: iFile) => a.id - b.id)
    const folderNodes = new Map<number, iTreeNode>()
    sorted.forEach((folder: iFile) => folderNodes.set(folder.id, { key: 'f' + folder.id, id: folder.id, label: folder.name, data: folder, children: [] }))

    const roots = [] as iTreeNode[]
    sorted.forEach((folder: iFile) => {
        const node = folderNodes.get(folder.id) as iTreeNode
        const parent = folder.parentId ? folderNodes.get(folder.parentId) : null
        if (parent) parent.children?.push(node)
        else roots.push(node)
    })
    sorted.forEach((folder: iFile) => {
        const node = folderNodes.get(folder.id) as iTreeNode
        folder.biObjects?.filter((document: any) => document.visible).forEach((document: any) => node.children?.push({ key: 'd' + folder.id + '-' + document.id, id: document.id, label: document.name, data: document, isDocument: true }))
    })

    const prune = (list: iTreeNode[]): iTreeNode[] =>
        list.filter((node: iTreeNode) => {
            if (node.isDocument) return true
            node.children = prune(node.children ?? [])
            return node.children.length > 0
        })
    return prune(roots)
}

async function toggleAddPanel() {
    addPanelOpen.value = !addPanelOpen.value
    if (addPanelOpen.value && files.value.length === 0) {
        emit('loading', true)
        await loadFiles().finally(() => emit('loading', false))
    }
}

function isAdded(document: any) {
    return props.documents.some((jobDocument: any) => jobDocument.name === document.label)
}

// A document can be added only once; its parameters start empty
function addDocument(document: any) {
    if (isAdded(document)) return
    loadDocumentData({ ...document, parameters: undefined }, true)
}

function parameterValuesSet(parameters: any[]) {
    return parameters.every((parameter: any) => !!parameter.value)
}

function removeDocumentConfirm(documentIndex: number) {
    $q.dialog({ title: t('common.toast.deleteTitle'), message: t('common.toast.deleteMessage'), cancel: true, persistent: true }).onOk(() => props.documents.splice(documentIndex, 1))
}

async function loadDocumentData(document: any, pushToTable: boolean) {
    emit('loading', true)
    try {
        if (document?.parametersTouched) return
        const label = document.label ?? document.name
        const tempDocument = await loadDocumentInfo(label)

        roles.value = await loadSelectedDocumentRoles(tempDocument)

        const tempParams = await loadSelectedDocumentParameters(label)
        updateDocumentParameters(document, tempParams)

        selectedDocument.value = { name: label, nameTitle: tempDocument.label, description: updateCondensedParameters(document.parameters ?? tempParams), parameters: document.parameters }
        selectedDocument.value.parameters?.forEach((el: any) => (el.role = roles.value[0]?.role))
        if (pushToTable) props.documents.push(selectedDocument.value)
    } finally {
        emit('loading', false)
    }
}

function updateDocumentParameters(document: any, apiParameters: any[]) {
    if (!document.parameters) {
        deletedParams.value = []
        document.parameters = apiParameters
    } else {
        deletedParams.value = document.parameters.filter((parameter: any) => !apiParameters.some((apiParameter: any) => apiParameter.name === parameter.name))
        for (let i = 0; i < apiParameters.length; i++) {
            const index = document.parameters.findIndex((el: any) => el.name === apiParameters[i].name)
            if (index !== -1) {
                document.parameters[index].id = apiParameters[i].id
                document.parameters[index].temporal = apiParameters[i].temporal
            }
        }
    }
}

async function loadDocumentInfo(documentLabel: string) {
    let tempDocument = null as any
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${documentLabel}`).then((response: AxiosResponse<any>) => (tempDocument = response.data))
    return tempDocument
}

async function loadSelectedDocumentRoles(tempDocument: any) {
    let tempRoles = [] as string[]
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents/${tempDocument.id}/userroles`).then((response: AxiosResponse<any>) => (tempRoles = response.data))
    return tempRoles.map((el: string) => {
        const userAndRole = el.split('|')
        return { userAndRole: el, user: userAndRole[0], role: userAndRole[1] }
    })
}

async function loadSelectedDocumentParameters(label: string) {
    let tempParameters = [] as any[]
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents/${label}/parameters`).then((response: AxiosResponse<any>) => (tempParameters = response.data))
    return tempParameters.map((el: any) => ({ id: el.parID, name: el.parameterUrlName, value: '', type: 'fixed', iterative: false, temporal: el.parameter.temporal, multivalue: el.multivalue, documentLabel: label }))
}

function updateCondensedParameters(parameters: any[]) {
    return condensedParameters(parameters)
}

async function openDocumentParameterDialog(document: any, index: number) {
    selectedDocument.value = document
    selectedIndex.value = index
    await loadDocumentData(document, false)
    documentLabel.value = selectedDocument.value.name
    documentParameterDialogVisible.value = true
}

function closeDocumentParameterDialog() {
    emit('loading', false)
    selectedDocument.value = null
    documentParameterDialogVisible.value = false
}

// The old table replaced the first row with the same name; with the same document twice it changed the wrong row
function onParametersSet(parameters: any[]) {
    selectedDocument.value.parameters = parameters
    selectedDocument.value.condensedParameters = updateCondensedParameters(parameters)
    selectedDocument.value.parametersTouched = true
    if (selectedIndex.value !== -1) props.documents[selectedIndex.value] = selectedDocument.value
    documentParameterDialogVisible.value = false
}
</script>

<style scoped lang="scss">
.scheduler-documents__add {
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.scheduler-documents__tree {
    height: 280px;
    background: #ffffff;
    border: 1px solid var(--kn-color-borders);
    border-radius: 4px;
}

.scheduler-documents__tree :deep(.q-scrollarea__content) {
    width: 100%;
    padding: 4px 8px;
}

.scheduler-documents__node {
    min-height: 28px;
}

.scheduler-documents__node-icon {
    color: var(--kn-editor-list-icon-color);
}

.scheduler-documents__row {
    min-height: 44px;
    padding: 4px 0;
    border-bottom: 1px solid #eeeeee;

    &:last-child {
        border-bottom: 0;
    }
}

.scheduler-documents__name {
    min-width: 0;
}
</style>
