import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateParallelChartModel } from './updater/KnowageHighchartsParallelChartUpdater'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'
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
        this.setPlotOptions()
        this.setChordXAxis()
        this.setChordYAxis()
    }

    setPlotOptions() {
        // TODO
        // this.model.plotOptions.dependencywheel = {
        //     showInLegend: true,
        //     colorByPoint: true,
        //     legendType: 'point'
        // }
    }

    setChordXAxis() {
        if (this.model.xAxis && this.model.xAxis[0]) this.model.xAxis[0].visible = false
        else this.model.xAxis = [{ visible: false, ...highchartsDefaultValues.getDefaultBarXAxis() }]
    }

    setChordYAxis() {
        if (this.model.yAxis && this.model.yAxis[0]) this.model.yAxis[0].visible = false
        else this.model.yAxis = [{ visible: false, ...highchartsDefaultValues.getDefaultBarYAxis() }]
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
                        "header": "PRODUCT_FAMILY",
                        "dataIndex": "column_2",
                        "type": "string",
                        "multiValue": false
                    },
                    {
                        "name": "column_3",
                        "header": "UNITS_ORDERED_SUM",
                        "dataIndex": "column_3",
                        "type": "float",
                        "precision": 54,
                        "scale": 0,
                        "multiValue": false
                    },
                    {
                        "name": "column_4",
                        "header": "UNITS_SHIPPED_SUM",
                        "dataIndex": "column_4",
                        "type": "float",
                        "precision": 54,
                        "scale": 0,
                        "multiValue": false
                    },
                    {
                        "name": "column_5",
                        "header": "WAREHOUSE_COST_SUM",
                        "dataIndex": "column_5",
                        "type": "float",
                        "precision": 54,
                        "scale": 4,
                        "multiValue": false
                    },
                    {
                        "name": "column_6",
                        "header": "SUPPLY_TIME_SUM",
                        "dataIndex": "column_6",
                        "type": "float",
                        "precision": 31,
                        "scale": 4,
                        "multiValue": false
                    },
                    {
                        "name": "column_7",
                        "header": "UNIT_SALES_SUM",
                        "dataIndex": "column_7",
                        "type": "float",
                        "precision": 54,
                        "scale": 4,
                        "multiValue": false
                    }
                ],
                "cacheDate": "2023-06-22 17:02:18.855"
            },
            "results": 13,
            "rows": [
                {
                    "id": 1,
                    "column_1": "Q1",
                    "column_2": "Drink",
                    "column_3": 128144,
                    "column_4": 127451,
                    "column_5": 45428.9849,
                    "column_6": 4E+1,
                    "column_7": 11056.5571
                },
                {
                    "id": 2,
                    "column_1": "Q1",
                    "column_2": "Food",
                    "column_3": 1047654,
                    "column_4": 952575,
                    "column_5": 450841.7237,
                    "column_6": 152.2484,
                    "column_7": 58781.2085
                },
                {
                    "id": 3,
                    "column_1": "Q1",
                    "column_2": "Non-Consumable",
                    "column_3": 568789,
                    "column_4": 536485,
                    "column_5": 243382.7518,
                    "column_6": 95.031,
                    "column_7": 35055.4585
                },
                {
                    "id": 4,
                    "column_1": "Q2",
                    "column_2": "Drink",
                    "column_3": 194835,
                    "column_4": 175571,
                    "column_5": 73330.7702,
                    "column_6": 36,
                    "column_7": 11412.5552
                },
                {
                    "id": 5,
                    "column_1": "Q2",
                    "column_2": "Food",
                    "column_3": 930864,
                    "column_4": 825899,
                    "column_5": 381572.4702,
                    "column_6": 164.6676,
                    "column_7": 59587.2125
                },
                {
                    "id": 6,
                    "column_1": "Q2",
                    "column_2": "Non-Consumable",
                    "column_3": 540265,
                    "column_4": 516133,
                    "column_5": 255276.9591,
                    "column_6": 98.0711,
                    "column_7": 31115.8183
                },
                {
                    "id": 7,
                    "column_1": "Q3",
                    "column_2": "Car",
                    "column_3": 17812,
                    "column_4": 17812,
                    "column_5": 8215.4068,
                    "column_6": 4,
                    "column_7": 1590.4262
                },
                {
                    "id": 8,
                    "column_1": "Q3",
                    "column_2": "Drink",
                    "column_3": 202356,
                    "column_4": 201344,
                    "column_5": 74386.1514,
                    "column_6": 29.4747,
                    "column_7": 9893.4875
                },
                {
                    "id": 9,
                    "column_1": "Q3",
                    "column_2": "Food",
                    "column_3": 1147708,
                    "column_4": 1.03311E+6,
                    "column_5": 423227.9038,
                    "column_6": 167.8025,
                    "column_7": 69499.4068
                },
                {
                    "id": 10,
                    "column_1": "Q3",
                    "column_2": "Non-Consumable",
                    "column_3": 714384,
                    "column_4": 656444,
                    "column_5": 325631.713,
                    "column_6": 116.774,
                    "column_7": 40890.4481
                },
                {
                    "id": 11,
                    "column_1": "Q4",
                    "column_2": "Drink",
                    "column_3": 102185,
                    "column_4": 102185,
                    "column_5": 36688.5684,
                    "column_6": 14,
                    "column_7": 5157.3498
                },
                {
                    "id": 12,
                    "column_1": "Q4",
                    "column_2": "Food",
                    "column_3": 965621,
                    "column_4": 892838,
                    "column_5": 406493.3295,
                    "column_6": 154.0932,
                    "column_7": 56313.9949
                },
                {
                    "id": 13,
                    "column_1": "Q4",
                    "column_2": "Non-Consumable",
                    "column_3": 578788,
                    "column_4": 478616,
                    "column_5": 199965.9219,
                    "column_6": 91.799,
                    "column_7": 34972.3161
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
                    "max": "Non-Consumable",
                    "min": "Car",
                    "distinct": [
                        "Car",
                        "Drink",
                        "Food",
                        "Non-Consumable"
                    ],
                    "cardinality": 4
                },
                "3": {
                    "max": 1147708,
                    "min": 17812,
                    "distinct": [
                        17812,
                        102185,
                        128144,
                        194835,
                        202356,
                        540265,
                        568789,
                        578788,
                        714384,
                        930864,
                        965621,
                        1047654,
                        1147708
                    ],
                    "cardinality": 13
                },
                "4": {
                    "max": 1.03311E+6,
                    "min": 17812,
                    "distinct": [
                        17812,
                        102185,
                        127451,
                        175571,
                        201344,
                        478616,
                        516133,
                        536485,
                        656444,
                        825899,
                        892838,
                        952575,
                        1.03311E+6
                    ],
                    "cardinality": 13
                },
                "5": {
                    "max": 450841.7237,
                    "min": 8215.4068,
                    "distinct": [
                        8215.4068,
                        36688.5684,
                        45428.9849,
                        73330.7702,
                        74386.1514,
                        199965.9219,
                        243382.7518,
                        255276.9591,
                        325631.713,
                        381572.4702,
                        406493.3295,
                        423227.9038,
                        450841.7237
                    ],
                    "cardinality": 13
                },
                "6": {
                    "max": 167.8025,
                    "min": 4,
                    "distinct": [
                        4,
                        14,
                        29.4747,
                        36,
                        4E+1,
                        91.799,
                        95.031,
                        98.0711,
                        116.774,
                        152.2484,
                        154.0932,
                        164.6676,
                        167.8025
                    ],
                    "cardinality": 13
                },
                "7": {
                    "max": 69499.4068,
                    "min": 1590.4262,
                    "distinct": [
                        1590.4262,
                        5157.3498,
                        9893.4875,
                        11056.5571,
                        11412.5552,
                        31115.8183,
                        34972.3161,
                        35055.4585,
                        40890.4481,
                        56313.9949,
                        58781.2085,
                        59587.2125,
                        69499.4068
                    ],
                    "cardinality": 13
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
        if (!data || !measureColumns[0] || attributeColumns.length < 2) return
        const measureColumn = measureColumns[0]
        const firstAttributeColumn = attributeColumns[0]
        const secondAttributeColumn = attributeColumns[1]
        const serieElement = { id: 0, name: measureColumn.column.columnName, data: [] as any[], showInLegend: true, colorByPoint: true, connectNulls: true }
        data.rows.forEach((row: any) => {
            const from = dateFormat && ['date', 'timestamp'].includes(row[firstAttributeColumn.metadata.type]) ? getFormattedDateCategoryValue(row[firstAttributeColumn.metadata.dataIndex], dateFormat, row[firstAttributeColumn]) : row[firstAttributeColumn.metadata.dataIndex]
            const to = dateFormat && ['date', 'timestamp'].includes(row[secondAttributeColumn.metadata.type]) ? getFormattedDateCategoryValue(row[secondAttributeColumn.metadata.dataIndex], dateFormat, row[secondAttributeColumn]) : row[secondAttributeColumn.metadata.dataIndex]
            serieElement.data.push({
                name: from + ' -> ' + to,
                from: from,
                to: to,
                weight: row[measureColumn.metadata.dataIndex],
                y: row[measureColumn.metadata.dataIndex],
                drilldown: false
            })
        })

        this.model.series.push(serieElement)
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenAllOptionIsAvailable(this.model, widgetModel)
    }

}
