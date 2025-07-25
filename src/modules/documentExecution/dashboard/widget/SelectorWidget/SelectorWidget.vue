<template>
    <div v-if="options" class="selector-widget dashboard-scrollbar">
        <div v-if="widgetType === 'singleValue'" :class="getLayoutStyle()">
            <div v-for="(value, index) of showMode === 'hideDisabled' ?  options.rows.filter((row: any) => !row.disabled) : options.rows" :key="index" class="multi-select p-p-1" :style="getLabelStyle() + getGridWidth()">
                <RadioButton v-model="selectedValue" :input-id="`radio-${index}`" class="p-mr-2" :name="value.column_1" :value="value.column_1" :disabled="showMode === 'showDisabled' && value.disabled" @change="singleValueSelectionChanged" />
                <label :for="`radio-${index}`" class="multi-select-label">{{ value.column_1 }}</label>
            </div>
        </div>

        <div v-if="widgetType === 'multiValue'" :class="getLayoutStyle()">
            <div v-for="(value, index) of showMode === 'hideDisabled' ?  options.rows.filter((row: any) => !row.disabled) : options.rows" :key="index" class="multi-select p-p-1" :style="getLabelStyle() + getGridWidth()">
                <Checkbox v-model="selectedValues" :input-id="`multi-${index}`" class="p-mr-2" :name="value.column_1" :value="value.column_1" :disabled="showMode === 'showDisabled' && value.disabled" @change="multiValueSelectionChanged" />
                <label :for="`multi-${index}`" class="multi-select-label">{{ value.column_1 }}</label>
            </div>
        </div>

        <span v-if="widgetType === 'dropdown'" class="p-float-label p-m-2">
            <Dropdown v-model="selectedValue" class="kn-width-full" panel-class="selectorCustomDropdownPanel" :options="showMode === 'hideDisabled' ?  options.rows.filter((row: any) => !row.disabled) : options.rows" option-label="column_1" option-value="column_1" :style="getLabelStyle()" :input-style="getLabelStyle()" :panel-style="getLabelStyle()" :option-disabled="showMode === 'showDisabled' ? 'disabled' : ''" @change="singleValueSelectionChanged" />
        </span>

        <span v-if="widgetType === 'multiDropdown'" class="p-float-label p-m-2">
            <MultiSelect
                v-model="selectedValues"
                class="kn-width-full"
                panel-class="selectorCustomDropdownPanel"
                :options="showMode === 'hideDisabled' ?  options.rows.filter((row: any) => !row.disabled) : options.rows"
                option-label="column_1"
                option-value="column_1"
                :style="getLabelStyle()"
                :input-style="getLabelStyle()"
                :panel-style="getLabelStyle()"
                :filter="true"
                :option-disabled="showMode === 'showDisabled' ? 'disabled' : ''"
                @change="multiValueSelectionChanged"
            />
        </span>

        <span v-if="widgetType === 'date'" class="p-float-label p-m-2">
            <Calendar v-model="selectedDate" class="kn-material-input kn-width-full" :min-date="getDateRange('startDate')" :max-date="getDateRange('endDate')" :show-icon="true" @date-select="dateSelectionChanged" />
            <label class="kn-material-input-label">
                {{ $t('common.date') }}
            </label>
        </span>

        <div v-if="widgetType === 'dateRange'" :class="getLayoutStyle()">
            <span class="p-float-label p-m-2" :style="getGridWidth()">
                <Calendar v-model="startDate" class="kn-width-full" :min-date="getDateRange('startDate')" :max-date="getDateRange('endDate')" :style="getLabelStyle()" :input-style="getLabelStyle()" :panel-style="getLabelStyle()" :show-icon="true" @date-select="dateRangeSelectionChanged" />
            </span>
            <span class="p-float-label p-m-2" :style="getGridWidth()">
                <Calendar v-model="endDate" class="kn-width-full" :min-date="getDateRange('startDate')" :max-date="getDateRange('endDate')" :style="getLabelStyle()" :input-style="getLabelStyle()" :panel-style="getLabelStyle()" :show-icon="true" @date-select="dateRangeSelectionChanged" />
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, ISelection, IWidget } from '../../Dashboard'
import { mapActions } from 'pinia'
import { getWidgetStyleByType } from '../TableWidget/TableWidgetHelper'
import { updateStoreSelections } from '../interactionsHelpers/InteractionHelper'
import { emitter } from '../../DashboardHelpers'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Calendar from 'primevue/calendar'
import store from '../../Dashboard.store'
import deepcopy from 'deepcopy'
import moment from 'moment'
import dashboardDescriptor from '../../DashboardDescriptor.json'

export default defineComponent({
    name: 'datasets-catalog-datatable',
    components: { Checkbox, RadioButton, Dropdown, MultiSelect, Calendar },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        dataToShow: { type: Object as any, required: true },
        widgetInitialData: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        selectionIsLocked: { type: Boolean, required: true },
        editorMode: { type: Boolean }
    },
    emits: ['close'],
    data() {
        return {
            dashboardDescriptor,
            initialOptions: { rows: [] } as any,
            options: { rows: [] } as any,
            selectedValue: null as any,
            selectedValues: [] as any,
            selectedDate: null as any,
            selectedDateRange: null as any,
            startDate: null as any,
            endDate: null as any,
            activeSelections: [] as ISelection[]
        }
    },
    computed: {
        widgetType(): string {
            return this.propWidget.settings.configuration.selectorType.modality || null
        },
        showMode(): string {
            if (this.propWidget.settings.configuration.valuesManagement.hideDisabled) return 'hideDisabled'
            else if (this.propWidget.settings.configuration.valuesManagement.enableAll) return 'enableAll'
            else return 'showDisabled'
        }
    },
    watch: {
        propActiveSelections() {
            this.loadActiveSelections()
        },
        dataToShow() {
            this.loadOptions()
        },
        widgetInitialData() {
            this.loadInitialValues()
        },
        widgetType() {
            this.updateDefaultValues()
        }
    },
    created() {
        this.setEventListeners()
        this.loadActiveSelections()
        this.loadInitialValues()
        this.loadActiveSelectionValue()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(store, ['setSelections']),
        setEventListeners() {
            emitter.on('widgetUnlocked', this.onSelectionsDeleted)
            emitter.on('selectionsDeleted', this.onSelectionsDeleted)
        },
        removeEventListeners() {
            emitter.off('widgetUnlocked', this.onSelectionsDeleted)
            emitter.off('selectionsDeleted', this.onSelectionsDeleted)
        },
        loadInitialValues() {
            this.initialOptions = deepcopy(this.widgetInitialData)
            this.loadOptions()
        },
        loadOptions() {
            this.loadAvailableOptions(this.dataToShow)
        },
        //note - checks initialOptions and dataToShow, merges them into one array of options, disabling fields that were not in dataToShow
        loadAvailableOptions(dataToShow: any) {
            this.options = { rows: [] }
            if (!dataToShow || !dataToShow.rows) return
            this.initialOptions?.rows?.forEach((initialOption: any) => {
                const index = dataToShow.rows.findIndex((row: any) => row.column_1 === initialOption.column_1)
                this.options.rows.push({ ...initialOption, disabled: index === -1 })
            })
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        loadActiveSelectionValue() {
            if (this.editorMode) return false
            const index = this.activeSelections.findIndex((selection: ISelection) => selection.datasetId === this.propWidget.dataset && selection.columnName === this.propWidget.columns[0]?.columnName)
            if (index !== -1) {
                const selection = this.activeSelections[index]
                switch (this.widgetType) {
                    case 'singleValue':
                    case 'dropdown':
                        this.selectedValue = selection.value[0]
                        break
                    case 'multiValue':
                    case 'multiDropdown':
                        this.selectedValues = selection.value
                        break
                    case 'date':
                        this.selectedDate = selection.value[0] ? moment(selection.value[0], dashboardDescriptor.selectionsDateFormat).toDate() : null
                        break
                    case 'dateRange':
                        this.loadDateRangeInitialValues(selection)
                }
                return true
            } else return false
        },
        loadDateRangeInitialValues(selection: ISelection) {
            let minDateAsMilliseconds = null as number | null
            let maxDateAsMilliseconds = null as number | null
            selection.value.forEach((value: string | number) => {
                const tempSelectionValue = moment(value, dashboardDescriptor.selectionsDateMultiFormat).valueOf()
                if (!minDateAsMilliseconds || tempSelectionValue < minDateAsMilliseconds) minDateAsMilliseconds = tempSelectionValue
                if (!maxDateAsMilliseconds || tempSelectionValue > maxDateAsMilliseconds) maxDateAsMilliseconds = tempSelectionValue
            })
            this.startDate = minDateAsMilliseconds ? new Date(minDateAsMilliseconds) : this.startDate
            this.endDate = maxDateAsMilliseconds ? new Date(maxDateAsMilliseconds) : this.endDate
        },
        updateDefaultValues() {
            if (!this.propWidget.settings.configuration.defaultValues.enabled) {
                this.removeDeafultValues()
            }
        },
        removeDeafultValues() {
            this.selectedValue = null
            this.selectedValues = []
            this.selectedDate = null
            this.startDate = null
            this.endDate = null
        },
        findFirstAvailableValue() {
            if (this.showMode === 'enableAll') return this.options.rows[0]
            const index = this.options.rows.findIndex((row: any) => !row.disabled)
            return index !== -1 ? this.options.rows[index] : null
        },
        findLastAvailableValue() {
            if (this.showMode === 'enableAll') return this.options.rows[this.options.rows.length - 1]
            const index = this.options.rows.findLastIndex((row: any) => !row.disabled)
            return index !== -1 ? this.options.rows[index] : null
        },
        setDefaultStaticValue(multivalue: boolean) {
            const staticValue = this.propWidget.settings.configuration.defaultValues?.value ?? ''
            if (!staticValue || !this.options.rows) {
                this.selectedValue = null
                this.selectedValues = []
                return
            }

            multivalue ? this.setDefaultStaticMultivalue(staticValue) : this.setDefaultStaticSinglevalue(staticValue)
        },
        setDefaultStaticSinglevalue(staticValue: string) {
            const index = this.options.rows.findIndex((option: any) => staticValue.trim() === option.column_1.trim())
            if (index !== -1) {
                this.selectedValue = this.options.rows[index].column_1
            } else {
                this.selectedValue = null
            }
        },
        setDefaultStaticMultivalue(staticValue: string) {
            const tempStaticValues = staticValue.split(',')
            if (tempStaticValues.length > 0) {
                tempStaticValues.forEach((tempStaticValue: string) => {
                    const index = this.options.rows.findIndex((option: any) => tempStaticValue.trim() === option.column_1.trim())
                    if (index !== -1) {
                        this.selectedValues = this.selectedValues.length === 0 ? [this.options.rows[index].column_1] : [...this.selectedValues, this.options.rows[index].column_1]
                    }
                })
            } else {
                this.selectedValues = []
            }
        },
        getLayoutStyle() {
            const selectorType = this.propWidget.settings.configuration.selectorType
            if (selectorType.alignment) {
                switch (selectorType.alignment) {
                    case 'vertical':
                        return 'vertical-layout'
                    case 'horizontal':
                        return 'horizontal-layout'
                    case 'grid':
                        return 'grid-layout'
                    default:
                        break
                }
            }
        },
        getGridWidth() {
            const gridWidth = this.propWidget.settings.configuration.selectorType.columnSize
            if (gridWidth != '') return `width: ${gridWidth}`
            else return ''
        },
        getDateRange(rangeValue: string) {
            const dateRange = this.propWidget.settings.configuration.defaultValues
            if (dateRange[rangeValue]) return new Date(dateRange[rangeValue])
            else return undefined
        },
        getLabelStyle() {
            return getWidgetStyleByType(this.propWidget, 'label')
        },
        getBackgroundColor() {
            return getWidgetStyleByType(this.propWidget, 'background')
        },
        singleValueSelectionChanged() {
            if (this.editorMode) return
            updateStoreSelections(this.createNewSelection([this.selectedValue]), this.activeSelections, this.dashboardId, this.setSelections, this.$http)
        },
        multiValueSelectionChanged() {
            if (this.editorMode) return
            const tempSelection = this.createNewSelection(this.selectedValues) as ISelection

            this.updateActiveSelectionsWithMultivalueSelection(tempSelection)
        },
        dateSelectionChanged() {
            if (this.editorMode) return
            updateStoreSelections(this.createNewSelection([moment(deepcopy(this.selectedDate)).format(dashboardDescriptor.selectionsDateFormat)]), this.activeSelections, this.dashboardId, this.setSelections, this.$http)
        },
        dateRangeSelectionChanged() {
            if (this.editorMode) return
            const tempDateValues = [] as string[]
            for (let i = 0; i < this.initialOptions.rows.length; i++) {
                const iniitalOption = this.initialOptions.rows[i].column_1
                const tempDate = moment(iniitalOption, dashboardDescriptor.selectionsDateMultiFormat).valueOf()
                if ((!this.startDate || tempDate >= this.startDate.getTime()) && (!this.endDate || tempDate <= this.endDate.getTime())) tempDateValues.push(iniitalOption)
            }
            const tempSelection = this.createNewSelection(tempDateValues)
            updateStoreSelections(tempSelection, this.activeSelections, this.dashboardId, this.setSelections, this.$http)
        },
        updateActiveSelectionsWithMultivalueSelection(tempSelection: ISelection) {
            const index = this.activeSelections.findIndex((activeSelection: ISelection) => activeSelection.datasetId === tempSelection.datasetId && activeSelection.columnName === tempSelection.columnName)
            if (index !== -1) {
                this.activeSelections[index] = tempSelection
            } else {
                this.activeSelections.push(tempSelection)
            }
        },
        createNewSelection(value: (string | number)[]) {
            return { datasetId: this.propWidget.dataset as number, datasetLabel: this.getDatasetLabel(this.propWidget.dataset as number), columnName: this.propWidget.columns[0]?.columnName ?? '', value: value, aggregated: false, timestamp: new Date().getTime() } as ISelection
        },
        getDatasetLabel(datasetId: number) {
            const index = this.datasets.findIndex((dataset: IDataset) => dataset.id.dsId == datasetId)
            return index !== -1 ? this.datasets[index].label : ''
        },
        onSelectionsDeleted(selections: any) {
            const index = selections.findIndex((selection: ISelection) => selection.datasetId === this.propWidget.dataset && selection.columnName === this.propWidget.columns[0]?.columnName)
            if (index !== -1) this.removeDeafultValues()
        }
    }
})
</script>
