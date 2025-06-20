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

<script lang="ts">
import { defineComponent } from 'vue'
import { setInputDataType, getInputStep, formatRegistryNumber } from '@/helpers/commons/tableHelpers'
import { formatDate, getLocale } from '@/helpers/commons/localeHelper'
import { luxonFormatDate, primeVueDate } from '@/helpers/commons/localeHelper'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import registryDatatableDescriptor from '../RegistryDatatableDescriptor.json'
import Textarea from 'primevue/textarea'

export default defineComponent({
    name: 'registry-datatable-editable-field',
    components: { Calendar, Dropdown, InputNumber, Checkbox, Textarea },
    props: {
        comboColumnOptions: { type: Array },
        params: {
            required: true,
            type: Object as any
        }
    },
    emits: ['rowChanged', 'dropdownChanged', 'dropdownOpened'],
    data() {
        return {
            registryDatatableDescriptor,
            row: {} as any,
            column: {} as any,
            columnOptions: [] as any[],
            options: [] as any[],
            useGrouping: false,
            locale: '',
            minFractionDigits: 2,
            maxFractionDigits: 2,
            value: null as any
        }
    },
    computed: {
        getCurrentLocaleDefaultDateFormat() {
            return (column) => column.format || primeVueDate()
        }
    },
    watch: {
        propRow() {
            this.loadRow()
        },
        comboColumnOptions: {
            handler() {
                this.loadColumnOptions()
            },
            deep: true
        }
    },
    mounted() {
        this.$nextTick(() => {
            const inputFocus = this.$refs['input'] as any
            switch (this.getCellType(this.params.colDef)) {
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
    },
    created() {
        this.setDefaultLocale()
        this.column = this.params.colDef
        this.loadRow()
        this.loadColumnOptions()
        this.value = this.getInitialValue()
    },
    methods: {
        loadRow() {
            this.row = this.params.data
        },
        formatNumberConfiguration() {
            const configuration = formatRegistryNumber(this.column)
            if (configuration) {
                this.useGrouping = configuration.useGrouping
                this.minFractionDigits = configuration.minFractionDigits
                this.maxFractionDigits = configuration.maxFractionDigits
            }
        },
        setDefaultLocale() {
            const locale = getLocale()
            this.locale = locale ? locale.replace('_', '-') : ''
        },
        getDataType(columnType: string) {
            return setInputDataType(columnType)
        },
        getStep(dataType: string) {
            return getInputStep(dataType)
        },
        loadColumnOptions() {
            this.columnOptions = this.params.comboColumnOptions as any[]
        },
        getFormattedDate(date: any, format: any, incomingFormat?: string) {
            return formatDate(date, format, incomingFormat)
        },
        onInputNumberChange() {
            setTimeout(() => {
                this.row[this.column.field] = this.value
                this.onRowChanged(this.row)
            }, 250)
        },
        getOptions(column: any, row: any) {
            let options = this.columnOptions && this.columnOptions[column.field] ? this.columnOptions[column.field][row[column.dependences]] : []
            if (!options || options.length === 0) options = this.columnOptions[column.field]['All']
            return options ?? []
        },
        getValue() {
            if (this.column.columnInfo?.type === 'date' || this.column.columnInfo?.type === 'timestamp') return this.returnDateValues()
            return this.value
        },
        returnDateValues() {
            if (!this.value) return ''

            if (this.value instanceof Date) {
                if (this.column.columnInfo?.type === 'timestamp') return luxonFormatDate(this.value, undefined, 'yyyy-MM-dd HH:mm:ss.S')
                else return luxonFormatDate(this.value, undefined, 'yyyy-MM-dd')
            }

            return this.value
        },
        isPopup() {
            switch (this.getCellType(this.params.colDef)) {
                case 'text':
                    return true
                default:
                    return false
            }
        },
        getInitialValue() {
            let startValue = this.params.value
            const isBackspaceOrDelete = this.params.eventKey === 'Backspace' || this.params.eventKey === 'Delete'
            if (isBackspaceOrDelete) return null

            if (this.column.columnInfo?.type === 'date' || this.column.columnInfo?.type === 'timestamp') {
                if (typeof startValue === 'string' && startValue) {
                    if (this.column.columnInfo?.type === 'date') return new Date(luxonFormatDate(startValue, 'yyyy-MM-dd', 'yyyy-MM-dd'))
                    else return new Date(luxonFormatDate(startValue, 'yyyy-MM-dd HH:mm:ss.S', 'yyyy-MM-dd HH:mm:ss.S'))
                }
                if (startValue instanceof Date) return startValue
            }

            return startValue || null
        },
        onRowChanged(payload: any) {
            this.params.context.componentParent.setRowEdited(payload)
            this.params.api.refreshCells()
        },
        onDropdownChange(payload: any) {
            this.params.context.componentParent.onDropdownChange(payload)
        },
        addColumnOptions(payload: any) {
            this.params.context.componentParent.addColumnOptions(payload)
        },
        getCellType(colDef) {
            if (colDef.editorType == 'TEXT' && colDef.columnInfo.type === 'boolean') return 'checkbox'
            if (colDef.editorType !== 'COMBO' && colDef.columnInfo?.type !== 'date' && colDef.columnInfo?.type !== 'timestamp' && setInputDataType(colDef.columnInfo?.type) === 'text') return 'text'
            if (colDef.editorType !== 'COMBO' && colDef.columnInfo?.type !== 'date' && colDef.columnInfo?.type !== 'timestamp' && setInputDataType(colDef.columnInfo?.type) === 'number') return 'number'
            if (colDef.editorType === 'COMBO') return 'dropdown'
            if (colDef.columnInfo?.type === 'date' || colDef.columnInfo?.type === 'timestamp') return 'temporal'
        }
    }
})
</script>

<style lang="scss"></style>
