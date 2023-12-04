import { IWidget, IWidgetColumn, ITableWidgetColumnGroup, IWidgetInteractionParameter, ITableWidgetSettings, ITableWidgetConfiguration, ITableWidgetHeaders, ITableWidgetVisualization, ITableWidgetConditionalStyles, IWidgetInteractions, IWidgetSelection, ITableWidgetColumnGroups, IWidgetCrossNavigation, ITableWidgetTooltipStyle, ITableWidgetColumnStyles } from "../../../../Dashboard"
import { emitter } from '../../../../DashboardHelpers'
import * as  tableWidgetDefaultValues from './TableWidgetDefaultValues'
import * as widgetCommonDefaultValues from '../common/WidgetCommonDefaultValues'

export const createNewTableWidgetSettings = () => {
    return {
        sortingColumn: '',
        sortingOrder: '',
        updatable: true,
        clickable: true,
        conditionalStyles: tableWidgetDefaultValues.getDefaultConditionalStyles(),
        configuration: {
            columnGroups: tableWidgetDefaultValues.getDefaultColumnGroups(),
            exports: tableWidgetDefaultValues.getDefaultExportsConfiguration(),
            headers: tableWidgetDefaultValues.getDefaultHeadersConfiguration(),
            rows: tableWidgetDefaultValues.getDefaultRowsConfiguration(),
            summaryRows: tableWidgetDefaultValues.getDefaultSummaryRowsConfiguration(),
            customMessages: tableWidgetDefaultValues.getDefaultCustomMessages(),
            widgetMenu: { enabled: true }
        },
        interactions: {
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            link: widgetCommonDefaultValues.getDefaultLinks(),
            preview: widgetCommonDefaultValues.getDefaultPreview(),
            selection: tableWidgetDefaultValues.getDefaultSelection(),
            iframe: widgetCommonDefaultValues.getDefaultIFrameInteraction()
        },
        pagination: tableWidgetDefaultValues.getDefaultPagination(),
        style: {
            themeName: '',
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            columns: tableWidgetDefaultValues.getDefaultColumnStyles(),
            columnGroups: tableWidgetDefaultValues.getDefaultColumnStyles(),
            headers: tableWidgetDefaultValues.getDefaultHeadersStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            rows: tableWidgetDefaultValues.getDefaultRowsStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            summary: tableWidgetDefaultValues.getDefualtSummryStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle(),
            paginator: tableWidgetDefaultValues.getDefaultPaginatorStyle()
        },
        tooltips: tableWidgetDefaultValues.getDefaultTooltips(),
        visualization: tableWidgetDefaultValues.getDefaultVisualizations(),
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes()
    } as ITableWidgetSettings
}

export const removeColumnFromTableWidgetModel = (widgetModel: IWidget, column: IWidgetColumn) => {
    removeColumnFromRows(widgetModel, column)
    removeColumnFromSubmodel(column, widgetModel.settings.configuration.headers.custom.rules, 'target', 'headersColumnRemoved', false)
    removeColumnFromSubmodel(column, widgetModel.settings.configuration.columnGroups.groups, 'columns', 'columnRemovedFromColumnGroups', false)
    removeColumnFromSubmodel(column, widgetModel.settings.visualization.visualizationTypes.types, 'target', 'columnRemovedFromVisibilityTypes', true)
    removeColumnFromSubmodel(column, widgetModel.settings.visualization.visibilityConditions.conditions, 'target', 'columnRemovedFromVisibilityConditions', false)
    removeColumnFromSubmodel(column, widgetModel.settings.style.columns.styles, 'target', 'columnRemovedFromColumnStyle', true)
    removeColumnFromSubmodel(column, widgetModel.settings.conditionalStyles.conditions, 'target', 'columnRemovedFromConditionalStyles', false)
    removeColumnFromSubmodel(column, widgetModel.settings.tooltips, 'target', 'columnRemovedFromTooltips', true)
    removeColumnFromCrossNavigation(widgetModel, column)
}

const removeColumnFromRows = (widgetModel: IWidget, column: IWidgetColumn) => {
    if (column.id === widgetModel.settings.configuration.rows.rowSpan.column) {
        widgetModel.settings.configuration.rows.rowSpan.column = ''
        emitter.emit('columnRemovedFromRows')
    }
}

export const removeColumnFromSubmodel = (column: IWidgetColumn, array: any[], subProperty: string, eventToEmit: string, allColumnsOption: boolean) => {
    let removed = false
    for (let i = array.length - 1; i >= (allColumnsOption ? 1 : 0); i--) {
        for (let j = (array[i][subProperty] as string[]).length; j >= 0; j--) {
            const tempTarget = array[i][subProperty][j]
            if (column.id === tempTarget) {
                (array[i][subProperty] as string[]).splice(j, 1)
                removed = true
            }
        }
        if ((array[i][subProperty] as string[]).length === 0) array.splice(i, 1)
    }
    if (removed) emitter.emit(eventToEmit)
}

const removeColumnFromCrossNavigation = (widgetModel: IWidget, column: IWidgetColumn) => {
    const crossNavigation = widgetModel.settings.interactions.crossNavigation
    if (crossNavigation.column === column.id) {
        crossNavigation.enabled = false;
        crossNavigation.parameters.forEach((parameter: IWidgetInteractionParameter) => {
            parameter.enabled = false
            if (parameter.column === column.columnName) parameter.column = ''
        })
        emitter.emit('columnRemovedFromCrossNavigation')
    }
}

export const removeColumnGroupFromModel = (widgetModel: IWidget, columnGroup: ITableWidgetColumnGroup) => {
    let removed = false
    for (let i = widgetModel.settings.style.columnGroups.styles.length - 1; i >= 0; i--) {
        for (let j = widgetModel.settings.style.columnGroups[i].target.length; j >= 0; j--) {
            const tempTarget = widgetModel.settings.style.columnGroups[i].target[j]
            if (columnGroup.id === tempTarget) {
                (widgetModel.settings.style.columnGroups[i].target as string[]).splice(j, 1)
                removed = true
            }
        }
        if (widgetModel.settings.style.columnGroups[i].target.length === 0) widgetModel.settings.style.columnGroups.styles.splice(i, 1)
    }
    if (removed) emitter.emit('columnGroupRemoved')
}

export default removeColumnFromTableWidgetModel

const columnNameIdMap = {}

export function formatDashboardTableWidgetAfterLoading(widget: IWidget) {
    if (!widget) return

    loadColumnNameIdMap(widget)
    formatTableSettings(widget.settings)
}


const loadColumnNameIdMap = (widget: IWidget) => {
    widget.columns?.forEach((column: IWidgetColumn) => {
        if (column.columnName) columnNameIdMap[column.columnName] = column.id
    })
}

const getColumnId = (columnName: string) => {
    return columnName ? columnNameIdMap[columnName] : ''
}

const formatTableSettings = (widgetSettings: ITableWidgetSettings) => {
    if (widgetSettings.sortingColumn) widgetSettings.sortingColumn = getColumnId(widgetSettings.sortingColumn)
    formatTableWidgetConfiguration(widgetSettings.configuration)
    formatTableWidgetColumnStyles(widgetSettings.style.columns)
    formatTableWidgetColumnStyles(widgetSettings.style.columnGroups)
    formatTableWidgetVisualisation(widgetSettings.visualization)
    formatTableWidgetConditionalStyle(widgetSettings.conditionalStyles)
    formatTableWidgetTooltips(widgetSettings.tooltips)
    formatTableInteractions(widgetSettings.interactions)
}

const formatTableWidgetConfiguration = (widgetConfiguration: ITableWidgetConfiguration) => {
    formatRowsConfiguration(widgetConfiguration)
    formatHeadersConfiguration(widgetConfiguration)
    formatColumnGroups(widgetConfiguration)
}

const formatTableWidgetColumnStyles = (columnStyles: ITableWidgetColumnStyles) => {
    for (let i = 0; i < columnStyles.styles.length; i++) {
        const tempStyle = columnStyles.styles[i]
        const formattedTargetColumns = [] as string[]
        if (Array.isArray(tempStyle.target)) {
            for (let j = 0; j < tempStyle.target.length; j++) {
                formattedTargetColumns.push(getColumnId(tempStyle.target[j]))
            }
            tempStyle.target = formattedTargetColumns
        }
    }
}

const formatRowsConfiguration = (widgetConfiguration: ITableWidgetConfiguration) => {
    if (!widgetConfiguration.rows) return
    widgetConfiguration.rows.rowSpan.column = getColumnId(widgetConfiguration.rows.rowSpan.column)
}

const formatHeadersConfiguration = (widgetConfiguration: ITableWidgetConfiguration) => {
    if (!widgetConfiguration.headers) return
    formatHeaderConfigurationRules(widgetConfiguration.headers)
}

const formatHeaderConfigurationRules = (configurationHeaders: ITableWidgetHeaders) => {
    for (let i = 0; i < configurationHeaders.custom.rules.length; i++) {
        const tempRule = configurationHeaders.custom.rules[i]
        const formattedRuleColumns = [] as string[]
        for (let j = 0; j < tempRule.target.length; j++) {
            formattedRuleColumns.push(getColumnId(tempRule.target[j]))
        }
        tempRule.target = formattedRuleColumns
        delete tempRule.variablePivotDatasetOptions
    }
}

const formatColumnGroups = (widgetConfiguration: ITableWidgetConfiguration) => {
    if (!widgetConfiguration.columnGroups) return
    formatColumnGroupsColumnIdToName(widgetConfiguration.columnGroups)
}

const formatTableWidgetVisualisation = (widgetVisualization: ITableWidgetVisualization) => {
    formatVisualizationTypes(widgetVisualization)
    formatVisibilityConditions(widgetVisualization)
}

const formatVisualizationTypes = (widgetVisualization: ITableWidgetVisualization) => {
    for (let i = 1; i < widgetVisualization.visualizationTypes.types.length; i++) {
        const tempVisualization = widgetVisualization.visualizationTypes.types[i]
        const formattedRuleColumns = [] as string[]
        for (let j = 0; j < tempVisualization.target.length; j++) {
            formattedRuleColumns.push(getColumnId(tempVisualization.target[j]))
        }
        tempVisualization.target = formattedRuleColumns
    }
}
const formatVisibilityConditions = (widgetVisualization: ITableWidgetVisualization) => {
    for (let i = 0; i < widgetVisualization.visibilityConditions.conditions.length; i++) {
        const tempCondition = widgetVisualization.visibilityConditions.conditions[i]
        const formattedRuleColumns = [] as string[]
        for (let j = 0; j < tempCondition.target.length; j++) {
            formattedRuleColumns.push(getColumnId(tempCondition.target[j]))
        }
        tempCondition.target = formattedRuleColumns
        delete tempCondition.condition.variablePivotDatasetOptions
    }
}

const formatTableWidgetConditionalStyle = (widgetConditionalStyles: ITableWidgetConditionalStyles) => {
    for (let i = 0; i < widgetConditionalStyles.conditions.length; i++) {
        const tempCondition = widgetConditionalStyles.conditions[i]
        tempCondition.target = getColumnId(tempCondition.target)
    }
}


const formatColumnGroupsColumnIdToName = (columnGroupsConfiguration: ITableWidgetColumnGroups) => {
    for (let i = 0; i < columnGroupsConfiguration.groups.length; i++) {
        const tempColumnGroup = columnGroupsConfiguration.groups[i]
        const formattedColumnGroupColumns = [] as string[]
        for (let j = 0; j < tempColumnGroup.columns.length; j++) {
            formattedColumnGroupColumns.push(getColumnId(tempColumnGroup.columns[j]))
        }
        tempColumnGroup.columns = formattedColumnGroupColumns
    }
}


const formatTableWidgetTooltips = (tableTooltips: ITableWidgetTooltipStyle[]) => {
    for (let i = 1; i < tableTooltips.length; i++) {
        const tempTooltip = tableTooltips[i]
        const formattedTooltipColumns = [] as string[]
        for (let j = 0; j < tempTooltip.target.length; j++) {
            formattedTooltipColumns.push(getColumnId(tempTooltip.target[j]))
        }
        tempTooltip.target = formattedTooltipColumns
    }
}

const formatTableInteractions = (widgetInteractions: IWidgetInteractions) => {
    formatSelection(widgetInteractions.selection as IWidgetSelection)
    formatCrossNavigation(widgetInteractions.crossNavigation)
}

const formatSelection = (selection: IWidgetSelection) => {
    if (selection.modalColumn) selection.modalColumn = getColumnId(selection.modalColumn)
}

const formatCrossNavigation = (crossNavigation: IWidgetCrossNavigation) => {
    if (crossNavigation.column) crossNavigation.column = getColumnId(crossNavigation.column)
}
