<template>
    <div class="q-mt-sm row" :class="{ 'q-gutter-sm': props.logsVisible }">
        <q-card class="col" flat bordered>
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>Schedulation</q-toolbar-title>
                <q-toggle v-model="schedulation.enabled" :label="$t('common.enabled')" left-label @update:model-value="emit('update:schedulationPaused', schedulation.enabled)" />
            </q-toolbar>
            <q-card-section>
                <div class="row q-col-gutter-sm">
                    <q-select class="col-12" v-model="schedulation.refreshRate" :label="$t(KnSchedulerDescriptor.refreshRate.label)" :options="KnSchedulerDescriptor.refreshRate.options" :option-label="(option) => (option.name ? $t(option.name) : '')" option-value="code" map-options emit-value filled dense :disable="props.readOnly" @update:model-value="updateSchedulationType" />
                    <div v-if="schedulation.refreshRate === 'daily'" class="row col-12 q-gutter-sm">
                        <q-btn-group class="col-12" push spread> <q-btn v-for="day in KnSchedulerDescriptor.days" :key="day.code" :label="$t(`locale.dayNamesMin[${day.id}]`)" :disable="props.readOnly" :color="schedulation.refreshDays.includes(day.code) ? 'primary' : 'white'" :text-color="schedulation.refreshDays.includes(day.code) ? 'white' : 'primary'" @click="toggleDay(day.code)" /> </q-btn-group>
                    </div>
                    <q-select v-if="schedulation.refreshRate && schedulation.refreshRate === 'yearly'" class="col" v-model="schedulation.refreshMonth" :label="$t('On Month')" :options="KnSchedulerDescriptor.months" :option-label="(option) => (option.name ? $t(option.name) : '')" option-value="id" map-options emit-value filled dense :disable="props.readOnly" />
                    <q-select v-if="schedulation.refreshRate && ['yearly', 'monthly'].includes(schedulation.refreshRate)" class="col" v-model="schedulation.refreshDay" :label="$t('On Day')" :options="KnSchedulerDescriptor.monthDays" filled dense :disable="props.readOnly" />
                    <q-input class="col-12" v-if="schedulation.refreshRate && schedulation.refreshRate != 'custom'" type="time" v-model="schedulation.refreshTime" :label="$t('managers.workspaceManagement.dataPreparation.dataset.refreshTime')" filled dense :disable="props.readOnly" />
                    <q-input class="col-12" v-if="schedulation.refreshRate === 'custom'" v-model="schedulation.custom" type="text" v-bind="$attrs" bottom-slots filled dense>
                        <template v-slot:hint> <span v-html="$t('knScheduler.customCronHint')"></span></template>
                    </q-input>
                </div>
                <q-banner v-if="schedulation.refreshRate && readableCron" class="col-12 q-mt-sm bg-info text-black" rounded dense>{{ $t('cron.nextExecution', { date: readableCron }) }}</q-banner>
            </q-card-section>
        </q-card>
        <q-table v-if="props.logsVisible" class="col-8" :columns="columns" :rows="props.logs" flat bordered dense>
            <template #body-cell="props">
                <q-td :props="props">
                    <span v-if="props.col.name === 'start' || props.col.name === 'stop'">{{ formatDate(props.value) }}</span>
                    <q-icon v-else-if="props.col.name === 'status'" :name="props.value === 'OK' ? 'check_circle' : 'warning'" size="xs">
                        <q-tooltip v-if="props.row.error" :delay="500">{{ props.row.error }}</q-tooltip>
                    </q-icon>
                    <span v-else>{{ props.value }}</span>
                </q-td>
            </template>
        </q-table>
    </div>
</template>
<script setup lang="ts">
import { generateCron, cronToI18nString, cronToNumber } from './KnSchedulerHelper'
import { ref, defineProps, watch, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import KnSchedulerDescriptor from './KnSchedulerDescriptor.json'

const { t } = useI18n()
const emit = defineEmits(['update:currentCronExpression', 'update:cronExpressionType', 'update:schedulationPaused'])
const props = defineProps({
    cronExpression: {
        required: true
    },
    cronExpressionType: {
        type: String,
        required: true
    },
    logs: {
        required: false
    },
    readOnly: {
        type: Boolean,
        default: false
    },
    schedulationPaused: {
        type: Boolean,
        default: false
    },
    logsVisible: {
        type: Boolean,
        default: true
    }
})
const columns = KnSchedulerDescriptor.columns.map((column) => {
    return { ...column, label: t(column.label) }
})
const cronExpression = ref(props.cronExpression)
const schedulation = reactive({
    enabled: !props.schedulationPaused,
    refreshDays: cronToNumber(props.cronExpression, 'days') || [],
    refreshDay: cronToNumber(props.cronExpression, 'day') || '',
    refreshMonth: cronToNumber(props.cronExpression, 'month') || '',
    refreshTime: cronToNumber(props.cronExpression, 'time') || '',
    refreshRate: props.cronExpressionType || '',
    custom: props.cronExpressionType === 'custom' ? props.cronExpression : ''
})

const resetSchedulation = () => {
    schedulation.refreshDays = []
    schedulation.refreshMonth = ''
    schedulation.refreshTime = ''
    schedulation.refreshDay = ''
    schedulation.custom = ''
}

const readableCron = computed(() => {
    return cronToI18nString(cronExpression.value)
})

function toggleDay(day: string) {
    if (schedulation.refreshDays.includes(day)) {
        schedulation.refreshDays = schedulation.refreshDays.filter((d) => d !== day)
    } else {
        schedulation.refreshDays.push(day)
    }
}

function updateSchedulationType(value: string) {
    emit('update:cronExpressionType', value)
    resetSchedulation()
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat(localStorage.getItem('locale').replace('_', '-'), {
        dateStyle: 'long',
        timeStyle: 'long'
    }).format(new Date(date))
}

watch(schedulation, (newValue) => {
    if (newValue) {
        cronExpression.value = generateCron(newValue)
        emit('update:currentCronExpression', cronExpression.value)
    }
})

const stopPropsWatcher = watch(
    () => props.cronExpression,
    (newValue, oldValue) => {
        if (newValue && newValue !== oldValue && newValue != '') {
            schedulation.enabled = !props.schedulationPaused
            schedulation.refreshDays = cronToNumber(newValue, 'days') || []
            schedulation.refreshDay = cronToNumber(newValue, 'day') || ''
            schedulation.refreshMonth = cronToNumber(newValue, 'month') || ''
            schedulation.refreshTime = cronToNumber(newValue, 'time') || ''
            schedulation.refreshRate = props.cronExpressionType || ''
            schedulation.custom = props.cronExpressionType === 'custom' ? newValue : ''

            stopPropsWatcher()
        }
    }
)
</script>
