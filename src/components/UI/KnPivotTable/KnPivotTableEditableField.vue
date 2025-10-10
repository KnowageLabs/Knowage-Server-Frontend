<template>
    <div class="editable-field-container" v-if="column">
        <InputNumber v-if="typeof row[column.field].data === 'number'" v-model="row[column.field].data" :style="knPivotTableDescriptor.pivotStyles.inputFields" class="kn-material-input" :use-grouping="useGrouping" :min-fraction-digits="minFractionDigits" :max-fraction-digits="maxFractionDigits" :disabled="!column.isEditable" :locale="locale" @input="$emit('rowChanged', row)" />
        <InputText v-else-if="column.editorType !== 'COMBO' && column.columnInfo.type !== 'date' && column.columnInfo.type !== 'timestamp'" v-model="row[column.field].data" :style="knPivotTableDescriptor.pivotStyles.inputFields" class="kn-material-input" :type="setDataType(column.columnInfo.type)" @input="$emit('rowChanged', row)" />
        <Calendar
            v-else-if="column.columnInfo.type === 'date' || column.columnInfo.type === 'timestamp'"
            v-model="row[column.field].data"
            :style="knPivotTableDescriptor.pivotStyles.inputFields"
            class="pivot-calendar"
            :show-time="column.columnInfo.type === 'timestamp'"
            :show-seconds="column.columnInfo.type === 'timestamp'"
            :show-button-bar="true"
            :date-format="column.columnInfo.type === 'date' ? getCurrentLocaleDefaultDateFormat(column) : ''"
            @date-select="$emit('rowChanged', row)"
        />
        <Dropdown v-else-if="column.editorType === 'COMBO'" v-model="row[column.field].data" class="kn-material-input" :options="columnOptions[column.field] ? columnOptions[column.field][row[column.dependences]?.data] : []" :placeholder="$t('documentExecution.registry.select')" @change="$emit('dropdownChanged', { row: row, column: column })" @before-show="$emit('dropdownOpened', { row: row, column: column })">
            <template #value="slotProps">
                <div v-if="slotProps.value">
                    <span>{{ slotProps.value }}</span>
                </div>
            </template>
            <template #option="slotProps">
                <div>
                    <span>{{ slotProps.option['column_1'] }}</span>
                </div>
            </template>
        </Dropdown>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { setInputDataType, getInputStep, formatRegistryNumber } from '@/helpers/commons/tableHelpers'
import { formatDate, getLocale } from '@/helpers/commons/localeHelper'
import { luxonFormatDate, primeVueDate } from '@/helpers/commons/localeHelper'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import knPivotTableDescriptor from '@/components/UI/KnPivotTable/KnPivotTableDescriptor.json'
import InputNumber from 'primevue/inputnumber'

export default defineComponent({
    name: 'kn-pivot-table-editable-field',
    components: { Calendar, Dropdown, InputNumber },
    props: { column: { type: Object }, propRow: { type: Object }, comboColumnOptions: { type: Array } },
    emits: ['rowChanged', 'dropdownChanged', 'dropdownOpened'],
    data() {
        return {
            knPivotTableDescriptor,
            row: {} as any,
            columnOptions: [] as any[],
            useGrouping: false,
            locale: '',
            minFractionDigits: 2,
            maxFractionDigits: 2
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
    created() {
        this.loadRow()
        this.loadColumnOptions()
        this.formatNumberConfiguration()
        this.setDefaultLocale()
    },
    methods: {
        loadRow() {
            this.row = this.propRow
            if (this.column && (this.row[this.column.field] || this.row[this.column.field] === 0 || this.row[this.column.field] === '')) {
                if (this.column.columnInfo?.type === 'date' && typeof this.row[this.column.field] === 'string') {
                    this.row[this.column.field] = this.row[this.column.field] ? new Date(luxonFormatDate(this.row[this.column.field], 'yyyy-MM-dd', 'yyyy-MM-dd')) : null
                } else if (this.column.columnInfo?.type === 'timestamp' && typeof this.row[this.column.field] === 'string' && this.row[this.column.field] !== '') {
                    this.row[this.column.field] = new Date(luxonFormatDate(this.row[this.column.field], 'yyyy-MM-dd HH:mm:ss.S', 'yyyy-MM-dd HH:mm:ss.S'))
                } else if (this.column.editorType !== 'COMBO' && this.column.columnInfo?.type !== 'date' && this.column.columnInfo?.type !== 'timestamp' && this.getDataType(this.column.columnInfo?.type) === 'number') {
                    this.formatNumberConfiguration()
                }
            }
        },
        setDataType(columnType: string) {
            return setInputDataType(columnType)
        },
        getStep(dataType: string) {
            return getInputStep(dataType)
        },
        loadColumnOptions() {
            this.columnOptions = this.comboColumnOptions as any[]
        },
        getFormattedDate(date: any, format: any) {
            return formatDate(date, format)
        },
        getLocaleString() {
            const currentLocale = getLocale()
            const localeMap = {
                de_DE: 'de-DE',
                en_GB: 'en-GB',
                en_US: 'en-US',
                es_ES: 'es-ES',
                fr_FR: 'fr-FR',
                it_IT: 'it-IT',
                pt_BR: 'pt-BR',
                'zh_CN_#Hans': 'zh-CN'
            }

            return localeMap[currentLocale] || 'en-US' // fallback to en-US
        },
        getDataType(columnType: string) {
            return setInputDataType(columnType)
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
        }
    }
})
</script>

<style scoped>
.editable-field-container {
    .p-dropdown {
        width: 100%;
    }
    :deep(.p-component, p-dropdown) {
        border: none;
        background-color: transparent;
        width: 100% !important;
    }
}
</style>
