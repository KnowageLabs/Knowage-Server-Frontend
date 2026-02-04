<template>
    <!-- {{ widgetType }} -->
    <!-- {{ selectedValue }} - {{ selectedValues }} - {{ selectedDate }} - {{ startDate }} - {{ endDate }} -->
    <div v-if="options" class="selector-widget dashboard-scrollbar">
        <RadioSelector v-if="widgetType === 'singleValue'" :model-value="selectedValue" :options="singleValueOptions" :radio-style="propWidget.settings.style.radio" @update:model-value="radioSelectorChanged" />

        <CheckboxSelector v-if="widgetType === 'multiValue'" :model-value="selectedValues" :options="multiValueOptions" :checkbox-style="propWidget.settings.style.checkbox" @update:model-value="checkboxSelectorChanged" />

        <span v-if="widgetType === 'dropdown'" class="p-float-label p-m-2">
            <Dropdown v-model="selectedValue" filter class="kn-width-full" panel-class="selectorCustomDropdownPanel" :options="filteredDropdownOptions" option-label="column_1" option-value="column_1" :style="getLabelStyle()" :input-style="getLabelStyle()" :panel-style="getLabelStyle()" :option-disabled="showMode === 'showDisabled' ? 'disabled' : ''" @change="singleValueSelectionChanged" @filter="filterDropdownOptions" />
        </span>

        <span v-if="widgetType === 'multiDropdown'" class="p-float-label p-m-2">
            <MultiSelect v-model="selectedValues" class="kn-width-full" panel-class="selectorCustomDropdownPanel" :options="filteredMultiSelectOptions" option-label="column_1" option-value="column_1" :style="getLabelStyle()" :input-style="getLabelStyle()" :panel-style="getLabelStyle()" :filter="true" :option-disabled="showMode === 'showDisabled' ? 'disabled' : ''" @change="multiValueSelectionChanged" @filter="filterMultiSelectOptions" />
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
import RadioSelector from './selectorTypes/RadioSelector.vue'
import CheckboxSelector from './selectorTypes/CheckboxSelector.vue'
import { QRadio, QCheckbox } from 'quasar'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Calendar from 'primevue/calendar'
import store from '../../Dashboard.store'
import deepcopy from 'deepcopy'
import moment from 'moment'
import dashboardDescriptor from '../../DashboardDescriptor.json'

export default defineComponent({
    name: 'datasets-catalog-datatable',
    components: { RadioSelector, CheckboxSelector, QRadio, QCheckbox, Dropdown, MultiSelect, Calendar },
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
            filteredDropdownOptions: [] as any[],
            filteredMultiSelectOptions: [] as any[],
            filterTimeout: null as any,
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
        },
        singleValueOptions(): any[] {
            return this.getFilteredOptionsForDisplay().map((row: any) => ({
                label: row.column_1,
                value: row.column_1,
                disable: this.showMode === 'showDisabled' && row.disabled
            }))
        },
        multiValueOptions(): any[] {
            return this.getFilteredOptionsForDisplay().map((row: any) => ({
                label: row.column_1,
                value: row.column_1,
                disable: this.showMode === 'showDisabled' && row.disabled
            }))
        }
    },
    watch: {
        propActiveSelections() {
            this.loadActiveSelections()
        },
        dataToShow() {
            this.loadAvailableOptions(this.dataToShow)
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
        this.updateFilteredOptionsWithSelectedValue()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(store, ['setSelections']),
        getFilteredOptionsForDisplay(): any[] {
            if (this.showMode === 'hideDisabled') {
                return this.options.rows.filter((row: any) => !row.disabled)
            }
            return this.options.rows
        },
        setEventListeners() {
            emitter.on('widgetUnlocked', this.onSelectionsDeleted)
            emitter.on('selectionsDeleted', this.onSelectionsDeleted)
        },
        removeEventListeners() {
            emitter.off('widgetUnlocked', this.onSelectionsDeleted)
            emitter.off('selectionsDeleted', this.onSelectionsDeleted)
        },
        loadInitialValues() {
            // this.initialOptions = deepcopy(this.widgetInitialData) // potentially not needed, leaving it for reference
            this.initialOptions = this.widgetInitialData
            this.loadAvailableOptions(this.dataToShow)
        },
        loadAvailableOptions(dataToShow: any) {
            this.options = { rows: [] }
            if (!dataToShow || !dataToShow.rows) return

            const dataToShowSet = new Set(dataToShow.rows.map((row: any) => row.column_1))
            const newRows =
                this.initialOptions?.rows?.map((initialOption: any) => ({
                    ...initialOption,
                    disabled: !dataToShowSet.has(initialOption.column_1)
                })) || []

            this.options.rows = newRows

            const baseOptions = this.showMode === 'hideDisabled' ? newRows.filter((row: any) => !row.disabled) : newRows
            this.filteredDropdownOptions = this.getInitialDropdownOptions(baseOptions)
            this.filteredMultiSelectOptions = this.getInitialMultiSelectOptions(baseOptions)
        },
        getInitialDropdownOptions(baseOptions: any[]) {
            const limited = baseOptions.slice(0, 500)

            // for large sets, if selected value is not in the limited set, include it
            if (this.selectedValue && !limited.find((opt: any) => opt.column_1 === this.selectedValue)) {
                const selectedOption = baseOptions.find((opt: any) => opt.column_1 === this.selectedValue)
                if (selectedOption) {
                    return [selectedOption, ...limited.slice(0, 499)]
                }
            }

            return limited
        },
        getInitialMultiSelectOptions(baseOptions: any[]) {
            const limited = baseOptions.slice(0, 500)
            const selectedOptions: any[] = []

            // for large sets, if selected values are not in the limited set, include them
            if (this.selectedValues && this.selectedValues.length > 0) {
                this.selectedValues.forEach((val: any) => {
                    if (!limited.find((opt: any) => opt.column_1 === val)) {
                        const selectedOption = baseOptions.find((opt: any) => opt.column_1 === val)
                        if (selectedOption) {
                            selectedOptions.push(selectedOption)
                        }
                    }
                })
            }

            // remove duplicates in case selectedOptions are already in limited
            if (selectedOptions.length > 0) {
                return [...selectedOptions, ...limited.slice(0, 500 - selectedOptions.length)]
            }

            return limited
        },
        updateFilteredOptionsWithSelectedValue() {
            const baseOptions = this.showMode === 'hideDisabled' ? this.options.rows.filter((row: any) => !row.disabled) : this.options.rows

            if (this.widgetType === 'dropdown' && this.selectedValue) {
                this.filteredDropdownOptions = this.getInitialDropdownOptions(baseOptions)
            }

            if (this.widgetType === 'multiDropdown' && this.selectedValues?.length > 0) {
                this.filteredMultiSelectOptions = this.getInitialMultiSelectOptions(baseOptions)
            }
        },
        filterDropdownOptions(event: any) {
            if (this.filterTimeout) clearTimeout(this.filterTimeout)

            const input = event.value.toLowerCase()
            const baseOptions = this.showMode === 'hideDisabled' ? this.options.rows.filter((row: any) => !row.disabled) : this.options.rows

            this.filterTimeout = setTimeout(() => {
                if (input.length >= 2) {
                    this.filteredDropdownOptions = baseOptions.filter((row: any) => row.column_1.toString().toLowerCase().indexOf(input) > -1)
                } else {
                    this.filteredDropdownOptions = this.getInitialDropdownOptions(baseOptions)
                }
            }, 300)
        },
        filterMultiSelectOptions(event: any) {
            if (this.filterTimeout) clearTimeout(this.filterTimeout)

            const input = event.value.toLowerCase()
            const baseOptions = this.showMode === 'hideDisabled' ? this.options.rows.filter((row: any) => !row.disabled) : this.options.rows

            this.filterTimeout = setTimeout(() => {
                if (input.length >= 2) {
                    this.filteredMultiSelectOptions = baseOptions.filter((row: any) => row.column_1.toString().toLowerCase().indexOf(input) > -1)
                } else {
                    this.filteredMultiSelectOptions = this.getInitialMultiSelectOptions(baseOptions)
                }
            }, 300)
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
            // this.$nextTick(() => {
            //     this.$forceUpdate()
            // })
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
            console.log('SelectorWidget: onSelectionsDeleted', selections)
            const index = selections.findIndex((selection: ISelection) => selection.datasetId === this.propWidget.dataset && selection.columnName === this.propWidget.columns[0]?.columnName)
            if (index !== -1) this.removeDeafultValues()
        },
        radioSelectorChanged(event: any) {
            this.selectedValue = event
            if (this.editorMode) return
            updateStoreSelections(this.createNewSelection([this.selectedValue]), this.activeSelections, this.dashboardId, this.setSelections, this.$http)
        },
        checkboxSelectorChanged(event: any) {
            this.selectedValues = event
            if (this.editorMode) return
            const tempSelection = this.createNewSelection(this.selectedValues) as ISelection
            this.updateActiveSelectionsWithMultivalueSelection(tempSelection)
        }
    }
})
</script>
