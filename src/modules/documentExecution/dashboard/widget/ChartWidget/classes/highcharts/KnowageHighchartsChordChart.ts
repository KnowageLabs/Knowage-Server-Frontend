import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateChordChartModel } from './updater/KnowageHighchartsChordChartUpdater'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue, setSankeyData } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import deepcopy from 'deepcopy'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export class KnowageHighchartsChordChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'dependencywheel') {
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'dependencywheel'
    }

    updateModel(oldModel: any) {
        updateChordChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        this.setPlotOptions()
        this.setChordXAxis()
        this.setChordYAxis()
    }

    setPlotOptions() {
        this.model.plotOptions.dependencywheel = {
            showInLegend: true,
            colorByPoint: true,
            legendType: 'point'
        }
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
                    }
                ],
                "cacheDate": "2023-06-22 10:29:39.664"
            },
            "results": 13,
            "rows": [
                {
                    "id": 1,
                    "column_1": "Q1",
                    "column_2": "Drink",
                    "column_3": 128144
                },
                {
                    "id": 2,
                    "column_1": "Q1",
                    "column_2": "Food",
                    "column_3": 1047654
                },
                {
                    "id": 3,
                    "column_1": "Q1",
                    "column_2": "Non-Consumable",
                    "column_3": 568789
                },
                {
                    "id": 4,
                    "column_1": "Q2",
                    "column_2": "Drink",
                    "column_3": 194835
                },
                {
                    "id": 5,
                    "column_1": "Q2",
                    "column_2": "Food",
                    "column_3": 930864
                },
                {
                    "id": 6,
                    "column_1": "Q2",
                    "column_2": "Non-Consumable",
                    "column_3": 540265
                },
                {
                    "id": 7,
                    "column_1": "Q3",
                    "column_2": "Car",
                    "column_3": 17812
                },
                {
                    "id": 8,
                    "column_1": "Q3",
                    "column_2": "Drink",
                    "column_3": 202356
                },
                {
                    "id": 9,
                    "column_1": "Q3",
                    "column_2": "Food",
                    "column_3": 1147708
                },
                {
                    "id": 10,
                    "column_1": "Q3",
                    "column_2": "Non-Consumable",
                    "column_3": 714384
                },
                {
                    "id": 11,
                    "column_1": "Q4",
                    "column_2": "Drink",
                    "column_3": 102185
                },
                {
                    "id": 12,
                    "column_1": "Q4",
                    "column_2": "Food",
                    "column_3": 965621
                },
                {
                    "id": 13,
                    "column_1": "Q4",
                    "column_2": "Non-Consumable",
                    "column_3": 578788
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
                }
            }
        }
        // TODO
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'ATTRIBUTE')
        console.log('-------- ATTRIBUTE COLUMNS: ', attributeColumns)
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'MEASURE')
        console.log('-------- MEASURE COLUMNS: ', measureColumns)
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        // TODO
        setSankeyData(this.model, mockedData, attributeColumns, measureColumns, dateFormat)

        return this.model.series
    }

    // TODO
    // setSankeyData = (data: any, attributeColumns: any[], measureColumns: any[], dateFormat: string) => {
    //     if (!data || !measureColumns[0] || attributeColumns.length < 2) return
    //     const measureColumn = measureColumns[0]
    //     const firstAttributeColumn = attributeColumns[0]
    //     const secondAttributeColumn = attributeColumns[1]
    //     const serieElement = { id: 0, name: measureColumn.column.columnName, data: [] as any[], showInLegend: true, colorByPoint: true, connectNulls: true }
    //     data.rows.forEach((row: any) => {
    //         const from = dateFormat && ['date', 'timestamp'].includes(row[firstAttributeColumn.metadata.type]) ? getFormattedDateCategoryValue(row[firstAttributeColumn.metadata.dataIndex], dateFormat, row[firstAttributeColumn]) : row[firstAttributeColumn.metadata.dataIndex]
    //         const to = dateFormat && ['date', 'timestamp'].includes(row[secondAttributeColumn.metadata.type]) ? getFormattedDateCategoryValue(row[secondAttributeColumn.metadata.dataIndex], dateFormat, row[secondAttributeColumn]) : row[secondAttributeColumn.metadata.dataIndex]
    //         serieElement.data.push({
    //             name: from + ' -> ' + to,
    //             from: from,
    //             to: to,
    //             weight: row[measureColumn.metadata.dataIndex],
    //             y: row[measureColumn.metadata.dataIndex],
    //             drilldown: false
    //         })
    //     })

    //     this.model.series.push(serieElement)
    // }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }

}
