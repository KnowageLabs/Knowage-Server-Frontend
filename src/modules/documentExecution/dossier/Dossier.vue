<template>
    <div class="dossier-page kn-background">
        <div class="dossier-page__column">
            <q-card flat bordered class="dossier-card" data-test="dossier-template-card">
                <q-card-section class="dossier-card__header row items-center no-wrap">
                    <template v-if="templateName">
                        <span class="dossier-card__template ellipsis" data-test="template-name">
                            {{ templateName }}
                            <q-tooltip :delay="500">{{ templateName }}</q-tooltip>
                        </span>
                        <q-badge outline color="grey-7" class="dossier-card__badge">{{ $t(templateType === 'DOC_TEMPLATE' ? 'documentExecution.dossier.typeDoc' : 'documentExecution.dossier.typePpt') }}</q-badge>
                    </template>
                    <q-space />
                    <q-btn v-if="templateOptionEnabled('downloadable')" flat dense no-caps size="sm" color="accent" icon="download" :label="$t('documentExecution.dossier.downloadTemplate')" class="dossier-card__action" data-test="download-template" @click="downloadTemplate" />
                    <q-btn v-if="templateOptionEnabled('uploadable')" flat dense no-caps size="sm" color="accent" icon="upload" :label="$t('documentExecution.dossier.uploadTemplate')" class="dossier-card__action" data-test="upload-template" @click="pickTemplateFile" />
                    <input ref="templateInput" type="file" accept=".docx, .pptx" class="hidden" @change="onTemplateFileChange" />
                </q-card-section>
                <q-separator />
                <q-card-section class="row items-start no-wrap q-gutter-x-sm">
                    <q-input
                        v-model="activityName"
                        :label="$t('documentExecution.dossier.headers.activity') + ' *'"
                        outlined
                        dense
                        stack-label
                        maxlength="100"
                        class="col"
                        :error="activityNameTouched && !activityNameValid"
                        :error-message="$t('common.validation.regex')"
                        hide-bottom-space
                        data-test="activityName-input"
                        @blur="activityNameTouched = true"
                        @keyup.enter="launchActivity"
                    />
                    <span>
                        <q-btn unelevated no-caps color="primary" icon="play_arrow" :label="$t('documentExecution.dossier.launch')" :disable="launchDisabled" class="dossier-card__launch" data-test="input-button" @click="launchActivity" />
                        <q-tooltip v-if="runningRecently" :delay="300">{{ $t('documentExecution.dossier.launchBlocked') }}</q-tooltip>
                    </span>
                </q-card-section>
            </q-card>

            <q-card flat bordered class="dossier-card dossier-card--activities column no-wrap" data-test="dossier-activities-card">
                <q-card-section class="dossier-card__header row items-center no-wrap">
                    <div class="kn-editor-card-label">{{ $t('documentExecution.dossier.activities') }}</div>
                    <q-badge v-if="activities.length" rounded color="grey-4" text-color="black" data-test="activities-count">{{ activities.length }}</q-badge>
                    <q-space />
                    <span v-if="lastUpdate" class="dossier-card__updated" data-test="last-update">{{ $t('documentExecution.dossier.updatedAgo', { time: lastUpdateText }) }}</span>
                    <q-btn flat round dense size="sm" icon="refresh" class="kn-editor-action" data-test="refresh-button" @click="getActivities">
                        <q-tooltip :delay="500">{{ $t('common.refresh') }}</q-tooltip>
                    </q-btn>
                    <q-input v-if="activities.length" v-model="search" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" class="kn-field-compact dossier-card__search" data-test="activities-search">
                        <template #prepend>
                            <q-icon name="search" size="16px" />
                        </template>
                    </q-input>
                </q-card-section>
                <q-separator />
                <KnHint v-if="activities.length === 0" class="col" title="documentExecution.dossier.activities" hint="documentExecution.dossier.hint" data-test="activities-hint" />
                <q-table
                    v-else
                    v-model:pagination="pagination"
                    class="col dossier-table"
                    flat
                    dense
                    virtual-scroll
                    :virtual-scroll-sticky-size-start="32"
                    :rows="activities"
                    :columns="columns"
                    row-key="id"
                    :filter="search"
                    :filter-method="filterActivities"
                    hide-pagination
                    data-test="activities-table"
                >
                    <template #body-cell-activity="props">
                        <q-td :props="props" class="dossier-table__name">
                            <div class="ellipsis">{{ props.value }}</div>
                            <q-tooltip :delay="500">{{ props.value }}</q-tooltip>
                        </q-td>
                    </template>
                    <template #body-cell-status="props">
                        <q-td :props="props">
                            <q-chip dense square size="sm" :class="`dossier-status dossier-status--${statusKey(props.row.status)}`" data-test="activity-status">
                                <q-spinner v-if="props.row.status === 'STARTED'" size="14px" :thickness="4" class="q-mr-xs" />
                                {{ $t(`documentExecution.dossier.status.${statusKey(props.row.status)}`) }}
                            </q-chip>
                        </q-td>
                    </template>
                    <template #body-cell-progress="props">
                        <q-td :props="props">
                            <div v-if="props.row.total > 0" class="row items-center no-wrap">
                                <q-linear-progress :value="progressValue(props.row)" rounded size="6px" :color="props.row.status === 'ERROR' ? 'negative' : 'primary'" class="col" />
                                <span class="dossier-table__count q-ml-sm">{{ props.row.partial }} / {{ props.row.total }}</span>
                            </div>
                            <span v-else>-</span>
                        </q-td>
                    </template>
                    <template #body-cell-creationDate="props">
                        <q-td :props="props">
                            {{ relativeTime(props.row.creationDate) }}
                            <q-tooltip :delay="500">{{ formatDate(props.row.creationDate) }}</q-tooltip>
                        </q-td>
                    </template>
                    <template #body-cell-actions="props">
                        <q-td :props="props" class="text-right">
                            <span>
                                <q-btn flat round dense size="sm" :icon="props.row.status === 'ERROR' ? 'sym_o_bug_report' : 'download'" :disable="!canDownload(props.row)" class="kn-editor-action" data-test="download" @click="downloadActivity(props.row)" />
                                <q-tooltip :delay="500">{{ downloadTooltip(props.row) }}</q-tooltip>
                            </span>
                            <span>
                                <q-btn flat round dense size="sm" icon="delete" :disable="deleteBlocked(props.row)" class="kn-editor-action" data-test="delete-button" @click="deleteActivityConfirm(props.row)" />
                                <q-tooltip :delay="500">{{ $t(deleteBlocked(props.row) ? 'documentExecution.dossier.deleteBlocked' : 'common.delete') }}</q-tooltip>
                            </span>
                        </q-td>
                    </template>
                </q-table>
            </q-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import moment from 'moment'
import axios from '@/axios.js'
import mainStore from '@/App.store'
import KnHint from '@/components/UI/KnHint.vue'
import { extendedAlphanumeric } from '@/helpers/commons/regexHelper'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import { iParameter } from '@/components/UI/KnParameterSidebar/KnParameterSidebar'

const props = defineProps<{ id?: string | number; reloadTrigger?: boolean; filterData?: any; userRole?: string }>()

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()

const knowageContext = import.meta.env.VITE_KNOWAGE_CONTEXT
const dossierContext = import.meta.env.VITE_KNOWAGEDOSSIER_CONTEXT
const POLL_INTERVAL = 10000
const LAUNCH_BLOCK_SECONDS = 600
const DELETE_BLOCK_MS = 86400000

const activities = ref<any[]>([])
const jsonTemplate = ref<any>({})
const activityName = ref('')
const activityNameTouched = ref(false)
const launchClicked = ref(false)
const search = ref('')
const pagination = ref({ sortBy: 'creationDate', descending: true, rowsPerPage: 0 })
const lastUpdate = ref<number | null>(null)
const now = ref(Date.now())
const templateInput = ref<HTMLInputElement | null>(null)

let pollInterval: ReturnType<typeof setInterval> | null = null
let clockInterval: ReturnType<typeof setInterval> | null = null

const columns = computed(() => [
    { name: 'activity', field: 'activity', label: t('documentExecution.dossier.headers.activity'), align: 'left', sortable: true, style: 'max-width: 280px' },
    { name: 'status', field: 'status', label: t('documentExecution.dossier.headers.status'), align: 'left', sortable: true },
    { name: 'progress', field: (row: any) => progressValue(row), label: t('documentExecution.dossier.headers.progress'), align: 'left', sortable: true, style: 'width: 22%' },
    { name: 'creationDate', field: 'creationDate', label: t('common.creationDate'), align: 'left', sortable: true },
    { name: 'executionRole', field: 'executionRole', label: t('documentExecution.dossier.headers.role'), align: 'left', sortable: true },
    { name: 'actions', field: 'actions', label: '', align: 'right' }
])

const templateEntry = computed(() => jsonTemplate.value?.PPT_TEMPLATE_V2 ?? jsonTemplate.value?.DOC_TEMPLATE ?? jsonTemplate.value?.PPT_TEMPLATE ?? null)
const templateName = computed(() => templateEntry.value?.name ?? '')
const templateType = computed(() => (jsonTemplate.value?.DOC_TEMPLATE ? 'DOC_TEMPLATE' : 'PPT_TEMPLATE_V2'))

const activityNameValid = computed(() => !!activityName.value?.trim() && extendedAlphanumeric.test(activityName.value))
const isRunning = (activity: any) => activity.status === 'PREPARED' || activity.status === 'STARTED'
const anyRunning = computed(() => activities.value.some(isRunning))
// A new activity waits 10 minutes after the last start, as before
const runningRecently = computed(() => activities.value.some((activity) => activity.status === 'STARTED' && (now.value - activity.creationDate) / 1000 <= LAUNCH_BLOCK_SECONDS))
const launchDisabled = computed(() => !activityNameValid.value || launchClicked.value || runningRecently.value)
const lastUpdateText = computed(() => (lastUpdate.value ? moment(lastUpdate.value).from(now.value) : ''))

watch(
    () => props.reloadTrigger,
    () => {
        getTemplate()
        getActivities()
    }
)

onMounted(() => {
    getTemplate()
    getActivities()
    startClock()
})

onActivated(() => {
    if (clockInterval) return
    getActivities()
    startClock()
})

onDeactivated(stopTimers)
onBeforeUnmount(stopTimers)

// The poll runs only while an activity is waiting or running; a load, an Execute, a launch and the refresh button read the list once
function updatePolling() {
    if (anyRunning.value && !pollInterval) pollInterval = setInterval(getActivities, POLL_INTERVAL)
    else if (!anyRunning.value && pollInterval) stopPolling()
}

function stopPolling() {
    if (pollInterval) clearInterval(pollInterval)
    pollInterval = null
}

function startClock() {
    if (!clockInterval) clockInterval = setInterval(() => (now.value = Date.now()), 1000)
}

function stopTimers() {
    stopPolling()
    if (clockInterval) clearInterval(clockInterval)
    clockInterval = null
}

async function getActivities() {
    if (!props.id) return
    await axios.get(`${knowageContext}/restful-services/dossier/activities/${props.id}`).then((response: any) => {
        activities.value = [...(response.data ?? [])]
        lastUpdate.value = Date.now()
        now.value = lastUpdate.value
    })
    updatePolling()
}

async function getTemplate() {
    jsonTemplate.value = {}
    const filters = props.filterData ? props.filterData : {}
    filters.filterStatus?.forEach((filter: iParameter) => {
        const fields = ['dataDependsOnParameters', 'dataDependentParameters', 'lovDependsOnParameters', 'lovDependentParameters', 'dependsOnParameters', 'dependentParameters']
        fields.forEach((field: string) => delete filter[field])
    })
    await axios
        .post(`${dossierContext}/api/start/dossierTemplate?documentId=${props.id}`, { data: encodeURIComponent(JSON.stringify(filters)) })
        .then((response: any) => (jsonTemplate.value = { ...response.data }))
        .catch((error: any) => {
            if (error) store.setError({ title: t('common.error.generic'), msg: error.message })
        })
}

async function launchActivity() {
    activityNameTouched.value = true
    if (launchDisabled.value) return
    launchClicked.value = true
    setTimeout(() => (launchClicked.value = false), 3000)

    if (jsonTemplate.value) jsonTemplate.value.executionRole = props.userRole
    const url = `${dossierContext}/api/dossier/run?activityName=${encodeURIComponent(activityName.value)}&documentId=${props.id}`
    await axios
        .post(url, jsonTemplate.value, { headers: { 'X-Disable-Errors': 'true' } })
        .then((response: any) => {
            if (response.data?.errors) {
                store.setError({ title: t('common.error.saving'), msg: response.data.errors })
                return
            }
            store.setInfo({ title: t('common.save'), msg: t('documentExecution.dossier.saveSuccess') })
            activityName.value = ''
            activityNameTouched.value = false
        })
        .catch((error: any) => store.setError({ title: t('common.error.saving'), msg: error?.message ?? t('common.error.generic') }))
    await getActivities()
}

function statusKey(status: string): string {
    switch (status) {
        case 'PREPARED':
            return 'prepared'
        case 'STARTED':
            return 'started'
        case 'DOWNLOAD':
            return 'download'
        case 'ERROR':
            return 'error'
        default:
            return 'prepared'
    }
}

function progressValue(activity: any): number {
    if (activity.status === 'DOWNLOAD') return 1
    return activity.total > 0 ? Math.min(activity.partial / activity.total, 1) : 0
}

function relativeTime(date: number): string {
    return date ? moment(date).from(now.value) : '-'
}

function formatDate(date: number): string {
    return formatDateWithLocale(date, { dateStyle: 'short', timeStyle: 'short' })
}

function filterActivities(rows: readonly any[], terms: string) {
    const text = (terms ?? '').trim().toLowerCase()
    return text ? rows.filter((row) => row.activity?.toLowerCase().includes(text)) : rows
}

function canDownload(activity: any): boolean {
    // Same rule as before the redesign: an error log, or a finished generation
    return activity.status === 'ERROR' || (activity.status !== 'PREPARED' && activity.total > 0 && activity.partial == activity.total) || activity.status === 'DOWNLOAD'
}

function downloadTooltip(activity: any): string {
    if (activity.status === 'ERROR') return t('documentExecution.dossier.downloadErrorLog')
    return canDownload(activity) ? t('common.download') : t('documentExecution.dossier.progressNotFinished')
}

// A running activity can be deleted 24 hours after its start
function deleteBlocked(activity: any): boolean {
    return Date.now() - activity.creationDate < DELETE_BLOCK_MS && activity.status === 'STARTED'
}

function deleteActivityConfirm(activity: any) {
    $q.dialog({ title: t('documentExecution.dossier.deleteTitle'), message: t('documentExecution.dossier.deleteConfirm'), cancel: true, persistent: true }).onOk(() => deleteActivity(activity))
}

async function deleteActivity(activity: any) {
    await axios
        .delete(`${knowageContext}/restful-services/dossier/activity/${activity.id}`)
        .then(() => {
            store.setInfo({ title: t('common.toast.deleteTitle'), msg: t('documentExecution.dossier.deleteSuccess') })
            getActivities()
        })
        .catch((error: any) => {
            if (error) store.setError({ title: t('common.error.generic'), msg: error.message })
        })
}

async function downloadActivity(activity: any) {
    if (activity.status == 'ERROR') {
        if (activity.hasBinContent) {
            downloadFile(dossierContext + `/restful-services/dossier/activity/${activity.id}/txt?activityName=${activity.activity}`)
            return
        }
        await axios.get(`${knowageContext}/restful-services/dossier/random-key/${activity.progressId}`).then((response: any) => {
            let url = `/api/start/errorFile?activityId=${activity.id}&randomKey=${response.data}&activityName=${activity.activity}`
            if (jsonTemplate.value.PPT_TEMPLATE != null) url += '&type=PPT&templateName=' + jsonTemplate.value.PPT_TEMPLATE.name
            else if (jsonTemplate.value.DOC_TEMPLATE != null) url += '&type=DOC&templateName=' + jsonTemplate.value.DOC_TEMPLATE.name
            else url += '&type=PPTV2&templateName=' + jsonTemplate.value.PPT_TEMPLATE_V2.name
            downloadFile(knowageContext + url)
            if (response.data.errors) store.setError({ title: t('common.error.generic'), msg: response.data.errors[0].message })
        })
    } else if (activity.partial == activity.total) {
        if (activity.hasBinContent) downloadFile(knowageContext + `/restful-services/dossier/activity/${activity.id}/pptx?activityName=${activity.activity}`)
        else if (activity.hasDocBinContent) downloadFile(knowageContext + `/restful-services/dossier/activity/${activity.id}/doc?activityName=${activity.activity}`)
        else if (activity.hasPptV2BinContent) downloadFile(knowageContext + `/restful-services/dossier/activity/${activity.id}/pptv2?activityName=${activity.activity}`)
        else {
            await axios.get(`${knowageContext}/restful-services/dossier/random-key/${activity.progressId}`).then((response: any) => {
                if (jsonTemplate.value.PPT_TEMPLATE != null) storeDossier(activity, response.data, 'generatePPT', jsonTemplate.value.PPT_TEMPLATE.name)
                else if (jsonTemplate.value.DOC_TEMPLATE != null) storeDossier(activity, response.data, 'generateDOC', jsonTemplate.value.DOC_TEMPLATE.name)
                else storeDossier(activity, response.data, 'generatePPTV2', jsonTemplate.value.PPT_TEMPLATE_V2.name)
                if (response.data.errors) store.setError({ title: t('common.error.generic'), msg: response.data.errors[0].message })
            })
        }
    } else {
        store.setError({ title: t('common.error.generic'), msg: t('documentExecution.dossier.progressNotFinished') })
    }
}

function storeDossier(activity: any, randomKey: string, generateType: string, templateName: string) {
    window.open(import.meta.env.VITE_HOST_URL + `${dossierContext}/api/start/${generateType}?activityId=${activity.id}&randomKey=${randomKey}&templateName=${templateName}&activityName=${activity.activity}`)
}

function templateOptionEnabled(optionName: string): boolean {
    const optionValue = templateEntry.value?.[optionName]
    if (typeof optionValue === 'boolean') return optionValue
    return String(optionValue).toLowerCase() === 'true'
}

async function downloadTemplate() {
    if (jsonTemplate.value.PPT_TEMPLATE != null) {
        downloadFile(knowageContext + `/restful-services/resourcePath?templateName=${jsonTemplate.value.PPT_TEMPLATE.name}&documentId=${props.id}`)
        return
    }
    const fileName = templateName.value
    await axios
        .get(`${knowageContext}/restful-services/dossier/checkPathFile?templateName=${fileName}&documentId=${props.id}`)
        .then((response: any) => {
            if (response.data.STATUS == 'KO') store.setError({ title: t('common.error.generic'), msg: t('documentExecution.dossier.templateDownloadError') })
            else if (response.data.STATUS == 'OK') downloadFile(knowageContext + `/restful-services/dossier/resourcePath?templateName=${fileName}&documentId=${props.id}`)
        })
        .catch((error: any) => {
            if (error) store.setError({ title: t('common.error.generic'), msg: error.message })
        })
}

async function downloadFile(url: string) {
    await axios
        .get(url, { responseType: 'arraybuffer' })
        .then((response: any) => downloadDirectFromResponse(response))
        .catch((error: any) => {
            if (error) store.setError({ title: t('common.error.generic'), msg: error.message })
        })
}

function pickTemplateFile() {
    if (!templateInput.value) return
    templateInput.value.value = ''
    templateInput.value.click()
}

async function onTemplateFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentId', '' + props.id)
    await axios
        .post(`${knowageContext}/restful-services/dossier/importTemplateFile`, formData, { headers: { 'X-Disable-Errors': 'true' } })
        .then((response: any) => {
            if (response.data?.STATUS === 'KO') store.setError({ title: t('common.toast.errorTitle'), msg: t('documentExecution.dossier.templateUploadError') })
            else store.setInfo({ title: t('common.toast.success'), msg: t('common.toast.uploadSuccess') })
        })
        .catch(() => store.setError({ title: t('common.toast.errorTitle'), msg: t('documentExecution.dossier.templateUploadError') }))
}
</script>

<style lang="scss" scoped>
.dossier-page {
    height: 100%;
    overflow: auto;

    &__column {
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
        min-height: 420px;
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px;
        box-sizing: border-box;
    }
}

.dossier-card {
    border-radius: 4px;
    background-color: #fff;

    // One gap for every item of the header row
    &__header {
        min-height: 44px;
        padding-top: 4px;
        padding-bottom: 4px;
        gap: 8px;
    }

    // Icon and label of the compact header buttons on one center line
    &__action :deep(.q-btn__content) {
        align-items: center;
        line-height: 1;
    }

    // Same line height as the card label, so the label, the name and the badge share one center line
    &__template {
        min-width: 0;
        max-width: 50%;
        font-size: 13px;
        font-weight: 500;
        line-height: 16px;
    }

    &__badge {
        font-size: 10px;
        line-height: 12px;
        padding: 1px 6px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    &__launch {
        height: 40px;
    }

    &__updated {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.54);
        white-space: nowrap;
    }

    &__search {
        width: 220px;
    }

    &--activities {
        flex: 1;
        min-height: 0;
    }
}

.dossier-table {
    min-height: 0;

    :deep(thead tr th) {
        position: sticky;
        top: 0;
        z-index: 1;
        background-color: #fff;
    }

    :deep(thead tr:first-child th) {
        top: 0;
    }

    &__name {
        max-width: 280px;
    }

    &__count {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
        min-width: 48px;
        text-align: right;
    }
}

.dossier-status {
    font-weight: 500;

    &--prepared {
        background-color: rgba(0, 0, 0, 0.08);
        color: rgba(0, 0, 0, 0.7);
    }

    &--started {
        background-color: var(--kn-message-info-background-color);
        color: var(--kn-message-info-color);
    }

    &--download {
        background-color: var(--kn-message-success-background-color);
        color: var(--kn-message-success-color);
    }

    &--error {
        background-color: var(--kn-message-error-background-color);
        color: var(--kn-message-error-color);
    }
}
</style>
