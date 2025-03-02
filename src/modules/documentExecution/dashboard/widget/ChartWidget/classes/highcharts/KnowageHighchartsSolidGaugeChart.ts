import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateSolidGaugeChartModel } from './updater/KnowageHighchartsSolidGaugeChartUpdater'
import { KnowageHighchartsGaugeChart } from './KnowageHighchartsGaugeChart'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'

export class KnowageHighchartsSolidGaugeChart extends KnowageHighchartsGaugeChart {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'solidgauge') {
                this.formatSeriesFromOtherChartTypeSeries()
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'solidgauge'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
        delete this.model.sonification
        if (this.model.plotOptions?.series?.showCheckbox) this.model.plotOptions.series.showCheckbox = false
    }

    updateModel(oldModel: any) {
        updateSolidGaugeChartModel(oldModel, this.model)
    }

    setData(data: any, widgetModel: IWidget, variables: IVariable[]) {
        this.setGaugeData(data, widgetModel, 1)
    }

    setSpecificOptionsDefaultValues() {
        this.setGaugePlotOptions()
        this.setGaugePaneSettings()
        this.setGaugeYAxis()
    }

    setGaugePlotOptions() {
        this.model.plotOptions.solidgauge = highchartsDefaultValues.getDafaultGaugeChartPlotOptions()
    }

    setGaugePaneSettings() {
        this.model.pane = highchartsDefaultValues.getDafaultSolidGaugePaneOptions()
    }

    setGaugeYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultGaugeYAxis()]
        this.model.yAxis[0].tickWidth = 0
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesSettings) return
        const seriesSettings = widgetModel.settings.series.seriesSettings[0]
        this.updateSeriesDataWithSerieSettings(this.model.series[0], seriesSettings)
    }

    updateSeriesDataWithSerieSettings(serie: any, seriesSettings: any) {
        if (!serie || !seriesSettings) return
        serie.data.forEach((data: any) => {
            data.dataLabels = {
                backgroundColor: null,
                distance: 30,
                enabled: seriesSettings.label.enabled,
                position: '',
                style: {
                    fontFamily: seriesSettings.label.style.fontFamily,
                    fontSize: seriesSettings.label.style.fontSize,
                    fontWeight: seriesSettings.label.style.fontWeight,
                    color: seriesSettings.label.style.color ?? '',
                    textOutline: 'none'
                },
                formatter: function () {
                    return KnowageHighchartsGaugeChart.prototype.handleFormatter(this, seriesSettings.label, 'solidgauge')
                }
            }
        })
    }
}
