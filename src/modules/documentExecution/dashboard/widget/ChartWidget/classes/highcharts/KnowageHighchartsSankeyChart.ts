import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateSankeyChartModel } from './updater/KnowageHighchartsSankeyChartUpdater'
import { getAllColumnsOfSpecificTypeFromDataResponse, setSankeyData } from './helpers/setData/HighchartsSetDataHelpers'
import deepcopy from 'deepcopy'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export class KnowageHighchartsSankeyChart extends KnowageHighcharts {
    constructor(model: any, inverted: boolean) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'sankey') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'sankey'
        this.model.chart.inverted = inverted
    }

    updateModel(oldModel: any) {
        updateSankeyChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        this.setChordXAxis()
        this.setChordYAxis()
    }

    setPlotOptions() {
        this.model.plotOptions.sankey = {
            dataLabels: {
                enabled: true,
                align: 'center'
            },
            showInLegend: true,
            colorByPoint: true,
            legendType: 'point'
        }
    }

    setChordXAxis() {
        if (this.model.xAxis && this.model.xAxis[0]) this.model.xAxis[0] = [highchartsDefaultValues.getDefaultBarXAxis()]
        else this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setChordYAxis() {
        if (this.model.yAxis && this.model.yAxis[0]) this.model.yAxis[0].visible = [highchartsDefaultValues.getDefaultBarYAxis()]
        else this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''

        setSankeyData(this.model, data, attributeColumns, measureColumns, dateFormat)
        return this.model.series
    }
}
