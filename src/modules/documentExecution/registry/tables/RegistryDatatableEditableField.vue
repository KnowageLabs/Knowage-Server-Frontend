<template>
    <InputText v-if="column && column.editorType !== 'COMBO' && column.columnInfo?.type !== 'date' && column.columnInfo?.type !== 'timestamp' && getDataType(column.columnInfo?.type) === 'text'" v-model="row[column.field]" class="kn-material-input" :type="'text'" :step="getStep(column.columnInfo?.type)" @input="$emit('rowChanged', row)" />
    <InputNumber v-if="column && column.editorType !== 'COMBO' && column.columnInfo?.type !== 'date' && column.columnInfo?.type !== 'timestamp' && getDataType(column.columnInfo?.type) === 'number'" v-model="row[column.field]" class="kn-material-input p-inputtext-sm" :use-grouping="useGrouping" :locale="locale" :min-fraction-digits="minFractionDigits" :max-fraction-digits="maxFractionDigits" :disabled="!column.isEditable" @blur="onInputNumberChange">
    </InputNumber>
    <Dropdown v-else-if="column && column.editorType === 'COMBO'" v-model="row[column.field]" class="kn-material-input" :options="getOptions(column, row)" option-value="column_1" option-label="column_1" :filter="true" @change="$emit('dropdownChanged', { row: row, column: column })" @before-show="$emit('dropdownOpened', { row: row, column: column })"> </Dropdown>
    <Calendar
        v-else-if="column && (column.columnInfo?.type === 'date' || column.columnInfo?.type === 'timestamp')"
        v-model="row[column.field]"
        :style="registryDatatableDescriptor.pivotStyles.inputFields"
        class="pivot-calendar"
        :show-time="column.columnInfo?.type === 'timestamp'"
        :show-seconds="column.columnInfo?.type === 'timestamp'"
        :show-button-bar="true"
        :date-format="column.columnInfo?.type === 'date' ? getCurrentLocaleDefaultDateFormat(column) : ''"
        @date-select="$emit('rowChanged', row)"
    />
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { setInputDataType, getInputStep, formatRegistryNumber } from '@/helpers/commons/tableHelpers'
import { getLocale, luxonFormatDate, primeVueDate } from '@/helpers/commons/localeHelper'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import registryDatatableDescriptor from './RegistryDatatableDescriptor.json'

const props = defineProps<{
    column?: any
    propRow?: any
    comboColumnOptions?: any[]
}>()

const emit = defineEmits<{
    (e: 'rowChanged', row: any): void
    (e: 'dropdownChanged', payload: any): void
    (e: 'dropdownOpened', payload: any): void
}>()

const row = ref<any>({})
const columnOptions = ref<any[]>([])
const useGrouping = ref(false)
const locale = ref('')
const minFractionDigits = ref(2)
const maxFractionDigits = ref(2)

const getCurrentLocaleDefaultDateFormat = computed(() => (column: any) => column.format || primeVueDate())

function loadRow() {
    row.value = props.propRow
    if (props.column && (row.value[props.column.field] || row.value[props.column.field] === 0 || row.value[props.column.field] === '')) {
        if (props.column.columnInfo?.type === 'date' && typeof row.value[props.column.field] === 'string') {
            row.value[props.column.field] = row.value[props.column.field] ? new Date(luxonFormatDate(row.value[props.column.field], 'yyyy-MM-dd', 'yyyy-MM-dd')) : null
        } else if (props.column.columnInfo?.type === 'timestamp' && typeof row.value[props.column.field] === 'string' && row.value[props.column.field] !== '') {
            row.value[props.column.field] = new Date(luxonFormatDate(row.value[props.column.field], 'yyyy-MM-dd HH:mm:ss.S', 'yyyy-MM-dd HH:mm:ss.S'))
        } else if (props.column.editorType !== 'COMBO' && props.column.columnInfo?.type !== 'date' && props.column.columnInfo?.type !== 'timestamp' && getDataType(props.column.columnInfo?.type) === 'number') {
            formatNumberConfiguration()
        }
    }
}

function formatNumberConfiguration() {
    const configuration = formatRegistryNumber(props.column)
    if (configuration) {
        useGrouping.value = configuration.useGrouping
        minFractionDigits.value = configuration.minFractionDigits
        maxFractionDigits.value = configuration.maxFractionDigits
    }
}

function setDefaultLocale() {
    const loc = getLocale()
    locale.value = loc ? loc.replace('_', '-') : ''
}

function getDataType(columnType: string) {
    return setInputDataType(columnType)
}

function getStep(dataType: string) {
    return getInputStep(dataType)
}

function loadColumnOptions() {
    columnOptions.value = props.comboColumnOptions as any[]
}

function onInputNumberChange() {
    setTimeout(() => emit('rowChanged', row.value), 250)
}

function getOptions(column: any, rowVal: any) {
    let opts = columnOptions.value && columnOptions.value[column.field] ? columnOptions.value[column.field][rowVal[column.dependences]] : []
    if (!opts || opts.length === 0) opts = columnOptions.value[column.field]['All']
    return opts ?? []
}

watch(
    () => props.propRow,
    () => loadRow()
)
watch(
    () => props.comboColumnOptions,
    () => loadColumnOptions(),
    { deep: true }
)

onMounted(() => {
    setDefaultLocale()
    loadRow()
    loadColumnOptions()
})
</script>

<style scoped lang="scss">
.p-component {
    &.pivot-calendar,
    &.p-inputtext,
    &.p-dropdown,
    &.p-datepicker {
        border: none !important;
        background-color: transparent !important;
        width: 100% !important;
    }
}

.p-inputnumber,
.p-calendar {
    &:deep(.p-inputtext) {
        border: none !important;
        background-color: transparent !important;
        width: 100% !important;
    }
}
</style>
