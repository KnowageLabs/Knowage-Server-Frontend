import { KnowageHighcharts } from './KnowageHighcharts'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, getColumnConditionalStyles, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { getColumnAlias, updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import deepcopy from 'deepcopy'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export class KnowageHighchartsFunnelChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'funnel') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = 'funnel'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
        delete this.model.sonification
        if (this.model.plotOptions?.series?.showCheckbox) this.model.plotOptions.series.showCheckbox = false
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
    }

    setPlotOptions() {
        if (!this.model.plotOptions.series.neckWidth) this.model.plotOptions.series.neckWidth = '30%'
        if (!this.model.plotOptions.series.neckHeight) this.model.plotOptions.series.neckHeight = '25%'
    }

    setData(data: any, widgetModel: IWidget, variables: IVariable[]) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.setFunnelChartData(data, widgetModel, attributeColumns, measureColumns, dateFormat, variables)
        return this.model.series
    }

    setFunnelChartData(data: any, widgetModel: IWidget, attributeColumns: any[], measureColumns: any[], dateFormat: string, variables: IVariable[]) {
        const attibuteColumn = attributeColumns[0]
        const measureColumn = measureColumns[0]
        if (!data || !measureColumn || !attibuteColumn) return

        const columnAliases = widgetModel.settings?.series?.aliases ?? []
        const serieElement = { id: 0, name: getColumnAlias(measureColumn.column, columnAliases), data: [] as any[], showInLegend: true }
        data.rows.forEach((row: any) => {
            serieElement.data.push({
                name: dateFormat && ['date', 'timestamp'].includes(attibuteColumn.metadata.type) ? getFormattedDateCategoryValue(row[attibuteColumn.metadata.dataIndex], dateFormat, attibuteColumn.metadata.type) : row[attibuteColumn.metadata.dataIndex],
                y: row[measureColumn.metadata.dataIndex],
                color: getColumnConditionalStyles(widgetModel, measureColumn.column.id, row[measureColumn.metadata.dataIndex], variables)?.color
            })
        })
        this.model.series.push(serieElement)
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }
}
