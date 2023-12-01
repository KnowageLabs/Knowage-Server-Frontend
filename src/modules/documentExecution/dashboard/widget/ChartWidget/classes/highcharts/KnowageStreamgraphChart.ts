import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import mockedData from './mockedDataStreamgraph.json'

export class KnowageHighchartsStreamgraphChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'streamgraph') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = 'streamgraph'
    }


    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        if (!this.model.xAxis || !this.model.xAxis.title) this.setStreamgraphXAxis()
        if (!this.model.yAxis || !this.model.yAxis.title) this.setStreamgraphYAxis()
    }

    setPlotOptions() {

    }

    setStreamgraphXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setStreamgraphYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }


    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.setStreamgraphChartData(data, widgetModel, attributeColumns, measureColumns, dateFormat)

        return this.model.series
    }

    setStreamgraphChartData(data: any, widgetModel: IWidget, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
        console.log('----- MOCKED DATA: ', mockedData)

        const firstAttibuteColumn = attributeColumns[0]
        const secondAttibuteColumn = attributeColumns[1]
        const measureColumn = measureColumns[0]

        // TODO - Remove mock
        if (!mockedData || !firstAttibuteColumn || !secondAttibuteColumn || !measureColumn) return
        const serieElement = { id: 0, name: measureColumn.column.columnName, data: [] as any[], showInLegend: true }

        this.model.xAxis.categories = []
        console.log('-------- SET DATA X AXIS: ', this.model.xAxis)
        mockedData.rows.forEach((row: any,) => {
            // this.model.xAxis.categories.push(row[firstAttibuteColumn.metadata.dataIndex])
            serieElement.data.push({
                name: dateFormat && ['date', 'timestamp'].includes(secondAttibuteColumn.metadata.type) ? getFormattedDateCategoryValue(row[secondAttibuteColumn.metadata.dataIndex], dateFormat, secondAttibuteColumn.metadata.type) : row[secondAttibuteColumn.metadata.dataIndex],
                y: row[measureColumn.metadata.dataIndex]
            })
        })
        this.model.series.push(serieElement)
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }
}
