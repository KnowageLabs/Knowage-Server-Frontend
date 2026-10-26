<template>
    <div class="scheduler-trigger-drawer column no-wrap full-height">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>
                {{ isNew ? $t('managers.scheduler.newTrigger') : $t('managers.scheduler.editTrigger') }}<span class="scheduler-trigger-drawer__job"> · {{ job.jobName }}</span>
            </q-toolbar-title>
            <q-btn flat dense no-caps :label="$t('common.cancel')" data-test="trigger-cancel-button" @click="requestClose" />
            <q-btn flat round dense icon="close" data-test="trigger-close-button" @click="requestClose">
                <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </q-toolbar>
        <q-linear-progress v-if="loading || saving" indeterminate color="primary" />

        <q-scroll-area class="col scheduler-trigger-drawer__body">
            <q-stepper v-if="draft" v-model="step" vertical flat animated header-nav done-color="positive" error-color="negative" active-color="primary" data-tour-id="scheduler-trigger-stepper" class="scheduler-trigger-drawer__stepper">
                <q-step name="timing" :title="$t('managers.scheduler.steps.timing')" :caption="step === 'timing' ? '' : timingCaption" icon="schedule" :header-nav="canOpen('timing')" :done="isDone('timing')" :error="isError('timing')" done-icon="check" error-icon="error">
                    <SchedulerTriggerTiming :trigger="draft" :datasets="datasets" />
                    <q-stepper-navigation class="q-gutter-sm">
                        <q-btn unelevated color="primary" :label="$t('common.continue')" data-test="timing-continue" @click="goTo('outputs')" />
                    </q-stepper-navigation>
                </q-step>
                <q-step name="outputs" :title="$t('managers.scheduler.steps.outputs')" :caption="step === 'outputs' ? '' : outputsCaption" icon="outbox" :header-nav="canOpen('outputs')" :done="isDone('outputs')" :error="isError('outputs')" done-icon="check" error-icon="error">
                    <SchedulerTriggerOutputs v-model:active-label-id="activeLabelId" :trigger="draft" :job-info="jobInfo" :functionalities="functionalities" :datasets="datasets" :open-outputs="openOutputs" />
                    <q-stepper-navigation class="q-gutter-sm">
                        <q-btn flat color="primary" :label="$t('common.back')" @click="goTo('timing')" />
                        <q-btn unelevated color="primary" :label="$t('common.continue')" data-test="outputs-continue" @click="goTo('review')" />
                    </q-stepper-navigation>
                </q-step>
                <q-step name="review" :title="$t('managers.scheduler.steps.review')" :caption="step === 'review' ? '' : $t('managers.scheduler.checkAndSave')" icon="fact_check" :header-nav="canOpen('review')" :done="isDone('review')" :error="isError('review')" done-icon="check" error-icon="error">
                    <SchedulerTriggerReview :trigger="draft" :datasets="datasets" :job-info="jobInfo" @open-document="openDocument" />
                    <q-stepper-navigation class="q-gutter-sm">
                        <q-btn flat color="primary" :label="$t('common.back')" @click="goTo('outputs')" />
                        <span>
                            <q-btn unelevated color="primary" icon="save" :label="$t('managers.scheduler.saveTrigger')" :disable="!!firstError || saving" data-test="save-trigger-button" @click="saveTrigger" />
                            <q-tooltip v-if="firstError" :delay="300">{{ $t(firstError.key, firstError.params ?? {}) }}</q-tooltip>
                        </span>
                    </q-stepper-navigation>
                </q-step>
            </q-stepper>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import axios, { AxiosResponse } from 'axios'
import deepcopy from 'deepcopy'
import { iJobInfo, iPackage, iTrigger, iTriggerDocument, iTriggerDraft, OutputKind } from '../Scheduler'
import { describeChrono, firstTriggerError, formatTrigger, getDocumentState, getTimingErrors, getTriggerSnapshot, initTriggerTiming, normalizeTriggerDocuments, triggerQuery } from '../schedulerHelpers'
import { getLocale } from '@/helpers/commons/localeHelper'
import SchedulerTriggerTiming from './SchedulerTriggerTiming.vue'
import SchedulerTriggerOutputs from './SchedulerTriggerOutputs.vue'
import SchedulerTriggerReview from './SchedulerTriggerReview.vue'
import mainStore from '../../../../App.store'

type Step = 'timing' | 'outputs' | 'review'
const STEPS: Step[] = ['timing', 'outputs', 'review']

const props = defineProps<{ job: iPackage; listTrigger: iTrigger | null; datasets?: any[] }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void; (e: 'stale'): void }>()

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()
const locale = getLocale(true)

const isNew = !props.listTrigger
const draft = ref<iTriggerDraft | null>(null)
const jobInfo = ref<iJobInfo | null>(null)
const functionalities = ref<any[]>([])
const snapshot = ref('')
const step = ref<Step>('timing')
const visitedSteps = ref<Step[]>(isNew ? ['timing'] : [...STEPS])
const activeLabelId = ref('')
const openOutputs = reactive<Record<OutputKind, boolean>>({ snapshot: false, file: false, document: false, mail: false })
const loading = ref(false)
const saving = ref(false)
const ready = ref(false)

const context = computed(() => ({ jobInfo: jobInfo.value }))
const dirty = computed(() => !!draft.value && getTriggerSnapshot(draft.value) !== snapshot.value)
const timingValid = computed(() => !!draft.value && getTimingErrors(draft.value).length === 0)
const documentStates = computed(() => (draft.value?.documents ?? []).map((document: iTriggerDocument) => getDocumentState(document, draft.value as iTriggerDraft, context.value)))
const outputsValid = computed(() => documentStates.value.every((state) => state.valid))
const firstError = computed(() => (draft.value ? firstTriggerError(draft.value, context.value) : null))

const timingCaption = computed(() => (draft.value ? (draft.value.triggerDescription || '-') + ' · ' + describeChrono(draft.value, t as any, locale, props.datasets) : ''))
const outputsCaption = computed(() => {
    const total = documentStates.value.length
    const incomplete = documentStates.value.filter((state) => !state.valid).length
    return incomplete === 0 ? t('managers.scheduler.outputsSummary.allReady', { n: total }) : t('managers.scheduler.outputsSummary.incomplete', { n: total, m: incomplete })
})

function stepValid(name: Step) {
    if (name === 'timing') return timingValid.value
    if (name === 'outputs') return outputsValid.value
    return timingValid.value && outputsValid.value
}

const canOpen = (name: Step) => visitedSteps.value.includes(name)
const isDone = (name: Step) => step.value !== name && canOpen(name) && stepValid(name)
const isError = (name: Step) => step.value !== name && canOpen(name) && !stepValid(name)

function goTo(name: Step) {
    if (!visitedSteps.value.includes(name)) visitedSteps.value.push(name)
    step.value = name
}

function openDocument(labelId: string) {
    activeLabelId.value = labelId
    goTo('outputs')
}

async function load() {
    loading.value = true
    try {
        let trigger = null as any
        if (props.listTrigger) {
            // A trigger that runs once is deleted by the scheduler after it has run, while the list still shows it
            try {
                const response = await axios.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/getTriggerInfo?${triggerQuery(props.listTrigger)}`, null, { headers: { 'X-Disable-Errors': 'true' } })
                trigger = response.data
            } catch {
                store.setError({ title: t('managers.scheduler.editTrigger'), msg: t('managers.scheduler.triggerNotFound') })
                emit('stale')
                return
            }
        } else {
            trigger = { jobName: props.job.jobName, jobGroup: props.job.jobGroup, chrono: { type: 'single', parameter: {} }, documents: null }
        }
        await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/getJob?${triggerQuery(trigger)}`).then((response: AxiosResponse<any>) => {
            jobInfo.value = response.data.job
            functionalities.value = response.data.functionality ?? []
        })
        if (!trigger.documents) trigger.documents = deepcopy(jobInfo.value?.documents ?? [])
        initTriggerTiming(trigger)
        normalizeTriggerDocuments(trigger)
        draft.value = trigger
        snapshot.value = getTriggerSnapshot(trigger)
        activeLabelId.value = trigger.documents[0]?.labelId ?? ''
        ready.value = true
    } catch {
        emit('close')
    } finally {
        loading.value = false
    }
}

function requestClose() {
    if (!dirty.value) return emit('close')
    $q.dialog({ title: t('common.toast.unsavedChangesHeader'), message: t('common.toast.unsavedChangesMessage'), cancel: true, persistent: true }).onOk(() => emit('close'))
}

// Capture phase: an open menu or dialog closes itself on Esc, and the drawer must not close with it
function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    if (document.querySelector('.q-dialog, .q-menu')) return
    requestClose()
}

async function saveTrigger() {
    if (!draft.value) return
    saving.value = true
    const operation = isNew ? 'create' : 'update'
    const formattedTrigger = formatTrigger(draft.value)
    await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/saveTrigger`, formattedTrigger, { headers: { 'X-Disable-Errors': 'true' } })
        .then((response: AxiosResponse<any>) => {
            if (response.data.Errors) {
                showSaveError(response.data.Errors[0] ?? 'default error', operation)
            } else {
                store.setInfo({ title: t('common.toast.' + operation + 'Title'), msg: t('common.toast.success') })
                emit('saved')
            }
        })
        .catch((response) => showSaveError(response, operation))
    saving.value = false
}

function showSaveError(response: any, operation: string) {
    $q.dialog({ title: t('common.toast.' + operation + 'Title'), message: getErrorMessage(response) })
}

function getErrorMessage(message: string) {
    switch (message) {
        case 'errors.trigger.missingDataSet':
            return t('managers.scheduler.missingDataSet')
        case 'errors.trigger.missingDataSetParameter':
            return t('managers.scheduler.missingDataSetParameter')
        case 'Empty name':
            return t('managers.scheduler.emptyName')
        case 'sbi.scheduler.schedulation.error.alreadyPresent':
            return t('managers.scheduler.triggerAlreadyPresent')
        case 'Error in setting java class ':
            return t('managers.scheduler.javaClassError')
        default:
            return t('managers.scheduler.savingTriggerGenericError')
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeydown, true)
    load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, true))

defineExpose({
    requestClose,
    isReady: () => ready.value,
    showStep: (name: Step) => goTo(name)
})
</script>

<style scoped lang="scss">
.scheduler-trigger-drawer {
    background: #ffffff;
}

.scheduler-trigger-drawer__job {
    font-weight: 400;
    opacity: 0.7;
}

.scheduler-trigger-drawer__body {
    min-height: 0;
}

// q-scroll-area shrinks its content to fit; the stepper must keep the full width
.scheduler-trigger-drawer__body :deep(.q-scrollarea__content) {
    width: 100%;
}

.scheduler-trigger-drawer__stepper :deep(.q-stepper__step-inner) {
    padding-right: 20px;
}
</style>
