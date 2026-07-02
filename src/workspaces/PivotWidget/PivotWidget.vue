<template>
    <div class="pivot-widget-container p-d-flex p-d-row kn-flex dx-viewport">
        <DxPivotGrid id="pivotgrid" ref="grid" :data-source="dataSource" v-bind="pivotConfig" @initialized="onGridInitialization">
            <DxFieldChooser v-bind="fieldPickerConfig" />
            <DxFieldPanel v-bind="fieldPanelConfig" />
            <DxScrolling mode="virtual" />
        </DxPivotGrid>
    </div>
</template>

<script lang="ts">
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IDataset, ISelection, IWidget, ITableWidgetColumnStyles, ITableWidgetConditionalStyles, ITableWidgetVisualizationTypes, IDashboardView, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
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
import { DxPivotGrid, DxFieldChooser, DxFieldPanel, DxScrolling } from 'devextreme-vue/pivot-grid'
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source'
import 'devextreme/dist/css/dx.light.css'
import { updatePivotSortRegistry, removePivotSortEntry } from '@/modules/documentExecution/dashboard/widget/PivotWidget/PivotWidgetExportHelper'

export default defineComponent({
    name: 'table-widget',
    components: { DxPivotGrid, DxFieldChooser, DxFieldPanel, DxScrolling },
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
        const dataSource = new PivotGridDataSource({
            fields: this.getFormattedFieldsFromModel(),
            store: this.getPivotData(),

            onFieldsPrepared: (fields) => {
                //hide id field from response
                fields.forEach((field) => {
                    if (field.dataField === 'id') field.visible = false
                })
            }
        })
        return {
            dataSource,
            tableData: [] as any,
            pivotConfig: {} as any,
            fieldPickerConfig: {} as any,
            fieldPanelConfig: {} as any,
            gridInstance: null as any,
            activeSelections: [] as ISelection[],
            pivotState: {} as any,
            variables: [] as IVariable[],
            userHasSorted: false as boolean,
            changedListenerAttached: false as boolean,
            fieldSortSnapshot: {} as Record<string, { sortOrder: string | undefined; sortBy: string | undefined }>
        }
    },
    computed: {
        dataFields() {
            return this.dataSource.fields().filter((field) => field.area == 'data')
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
        if (this.propWidget.id) removePivotSortEntry(this.propWidget.id)
    },

    methods: {
        ...mapActions(dashboardStore, ['setSelections', 'getDashboardDrivers']),
        setEventListeners() {
            emitter.on('widgetResized', this.resizePivot)
            emitter.on('savePivotStates', this.saveState)
            emitter.on('loadPivotStates', this.loadState)
            document.addEventListener('mouseup', this.onDragEnd)
            this.$el.addEventListener('mousedown', this.onDragStart)
        },
        removeEventListeners() {
            emitter.off('widgetResized', this.resizePivot)
            emitter.off('savePivotStates', this.saveState)
            emitter.off('loadPivotStates', this.loadState)
            document.removeEventListener('mouseup', this.onDragEnd)
            this.$el.removeEventListener('mousedown', this.onDragStart)
        },
        onDragStart(event) {
            if ((event.target as HTMLElement).closest('.dx-area-field')) this.$el.classList.add('is-dragging')
        },
        onDragEnd() {
            this.$el.classList.remove('is-dragging')
        },
        loadVariables() {
            this.variables = this.propVariables
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        resizePivot() {
            this.gridInstance.repaint()
        },
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
                onCellClick: this.onCellClicked,
                onContextMenuPreparing: this.onContextMenuPreparing,
                onContentReady: this.applyLockedFieldStyles
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
        //#region ===================== Field Panel Styling - Disable Sort/Drag/Filter ====================================================
        applyLockedFieldStyles() {
            if (!this.gridInstance) return
            const overrides = this.propWidget.settings?.configuration?.fieldPanel?.fieldDragOverrides ?? []

            // Build a map of field id → caption from the datasource
            const idToCaption = new Map<string, string>()
            this.dataSource.fields().forEach((field: any) => {
                if (field.id) idToCaption.set(field.id, field.caption ?? '')
            })

            // build caption sets per lock type
            const dragLocked = new Set<string>()
            const sortLocked = new Set<string>()
            const filterLocked = new Set<string>()
            overrides.forEach((override) => {
                override.columns.forEach((id) => {
                    const caption = idToCaption.get(id)
                    if (!caption) return
                    if (override.disableDragging) dragLocked.add(caption)
                    if (override.disableSorting) sortLocked.add(caption)
                    if (override.disableFiltering) filterLocked.add(caption)
                })
            })

            const container: HTMLElement = this.gridInstance.element()

            // clean up any previously attached sort-block handlers before re-applying
            container.querySelectorAll<HTMLElement>('[data-kn-sort-blocked]').forEach((el: any) => {
                if (el._knSortBlockHandler) {
                    el.removeEventListener('click', el._knSortBlockHandler, true)
                    delete el._knSortBlockHandler
                }
                el.removeAttribute('data-kn-sort-blocked')
            })

            container.querySelectorAll<HTMLElement>('.dx-area-field').forEach((el) => {
                const caption = el.querySelector('.dx-area-field-content')?.textContent?.trim() ?? ''
                el.classList.toggle('kn-pivot-field-locked', dragLocked.has(caption))
                el.classList.toggle('kn-pivot-sort-locked', sortLocked.has(caption))
                el.classList.toggle('kn-pivot-filter-locked', filterLocked.has(caption))

                // sort is triggered by clicking the chip itself (dx-pivotgrid-action), not a child element, pointer-events CSS alone cannot block it have to use capture-phase handler instead.
                if (sortLocked.has(caption)) {
                    const handler = (e: Event) => {
                            if (!(e.target as HTMLElement).closest('.dx-header-filter')) {
                                e.stopImmediatePropagation()
                            }
                        }
                    ;(el as any)._knSortBlockHandler = handler
                    el.addEventListener('click', handler, true)
                    el.setAttribute('data-kn-sort-blocked', '1')
                }
            })
        },
        //#endregion ===============================================================================================

        //#region ===================== Hacky Sorting - Initial sort options taken from BE, then fallback to user sorting  ====================================================
        onGridInitialization(event) {
            this.gridInstance = event.component
            if (this.changedListenerAttached) return
            this.changedListenerAttached = true

            this.captureSortSnapshot()
            this.dataSource.on('changed', this.onDataSourceChanged)
        },
        captureSortSnapshot() {
            const snapshot: Record<string, { sortOrder: string | undefined; sortBy: string | undefined }> = {}
            this.dataSource.fields().forEach((field) => {
                if (field.dataField) snapshot[field.dataField] = { sortOrder: field.sortOrder, sortBy: field.sortBy }
            })
            this.fieldSortSnapshot = snapshot
        },
        onDataSourceChanged() {
            console.log(this.dataSource.fields())
            if (this.propWidget.id) updatePivotSortRegistry(this.propWidget.id, this.dataSource.fields(), this.userHasSorted)
            if (this.userHasSorted) return
            const sortChanged = this.dataSource.fields().some((field) => {
                if (!field.dataField) return false
                const snap = this.fieldSortSnapshot[field.dataField]
                return snap && (snap.sortOrder !== field.sortOrder || snap.sortBy !== field.sortBy)
            })
            if (sortChanged) {
                this.userHasSorted = true
                this.rebuildDataSourceSortingMethods()
            }
        },
        onContextMenuPreparing(e) {
            if (!e.items) return
            // Wrap onClick of any sort-related context menu items
            e.items.forEach((item) => {
                if (item.text && item.text.toLowerCase().includes('sort')) {
                    const originalOnClick = item.onClick
                    item.onClick = (args) => {
                        if (!this.userHasSorted) {
                            this.userHasSorted = true
                            this.rebuildDataSourceSortingMethods()
                        }
                        if (originalOnClick) originalOnClick(args)
                    }
                }
            })
        },
        // Removes sortingMethod from all fields so dxPivotGrid handles sorting natively from this point on
        rebuildDataSourceSortingMethods() {
            this.dataSource.fields().forEach((field) => {
                if (field.dataField) {
                    this.dataSource.field(field.dataField, { sortingMethod: null })
                }
            })
            this.dataSource.load()
        },
        //#endregion ===============================================================================================

        //#region ===================== Custom Summary Functions ====================================================
        getFieldSummaryType(aggregation: string): string {
            if (!aggregation || aggregation === 'NONE') return 'sum'
            if (aggregation === 'COUNT_DISTINCT' || aggregation === 'COUNT') return 'sum'
            return aggregation.toLowerCase()
        },
        calculateCountDistinctSummary(options) {
            if (options.summaryProcess === 'start') {
                options.totalValue = new Set()
            } else if (options.summaryProcess === 'calculate') {
                if (options.value !== null && options.value !== undefined) {
                    options.totalValue.add(options.value)
                }
            } else if (options.summaryProcess === 'finalize') {
                options.totalValue = options.totalValue.size
            }
        },
        //#endregion ===============================================================================================

        //#region ===================== Pivot Datasource Config (Fields & Data) ====================================================
        getFormattedFieldsFromModel() {
            const formattedFields = [] as any
            const responseMetadataFields = this.dataToShow?.metaData?.fields
            const widgetConfig = this.propWidget.settings.configuration

            if (this.getPivotData().length > 0) {
                for (const fieldsName in this.propWidget.fields) {
                    const modelFields = this.propWidget.fields[fieldsName]
                    modelFields.forEach((modelField) => {
                        const tempField = {} as any
                        const index = responseMetadataFields.findIndex((metaField: any) => {
                            if (typeof metaField == 'object') return metaField.header.toLowerCase() === modelField.alias.toLowerCase()
                        })

                        tempField.id = modelField.id
                        tempField.columnName = modelField.columnName
                        tempField.summaryType = this.getFieldSummaryType(modelField?.aggregation)
                        tempField.caption = modelField.alias
                        tempField.dataField = `column_${index}`
                        tempField.area = this.getDataField(fieldsName)
                        if (tempField.area === 'data') {
                            tempField.format = (cellValue) => formatNumberWithLocale(cellValue, this.getFieldPrecision(tempField))
                        } else {
                            //treat row/columnm fields as text always, remove thousands separator and delimiter
                            tempField.customizeText = (cellInfo) => {
                                if (cellInfo.value === null || cellInfo.value === undefined) return ''
                                return typeof cellInfo.value === 'number' ? String(Math.trunc(cellInfo.value)) : String(cellInfo.value)
                            }
                        }

                        // if (modelField.sort) tempField.sortOrder = modelField.sort.toLowerCase()
                        // Preserve BE sort order on initial load; once user interacts with sorting, let dxPivotGrid handle it
                        if (!this.userHasSorted) tempField.sortingMethod = () => 0

                        if (tempField.area === 'column') tempField.expanded = widgetConfig.columns?.colsExpanded
                        if (tempField.area === 'row') tempField.expanded = widgetConfig.rows?.rowsExpanded

                        const menuOverrides = this.propWidget.settings?.configuration?.menuOverrides ?? []
                        const fieldOverride = menuOverrides.find((override) => override.columns.includes(modelField.id))
                        if (fieldOverride?.disableExpandAll) tempField.allowExpandAll = false

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
        //#endregion ===============================================================================================

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

            let cellTooltipConfig = null as IPivotTooltips | null
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
            const styleConfig = cellEvent.area == 'data' ? { ...this.propWidget.settings.style.fields } : { ...this.propWidget.settings.style.fieldHeaders }
            return styleConfig
        },
        mapTextAlignToVerticalAlign(textAlign: string): string {
            switch (textAlign) {
                case 'left':
                    return 'top'
                case 'center':
                    return 'middle'
                case 'right':
                    return 'bottom'
                default:
                    return 'middle'
            }
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
                const fieldIndex = cellEvent.cell.path.length - 1
                return this.pivotFields.columns[fieldIndex]
            }
            if (cellEvent.area == 'row' && !cellEvent.cell.dataIndex && cellEvent.cell.path) {
                const fieldIndex = cellEvent.cell.path.length - 1
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
        saveState() {
            const dashboardViews = this.store.getCurrentDashboardView(this.dashboardId) as IDashboardView
            const widgetId = this.propWidget.id as string
            const pivotState = this.dataSource.state()
            dashboardViews.settings.states[widgetId] = pivotState
        },
        loadState(stateToLoad) {
            const widgetId = this.propWidget.id as string
            const savedState = stateToLoad.settings.states[widgetId]
            if (savedState) this.dataSource.state(savedState)
        }
        //#endregion ===============================================================================================
    }
})
</script>
<style lang="scss">
.pivot-widget-container {
    overflow: hidden;

    // all dropzones
    &.is-dragging .dx-pivotgrid-fields-area {
        outline: 1px dashed var(--kn-color-primary) !important;
        outline-offset: -5px;
    }
    // target dropzone
    &.is-dragging .dx-drag-target {
        outline: 1px solid var(--kn-color-primary) !important;
        outline-offset: -5px;
    }

    // locked field chip — drag blocked, but sort/filter icons still clickable
    .kn-pivot-field-locked {
        pointer-events: none;
        cursor: not-allowed !important;

        .dx-area-field-content {
            opacity: 0.4;
        }

        .dx-column-indicators {
            pointer-events: auto;
            cursor: pointer;
            opacity: 1;
        }
    }

    // sort click disabled
    .kn-pivot-sort-locked {
        .dx-column-indicators .dx-sort {
            opacity: 0.3;
        }
    }
    // filter icon disabled
    .kn-pivot-filter-locked {
        .dx-column-indicators .dx-header-filter {
            pointer-events: none;
            opacity: 0.3;
        }
    }
}
</style>
