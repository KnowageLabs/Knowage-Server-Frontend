import { KnowageHighcharts } from './KnowageHighcharts'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'

export class KnowageHighchartsStreamgraphChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'streamgraph') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = 'streamgraph'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
        delete this.model.sonification
        if (this.model.plotOptions?.series?.showCheckbox) this.model.plotOptions.series.showCheckbox = false
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        if (!this.model.xAxis || !this.model.xAxis[0] || !this.model.xAxis[0].title) this.setStreamgraphXAxis()
        this.setStreamgraphYAxis()
    }

    setPlotOptions() {}

    setStreamgraphXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setStreamgraphYAxis() {
        this.model.yAxis = [
            {
                visible: false,
                startOnTick: false,
                endOnTick: false
            }
        ]
    }

    setData(data: any, widgetModel: IWidget, variables: IVariable[]) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.setStreamgraphChartData(data, attributeColumns, measureColumns, dateFormat)

        return this.model.series
    }

    setStreamgraphChartData(data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
        const firstAttributeColumn = attributeColumns[0]
        const secondAttributeColumn = attributeColumns[1]
        const measureColumn = measureColumns[0]

        if (!data || !firstAttributeColumn || !secondAttributeColumn || !measureColumn) return

        const result: Record<string, Record<string, number[]>> = {}
        data.rows.forEach((row: any) => {
            const firstAttributeValue = dateFormat && ['date', 'timestamp'].includes(firstAttributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[firstAttributeColumn.metadata.dataIndex], dateFormat, firstAttributeColumn.metadata.type) : row[firstAttributeColumn.metadata.dataIndex]
            const secondAttributeValue = row[secondAttributeColumn.metadata.dataIndex]
            const measureValue = row[measureColumn.metadata.dataIndex]

            if (!result[firstAttributeValue]) result[firstAttributeValue] = {}
            if (!result[firstAttributeValue][secondAttributeValue]) result[firstAttributeValue][secondAttributeValue] = []
            result[firstAttributeValue][secondAttributeValue].push(measureValue)
        })

        const categories: string[] = Object.keys(result)
        const allKeys: Set<string> = new Set()

        categories.forEach((category) => {
            const keys = Object.keys(result[category])
            keys.forEach((key) => allKeys.add(key))
        })

        allKeys.forEach((key) => {
            const data: { name: string; y: number }[] = categories.map((category) => {
                const values = result[category][key]
                return values ? { name: category, y: values.reduce((sum, value) => sum + value, 0) } : { name: category, y: 0 }
            })
            this.model.series.push({ name: key, data })
        })
        this.model.xAxis[0].categories = []
        this.model.xAxis[0].categories = [...categories]
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }
}
