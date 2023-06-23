import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateParallelChartModel } from './updater/KnowageHighchartsParallelChartUpdater'
import { getAllColumnsOfSpecificTypeFromDataResponse } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenAllOptionIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import deepcopy from 'deepcopy'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export class KnowageHighchartsParallelChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'spline') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'spline'
    }

    updateModel(oldModel: any) {
        updateParallelChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.model.chart.parallelCoordinates = true
        this.model.chart.parallelAxes = { lineWidth: 2 }
        this.setChordXAxis()
        this.setChordYAxis()
    }

    setChordXAxis() {
        if (this.model.xAxis && this.model.xAxis[0]) this.model.xAxis[0] = [highchartsDefaultValues.getDefaultBarXAxis()]
        else this.model.xAxis = [highchartsDefaultValues.getDefaultBarXAxis()]
    }

    setChordYAxis() {
        if (this.model.yAxis && this.model.yAxis[0]) this.model.yAxis[0].visible = [highchartsDefaultValues.getDefaultBarYAxis()]
        else this.model.yAxis = [highchartsDefaultValues.getDefaultBarYAxis()]
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
                    },
                    {
                        "name": "column_6",
                        "header": "UNIT_SALES_SUM",
                        "dataIndex": "column_6",
                        "type": "float",
                        "precision": 54,
                        "scale": 4,
                        "multiValue": false
                    }
                ],
                "cacheDate": "2023-06-23 14:13:12.253"
            },
            "results": 4,
            "rows": [
                {
                    "id": 1,
                    "column_1": "Q1",
                    "column_2": 1744587,
                    "column_3": 1616511,
                    "column_4": 739653.4604,
                    "column_5": 287.2794,
                    "column_6": 104893.2241
                },
                {
                    "id": 2,
                    "column_1": "Q2",
                    "column_2": 1665964,
                    "column_3": 1517603,
                    "column_4": 710180.1995,
                    "column_5": 298.7387,
                    "column_6": 102115.586
                },
                {
                    "id": 3,
                    "column_1": "Q3",
                    "column_2": 2.08226E+6,
                    "column_3": 1.90871E+6,
                    "column_4": 831461.175,
                    "column_5": 318.0512,
                    "column_6": 121873.7686
                },
                {
                    "id": 4,
                    "column_1": "Q4",
                    "column_2": 1646594,
                    "column_3": 1473639,
                    "column_4": 643147.8198,
                    "column_5": 259.8922,
                    "column_6": 96443.6608
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
                },
                "6": {
                    "max": 121873.7686,
                    "min": 96443.6608,
                    "distinct": [
                        96443.6608,
                        102115.586,
                        104893.2241,
                        121873.7686
                    ],
                    "cardinality": 4
                }
            }
        }
        // TODO
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'ATTRIBUTE')
        console.log('-------- ATTRIBUTE COLUMNS: ', attributeColumns)
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'MEASURE')
        console.log('-------- MEASURE COLUMNS: ', measureColumns)
        // TODO
        this.setParallelData(mockedData, attributeColumns, measureColumns, '')
        return this.model.series
    }


    setParallelData = (data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) => {
        if (!data || measureColumns.length < 2 || !attributeColumns[0]) return

        this.setDataForXAxis(measureColumns)

        data.rows.forEach((row: any, index: number) => {
            const serieElement = { id: index, name: row[attributeColumns[0].metadata.dataIndex], data: [] as any[], showInLegend: true }
            measureColumns.forEach((measureColumn: any) => {
                serieElement.data.push((row[measureColumn.metadata.dataIndex]))
            })
            this.model.series.push(serieElement)
        })
    }

    setDataForXAxis(measureColumns: any[]) {
        const categories = [] as string[]
        measureColumns.forEach((measureColumn: any) => categories.push(measureColumn.column.columnName))
        this.model.xAxis[0].categories = categories
        this.model.xAxis[0].offset = 10
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }

}
