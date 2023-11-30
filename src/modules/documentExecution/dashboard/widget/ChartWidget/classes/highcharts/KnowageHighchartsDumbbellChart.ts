import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, getColumnConditionalStyles, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import deepcopy from 'deepcopy'

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
    }

    setPlotOptions() {
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
        // TODO
        // const attibuteColumn = attributeColumns[0]
        // const measureColumn = measureColumns[0]
        // if (!data || !measureColumn || !attibuteColumn) return
        // const serieElement = { id: 0, name: measureColumn.column.columnName, data: [] as any[], showInLegend: true }
        // data.rows.forEach((row: any,) => {
        //     serieElement.data.push({
        //         name: dateFormat && ['date', 'timestamp'].includes(attibuteColumn.metadata.type) ? getFormattedDateCategoryValue(row[attibuteColumn.metadata.dataIndex], dateFormat, attibuteColumn.metadata.type) : row[attibuteColumn.metadata.dataIndex],
        //         y: row[measureColumn.metadata.dataIndex],
        //         color: getColumnConditionalStyles(widgetModel, measureColumn.column.id, row[measureColumn.metadata.dataIndex])?.color,
        //     })
        // })
        // this.model.series.push(serieElement)
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        // TODO
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }
}
