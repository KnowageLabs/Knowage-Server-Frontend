import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsSeriesLabelsSetting } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { updateRadarChartModel } from './updater/KnowageHighchartsRadarChartUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import moment from 'moment'

export class KnowageHighchartsRadarChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'radar') {
                this.formatSeriesFromOtherChartTypeSeries()
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'radar'
        this.model.chart.polar = true
    }

    updateModel(oldModel: any) {
        updateRadarChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setHeatmapXAxis()
        this.setHeatmapYAxis()
    }

    setData(data: any, widgetModel: IWidget) {
        // TODO
        if (!data || !data.metaData || !data.rows) return
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        const splitting = widgetModel.settings?.configuration?.splitting
        const drilldown = widgetModel?.settings?.interactions?.drilldown

        if (splitting?.enabled) {
            this.setSplitedData(splitting.groupedSerie, data)
        } else {
            this.setNormalData(data, widgetModel, dateFormat, drilldown?.enabled)
        }

        return this.model.series
    }

    setSplitedData(splitingColumn: string, data: any) {
        const groupedSerie = data.metaData.fields.find((field: any) => field.header?.startsWith(splitingColumn))
        if (!groupedSerie) return
        const distinctFirstAttributeValues = data.stats[1].distinct
        const distinctValues = data.stats[2].distinct
        const distinctValuesMap = {}
        distinctValues?.forEach((value: string) => {
            distinctValuesMap[value] = { data: [] }
            distinctFirstAttributeValues.forEach((firstAttributeValue: string) => distinctValuesMap[value].data.push({ name: firstAttributeValue, datetype: 'string' }))
        })
        data.rows.forEach((row: any) => {
            distinctValuesMap[row['column_2']]?.data?.push({
                "y": row[groupedSerie.dataIndex],
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
        this.model.seriesForRender = formattedSeries
    }

    setNormalData(data: any, widgetModel: IWidget, dateFormat: string, drilldownEnabled: boolean) {
        const formattedSeries = [] as any[]
        let areRangeLowColumn = null as IWidgetColumn | null
        let areRangeHighColumn = null as IWidgetColumn | null
        widgetModel.columns.forEach((column: IWidgetColumn) => {
            if (column.fieldType === 'MEASURE') {
                if (!['arearangelow', 'arearangehigh'].includes('' + column.serieType)) {
                    const serie = this.createFormattedSerieFromColumn(column, data, dateFormat, drilldownEnabled)
                    if (serie) formattedSeries.push(serie)
                } else if (column.serieType === 'arearangelow') {
                    areRangeLowColumn = column
                } else if (column.serieType === 'arearangehigh') {
                    areRangeHighColumn = column
                }
            }
        })

        if (areRangeLowColumn && areRangeHighColumn) {
            const serie = this.createFormattedSerieFromAreaRangeColumns(areRangeLowColumn, areRangeHighColumn, data, dateFormat, drilldownEnabled)
            if (serie) formattedSeries.push(serie)
        }
        this.model.seriesForRender = formattedSeries
    }

    createFormattedSerieFromColumn(column: IWidgetColumn, data: any, dateFormat: string, drilldownEnabled: boolean) {
        const serie = deepcopy(this.model.series.find((serie: any) => serie.name === column.columnName))
        if (!serie) return null
        serie.type = column.serieType === 'bar' ? 'column' : column.serieType
        serie.pointPlacement = "on"
        const index = data.metaData.fields.findIndex((field: any) => field.header?.startsWith(serie.name))
        const dataIndex = index !== -1 ? data.metaData.fields[index].dataIndex : ''
        const attribute = data.metaData.fields[1]
        serie.data = []
        data?.rows?.forEach((row: any) => {
            serie.data.push({
                name: dateFormat && ['date', 'timestamp'].includes(attribute.type) ? this.getFormattedDateCategoryValue(row[attribute.dataIndex], dateFormat, attribute.type) : row[attribute.dataIndex],
                y: row[dataIndex],
                drilldown: drilldownEnabled
            })
        })
        return serie
    }


    createFormattedSerieFromAreaRangeColumns(areRangeLowColumn: IWidgetColumn, areRangeHighColumn: IWidgetColumn, data: any, dateFormat: string, drilldownEnabled: boolean) {
        const lowSerie = deepcopy(this.model.series.find((serie: any) => serie.name === areRangeLowColumn.columnName))
        const highSerie = deepcopy(this.model.series.find((serie: any) => serie.name === areRangeHighColumn.columnName))
        if (!lowSerie || !highSerie) return null
        lowSerie.type = 'arearange'
        highSerie.type = 'arearange'

        const lowSerieIndex = data.metaData.fields.findIndex((field: any) => field.header?.startsWith(lowSerie.name))
        const lowSerieIndexDataIndex = lowSerieIndex !== -1 ? data.metaData.fields[lowSerieIndex].dataIndex : ''
        const highSerieIndex = data.metaData.fields.findIndex((field: any) => field.header?.startsWith(highSerie.name))
        const highSerieIndexDataIndex = lowSerieIndex !== -1 ? data.metaData.fields[highSerieIndex].dataIndex : ''
        const attribute = data.metaData.fields[1]
        lowSerie.data = []
        data?.rows?.forEach((row: any) => {
            lowSerie.data.push({
                name: dateFormat && ['date', 'timestamp'].includes(attribute.type) ? this.getFormattedDateCategoryValue(row[attribute.dataIndex], dateFormat, attribute.type) : row[attribute.dataIndex],
                low: row[lowSerieIndexDataIndex],
                high: row[highSerieIndexDataIndex],
                drilldown: drilldownEnabled
            })
        })
        lowSerie.name += ' / ' + highSerie.name
        return lowSerie
    }

    // TODO - Move to common?
    getFormattedDateCategoryValue(dateString: string, dateFormat: string, type: 'date' | 'timestamp') {
        if (!dateFormat) return dateString
        const date = moment(dateString, type === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm:ss.SSS')
        return date.isValid() ? date.format(dateFormat) : dateString
    }

    setHeatmapXAxis() {
        this.model.xAxis = highchartsDefaultValues.getDefaultHeatmapXAxis()
    }

    setHeatmapYAxis() {
        this.model.yAxis = highchartsDefaultValues.getDefaultHeatmapYAxis()
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesLabelsSettings) return
        this.setAllSeriesSettings(widgetModel)
        this.setSpecificSeriesSettings(widgetModel)
    }


    setAllSeriesSettings(widgetModel: IWidget) {
        const allSeriesSettings = widgetModel.settings.series.seriesLabelsSettings[0]
        if (allSeriesSettings.label.enabled) {
            this.model.seriesForRender?.forEach((serie: any) =>
                this.updateSeriesDataWithSerieSettings(serie, allSeriesSettings))
        } else {
            this.resetSeriesSettings()
        }
    }

    resetSeriesSettings() {
        this.model.seriesForRender?.forEach((serie: any) => serie.dataLabels = { ...highchartsDefaultValues.getDefaultSerieLabelSettings(), position: '' })
    }

    setSpecificSeriesSettings(widgetModel: IWidget) {
        for (let i = 1; i < widgetModel.settings.series.seriesLabelsSettings.length; i++) {
            const seriesSettings = widgetModel.settings.series.seriesLabelsSettings[i] as IHighchartsSeriesLabelsSetting
            if (seriesSettings.label.enabled) seriesSettings.names.forEach((serieName: string) => this.updateSpecificSeriesLabelSettings(serieName, seriesSettings))
        }
    }

    updateSpecificSeriesLabelSettings(serieName: string, seriesSettings: IHighchartsSeriesLabelsSetting) {
        if (!this.model.seriesForRender) return
        const index = this.model.seriesForRender.findIndex((serie: any) => serie.name === serieName)
        if (index !== undefined && index !== -1) this.updateSeriesDataWithSerieSettings(this.model.seriesForRender[index], seriesSettings)
    }

    updateSeriesDataWithSerieSettings(serie: any, seriesSettings: IHighchartsSeriesLabelsSetting) {
        serie.data.forEach((data: any) => {
            data.dataLabels = {
                backgroundColor: seriesSettings.label.backgroundColor ?? '',
                enabled: true,
                position: '',
                style: {
                    fontFamily: seriesSettings.label.style.fontFamily,
                    fontSize: seriesSettings.label.style.fontSize,
                    fontWeight: seriesSettings.label.style.fontWeight,
                    color: seriesSettings.label.style.color ?? ''
                },
                formatter: function () {
                    return KnowageHighchartsRadarChart.prototype.handleFormatter(this, seriesSettings.label)
                }
            }
        })
    }


    formatSeriesFromOtherChartTypeSeries() {
        this.model.series = this.model.series.map((serie: any) => { return this.getFormattedSerieFromOtherChartTypeSerie(serie) })
    }

    getFormattedSerieFromOtherChartTypeSerie(otherChartSerie: any) {
        const formattedSerie = { name: otherChartSerie.name, data: [], colorByPoint: true, pointPlacement: "on" } as IHighchartsChartSerie
        if (otherChartSerie.accessibility) formattedSerie.accessibility
        return formattedSerie
    }
}