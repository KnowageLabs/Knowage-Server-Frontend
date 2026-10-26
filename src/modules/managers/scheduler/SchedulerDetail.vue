<template>
    <q-layout view="lHh lpR lFf" container class="scheduler-detail" style="height: 100%">
        <q-drawer :model-value="!!triggerEditor" side="right" overlay behavior="desktop" :width="triggerDrawerWidth" :breakpoint="0" no-swipe-open no-swipe-close class="scheduler-detail__trigger-drawer">
            <SchedulerTriggerDrawer v-if="triggerEditor && job" ref="triggerDrawer" :key="triggerEditor.key" :job="job" :list-trigger="triggerEditor.trigger" :datasets="datasets" @close="triggerEditor = null" @saved="onTriggerSaved" @stale="onTriggerSaved" />
        </q-drawer>

        <q-page-container>
            <q-page class="column no-wrap" :style-fn="pageStyle">
                <q-resize-observer @resize="(size) => (pageWidth = size.width)" />
                <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                    <q-btn flat round dense :icon="drawerVisible ? 'menu_open' : 'menu'" @click="emit('toggleDrawer')" />
                    <q-toolbar-title>{{ job?.jobName || $t('managers.scheduler.newJob') }}</q-toolbar-title>
                    <span>
                        <q-btn flat round dense icon="save" :disable="!!saveError || loading" data-test="save-button" @click="saveJob" />
                        <q-tooltip :delay="500">{{ saveError || $t('common.save') }}</q-tooltip>
                    </span>
                    <q-btn flat round dense icon="cancel" data-test="close-button" @click="cancel">
                        <q-tooltip :delay="500">{{ $t('common.cancel') }}</q-tooltip>
                    </q-btn>
                </q-toolbar>
                <q-linear-progress v-if="loading" indeterminate color="primary" data-test="progress-bar" />

                <q-scroll-area class="col scheduler-detail__scroll kn-background">
                    <div v-if="job" class="scheduler-detail__column">
                        <q-card>
                            <q-card-section class="scheduler-card__header row items-center no-wrap">
                                <div class="kn-editor-card-label col">{{ $t('common.info.info') }}</div>
                            </q-card-section>
                            <q-separator />
                            <q-card-section>
                                <div class="row q-col-gutter-sm">
                                    <div class="col-12 col-sm-6">
                                        <q-input v-model.trim="job.jobName" outlined dense hide-bottom-space :readonly="job.edit" :maxlength="descriptor.limits.jobName" :label="$t('common.name') + ' *'" :error="jobNameDirty && !job.jobName" :error-message="$t('common.validation.required', { fieldName: $t('common.name') })" data-test="name-input" @update:model-value="jobNameDirty = true" />
                                    </div>
                                    <div class="col-12 col-sm-6">
                                        <q-select v-model="job.role" outlined dense hide-bottom-space :options="roleOptions" :label="$t('common.role') + ' *'" :error="!job.role" :error-message="$t('common.validation.required', { fieldName: $t('common.role') })" data-test="role-input" />
                                    </div>
                                    <div class="col-12">
                                        <q-input v-model="job.jobDescription" outlined dense hide-bottom-space autogrow type="textarea" :maxlength="descriptor.limits.jobDescription" :label="$t('common.description')" data-test="description-input" />
                                    </div>
                                </div>
                            </q-card-section>
                        </q-card>

                        <SchedulerDocumentsCard :key="loadCount" :documents="job.documents" @loading="(value: boolean) => (loading = value)" />

                        <SchedulerTriggersCard v-if="job.edit" :job="job" :dirty="dirty" :datasets="datasets" @add="openTriggerEditor(null)" @edit="openTriggerEditor" @loading="(value: boolean) => (loading = value)" />
                    </div>
                </q-scroll-area>

                <div v-if="triggerEditor" class="scheduler-detail__backdrop" @click="requestCloseTriggerEditor" />
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import axios, { AxiosResponse } from 'axios'
import deepcopy from 'deepcopy'
import { iPackage, iTrigger } from './Scheduler'
import { condensedParameters } from './schedulerHelpers'
import descriptor from './SchedulerDescriptor.json'
import SchedulerDocumentsCard from './documents/SchedulerDocumentsCard.vue'
import SchedulerTriggersCard from './triggers/SchedulerTriggersCard.vue'
import SchedulerTriggerDrawer from './triggers/SchedulerTriggerDrawer.vue'
import mainStore from '../../../App.store'

const TRIGGER_DRAWER_WIDTH = 760

const props = defineProps<{ id?: string; clone?: string; selectedJob?: iPackage | null; datasets?: any[]; drawerVisible?: boolean }>()
const emit = defineEmits<{
    (e: 'documentSaved', jobName: string): void
    (e: 'close'): void
    (e: 'triggerSaved'): void
    (e: 'dirtyChange', dirty: boolean): void
    (e: 'toggleDrawer'): void
}>()

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()

const job = ref<iPackage | null>(null)
const savedJob = ref<iPackage | null>(null)
const snapshot = ref('')
const jobNameDirty = ref(false)
const loading = ref(false)
const operation = ref('create')
const pageWidth = ref(TRIGGER_DRAWER_WIDTH)
const triggerEditor = ref<{ key: number; trigger: iTrigger | null } | null>(null)
const triggerDrawer = ref<any>(null)
const loadCount = ref(0)
let preventJobReload = false

// No placeholder in the options: the old code put it into the user role list (B1)
const roleOptions = computed(() => [...(store.user?.roles ?? [])])

const saveError = computed(() => {
    if (!job.value) return ''
    if (!job.value.jobName) return t('common.validation.required', { fieldName: t('common.name') })
    if (!job.value.role) return t('common.validation.required', { fieldName: t('common.role') })
    if (!job.value.documents?.length) return t('common.validation.required', { fieldName: t('common.documents') })
    return ''
})

// The parameter dialog writes ids, roles and LOV descriptions when it opens: only the values the user sets count
function getJobSnapshot(tempJob: iPackage | null) {
    if (!tempJob) return ''
    return JSON.stringify({
        jobName: tempJob.jobName,
        jobDescription: tempJob.jobDescription,
        role: tempJob.role,
        documents: (tempJob.documents ?? []).map((document: any) => ({
            name: document.name,
            parameters: (document.parameters ?? []).map((parameter: any) => ({ name: parameter.name, value: parameter.value, type: parameter.type, iterative: parameter.iterative }))
        }))
    })
}

const dirty = computed(() => !!job.value && getJobSnapshot(job.value) !== snapshot.value)
const triggerDrawerWidth = computed(() => Math.min(TRIGGER_DRAWER_WIDTH, pageWidth.value))

watch(dirty, (value) => emit('dirtyChange', value))

watch(
    () => props.selectedJob,
    () => {
        if (preventJobReload) {
            preventJobReload = false
            return
        }
        loadJob()
    }
)

onMounted(loadJob)

function pageStyle(offset: number, height: number) {
    return { height: height - offset + 'px' }
}

function loadJob() {
    triggerEditor.value = null
    jobNameDirty.value = false
    if (!props.selectedJob) {
        job.value = null
        snapshot.value = ''
        return
    }
    const tempJob = deepcopy(props.selectedJob) as iPackage
    tempJob.jobParameters = tempJob.jobParameters || []
    tempJob.role = tempJob.jobParameters.find((param: any) => param.name === 'userRoles')?.value
    enrichDocumentCondensedParameters(tempJob)
    tempJob.documents?.forEach((document: any) => {
        if (document.parameters?.length > 0) document.description = condensedParameters(document.parameters)
    })
    operation.value = tempJob.edit ? 'update' : 'create'
    job.value = tempJob
    loadCount.value++
    takeSnapshot()
}

function takeSnapshot() {
    savedJob.value = deepcopy(job.value)
    snapshot.value = getJobSnapshot(job.value)
}

function enrichDocumentCondensedParameters(tempJob: iPackage) {
    if (!tempJob.jobParameters || !tempJob.documents) return
    const documentLabelsParam = tempJob.jobParameters.find((p: any) => p.name === 'documentLabels')
    if (!documentLabelsParam?.value) return
    const docKeys = documentLabelsParam.value.split(',').map((s: string) => s.trim())
    docKeys.forEach((key: string) => {
        const docName = key.split('__')[0]
        const docIndex = tempJob.documents.findIndex((d: any) => d.name === docName)
        if (docIndex !== -1) {
            const descParam = tempJob.jobParameters.find((p: any) => p.name === key + '_description')
            if (descParam?.value) tempJob.documents[docIndex].condensedParameters = descParam.value
        }
    })
}

async function saveJob() {
    if (!job.value) return
    loading.value = true
    const originalJob = deepcopy(job.value)

    formatJob()
    await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/saveJob`, job.value)
        .then((response: AxiosResponse<any>) => {
            if (response.data.resp !== 'ok' || !job.value) {
                job.value = originalJob
                return
            }
            store.setInfo({ title: t('common.toast.' + operation.value + 'Title'), msg: t('common.toast.success') })
            job.value.edit = true
            if (!job.value.jobGroup) job.value.jobGroup = 'BIObjectExecutions'
            job.value.role = job.value.jobParameters.find((param: any) => param.name === 'userRoles')?.value
            operation.value = 'update'
            takeSnapshot()
            // The reloaded list job would replace this one, which has the parameter values the user set
            preventJobReload = true
            router.push({ path: '/scheduler/edit-package-schedule', query: { id: job.value.jobName, clone: 'false' } })
            emit('documentSaved', job.value.jobName)
        })
        .catch(() => (job.value = originalJob))
    loading.value = false
}

function formatJob() {
    const tempJob = job.value as iPackage
    delete tempJob.edit
    delete tempJob.numberOfDocuments
    tempJob.documents.forEach((document: any) => document.parameters?.forEach((parameter: any) => (parameter.value = parameter.value.trim())))
    if (tempJob.jobParameters && tempJob.jobParameters.length > 0) {
        tempJob.jobParameters.forEach((param: any) => {
            if (param.name === 'userRoles' && tempJob.role) {
                param.value = tempJob.role
                delete tempJob.role
            }
        })
    } else {
        tempJob.jobParameters.push({ name: 'userRoles', description: tempJob.jobDescription || '', value: tempJob.role || '' } as any)
        delete tempJob.role
    }
}

function askUnsavedChanges(): Promise<boolean> {
    return new Promise((resolve) => {
        $q.dialog({ title: t('common.toast.unsavedChangesHeader'), message: t('common.toast.unsavedChangesMessage'), cancel: true, persistent: true })
            .onOk(() => resolve(true))
            .onCancel(() => resolve(false))
    })
}

async function cancel() {
    if (!job.value?.edit) {
        const failure = await router.push('/scheduler')
        if (!failure) emit('close')
        return
    }
    if (dirty.value && !(await askUnsavedChanges())) return
    job.value = deepcopy(savedJob.value)
    jobNameDirty.value = false
    // The route guard of the list must not ask a second time
    emit('dirtyChange', false)
    const failure = await router.push('/scheduler')
    if (!failure) emit('close')
}

function openTriggerEditor(trigger: iTrigger | null) {
    if (dirty.value) return
    triggerEditor.value = { key: Date.now(), trigger }
}

function requestCloseTriggerEditor() {
    triggerDrawer.value?.requestClose()
}

function onTriggerSaved() {
    triggerEditor.value = null
    emit('triggerSaved')
}

async function openFirstTrigger() {
    const trigger = job.value?.triggers?.[0]
    if (!trigger) return false
    if (!triggerEditor.value) openTriggerEditor(trigger)
    for (let i = 0; i < 40 && !triggerDrawer.value?.isReady(); i++) await new Promise((resolve) => setTimeout(resolve, 100))
    return !!triggerDrawer.value?.isReady()
}

defineExpose({
    hasTriggers: () => !!job.value?.edit && (job.value?.triggers?.length ?? 0) > 0,
    openFirstTrigger,
    showTriggerStep: (step: 'timing' | 'outputs' | 'review') => triggerDrawer.value?.showStep(step),
    closeTriggerDrawer: () => (triggerEditor.value = null)
})
</script>

<style scoped lang="scss">
.scheduler-detail__scroll {
    min-height: 0;
}

// q-scroll-area shrinks its content to fit; keep it at the full width so the column centers at its max width
.scheduler-detail__scroll :deep(.q-scrollarea__content) {
    width: 100%;
}

.scheduler-detail__column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 800px;
    margin: 0 auto;
    padding: 16px;
}

.scheduler-detail__backdrop {
    position: absolute;
    inset: 0;
    z-index: 2000;
    background: var(--kn-editor-backdrop-color);
}

:deep(.scheduler-card__header) {
    min-height: 40px;
    padding-top: 4px;
    padding-bottom: 4px;
}

.scheduler-detail__trigger-drawer {
    z-index: 2001;
}
</style>
