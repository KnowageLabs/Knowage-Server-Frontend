import { IWidget, ITableWidgetColumnGroup, IDataset, IWidgetCrossNavigation, IVariable, IDashboardDriver, ITableWidgetConditionalStyle } from '../../Dashboard'

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

    if (cellConditionalStyles.length > 0) conditionalStypeProps = getCellConditionalStyle(cellConditionalStyles, cellParams)
    if (brotherConditionalStyles.length > 0 && conditionalStypeProps == null) conditionalStypeProps = getBrotherConditionalStyle(brotherConditionalStyles, cellParams)

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

    if (cellConditionalStyle.condition.formula) return cellConditionalStyle.applyToWholeRow && eval(replacePlaceholders(cellParams, cellConditionalStyle.condition.formula, cellParams.dashboardVariables, cellParams.dashboardDrivers, false))
    else return cellConditionalStyle.applyToWholeRow && !cellConditionalStyle.condition.formula && isConditionMet(cellConditionalStyle.condition, cellParams.data[columnDataMap[cellConditionalStyle.target]], cellParams.variables, cellParams.drivers)
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

export const isConditionMet = (condition, valueToCompare, variables?, drivers?) => {
    let fullfilledCondition = false
    let comparer = condition.value
    if (condition.type == 'variable' && variables) comparer = variables.find((i) => i.name === condition.variable).value
    if (condition.type == 'parameter' && drivers) comparer = drivers.find((i) => i.name === condition.variable).value
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
    return fullfilledCondition
}

export const createNewTableSelection = (value: (string | number)[], columnName: string, widget: IWidget, datasets: IDataset[]) => {
    return { datasetId: widget.dataset as number, datasetLabel: getDatasetLabel(widget.dataset as number, datasets) as string, columnName: columnName, value: value, aggregated: false, timestamp: new Date().getTime() }
}

const getDatasetLabel = (datasetId: number, datasets: IDataset[]) => {
    const index = datasets.findIndex((dataset: IDataset) => dataset.id.dsId == datasetId)
    return index !== -1 ? datasets[index].label : ''
}

export const isCrossNavigationActive = (tableNode: any, crossNavigationOptions: IWidgetCrossNavigation) => {
    if (!crossNavigationOptions.enabled) return false
    if (crossNavigationOptions.type === 'singleColumn' && (!crossNavigationOptions.column || tableNode.colDef?.colId !== crossNavigationOptions.column)) return false
    if (crossNavigationOptions.type === 'icon' && tableNode.colDef?.colId !== 'iconColumn') return false
    return true
}

export const formatRowDataForCrossNavigation = (tableNode: any, dataToShow: any) => {
    const columnDefs = tableNode.columnApi?.columnModel?.columnDefs
    const rowData = tableNode.node.data
    if (!columnDefs || !rowData) return {}
    const formattedRow = {}
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

export const addIconColumn = (columns: any[], propWidget: IWidget, HeaderRenderer: any, CellRenderer: any) => {
    const crossNavigationOptions = propWidget.settings.interactions.crossNavigation as IWidgetCrossNavigation
    if (crossNavigationOptions.enabled && crossNavigationOptions.type === 'icon')
        columns.push({
            colId: 'iconColumn',
            valueGetter: `node.rowIndex + 1`,
            headerName: '',
            pinned: 'right',
            width: 55,
            sortable: false,
            filter: false,
            headerComponent: HeaderRenderer,
            headerComponentParams: { propWidget: propWidget },
            cellRenderer: CellRenderer,
            cellRendererParams: { colId: 'iconColumn', propWidget: propWidget }
        })
}
