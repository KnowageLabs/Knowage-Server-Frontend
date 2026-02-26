<template>
    <div class="kn-height-full p-d-flex p-flex-row p-ai-center">
        <Checkbox v-if="getCellType(column) === 'checkbox'" ref="input" v-model="value" class="p-ml-2" :binary="true" />
        <Textarea v-if="getCellType(column) === 'text'" ref="input" v-model="value" class="kn-material-input kn-width-full" rows="4" :step="getStep(column.columnInfo?.type)" maxlength="250" @input="onRowChanged(row)" />
        <InputNumber v-if="getCellType(column) === 'number'" ref="input" v-model="value" class="kn-material-input p-inputtext-sm kn-width-full kn-height-full" :use-grouping="useGrouping" :locale="locale" :min-fraction-digits="minFractionDigits" :max-fraction-digits="maxFractionDigits" :disabled="!column.isEditable" @blur="onInputNumberChange" />
        <Dropdown v-else-if="getCellType(column) === 'dropdown'" ref="input" v-model="value" class="kn-material-input kn-width-full" :options="getOptions(column, row)" option-value="column_1" option-label="column_1" :filter="true" @change="onDropdownChange({ row: row, column: column })" @before-show="addColumnOptions({ row: row, column: column })" />
        <Calendar
            v-else-if="getCellType(column) === 'temporal'"
            ref="input"
            v-model="value"
            class="registry-no-borders kn-width-full kn-height-full"
            :style="registryDatatableDescriptor.pivotStyles.inputFields"
            :show-time="column.columnInfo?.type === 'timestamp'"
            :show-seconds="column.columnInfo?.type === 'timestamp'"
            :show-button-bar="true"
            :date-format="column.columnInfo?.type === 'date' ? getCurrentLocaleDefaultDateFormat(column) : ''"
            @date-select="onRowChanged(row)"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { setInputDataType, getInputStep, formatRegistryNumber } from '@/helpers/commons/tableHelpers'
import { getLocale, luxonFormatDate, primeVueDate } from '@/helpers/commons/localeHelper'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'
import registryDatatableDescriptor from '../RegistryDatatableDescriptor.json'

const props = defineProps<{
    comboColumnOptions?: any[]
    params: any
}>()

const input = ref<any>(null)
const row = ref<any>({})
const column = ref<any>({})
const columnOptions = ref<any[]>([])
const useGrouping = ref(false)
const locale = ref('')
const minFractionDigits = ref(2)
const maxFractionDigits = ref(2)
const value = ref<any>(null)

const getCurrentLocaleDefaultDateFormat = computed(() => (col: any) => col.format || primeVueDate())

function loadRow() {
    row.value = props.params.data
}

function formatNumberConfiguration() {
    const configuration = formatRegistryNumber(column.value)
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
    columnOptions.value = props.params.comboColumnOptions as any[]
}

function onInputNumberChange() {
    setTimeout(() => {
        row.value[column.value.field] = value.value
        onRowChanged(row.value)
    }, 250)
}

function getOptions(col: any, rowVal: any) {
    let opts = columnOptions.value && columnOptions.value[col.field] ? columnOptions.value[col.field][rowVal[col.dependences]] : []
    if (!opts || opts.length === 0) opts = columnOptions.value[col.field]['All']
    return opts ?? []
}

function getValue() {
    if (column.value.columnInfo?.type === 'date' || column.value.columnInfo?.type === 'timestamp') return returnDateValues()
    return value.value
}

function returnDateValues() {
    if (!value.value) return ''
    if (value.value instanceof Date) {
        if (column.value.columnInfo?.type === 'timestamp') return luxonFormatDate(value.value, undefined, 'yyyy-MM-dd HH:mm:ss.S')
        else return luxonFormatDate(value.value, undefined, 'yyyy-MM-dd')
    }
    return value.value
}

function isPopup() {
    switch (getCellType(props.params.colDef)) {
        case 'text':
            return true
        default:
            return false
    }
}

function getInitialValue() {
    let startValue = props.params.value
    const isBackspaceOrDelete = props.params.eventKey === 'Backspace' || props.params.eventKey === 'Delete'
    if (isBackspaceOrDelete) return null
    if (column.value.columnInfo?.type === 'date' || column.value.columnInfo?.type === 'timestamp') {
        if (typeof startValue === 'string' && startValue) {
            if (column.value.columnInfo?.type === 'date') return new Date(luxonFormatDate(startValue, 'yyyy-MM-dd', 'yyyy-MM-dd'))
            else return new Date(luxonFormatDate(startValue, 'yyyy-MM-dd HH:mm:ss.S', 'yyyy-MM-dd HH:mm:ss.S'))
        }
        if (startValue instanceof Date) return startValue
    }
    return startValue || null
}

function onRowChanged(payload: any) {
    props.params.context.componentParent.setRowEdited(payload)
    props.params.api.refreshCells()
}

function onDropdownChange(payload: any) {
    props.params.context.componentParent.onDropdownChange(payload)
}

function addColumnOptions(payload: any) {
    props.params.context.componentParent.addColumnOptions(payload)
}

function getCellType(colDef: any) {
    if (colDef.editorType == 'TEXT' && colDef.columnInfo.type === 'boolean') return 'checkbox'
    if (colDef.editorType !== 'COMBO' && colDef.columnInfo?.type !== 'date' && colDef.columnInfo?.type !== 'timestamp' && setInputDataType(colDef.columnInfo?.type) === 'text') return 'text'
    if (colDef.editorType !== 'COMBO' && colDef.columnInfo?.type !== 'date' && colDef.columnInfo?.type !== 'timestamp' && setInputDataType(colDef.columnInfo?.type) === 'number') return 'number'
    if (colDef.editorType === 'COMBO') return 'dropdown'
    if (colDef.columnInfo?.type === 'date' || colDef.columnInfo?.type === 'timestamp') return 'temporal'
}

watch(
    () => props.comboColumnOptions,
    () => loadColumnOptions(),
    { deep: true }
)

onMounted(() => {
    setDefaultLocale()
    column.value = props.params.colDef
    loadRow()
    loadColumnOptions()
    value.value = getInitialValue()
    formatNumberConfiguration()

    nextTick(() => {
        const inputFocus = input.value as any
        if (!inputFocus) return
        switch (getCellType(props.params.colDef)) {
            case 'text':
                return inputFocus.$el.focus()
            case 'checkbox':
            case 'dropdown':
            case 'temporal':
            case 'number':
                return inputFocus.$el.children[0].focus()
            default:
                return inputFocus.$el.focus()
        }
    })
})

defineExpose({ getValue, isPopup })
</script>

<style lang="scss"></style>
