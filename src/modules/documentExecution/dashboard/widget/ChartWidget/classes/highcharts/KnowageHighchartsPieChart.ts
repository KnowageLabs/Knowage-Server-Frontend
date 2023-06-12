import { KnowageHighcharts } from './KnowageHighcharts'
import { updatePieChartModel } from './updater/KnowageHighchartsPieChartUpdater'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { createSerie } from './updater/KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'

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
        if (this.model.series.length === 0) this.getSeriesFromWidgetModel(widgetModel)

        this.model.series.map((item, serieIndex) => {
            this.range[serieIndex] = { serie: item.name }
            item.data = []
            data?.rows?.forEach((row: any) => {
                const serieElement = {
                    id: row.id,
                    name: row['column_1'],
                    y: row['column_2'],
                    drilldown: false
                }
                this.range[serieIndex].min = this.range[serieIndex].min ? Math.min(this.range[serieIndex].min, row['column_2']) : row['column_2']
                this.range[serieIndex].max = this.range[serieIndex].max ? Math.max(this.range[serieIndex].max, row['column_2']) : row['column_2']
                if (this.model.settings.drilldown) serieElement.drilldown = true
                item.data.push(serieElement)
            })
        })
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
