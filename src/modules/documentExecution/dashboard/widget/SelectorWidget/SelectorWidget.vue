<template>
    <!-- {{ widgetType }} -->
    <!-- {{ selectedValue }} - {{ selectedValues }} - {{ selectedDate }} - {{ startDate }} - {{ endDate }} -->
    <div v-if="options" class="selector-widget dashboard-scrollbar">
        <RadioSelector v-if="widgetType === 'singleValue'" :model-value="selectedValue" :options="singleValueOptions" :radio-style="propWidget.settings.style.radio" @update:model-value="radioSelectorChanged" />

        <CheckboxSelector v-if="widgetType === 'multiValue'" :model-value="selectedValues" :options="multiValueOptions" :checkbox-style="propWidget.settings.style.checkbox" @update:model-value="checkboxSelectorChanged" />

        <DropdownSelector v-if="widgetType === 'dropdown'" :model-value="selectedValue" :base-options="getBaseDropdownOptions()" :show-mode="showMode" :dropdown-style="propWidget.settings.style.dropdown" :date-format="dashboardDescriptor.selectionsDateFormat" @update:model-value="dropdownSelectorChanged" />

        <MultiDropdownSelector v-if="widgetType === 'multiDropdown'" :model-value="selectedValues" :base-options="getBaseDropdownOptions()" :show-mode="showMode" :multi-dropdown-style="propWidget.settings.style.multiDropdown" @update:model-value="multiDropdownSelectorChanged" />

        <!-- NEW: Quasar DateSelector -->
        <DateSelector v-if="widgetType === 'date'" :model-value="selectedDate" :date-style="propWidget.settings.style.date" :label="$t('common.date')" :available-dates="availableDateOptions" :min-date="getDateRangeFormatted('startDate')" :max-date="getDateRangeFormatted('endDate')" @update:model-value="dateSelectionChanged" />

        <!-- NEW: Quasar DateRangeSelector -->
        <DateRangeSelector v-if="widgetType === 'dateRange'" :model-value="getDateRangeValues()" :date-range-style="propWidget.settings.style.dateRange" :available-dates="availableDateOptions" :min-date="getDateRangeFormatted('startDate')" :max-date="getDateRangeFormatted('endDate')" @update:model-value="dateRangeSelectionChangedNew" />

        <!-- OLD: PrimeVue Calendar (for comparison) -->
        <span v-if="widgetType === 'date'" class="p-float-label p-m-2">
            <Calendar v-model="selectedDate" class="kn-material-input kn-width-full" :min-date="getDateRange('startDate')" :max-date="getDateRange('endDate')" :show-icon="true" @date-select="dateSelectionChangedOLD" />
            <label class="kn-material-input-label"> {{ $t('common.date') }} (Old) </label>
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
import DropdownSelector from './selectorTypes/DropdownSelector.vue'
import MultiDropdownSelector from './selectorTypes/MultiDropdownSelector.vue'
import DateSelector from './selectorTypes/DateSelector.vue'
import DateRangeSelector from './selectorTypes/DateRangeSelector.vue'
import { QRadio, QCheckbox } from 'quasar'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import store from '../../Dashboard.store'
import deepcopy from 'deepcopy'
import moment from 'moment'
import dashboardDescriptor from '../../DashboardDescriptor.json'

export default defineComponent({
    name: 'datasets-catalog-datatable',
    components: { RadioSelector, CheckboxSelector, DropdownSelector, MultiDropdownSelector, DateSelector, DateRangeSelector, QRadio, QCheckbox, Dropdown, Calendar },
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
        },
        availableDateOptions(): string[] {
            if (!this.dataToShow.rows) return []
            return this.dataToShow.rows.map((row: any) => String(row.column_1))
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

            const dataToShowSet = new Set(dataToShow.rows.map((row: any) => String(row.column_1)))
            const newRows =
                this.initialOptions?.rows?.map((initialOption: any) => ({
                    ...initialOption,
                    disabled: !dataToShowSet.has(String(initialOption.column_1))
                })) || []

            this.options.rows = newRows
        },
        getBaseDropdownOptions(): any[] {
            return this.showMode === 'hideDisabled' ? this.options.rows.filter((row: any) => !row.disabled) : this.options.rows
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
        getDateRangeFormatted(rangeValue: string): string {
            const dateRange = this.propWidget.settings.configuration.defaultValues
            if (dateRange[rangeValue]) {
                return moment(dateRange[rangeValue]).format('YYYY/MM/DD')
            }
            return ''
        },
        getLabelStyle() {
            return getWidgetStyleByType(this.propWidget, 'label')
        },
        dateSelectionChangedOLD() {
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
        },
        updateActiveSelectionsWithMultivalueSelection(tempSelection: ISelection) {
            const index = this.activeSelections.findIndex((activeSelection: ISelection) => activeSelection.datasetId === tempSelection.datasetId && activeSelection.columnName === tempSelection.columnName)
            if (index !== -1) this.activeSelections[index] = tempSelection
            else this.activeSelections.push(tempSelection)
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
        },
        dropdownSelectorChanged(value: any) {
            this.selectedValue = value
            if (this.editorMode) return
            updateStoreSelections(this.createNewSelection([this.selectedValue]), this.activeSelections, this.dashboardId, this.setSelections, this.$http)
        },
        multiDropdownSelectorChanged(values: any) {
            this.selectedValues = values
            if (this.editorMode) return
            const tempSelection = this.createNewSelection(this.selectedValues) as ISelection
            this.updateActiveSelectionsWithMultivalueSelection(tempSelection)
        },
        dateSelectionChanged(dateValue: string) {
            if (this.editorMode) return
            this.selectedDate = dateValue
            updateStoreSelections(this.createNewSelection([moment(deepcopy(dateValue)).format(dashboardDescriptor.selectionsDateFormat)]), this.activeSelections, this.dashboardId, this.setSelections, this.$http)
        },
        getDateRangeValues(): string[] {
            return [this.startDate ? moment(this.startDate).format('YYYY/MM/DD') : '', this.endDate ? moment(this.endDate).format('YYYY/MM/DD') : '']
        },
        dateRangeSelectionChangedNew(data: any) {
            if (this.editorMode) return

            const filteredDates = data?.filteredDates || []
            const range = data?.range || {}

            // Update startDate/endDate from the selected range
            if (range.from && range.to) {
                const startMoment = moment(range.from, 'YYYY/MM/DD')
                const endMoment = moment(range.to, 'YYYY/MM/DD')
                this.startDate = startMoment.toDate()
                this.endDate = endMoment.toDate()
            }

            // Create selection with filtered dates and update store
            const tempSelection = this.createNewSelection(filteredDates)
            updateStoreSelections(tempSelection, this.activeSelections, this.dashboardId, this.setSelections, this.$http)
        }
    }
})
</script>
