import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsChartSerieData } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { updateBarChartModel } from './updater/KnowageHighchartsBarChartUpdater'
import { createSerie } from './updater/KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'

export class KnowageHighchartsBarChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'column') {
                this.formatSeriesFromOtherChartTypeSeries()
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'column'
    }

    updateModel(oldModel: any) {
        updateBarChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        this.setBarXAxis()
        this.setBarYAxis()
    }

    setPlotOptions() {
        this.model.plotOptions.line = {
            marker: {
                symbol: "circle",
                lineWidth: 2
            }
        }
        this.model.plotOptions.series.showCheckbox = true
    }

    setBarXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setBarYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        // console.log('---------- data: ', data)
        // console.log('---------- WIDGET MODEL COLUMNS: ', widgetModel.columns)

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        console.log('---------- ATTRIBUTE COLUMNS: ', attributeColumns)
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        console.log('---------- MEASURE COLUMNS: ', measureColumns)
        const drilldownEnabled = widgetModel.settings.interactions.drilldown ? widgetModel.settings.interactions.drilldown.enabled : false
        // console.log('------- drilldownEnabled: ', drilldownEnabled)
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        // console.log('------- dateFormat: ', dateFormat)

        if (widgetModel.settings.configuration?.grouping?.enabled) {
            this.setGroupedCategoriesData(data, attributeColumns, measureColumns, dateFormat)
        } else if (widgetModel.settings.configuration?.grouping?.secondSeries.enabled) {
            this.setGroupedBySeriesData(data, attributeColumns, measureColumns)
        } else if (widgetModel.settings.configuration?.grouping?.secondDimension.enabled) {
            const serieName = widgetModel.settings.configuration.grouping.secondDimension.serie
            this.setGroupedByCategoriesData(data, attributeColumns, measureColumns, serieName)
        } else {
            this.setRegularData(data, attributeColumns, measureColumns, drilldownEnabled, dateFormat)
        }

        return this.model.series
    }

    // TODO - We take first attribute, unlimited measures
    setRegularData(data: any, attributeColumns: any[], measureColumns: any[], drilldownEnabled: boolean, dateFormat: string) {
        const attributeColumn = attributeColumns[0]
        if (!attributeColumn || !attributeColumn.metadata) return

        measureColumns.forEach((measureColumn: any, index: number) => {
            const column = measureColumn.column as IWidgetColumn
            const metadata = measureColumn.metadata as any
            const serieElement = {
                id: index,
                name: column.columnName,
                data: [] as any[],
                connectNulls: true
            }
            data?.rows?.forEach((row: any) => {
                serieElement.data.push({
                    name: dateFormat && ['date', 'timestamp'].includes(attributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[attributeColumn.metadata.dataIndex], dateFormat, attributeColumn.metadata.type) : row[attributeColumn.metadata.dataIndex],
                    y: row[metadata.dataIndex],
                    drilldown: drilldownEnabled && attributeColumns.length > 1
                })
            })
            this.model.series.push(serieElement)
        })
    }

    // TODO - We take exactly 2 attributes, first measure
    setGroupedCategoriesData(data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
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

        const axis = this.model.xAxis[0]
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

        this.model.series.push(serieElement)
    }


    // TODO - We take exactly 1 attribute, exactly 2 measures
    setGroupedBySeriesData(data: any, attributeColumns: any[], measureColumns: any[]) {
        console.log('------- setGroupedGroupedBySeriesData ', data)
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

        Object.keys(categoryValueMap).forEach((key: string, index: number) => {
            const serieElement = { id: index, name: key, data: [] as any[], connectNulls: true }
            measureNames.forEach((measureName: string) => {
                const temp = { name: measureName } as { name: string, y?: number }
                if (categoryValueMap[key] && categoryValueMap[key].name === measureName) temp.y = categoryValueMap[key].y
                serieElement.data.push(temp)
            })
            this.model.series.push(serieElement)
        })
    }

    // TODO - We take exactly 2 attributes, exactly 1 measure (chosen from dropdown)
    setGroupedByCategoriesData(data: any, attributeColumns: any[], measureColumns: any[], serieForGroupingName: string) {
        console.log('------- setGroupedByCategoriesData ', data)
        console.log('------- serieForGroupingName ', serieForGroupingName)
        const measureForGrouping = measureColumns.find((measureColumn: any) => measureColumn.column.columnName === serieForGroupingName)
        console.log('------- measureForGrouping ', measureForGrouping)
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
            // const tempData = { name: firstAttributeValue } as { name: string, y?: number }
            if (!categoryValueMap[secondAttributeValue][firstAttributeValue]) categoryValueMap[secondAttributeValue][firstAttributeValue] = {}
            if (measureForGroupingValue) categoryValueMap[secondAttributeValue][firstAttributeValue] = measureForGroupingValue

            //categoryValueMap[secondAttributeValue].data.push(tempData)
        })

        console.log('------- uniqueCategoryValues ', uniqueCategoryValues)

        uniqueCategoryValues.forEach((categoryValue: string) => {
            Object.keys(categoryValueMap).forEach((key: string) => {
                if (!categoryValueMap[key][categoryValue]) categoryValueMap[key][categoryValue] = null
            })
        })
        console.log('------- categoryValueMap ', categoryValueMap)
        const temp = {} as any

        Object.keys(categoryValueMap).forEach((key: string, index: number) => {
            const serieElement = { id: index, name: key, data: [] as any[], connectNulls: true }
            Object.keys(categoryValueMap[key]).forEach((tempKey: string) => {
                const tempData = { name: tempKey } as { name: string, y?: number }
                if (categoryValueMap[key][tempKey]) {
                    tempData.y = categoryValueMap[key][tempKey]
                }
                serieElement.data.push(tempData)

                if (!temp[tempKey]) temp[tempKey] = 0
                temp[tempKey] += categoryValueMap[key][tempKey] ?? 0
            })
            this.model.series.push(serieElement)
        })
        console.log('------- temp ', temp)

        const measureSerieElement = { id: this.model.series.length, name: measureForGrouping.column.columnName, data: [] as any[], connectNulls: true }
        Object.keys(temp).forEach((key: string) => {
            measureSerieElement.data.push({ name: key, y: temp[key] })
        })
        this.model.series.push(measureSerieElement)
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        // TODO
        if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesLabelsSettings || !widgetModel.settings.series.seriesLabelsSettings[0]) return
        const seriesLabelSetting = widgetModel.settings.series.seriesLabelsSettings[0]
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
                        return KnowageHighchartsBarChart.prototype.handleFormatter(this, seriesLabelSetting.label)
                    }
                }
            })
        })
    }

    formatSeriesFromOtherChartTypeSeries() {
        this.model.series = this.model.series.map((serie: any) => { return this.getFormattedSerieFromOtherChartTypeSerie(serie) })
    }

    getFormattedSerieFromOtherChartTypeSerie(otherChartSerie: any) {
        const formattedSerie = { name: otherChartSerie.name, data: [], colorByPoint: true } as IHighchartsChartSerie
        if (otherChartSerie.accessibility) formattedSerie.accessibility
        return formattedSerie
    }
}
