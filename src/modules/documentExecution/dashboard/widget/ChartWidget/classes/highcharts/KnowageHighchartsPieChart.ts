import { KnowageHighcharts } from './KnowageHighcharts'
import { updatePieChartModel } from './updater/KnowageHighchartsPieChartUpdater'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { createSerie } from './updater/KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import { getAllColumnsOfSpecificTypeFromDataResponse, setRegularData } from './helpers/setData/HighchartsSetDataHelpers'

export class KnowageHighchartsPieChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'pie') {
                this.formatSeriesFromOtherChartTypeSeries()
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'pie'
    }

    updateModel(oldModel: any) {
        updatePieChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPiePlotOptions()
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const drilldownEnabled = widgetModel.settings.interactions.drilldown ? widgetModel.settings.interactions.drilldown.enabled : false
        setRegularData(this.model, widgetModel, data, attributeColumns, measureColumns, drilldownEnabled, '')

        return this.model.series
    }

    getSeriesFromWidgetModel(widgetModel: IWidget) {
        const measureColumn = widgetModel.columns.find((column: IWidgetColumn) => column.fieldType === 'MEASURE')
        if (!measureColumn) return
        this.model.series = [createSerie(measureColumn.columnName, measureColumn.aggregation, true)]
    }

    setPiePlotOptions() {
        this.model.plotOptions.pie = highchartsDefaultValues.getDafaultPieChartPlotOptions()
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }

    formatSeriesFromOtherChartTypeSeries() {
        this.model.series = this.model.series.map((serie: any) => { return this.getFormattedSerieFromOtherChartTypeSerie(serie) })
    }

    getFormattedSerieFromOtherChartTypeSerie(otherChartSerie: any) {
        const formattedSerie = { name: otherChartSerie.name, data: [], colorByPoint: true } as IHighchartsChartSerie
        if (otherChartSerie.accessibility) formattedSerie.accessibility
        return formattedSerie
    }
}
