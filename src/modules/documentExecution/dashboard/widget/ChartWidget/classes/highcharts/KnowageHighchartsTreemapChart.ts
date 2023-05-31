import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsChartSerieData } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { updateTreemapChartModel } from './updater/KnowageHighchartsTreemapChartUpdater'
import { createSerie } from './updater/KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, getFormattedDateCategoryValue } from './helpers/setData/HighchartsSetDataHelpers'

export class KnowageHighchartsTreemapChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOption) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'treemap') {
                this.formatSeriesFromOtherChartTypeSeries()
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'treemap'
    }

    updateModel(oldModel: any) {
        updateTreemapChartModel(oldModel, this.model)
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
        this.model.plotOptions.series.turboThreshold = 15000
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
                        "header": "STORE_ID",
                        "dataIndex": "column_2",
                        "type": "int",
                        "precision": 10,
                        "scale": 0,
                        "multiValue": false
                    },
                    {
                        "name": "column_3",
                        "header": "PRODUCT_FAMILY",
                        "dataIndex": "column_3",
                        "type": "string",
                        "multiValue": false
                    },
                    {
                        "name": "column_4",
                        "header": "UNITS_ORDERED_SUM",
                        "dataIndex": "column_4",
                        "type": "float",
                        "precision": 54,
                        "scale": 0,
                        "multiValue": false
                    }
                ],
                "cacheDate": "2023-05-29 16:33:11.115"
            },
            "results": 134,
            "rows": [
                {
                    "id": 1,
                    "column_1": "Q1",
                    "column_2": 1,
                    "column_3": "Drink",
                    "column_4": 13992
                },
                {
                    "id": 2,
                    "column_1": "Q1",
                    "column_2": 1,
                    "column_3": "Food",
                    "column_4": 75795
                },
                {
                    "id": 3,
                    "column_1": "Q1",
                    "column_2": 1,
                    "column_3": "Non-Consumable",
                    "column_4": 2.331E+4
                },
                {
                    "id": 4,
                    "column_1": "Q1",
                    "column_2": 4,
                    "column_3": "Drink",
                    "column_4": 3.323E+4
                },
                {
                    "id": 5,
                    "column_1": "Q1",
                    "column_2": 4,
                    "column_3": "Food",
                    "column_4": 99645
                },
                {
                    "id": 6,
                    "column_1": "Q1",
                    "column_2": 4,
                    "column_3": "Non-Consumable",
                    "column_4": 44069
                },
                {
                    "id": 7,
                    "column_1": "Q1",
                    "column_2": 7,
                    "column_3": "Food",
                    "column_4": 80693
                },
                {
                    "id": 8,
                    "column_1": "Q1",
                    "column_2": 7,
                    "column_3": "Non-Consumable",
                    "column_4": 56765
                },
                {
                    "id": 9,
                    "column_1": "Q1",
                    "column_2": 9,
                    "column_3": "Drink",
                    "column_4": 7084
                },
                {
                    "id": 10,
                    "column_1": "Q1",
                    "column_2": 9,
                    "column_3": "Food",
                    "column_4": 110337
                },
                {
                    "id": 11,
                    "column_1": "Q1",
                    "column_2": 11,
                    "column_3": "Drink",
                    "column_4": 41506
                },
                {
                    "id": 12,
                    "column_1": "Q1",
                    "column_2": 11,
                    "column_3": "Food",
                    "column_4": 51419
                },
                {
                    "id": 13,
                    "column_1": "Q1",
                    "column_2": 11,
                    "column_3": "Non-Consumable",
                    "column_4": 8.606E+4
                },
                {
                    "id": 14,
                    "column_1": "Q1",
                    "column_2": 13,
                    "column_3": "Drink",
                    "column_4": 1.456E+4
                },
                {
                    "id": 15,
                    "column_1": "Q1",
                    "column_2": 13,
                    "column_3": "Food",
                    "column_4": 59641
                },
                {
                    "id": 16,
                    "column_1": "Q1",
                    "column_2": 13,
                    "column_3": "Non-Consumable",
                    "column_4": 32926
                },
                {
                    "id": 17,
                    "column_1": "Q1",
                    "column_2": 14,
                    "column_3": "Drink",
                    "column_4": 2365
                },
                {
                    "id": 18,
                    "column_1": "Q1",
                    "column_2": 14,
                    "column_3": "Food",
                    "column_4": 12369
                },
                {
                    "id": 19,
                    "column_1": "Q1",
                    "column_2": 14,
                    "column_3": "Non-Consumable",
                    "column_4": 1.715E+4
                },
                {
                    "id": 20,
                    "column_1": "Q1",
                    "column_2": 15,
                    "column_3": "Food",
                    "column_4": 85758
                },
                {
                    "id": 21,
                    "column_1": "Q1",
                    "column_2": 15,
                    "column_3": "Non-Consumable",
                    "column_4": 36839
                },
                {
                    "id": 22,
                    "column_1": "Q1",
                    "column_2": 17,
                    "column_3": "Food",
                    "column_4": 73646
                },
                {
                    "id": 23,
                    "column_1": "Q1",
                    "column_2": 17,
                    "column_3": "Non-Consumable",
                    "column_4": 78753
                },
                {
                    "id": 24,
                    "column_1": "Q1",
                    "column_2": 18,
                    "column_3": "Drink",
                    "column_4": 3465
                },
                {
                    "id": 25,
                    "column_1": "Q1",
                    "column_2": 18,
                    "column_3": "Food",
                    "column_4": 1.747E+5
                },
                {
                    "id": 26,
                    "column_1": "Q1",
                    "column_2": 18,
                    "column_3": "Non-Consumable",
                    "column_4": 29084
                },
                {
                    "id": 27,
                    "column_1": "Q1",
                    "column_2": 20,
                    "column_3": "Drink",
                    "column_4": 6629
                },
                {
                    "id": 28,
                    "column_1": "Q1",
                    "column_2": 20,
                    "column_3": "Food",
                    "column_4": 92609
                },
                {
                    "id": 29,
                    "column_1": "Q1",
                    "column_2": 20,
                    "column_3": "Non-Consumable",
                    "column_4": 1.2676E+5
                },
                {
                    "id": 30,
                    "column_1": "Q1",
                    "column_2": 22,
                    "column_3": "Food",
                    "column_4": 46224
                },
                {
                    "id": 31,
                    "column_1": "Q1",
                    "column_2": 22,
                    "column_3": "Non-Consumable",
                    "column_4": 13851
                },
                {
                    "id": 32,
                    "column_1": "Q1",
                    "column_2": 23,
                    "column_3": "Drink",
                    "column_4": 5313
                },
                {
                    "id": 33,
                    "column_1": "Q1",
                    "column_2": 23,
                    "column_3": "Food",
                    "column_4": 84818
                },
                {
                    "id": 34,
                    "column_1": "Q1",
                    "column_2": 23,
                    "column_3": "Non-Consumable",
                    "column_4": 23222
                },
                {
                    "id": 35,
                    "column_1": "Q2",
                    "column_2": 1,
                    "column_3": "Drink",
                    "column_4": 27181
                },
                {
                    "id": 36,
                    "column_1": "Q2",
                    "column_2": 1,
                    "column_3": "Food",
                    "column_4": 53477
                },
                {
                    "id": 37,
                    "column_1": "Q2",
                    "column_2": 1,
                    "column_3": "Non-Consumable",
                    "column_4": 39012
                },
                {
                    "id": 38,
                    "column_1": "Q2",
                    "column_2": 4,
                    "column_3": "Drink",
                    "column_4": 18975
                },
                {
                    "id": 39,
                    "column_1": "Q2",
                    "column_2": 4,
                    "column_3": "Food",
                    "column_4": 93286
                },
                {
                    "id": 40,
                    "column_1": "Q2",
                    "column_2": 4,
                    "column_3": "Non-Consumable",
                    "column_4": 21216
                },
                {
                    "id": 41,
                    "column_1": "Q2",
                    "column_2": 7,
                    "column_3": "Food",
                    "column_4": 141725
                },
                {
                    "id": 42,
                    "column_1": "Q2",
                    "column_2": 7,
                    "column_3": "Non-Consumable",
                    "column_4": 1.0308E+5
                },
                {
                    "id": 43,
                    "column_1": "Q2",
                    "column_2": 9,
                    "column_3": "Food",
                    "column_4": 49772
                },
                {
                    "id": 44,
                    "column_1": "Q2",
                    "column_2": 10,
                    "column_3": "Drink",
                    "column_4": 39949
                },
                {
                    "id": 45,
                    "column_1": "Q2",
                    "column_2": 10,
                    "column_3": "Food",
                    "column_4": 43113
                },
                {
                    "id": 46,
                    "column_1": "Q2",
                    "column_2": 10,
                    "column_3": "Non-Consumable",
                    "column_4": 6.55E+3
                },
                {
                    "id": 47,
                    "column_1": "Q2",
                    "column_2": 11,
                    "column_3": "Drink",
                    "column_4": 40906
                },
                {
                    "id": 48,
                    "column_1": "Q2",
                    "column_2": 11,
                    "column_3": "Food",
                    "column_4": 78868
                },
                {
                    "id": 49,
                    "column_1": "Q2",
                    "column_2": 11,
                    "column_3": "Non-Consumable",
                    "column_4": 49369
                },
                {
                    "id": 50,
                    "column_1": "Q2",
                    "column_2": 13,
                    "column_3": "Drink",
                    "column_4": 9078
                },
                {
                    "id": 51,
                    "column_1": "Q2",
                    "column_2": 13,
                    "column_3": "Food",
                    "column_4": 110402
                },
                {
                    "id": 52,
                    "column_1": "Q2",
                    "column_2": 13,
                    "column_3": "Non-Consumable",
                    "column_4": 49577
                },
                {
                    "id": 53,
                    "column_1": "Q2",
                    "column_2": 15,
                    "column_3": "Food",
                    "column_4": 3.581E+4
                },
                {
                    "id": 54,
                    "column_1": "Q2",
                    "column_2": 15,
                    "column_3": "Non-Consumable",
                    "column_4": 20962
                },
                {
                    "id": 55,
                    "column_1": "Q2",
                    "column_2": 17,
                    "column_3": "Drink",
                    "column_4": 28056
                },
                {
                    "id": 56,
                    "column_1": "Q2",
                    "column_2": 17,
                    "column_3": "Food",
                    "column_4": 55226
                },
                {
                    "id": 57,
                    "column_1": "Q2",
                    "column_2": 17,
                    "column_3": "Non-Consumable",
                    "column_4": 50608
                },
                {
                    "id": 58,
                    "column_1": "Q2",
                    "column_2": 18,
                    "column_3": "Non-Consumable",
                    "column_4": 5952
                },
                {
                    "id": 59,
                    "column_1": "Q2",
                    "column_2": 19,
                    "column_3": "Drink",
                    "column_4": 18975
                },
                {
                    "id": 60,
                    "column_1": "Q2",
                    "column_2": 19,
                    "column_3": "Food",
                    "column_4": 68001
                },
                {
                    "id": 61,
                    "column_1": "Q2",
                    "column_2": 19,
                    "column_3": "Non-Consumable",
                    "column_4": 59089
                },
                {
                    "id": 62,
                    "column_1": "Q2",
                    "column_2": 20,
                    "column_3": "Food",
                    "column_4": 27189
                },
                {
                    "id": 63,
                    "column_1": "Q2",
                    "column_2": 21,
                    "column_3": "Drink",
                    "column_4": 11715
                },
                {
                    "id": 64,
                    "column_1": "Q2",
                    "column_2": 21,
                    "column_3": "Food",
                    "column_4": 86635
                },
                {
                    "id": 65,
                    "column_1": "Q2",
                    "column_2": 21,
                    "column_3": "Non-Consumable",
                    "column_4": 91845
                },
                {
                    "id": 66,
                    "column_1": "Q2",
                    "column_2": 23,
                    "column_3": "Food",
                    "column_4": 49048
                },
                {
                    "id": 67,
                    "column_1": "Q2",
                    "column_2": 23,
                    "column_3": "Non-Consumable",
                    "column_4": 2.014E+4
                },
                {
                    "id": 68,
                    "column_1": "Q2",
                    "column_2": 24,
                    "column_3": "Food",
                    "column_4": 38312
                },
                {
                    "id": 69,
                    "column_1": "Q2",
                    "column_2": 24,
                    "column_3": "Non-Consumable",
                    "column_4": 22865
                },
                {
                    "id": 70,
                    "column_1": "Q3",
                    "column_2": 1,
                    "column_3": "Drink",
                    "column_4": 6336
                },
                {
                    "id": 71,
                    "column_1": "Q3",
                    "column_2": 1,
                    "column_3": "Food",
                    "column_4": 29142
                },
                {
                    "id": 72,
                    "column_1": "Q3",
                    "column_2": 1,
                    "column_3": "Non-Consumable",
                    "column_4": 112123
                },
                {
                    "id": 73,
                    "column_1": "Q3",
                    "column_2": 4,
                    "column_3": "Food",
                    "column_4": 102621
                },
                {
                    "id": 74,
                    "column_1": "Q3",
                    "column_2": 4,
                    "column_3": "Non-Consumable",
                    "column_4": 86809
                },
                {
                    "id": 75,
                    "column_1": "Q3",
                    "column_2": 5,
                    "column_3": "Food",
                    "column_4": 60658
                },
                {
                    "id": 76,
                    "column_1": "Q3",
                    "column_2": 5,
                    "column_3": "Non-Consumable",
                    "column_4": 2.052E+4
                },
                {
                    "id": 77,
                    "column_1": "Q3",
                    "column_2": 6,
                    "column_3": "Food",
                    "column_4": 26904
                },
                {
                    "id": 78,
                    "column_1": "Q3",
                    "column_2": 7,
                    "column_3": "Food",
                    "column_4": 41556
                },
                {
                    "id": 79,
                    "column_1": "Q3",
                    "column_2": 7,
                    "column_3": "Non-Consumable",
                    "column_4": 71181
                },
                {
                    "id": 80,
                    "column_1": "Q3",
                    "column_2": 10,
                    "column_3": "Car",
                    "column_4": 13176
                },
                {
                    "id": 81,
                    "column_1": "Q3",
                    "column_2": 10,
                    "column_3": "Food",
                    "column_4": 148272
                },
                {
                    "id": 82,
                    "column_1": "Q3",
                    "column_2": 10,
                    "column_3": "Non-Consumable",
                    "column_4": 15387
                },
                {
                    "id": 83,
                    "column_1": "Q3",
                    "column_2": 11,
                    "column_3": "Food",
                    "column_4": 1.956E+5
                },
                {
                    "id": 84,
                    "column_1": "Q3",
                    "column_2": 11,
                    "column_3": "Non-Consumable",
                    "column_4": 62979
                },
                {
                    "id": 85,
                    "column_1": "Q3",
                    "column_2": 13,
                    "column_3": "Car",
                    "column_4": 4636
                },
                {
                    "id": 86,
                    "column_1": "Q3",
                    "column_2": 13,
                    "column_3": "Drink",
                    "column_4": 19135
                },
                {
                    "id": 87,
                    "column_1": "Q3",
                    "column_2": 13,
                    "column_3": "Food",
                    "column_4": 62901
                },
                {
                    "id": 88,
                    "column_1": "Q3",
                    "column_2": 13,
                    "column_3": "Non-Consumable",
                    "column_4": 52164
                },
                {
                    "id": 89,
                    "column_1": "Q3",
                    "column_2": 15,
                    "column_3": "Drink",
                    "column_4": 41374
                },
                {
                    "id": 90,
                    "column_1": "Q3",
                    "column_2": 15,
                    "column_3": "Food",
                    "column_4": 1.8431E+5
                },
                {
                    "id": 91,
                    "column_1": "Q3",
                    "column_2": 15,
                    "column_3": "Non-Consumable",
                    "column_4": 33698
                },
                {
                    "id": 92,
                    "column_1": "Q3",
                    "column_2": 17,
                    "column_3": "Drink",
                    "column_4": 77059
                },
                {
                    "id": 93,
                    "column_1": "Q3",
                    "column_2": 17,
                    "column_3": "Food",
                    "column_4": 5.524E+4
                },
                {
                    "id": 94,
                    "column_1": "Q3",
                    "column_2": 17,
                    "column_3": "Non-Consumable",
                    "column_4": 6.273E+4
                },
                {
                    "id": 95,
                    "column_1": "Q3",
                    "column_2": 19,
                    "column_3": "Drink",
                    "column_4": 58452
                },
                {
                    "id": 96,
                    "column_1": "Q3",
                    "column_2": 19,
                    "column_3": "Food",
                    "column_4": 104916
                },
                {
                    "id": 97,
                    "column_1": "Q3",
                    "column_2": 19,
                    "column_3": "Non-Consumable",
                    "column_4": 46479
                },
                {
                    "id": 98,
                    "column_1": "Q3",
                    "column_2": 21,
                    "column_3": "Food",
                    "column_4": 6.236E+4
                },
                {
                    "id": 99,
                    "column_1": "Q3",
                    "column_2": 21,
                    "column_3": "Non-Consumable",
                    "column_4": 54485
                },
                {
                    "id": 100,
                    "column_1": "Q3",
                    "column_2": 24,
                    "column_3": "Food",
                    "column_4": 73228
                },
                {
                    "id": 101,
                    "column_1": "Q3",
                    "column_2": 24,
                    "column_3": "Non-Consumable",
                    "column_4": 95829
                },
                {
                    "id": 102,
                    "column_1": "Q4",
                    "column_2": 1,
                    "column_3": "Non-Consumable",
                    "column_4": 11567
                },
                {
                    "id": 103,
                    "column_1": "Q4",
                    "column_2": 2,
                    "column_3": "Food",
                    "column_4": 21544
                },
                {
                    "id": 104,
                    "column_1": "Q4",
                    "column_2": 2,
                    "column_3": "Non-Consumable",
                    "column_4": 38927
                },
                {
                    "id": 105,
                    "column_1": "Q4",
                    "column_2": 3,
                    "column_3": "Food",
                    "column_4": 111115
                },
                {
                    "id": 106,
                    "column_1": "Q4",
                    "column_2": 3,
                    "column_3": "Non-Consumable",
                    "column_4": 44613
                },
                {
                    "id": 107,
                    "column_1": "Q4",
                    "column_2": 6,
                    "column_3": "Food",
                    "column_4": 70939
                },
                {
                    "id": 108,
                    "column_1": "Q4",
                    "column_2": 6,
                    "column_3": "Non-Consumable",
                    "column_4": 48083
                },
                {
                    "id": 109,
                    "column_1": "Q4",
                    "column_2": 7,
                    "column_3": "Drink",
                    "column_4": 12144
                },
                {
                    "id": 110,
                    "column_1": "Q4",
                    "column_2": 7,
                    "column_3": "Food",
                    "column_4": 35695
                },
                {
                    "id": 111,
                    "column_1": "Q4",
                    "column_2": 8,
                    "column_3": "Food",
                    "column_4": 92252
                },
                {
                    "id": 112,
                    "column_1": "Q4",
                    "column_2": 8,
                    "column_3": "Non-Consumable",
                    "column_4": 104777
                },
                {
                    "id": 113,
                    "column_1": "Q4",
                    "column_2": 10,
                    "column_3": "Drink",
                    "column_4": 10146
                },
                {
                    "id": 114,
                    "column_1": "Q4",
                    "column_2": 10,
                    "column_3": "Food",
                    "column_4": 63964
                },
                {
                    "id": 115,
                    "column_1": "Q4",
                    "column_2": 10,
                    "column_3": "Non-Consumable",
                    "column_4": 9842
                },
                {
                    "id": 116,
                    "column_1": "Q4",
                    "column_2": 11,
                    "column_3": "Non-Consumable",
                    "column_4": 4454
                },
                {
                    "id": 117,
                    "column_1": "Q4",
                    "column_2": 12,
                    "column_3": "Food",
                    "column_4": 77751
                },
                {
                    "id": 118,
                    "column_1": "Q4",
                    "column_2": 12,
                    "column_3": "Non-Consumable",
                    "column_4": 14208
                },
                {
                    "id": 119,
                    "column_1": "Q4",
                    "column_2": 13,
                    "column_3": "Food",
                    "column_4": 87274
                },
                {
                    "id": 120,
                    "column_1": "Q4",
                    "column_2": 13,
                    "column_3": "Non-Consumable",
                    "column_4": 122201
                },
                {
                    "id": 121,
                    "column_1": "Q4",
                    "column_2": 15,
                    "column_3": "Food",
                    "column_4": 62414
                },
                {
                    "id": 122,
                    "column_1": "Q4",
                    "column_2": 15,
                    "column_3": "Non-Consumable",
                    "column_4": 15054
                },
                {
                    "id": 123,
                    "column_1": "Q4",
                    "column_2": 16,
                    "column_3": "Drink",
                    "column_4": 4.494E+4
                },
                {
                    "id": 124,
                    "column_1": "Q4",
                    "column_2": 16,
                    "column_3": "Food",
                    "column_4": 35445
                },
                {
                    "id": 125,
                    "column_1": "Q4",
                    "column_2": 17,
                    "column_3": "Drink",
                    "column_4": 1.092E+4
                },
                {
                    "id": 126,
                    "column_1": "Q4",
                    "column_2": 17,
                    "column_3": "Food",
                    "column_4": 27539
                },
                {
                    "id": 127,
                    "column_1": "Q4",
                    "column_2": 17,
                    "column_3": "Non-Consumable",
                    "column_4": 60445
                },
                {
                    "id": 128,
                    "column_1": "Q4",
                    "column_2": 19,
                    "column_3": "Food",
                    "column_4": 44799
                },
                {
                    "id": 129,
                    "column_1": "Q4",
                    "column_2": 19,
                    "column_3": "Non-Consumable",
                    "column_4": 16055
                },
                {
                    "id": 130,
                    "column_1": "Q4",
                    "column_2": 21,
                    "column_3": "Drink",
                    "column_4": 24035
                },
                {
                    "id": 131,
                    "column_1": "Q4",
                    "column_2": 21,
                    "column_3": "Food",
                    "column_4": 149606
                },
                {
                    "id": 132,
                    "column_1": "Q4",
                    "column_2": 21,
                    "column_3": "Non-Consumable",
                    "column_4": 56418
                },
                {
                    "id": 133,
                    "column_1": "Q4",
                    "column_2": 24,
                    "column_3": "Food",
                    "column_4": 85284
                },
                {
                    "id": 134,
                    "column_1": "Q4",
                    "column_2": 24,
                    "column_3": "Non-Consumable",
                    "column_4": 32144
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
                    "max": 24,
                    "min": 1,
                    "distinct": [
                        1,
                        2,
                        3,
                        4,
                        5,
                        6,
                        7,
                        8,
                        9,
                        10,
                        11,
                        12,
                        13,
                        14,
                        15,
                        16,
                        17,
                        18,
                        19,
                        20,
                        21,
                        22,
                        23,
                        24
                    ],
                    "cardinality": 24
                },
                "3": {
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
                "4": {
                    "max": 1.956E+5,
                    "min": 2365,
                    "distinct": [
                        2365,
                        3465,
                        4454,
                        4636,
                        5313,
                        5952,
                        6336,
                        6.55E+3,
                        6629,
                        7084,
                        9078,
                        9842,
                        10146,
                        1.092E+4,
                        11567,
                        11715,
                        12144,
                        12369,
                        13176,
                        13851,
                        13992,
                        14208,
                        1.456E+4,
                        15054,
                        15387,
                        16055,
                        1.715E+4,
                        18975,
                        19135,
                        2.014E+4,
                        2.052E+4,
                        20962,
                        21216,
                        21544,
                        22865,
                        23222,
                        2.331E+4,
                        24035,
                        26904,
                        27181,
                        27189,
                        27539,
                        28056,
                        29084,
                        29142,
                        32144,
                        32926,
                        3.323E+4,
                        33698,
                        35445,
                        35695,
                        3.581E+4,
                        36839,
                        38312,
                        38927,
                        39012,
                        39949,
                        40906,
                        41374,
                        41506,
                        41556,
                        43113,
                        44069,
                        44613,
                        44799,
                        4.494E+4,
                        46224,
                        46479,
                        48083,
                        49048,
                        49369,
                        49577,
                        49772,
                        50608,
                        51419,
                        52164,
                        53477,
                        54485,
                        55226,
                        5.524E+4,
                        56418,
                        56765,
                        58452,
                        59089,
                        59641,
                        60445,
                        60658,
                        6.236E+4,
                        62414,
                        6.273E+4,
                        62901,
                        62979,
                        63964,
                        68001,
                        70939,
                        71181,
                        73228,
                        73646,
                        75795,
                        77059,
                        77751,
                        78753,
                        78868,
                        80693,
                        84818,
                        85284,
                        85758,
                        8.606E+4,
                        86635,
                        86809,
                        87274,
                        91845,
                        92252,
                        92609,
                        93286,
                        95829,
                        99645,
                        102621,
                        1.0308E+5,
                        104777,
                        104916,
                        110337,
                        110402,
                        111115,
                        112123,
                        122201,
                        1.2676E+5,
                        141725,
                        148272,
                        149606,
                        1.747E+5,
                        1.8431E+5,
                        1.956E+5
                    ],
                    "cardinality": 133
                }
            }
        }

        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'ATTRIBUTE')
        console.log('---------- ATTRIBUTE COLUMNS: ', attributeColumns)
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'MEASURE')
        console.log('---------- MEASURE COLUMNS: ', measureColumns)
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        // console.log('------- dateFormat: ', dateFormat)
        this.setRegularData(mockedData, attributeColumns, measureColumns)
        return this.model.series
    }

    setRegularData(data: any, attributeColumns: any[], measureColumns: any[]) {
        if (!data || !measureColumns[0] || attributeColumns.length < 2) return
        const measureColumn = measureColumns[0]
        const serieElement = {
            id: 0, name: measureColumn.column.columnName, data: [] as any[], layoutAlgorithm: 'squarified',
            allowDrillToNode: true,
            animationLimit: 1000,
        }
        const hierarchy = {}
        let id = 0;
        data.rows?.forEach((row: any) => {
            const formattedRow = {}
            for (let i = 0; i < attributeColumns.length; i++) {
                formattedRow['column_' + (i + 1)] = row[attributeColumns[i].metadata.dataIndex]
            }
            formattedRow['column_' + (attributeColumns.length + 1)] = row[measureColumn.metadata.dataIndex]

            let currentItem = hierarchy as any;

            Object.entries(formattedRow).forEach(([key, value]) => {
                if (key === measureColumn.metadata.dataIndex) {
                    if (!(key in currentItem)) currentItem.value = 0;
                    currentItem.value += value;
                    return;
                }

                // // TODO
                // if (!currentItem[value]) currentItem[value] = {};
                // currentItem = currentItem[value];

                if (!currentItem.children) {
                    // Create a children array if it doesn't exist
                    currentItem.children = [];
                }

                // Check if the child item already exists
                const childItem = currentItem.children.find(child => child.name === value);
                if (childItem) {
                    currentItem = childItem;
                } else {
                    // Create a new child item and assign an ID
                    id++;
                    const newChildItem = {
                        id: '' + id,
                        name: value,
                        parent: '' + currentItem.id || null,
                        value: 0
                    };
                    currentItem.children.push(newChildItem);
                    currentItem = newChildItem;
                }
            });
        });

        const treemapArray = this.createTreeSeriesStructureFromHierarchy(hierarchy)
        treemapArray.forEach((el: any) => {
            if (el.value === 0) delete el.value
        })

        console.log('-------      hierarchy: ', hierarchy)
        console.log('-------      treemapArray: ', treemapArray)
        treemapArray.splice(0, 1)
        serieElement.data = treemapArray


        this.model.series = [serieElement]
    }

    createTreeSeriesStructureFromHierarchy(node: any, parentId = null, result = [] as any[]) {
        const { children, ...rest } = node;
        const flattenedNode = {
            ...rest,
            parent: parentId
        };

        result.push(flattenedNode);

        if (children) {
            children.forEach(child => {
                this.createTreeSeriesStructureFromHierarchy(child, node.id, result);
            });
        }

        return result;
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
                        return KnowageHighchartsBarChart.prototype.handleFormatter(this, seriesLabelSetting.label)
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
