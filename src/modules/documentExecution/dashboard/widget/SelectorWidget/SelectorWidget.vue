<template>
    <div v-if="options" class="selector-widget dashboard-scrollbar">
        <RadioSelector v-if="widgetType === 'singleValue'" :model-value="selectedValue" :options="singleValueOptions" :radio-style="propWidget.settings.style.radio" @update:model-value="radioSelectorChanged" />

        <CheckboxSelector v-if="widgetType === 'multiValue'" :model-value="selectedValues" :options="multiValueOptions" :checkbox-style="propWidget.settings.style.checkbox" @update:model-value="checkboxSelectorChanged" />

        <DropdownSelector v-if="widgetType === 'dropdown'" :model-value="selectedValue" :base-options="getBaseDropdownOptions()" :show-mode="showMode" :dropdown-style="propWidget.settings.style.dropdown" :date-format="dashboardDescriptor.selectionsDateFormat" @update:model-value="dropdownSelectorChanged" />

        <MultiDropdownSelector v-if="widgetType === 'multiDropdown'" :model-value="selectedValues" :base-options="getBaseDropdownOptions()" :show-mode="showMode" :multi-dropdown-style="propWidget.settings.style.multiDropdown" @update:model-value="multiDropdownSelectorChanged" />

        <DateSelector v-if="widgetType === 'date'" :model-value="selectedDate" :date-style="propWidget.settings.style.date" :label="$t('common.date')" :available-dates="availableDateOptions" :min-date="getDateRangeFormatted('startDate')" :max-date="getDateRangeFormatted('endDate')" @update:model-value="dateSelectionChanged" />

        <DateRangeSelector v-if="widgetType === 'dateRange'" :model-value="getDateRangeValues()" :date-range-style="propWidget.settings.style.dateRange" :available-dates="availableDateOptions" :min-date="getDateRangeFormatted('startDate')" :max-date="getDateRangeFormatted('endDate')" @update:model-value="dateRangeSelectionChangedNew" />

        <SliderSelector v-if="widgetType === 'slider'" :model-value="selectedValue" :options="sliderOptions" :slider-style="propWidget.settings.style.slider" @update:model-value="sliderSelectorChanged" />

        <RangeSelector v-if="widgetType === 'range'" :model-value="selectedRange" :options="sliderOptions" :range-style="propWidget.settings.style.range" @update:model-value="rangeSelectorChanged" />

        <ButtonToggleSelector v-if="widgetType === 'buttonToggle'" :model-value="selectedValue" :options="singleValueOptions" :button-toggle-style="propWidget.settings.style.buttonToggle" @update:model-value="buttonToggleSelectorChanged" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, ISelection, IWidget } from '../../Dashboard'
import { mapActions } from 'pinia'
import { updateStoreSelections } from '../interactionsHelpers/InteractionHelper'
import { emitter } from '../../DashboardHelpers'
import RadioSelector from './selectorTypes/RadioSelector.vue'
import CheckboxSelector from './selectorTypes/CheckboxSelector.vue'
import DropdownSelector from './selectorTypes/DropdownSelector.vue'
import MultiDropdownSelector from './selectorTypes/MultiDropdownSelector.vue'
import DateSelector from './selectorTypes/DateSelector.vue'
import DateRangeSelector from './selectorTypes/DateRangeSelector.vue'
import SliderSelector from './selectorTypes/SliderSelector.vue'
import RangeSelector from './selectorTypes/RangeSelector.vue'
import ButtonToggleSelector from './selectorTypes/ButtonToggleSelector.vue'
import { QRadio, QCheckbox } from 'quasar'
import store from '../../Dashboard.store'
import deepcopy from 'deepcopy'
import moment from 'moment'
import dashboardDescriptor from '../../DashboardDescriptor.json'

export default defineComponent({
    name: 'datasets-catalog-datatable',
    components: { RadioSelector, CheckboxSelector, DropdownSelector, MultiDropdownSelector, DateSelector, DateRangeSelector, SliderSelector, RangeSelector, ButtonToggleSelector, QRadio, QCheckbox },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        dataToShow: { type: Object as any, required: true },
        widgetInitialData: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        selectionIsLocked: { type: Boolean, required: true },
        editorMode: { type: Boolean },
        localMode: { type: Boolean, default: false }
    },
    emits: ['close', 'selectionChanged'],
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
            selectedRange: [0, 0] as number[],
            activeSelections: [] as ISelection[],
            multiValueDebounceTimer: null as ReturnType<typeof setTimeout> | null
        }
    },
    computed: {
        widgetType(): string {
            const type = this.propWidget.settings.configuration.selectorType.modality || null
            return type
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
        },
        sliderOptions(): any[] {
            return this.getFilteredOptionsForDisplay().map((row: any) => ({ ...row }))
        }
    },
    watch: {
        propActiveSelections() {
            this.loadActiveSelections()
            if (!this.loadActiveSelectionValue()) this.removeDeafultValues()
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
        if (this.multiValueDebounceTimer) clearTimeout(this.multiValueDebounceTimer)
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
                        break
                    case 'slider':
                        this.selectedValue = selection.value[0] ? parseFloat(String(selection.value[0])) : null
                        break
                    case 'range':
                        this.loadRangeInitialValues(selection)
                        break
                    case 'buttonToggle':
                        this.selectedValue = selection.value[0]
                        break
                }
                return true
            } else return false
        },
        loadRangeInitialValues(selection: ISelection) {
            // Find the min and max indices of the selected values in sliderOptions
            const selectedValueSet = new Set(selection.value.map((v) => String(v)))
            let minIdx = -1
            let maxIdx = -1

            for (let i = 0; i < this.sliderOptions.length; i++) {
                if (selectedValueSet.has(String(this.sliderOptions[i].column_1))) {
                    if (minIdx === -1) minIdx = i
                    maxIdx = i
                }
            }

            if (minIdx !== -1 && maxIdx !== -1) {
                this.selectedRange = [minIdx, maxIdx]
            }
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
        getDateRangeFormatted(rangeValue: string): string {
            const dateRange = this.propWidget.settings.configuration.defaultValues
            if (dateRange[rangeValue]) {
                return moment(dateRange[rangeValue]).format('YYYY/MM/DD')
            }
            return ''
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
        emitSelectionChange(selection: ISelection) {
            if (this.localMode) {
                this.$emit('selectionChanged', selection)
            } else {
                updateStoreSelections(selection, this.activeSelections, this.dashboardId, this.setSelections, this.$http)
            }
        },
        radioSelectorChanged(event: any) {
            this.selectedValue = event
            if (this.editorMode) return
            const selection = this.createNewSelection([this.selectedValue])
            this.emitSelectionChange(selection)
        },
        checkboxSelectorChanged(event: any) {
            this.selectedValues = event
            if (this.editorMode) return
            const tempSelection = this.createNewSelection(this.selectedValues) as ISelection
            this.updateActiveSelectionsWithMultivalueSelection(tempSelection)
            if (this.localMode) {
                this.$emit('selectionChanged', tempSelection)
            } else {
                this.debounceMultiValueSelection(tempSelection)
            }
        },
        dropdownSelectorChanged(value: any) {
            this.selectedValue = value
            if (this.editorMode) return
            const selection = this.createNewSelection([this.selectedValue])
            this.emitSelectionChange(selection)
        },
        multiDropdownSelectorChanged(values: any) {
            this.selectedValues = values
            if (this.editorMode) return
            const tempSelection = this.createNewSelection(this.selectedValues) as ISelection
            this.updateActiveSelectionsWithMultivalueSelection(tempSelection)
            if (this.localMode) {
                this.$emit('selectionChanged', tempSelection)
            } else {
                this.debounceMultiValueSelection(tempSelection)
            }
        },
        dateSelectionChanged(dateValue: string) {
            if (this.editorMode) return
            this.selectedDate = dateValue
            const selection = this.createNewSelection([moment(deepcopy(dateValue)).format(dashboardDescriptor.selectionsDateFormat)])
            this.emitSelectionChange(selection)
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

            const tempSelection = this.createNewSelection(filteredDates)
            this.emitSelectionChange(tempSelection)
        },
        sliderSelectorChanged(value: number) {
            this.selectedValue = value
            if (this.editorMode) return
            const selection = this.createNewSelection([value])
            this.emitSelectionChange(selection)
        },
        buttonToggleSelectorChanged(value: string | null) {
            this.selectedValue = value
            if (this.editorMode) return
            if (value === null) {
                const selection = this.createNewSelection([])
                this.emitSelectionChange(selection)
            } else {
                const selection = this.createNewSelection([value])
                this.emitSelectionChange(selection)
            }
        },
        rangeSelectorChanged(data: any) {
            if (this.editorMode) return

            const filteredValues = data?.filteredValues || []
            const ranges = data?.ranges || [0, 0]
            this.selectedRange = ranges

            const tempSelection = this.createNewSelection(filteredValues) as ISelection
            this.updateActiveSelectionsWithMultivalueSelection(tempSelection)
            if (this.localMode) {
                this.$emit('selectionChanged', tempSelection)
            } else {
                this.debounceMultiValueSelection(tempSelection)
            }
        },
        debounceMultiValueSelection(selection: ISelection) {
            if (this.multiValueDebounceTimer) clearTimeout(this.multiValueDebounceTimer)
            this.multiValueDebounceTimer = setTimeout(() => {
                this.multiValueDebounceTimer = null
                updateStoreSelections(selection, this.activeSelections, this.dashboardId, this.setSelections, this.$http)
            }, 1000)
        }
    }
})
</script>

<style lang="scss" scoped>
.selector-widget {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>
