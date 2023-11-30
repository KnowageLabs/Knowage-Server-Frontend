import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, getColumnConditionalStyles, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import mockedData from './mockedData.json'

export class KnowageHighchartsDumbbellChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'dumbbell') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = 'dumbbell'
    }


    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
    }

    setPlotOptions() {
        if (!this.model.xAxis || !this.model.xAxis.title) this.setDumbbellXAxis()
        if (!this.model.yAxis || !this.model.yAxis.title) this.setDumbbellYAxis()
    }

    setDumbbellXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setDumbbellYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }


    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.setDumbbellData(data, widgetModel, attributeColumns, measureColumns, dateFormat)
        return this.model.series
    }

    setDumbbellData(data: any, widgetModel: IWidget, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
        console.log('----- MOCKED DATA: ', mockedData)
        const attibuteColumn = attributeColumns[0]
        const startMeasureColumn = measureColumns[0]
        const endMeasureColumn = measureColumns[1]

        // TODO - Remove mock
        if (!mockedData || !attibuteColumn || !startMeasureColumn || !endMeasureColumn) return
        const serieElement = { id: 0, name: attibuteColumn.column.columnName, data: [] as any[], showInLegend: true }
        mockedData.rows.forEach((row: any,) => {
            serieElement.data.push({
                name: dateFormat && ['date', 'timestamp'].includes(attibuteColumn.metadata.type) ? getFormattedDateCategoryValue(row[attibuteColumn.metadata.dataIndex], dateFormat, attibuteColumn.metadata.type) : row[attibuteColumn.metadata.dataIndex],
                low: row[startMeasureColumn.metadata.dataIndex],
                high: row[endMeasureColumn.metadata.dataIndex]
                //color: getColumnConditionalStyles(widgetModel, measureColumn.column.id, row[measureColumn.metadata.dataIndex])?.color,
            })
        })
        this.model.series.push(serieElement)
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }
}
