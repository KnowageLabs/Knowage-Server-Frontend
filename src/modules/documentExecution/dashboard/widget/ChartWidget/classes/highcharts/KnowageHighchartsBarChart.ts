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
        console.log('---------- data: ', data)
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
            this.setGroupedCategoriesData(data, attributeColumns, measureColumns, drilldownEnabled, dateFormat)
        } else {
            this.setRegularData(data, attributeColumns, measureColumns, drilldownEnabled, dateFormat)
        }

        return this.model.series
    }

    setRegularData(data: any, attributeColumns: any[], measureColumns: any[], drilldownEnabled: boolean, dateFormat: string) {
        const attributeColumn = attributeColumns[0]
        //  console.log('--------- ATTRIBUTE COLUMN: ', attributeColumn)
        if (!attributeColumn || !attributeColumn.metadata) return
        this.model.series = []
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

    setGroupedCategoriesData(data: any, attributeColumns: any[], measureColumns: any[], drilldownEnabled: boolean, dateFormat: string) {
        console.log('THIS MODEL AXIS: ', this.model.xAxis)
        console.log('------- setGroupedCategoriesData ', data)
        const distinctFirstAttributeValues = data.stats[1].distinct
        console.log('------- distinctFirstAttributeValues ', distinctFirstAttributeValues)
        const distinctValues = data.stats[2].distinct
        console.log('------- distinctValues ', distinctValues)
        const distinctValuesMap = {}
        distinctValues?.forEach((value: string) => {
            distinctValuesMap[value] = { data: [] }
            distinctFirstAttributeValues.forEach((firstAttributeValue: string) => distinctValuesMap[value].data.push({ name: firstAttributeValue, datetype: 'string' }))
        })
        console.log('------- distinctValuesMap ', distinctValuesMap)
        data.rows.forEach((row: any) => {
            distinctValuesMap[row['column_2']]?.data?.push({
                "y": row['column_3'],
                "name": row['column_1'],
                "datetype": "string"
            })
        })
        const formattedSeries = [] as any[]
        Object.keys(distinctValuesMap).forEach((key: string) => {
            const serie = {
                name: key,
                data: distinctValuesMap[key].data,
                label: { enabled: false }
            }
            formattedSeries.push(serie)
        })

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
