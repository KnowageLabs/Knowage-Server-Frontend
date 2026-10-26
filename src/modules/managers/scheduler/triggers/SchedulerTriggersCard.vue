<template>
    <q-card data-tour-id="scheduler-triggers">
        <q-card-section class="scheduler-card__header row items-center no-wrap">
            <div class="kn-editor-card-label col">{{ $t('managers.scheduler.triggers') }}</div>
            <span>
                <q-btn flat dense no-caps size="sm" color="accent" icon="add" :label="$t('managers.scheduler.addTrigger')" :disable="dirty" class="q-ma-none q-py-none q-px-xs" data-test="add-trigger-button" @click="emit('add')" />
                <q-tooltip v-if="dirty" :delay="300">{{ $t('managers.scheduler.saveJobFirst') }}</q-tooltip>
            </span>
        </q-card-section>
        <q-separator />
        <q-card-section>
            <div class="scheduler-triggers__grid" :class="{ 'scheduler-triggers__grid--empty': triggers.length === 0 }">
                <div v-for="(trigger, index) in triggers" :key="triggerKey(trigger)" class="scheduler-trigger-card column" data-test="trigger-card">
                    <div class="row items-center no-wrap q-gutter-x-sm">
                        <span class="scheduler-trigger-card__chip" :class="'scheduler-trigger-card__chip--' + isTriggerActive(trigger)">{{ $t('managers.scheduler.state.' + isTriggerActive(trigger)) }}</span>
                        <span class="col text-weight-medium ellipsis" :title="trigger.triggerName">{{ trigger.triggerName }}</span>
                    </div>
                    <div class="row no-wrap items-start q-mt-sm">
                        <q-icon name="schedule" size="18px" class="scheduler-trigger-card__icon q-mr-xs" />
                        <span class="col">{{ scheduleText(trigger) }}</span>
                    </div>
                    <div class="text-grey-7 text-caption q-mt-xs">{{ datesText(trigger) }}</div>
                    <div class="row q-gutter-x-xs q-mt-xs scheduler-trigger-card__outputs">
                        <q-icon v-for="output in outputIcons(trigger)" :key="output.kind" :name="output.icon" size="18px" :class="output.invalid ? 'text-negative' : 'scheduler-trigger-card__icon'">
                            <q-tooltip :delay="500">{{ $t(output.label) }}</q-tooltip>
                        </q-icon>
                    </div>
                    <div class="row items-center no-wrap scheduler-trigger-card__footer">
                        <span class="col text-grey-7 text-caption">{{ $t('managers.scheduler.documentsCount', { n: documentsCount(trigger) }) }}</span>
                        <q-btn flat round dense size="sm" icon="info" class="kn-editor-action" @click="openInfo(trigger)">
                            <q-tooltip :delay="500">{{ $t('managers.scheduler.info') }}</q-tooltip>
                        </q-btn>
                        <span>
                            <q-btn flat round dense size="sm" icon="edit" class="kn-editor-action" :disable="dirty" data-test="edit-trigger-button" @click="emit('edit', trigger)" />
                            <q-tooltip :delay="500">{{ dirty ? $t('managers.scheduler.saveJobFirst') : $t('common.edit') }}</q-tooltip>
                        </span>
                        <q-btn flat round dense size="sm" icon="play_arrow" class="kn-editor-action" @click="triggerExecuteConfirm(trigger)">
                            <q-tooltip :delay="500">{{ $t('managers.scheduler.runNow') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense size="sm" :icon="trigger.triggerIsPaused ? 'play_circle_outline' : 'pause_circle_outline'" class="kn-editor-action" @click="triggerPauseConfirm(trigger)">
                            <q-tooltip :delay="500">{{ trigger.triggerIsPaused ? $t('managers.scheduler.resumeSchedulation') : $t('managers.scheduler.pauseSchedulation') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense size="sm" icon="delete" class="kn-editor-action" @click="deleteTriggerConfirm(trigger, index)">
                            <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                        </q-btn>
                    </div>
                </div>
                <button type="button" class="scheduler-trigger-card scheduler-trigger-card--add column items-center justify-center" :disabled="dirty" @click="emit('add')">
                    <q-icon name="add_circle_outline" size="32px" />
                    <span>{{ $t('managers.scheduler.addTrigger') }}</span>
                    <q-tooltip v-if="dirty" :delay="300">{{ $t('managers.scheduler.saveJobFirst') }}</q-tooltip>
                </button>
            </div>
        </q-card-section>

        <SchedulerTriggerInfoDialog v-model="infoDialogVisible" :trigger="infoTrigger" :datasets="datasets" />
    </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import axios, { AxiosResponse } from 'axios'
import { iPackage, iTrigger, iTriggerDocument, OutputKind } from '../Scheduler'
import { describeChrono, formatScheduleDate, formatScheduleTime, getMailSource, getOutputErrors, isTriggerActive, OUTPUT_FLAGS, OUTPUT_ICONS, OUTPUT_KINDS, OUTPUT_LABELS, triggerQuery } from '../schedulerHelpers'
import { getLocale } from '@/helpers/commons/localeHelper'
import SchedulerTriggerInfoDialog from './SchedulerTriggerInfoDialog.vue'
import mainStore from '../../../../App.store'

const props = defineProps<{ job: iPackage; dirty: boolean; datasets?: any[] }>()
const emit = defineEmits<{
    (e: 'add'): void
    (e: 'edit', trigger: iTrigger): void
    (e: 'loading', value: boolean): void
}>()

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()
const locale = getLocale(true)

const infos = ref<Record<string, any>>({})
const infoDialogVisible = ref(false)
const infoTrigger = ref<any>(null)

const triggers = computed(() => (props.job.triggers ?? []) as iTrigger[])

const triggerKey = (trigger: iTrigger) => trigger.triggerName + '|' + trigger.triggerGroup

watch(() => triggers.value.map(triggerKey).join(','), loadInfos, { immediate: true })

// One call per trigger, in parallel: a failed call leaves the card with the type and the dates
async function loadInfos() {
    const results = await Promise.allSettled(triggers.value.map((trigger: iTrigger) => axios.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/getTriggerInfo?${triggerQuery(trigger)}`, null, { headers: { 'X-Disable-Errors': 'true' } })))
    const tempInfos = {} as Record<string, any>
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') tempInfos[triggerKey(triggers.value[index])] = result.value.data
    })
    infos.value = tempInfos
}

function scheduleText(trigger: iTrigger) {
    const info = infos.value[triggerKey(trigger)]
    return info?.chrono ? describeChrono(info, t as any, locale, props.datasets) : trigger.triggerChronType
}

function formatDateTime(value: string) {
    const date = new Date(value)
    return isNaN(date.getTime()) ? '' : formatScheduleDate(date, locale) + ' ' + formatScheduleTime(date)
}

function datesText(trigger: iTrigger) {
    const start = formatDateTime(trigger.triggerZonedStartTime)
    if (trigger.triggerChronType === 'Single') return start
    return start + ' → ' + (trigger.triggerZonedEndTime ? formatDateTime(trigger.triggerZonedEndTime) : t('managers.scheduler.noEnd'))
}

function outputIcons(trigger: iTrigger) {
    const info = infos.value[triggerKey(trigger)]
    const documents = (info?.documents ?? []) as iTriggerDocument[]
    return OUTPUT_KINDS.filter((kind: OutputKind) => documents.some((document: iTriggerDocument) => document[OUTPUT_FLAGS[kind]])).map((kind: OutputKind) => ({
        kind,
        icon: OUTPUT_ICONS[kind],
        label: OUTPUT_LABELS[kind],
        invalid: documents.some((document: iTriggerDocument) => document[OUTPUT_FLAGS[kind]] && getOutputErrors(document, kind, { inheritedMail: !!getMailSource(info, document) }).length > 0)
    }))
}

function documentsCount(trigger: iTrigger) {
    return infos.value[triggerKey(trigger)]?.documents?.length ?? props.job.documents?.length ?? 0
}

function openInfo(trigger: iTrigger) {
    infoTrigger.value = infos.value[triggerKey(trigger)] ?? null
    if (!infoTrigger.value) return
    infoDialogVisible.value = true
}

function confirm(message: string, action: () => void, title = t('managers.scheduler.confirmHeader')) {
    $q.dialog({ title, message, cancel: true, persistent: true }).onOk(action)
}

function triggerExecuteConfirm(trigger: iTrigger) {
    confirm(t('managers.scheduler.executeNow'), () => executeTrigger(trigger))
}

async function executeTrigger(trigger: iTrigger) {
    emit('loading', true)
    await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/executeTrigger?${triggerQuery(trigger)}`)
        .then((response: AxiosResponse<any>) => {
            if (response.data.resp === 'ok') store.setInfo({ title: t('common.information'), msg: t('managers.scheduler.schedulationExecuted') })
        })
        .catch(() => {})
    emit('loading', false)
}

function triggerPauseConfirm(trigger: iTrigger) {
    confirm(trigger.triggerIsPaused ? t('managers.scheduler.resumeSchedulation') : t('managers.scheduler.pauseSchedulation'), () => pauseTrigger(trigger))
}

async function pauseTrigger(trigger: iTrigger) {
    emit('loading', true)
    const action = trigger.triggerIsPaused ? 'resumeTrigger' : 'pauseTrigger'
    await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/${action}?${triggerQuery(trigger)}`)
        .then((response: AxiosResponse<any>) => {
            if (response.data.resp === 'ok') {
                store.setInfo({ title: t('common.information'), msg: trigger.triggerIsPaused ? t('managers.scheduler.schedulationResumed') : t('managers.scheduler.schedulationPaused') })
                trigger.triggerIsPaused = action === 'pauseTrigger'
            }
        })
        .catch(() => {})
    emit('loading', false)
}

function deleteTriggerConfirm(trigger: iTrigger, index: number) {
    confirm(t('common.toast.deleteMessage'), () => deleteTrigger(trigger, index), t('common.toast.deleteTitle'))
}

async function deleteTrigger(trigger: iTrigger, index: number) {
    emit('loading', true)
    await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/deleteTrigger?${triggerQuery(trigger)}`)
        .then((response: AxiosResponse<any>) => {
            if (response.data.resp === 'ok') {
                store.setInfo({ title: t('common.toast.deleteTitle'), msg: t('common.toast.deleteSuccess') })
                props.job.triggers.splice(index, 1)
            }
        })
        .catch(() => {})
    emit('loading', false)
}
</script>

<style scoped lang="scss">
.scheduler-triggers__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 12px;

    &--empty {
        grid-template-columns: 1fr;
    }
}

.scheduler-trigger-card {
    border: 1px solid var(--kn-color-borders);
    border-radius: 4px;
    padding: 10px 12px;
    background: #ffffff;
    min-width: 0;
}

.scheduler-trigger-card--add {
    border-style: dashed;
    color: var(--kn-color-default);
    min-height: 150px;
    cursor: pointer;
    font: inherit;
    gap: 4px;

    &:hover:not(:disabled) {
        background: var(--kn-editor-row-hover-background);
        color: var(--kn-color-primary);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
}

.scheduler-trigger-card__icon {
    color: var(--kn-editor-list-icon-color);
}

.scheduler-trigger-card__outputs {
    min-height: 22px;
}

.scheduler-trigger-card__footer {
    border-top: 1px solid #eeeeee;
    margin-top: auto;
    padding-top: 6px;
}

.scheduler-trigger-card__chip {
    flex: none;
    border-radius: 12px;
    padding: 1px 9px;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: #e0e0e0;
    color: rgba(0, 0, 0, 0.6);

    &--active {
        background: #e2f0d6;
        color: #41691f;
    }

    &--paused {
        background: #fdf0c8;
        color: #7a5b00;
    }
}
</style>
