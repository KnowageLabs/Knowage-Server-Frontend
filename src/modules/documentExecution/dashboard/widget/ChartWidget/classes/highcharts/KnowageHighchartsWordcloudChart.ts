import { KnowageHighcharts } from './KnowageHighcharts'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, setRegularData } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'

export class KnowageHighchartsWordcloudChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'wordcloud') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = 'wordcloud'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
        delete this.model.sonification
        if (this.model.plotOptions?.series?.showCheckbox) this.model.plotOptions.series.showCheckbox = false
    }

    setSpecificOptionsDefaultValues() {
        if (!this.model.xAxis || !this.model.xAxis[0] || !this.model.xAxis[0].title) this.setWordcloudXAxis()
        if (!this.model.yAxis || !this.model.yAxis[0] || !this.model.yAxis[0].title) this.setWordcloudYAxis()
    }

    setWordcloudXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setWordcloudYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
    }

    setData(data: any, widgetModel: IWidget, variables: IVariable[]) {
        this.model.series = []
        if (!data || data.results === 0) return this.model.series
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        this.model.series = []
        if (!data || data.results === 0) return this.model.series

        const seriesData: any[] = []
        for (let i = 0; i < attributeColumns.length; i++) {
            const attributeColumn = attributeColumns[i]
            data.rows.forEach((row: any) => {
                //get the attribute value
                const attributeValue = row[attributeColumn.metadata.name] != null ? row[attributeColumn.metadata.name] : ''
                let measureValue = 1
                if (measureColumns && measureColumns.length > 0) {
                    measureValue = parseFloat(row[measureColumns[i].metadata.name])
                    if (isNaN(measureValue)) measureValue = 1
                }
                seriesData.push({ name: attributeValue, weight: measureValue })
            })
        }
        this.model.series.push({
            type: 'wordcloud',
            data: seriesData
        })
        return this.model.series
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }
}
