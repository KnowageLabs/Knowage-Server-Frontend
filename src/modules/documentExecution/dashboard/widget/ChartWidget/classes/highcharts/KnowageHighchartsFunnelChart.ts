import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import deepcopy from 'deepcopy'

export class KnowageHighchartsFunnelChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'funnel') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = 'funnel'
    }


    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
    }

    setPlotOptions() {
        if (!this.model.plotOptions.series.neckWidth) this.model.plotOptions.series.neckWidth = '30%'
        if (!this.model.plotOptions.series.neckWidth) this.model.plotOptions.series.neckHeight = '25%'
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.setFunnelChartData(data, attributeColumns, measureColumns, dateFormat)
        return this.model.series
    }

    setFunnelChartData(data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
        if (!data || !measureColumns[0] || !attributeColumns[0]) return
        const serieElement = { id: 0, name: attributeColumns[0].column.columnName, data: [] as any[], showInLegend: true }
        data.rows.forEach((row: any,) => {
            serieElement.data.push({ name: dateFormat && ['date', 'timestamp'].includes(row[attributeColumns[0].metadata.type]) ? getFormattedDateCategoryValue(row[attributeColumns[0].metadata.dataIndex], dateFormat, attributeColumns[0].metadata.type) : row[attributeColumns[0].metadata.dataIndex], y: row[measureColumns[0].metadata.dataIndex] })
        })
        this.model.series.push(serieElement)
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }
}
