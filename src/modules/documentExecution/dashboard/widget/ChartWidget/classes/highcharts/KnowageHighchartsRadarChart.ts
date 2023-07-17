import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateRadarChartModel } from './updater/KnowageHighchartsRadarChartUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, setGroupedByCategoriesData, setRegularData } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'

export class KnowageHighchartsRadarChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'radar') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'radar'
    }

    updateModel(oldModel: any) {
        updateRadarChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        if (!this.model.xAxis || !this.model.xAxis.title) this.setRadarXAxis()
        if (!this.model.yAxis || !this.model.yAxis.title) this.setRadarYAxis()
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const drilldownEnabled = widgetModel.settings.interactions.drilldown ? widgetModel.settings.interactions.drilldown.enabled : false
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''

        if (widgetModel.settings.configuration?.grouping?.secondDimension.enabled) {
            const serieName = widgetModel.settings.configuration.grouping.secondDimension.serie
            setGroupedByCategoriesData(this.model, data, attributeColumns, measureColumns, serieName)
        } else {
            setRegularData(this.model, widgetModel, data, attributeColumns, measureColumns, drilldownEnabled, dateFormat)
        }

        return this.model.series
    }


    setRadarXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultRadarXAxis()]
    }

    setRadarYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultRadarYAxis()]
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }

}