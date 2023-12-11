import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, setRegularData } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'

export class KnowageHighchartsWaterfallChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'waterfall') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = 'waterfall'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
        delete this.model.sonification
    }


    setSpecificOptionsDefaultValues() {
        if (!this.model.xAxis || !this.model.xAxis[0] || !this.model.xAxis[0].title) this.setWaterfallXAxis()
        if (!this.model.yAxis || !this.model.yAxis[0] || !this.model.yAxis[0].title) this.setWaterfallYAxis()
    }


    setWaterfallXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setWaterfallYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        setRegularData(this.model, widgetModel, data, attributeColumns, measureColumns, false, dateFormat)
        return this.model.series
    }


    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }
}
