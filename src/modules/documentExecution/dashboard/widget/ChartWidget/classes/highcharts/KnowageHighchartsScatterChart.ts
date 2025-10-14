import { KnowageHighcharts } from './KnowageHighcharts'
import { IVariable, IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateScatterChartModel } from './updater/KnowageHighchartsScatterChartUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
import { getColumnAlias, updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'

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
        delete this.model.sonification
        if (this.model.plotOptions?.series?.showCheckbox) this.model.plotOptions.series.showCheckbox = false
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
                        lineColor: 'rgb(100,100,100)'
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

        if (isJittered && !this.model.plotOptions.scatter.jitter) {
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

    setData(data: any, widgetModel: IWidget, variables: IVariable[]) {
        this.model.series = []
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const attributeColumn = attributeColumns[0]?.column as IWidgetColumn;
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        this.model.plotOptions.scatter.jitter ? this.setJitteredChartData(data, attributeColumn, measureColumns, dateFormat) : this.setRegularData(data, attributeColumn, measureColumns, dateFormat, widgetModel)
        return this.model.series
    }

    setRegularData(data: any, attributeColumn: IWidgetColumn, measureColumns: any[], dateFormat: string, widgetModel: IWidget) {
        const firstMeasure = measureColumns.find((measureColumn: any) => measureColumn.column.axis === 'X')
        const secondMeasure = measureColumns.find((measureColumn: any) => measureColumn.column.axis === 'Y')

        if (!firstMeasure || !firstMeasure.metadata) return
        const columnAliases = widgetModel.settings?.series?.aliases ?? []

        const column = secondMeasure.column as IWidgetColumn
        const metadata = secondMeasure.metadata as any

        if (attributeColumn) {
            const firstStat = (data?.stats && typeof data.stats === 'object') ? data.stats['1'] : undefined
            if (firstStat) {
                firstStat.distinct.forEach((distinctValue: any) => {
                    let serieEl = {id: distinctValue, name: distinctValue, data: [] as any[]}
                    data?.rows?.forEach((row: any) => {
                        if (row.column_1 !== distinctValue) return
                        this.setSerieElementData(serieEl, row, firstMeasure, dateFormat, metadata);
                    })
                    this.model.series.push(serieEl)
                })
            }
        } else {
            const serieElement = { id: 0, name: getColumnAlias(column, columnAliases), data: [] as any[], connectNulls: true }
            data?.rows?.forEach((row: any) => {
                this.setSerieElementData(serieElement, row, firstMeasure, dateFormat, metadata);
            })
            this.model.series.push(serieElement)
        }
    }

    private setSerieElementData(serieElement: any, row: any, firstMeasure, dateFormat: string, metadata) {
        serieElement.data.push({
            x: row[firstMeasure.metadata.dataIndex],
            name: dateFormat && ['date', 'timestamp'].includes(firstMeasure.metadata.type) ? getFormattedDateCategoryValue(row[firstMeasure.metadata.dataIndex], dateFormat, firstMeasure.metadata.type) : '' + row[firstMeasure.metadata.dataIndex],
            y: row[metadata.dataIndex],
            drilldown: false
        })
    }

    setJitteredChartData(data: any, attributeColumn: IWidgetColumn, measureColumns: any[], dateFormat: string) {
        const firstMeasure = measureColumns.find((measureColumn: any) => measureColumn.column.axis === 'X')
        const measureColumn = measureColumns.find((measureColumn: any) => measureColumn.column.axis === 'Y')
        if (!firstMeasure || !measureColumn || !data.rows) return

        const seriesMapByAttributeValueIndex: { [key: string]: { id: number; name: string; data: any[]; connectNulls: boolean } } = {}
        const uniqueValues: string[] = []

        if (!attributeColumn) return

        const firstStat = (data?.stats && typeof data.stats === 'object') ? data.stats['1'] : undefined
        if (firstStat) {
            firstStat.distinct.forEach((distinctValue: any) => {
                let serieEl = {id: distinctValue, name: distinctValue, data: [] as any[]}
                data?.rows?.forEach((row: any) => {
                    if (row.column_1 !== distinctValue) return
                    if (!seriesMapByAttributeValueIndex[distinctValue]) {
                        const index = uniqueValues.length
                        uniqueValues.push(distinctValue)
                        seriesMapByAttributeValueIndex[distinctValue] = {
                            id: index,
                            name: distinctValue,
                            data: [],
                            connectNulls: true
                        }
                    }

                    seriesMapByAttributeValueIndex[distinctValue].data.push({
                        name: distinctValue,
                        y: row[measureColumn.metadata.dataIndex]
                    })
                })
                this.model.series.push(serieEl)
            })
        }

        this.model.series = uniqueValues.map((value) => seriesMapByAttributeValueIndex[value])
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }
}
