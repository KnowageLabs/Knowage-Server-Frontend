import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsChartSerieData } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { updateBarChartModel } from './updater/KnowageHighchartsBarChartUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, setRegularData, setGroupedCategoriesData, setGroupedBySeriesData, setGroupedByCategoriesData } from './helpers/setData/HighchartsSetDataHelpers'

export class KnowageHighchartsBarChart extends KnowageHighcharts {
    constructor(model: any, type: 'area' | 'bar' | 'column', isStacked: boolean) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOption) {
            this.model = deepcopy(model)
            if (!['area', 'bar', 'column'].includes(model.chart.type)) this.setSpecificOptionsDefaultValues()
        }
        if (isStacked && this.model.plotOptions) this.model.plotOptions.series.stacking = 'normal'
        else delete this.model.plotOptions.series.stacking
        this.model.chart.type = type
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
            marker: { symbol: "circle", lineWidth: 2 }
        }
        this.model.plotOptions.series.showCheckbox = true
        this.model.plotOptions.series.turboThreshold = 200000
    }

    setBarXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setBarYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const drilldownEnabled = widgetModel.settings.interactions.drilldown ? widgetModel.settings.interactions.drilldown.enabled : false
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''

        if (widgetModel.settings.configuration?.grouping?.enabled) {
            setGroupedCategoriesData(this.model, data, attributeColumns, measureColumns, dateFormat)
        } else if (widgetModel.settings.configuration?.grouping?.secondSeries.enabled) {
            setGroupedBySeriesData(this.model, data, attributeColumns, measureColumns)
        } else if (widgetModel.settings.configuration?.grouping?.secondDimension.enabled) {
            const serieName = widgetModel.settings.configuration.grouping.secondDimension.serie
            setGroupedByCategoriesData(this.model, data, attributeColumns, measureColumns, serieName)
        } else {
            setRegularData(this.model, data, attributeColumns, measureColumns, drilldownEnabled, dateFormat)
        }

        return this.model.series
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
                        return KnowageHighchartsBarChart.prototype.handleFormatter(this, seriesLabelSetting.label)
                    }
                }
            })
        })
    }
}
