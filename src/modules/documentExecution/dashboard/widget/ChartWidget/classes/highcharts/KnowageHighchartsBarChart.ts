import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateBarChartModel } from './updater/KnowageHighchartsBarChartUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, setRegularData, setGroupedCategoriesData, setGroupedBySeriesData, setGroupedByCategoriesData } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'

export class KnowageHighchartsBarChart extends KnowageHighcharts {
    constructor(model: any, type: 'area' | 'bar' | 'column', isStacked: boolean) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (!['area', 'bar', 'column'].includes(model.chart.type)) this.setSpecificOptionsDefaultValues()
        }
        if (isStacked && this.model.plotOptions) this.model.plotOptions.series.stacking = this.model.plotOptions.series.stacking ?? 'normal'
        else delete this.model.plotOptions.series.stacking
        this.model.chart.type = type
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
    }

    updateModel(oldModel: any) {
        updateBarChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        if (!this.model.xAxis || !this.model.xAxis[0] || !this.model.xAxis[0].title) this.setBarXAxis()
        if (!this.model.yAxis || !this.model.yAxis[0] || !this.model.yAxis[0].title) this.setBarYAxis()
    }

    setPlotOptions() {
        this.model.plotOptions.line = {
            marker: { symbol: "circle", lineWidth: 2 }
        }
        this.model.plotOptions.series.showCheckbox = this.model.plotOptions.series.showCheckbox ?? true
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
            setRegularData(this.model, widgetModel, data, attributeColumns, measureColumns, drilldownEnabled, dateFormat)
        }

        return this.model.series
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }
}
