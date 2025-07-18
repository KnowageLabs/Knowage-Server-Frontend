<template>
    <div class="pivot-widget-container p-d-flex p-d-row kn-flex">Pivot Widget Goes Here</div>
</template>

<script lang="ts">
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IDataset, ISelection, IWidget, ITableWidgetColumnStyles, ITableWidgetConditionalStyles, ITableWidgetVisualizationTypes, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { getWidgetStyleByType, replaceTooltipConfigurationVariablesAndParametersPlaceholders, stringifyStyleProperties } from '@/modules/documentExecution/dashboard/widget/TableWidget/TableWidgetHelper'
import { IPivotTooltips } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget.d'
import { getFormattedClickedValueForCrossNavigation, createPivotTableSelection } from './PivotWidgetHelpers'
import { updateAllStoreSelections, executePivotTableWidgetCrossNavigation } from '@/modules/documentExecution/dashboard/widget/interactionsHelpers/InteractionHelper'
import { mapActions } from 'pinia'
import { formatNumberWithLocale } from '@/helpers/commons/localeHelper'
import { getColumnConditionalStyles } from '@/modules/documentExecution/dashboard/widget/PivotWidget/PivotWidgetConditionalHelper'

export default defineComponent({
    name: 'table-widget',
    components: {},
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        editorMode: { type: Boolean, required: false },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        dataToShow: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true },
        propVariables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['pageChanged', 'sortingChanged', 'launchSelection'],
    setup() {
        const store = dashboardStore()
        const appStore = mainStore()
        return { store, appStore }
    },
    data() {
        return {
            tableData: [] as any,
            pivotConfig: {} as any,
            fieldPickerConfig: {} as any,
            fieldPanelConfig: {} as any,
            gridInstance: null as any,
            activeSelections: [] as ISelection[],
            variables: [] as IVariable[]
        }
    },
    computed: {
        dataFields() {
            return []
        },
        pivotFields() {
            return this.gridInstance.getDataSource()._descriptions
        }
    },
    watch: {
        propActiveSelections() {
            this.loadActiveSelections()
        },
        propVariables() {
            this.loadVariables()
        }
    },
    beforeMount() {},
    created() {
        this.loadVariables()
        this.setPivotConfiguration()
        this.setFieldPickerConfiguration()
        this.setFieldPanelConfiguration()
        this.loadActiveSelections()
    },
    mounted() {
        this.setEventListeners()
    },
    unmounted() {
        this.removeEventListeners()
    },

    methods: {
        ...mapActions(dashboardStore, ['setSelections']),
        setEventListeners() {
            emitter.on('widgetResized', this.resizePivot)
            emitter.on('savePivotStates', this.saveState)
            emitter.on('loadPivotStates', this.loadState)
        },
        removeEventListeners() {
            emitter.on('widgetResized', this.resizePivot)
            emitter.on('savePivotStates', this.saveState)
            emitter.on('loadPivotStates', this.loadState)
        },
        loadVariables() {
            this.variables = this.propVariables
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        resizePivot() {},
        setPivotConfiguration() {
            const widgetConfig = this.propWidget.settings.configuration
            this.pivotConfig = {
                // PROPS
                allowExpandAll: true,
                allowSorting: true,
                allowSortingBySummary: true,
                allowFiltering: true,
                showBorders: false,
                showColumnGrandTotals: widgetConfig.columns.grandTotal,
                showColumnTotals: widgetConfig.columns.subTotal,
                showRowGrandTotals: widgetConfig.rows.grandTotal,
                showRowTotals: widgetConfig.rows.subTotal,
                texts: {},

                // EVENTS
                onCellPrepared: this.setCellConfiguration,
                onCellClick: this.onCellClicked
            }
        },
        setFieldPickerConfiguration() {
            const fieldPickerConfig = this.propWidget.settings.configuration.fieldPicker
            this.fieldPickerConfig = {
                enabled: fieldPickerConfig.enabled,
                width: fieldPickerConfig.width,
                height: fieldPickerConfig.height
            }
        },
        setFieldPanelConfiguration() {
            const fieldPanelConfig = this.propWidget.settings.configuration.fieldPanel
            this.fieldPanelConfig = {
                visible: fieldPanelConfig.enabled
            }
        },
        onGridInitialization(event) {
            this.gridInstance = event.component
        },

        //#region ===================== Pivot Datasource Config (Fields & Data) ====================================================
        getFormattedFieldsFromModel() {
            const formattedFields = [] as any
            const responseMetadataFields = this.dataToShow?.metaData?.fields

            if (this.getPivotData().length > 0) {
                for (const fieldsName in this.propWidget.fields) {
                    const modelFields = this.propWidget.fields[fieldsName]
                    modelFields.forEach((modelField) => {
                        const tempField = {} as any
                        const index = responseMetadataFields.findIndex((metaField: any) => {
                            if (typeof metaField == 'object') return metaField.header.toLowerCase() === modelField.alias.toLowerCase()
                        })

                        tempField.id = modelField.id
                        tempField.summaryType = modelField?.aggregation === 'NONE' ? 'sum' : modelField?.aggregation?.toLowerCase()
                        tempField.caption = modelField.alias
                        tempField.dataField = `column_${index}`
                        tempField.area = this.getDataField(fieldsName)
                        tempField.area = this.getDataField(fieldsName)
                        tempField.format = (cellValue) => formatNumberWithLocale(cellValue, this.getFieldPrecision(tempField))
                        if (modelField.sort) tempField.sortOrder = modelField.sort.toLowerCase()

                        formattedFields.push(tempField)
                    })
                }
            }

            return formattedFields
        },
        getDataField(fieldsName) {
            switch (fieldsName) {
                case 'columns':
                    return 'column'
                case 'rows':
                    return 'row'
                case 'filters':
                    return 'filter'
                default:
                    return fieldsName
            }
        },
        getPivotData() {
            if (this.dataToShow && this.dataToShow.rows) return this.dataToShow.rows
            else return []
        },
        getFieldPrecision(field) {
            const visualization = this.propWidget.settings.visualization.visualizationTypes
            if (!visualization.types) return

            const fieldVisualization = visualization.types.find((visType) => visType.target.includes(field.id)) ?? visualization.types[0]
            return fieldVisualization.precision
        },
        //#endregion ===============================================================================================

        //#region ===================== Cell Config (Totals, Stlye, Conditionals) ====================================================
        setCellConfiguration(event) {
            this.setTotals(event)
            this.setFieldCellConfiguration(event)
            this.setTooltips(event)
        },

        //#region ===================== Totals Config (Sub, Grand, Style) ====================================================
        setTotals(cellEvent) {
            this.setTotalStyles(cellEvent)

            if (cellEvent.area === 'data') return

            const fieldType = cellEvent.area === 'column' ? 'columns' : 'rows'
            this.setTotalLabels(cellEvent, fieldType)
        },
        setTotalLabels(cellEvent, fieldType) {
            const columnConfig = this.propWidget.settings.configuration[fieldType]

            if (cellEvent.cell.type === 'GT') cellEvent.cellElement.innerHTML = columnConfig.grandTotalLabel
            else if (cellEvent.cell.type === 'T') cellEvent.cellElement.innerHTML = columnConfig.subTotalLabel
        },
        setTotalStyles(cellEvent) {
            let totalType = null as any
            const cell = cellEvent.cell

            if (cell.type === 'GT' || cell.rowType === 'GT' || cell.columnType === 'GT') totalType = 'totals'
            else if (cell.type === 'T' || cell.rowType === 'T' || cell.columnType === 'T') totalType = 'subTotals'

            const styleConfig = getWidgetStyleByType(this.propWidget, totalType)
            cellEvent.cellElement.style = styleConfig
        },
        //#endregion ===============================================================================================

        //#region ===================== Tooltips Config  ====================================================
        setTooltips(cellEvent) {
            if (cellEvent.area == 'data' && !cellEvent.cell.text) return
            const tooltipsConfig = this.propWidget.settings.tooltips as IPivotTooltips[]
            const parentField = this.getCellParent(cellEvent)

            let cellTooltipConfig = null as unknown as IPivotTooltips
            if (parentField?.id && tooltipsConfig.length > 1) cellTooltipConfig = tooltipsConfig.find((tooltipConfig) => tooltipConfig.target.includes(parentField.id)) as IPivotTooltips
            else if (tooltipsConfig[0].enabled) cellTooltipConfig = tooltipsConfig[0] as IPivotTooltips

            const dashboardDrivers = this.getDashboardDrivers(this.dashboardId)
            cellTooltipConfig = replaceTooltipConfigurationVariablesAndParametersPlaceholders(cellTooltipConfig, this.variables, dashboardDrivers)

            if (cellTooltipConfig) this.createFieldTooltips(cellEvent, cellTooltipConfig)
        },
        createFieldTooltips(cellEvent, tooltipConfig: IPivotTooltips) {
            if (cellEvent.area == 'data') {
                cellEvent.cellElement.title = `${tooltipConfig.prefix} ${cellEvent.cell.text} ${tooltipConfig.suffix}`
            } else {
                cellEvent.cellElement.title = `${tooltipConfig.header.enabled ? tooltipConfig.header.text : cellEvent.cell.text}`
            }
        },
        //#endregion ===============================================================================================

        //#region ===================== Field Styles  ====================================================
        setFieldCellConfiguration(cellEvent) {
            if (this.isTotalCell(cellEvent)) return

            const parentField = this.getCellParent(cellEvent)
            if (!parentField) return

            //Field Style
            const fieldStyles = this.getFieldStylesConfiguration(cellEvent) as ITableWidgetColumnStyles
            if (!fieldStyles.enabled) return
            let cellStyleString = this.getFieldStyleStringById(parentField, fieldStyles) as any

            //Visualization
            const visualizationTypes = this.propWidget.settings.visualization.visualizationTypes as ITableWidgetVisualizationTypes
            let showVisualizationIcon = null as any
            if (cellEvent.area == 'data' && visualizationTypes.enabled) {
                const cellVisualization = this.getFieldVisualization(parentField, visualizationTypes)
                if (cellVisualization && cellEvent.cell.text) cellEvent.cellElement.innerHTML = `<span class="prefix">${cellVisualization.prefix ?? ''}</span><span class="cellText"> ${cellEvent.cell.text}</span><span class="suffix"> ${cellVisualization.suffix ?? ''}<span/>`
                if (cellVisualization.type === 'Icon only' || cellVisualization.type === 'Text/Icon') showVisualizationIcon = cellVisualization.type
            }

            //Conditional Styles
            const conditionalStyles = this.propWidget.settings.conditionalStyles as ITableWidgetConditionalStyles
            if (cellEvent.area == 'data' && conditionalStyles.enabled) {
                const cellConditionalStyle = getColumnConditionalStyles(this.propWidget, parentField?.id, cellEvent.cell.value)
                if (cellConditionalStyle) cellStyleString = stringifyStyleProperties(cellConditionalStyle)
                if (cellConditionalStyle && cellConditionalStyle.icon && showVisualizationIcon) {
                    cellEvent.cellElement.querySelector('.cellText').insertAdjacentHTML('afterend', `<i class="${cellConditionalStyle.icon} p-ml-1"/>`)
                    if (showVisualizationIcon === 'Icon only') cellEvent.cellElement.querySelector('.cellText').remove()
                }
            }

            cellEvent.cellElement.style = cellStyleString
        },
        getFieldStylesConfiguration(cellEvent) {
            if (cellEvent.area == 'data') return this.propWidget.settings.style.fields
            else return this.propWidget.settings.style.fieldHeaders
        },
        getFieldVisualization(parentField, visualizationTypes) {
            const cellVisualization = visualizationTypes.types.find((visType) => visType.target.includes(parentField.id))
            if (cellVisualization) return cellVisualization
            else return visualizationTypes.types[0]
        },
        getFieldStyleStringById(parentField, fieldStyles) {
            const fieldStyle = fieldStyles.styles.find((fieldStyle) => fieldStyle.target.includes(parentField.id))
            if (fieldStyle) return stringifyStyleProperties(fieldStyle.properties)
            else return stringifyStyleProperties(fieldStyles.styles[0].properties)
        },
        getCellParent(cellEvent) {
            if (this.isTotalCell(cellEvent)) return undefined
            if (cellEvent.area == 'data' || (cellEvent.area == 'column' && cellEvent.cell.dataIndex >= 0)) {
                return this.pivotFields.values[cellEvent.cell.dataIndex]
            }
            if (cellEvent.area == 'column' && !cellEvent.cell.dataIndex && cellEvent.cell.path) {
                const fieldIndex = cellEvent.cell.path.findIndex((pathElement) => pathElement == cellEvent.cell.text)
                return this.pivotFields.columns[fieldIndex]
            }
            if (cellEvent.area == 'row' && !cellEvent.cell.dataIndex && cellEvent.cell.path) {
                const fieldIndex = cellEvent.cell.path.findIndex((pathElement) => pathElement == cellEvent.cell.text)
                return this.pivotFields.rows[fieldIndex]
            }
        },
        isTotalCell(cellEvent) {
            return cellEvent.cell.type === 'GT' || cellEvent.cell.rowType === 'GT' || cellEvent.cell.columnType === 'GT' || cellEvent.cell.type === 'T' || cellEvent.cell.rowType === 'T' || cellEvent.cell.columnType === 'T'
        },
        //#endregion ===============================================================================================

        //#region ===================== Cell Click Events  ====================================================
        onCellClicked(cellEvent) {
            if (this.editorMode) return
            if (this.propWidget.settings.interactions.crossNavigation.enabled) {
                const formattedOutputParameters = getFormattedClickedValueForCrossNavigation(cellEvent, this.dataFields, this.propWidget.settings.interactions.crossNavigation)
                if (formattedOutputParameters) executePivotTableWidgetCrossNavigation(formattedOutputParameters, this.propWidget.settings.interactions.crossNavigation, this.dashboardId)
            } else if (this.propWidget.settings.interactions.selection.enabled) {
                const selections = createPivotTableSelection(cellEvent, this.propWidget, this.datasets)
                if (selections) updateAllStoreSelections(selections, this.activeSelections, this.dashboardId, this.setSelections, this.$http)
            }
        },
        //#endregion ===============================================================================================

        //#region ===================== State Management For Views ====================================================
        saveState() {},
        loadState() {}
        //#endregion ===============================================================================================
    }
})
</script>
<style lang="scss">
.pivot-widget-container {
    overflow: auto;
}
</style>
