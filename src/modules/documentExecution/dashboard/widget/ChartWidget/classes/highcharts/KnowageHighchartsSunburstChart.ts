import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateSunburstChartModel } from './updater/KnowageHighchartsSunburstChartUpdater'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, setSunburstData } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'


export class KnowageHighchartsSunburstChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOption) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'sunburst') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'sunburst'
    }

    updateModel(oldModel: any) {
        updateSunburstChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
    }

    setPlotOptions() {
        this.model.plotOptions.line = {
            marker: {
                symbol: "circle",
                lineWidth: 2
            }
        }
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const interactions = widgetModel.settings?.interactions
        const interactionsEnabled = interactions.selection.enabled || interactions.crossNavigation.enabled
        setSunburstData(this.model, data, widgetModel, attributeColumns, measureColumns, interactionsEnabled)
        return this.model.series
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }

}
