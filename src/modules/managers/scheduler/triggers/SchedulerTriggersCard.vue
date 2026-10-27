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
            <div v-if="triggers.length === 0" class="text-grey-7">{{ $t('managers.scheduler.noTriggersInfo') }}</div>
            <div v-else class="scheduler-triggers__grid">
                <div v-for="(trigger, index) in triggers" :key="triggerKey(trigger)" class="scheduler-trigger-card column no-wrap" :class="['scheduler-trigger-card--' + isTriggerActive(trigger), { 'scheduler-trigger-card--locked': dirty }]" data-test="trigger-card" @click="onCardClick(trigger)">
                    <div class="scheduler-trigger-card__band row items-center no-wrap">
                        <span class="scheduler-trigger-card__dimmable col text-weight-medium ellipsis q-mr-sm" :title="trigger.triggerName">{{ trigger.triggerName }}</span>
                        <q-toggle :model-value="isTriggerActive(trigger) === 'active'" dense color="positive" :disable="isTriggerActive(trigger) === 'ended'" data-test="trigger-toggle" @click.stop @update:model-value="triggerPauseConfirm(trigger)">
                            <q-tooltip :delay="500">{{ toggleTooltip(trigger) }}</q-tooltip>
                        </q-toggle>
                    </div>
                    <div class="scheduler-trigger-card__dimmable scheduler-trigger-card__body">
                        <div class="row no-wrap items-start">
                            <q-icon name="schedule" size="18px" class="scheduler-trigger-card__icon q-mr-xs" />
                            <span class="col">{{ scheduleText(trigger) }}</span>
                        </div>
                        <div class="text-grey-7 text-caption q-mt-xs">{{ datesText(trigger) }}</div>
                    </div>
                    <div class="scheduler-trigger-card__band scheduler-trigger-card__band--footer row items-center no-wrap">
                        <span class="scheduler-trigger-card__dimmable row q-gutter-x-xs scheduler-trigger-card__outputs">
                            <q-icon v-for="output in outputIcons(trigger)" :key="output.kind" :name="output.icon" size="18px" :class="output.invalid ? 'text-negative' : 'scheduler-trigger-card__icon'">
                                <q-tooltip :delay="500">{{ $t(output.label) }}</q-tooltip>
                            </q-icon>
                        </span>
                        <span class="scheduler-trigger-card__dimmable col text-grey-7 text-caption q-ml-xs">{{ $t('managers.scheduler.documentsCount', { n: documentsCount(trigger) }) }}</span>
                        <q-btn flat round dense icon="delete" color="negative" data-test="delete-trigger-button" @click.stop="deleteTriggerConfirm(trigger, index)">
                            <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense icon="play_circle_outline" class="kn-editor-action" data-test="run-trigger-button" @click.stop="triggerExecuteConfirm(trigger)">
                            <q-tooltip :delay="500">{{ $t('managers.scheduler.runNow') }}</q-tooltip>
                        </q-btn>
                    </div>
                    <q-tooltip v-if="dirty" :delay="300">{{ $t('managers.scheduler.saveJobFirst') }}</q-tooltip>
                </div>
            </div>
        </q-card-section>
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

// The whole card opens the editor; a job with unsaved changes has to be saved first
function onCardClick(trigger: iTrigger) {
    if (!props.dirty) emit('edit', trigger)
}

function toggleTooltip(trigger: iTrigger) {
    const state = isTriggerActive(trigger)
    if (state === 'ended') return t('managers.scheduler.state.ended')
    return state === 'paused' ? t('managers.scheduler.resumeSchedulation') : t('managers.scheduler.pauseSchedulation')
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
}

.scheduler-trigger-card {
    border: 1px solid var(--kn-color-borders);
    border-left: 4px solid var(--kn-color-success);
    background: #ffffff;
    min-width: 0;
    cursor: pointer;

    &:hover {
        background: var(--kn-editor-row-hover-background);
    }

    &--paused {
        border-left-color: var(--kn-color-warning);
    }

    &--ended {
        border-left-color: var(--kn-color-default);
    }

    &--paused,
    &--ended {
        .scheduler-trigger-card__dimmable {
            opacity: 0.55;
        }
    }

    &--locked {
        cursor: not-allowed;
    }
}

.scheduler-trigger-card__band {
    min-height: 32px;
    padding: 2px 8px 2px 12px;
    background: #fafafa;
    border-bottom: 1px solid #e0e0e0;

    &--footer {
        margin-top: auto;
        padding: 2px 8px 2px 12px;
        border-top: 1px solid #e0e0e0;
        border-bottom: 0;
    }
}

.scheduler-trigger-card__body {
    padding: 10px 12px;
}

.scheduler-trigger-card__icon {
    color: var(--kn-editor-list-icon-color);
}

.scheduler-trigger-card__outputs {
    min-height: 22px;
}
</style>
