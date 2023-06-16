import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateScatterChartModel } from './updater/KnowageHighchartsScatterChartUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'


export class KnowageHighchartsScatterChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'scatter') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'scatter'
    }

    updateModel(oldModel: any) {
        updateScatterChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        if (!this.model.xAxis || !this.model.xAxis.gridLineWidth) this.setScatterXAxis()
        if (!this.model.yAxis || !this.model.yAxis.gridLineWidth) this.setScatterYAxis()
    }

    setPlotOptions() {
        this.model.plotOptions.scatter = {
            "marker": {
                "radius": 3,
                "states": {
                    "hover": {
                        "enabled": true,
                        "lineColor": "rgb(100,100,100)"
                    }
                }
            },
            "states": {
                "hover": {
                    "marker": {
                        "enabled": false
                    }
                }
            }
        }
        this.model.plotOptions.series.turboThreshold = 15000
    }

    setScatterXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultScatterXAxis()]
    }

    setScatterYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultScatterYAxis()]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.setRegularData(data, attributeColumns, measureColumns, dateFormat)
        return this.model.series
    }

    // TODO - Ask on peer, from the logic, the attribute column needs to have number (needs to be measure) in order for this to work
    setRegularData(data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
        const attributeColumn = attributeColumns[0]
        if (!attributeColumn || !attributeColumn.metadata) return

        measureColumns.forEach((measureColumn: any, index: number) => {
            const column = measureColumn.column as IWidgetColumn
            const metadata = measureColumn.metadata as any
            const serieElement = { id: index, name: column.columnName, data: [] as any[], connectNulls: true }
            data?.rows?.forEach((row: any) => {
                serieElement.data.push({
                    x: row[attributeColumn.metadata.dataIndex],
                    name: dateFormat && ['date', 'timestamp'].includes(attributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[attributeColumn.metadata.dataIndex], dateFormat, attributeColumn.metadata.type) : "" + row[attributeColumn.metadata.dataIndex],
                    y: row[metadata.dataIndex],
                    drilldown: false
                })
            })
            this.model.series.push(serieElement)
        })
    }


    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }

}
