import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, setGroupedByCategoriesData, setGroupedBySeriesData, setGroupedCategoriesData, setRegularData } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import { updateLineChartModel } from './updater/KnowageHighchartsLineChartUpdater'

export class KnowageHighchartsLineChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'line') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'line'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
    }

    updateModel(oldModel: any) {
        updateLineChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        if (!this.model.xAxis || !this.model.xAxis[0] || !this.model.xAxis[0].title) this.setLineXAxis()
        if (!this.model.yAxis || !this.model.yAxis[0] || !this.model.yAxis[0].title) this.setLineYAxis()
        this.setSonification()
    }

    setPlotOptions() {
        this.model.plotOptions.line = { marker: { symbol: "circle", lineWidth: 2 } }
        this.model.plotOptions.series.showCheckbox = this.model.plotOptions.series.showCheckbox ?? true
        this.model.plotOptions.series.turboThreshold = 200000
    }

    setLineXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setLineYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }

    setSonification() {
        if (!this.model.sonification) this.model.sonification = highchartsDefaultValues.getDefaultSonificationSettings()
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
            setRegularData(this.model, widgetModel, data, attributeColumns, measureColumns, drilldownEnabled, dateFormat)
        }

        return this.model.series
    }


    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }
}
