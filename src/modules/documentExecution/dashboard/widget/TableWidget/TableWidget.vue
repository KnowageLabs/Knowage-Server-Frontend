<template>
    <div class="kn-table-widget-container p-d-flex p-d-row kn-flex">
        <div v-if="selectedColumn" class="multiselect-overlay kn-cursor-pointer" @click="applyMultiSelection">
            <i class="fas fa-bolt" />
            {{ $t('dashboard.tableWidget.launchSelection') }}
        </div>
        <ag-grid-vue class="kn-table-widget-grid ag-theme-alpine kn-flex" :grid-options="gridOptions" :context="context"></ag-grid-vue>
        <PaginatorRenderer v-if="showPaginator" :prop-widget="propWidget" :prop-widget-pagination="widgetModel.settings.pagination" @pageChanged="$emit('pageChanged')" />
    </div>
</template>

<script lang="ts">
import { emitter } from '../../DashboardHelpers'
import { mapActions } from 'pinia'
import { AgGridVue } from 'ag-grid-vue3' // the AG Grid Vue Component
import { IDashboardDataset, ISelection, ITableWidgetColumnStyle, ITableWidgetColumnStyles, ITableWidgetVisualizationTypes, IVariable, IWidget } from '../../Dashboard'
import { defineComponent, PropType } from 'vue'
import { createNewTableSelection, isConditionMet, isCrossNavigationActive, formatRowDataForCrossNavigation, getFormattedClickedValueForCrossNavigation, addIconColumn } from './TableWidgetHelper'
import { executeTableWidgetCrossNavigation, updateStoreSelections } from '../interactionsHelpers/InteractionHelper'
import mainStore from '../../../../../App.store'
import dashboardStore from '../../Dashboard.store'
import descriptor from '../../dataset/DatasetEditorDescriptor.json'
import 'ag-grid-community/styles/ag-grid.css' // Core grid CSS, always needed
import 'ag-grid-community/styles/ag-theme-alpine.css' // Optional theme CSS
import CellRenderer from './CellRenderer'
import HeaderRenderer from './HeaderRenderer.vue'
import TooltipRenderer from './TooltipRenderer.vue'
import SummaryRowRenderer from './SummaryRowRenderer.vue'
import HeaderGroupRenderer from './HeaderGroupRenderer.vue'
import PaginatorRenderer from './PaginatorRenderer.vue'
import store from '../../Dashboard.store'

export default defineComponent({
    name: 'table-widget',
    components: {
        AgGridVue,
        // eslint-disable-next-line vue/no-unused-components
        HeaderRenderer,
        // eslint-disable-next-line vue/no-unused-components
        SummaryRowRenderer,
        // eslint-disable-next-line vue/no-unused-components
        HeaderGroupRenderer,
        // eslint-disable-next-line vue/no-unused-components
        TooltipRenderer,
        PaginatorRenderer
    },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        editorMode: { type: Boolean, required: false },
        datasets: { type: Array as PropType<IDashboardDataset[]>, required: true },
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
            descriptor,
            widgetModel: {} as IWidget,
            gridOptions: null as any,
            columnsNameArray: [] as any,
            rowData: [] as any,
            columnDefs: [] as any,
            gridApi: null as any,
            columnApi: null as any,
            overlayNoRowsTemplateTest: null as any,
            tableData: [] as any,
            showPaginator: false,
            activeSelections: [] as ISelection[],
            multiSelectedCells: [] as any,
            selectedColumn: false as any,
            selectedColumnArray: [] as any,
            context: null as any
        }
    },
    watch: {
        propWidget: {
            handler() {
                this.loadWidgetModel()
                if (!this.editorMode) this.refreshGridConfiguration(true)
            },
            deep: true
        },
        dataToShow() {
            this.tableData = this.dataToShow
            this.refreshGridConfiguration(true)
            this.updatePagination()
        },
        propActiveSelections() {
            this.loadActiveSelections()
        }
    },
    beforeMount() {
        this.context = { componentParent: this }
    },
    created() {
        this.setEventListeners()
        this.loadWidgetModel()
        this.loadActiveSelections()
        this.setupDatatableOptions()
        this.loadActiveSelectionValue()
        this.tableData = this.dataToShow
        this.updatePagination()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(store, ['setSelections']),
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadWidgetModel() {
            this.widgetModel = this.propWidget
        },
        setEventListeners() {
            emitter.on('refreshTable', this.refreshGridConfigurationWithoutData)
            emitter.on('selectionsDeleted', this.onSelectionsDeleted)
        },
        removeEventListeners() {
            emitter.off('refreshTable', this.refreshGridConfigurationWithoutData)
            emitter.off('selectionsDeleted', this.onSelectionsDeleted)
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        loadActiveSelectionValue() {
            if (this.editorMode) return false
            const index = this.activeSelections.findIndex((selection: ISelection) => selection.datasetId === this.widgetModel.dataset && selection.columnName === this.widgetModel.columns[0]?.columnName)
            if (index !== -1) {
                const modalSelection = this.widgetModel.settings.interactions.selection
                const selection = this.activeSelections[index]
                if (modalSelection.multiselection.enabled) {
                    this.setSelectedCellForMultiselected(selection.columnName)
                    this.multiSelectedCells = selection.value
                }
            }
        },
        setSelectedCellForMultiselected(columnName: string) {
            if (!columnName || !this.tableData || !this.tableData.metaData) this.selectedColumn = ''
            const index = this.tableData.metaData.fields?.findIndex((field: any) => field.header === columnName)
            this.selectedColumn = index !== -1 ? this.tableData.metaData.fields[index].name : ''
        },
        setupDatatableOptions() {
            this.gridOptions = {
                // PROPERTIES
                columnDefs: this.columnDefs,
                tooltipShowDelay: 100,
                tooltipMouseTrack: true,
                overlayNoRowsTemplate: this.overlayNoRowsTemplateTest,
                defaultColDef: { flex: 1 },
                rowSelection: 'single',
                suppressRowTransform: true,
                suppressMovableColumns: true,
                suppressDragLeaveHidesColumns: true,
                suppressRowGroupHidesColumns: true,
                suppressRowHoverHighlight: true,
                suppressRowClickSelection: true,
                suppressCellFocus: true,
                suppressMultiRangeSelection: true,
                suppressRowVirtualisation: false,
                rowHeight: 25,

                // EVENTS
                onCellClicked: this.onCellClicked,

                // CALLBACKS
                onGridReady: this.onGridReady,
                getRowStyle: this.getRowStyle,
                getRowHeight: this.getRowHeight
            }
        },
        onGridReady(params) {
            this.gridApi = params.api
            this.columnApi = params.columnApi

            this.refreshGridConfiguration(true)
        },
        async refreshGridConfiguration(updateData?: boolean) {
            const gridColumns = this.createGridColumns(this.tableData?.metaData?.fields)
            this.toggleHeaders(this.widgetModel.settings.configuration.headers)
            this.gridApi?.setColumnDefs(gridColumns)

            if (updateData) this.updateData(this.tableData?.rows)
        },
        refreshGridConfigurationWithoutData() {
            if (this.editorMode) {
                const gridColumns = this.createGridColumns(this.tableData?.metaData?.fields)
                this.toggleHeaders(this.widgetModel.settings.configuration.headers)
                this.gridApi?.setColumnDefs(gridColumns)
                this.gridApi?.redrawRows()
            }
        },
        toggleHeaders(headersConfiguration) {
            headersConfiguration.enabled ? this.gridApi?.setHeaderHeight(this.widgetModel.settings.style.headers.height) : this.gridApi?.setHeaderHeight(0)
        },
        getRowHeight() {
            const rowsConfiguration = this.widgetModel.settings.style.rows
            if (rowsConfiguration.height && rowsConfiguration.height != 0) return rowsConfiguration.height
            else return 25
        },
        createGridColumns(responseFields) {
            const columns = [] as any
            const columnGroups = {}
            this.columnsNameArray = []

            const dashboardDrivers = this.getDashboardDrivers(this.dashboardId)
            const dashboardVariables = this.propVariables
            const dataset = { type: 'SbiFileDataSet' }

            const conditionalStyles = this.propWidget.settings.conditionalStyles
            const columnDataMap = Object.fromEntries(this.propWidget.columns.map((column, index) => [column.id, `column_${index + 1}`]))
            // const selectedColumnsIds = this.propWidget.columns.map((currElement) => {
            //     return currElement.id
            // })
            // const columnsWithConditionalStyles = conditionalStyles.conditions.filter((condition) => selectedColumnsIds.includes(condition.target))
            const columnsWithConditionalStyles = conditionalStyles.conditions

            if (this.widgetModel.settings.configuration.rows.indexColumn) {
                columns.push({
                    colId: 'indexColumn',
                    valueGetter: `node.rowIndex + 1`,
                    headerName: '',
                    pinned: 'left',
                    width: 55,
                    sortable: false,
                    filter: false,
                    headerComponent: HeaderRenderer,
                    headerComponentParams: { propWidget: this.widgetModel },
                    cellRenderer: CellRenderer,
                    cellRendererParams: { colId: 'indexColumn', propWidget: this.widgetModel, columnDataMap, columnsWithConditionalStyles }
                })
            }

            for (const datasetColumn in this.widgetModel.columns) {
                for (const responseField in responseFields) {
                    const thisColumn = this.widgetModel.columns[datasetColumn]

                    if (typeof responseFields[responseField] == 'object' && ((dataset.type == 'SbiSolrDataSet' && thisColumn.alias.toLowerCase() === responseFields[responseField].header) || thisColumn.alias.toLowerCase() === responseFields[responseField].header.toLowerCase())) {
                        this.columnsNameArray.push(responseFields[responseField].name)
                        const tempCol = {
                            hide: this.getColumnVisibilityCondition(this.widgetModel.columns[datasetColumn].id, 'hide'),
                            colId: this.widgetModel.columns[datasetColumn].id,
                            headerName: this.widgetModel.columns[datasetColumn].alias,
                            columnName: this.widgetModel.columns[datasetColumn].columnName,
                            field: responseFields[responseField].name,
                            measure: this.widgetModel.columns[datasetColumn].fieldType,
                            headerComponent: HeaderRenderer,
                            headerComponentParams: { colId: this.widgetModel.columns[datasetColumn].id, propWidget: this.widgetModel },
                            cellRenderer: CellRenderer,
                            cellRendererParams: {
                                colId: this.widgetModel.columns[datasetColumn].id,
                                propWidget: this.widgetModel,
                                multiSelectedCells: this.multiSelectedCells,
                                selectedColumnArray: this.selectedColumnArray,
                                dashboardDrivers: dashboardDrivers,
                                dashboardVariables: dashboardVariables,
                                columnDataMap,
                                columnsWithConditionalStyles
                            }
                        } as any
                        if (tempCol.measure === 'MEASURE') tempCol.aggregationSelected = this.widgetModel.columns[datasetColumn].aggregation

                        //COLUMN WIDTH
                        const colWidth = this.getColumnWidth(tempCol.colId)
                        if (colWidth && colWidth != 0) {
                            tempCol.minWidth = colWidth
                            tempCol.maxWidth = colWidth
                        }

                        //ROWSPAN MANAGEMENT
                        if (this.widgetModel.settings.configuration.rows.rowSpan.enabled && this.widgetModel.settings.configuration.rows.rowSpan.column === this.widgetModel.columns[datasetColumn].id) {
                            let previousValue
                            let previousIndex
                            const tempRows = this.tableData.rows as any
                            for (const r in tempRows as any) {
                                if (previousValue != tempRows[r][responseFields[responseField].name]) {
                                    previousValue = tempRows[r][responseFields[responseField].name]
                                    previousIndex = r
                                    tempRows[r].span = 1
                                } else {
                                    tempRows[previousIndex].span++
                                }
                            }
                            tempCol.rowSpan = function RowSpanCalculator(params) {
                                if (params.data.span > 1) {
                                    return params.data.span
                                } else return 1
                            }
                            tempCol.cellClassRules = {
                                'cell-span': function (params) {
                                    return tempRows[params.rowIndex]?.span > 1
                                }
                            }
                        }

                        // SUMMARY ROW  -----------------------------------------------------------------
                        if (this.widgetModel.settings.configuration.summaryRows.enabled) {
                            tempCol.cellRendererSelector = (params) => {
                                if (params.node.rowPinned && this.widgetModel.settings.configuration.summaryRows.enabled) {
                                    return {
                                        component: SummaryRowRenderer,
                                        params: {
                                            summaryRows: this.widgetModel.settings.configuration.summaryRows.list.map((row) => {
                                                return row.label
                                            }),
                                            propWidget: this.widgetModel,
                                            hideSummary: this.getColumnVisibilityCondition(this.widgetModel.columns[datasetColumn].id, 'hideFromSummary')
                                        }
                                    }
                                } else {
                                    // rows that are not pinned don't use any cell renderer
                                    return undefined
                                }
                            }
                        }
                        // HEADERS CONFIGURATION  -----------------------------------------------------------------
                        const headersConfiguration = this.widgetModel.settings.configuration.headers
                        if (headersConfiguration.enabled && headersConfiguration.custom.enabled) {
                            headersConfiguration.custom.rules.forEach((rule) => {
                                rule.target.forEach((columnId) => {
                                    if (columnId === tempCol.colId) {
                                        switch (rule.action) {
                                            case 'hide':
                                                tempCol.headerName = ''
                                                break
                                            case 'setLabel':
                                                rule.value ? (tempCol.headerName = rule.value) : ''
                                                break
                                        }
                                    }
                                })
                            })
                        }

                        // TOOLTIP CONFIGURATION  -----------------------------------------------------------------
                        const tooltipConfig = this.getColumnTooltipConfig(tempCol.colId)
                        if (tooltipConfig !== null) {
                            tempCol.tooltipComponent = TooltipRenderer
                            tempCol.tooltipField = tempCol.field
                            tempCol.headerTooltip = tooltipConfig.header.enabled ? tooltipConfig.header.text : null
                            tempCol.tooltipComponentParams = { tooltipConfig: tooltipConfig }
                        } else {
                            tempCol.headerTooltip = null
                        }

                        // PAGINATION CONFIGURATION  -----------------------------------------------------------------
                        const pagination = this.widgetModel.settings.pagination
                        if (pagination.enabled) {
                            this.showPaginator = true
                        } else this.showPaginator = false

                        // VISUALIZATION TYPE CONFIGURATION  -----------------------------------------------------------------
                        const visTypes = this.widgetModel.settings.visualization.visualizationTypes as ITableWidgetVisualizationTypes
                        if (visTypes.enabled) {
                            const colVisType = this.getColumnVisualizationType(tempCol.colId)
                            tempCol.pinned = colVisType.pinned
                        }

                        // CUSTOM MESSAGE CONFIGURATION  -----------------------------------------------------------------
                        const customMessageConfig = this.widgetModel.settings.configuration.customMessages
                        if (customMessageConfig) {
                            if (customMessageConfig.hideNoRowsMessage) this.gridApi?.hideOverlay()
                            if (customMessageConfig.noRowsMessage) this.overlayNoRowsTemplateTest = customMessageConfig.noRowsMessage
                        }

                        // COLUMN GROUPING -----------------------------------------------------------------
                        const group = this.getColumnGroup(this.widgetModel.columns[datasetColumn])
                        if (group) {
                            if (typeof columnGroups[group.id] != 'undefined') {
                                columns[columnGroups[group.id]].children.push(tempCol)
                            } else {
                                columnGroups[group.id] = columns.length
                                columns.push({
                                    colId: group.id,
                                    headerName: group.label,
                                    headerGroupComponent: HeaderGroupRenderer,
                                    headerGroupComponentParams: { colId: group.id, propWidget: this.widgetModel },
                                    children: [tempCol]
                                })
                            }
                        } else columns.push(tempCol)
                        break
                    }
                }
            }

            addIconColumn(columns, this.widgetModel, HeaderRenderer, CellRenderer)

            return columns
        },
        getColumnGroup(col) {
            const modelGroups = this.widgetModel.settings.configuration.columnGroups.groups
            if (this.widgetModel.settings.configuration.columnGroups.enabled && modelGroups && modelGroups.length > 0) {
                for (const k in modelGroups) {
                    if (modelGroups[k].columns.includes(col.id)) {
                        return modelGroups[k]
                    }
                }
            } else return false
        },
        getColumnTooltipConfig(colId) {
            const tooltipConfig = this.widgetModel.settings.tooltips
            let columntooltipConfig = null as any
            tooltipConfig[0].enabled ? (columntooltipConfig = tooltipConfig[0]) : ''
            tooltipConfig.forEach((config) => {
                config.target.includes(colId) ? (columntooltipConfig = config) : ''
            })

            return columntooltipConfig
        },
        getRowStyle(params) {
            const rowStyles = this.widgetModel.settings.style.rows

            if (rowStyles.alternatedRows && rowStyles.alternatedRows.enabled) {
                if (rowStyles.alternatedRows.oddBackgroundColor && params.node.rowIndex % 2 === 0) {
                    return { background: rowStyles.alternatedRows.oddBackgroundColor }
                }
                if (rowStyles.alternatedRows.evenBackgroundColor && params.node.rowIndex % 2 != 0) {
                    return { background: rowStyles.alternatedRows.evenBackgroundColor }
                }
            }
        },
        getColumnVisibilityCondition(colId, propertyToReturn) {
            const visCond = this.widgetModel.settings.visualization.visibilityConditions
            let columnHidden = false as boolean

            if (visCond.enabled) {
                const colConditions = visCond.conditions.filter((condition) => condition.target.includes(colId))
                //We always take the 1st condition as a priority for the column and use that one.
                if (colConditions[0]) {
                    if (colConditions[0].condition.type === 'always') {
                        columnHidden = colConditions[0][propertyToReturn]
                    } else {
                        isConditionMet(colConditions[0].condition, colConditions[0].condition.variableValue) ? (columnHidden = colConditions[0][propertyToReturn]) : ''
                    }
                }
            }

            return columnHidden
        },
        getColumnVisualizationType(colId) {
            const visTypes = this.widgetModel.settings.visualization.visualizationTypes as ITableWidgetVisualizationTypes

            const colVisType = visTypes.types.find((visType) => visType.target.includes(colId))
            if (colVisType) return colVisType
            else return visTypes.types[0]
        },
        getColumnWidth(colId) {
            const colStyles = this.widgetModel.settings.style.columns as ITableWidgetColumnStyles

            const colStyle = colStyles.styles.find((style) => style.target.includes(colId)) as ITableWidgetColumnStyle

            if (colStyle) return colStyle.properties.width
            else return colStyles.styles[0].properties.width
        },
        updateData(data) {
            if (this.widgetModel.settings.configuration.summaryRows.enabled) {
                const rowsNumber = this.widgetModel.settings.configuration.summaryRows.list.length
                this.gridApi?.setRowData(data.slice(0, data.length - rowsNumber))
                this.gridApi?.setPinnedBottomRowData(data.slice(-rowsNumber))
            } else {
                this.gridApi?.setRowData(data)
                this.gridApi?.setPinnedBottomRowData()
            }
        },
        onCellClicked(node) {
            if (!this.editorMode && isCrossNavigationActive(node, this.widgetModel.settings.interactions.crossNavigation)) {
                const formattedRow = formatRowDataForCrossNavigation(node, this.dataToShow)
                const formattedClickedValue = getFormattedClickedValueForCrossNavigation(node, this.dataToShow)
                executeTableWidgetCrossNavigation(formattedClickedValue, formattedRow, this.widgetModel.settings.interactions.crossNavigation, this.dashboardId)
                return
            }

            if (!this.editorMode) {
                if (node.colDef.measure == 'MEASURE' || node.colDef.pinned || node.value === '' || node.value == undefined) return
                //SELECTION LOGIC -------------------------------------------------------------------
                const modalSelection = this.widgetModel.settings.interactions.selection

                if (modalSelection.enabled) {
                    if (modalSelection.multiselection.enabled) {
                        //first check to see it the column selected is the same, if not clear the past selections
                        if (!this.selectedColumn || this.selectedColumn != node.colDef.field) {
                            this.multiSelectedCells.splice(0, this.multiSelectedCells.length)
                            this.selectedColumn = node.colDef.field
                        }

                        if (modalSelection.modalColumn) {
                            const modalColumnIndex = this.widgetModel.columns.findIndex((column) => column.id == modalSelection.modalColumn)
                            const modalColumnValue = node.data[`column_${modalColumnIndex + 1}`]

                            if (!this.multiSelectedCells.includes(modalColumnValue)) this.multiSelectedCells.push(modalColumnValue)
                            else this.multiSelectedCells.splice(this.multiSelectedCells.indexOf(modalColumnValue), 1)
                            if (this.multiSelectedCells.length == 0) this.selectedColumn = false
                        } else {
                            if (!this.multiSelectedCells.includes(node.value)) this.multiSelectedCells.push(node.value)
                            else this.multiSelectedCells.splice(this.multiSelectedCells.indexOf(node.value), 1)
                            if (this.multiSelectedCells.length == 0) this.selectedColumn = false
                        }
                    } else if (!modalSelection.multiselection.enabled) {
                        if (modalSelection.modalColumn) {
                            const modalColumnIndex = this.widgetModel.columns.findIndex((column) => column.id == modalSelection.modalColumn)
                            const modalColumnValue = node.data[`column_${modalColumnIndex + 1}`]
                            updateStoreSelections(createNewTableSelection([modalColumnValue], this.widgetModel.columns[modalColumnIndex].columnName, this.widgetModel, this.datasets), this.activeSelections, this.dashboardId, this.setSelections, this.$http)
                        } else {
                            updateStoreSelections(createNewTableSelection([node.value], node.colDef.columnName, this.widgetModel, this.datasets), this.activeSelections, this.dashboardId, this.setSelections, this.$http)
                        }
                    }
                }

                this.selectedColumnArray.pop()
                this.selectedColumnArray.push(node.colDef.field)

                const params = { force: true }
                this.gridApi?.refreshCells(params)
            }
        },
        applyMultiSelection() {
            const modalSelection = this.widgetModel.settings.interactions.selection

            let tempSelection = null as ISelection | null
            if (modalSelection.modalColumn) {
                const modalColumnIndex = this.widgetModel.columns.findIndex((column) => column.id == modalSelection.modalColumn)
                const modalColumnName = this.widgetModel.columns[modalColumnIndex].columnName
                tempSelection = createNewTableSelection(this.multiSelectedCells, modalColumnName, this.widgetModel, this.datasets)
            } else {
                const columnIndex = this.selectedColumn?.split('_')[1]
                if (columnIndex || columnIndex === 0) tempSelection = createNewTableSelection(this.multiSelectedCells, this.widgetModel.columns[columnIndex - 1].columnName, this.widgetModel, this.datasets)
            }
            if (tempSelection) {
                this.updateActiveSelectionsWithMultivalueSelection(tempSelection)
                updateStoreSelections(tempSelection, this.activeSelections, this.dashboardId, this.setSelections, this.$http)
                this.$emit('launchSelection')
            }

            this.removeSelectedValues()
            this.selectedColumn = ''
        },

        updateActiveSelectionsWithMultivalueSelection(tempSelection: ISelection) {
            const index = this.activeSelections.findIndex((activeSelection: ISelection) => activeSelection.datasetId === tempSelection.datasetId && activeSelection.columnName === tempSelection.columnName)
            if (index !== -1) {
                this.activeSelections[index] = tempSelection
            } else {
                this.activeSelections.push(tempSelection)
            }
        },
        mapRow(rowData) {
            const keyMap = {}
            for (const r in rowData) {
                for (const f in this.tableData?.metaData?.fields) {
                    if (this.tableData?.metaData?.fields[f].dataIndex == r) keyMap[this.tableData?.metaData?.fields[f].header] = rowData[r]
                }
            }
            return keyMap
        },
        onSelectionsDeleted(selections: any) {
            const index = selections.findIndex((selection: ISelection) => selection.datasetId === this.widgetModel.dataset && selection.columnName === this.widgetModel.columns[0]?.columnName)
            if (index !== -1) this.removeSelectedValues()
        },
        removeSelectedValues() {
            this.multiSelectedCells = []
        },
        sortingChanged(updatedSorting) {
            this.widgetModel.settings.sortingColumn = updatedSorting.colId
            this.widgetModel.settings.sortingOrder = updatedSorting.order
            this.$emit('sortingChanged')
        },
        updatePagination() {
            const pagination = this.propWidget.settings.pagination
            if (pagination.enabled) {
                this.widgetModel.settings.pagination.properties.totalItems = this.dataToShow?.results
            }
        }
    }
})
</script>
<style lang="scss">
.cell-span {
    background-color: white;
}
.ag-cell {
    .barContainer {
        width: 100%;
        height: 100%;
        display: inline-flex;
        .innerBar {
            height: 100%;
            margin: 1px;
        }
    }
}
.multiselect-overlay {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    background-color: #f1f5f9;
    min-height: 25px;
    max-height: 25px;
    border-top: 1px solid #3b678c;
    border-bottom: 1px solid #3b678c;
    text-align: center;
    width: 100%;
    z-index: 9999;
}
</style>
