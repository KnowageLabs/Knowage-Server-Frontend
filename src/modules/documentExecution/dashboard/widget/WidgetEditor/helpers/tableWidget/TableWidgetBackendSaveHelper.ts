import { ITableWidgetColumnGroups, ITableWidgetConditionalStyles, ITableWidgetConfiguration, IWidgetCrossNavigation, ITableWidgetHeaders, IWidgetInteractions, IWidgetSelection, ITableWidgetSettings, ITableWidgetVisualization, IWidget, ITableWidgetTooltipStyle, ITableWidgetColumnStyles } from '../../../../Dashboard'

export function formatTableWidgetForSave(widget: IWidget) {
    if (!widget) return

    // Per-column settings (styles, precision, alignment, visualization types, tooltips,
    // column groups, header rules, sorting, selection, cross navigation) are persisted
    // using the column's stable `id`, NOT its physical field name (`columnName`).
    //
    // The id is what keeps two columns built from the SAME field distinct — e.g. the same
    // UNIT_SALES field used as two measures with different aggregations/aliases. Collapsing
    // targets to columnName merged those columns together on reload, so styles were shared
    // and one alias overwrote the other. We therefore keep `column.id` on the saved model
    // (see addColumnIdsToWidgetColumns / formatDashboardTableWidgetAfterLoading on load).
    formatTableSettings(widget.settings)
}

// Targets already reference the column `id` in the in-memory model, so persistence is an
// identity mapping. Kept as a single indirection point so the save/load token format stays
// symmetric with getColumnId() in TableWidgetFunctions.ts.
const getColumnName = (columnId: string) => {
    return columnId || ''
}

const formatTableSettings = (widgetSettings: ITableWidgetSettings) => {
    if (widgetSettings.sortingColumn) widgetSettings.sortingColumn = getColumnName(widgetSettings.sortingColumn)
    formatTableWidgetConfiguration(widgetSettings.configuration)
    formatTableWidgetColumnStyles(widgetSettings.style.columns)
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
                formattedTargetColumns.push(getColumnName(tempStyle.target[j]))
            }
            tempStyle.target = formattedTargetColumns
        }
    }
}

const formatRowsConfiguration = (widgetConfiguration: ITableWidgetConfiguration) => {
    if (!widgetConfiguration.rows) return
    const rowSpan = widgetConfiguration.rows.rowSpan as any
    if (Array.isArray(rowSpan.columns)) {
        rowSpan.columns = rowSpan.columns.map((id: string) => getColumnName(id)).filter(Boolean)
    }
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
            formattedRuleColumns.push(getColumnName(tempRule.target[j]))
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
            formattedRuleColumns.push(getColumnName(tempVisualization.target[j]))
        }
        tempVisualization.target = formattedRuleColumns
    }
}
const formatVisibilityConditions = (widgetVisualization: ITableWidgetVisualization) => {
    for (let i = 0; i < widgetVisualization.visibilityConditions.conditions.length; i++) {
        const tempCondition = widgetVisualization.visibilityConditions.conditions[i]
        const formattedRuleColumns = [] as string[]
        for (let j = 0; j < tempCondition.target.length; j++) {
            formattedRuleColumns.push(getColumnName(tempCondition.target[j]))
        }
        tempCondition.target = formattedRuleColumns
        delete tempCondition.condition.variablePivotDatasetOptions
    }
}

const formatTableWidgetConditionalStyle = (widgetConditionalStyles: ITableWidgetConditionalStyles) => {
    for (let i = 0; i < widgetConditionalStyles.conditions.length; i++) {
        const tempCondition = widgetConditionalStyles.conditions[i]
        tempCondition.target = getColumnName(tempCondition.target)
        delete tempCondition.condition.variablePivotDatasetOptions
    }
}

const formatColumnGroupsColumnIdToName = (columnGroupsConfiguration: ITableWidgetColumnGroups) => {
    for (let i = 0; i < columnGroupsConfiguration.groups.length; i++) {
        const tempColumnGroup = columnGroupsConfiguration.groups[i]
        const formattedColumnGroupColumns = [] as string[]
        for (let j = 0; j < tempColumnGroup.columns.length; j++) {
            formattedColumnGroupColumns.push(getColumnName(tempColumnGroup.columns[j]))
        }
        tempColumnGroup.columns = formattedColumnGroupColumns
    }
}

const formatTableWidgetTooltips = (tableTooltips: ITableWidgetTooltipStyle[]) => {
    for (let i = 1; i < tableTooltips.length; i++) {
        const tempTooltip = tableTooltips[i]
        const formattedTooltipColumns = [] as string[]
        for (let j = 0; j < tempTooltip.target.length; j++) {
            formattedTooltipColumns.push(getColumnName(tempTooltip.target[j]))
        }
        tempTooltip.target = formattedTooltipColumns
    }
}

const formatTableInteractions = (widgetInteractions: IWidgetInteractions) => {
    formatSelection(widgetInteractions.selection as IWidgetSelection)
    formatCrossNavigation(widgetInteractions.crossNavigation)
}

const formatSelection = (selection: IWidgetSelection) => {
    if (selection.modalColumn) selection.modalColumn = getColumnName(selection.modalColumn)
    if (selection.column) selection.column = getColumnName(selection.column)
    if (!selection.type) selection.type = 'allRow'
}

const formatCrossNavigation = (crossNavigation: IWidgetCrossNavigation) => {
    if (crossNavigation.column) crossNavigation.column = getColumnName(crossNavigation.column)
}
