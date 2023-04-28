import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsSeriesLabelsSetting } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { createSerie } from './updater/KnowageHighchartsCommonUpdater'
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
        console.log('----------------------- DATA: ', data)
        if (this.model.series.length === 0) this.getSeriesFromWidgetModel(widgetModel)

        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.model.series.map((serie) => {
            const index = data.metaData.fields.findIndex((field: any) => field.header?.startsWith(serie.name))
            const dataIndex = index !== -1 ? data.metaData.fields[index].dataIndex : ''
            const attribute = data.metaData.fields[1]
            serie.data = []
            data?.rows?.forEach((row: any) => {
                serie.data.push({
                    name: dateFormat && ['date', 'timestamp'].includes(attribute.type) ? this.getFormattedDateCategoryValue(row[attribute.dataIndex], dateFormat, attribute.type) : row[attribute.dataIndex],
                    y: row[dataIndex],
                    drilldown: false // TODO 
                })
            })
        })

        return this.model.series
    }

    // TODO - Move to common?
    getFormattedDateCategoryValue(dateString: string, dateFormat: string, type: 'date' | 'timestamp') {
        if (!dateFormat) return dateString
        const date = moment(dateString, type === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm:ss.SSS')
        return date.isValid() ? date.format(dateFormat) : dateString
    }


    getSeriesFromWidgetModel(widgetModel: IWidget) {
        // TODO
        const measureColumn = widgetModel.columns.find((column: IWidgetColumn) => column.fieldType === 'MEASURE')
        if (!measureColumn) return
        this.model.series = [createSerie(measureColumn.columnName, measureColumn.aggregation, true)]
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
            this.model.series.forEach((serie: any) =>
                this.updateSeriesDataWithSerieSettings(serie, allSeriesSettings))
        } else {
            this.resetSeriesSettings()
        }
    }

    resetSeriesSettings() {
        this.model.series.forEach((serie: any) => {
            serie.type = ''
            serie.dataLabels = { ...highchartsDefaultValues.getDefaultSerieLabelSettings(), position: '' }
        })
    }

    setSpecificSeriesSettings(widgetModel: IWidget) {
        for (let i = 1; i < widgetModel.settings.series.seriesLabelsSettings.length; i++) {
            const seriesSettings = widgetModel.settings.series.seriesLabelsSettings[i] as IHighchartsSeriesLabelsSetting
            if (seriesSettings.label.enabled) seriesSettings.names.forEach((serieName: string) => this.updateSpecificSeriesLabelSettings(serieName, seriesSettings))
        }
    }

    updateSpecificSeriesLabelSettings(serieName: string, seriesSettings: IHighchartsSeriesLabelsSetting) {
        const index = this.model.series.findIndex((serie: any) => serie.name === serieName)
        if (index !== -1) this.updateSeriesDataWithSerieSettings(this.model.series[index], seriesSettings)

    }

    updateSeriesDataWithSerieSettings(serie: any, seriesSettings: IHighchartsSeriesLabelsSetting) {
        serie.dataLabels = {
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

    }


    formatSeriesFromOtherChartTypeSeries() {
        this.model.series = this.model.series.map((serie: any) => { return this.getFormattedSerieFromOtherChartTypeSerie(serie) })
    }

    getFormattedSerieFromOtherChartTypeSerie(otherChartSerie: any) {
        // TODO
        const formattedSerie = { name: otherChartSerie.name, data: [], colorByPoint: true } as IHighchartsChartSerie
        if (otherChartSerie.accessibility) formattedSerie.accessibility
        return formattedSerie
    }
}