import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateChordChartModel } from './updater/KnowageHighchartsChordChartUpdater'
import { getAllColumnsOfSpecificTypeFromDataResponse, setSankeyData } from './helpers/setData/HighchartsSetDataHelpers'
import deepcopy from 'deepcopy'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export class KnowageHighchartsChordChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'dependencywheel') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'dependencywheel'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
    }

    updateModel(oldModel: any) {
        updateChordChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        this.setChordXAxis()
        this.setChordYAxis()
    }

    setPlotOptions() {
        this.model.plotOptions.dependencywheel = {
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
        if (this.model.xAxis && this.model.xAxis[0]) this.model.xAxis[0].visible = false
        else this.model.xAxis = [{ visible: false, ...highchartsDefaultValues.getDefaultBarXAxis() }]
    }

    setChordYAxis() {
        if (this.model.yAxis && this.model.yAxis[0]) this.model.yAxis[0].visible = false
        else this.model.yAxis = [{ visible: false, ...highchartsDefaultValues.getDefaultBarYAxis() }]
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
