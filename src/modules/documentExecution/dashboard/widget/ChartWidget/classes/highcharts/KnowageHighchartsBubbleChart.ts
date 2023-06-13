import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsChartSerieData } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { updateBubbleChartModel } from './updater/KnowageHighchartsBubbleChartUpdater'
import { createSerie } from './updater/KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificAxisTypeFromDataResponse, getAllColumnsOfSpecificTypeFromDataResponse } from './helpers/setData/HighchartsSetDataHelpers'

export class KnowageHighchartsBubbleChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'bubble') {
                this.formatSeriesFromOtherChartTypeSeries()
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
    }

    setPlotOptions() {
        this.model.plotOptions.line = {
            marker: {
                symbol: 'circle',
                lineWidth: 2
            }
        }
        this.model.plotOptions.series.showCheckbox = true
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        console.log('---------- ATTRIBUTE COLUMNS: ', attributeColumns)
        const XAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(data, widgetModel, 'X')
        console.log('---------- X AXIS COLUMNS: ', XAxisColumns)
        const YAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(data, widgetModel, 'Y')
        console.log('---------- Y AXIS COLUMNS: ', YAxisColumns)
        const ZAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(data, widgetModel, 'Z')
        console.log('---------- Z AXIS COLUMNS: ', ZAxisColumns)

        const splitting = widgetModel.settings?.configuration?.splitting
        if (splitting?.enabled) {
            this.setSplittedData(data, splitting, attributeColumns, XAxisColumns, YAxisColumns, ZAxisColumns)
        } else {
            this.setRegularData(data, attributeColumns, XAxisColumns, YAxisColumns, ZAxisColumns)
        }

        return this.model.series
    }

    setSplittedData(data: any, splitting: any, attributeColumns: any[], XAxisColumns: any[], YAxisColumns: any[], ZAxisColumns: any[]) {
        console.log('----- DATA: ', data)
        console.log('----- splitting: ', splitting)
        const measureForGrouping = YAxisColumns.find((measureColumn: any) => measureColumn.column.columnName === splitting.groupedSerie)
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
            categoryValueMap[secondAttributeValue][firstAttributeValue] = { x: row[XColumn.metadata.dataIndex], y: row[measureForGrouping.metadata.dataIndex], z: row[ZColumn.metadata.dataIndex] }
        })

        console.log('------ categoryValueMap: ', categoryValueMap)
        console.log('------ uniqueCategoryValues: ', uniqueCategoryValues)
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
            measureSerieElement.data.push({ name: key, x: measureSerieElementValueMap[key].x, y: measureSerieElementValueMap[key].y, z: measureSerieElementValueMap[key].z })
        })
        this.model.series.push(measureSerieElement)
    }

    setRegularData(data: any, attributeColumns: any[], XAxisColumns: any[], YAxisColumns: any[], ZAxisColumns: any[]) {
        if (!data || !attributeColumns[0] || !XAxisColumns[0] || !YAxisColumns[0] || !ZAxisColumns[0]) return
        const attributeColumn = attributeColumns[0]
        const XColumn = XAxisColumns[0]
        const ZColumn = ZAxisColumns[0]
        const series = [] as any[]

        YAxisColumns.forEach((yAxisColumn: any, index: number) => {
            const tempSerie = { id: index, name: yAxisColumn.column.columnName, data: [] as any[], connectNulls: true }
            data.rows.forEach((row: any) => {
                tempSerie.data.push({ x: row[XColumn.metadata.dataIndex], y: row[yAxisColumn.metadata.dataIndex], z: row[ZColumn.metadata.dataIndex], name: row[attributeColumn.metadata.dataIndex] })
            })
            series.push(tempSerie)
        })
        this.model.series = series
    }

    getSeriesFromWidgetModel(widgetModel: IWidget) {
        // TODO
        const measureColumn = widgetModel.columns.find((column: IWidgetColumn) => column.fieldType === 'MEASURE')
        if (!measureColumn) return
        this.model.series = [createSerie(measureColumn.columnName, measureColumn.aggregation, true)]
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        // TODO
        if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesSettings || !widgetModel.settings.series.seriesSettings[0]) return
        const seriesLabelSetting = widgetModel.settings.series.seriesSettings[0]
        if (!seriesLabelSetting.label.enabled) return
        this.model.series.forEach((serie: IHighchartsChartSerie) => {
            serie.data.forEach((data: IHighchartsChartSerieData) => {
                data.dataLabels = {
                    backgroundColor: seriesLabelSetting.label.backgroundColor ?? '',
                    distance: 30,
                    enabled: true,
                    position: '',
                    style: {
                        fontFamily: seriesLabelSetting.label.style.fontFamily,
                        fontSize: seriesLabelSetting.label.style.fontSize,
                        fontWeight: seriesLabelSetting.label.style.fontWeight,
                        color: seriesLabelSetting.label.style.color ?? ''
                    },
                    formatter: function () {
                        return KnowageHighchartsBubbleChart.prototype.handleFormatter(this, seriesLabelSetting.label)
                    }
                }
            })
        })
    }

    formatSeriesFromOtherChartTypeSeries() {
        this.model.series = this.model.series.map((serie: any) => {
            return this.getFormattedSerieFromOtherChartTypeSerie(serie)
        })
    }

    getFormattedSerieFromOtherChartTypeSerie(otherChartSerie: any) {
        const formattedSerie = { name: otherChartSerie.name, data: [], colorByPoint: true } as IHighchartsChartSerie
        if (otherChartSerie.accessibility) formattedSerie.accessibility
        return formattedSerie
    }
}
