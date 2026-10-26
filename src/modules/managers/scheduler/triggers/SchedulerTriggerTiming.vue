<template>
    <div class="scheduler-timing">
        <q-input :model-value="trigger.triggerDescription" outlined dense hide-bottom-space :maxlength="descriptor.limits.triggerDescription" :label="$t('common.name') + ' *'" :error="nameTouched && !trigger.triggerDescription?.trim()" data-test="trigger-name-input" @update:model-value="setTriggerName" @blur="nameTouched = true" />

        <div class="kn-editor-card-label q-mt-md q-mb-xs">{{ $t('common.type') }}</div>
        <q-btn-toggle :model-value="triggerType" spread no-caps unelevated toggle-color="primary" color="white" text-color="grey-9" class="scheduler-timing__toggle" :options="typeOptions" data-test="trigger-type-toggle" @update:model-value="setTriggerType" />

        <div class="kn-editor-card-label q-mt-md q-mb-xs">{{ triggerType === 'single' ? $t('managers.scheduler.start') : $t('managers.scheduler.period') }}</div>
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <SchedulerDateTimeInput :model-value="dateModel(start)" kind="date" :label="$t('cron.startDate') + ' *'" data-test="start-date" @update:model-value="setStartDate" />
            </div>
            <div class="col-6">
                <SchedulerDateTimeInput :model-value="displayTime(start)" kind="time" :label="$t('cron.startTime') + ' *'" data-test="start-time" @update:model-value="setStartTime" />
            </div>
            <template v-if="triggerType !== 'single'">
                <div class="col-6">
                    <SchedulerDateTimeInput :model-value="dateModel(end)" kind="date" clearable :label="$t('cron.endDate')" data-test="end-date" @update:model-value="setEndDate" @clear="clearEnd" />
                </div>
                <div class="col-6">
                    <SchedulerDateTimeInput :model-value="displayTime(end)" kind="time" :disable="!end" :label="$t('cron.endTime')" data-test="end-time" @update:model-value="setEndTime" />
                </div>
            </template>
        </div>

        <template v-if="triggerType === 'scheduler'">
            <div class="kn-editor-card-label q-mt-md q-mb-xs">{{ $t('managers.scheduler.repeat') }}</div>
            <div class="row q-col-gutter-sm">
                <div class="col-6">
                    <q-select :model-value="unit" outlined dense hide-bottom-space emit-value map-options :options="unitOptions" :label="$t('managers.scheduler.repeat') + ' *'" data-test="repeat-unit" @update:model-value="setUnit" />
                </div>
                <div v-if="unit === 'minute' || unit === 'hour' || unit === 'day'" class="col-6">
                    <q-select :model-value="parameter.numRepetition" outlined dense hide-bottom-space emit-value map-options :options="numberOptions(unit === 'minute' ? 60 : unit === 'hour' ? 24 : 31)" :label="$t('managers.scheduler.every')" data-test="repeat-every" @update:model-value="setEvery" />
                </div>
            </div>

            <div v-if="unit === 'week'" class="row q-mt-sm">
                <q-checkbox v-for="day in weekDays" :key="day.value" :model-value="(parameter.days ?? []).includes(day.value)" dense :label="day.label" class="q-mr-md" @update:model-value="(checked) => setWeekDay(day.value, checked)" />
            </div>

            <template v-if="unit === 'month'">
                <q-btn-toggle :model-value="monthsMode" no-caps unelevated toggle-color="primary" color="white" text-color="grey-9" class="scheduler-timing__toggle q-mt-sm" :options="monthsModeOptions" @update:model-value="setMonthsMode" />
                <div v-if="monthsMode === 'every'" class="row q-col-gutter-sm q-mt-xs">
                    <div class="col-6">
                        <q-select :model-value="parameter.numRepetition" outlined dense hide-bottom-space emit-value map-options :options="numberOptions(12)" :label="$t('managers.scheduler.every')" @update:model-value="(value) => (parameter.numRepetition = value)" />
                    </div>
                </div>
                <div v-else class="scheduler-timing__months q-mt-xs">
                    <q-checkbox v-for="month in months" :key="month.value" :model-value="(parameter.months ?? []).includes(month.value)" dense :label="month.label" @update:model-value="(checked) => setMonth(month.value, checked)" />
                </div>

                <q-btn-toggle :model-value="dayMode" no-caps unelevated toggle-color="primary" color="white" text-color="grey-9" class="scheduler-timing__toggle q-mt-md" :options="dayModeOptions" @update:model-value="setDayMode" />
                <div v-if="dayMode === 'ofMonth'" class="row q-col-gutter-sm q-mt-xs">
                    <div class="col-6">
                        <q-select :model-value="parameter.dayRepetition" outlined dense hide-bottom-space emit-value map-options :options="numberOptions(31)" :label="$t('managers.scheduler.day.ofMonth')" @update:model-value="(value) => (parameter.dayRepetition = value)" />
                    </div>
                </div>
                <template v-else>
                    <div class="row q-col-gutter-sm q-mt-xs">
                        <div class="col-6">
                            <q-select :model-value="parameter.weeks" outlined dense hide-bottom-space emit-value map-options :options="weekOfMonthOptions" :label="$t('cron.theWeek') + ' *'" @update:model-value="(value) => (parameter.weeks = value)" />
                        </div>
                    </div>
                    <div class="row q-mt-sm">
                        <q-checkbox v-for="day in weekDays" :key="day.value" :model-value="(parameter.days ?? []).includes(day.value)" dense :label="day.label" class="q-mr-md" @update:model-value="(checked) => setMonthWeekDay(day.value, checked)" />
                    </div>
                </template>
            </template>
        </template>

        <template v-if="triggerType === 'event'">
            <div class="kn-editor-card-label q-mt-md q-mb-xs">{{ $t('managers.scheduler.eventType') }}</div>
            <q-btn-toggle :model-value="parameter.type" spread no-caps unelevated toggle-color="primary" color="white" text-color="grey-9" class="scheduler-timing__toggle" :options="eventOptions" data-test="event-type-toggle" @update:model-value="(value) => (parameter.type = value)" />
            <div v-if="parameter.type === 'dataset'" class="row q-col-gutter-sm q-mt-xs">
                <div class="col-6">
                    <q-select :model-value="parameter.dataset" outlined dense hide-bottom-space emit-value map-options use-input input-debounce="0" :options="filteredDatasets" :label="$t('common.dataset') + ' *'" data-test="event-dataset" @filter="filterDatasets" @update:model-value="(value) => (parameter.dataset = value)" />
                </div>
                <div class="col-6">
                    <q-input v-model="parameter.frequency" outlined dense hide-bottom-space type="number" min="1" :label="$t('managers.scheduler.checkEveryMinutes') + ' *'" data-test="event-frequency" />
                </div>
            </div>
        </template>

        <div class="scheduler-schedule-box row no-wrap items-start q-mt-md">
            <q-icon name="schedule" size="20px" class="scheduler-schedule-box__icon q-mr-sm" />
            <div class="col">
                <div class="kn-editor-card-label">{{ $t('managers.scheduler.readableSchedule') }}</div>
                <div class="text-weight-medium" data-test="readable-schedule">{{ schedule }}</div>
            </div>
        </div>
        <div v-if="errors.length > 0" class="scheduler-timing__errors row no-wrap items-start q-mt-sm">
            <q-icon name="error_outline" size="16px" class="q-mr-xs q-mt-xs" />
            <span>{{ errors.join(' ') }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { iChrono, iChronoParameter, iTriggerDraft } from '../Scheduler'
import { changeTriggerType, CRON_UNITS, describeChrono, getMonthName, getTimingErrors, getTriggerEnd, getTriggerStart, getWeekdayName, isCronUnit } from '../schedulerHelpers'
import { getLocale } from '@/helpers/commons/localeHelper'
import descriptor from '../SchedulerDescriptor.json'
import SchedulerDateTimeInput from './SchedulerDateTimeInput.vue'

const props = defineProps<{ trigger: iTriggerDraft; datasets?: any[] }>()

const { t } = useI18n()
const locale = getLocale(true)
const nameTouched = ref(false)
const datasetFilter = ref('')

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

const typeOptions = computed(() => [
    { value: 'single', label: t('managers.scheduler.once'), icon: 'event' },
    { value: 'scheduler', label: t('managers.scheduler.recurring'), icon: 'repeat' },
    { value: 'event', label: t('managers.scheduler.onEvent'), icon: 'bolt' }
])
const eventOptions = computed(() => [
    { value: 'rest', label: t('managers.scheduler.restService'), icon: 'http' },
    { value: 'contextbroker', label: t('managers.scheduler.contextBroker'), icon: 'hub' },
    { value: 'dataset', label: t('common.dataset'), icon: 'table_chart' }
])
const unitOptions = computed(() => CRON_UNITS.map((unit) => ({ value: unit, label: t('managers.scheduler.units.' + unit) })))
const monthsModeOptions = computed(() => [
    { value: 'every', label: t('managers.scheduler.months.every') },
    { value: 'in', label: t('managers.scheduler.months.in') }
])
const dayModeOptions = computed(() => [
    { value: 'ofMonth', label: t('managers.scheduler.day.ofMonth') },
    { value: 'nth', label: t('managers.scheduler.day.nthWeekday') }
])
const weekOfMonthOptions = computed(() => ['1', '2', '3', '4', '5'].map((value) => ({ value, label: t('managers.scheduler.weekOfMonth.' + value) })))
// Monday first; the values stay '1' Sunday to '7' Saturday, as in the KnCron descriptor
const weekDays = computed(() => ['2', '3', '4', '5', '6', '7', '1'].map((value) => ({ value, label: getWeekdayName(value, locale) })))
const months = computed(() => Array.from({ length: 12 }, (_, index) => String(index + 1)).map((value) => ({ value, label: getMonthName(value, locale) })))

const triggerType = computed(() => (props.trigger.chrono.type === 'single' || props.trigger.chrono.type === 'event' ? props.trigger.chrono.type : 'scheduler'))
const parameter = computed(() => (props.trigger.chrono.parameter ?? {}) as iChronoParameter)
const unit = computed(() => (isCronUnit(props.trigger.chrono.type) ? props.trigger.chrono.type : null))
const monthsMode = computed(() => (parameter.value.months !== undefined ? 'in' : 'every'))
const dayMode = computed(() => (parameter.value.weeks !== undefined || parameter.value.days !== undefined ? 'nth' : 'ofMonth'))
const start = computed(() => getTriggerStart(props.trigger))
const end = computed(() => getTriggerEnd(props.trigger))
const schedule = computed(() => describeChrono(props.trigger, t as any, locale, props.datasets))
const errors = computed(() => getTimingErrors(props.trigger).map((key: string) => t(key)))

const datasetOptions = computed(() => (props.datasets ?? []).map((dataset: any) => ({ value: dataset.id?.dsId, label: dataset.label })))
const filteredDatasets = computed(() => datasetOptions.value.filter((option) => !datasetFilter.value || option.label?.toLowerCase().includes(datasetFilter.value.toLowerCase())))

function filterDatasets(value: string, update: (callback: () => void) => void) {
    update(() => (datasetFilter.value = value))
}

function numberOptions(count: number) {
    return Array.from({ length: count }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))
}

function displayTime(date: Date | null) {
    return date ? String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0') : ''
}

function dateModel(date: Date | null) {
    return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : null
}

function parseDate(value: string | null): Date | null {
    if (!value) return null
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
}

function parseTime(value: string | null) {
    const [hours, minutes] = (value ?? '00:00').split(':').map(Number)
    return { hours, minutes }
}

function timeOfDay(date: Date | null) {
    return date ? date.getHours() * HOUR_MS + date.getMinutes() * MINUTE_MS : 0
}

function setTriggerName(value: string | number | null) {
    nameTouched.value = true
    props.trigger.triggerDescription = (value ?? '') as string
    props.trigger.triggerName = props.trigger.triggerDescription.substring(0, descriptor.limits.triggerName)
}

function setTriggerType(type: 'single' | 'scheduler' | 'event') {
    changeTriggerType(props.trigger, type)
}

// Port of setStartDate of the old timing tab: it writes the hours into the date. The date is a copy, because a Date changed in place does not update the view
function applyStartDate() {
    const date = props.trigger.startDateTiming
    props.trigger.zonedStartTime = date instanceof Date ? new Date(date) : date
    if (props.trigger.zonedStartTime instanceof Date && props.trigger.startTimeTiming instanceof Date) {
        props.trigger.zonedStartTime.setHours(props.trigger.startTimeTiming.getHours())
        props.trigger.zonedStartTime.setMinutes(props.trigger.startTimeTiming.getMinutes())
    }
}

function applyEndDate() {
    const date = props.trigger.endDateTiming
    props.trigger.zonedEndTime = date instanceof Date ? new Date(date) : date
    if (props.trigger.zonedEndTime instanceof Date && props.trigger.endTimeTiming instanceof Date) {
        props.trigger.zonedEndTime.setHours(props.trigger.endTimeTiming.getHours())
        props.trigger.zonedEndTime.setMinutes(props.trigger.endTimeTiming.getMinutes())
    }
}

function timeAsDate(value: string) {
    const { hours, minutes } = parseTime(value)
    const time = new Date()
    time.setHours(hours, minutes, 0, 0)
    return time
}

// Port of KnCron setDate: the date at midnight plus the time in milliseconds
function setFrequencyDate(key: 'startDate' | 'endDate', date: Date, time: number) {
    if (!props.trigger.frequency) return
    date.setSeconds(0)
    date.setMilliseconds(0)
    props.trigger.frequency[key] = date.valueOf() + time
}

function setStartDate(value: string | null) {
    const date = parseDate(value)
    if (!date) return
    if (triggerType.value === 'scheduler') return setFrequencyDate('startDate', date, timeOfDay(start.value))
    props.trigger.startDateTiming = date
    applyStartDate()
}

function setStartTime(value: string | null) {
    if (!value) return
    if (triggerType.value === 'scheduler') {
        const date = start.value ?? new Date()
        const { hours, minutes } = parseTime(value)
        return setFrequencyDate('startDate', new Date(date.getFullYear(), date.getMonth(), date.getDate()), hours * HOUR_MS + minutes * MINUTE_MS)
    }
    props.trigger.startTimeTiming = timeAsDate(value)
    applyStartDate()
}

function setEndDate(value: string | null) {
    const date = parseDate(value)
    if (!date) return
    if (triggerType.value === 'scheduler') return setFrequencyDate('endDate', date, timeOfDay(end.value))
    props.trigger.endDateTiming = date
    applyEndDate()
}

function setEndTime(value: string | null) {
    if (!value || !end.value) return
    if (triggerType.value === 'scheduler') {
        const { hours, minutes } = parseTime(value)
        return setFrequencyDate('endDate', new Date(end.value.getFullYear(), end.value.getMonth(), end.value.getDate()), hours * HOUR_MS + minutes * MINUTE_MS)
    }
    props.trigger.endTimeTiming = timeAsDate(value)
    applyEndDate()
}

function clearEnd() {
    if (triggerType.value === 'scheduler') {
        if (props.trigger.frequency) props.trigger.frequency.endDate = null
        return
    }
    props.trigger.endDateTiming = null
    props.trigger.endTimeTiming = null
    props.trigger.zonedEndTime = null
}

// KnCron replaces the cron object; the payload reads it from frequency.cron
function setCron(cron: iChrono) {
    props.trigger.chrono = cron
    if (props.trigger.frequency) props.trigger.frequency.cron = cron
}

// Port of KnCron updateCronInterval
function setUnit(value: 'minute' | 'hour' | 'day' | 'week' | 'month') {
    switch (value) {
        case 'minute':
        case 'hour':
        case 'day':
            setCron({ type: value, parameter: { numRepetition: '1' } })
            break
        case 'week':
            setCron({ type: value, parameter: { days: [] } })
            break
        case 'month':
            setCron({ type: value, parameter: { numRepetition: '1', dayRepetition: '1' } })
    }
}

function setEvery(value: string) {
    setCron({ type: props.trigger.chrono.type, parameter: { numRepetition: value } })
}

function toggleValue(values: string[] | undefined, value: string, checked: boolean) {
    const result = (values ?? []).filter((item: string) => item !== value)
    if (checked) result.push(value)
    return result.sort((a: string, b: string) => Number(a) - Number(b))
}

function setWeekDay(day: string, checked: boolean) {
    setCron({ type: 'week', parameter: { days: toggleValue(parameter.value.days, day, checked) } })
}

// Port of the KnCron simpleMonth watcher
function setMonthsMode(mode: 'every' | 'in') {
    const tempParameter = parameter.value
    if (mode === 'every') {
        delete tempParameter.months
        tempParameter.numRepetition = '1'
    } else {
        delete tempParameter.numRepetition
        tempParameter.months = []
    }
}

function setMonth(month: string, checked: boolean) {
    parameter.value.months = toggleValue(parameter.value.months, month, checked)
}

// Port of the KnCron simpleDay watcher
function setDayMode(mode: 'ofMonth' | 'nth') {
    const tempParameter = parameter.value
    if (mode === 'ofMonth') {
        delete tempParameter.weeks
        delete tempParameter.days
        tempParameter.dayRepetition = '1'
    } else {
        delete tempParameter.dayRepetition
        tempParameter.weeks = null
        tempParameter.days = []
    }
}

function setMonthWeekDay(day: string, checked: boolean) {
    parameter.value.days = toggleValue(parameter.value.days, day, checked)
}
</script>

<style scoped lang="scss">
.scheduler-timing__toggle {
    border: 1px solid var(--kn-color-borders);
}

.scheduler-timing__months {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px 8px;
}

.scheduler-timing__errors {
    color: var(--kn-color-error);
    font-size: 0.8rem;
}

.scheduler-schedule-box {
    background: #f3f8fc;
    border: 1px solid var(--kn-color-secondary);
    border-left: 4px solid var(--kn-color-info);
    padding: 10px 12px;
}

.scheduler-schedule-box__icon {
    color: var(--kn-color-info);
}
</style>
