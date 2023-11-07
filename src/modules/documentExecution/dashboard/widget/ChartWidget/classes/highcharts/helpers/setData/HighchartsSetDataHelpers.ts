import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { isConditionMet } from '@/modules/documentExecution/dashboard/widget/PivotWidget/PivotWidgetConditionalHelper'
import moment from 'moment'

export const getAllColumnsOfSpecificTypeFromDataResponse = (data: any, widgetModel: IWidget, type: 'ATTRIBUTE' | 'MEASURE') => {
    if (!data || !widgetModel.columns) return []
    const formattedColumns = [] as { column: IWidgetColumn; metadata: any }[]
    widgetModel.columns.forEach((column: IWidgetColumn) => {
        if (column.fieldType === type) {
            const metadata = data.metaData.fields.find((field: any) => field.header?.startsWith(column.columnName))
            if (metadata) formattedColumns.push({ column: column, metadata: metadata })
        }
    })
    return formattedColumns
}

export const getFormattedDateCategoryValue = (dateString: string, dateFormat: string, type: 'date' | 'timestamp') => {
    if (!dateFormat) return dateString
    const date = moment(dateString, type === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm:ss.SSS')
    return date.isValid() ? date.format(dateFormat) : dateString
}

export const setRegularData = (model: any, widgetModel: IWidget, data: any, attributeColumns: any[], measureColumns: any[], drilldownEnabled: boolean, dateFormat: string) => {
    const attributeColumn = attributeColumns[0]
    if (!attributeColumn || !attributeColumn.metadata) return

    const areaRangeColumns = [] as any[]
    measureColumns.forEach((measureColumn: any, index: number) => {
        const column = measureColumn.column as IWidgetColumn
        const metadata = measureColumn.metadata as any

        if (column.serieType !== 'arearangelow' && column.serieType !== 'arearangehigh') {
            const serieElement = { id: index, name: column.columnName, data: [] as any[], connectNulls: true, selected: true } as any
            if (column.serieType) serieElement.type = column.serieType === 'bar' ? 'column' : column.serieType
            if (model.xAxis && model.xAxis[0]) model.xAxis[0].categories = []
            data?.rows?.forEach((row: any) => {
                const serieName = dateFormat && ['date', 'timestamp'].includes(attributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[attributeColumn.metadata.dataIndex], dateFormat, attributeColumn.metadata.type) : row[attributeColumn.metadata.dataIndex]
                serieElement.data.push({
                    name: serieName,
                    y: row[metadata.dataIndex],
                    color: getColumnConditionalStyles(widgetModel, column.id, row[metadata.dataIndex])?.color,
                    drilldown: drilldownEnabled && attributeColumns.length > 1
                })
                if (model.xAxis && model.xAxis[0]) model.xAxis[0].categories.push(serieName)
            })
            model.series.push(serieElement)
        } else {
            areaRangeColumns.push(measureColumn)
        }
    })
    if (areaRangeColumns.length > 1) setRegularAreaRangeData(model, data, attributeColumn, areaRangeColumns, dateFormat)
}

const setRegularAreaRangeData = (model: any, data: any, attributeColumn: any, areaRangeColumns: any[], dateFormat: string) => {
    if (!attributeColumn || !attributeColumn.metadata) return

    const lowAreaRangeColumn = areaRangeColumns.find((areaRangeColumn: any) => areaRangeColumn.column.serieType === 'arearangelow')
    const highAreaRangeColumn = areaRangeColumns.find((areaRangeColumn: any) => areaRangeColumn.column.serieType === 'arearangehigh')

    if (!lowAreaRangeColumn || !highAreaRangeColumn) return
    const serieElement = { id: model.series.length, name: lowAreaRangeColumn.column.columnName + ' / ' + highAreaRangeColumn.column.columnName, data: [] as any[], connectNulls: true } as any
    serieElement.type = 'arearange'
    if (model.xAxis && model.xAxis[0]) model.xAxis[0].categories = []
    data?.rows?.forEach((row: any) => {
        const serieName = dateFormat && ['date', 'timestamp'].includes(attributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[attributeColumn.metadata.dataIndex], dateFormat, attributeColumn.metadata.type) : row[attributeColumn.metadata.dataIndex]
        serieElement.data.push({
            name: serieName,
            low: row[lowAreaRangeColumn.metadata.dataIndex],
            high: row[highAreaRangeColumn.metadata.dataIndex],
            drilldown: false
        })
        if (model.xAxis && model.xAxis[0]) model.xAxis[0].categories.push(serieName)
    })

    model.series.push(serieElement)
}

export const setGroupedCategoriesData = (model: any, data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) => {
    if (!data || !measureColumns[0] || attributeColumns.length < 2) return
    const measureColumn = measureColumns[0]
    const firstAttributeColumn = attributeColumns[0]
    const secondAttributeColumn = attributeColumns[1]

    const serieElement = { id: 0, name: measureColumn.column.columnName, data: [] as any[], connectNulls: true }
    const categoryValuesMap = {}
    data.rows.forEach((row: any) => {
        const firstAttributeValue = dateFormat && ['date', 'timestamp'].includes(firstAttributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[firstAttributeColumn.metadata.dataIndex], dateFormat, firstAttributeColumn.metadata.type) : row[firstAttributeColumn.metadata.dataIndex]
        serieElement.data.push({
            name: firstAttributeValue,
            y: row[measureColumn.metadata.dataIndex],
            drilldown: false
        })
        const secondAttributeValue = row[secondAttributeColumn.metadata.dataIndex]
        if (!categoryValuesMap[firstAttributeValue]) categoryValuesMap[firstAttributeValue] = { categories: [] }
        if (!categoryValuesMap[firstAttributeValue].categories.includes(secondAttributeValue)) categoryValuesMap[firstAttributeValue].categories.push(secondAttributeValue)
    })

    updateXAxisForGroupingCategoriesData(model, categoryValuesMap)
    model.series.push(serieElement)
}

const updateXAxisForGroupingCategoriesData = (model: any, categoryValuesMap: any) => {
    const axis = model.xAxis[0]
    axis.categories = []
    axis.index = 0
    Object.keys(categoryValuesMap).forEach((key: string) => {
        categoryValuesMap[key].categories?.forEach((category: string) => axis.categories.push(key + ' - ' + category))
    })
}

export const setGroupedBySeriesData = (model: any, data: any, attributeColumns: any[], measureColumns: any[]) => {
    if (!data || !attributeColumns[0] || measureColumns.length < 2) return
    const attributeColumn = attributeColumns[0]
    const firstMeasureColumn = measureColumns[0]
    const secondMeasureColumn = measureColumns[1]
    const categoryValueMap = {}
    const measureNames = [] as string[]
    data.rows.forEach((row: any) => {
        const attributeValue = row[attributeColumn.metadata.dataIndex]
        const firstMeasureValue = row[firstMeasureColumn.metadata.dataIndex]
        const secondMeasureValue = row[secondMeasureColumn.metadata.dataIndex]
        measureNames.push('' + firstMeasureValue)
        if (!categoryValueMap[attributeValue]) categoryValueMap[attributeValue] = { y: secondMeasureValue, name: '' + firstMeasureValue }
    })

    addSeriesFromCategoryValuesMapForGroupedBySeriesData(model, categoryValueMap, measureNames)
}

const addSeriesFromCategoryValuesMapForGroupedBySeriesData = (model: any, categoryValueMap: any, measureNames: string[]) => {
    Object.keys(categoryValueMap).forEach((key: string, index: number) => {
        const serieElement = { id: index, name: key, data: [] as any[], connectNulls: true }
        measureNames.forEach((measureName: string) => {
            const temp = { name: measureName } as { name: string; y?: number }
            if (categoryValueMap[key] && categoryValueMap[key].name === measureName) temp.y = categoryValueMap[key].y
            serieElement.data.push(temp)
        })
        model.series.push(serieElement)
    })
}

export const setGroupedByCategoriesData = (model: any, data: any, attributeColumns: any[], measureColumns: any[], serieForGroupingName: string) => {
    const measureForGrouping = measureColumns.find((measureColumn: any) => measureColumn.column.columnName === serieForGroupingName)
    if (!data || attributeColumns.length < 2 || !measureForGrouping) return
    const firstAttributeColumn = attributeColumns[0]
    const secondAttributeColumn = attributeColumns[1]
    const categoryValueMap = {}
    const uniqueCategoryValues = [] as string[]
    data.rows.forEach((row: any) => {
        const firstAttributeValue = row[firstAttributeColumn.metadata.dataIndex]
        if (!uniqueCategoryValues.includes(firstAttributeValue)) uniqueCategoryValues.push(firstAttributeValue)
        const secondAttributeValue = row[secondAttributeColumn.metadata.dataIndex]
        const measureForGroupingValue = row[measureForGrouping.metadata.dataIndex]
        if (!categoryValueMap[secondAttributeValue]) categoryValueMap[secondAttributeValue] = {}
        if (!categoryValueMap[secondAttributeValue][firstAttributeValue]) categoryValueMap[secondAttributeValue][firstAttributeValue] = {}
        if (measureForGroupingValue) categoryValueMap[secondAttributeValue][firstAttributeValue] = measureForGroupingValue
    })
    setUniqueCategoriesValuesFromCategoryValueMap(uniqueCategoryValues, categoryValueMap)

    const measureSerieElementValueMap = {} as any
    createSeriesForGroupedByCategoriesData(model, categoryValueMap, measureSerieElementValueMap)
    createMeasureSerieForGroupedByCategoriesData(model, measureForGrouping, measureSerieElementValueMap)
}

const setUniqueCategoriesValuesFromCategoryValueMap = (uniqueCategoryValues: string[], categoryValueMap: any) => {
    uniqueCategoryValues.forEach((categoryValue: string) => {
        Object.keys(categoryValueMap).forEach((key: string) => {
            if (!categoryValueMap[key][categoryValue]) categoryValueMap[key][categoryValue] = null
        })
    })
}

const createSeriesForGroupedByCategoriesData = (model: any, categoryValueMap: any, measureSerieElementValueMap: any) => {
    Object.keys(categoryValueMap).forEach((key: string, index: number) => {
        const serieElement = { id: index, name: key, data: [] as any[], connectNulls: true }
        Object.keys(categoryValueMap[key]).forEach((tempKey: string) => {
            const tempData = { name: tempKey } as { name: string; y?: number }
            if (categoryValueMap[key][tempKey]) {
                tempData.y = categoryValueMap[key][tempKey]
            }
            serieElement.data.push(tempData)

            if (!measureSerieElementValueMap[tempKey]) measureSerieElementValueMap[tempKey] = 0
            measureSerieElementValueMap[tempKey] += categoryValueMap[key][tempKey] ?? 0
        })
        model.series.push(serieElement)
    })
}

const createMeasureSerieForGroupedByCategoriesData = (model: any, measureForGrouping: any, measureSerieElementValueMap: any) => {
    const measureSerieElement = { id: model.series.length, name: measureForGrouping.column.columnName, data: [] as any[], connectNulls: true }
    Object.keys(measureSerieElementValueMap).forEach((key: string) => {
        measureSerieElement.data.push({ name: key, y: measureSerieElementValueMap[key] })
    })
    model.series.push(measureSerieElement)
}

export const getAllColumnsOfSpecificAxisTypeFromDataResponse = (data: any, widgetModel: IWidget, axis: 'X' | 'Y' | 'Z') => {
    if (!data || !widgetModel.columns) return []
    const formattedColumns = [] as { column: IWidgetColumn; metadata: any }[]
    widgetModel.columns.forEach((column: IWidgetColumn) => {
        if (column.axis === axis) {
            const metadata = data.metaData.fields.find((field: any) => field.header?.startsWith(column.columnName))
            if (metadata) formattedColumns.push({ column: column, metadata: metadata })
        }
    })
    return formattedColumns
}

export const setSunburstData = (model: any, data: any, widgetModel: IWidget, attributeColumns: any[], measureColumns: any[], interactionsEnabled = false) => {
    if (!data || !measureColumns[0] || attributeColumns.length < 2) return
    const measureColumn = measureColumns[0]
    const centerTextSettings = widgetModel.settings.configuration.centerText
    const serieElement = {
        id: 0,
        name: measureColumn.column.columnName,
        data: [] as any[],
        layoutAlgorithm: 'squarified',
        type: 'sunburst',
        allowDrillToNode: !interactionsEnabled,
        showInLegend: false,
        animationLimit: 1000,
        levels: [
            {
                level: 1,
                levelIsConstant: false,
                dataLabels: {
                    enabled: true,
                    backroundColor: centerTextSettings.style['background-color'] ?? '#ffffff',
                    style: {
                        fontFamily: centerTextSettings.style['font-family'] ?? 'Arial',
                        fontStyle: centerTextSettings.style['font-style'] ?? 'normal',
                        fontSize: centerTextSettings.style['font-size'] ?? '12px',
                        color: centerTextSettings.color ?? '#000000',
                        width: '10000'
                    }
                }
            },
            {
                level: 2,
                colorByPoint: true
            },
            {
                level: 3,
                colorVariation: {
                    key: 'brightness',
                    to: 0.5
                }
            },
            {
                level: 4,
                colorVariation: {
                    key: 'brightness',
                    to: 0.5
                }
            }
        ]
    }
    const hierarchy = {} as any
    createHierarchyFromData(model, hierarchy, data, attributeColumns, measureColumn)

    const treemapArray = createTreeSeriesStructureFromHierarchy(hierarchy)
    treemapArray.forEach((el: any) => {
        if (el.value === 0) delete el.value
    })
        ; (treemapArray[0].parent = null),
            (treemapArray[0].id = 'root'),
            (treemapArray[0].name = centerTextSettings.text ?? attributeColumns[0].column.columnName),
            (treemapArray[0].dataLabels = {
                enabled: true,
                backroundColor: centerTextSettings.style['background-color'] ?? '#ffffff',
                style: {
                    fontFamily: centerTextSettings.style['font-family'] ?? 'Arial',
                    fontStyle: centerTextSettings.style['font-style'] ?? 'normal',
                    fontSize: centerTextSettings.style['font-size'] ?? '12px',
                    color: centerTextSettings.color ?? '#000000',
                    width: '10000'
                }
            })
    serieElement.data = treemapArray

    model.series = [serieElement]

    let index = 0
    hierarchy.children?.forEach((el: any) => {
        model.series.push({
            id: el.id,
            type: 'area',
            name: el.name,
            color: model.colors[index],
            showInLegend: true
        })
        index++
        if (index === model.colors.length) index = 0
    })

    model.colors = []
}

export const createHierarchyFromData = (model: any, hierarchy: any, data: any, attributeColumns: any[], measureColumn: any) => {
    let id = 0
    let colorIndex = 0
    data.rows?.forEach((row: any) => {
        const formattedRow = {}
        for (let i = 0; i < attributeColumns.length; i++) {
            formattedRow['column_' + (i + 1)] = row[attributeColumns[i].metadata.dataIndex]
        }
        formattedRow['column_' + (attributeColumns.length + 1)] = row[measureColumn.metadata.dataIndex]

        let currentItem = hierarchy as any

        Object.entries(formattedRow).forEach(([key, value]) => {
            if (key === measureColumn.metadata.dataIndex) {
                if (!(key in currentItem)) currentItem.value = 0
                currentItem.value += value
                return
            }

            if (!currentItem.children) currentItem.children = []

            const childItem = currentItem.children.find((child: any) => child.name === value)
            if (childItem) {
                currentItem = childItem
            } else {
                id++
                const newChildItem = {
                    id: '' + id,
                    name: value,
                    parent: currentItem.id ? '' + currentItem.id : 'root',
                    value: 0
                } as any
                if (newChildItem.parent === 'root') {
                    newChildItem.color = model.colors[colorIndex]
                    colorIndex++
                }
                if (colorIndex === model.colors.length) colorIndex = 0
                currentItem.children.push(newChildItem)
                currentItem = newChildItem
            }
        })
    })
}

export const createTreeSeriesStructureFromHierarchy = (node: any, parentId = 'root', result = [] as any[]) => {
    const { children, ...rest } = node
    const flattenedNode = {
        ...rest,
        parent: parentId
    }

    result.push(flattenedNode)

    if (children) {
        children.forEach((child) => {
            createTreeSeriesStructureFromHierarchy(child, node.id, result)
        })
    }

    return result
}

export const getColumnConditionalStyles = (propWidget: IWidget, colId, valueToCompare: any, returnString?: boolean) => {
    const conditionalStyles = propWidget.settings.series?.conditionalStyles
    if (!conditionalStyles || !conditionalStyles.enabled) return ''
    let styleString = null as any

    const columnConditionalStyles = conditionalStyles.conditions.filter((condition) => condition.target.includes(colId) || condition.condition.formula)

    if (columnConditionalStyles.length > 0) {
        for (let i = 0; i < columnConditionalStyles.length; i++) {
            if (isConditionMet(columnConditionalStyles[i].condition, valueToCompare)) {
                if (columnConditionalStyles[i].applyToWholeRow && !returnString) {
                    styleString = columnConditionalStyles[i].properties
                } else if (returnString) {
                    styleString = Object.entries(columnConditionalStyles[i].properties)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(';')
                } else if (!returnString) {
                    styleString = columnConditionalStyles[i].properties
                }
                break
            }
        }
    }
    return styleString
}

export const setSankeyData = (model: any, data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) => {
    if (!data || !measureColumns[0] || attributeColumns.length < 2) return
    const measureColumn = measureColumns[0]
    const firstAttributeColumn = attributeColumns[0]
    const secondAttributeColumn = attributeColumns[1]
    const serieElement = { id: 0, name: measureColumn.column.columnName, data: [] as any[], showInLegend: true, colorByPoint: true, connectNulls: true }
    data.rows.forEach((row: any) => {
        const from = dateFormat && ['date', 'timestamp'].includes(row[firstAttributeColumn.metadata.type]) ? getFormattedDateCategoryValue(row[firstAttributeColumn.metadata.dataIndex], dateFormat, firstAttributeColumn.metadata.type) : row[firstAttributeColumn.metadata.dataIndex]
        const to = dateFormat && ['date', 'timestamp'].includes(row[secondAttributeColumn.metadata.type]) ? getFormattedDateCategoryValue(row[secondAttributeColumn.metadata.dataIndex], dateFormat, secondAttributeColumn.metadata.type) : row[secondAttributeColumn.metadata.dataIndex]
        serieElement.data.push({
            name: from + ' -> ' + to,
            from: from,
            to: to,
            weight: row[measureColumn.metadata.dataIndex],
            y: row[measureColumn.metadata.dataIndex],
            drilldown: false
        })
    })

    model.series.push(serieElement)
}
