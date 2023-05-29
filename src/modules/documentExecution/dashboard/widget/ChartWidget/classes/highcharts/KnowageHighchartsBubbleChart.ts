import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsChartSerieData } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { updateBubbleChartModel } from './updater/KnowageHighchartsBubbleChartUpdater'
import { createSerie } from './updater/KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificAxisTypeFromDataResponse, getAllColumnsOfSpecificTypeFromDataResponse } from './helpers/setData/HighchartsSetDataHelpers'

export class KnowageHighchartsBubbleChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOption) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'bubble') {
                this.formatSeriesFromOtherChartTypeSeries()
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'bubble'
    }

    updateModel(oldModel: any) {
        updateBubbleChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
    }

    setPlotOptions() {
        this.model.plotOptions.line = {
            marker: {
                symbol: "circle",
                lineWidth: 2
            }
        }
        this.model.plotOptions.series.showCheckbox = true
    }

    setData(data: any, widgetModel: IWidget) {
        const mockedData = {
            "metaData": {
                "totalProperty": "results",
                "root": "rows",
                "id": "id",
                "fields": [
                    "recNo",
                    {
                        "name": "column_1",
                        "header": "QUARTER",
                        "dataIndex": "column_1",
                        "type": "string",
                        "multiValue": false
                    },
                    {
                        "name": "column_2",
                        "header": "UNITS_ORDERED_SUM",
                        "dataIndex": "column_2",
                        "type": "float",
                        "precision": 54,
                        "scale": 0,
                        "multiValue": false
                    },
                    {
                        "name": "column_3",
                        "header": "UNITS_SHIPPED_SUM",
                        "dataIndex": "column_3",
                        "type": "float",
                        "precision": 54,
                        "scale": 0,
                        "multiValue": false
                    },
                    {
                        "name": "column_4",
                        "header": "WAREHOUSE_COST_SUM",
                        "dataIndex": "column_4",
                        "type": "float",
                        "precision": 54,
                        "scale": 4,
                        "multiValue": false
                    },
                    {
                        "name": "column_5",
                        "header": "SUPPLY_TIME_SUM",
                        "dataIndex": "column_5",
                        "type": "float",
                        "precision": 31,
                        "scale": 4,
                        "multiValue": false
                    }
                ],
                "cacheDate": "2023-05-29 11:12:06.937"
            },
            "results": 4,
            "rows": [
                {
                    "id": 1,
                    "column_1": "Q2",
                    "column_2": 1665964,
                    "column_3": 1517603,
                    "column_4": 710180.1995,
                    "column_5": 298.7387
                },
                {
                    "id": 2,
                    "column_1": "Q3",
                    "column_2": 2.08226E+6,
                    "column_3": 1.90871E+6,
                    "column_4": 831461.175,
                    "column_5": 318.0512
                },
                {
                    "id": 3,
                    "column_1": "Q1",
                    "column_2": 1744587,
                    "column_3": 1616511,
                    "column_4": 739653.4604,
                    "column_5": 287.2794
                },
                {
                    "id": 4,
                    "column_1": "Q4",
                    "column_2": 1646594,
                    "column_3": 1473639,
                    "column_4": 643147.8198,
                    "column_5": 259.8922
                }
            ],
            "stats": {
                "1": {
                    "max": "Q4",
                    "min": "Q1",
                    "distinct": [
                        "Q1",
                        "Q2",
                        "Q3",
                        "Q4"
                    ],
                    "cardinality": 4
                },
                "2": {
                    "max": 2.08226E+6,
                    "min": 1646594,
                    "distinct": [
                        1646594,
                        1665964,
                        1744587,
                        2.08226E+6
                    ],
                    "cardinality": 4
                },
                "3": {
                    "max": 1.90871E+6,
                    "min": 1473639,
                    "distinct": [
                        1473639,
                        1517603,
                        1616511,
                        1.90871E+6
                    ],
                    "cardinality": 4
                },
                "4": {
                    "max": 831461.175,
                    "min": 643147.8198,
                    "distinct": [
                        643147.8198,
                        710180.1995,
                        739653.4604,
                        831461.175
                    ],
                    "cardinality": 4
                },
                "5": {
                    "max": 318.0512,
                    "min": 259.8922,
                    "distinct": [
                        259.8922,
                        287.2794,
                        298.7387,
                        318.0512
                    ],
                    "cardinality": 4
                }
            }
        }
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'ATTRIBUTE')
        console.log('---------- ATTRIBUTE COLUMNS: ', attributeColumns)
        const XAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(mockedData, widgetModel, 'X')
        console.log('---------- X AXIS COLUMNS: ', XAxisColumns)
        const YAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(mockedData, widgetModel, 'Y')
        console.log('---------- Y AXIS COLUMNS: ', YAxisColumns)
        const ZAxisColumns = getAllColumnsOfSpecificAxisTypeFromDataResponse(mockedData, widgetModel, 'Z')
        console.log('---------- Z AXIS COLUMNS: ', ZAxisColumns)

        this.setRegularData(mockedData, attributeColumns, XAxisColumns, YAxisColumns, ZAxisColumns)

        return this.model.series
    }

    setRegularData(data: any, attributeColumns: any[], XAxisColumns: any[], YAxisColumns: any[], ZAxisColumns: any[]) {
        if (!data || !attributeColumns[0] || !XAxisColumns[0] || !YAxisColumns[0] || !ZAxisColumns[0]) return
        const attributeColumn = attributeColumns[0]
        const XColumn = XAxisColumns[0]
        const ZColumn = ZAxisColumns[0]
        const series = [] as any[]

        YAxisColumns.forEach((yAxisColumn: any, index: number) => {
            const tempSerie = { id: index, name: yAxisColumn.column.columnName, data: [] as any[], connectNulls: true }
            data.rows.forEach((row: any) => {
                tempSerie.data.push({ x: row[XColumn.metadata.dataIndex], y: row[yAxisColumn.metadata.dataIndex], z: row[ZColumn.metadata.dataIndex], name: row[attributeColumn.metadata.dataIndex] })
            })
            series.push(tempSerie)
        })
        this.model.series = series
    }

    getSeriesFromWidgetModel(widgetModel: IWidget) {
        // TODO
        const measureColumn = widgetModel.columns.find((column: IWidgetColumn) => column.fieldType === 'MEASURE')
        if (!measureColumn) return
        this.model.series = [createSerie(measureColumn.columnName, measureColumn.aggregation, true)]
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        // TODO
        if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesLabelsSettings || !widgetModel.settings.series.seriesLabelsSettings[0]) return
        const seriesLabelSetting = widgetModel.settings.series.seriesLabelsSettings[0]
        if (!seriesLabelSetting.label.enabled) return
        this.model.series.forEach((serie: IHighchartsChartSerie) => {
            serie.data.forEach((data: IHighchartsChartSerieData) => {
                data.dataLabels = {
                    backgroundColor: seriesLabelSetting.label.backgroundColor ?? '',
                    distance: 30,
                    enabled: true,
                    position: '',
                    style: {
                        fontFamily: seriesLabelSetting.label.style.fontFamily,
                        fontSize: seriesLabelSetting.label.style.fontSize,
                        fontWeight: seriesLabelSetting.label.style.fontWeight,
                        color: seriesLabelSetting.label.style.color ?? ''
                    },
                    formatter: function () {
                        return KnowageHighchartsBubbleChart.prototype.handleFormatter(this, seriesLabelSetting.label)
                    }
                }
            })
        })
    }

    formatSeriesFromOtherChartTypeSeries() {
        this.model.series = this.model.series.map((serie: any) => { return this.getFormattedSerieFromOtherChartTypeSerie(serie) })
    }

    getFormattedSerieFromOtherChartTypeSerie(otherChartSerie: any) {
        const formattedSerie = { name: otherChartSerie.name, data: [], colorByPoint: true } as IHighchartsChartSerie
        if (otherChartSerie.accessibility) formattedSerie.accessibility
        return formattedSerie
    }
}
