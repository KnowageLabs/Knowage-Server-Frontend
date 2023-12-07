import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
// import mockedData from './mockedDataStreamgraph.json'

export class KnowageHighchartsPackedBubbleChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'packedbubble') this.setSpecificOptionsDefaultValues()
        }
        this.model.chart.type = 'packedbubble'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
    }


    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        if (!this.model.xAxis || !this.model.xAxis[0] || !this.model.xAxis[0].title) this.setPackedBubbleXAxis()
        if (!this.model.yAxis || !this.model.yAxis[0] || !this.model.yAxis[0].title) this.setPackedBubbleYAxis()
    }

    setPlotOptions() {

    }

    setPackedBubbleXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultScatterXAxis()]
    }

    setPackedBubbleYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultScatterYAxis()]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.setPackedBubbleChart(data, widgetModel, attributeColumns, measureColumns, dateFormat)

        return this.model.series
    }

    setPackedBubbleChart(data: any, widgetModel: IWidget, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
        const firstAttributeColumn = attributeColumns[0]
        const secondAttributeColumn = attributeColumns[1]
        const measureColumn = measureColumns[0]

        // TODO - Remove mock
        if (!data || !firstAttributeColumn || !secondAttributeColumn || !measureColumn) return

        const result: Record<string, Record<string, number[]>> = {};
        data.rows.forEach((row: any,) => {
            // TODO - Rename
            const firstAttributeValue = dateFormat && ['date', 'timestamp'].includes(secondAttributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[secondAttributeColumn.metadata.dataIndex], dateFormat, secondAttributeColumn.metadata.type) : row[secondAttributeColumn.metadata.dataIndex];
            const secondAttributeValue = row[firstAttributeColumn.metadata.dataIndex];
            const measureValue = row[measureColumn.metadata.dataIndex];

            if (!result[firstAttributeValue]) result[firstAttributeValue] = {};
            if (!result[firstAttributeValue][secondAttributeValue]) result[firstAttributeValue][secondAttributeValue] = [];
            result[firstAttributeValue][secondAttributeValue].push(measureValue);
        })

        const categories: string[] = Object.keys(result);
        const allKeys: Set<string> = new Set();

        categories.forEach(category => {
            const keys = Object.keys(result[category]);
            keys.forEach(key => allKeys.add(key));
        });

        allKeys.forEach(key => {
            const data: { name: string, value: number }[] = categories.map(category => {
                const values = result[category][key];
                return values ? { name: category, value: values.reduce((sum, value) => sum + value, 0) } : { name: category, value: 0 };
            });
            this.model.series.push({ name: key, data })
        });
        this.model.xAxis[0].categories = []
        this.model.xAxis[0].categories = [...categories]
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }
}
