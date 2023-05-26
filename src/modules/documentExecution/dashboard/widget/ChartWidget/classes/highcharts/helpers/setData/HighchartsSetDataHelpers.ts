import { IWidget, IWidgetColumn } from "@/modules/documentExecution/dashboard/Dashboard"
import moment from "moment"

export const getAllColumnsOfSpecificTypeFromDataResponse = (data: any, widgetModel: IWidget, type: 'ATTRIBUTE' | 'MEASURE') => {
    if (!data || !widgetModel.columns) return []
    const formattedColumns = [] as { column: IWidgetColumn, metadata: any }[]
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

// TODO - We take first attribute, unlimited measures
export const setRegularData = (model: any, data: any, attributeColumns: any[], measureColumns: any[], drilldownEnabled: boolean, dateFormat: string) => {
    const attributeColumn = attributeColumns[0]
    if (!attributeColumn || !attributeColumn.metadata) return

    measureColumns.forEach((measureColumn: any, index: number) => {
        const column = measureColumn.column as IWidgetColumn
        const metadata = measureColumn.metadata as any
        const serieElement = { id: index, name: column.columnName, data: [] as any[], connectNulls: true }
        data?.rows?.forEach((row: any) => {
            serieElement.data.push({
                name: dateFormat && ['date', 'timestamp'].includes(attributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[attributeColumn.metadata.dataIndex], dateFormat, attributeColumn.metadata.type) : row[attributeColumn.metadata.dataIndex],
                y: row[metadata.dataIndex],
                drilldown: drilldownEnabled && attributeColumns.length > 1
            })
        })
        model.series.push(serieElement)
    })
}

// TODO - We take exactly 2 attributes, first measure
export const setGroupedCategoriesData = (model: any, data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) => {
    if (!data || !measureColumns[0] || attributeColumns.length < 2) return
    const measureColumn = measureColumns[0]
    const firstAttributeColumn = attributeColumns[0]
    const secondAttributeColumn = attributeColumns[1]
    const serieElement = { id: 0, name: measureColumn.column.columnName, data: [] as any[], connectNulls: true }
    const categoryValuesMap = {}
    data.rows.forEach((row: any) => {
        serieElement.data.push({
            name: dateFormat && ['date', 'timestamp'].includes(row[firstAttributeColumn.metadata.type]) ? getFormattedDateCategoryValue(row[firstAttributeColumn.metadata.dataIndex], dateFormat, row[firstAttributeColumn]) : row[firstAttributeColumn.metadata.dataIndex],
            y: row[measureColumn.metadata.dataIndex],
            drilldown: false
        })
        const firstAttributeValue = row[firstAttributeColumn.metadata.dataIndex]
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
        // TODO PR - Problem with grouping lib
        // axis.categories.push({
        //     name: key,
        //     categories: categoryValuesMap[key].categories ? categoryValuesMap[key].categories : []
        // })
    })
}


// TODO - We take exactly 1 attribute, exactly 2 measures
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
        measureNames.push("" + firstMeasureValue)
        if (!categoryValueMap[attributeValue]) categoryValueMap[attributeValue] = { y: secondMeasureValue, name: "" + firstMeasureValue }
    })

    addSeriesFromCategoryValuesMapForGroupedBySeriesData(model, categoryValueMap, measureNames)
}

const addSeriesFromCategoryValuesMapForGroupedBySeriesData = (model: any, categoryValueMap: any, measureNames: string[]) => {
    Object.keys(categoryValueMap).forEach((key: string, index: number) => {
        const serieElement = { id: index, name: key, data: [] as any[], connectNulls: true }
        measureNames.forEach((measureName: string) => {
            const temp = { name: measureName } as { name: string, y?: number }
            if (categoryValueMap[key] && categoryValueMap[key].name === measureName) temp.y = categoryValueMap[key].y
            serieElement.data.push(temp)
        })
        model.series.push(serieElement)
    })
}

// TODO - We take exactly 2 attributes, exactly 1 measure (chosen from dropdown)
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
            const tempData = { name: tempKey } as { name: string, y?: number }
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