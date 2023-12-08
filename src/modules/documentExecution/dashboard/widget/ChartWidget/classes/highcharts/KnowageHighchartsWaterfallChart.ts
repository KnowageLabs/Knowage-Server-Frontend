import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'

export class KnowageHighchartsWaterfallChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'waterfall') this.setSpecificOptionsDefaultValues()
            if (!this.model.plotOptions.dumbbell) this.setPlotOptions()
        }
        this.model.chart.type = 'waterfall'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        this.model.chart.inverted = true
    }


    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        if (!this.model.xAxis || !this.model.xAxis[0] || !this.model.xAxis[0].title) this.setWaterfallXAxis()
        if (!this.model.yAxis || !this.model.yAxis[0] || !this.model.yAxis[0].title) this.setWaterfallYAxis()
    }

    setPlotOptions() {

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
        this.setWaterfallData(data, widgetModel, attributeColumns, measureColumns, dateFormat)
        return this.model.series
    }

    setWaterfallData(data: any, widgetModel: IWidget, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
        // TODO
        // const attibuteColumn = attributeColumns[0]
        // const startMeasureColumn = measureColumns[0]
        // const endMeasureColumn = measureColumns[1]

        // if (!data || !attibuteColumn || !startMeasureColumn || !endMeasureColumn) return
        // const serieElement = { id: 0, name: startMeasureColumn.column.columnName + ' | ' + endMeasureColumn.column.columnName, data: [] as any[], showInLegend: true }
        // data.rows.forEach((row: any,) => {
        //     const firstMeasureConditionalStyle = getColumnConditionalStyles(widgetModel, startMeasureColumn.column.id, row[startMeasureColumn.metadata.dataIndex])?.color
        //     const secondMeasureConditionalStyle = getColumnConditionalStyles(widgetModel, endMeasureColumn.column.id, row[endMeasureColumn.metadata.dataIndex])?.color
        //     serieElement.data.push({
        //         name: dateFormat && ['date', 'timestamp'].includes(attibuteColumn.metadata.type) ? getFormattedDateCategoryValue(row[attibuteColumn.metadata.dataIndex], dateFormat, attibuteColumn.metadata.type) : row[attibuteColumn.metadata.dataIndex],
        //         low: row[startMeasureColumn.metadata.dataIndex],
        //         high: row[endMeasureColumn.metadata.dataIndex],
        //         color: firstMeasureConditionalStyle ?? secondMeasureConditionalStyle,
        //     })
        // })
        // this.model.series.push(serieElement)
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        // TODO
        // updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }
}
