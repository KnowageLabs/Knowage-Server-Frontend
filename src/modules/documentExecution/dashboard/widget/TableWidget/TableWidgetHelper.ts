import deepcopy from 'deepcopy'
import { IWidget, ITableWidgetColumnGroup, IDataset, IWidgetCrossNavigation, IVariable, IDashboardDriver, ITableWidgetConditionalStyle, IWidgetLinks, IFrameInteractionSettings, ITableWidgetLink, IWidgetPreview, IWidgetInteractions, ITableWidgetTooltipStyle } from '../../Dashboard'
import { IPivotTooltips } from '../../interfaces/pivotTable/DashboardPivotTableWidget'
import { replaceDriversPlaceholdersByDriverName, replaceVariablesPlaceholdersByVariableName } from '../interactionsHelpers/InteractionsParserHelper'

export const getColumnGroup = (propWidget: IWidget, col: ITableWidgetColumnGroup) => {
    const modelGroups = propWidget.settings.configuration.columnGroups.groups
    if (propWidget.settings.configuration.columnGroups.enabled && modelGroups && modelGroups.length > 0) {
        for (const k in modelGroups) {
            if (modelGroups[k].columns.includes(col.id)) {
                return modelGroups[k]
            }
        }
    } else return false
}

export const getWidgetStyleByType = (propWidget: IWidget, styleType: string) => {
    const styleSettings = propWidget?.settings.style[styleType]
    if (styleSettings?.enabled) {
        const styleString = Object.entries(styleSettings.properties ?? styleSettings)
            .map(([k, v]) => `${k}:${v}`)
            .join(';')
        return styleString + ';'
    } else return ''
}

export const stringifyStyleProperties = (properties: object) => {
    const styleString = Object.entries(properties)
        .map(([k, v]) => `${k}:${v}`)
        .join(';')
    return styleString + ';'
}

export const getWidgetStyleByTypeWithoutValidation = (propWidget: IWidget, styleType: string) => {
    const styleSettings = propWidget.settings.style[styleType]
    const styleString = Object.entries(styleSettings.properties ?? styleSettings)
        .map(([k, v]) => `${k}:${v}`)
        .join(';')
    return styleString + ';'
}

export const getCellConditionalStyles = (cellParams: any) => {
    let conditionalStypeProps = null as any
    const cellConditionalStyles = cellParams.columnsWithConditionalStyles.filter((condition) => condition.target.includes(cellParams.colId)) as ITableWidgetConditionalStyle[]
    const brotherConditionalStyles = cellParams.columnsWithConditionalStyles.filter((condition) => !condition.target.includes(cellParams.colId)) as ITableWidgetConditionalStyle[]

    // console.group(`----- ${cellParams.colDef.columnName} : ${cellParams.value} -----`)
    // console.log('%c cellConditionalStyles', 'background: #222; color: #bada55', cellConditionalStyles)
    // console.log('%c brotherConditionalStyles', 'background: #222; color: #bada55', brotherConditionalStyles)
    // console.groupEnd()

    if (cellConditionalStyles.length > 0) conditionalStypeProps = getCellConditionalStyle(cellConditionalStyles, cellParams)
    console.group(`----- ${cellParams.colDef.columnName} : ${cellParams.value} -----`)
    // console.log('%c getCellConditionalStyle', 'background: #222; color: #bada55', conditionalStypeProps)
    // console.log('%c brotherConditionalStyles', 'background: #222; color: #bada55', brotherConditionalStyles)
    // console.groupEnd()

    // console.log('%c BREAK ==========================', 'background: #222; color: #bada55')

    if (brotherConditionalStyles.length > 0 && conditionalStypeProps == null) conditionalStypeProps = getBrotherConditionalStyle(brotherConditionalStyles, cellParams)
    // console.group(`----- ${cellParams.colDef.columnName} : ${cellParams.value} -----`)
    // console.log('%c brotherConditionalStyles', 'background: #222; color: #bada55', getBrotherConditionalStyle(brotherConditionalStyles, cellParams))
    // console.log('%c brotherConditionalStyles', 'background: #222; color: #bada55', brotherConditionalStyles)
    console.groupEnd()

    return conditionalStypeProps
}

const getCellConditionalStyle = (cellConditionalStyles: ITableWidgetConditionalStyle[], cellParams: any) => {
    for (let i = 0; i < cellConditionalStyles.length; i++) {
        const cellConditionalStyle = cellConditionalStyles[i]
        if (isCellConditionMet(cellConditionalStyle, cellParams)) return cellConditionalStyle.properties
    }
}

const isCellConditionMet = (cellConditionalStyle: ITableWidgetConditionalStyle, cellParams: any) => {
    if (cellConditionalStyle.condition.formula) return eval(replacePlaceholders(cellParams, cellConditionalStyle.condition.formula, cellParams.dashboardVariables, cellParams.dashboardDrivers, false))
    else return !cellConditionalStyle.condition.formula && isConditionMet(cellConditionalStyle.condition, cellParams.value, cellParams.dashboardVariables, cellParams.dashboardDrivers)
}

const getBrotherConditionalStyle = (brotherConditionalStyles: ITableWidgetConditionalStyle[], cellParams: any) => {
    for (let i = 0; i < brotherConditionalStyles.length; i++) {
        const brotherConditionalStyle = brotherConditionalStyles[i]
        if (isBrotherConditionMet(brotherConditionalStyle, cellParams)) return brotherConditionalStyle.properties
    }
}

const isBrotherConditionMet = (cellConditionalStyle: ITableWidgetConditionalStyle, cellParams: any) => {
    const columnDataMap = cellParams.columnDataMap
    console.log('%c cellConditionalStyle.condition', 'background: #222; color: #bada55', cellConditionalStyle.condition)
    console.log('%c cellParams', 'background: #222; color: #bada55', cellParams)
    console.log('%c columnDataMap', 'background: #222; color: #bada55', columnDataMap)
    console.log('%c cellConditionalStyle.target', 'background: #222; color: #bada55', cellConditionalStyle.target)
    console.log('%c mapTarget', 'background: #222; color: #bada55', [columnDataMap[cellConditionalStyle.target]])
    console.log('%c value', 'background: #222; color: #bada55', cellParams.data[columnDataMap[cellConditionalStyle.target]])
    // console.log('%c isConditionMet', 'background: #222; color:rgb(85, 169, 218)', isConditionMet(cellConditionalStyle.condition, cellParams.data[columnDataMap[cellConditionalStyle.target]], cellParams.variables, cellParams.drivers))
    if (cellConditionalStyle.condition.formula) return cellConditionalStyle.applyToWholeRow && eval(replacePlaceholders(cellParams, cellConditionalStyle.condition.formula, cellParams.dashboardVariables, cellParams.dashboardDrivers, false))
    else return cellConditionalStyle.applyToWholeRow && !cellConditionalStyle.condition.formula && isConditionMet(cellConditionalStyle.condition, cellParams.data[columnDataMap[cellConditionalStyle.target]], cellParams.variables, cellParams.drivers, cellParams)
}

const replacePlaceholders = (cellParams, formula, variables: IVariable[], drivers: IDashboardDriver[], skipAdapting: boolean) => {
    function adaptToType(value) {
        if (skipAdapting) return value
        else return isNaN(value) ? '"' + value + '"' : value
    }
    // variables
    formula = formula.replace(/\$V\{([a-zA-Z0-9_\-.]+)\}/g, (match, variableName) => {
        if (variables && variables.length > 0) {
            const dashboardVariable = variables.find((variable) => variable.name === variableName)
            if (dashboardVariable) return adaptToType(dashboardVariable.value)
        }
    })
    // fields
    formula = formula.replace(/\$F\{([a-zA-Z0-9_\-.]+)\}/g, (match, field) => {
        const columnToCompareIndex = cellParams.propWidget.columns.findIndex((column) => column.columnName === field)
        // if(colToCompare) return adaptToType(data)
        return adaptToType(cellParams.data[`column_${columnToCompareIndex + 1}`])
    })
    // parameters/drivers
    formula = formula.replace(/\$P\{([a-zA-Z0-9_\-.]+)\}/g, (match, parameterName) => {
        if (drivers && drivers.length > 0) {
            const dashboardVariable = drivers.find((driver) => driver.urlName === parameterName)
            if (dashboardVariable) return adaptToType(dashboardVariable.value)
        }
    })

    return formula
}

export const isConditionMet = (condition, valueToCompare, variables?, drivers?, cellParams?) => {
    // console.log('%c cellParams', 'background: #222; color:rgb(85, 169, 218)', cellParams)
    let fullfilledCondition = false
    let comparer = condition.value
    if (condition.type == 'variable' && variables) comparer = variables.find((i) => i.name === condition.variable).value
    if (condition.type == 'parameter' && drivers) comparer = drivers.find((i) => i.name === condition.variable).value

    // console.log('%c condition', 'background: #222; color:rgb(89, 218, 85)', comparer)
    // console.log('%c valueToCompare', 'background: #222; color:rgb(218, 85, 85)', valueToCompare, condition)

    switch (condition.operator) {
        case '==':
            fullfilledCondition = valueToCompare == comparer
            break
        case '>=':
            fullfilledCondition = valueToCompare >= comparer
            break
        case '<=':
            fullfilledCondition = valueToCompare <= comparer
            break
        case 'IN':
            fullfilledCondition = comparer.split(',').indexOf(valueToCompare) != -1
            break
        case '>':
            fullfilledCondition = valueToCompare > comparer
            break
        case '<':
            fullfilledCondition = valueToCompare < comparer
            break
        case '!=':
            fullfilledCondition = valueToCompare != comparer
            break
    }
    // console.log('%c fullfilledCondition', 'background: #222; color:rgb(167, 218, 85)', fullfilledCondition)
    return fullfilledCondition
}

export const createNewTableSelection = (value: (string | number)[], columnName: string, widget: IWidget, datasets: IDataset[]) => {
    return { datasetId: widget.dataset as number, datasetLabel: getDatasetLabel(widget.dataset as number, datasets) as string, columnName: columnName, value: value, aggregated: false, timestamp: new Date().getTime() }
}

const getDatasetLabel = (datasetId: number, datasets: IDataset[]) => {
    const index = datasets.findIndex((dataset: IDataset) => dataset.id.dsId == datasetId)
    return index !== -1 ? datasets[index].label : ''
}

export const formatRowDataForCrossNavigation = (tableNode: any, dataToShow: any) => {
    const columnDefs = tableNode.api.getColumnDefs()
    const rowData = tableNode.node.data
    if (!columnDefs || !rowData) return {}
    const formattedRow = { columnName: tableNode.colDef?.columnName ?? '' }
    columnDefs.forEach((columnDef: any) => (formattedRow[columnDef.columnName] = { value: rowData[columnDef.field], type: getColumnType(columnDef.field, dataToShow) }))
    return formattedRow
}

export const getFormattedClickedValueForCrossNavigation = (tableNode: any, dataToShow: any) => {
    const type = tableNode.colDef?.colId === 'iconColumn' ? 'icon' : getColumnType(tableNode.colDef?.field, dataToShow)
    return { value: tableNode.value, type: type }
}

const getColumnType = (columnField: string, dataToShow: any) => {
    if (!dataToShow.metaData || !dataToShow.metaData.fields) return ''
    const index = dataToShow.metaData.fields.findIndex((field: any) => field.name === columnField)
    return index !== -1 ? dataToShow.metaData.fields[index].type : ''
}

export const getActiveInteractions = (tableNode: any, widgetInteracitonsConfiguration: IWidgetInteractions) => {
    const activeInteractions = []
    addActiveCrossNavigationInteractions(tableNode, activeInteractions, widgetInteracitonsConfiguration.crossNavigation)
    addActiveLinkInteractions(tableNode, activeInteractions, widgetInteracitonsConfiguration.link)
    addActivePreviewInteractions(tableNode, activeInteractions, widgetInteracitonsConfiguration.preview)
    addActiveIFrameInteractions(tableNode, activeInteractions, widgetInteracitonsConfiguration.iframe)
    return activeInteractions
}

const addActiveCrossNavigationInteractions = (tableNode: any, activeInteractions: any[], crossNavigationSettings: IWidgetCrossNavigation | undefined) => {
    if (!crossNavigationSettings || !crossNavigationSettings.enabled) return
    const isSingleColumnNavigationActiveForSelectedColumn = crossNavigationSettings.type === 'singleColumn' && crossNavigationSettings.column && tableNode.colDef?.colId === crossNavigationSettings.column
    if (crossNavigationSettings.type === 'allRow' || isSingleColumnNavigationActiveForSelectedColumn) activeInteractions.push({ ...crossNavigationSettings, interactionType: 'crossNavigation' })
}

const addActiveLinkInteractions = (tableNode: any, activeInteractions: any[], linkSettings: IWidgetLinks | undefined) => {
    if (!linkSettings || !linkSettings.enabled) return
    linkSettings.links.forEach((link: ITableWidgetLink) => {
        const isSingleColumnNavigationActiveForSelectedColumn = link.type === 'singleColumn' && isLinkColumnInteractionActive(tableNode, linkSettings)
        if (link.type === 'allRow' || isSingleColumnNavigationActiveForSelectedColumn) activeInteractions.push({ ...link, interactionType: 'link' })
    })
}

const isLinkColumnInteractionActive = (tableNode: any, linkOptions: IWidgetLinks) => {
    if (!tableNode.colDef?.columnName) return false
    const index = linkOptions.links.findIndex((link: ITableWidgetLink) => link.type === 'singleColumn' && link.column === tableNode.colDef.columnName)
    return index !== -1
}

const addActivePreviewInteractions = (tableNode: any, activeInteractions: any[], previewSettings: IWidgetPreview | undefined) => {
    if (!previewSettings || !previewSettings.enabled) return
    const isSingleColumnNavigationActiveForSelectedColumn = previewSettings.type === 'singleColumn' && previewSettings.column && tableNode.colDef?.columnName === previewSettings.column
    if (previewSettings.type === 'allRow' || isSingleColumnNavigationActiveForSelectedColumn) activeInteractions.push({ ...previewSettings, interactionType: 'preview' })
}

const addActiveIFrameInteractions = (tableNode: any, activeInteractions: any[], iFrameInteractionSettings: IFrameInteractionSettings | undefined) => {
    if (!iFrameInteractionSettings || !iFrameInteractionSettings.enabled) return
    const isSingleColumnNavigationActiveForSelectedColumn = iFrameInteractionSettings.type === 'singleColumn' && iFrameInteractionSettings.column && tableNode.colDef?.colId === iFrameInteractionSettings.column
    if (iFrameInteractionSettings.type === 'allRow' || isSingleColumnNavigationActiveForSelectedColumn) activeInteractions.push({ ...iFrameInteractionSettings, interactionType: 'iframe' })
}

export const replaceTooltipConfigurationVariablesAndParametersPlaceholders = (columnTooltipConfiguration: ITableWidgetTooltipStyle | IPivotTooltips | null, variables: IVariable[], dashboardDrivers: IDashboardDriver[]) => {
    if (!columnTooltipConfiguration) return columnTooltipConfiguration
    const tooltipConfiguration = deepcopy(columnTooltipConfiguration)
    if (tooltipConfiguration.prefix) tooltipConfiguration.prefix = replaceVariablesPlaceholdersByVariableName(tooltipConfiguration.prefix, variables)
    if (tooltipConfiguration.suffix) tooltipConfiguration.suffix = replaceVariablesPlaceholdersByVariableName(tooltipConfiguration.suffix, variables)
    if (tooltipConfiguration.header?.text) {
        tooltipConfiguration.header.text = replaceVariablesPlaceholdersByVariableName(tooltipConfiguration.header.text, variables)
        tooltipConfiguration.header.text = replaceDriversPlaceholdersByDriverName(tooltipConfiguration.header.text, dashboardDrivers)
    }
    return tooltipConfiguration
}
