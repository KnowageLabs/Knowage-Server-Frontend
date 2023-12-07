import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateScatterChartModel } from './updater/KnowageHighchartsScatterChartUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'


export class KnowageHighchartsScatterChart extends KnowageHighcharts {
    constructor(model: any, isJittered = false) {
        super()
        this.setSpecificOptionsDefaultValues(isJittered)
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'scatter') {
                this.setSpecificOptionsDefaultValues(isJittered)
            }
        }
        this.model.chart.type = 'scatter'
        if (!this.model.annotations) this.model.annotations = highchartsDefaultValues.getDefaultAnnotations()
        delete this.model.chart.inverted
    }

    updateModel(oldModel: any) {
        updateScatterChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues(isJittered: boolean) {
        this.setPlotOptions(isJittered)
        if (!this.model.xAxis || !this.model.xAxis[0].gridLineWidth) this.setScatterXAxis()
        if (!this.model.yAxis || !this.model.yAxis[0].gridLineWidth) this.setScatterYAxis()
    }

    setPlotOptions(isJittered: boolean) {
        this.model.plotOptions.scatter = {
            marker: {
                radius: 3,
                states: {
                    hover: {
                        enabled: true,
                        lineColor: "rgb(100,100,100)"
                    }
                }
            },
            states: {
                hover: {
                    marker: {
                        enabled: false
                    }
                }
            }
        }
        this.model.plotOptions.series.turboThreshold = 15000

        if (isJittered) {
            this.model.plotOptions.scatter.jitter = {
                x: 0.5,
                y: 0.5
            }
        } else delete this.model.plotOptions.scatter.jitter
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
        this.model.plotOptions.scatter.jitter ? this.setJitteredChartData(data, attributeColumns, measureColumns, dateFormat) : this.setRegularData(data, attributeColumns, measureColumns, dateFormat)
        return this.model.series
    }

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

    setJitteredChartData(data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) {
        const attributeColumn = attributeColumns[0]
        const measureColumn = measureColumns[0]
        if (!attributeColumn || !measureColumn || !data.rows) return

        const seriesMapByAttributeValueIndex = this.getseriesMapByAttributeValueIndex(data, attributeColumn, dateFormat);
        data.rows.forEach((row: any) => {
            const attributeValue = row[attributeColumn.metadata.dataIndex]
            if (seriesMapByAttributeValueIndex[attributeValue]) {
                seriesMapByAttributeValueIndex[attributeValue].data.push({
                    x: seriesMapByAttributeValueIndex[attributeValue].id,
                    name: dateFormat && ['date', 'timestamp'].includes(attributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[attributeColumn.metadata.dataIndex], dateFormat, attributeColumn.metadata.type) : "" + row[attributeColumn.metadata.dataIndex],
                    y: row[measureColumn.metadata.dataIndex]
                })
            }
        })

        Object.keys(seriesMapByAttributeValueIndex).forEach((key: string) => this.model.series.push(seriesMapByAttributeValueIndex[key]))
    }

    getseriesMapByAttributeValueIndex(data: any, attributeColumn: any, dateFormat: string) {
        const uniqueValues = [] as string[];
        const seriesMapByAttributeValueIndex = {} as { [key: string]: { id: number, name: string, data: any[], connectNulls: boolean } };

        for (const row of data.rows) {
            const attributeValue = dateFormat && ['date', 'timestamp'].includes(attributeColumn.metadata.type) ? getFormattedDateCategoryValue(row[attributeColumn.metadata.dataIndex], dateFormat, attributeColumn.metadata.type) : "" + row[attributeColumn.metadata.dataIndex];
            if (!uniqueValues.includes(attributeValue)) {
                uniqueValues.push(attributeValue);
            }
        }

        uniqueValues.forEach((value: string, index: number) => {
            seriesMapByAttributeValueIndex[value] = { id: index, name: value, data: [] as any[], connectNulls: true };
        });

        return seriesMapByAttributeValueIndex;
    }


    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }

}
