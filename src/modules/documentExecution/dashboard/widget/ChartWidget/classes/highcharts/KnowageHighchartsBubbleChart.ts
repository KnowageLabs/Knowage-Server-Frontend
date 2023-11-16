import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateBubbleChartModel } from './updater/KnowageHighchartsBubbleChartUpdater'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificAxisTypeFromDataResponse, getAllColumnsOfSpecificTypeFromDataResponse, getColumnConditionalStyles } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export class KnowageHighchartsBubbleChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'bubble') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'bubble'
    }

    updateModel(oldModel: any) {
        updateBubbleChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        if (!this.model.xAxis || !this.model.xAxis[0] || !this.model.xAxis[0].title) this.setBubbleXAxis()
        if (!this.model.yAxis || !this.model.yAxis[0] || !this.model.yAxis[0].title) this.setBubbleYAxis()
        if (this.model.yAxis[0]) delete this.model.yAxis[0].type
    }

    setPlotOptions() {
        this.model.plotOptions.line = {
            marker: {
                symbol: 'circle',
                lineWidth: 2
            }
        }
    }

    setBubbleXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultScatterXAxis()]
    }

    setBubbleYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultScatterYAxis()]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const XAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(data, widgetModel, 'X')
        const YAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(data, widgetModel, 'Y')
        const ZAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(data, widgetModel, 'Z')

        if (widgetModel.settings.configuration?.grouping?.secondDimension.enabled) {
            const serieName = widgetModel.settings.configuration.grouping.secondDimension.serie
            this.setSplittedData(data, widgetModel, serieName, attributeColumns, XAxisColumns, YAxisColumns, ZAxisColumns)
        } else {
            this.setRegularData(data, widgetModel, attributeColumns, XAxisColumns, YAxisColumns, ZAxisColumns)
        }

        return this.model.series
    }

    setSplittedData(data: any, widgetModel: IWidget, serieName: string, attributeColumns: any[], XAxisColumns: any[], YAxisColumns: any[], ZAxisColumns: any[]) {
        const measureForGrouping = YAxisColumns.find((measureColumn: any) => measureColumn.column.columnName === serieName)
        if (!data || attributeColumns.length < 2 || !measureForGrouping) return
        const firstAttributeColumn = attributeColumns[0]
        const secondAttributeColumn = attributeColumns[1]
        const categoryValueMap = {}
        const uniqueCategoryValues = [] as string[]
        const XColumn = XAxisColumns[0]
        const ZColumn = ZAxisColumns[0]
        data.rows.forEach((row: any) => {
            const firstAttributeValue = row[firstAttributeColumn.metadata.dataIndex]
            if (!uniqueCategoryValues.includes(firstAttributeValue)) uniqueCategoryValues.push(firstAttributeValue)
            const secondAttributeValue = row[secondAttributeColumn.metadata.dataIndex]

            if (!categoryValueMap[secondAttributeValue]) categoryValueMap[secondAttributeValue] = {}
            if (!categoryValueMap[secondAttributeValue][firstAttributeValue]) categoryValueMap[secondAttributeValue][firstAttributeValue] = {}
            categoryValueMap[secondAttributeValue][firstAttributeValue] = {
                x: row[XColumn.metadata.dataIndex],
                y: row[measureForGrouping.metadata.dataIndex],
                z: row[ZColumn.metadata.dataIndex],
                color: getColumnConditionalStyles(widgetModel, measureForGrouping.column.id, row[measureForGrouping.metadata.dataIndex])?.color
            }
        })
        const measureSerieElementValueMap = {}
        this.createSeriesForGroupedByCategoriesData(categoryValueMap, measureSerieElementValueMap)
        this.createMeasureSerieForGroupedByCategoriesData(measureForGrouping, measureSerieElementValueMap)
    }

    createSeriesForGroupedByCategoriesData(categoryValueMap: any, measureSerieElementValueMap: any) {
        Object.keys(categoryValueMap).forEach((key: string, index: number) => {
            const serieElement = { id: index, name: key, data: [] as any[], connectNulls: true }
            Object.keys(categoryValueMap[key]).forEach((tempKey: string) => {
                const tempData = { name: tempKey } as { name: string; x?: number; y?: number; z?: number }
                if (categoryValueMap[key][tempKey]) {
                    tempData.x = categoryValueMap[key][tempKey].x
                    tempData.y = categoryValueMap[key][tempKey].y
                    tempData.z = categoryValueMap[key][tempKey].z
                }
                serieElement.data.push(tempData)

                if (!measureSerieElementValueMap[tempKey]) measureSerieElementValueMap[tempKey] = { x: 0, y: 0, z: 0 }
                measureSerieElementValueMap[tempKey].x += categoryValueMap[key][tempKey].x ?? 0
                measureSerieElementValueMap[tempKey].y += categoryValueMap[key][tempKey].y ?? 0
                measureSerieElementValueMap[tempKey].z += categoryValueMap[key][tempKey].z ?? 0
            })
            this.model.series.push(serieElement)
        })
    }

    createMeasureSerieForGroupedByCategoriesData(measureForGrouping: any, measureSerieElementValueMap: any) {
        const measureSerieElement = { id: this.model.series.length, name: measureForGrouping.column.columnName, data: [] as any[], connectNulls: true }
        Object.keys(measureSerieElementValueMap).forEach((key: string) => {
            measureSerieElement.data.push({ name: key, x: measureSerieElementValueMap[key].x, y: measureSerieElementValueMap[key].y, z: measureSerieElementValueMap[key].z, dataLabels: { enabled: true, format: '{point.name}' } })
        })
        this.model.series.push(measureSerieElement)
    }

    setRegularData(data: any, widgetModel, attributeColumns: any[], XAxisColumns: any[], YAxisColumns: any[], ZAxisColumns: any[]) {
        if (!data || !attributeColumns[0] || !XAxisColumns[0] || !YAxisColumns[0] || !ZAxisColumns[0]) return
        const attributeColumn = attributeColumns[0]
        const XColumn = XAxisColumns[0]
        const ZColumn = ZAxisColumns[0]
        const series = [] as any[]

        YAxisColumns.forEach((yAxisColumn: any, index: number) => {
            const tempSerie = { id: index, name: yAxisColumn.column.columnName, data: [] as any[], connectNulls: true }
            data.rows.forEach((row: any) => {
                tempSerie.data.push({
                    x: row[XColumn.metadata.dataIndex],
                    y: row[yAxisColumn.metadata.dataIndex],
                    z: row[ZColumn.metadata.dataIndex],
                    name: row[attributeColumn.metadata.dataIndex],
                    dataLabels: { enabled: true, format: '{point.name}' },
                    color: getColumnConditionalStyles(widgetModel, yAxisColumn.column.id, row[yAxisColumn.metadata.dataIndex])?.color
                })
            })
            series.push(tempSerie)
        })
        this.model.series = series
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }
}
