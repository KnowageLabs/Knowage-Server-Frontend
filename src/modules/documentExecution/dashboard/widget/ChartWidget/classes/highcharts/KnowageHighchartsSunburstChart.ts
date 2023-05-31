import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsChartSerieData } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { updateSunburstChartModel } from './updater/KnowageHighchartsSunburstChartUpdater'
import { createSerie } from './updater/KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import { getAllColumnsOfSpecificTypeFromDataResponse, setRegularTreeData } from './helpers/setData/HighchartsSetDataHelpers'


export class KnowageHighchartsSunburstChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOption) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'sunburst') {
                this.formatSeriesFromOtherChartTypeSeries()
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'sunburst'
    }

    updateModel(oldModel: any) {
        updateSunburstChartModel(oldModel, this.model)
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
                    },
                    {
                        "name": "column_5",
                        "header": "UNITS_SHIPPED_SUM",
                        "dataIndex": "column_5",
                        "type": "float",
                        "precision": 54,
                        "scale": 0,
                        "multiValue": false
                    }
                ],
                "cacheDate": "2023-05-30 16:16:22.785"
            },
            "results": 134,
            "rows": [
                {
                    "id": 1,
                    "column_1": "Q1",
                    "column_2": 1,
                    "column_3": "Drink",
                    "column_4": 13992,
                    "column_5": 13992
                },
                {
                    "id": 2,
                    "column_1": "Q1",
                    "column_2": 1,
                    "column_3": "Food",
                    "column_4": 75795,
                    "column_5": 75795
                },
                {
                    "id": 3,
                    "column_1": "Q1",
                    "column_2": 1,
                    "column_3": "Non-Consumable",
                    "column_4": 2.331E+4,
                    "column_5": 2.331E+4
                },
                {
                    "id": 4,
                    "column_1": "Q1",
                    "column_2": 4,
                    "column_3": "Drink",
                    "column_4": 3.323E+4,
                    "column_5": 3.323E+4
                },
                {
                    "id": 5,
                    "column_1": "Q1",
                    "column_2": 4,
                    "column_3": "Food",
                    "column_4": 99645,
                    "column_5": 89395
                },
                {
                    "id": 6,
                    "column_1": "Q1",
                    "column_2": 4,
                    "column_3": "Non-Consumable",
                    "column_4": 44069,
                    "column_5": 44069
                },
                {
                    "id": 7,
                    "column_1": "Q1",
                    "column_2": 7,
                    "column_3": "Food",
                    "column_4": 80693,
                    "column_5": 65149
                },
                {
                    "id": 8,
                    "column_1": "Q1",
                    "column_2": 7,
                    "column_3": "Non-Consumable",
                    "column_4": 56765,
                    "column_5": 56765
                },
                {
                    "id": 9,
                    "column_1": "Q1",
                    "column_2": 9,
                    "column_3": "Drink",
                    "column_4": 7084,
                    "column_5": 7084
                },
                {
                    "id": 10,
                    "column_1": "Q1",
                    "column_2": 9,
                    "column_3": "Food",
                    "column_4": 110337,
                    "column_5": 110337
                },
                {
                    "id": 11,
                    "column_1": "Q1",
                    "column_2": 11,
                    "column_3": "Drink",
                    "column_4": 41506,
                    "column_5": 41506
                },
                {
                    "id": 12,
                    "column_1": "Q1",
                    "column_2": 11,
                    "column_3": "Food",
                    "column_4": 51419,
                    "column_5": 45143
                },
                {
                    "id": 13,
                    "column_1": "Q1",
                    "column_2": 11,
                    "column_3": "Non-Consumable",
                    "column_4": 8.606E+4,
                    "column_5": 8.606E+4
                },
                {
                    "id": 14,
                    "column_1": "Q1",
                    "column_2": 13,
                    "column_3": "Drink",
                    "column_4": 1.456E+4,
                    "column_5": 1.456E+4
                },
                {
                    "id": 15,
                    "column_1": "Q1",
                    "column_2": 13,
                    "column_3": "Food",
                    "column_4": 59641,
                    "column_5": 44857
                },
                {
                    "id": 16,
                    "column_1": "Q1",
                    "column_2": 13,
                    "column_3": "Non-Consumable",
                    "column_4": 32926,
                    "column_5": 17386
                },
                {
                    "id": 17,
                    "column_1": "Q1",
                    "column_2": 14,
                    "column_3": "Drink",
                    "column_4": 2365,
                    "column_5": 2365
                },
                {
                    "id": 18,
                    "column_1": "Q1",
                    "column_2": 14,
                    "column_3": "Food",
                    "column_4": 12369,
                    "column_5": 12369
                },
                {
                    "id": 19,
                    "column_1": "Q1",
                    "column_2": 14,
                    "column_3": "Non-Consumable",
                    "column_4": 1.715E+4,
                    "column_5": 1.715E+4
                },
                {
                    "id": 20,
                    "column_1": "Q1",
                    "column_2": 15,
                    "column_3": "Food",
                    "column_4": 85758,
                    "column_5": 85758
                },
                {
                    "id": 21,
                    "column_1": "Q1",
                    "column_2": 15,
                    "column_3": "Non-Consumable",
                    "column_4": 36839,
                    "column_5": 25367
                },
                {
                    "id": 22,
                    "column_1": "Q1",
                    "column_2": 17,
                    "column_3": "Food",
                    "column_4": 73646,
                    "column_5": 54326
                },
                {
                    "id": 23,
                    "column_1": "Q1",
                    "column_2": 17,
                    "column_3": "Non-Consumable",
                    "column_4": 78753,
                    "column_5": 77925
                },
                {
                    "id": 24,
                    "column_1": "Q1",
                    "column_2": 18,
                    "column_3": "Drink",
                    "column_4": 3465,
                    "column_5": 2772
                },
                {
                    "id": 25,
                    "column_1": "Q1",
                    "column_2": 18,
                    "column_3": "Food",
                    "column_4": 1.747E+5,
                    "column_5": 1.632E+5
                },
                {
                    "id": 26,
                    "column_1": "Q1",
                    "column_2": 18,
                    "column_3": "Non-Consumable",
                    "column_4": 29084,
                    "column_5": 2.462E+4
                },
                {
                    "id": 27,
                    "column_1": "Q1",
                    "column_2": 20,
                    "column_3": "Drink",
                    "column_4": 6629,
                    "column_5": 6629
                },
                {
                    "id": 28,
                    "column_1": "Q1",
                    "column_2": 20,
                    "column_3": "Food",
                    "column_4": 92609,
                    "column_5": 87084
                },
                {
                    "id": 29,
                    "column_1": "Q1",
                    "column_2": 20,
                    "column_3": "Non-Consumable",
                    "column_4": 1.2676E+5,
                    "column_5": 1.2676E+5
                },
                {
                    "id": 30,
                    "column_1": "Q1",
                    "column_2": 22,
                    "column_3": "Food",
                    "column_4": 46224,
                    "column_5": 34974
                },
                {
                    "id": 31,
                    "column_1": "Q1",
                    "column_2": 22,
                    "column_3": "Non-Consumable",
                    "column_4": 13851,
                    "column_5": 13851
                },
                {
                    "id": 32,
                    "column_1": "Q1",
                    "column_2": 23,
                    "column_3": "Drink",
                    "column_4": 5313,
                    "column_5": 5313
                },
                {
                    "id": 33,
                    "column_1": "Q1",
                    "column_2": 23,
                    "column_3": "Food",
                    "column_4": 84818,
                    "column_5": 84188
                },
                {
                    "id": 34,
                    "column_1": "Q1",
                    "column_2": 23,
                    "column_3": "Non-Consumable",
                    "column_4": 23222,
                    "column_5": 23222
                },
                {
                    "id": 35,
                    "column_1": "Q2",
                    "column_2": 1,
                    "column_3": "Drink",
                    "column_4": 27181,
                    "column_5": 27181
                },
                {
                    "id": 36,
                    "column_1": "Q2",
                    "column_2": 1,
                    "column_3": "Food",
                    "column_4": 53477,
                    "column_5": 50215
                },
                {
                    "id": 37,
                    "column_1": "Q2",
                    "column_2": 1,
                    "column_3": "Non-Consumable",
                    "column_4": 39012,
                    "column_5": 39012
                },
                {
                    "id": 38,
                    "column_1": "Q2",
                    "column_2": 4,
                    "column_3": "Drink",
                    "column_4": 18975,
                    "column_5": 18975
                },
                {
                    "id": 39,
                    "column_1": "Q2",
                    "column_2": 4,
                    "column_3": "Food",
                    "column_4": 93286,
                    "column_5": 93286
                },
                {
                    "id": 40,
                    "column_1": "Q2",
                    "column_2": 4,
                    "column_3": "Non-Consumable",
                    "column_4": 21216,
                    "column_5": 21216
                },
                {
                    "id": 41,
                    "column_1": "Q2",
                    "column_2": 7,
                    "column_3": "Food",
                    "column_4": 141725,
                    "column_5": 110806
                },
                {
                    "id": 42,
                    "column_1": "Q2",
                    "column_2": 7,
                    "column_3": "Non-Consumable",
                    "column_4": 1.0308E+5,
                    "column_5": 99216
                },
                {
                    "id": 43,
                    "column_1": "Q2",
                    "column_2": 9,
                    "column_3": "Food",
                    "column_4": 49772,
                    "column_5": 49772
                },
                {
                    "id": 44,
                    "column_1": "Q2",
                    "column_2": 10,
                    "column_3": "Drink",
                    "column_4": 39949,
                    "column_5": 39949
                },
                {
                    "id": 45,
                    "column_1": "Q2",
                    "column_2": 10,
                    "column_3": "Food",
                    "column_4": 43113,
                    "column_5": 43113
                },
                {
                    "id": 46,
                    "column_1": "Q2",
                    "column_2": 10,
                    "column_3": "Non-Consumable",
                    "column_4": 6.55E+3,
                    "column_5": 4716
                },
                {
                    "id": 47,
                    "column_1": "Q2",
                    "column_2": 11,
                    "column_3": "Drink",
                    "column_4": 40906,
                    "column_5": 29706
                },
                {
                    "id": 48,
                    "column_1": "Q2",
                    "column_2": 11,
                    "column_3": "Food",
                    "column_4": 78868,
                    "column_5": 68911
                },
                {
                    "id": 49,
                    "column_1": "Q2",
                    "column_2": 11,
                    "column_3": "Non-Consumable",
                    "column_4": 49369,
                    "column_5": 49369
                },
                {
                    "id": 50,
                    "column_1": "Q2",
                    "column_2": 13,
                    "column_3": "Drink",
                    "column_4": 9078,
                    "column_5": 9078
                },
                {
                    "id": 51,
                    "column_1": "Q2",
                    "column_2": 13,
                    "column_3": "Food",
                    "column_4": 110402,
                    "column_5": 77203
                },
                {
                    "id": 52,
                    "column_1": "Q2",
                    "column_2": 13,
                    "column_3": "Non-Consumable",
                    "column_4": 49577,
                    "column_5": 49577
                },
                {
                    "id": 53,
                    "column_1": "Q2",
                    "column_2": 15,
                    "column_3": "Food",
                    "column_4": 3.581E+4,
                    "column_5": 3.581E+4
                },
                {
                    "id": 54,
                    "column_1": "Q2",
                    "column_2": 15,
                    "column_3": "Non-Consumable",
                    "column_4": 20962,
                    "column_5": 14495
                },
                {
                    "id": 55,
                    "column_1": "Q2",
                    "column_2": 17,
                    "column_3": "Drink",
                    "column_4": 28056,
                    "column_5": 19992
                },
                {
                    "id": 56,
                    "column_1": "Q2",
                    "column_2": 17,
                    "column_3": "Food",
                    "column_4": 55226,
                    "column_5": 52608
                },
                {
                    "id": 57,
                    "column_1": "Q2",
                    "column_2": 17,
                    "column_3": "Non-Consumable",
                    "column_4": 50608,
                    "column_5": 44616
                },
                {
                    "id": 58,
                    "column_1": "Q2",
                    "column_2": 18,
                    "column_3": "Non-Consumable",
                    "column_4": 5952,
                    "column_5": 5952
                },
                {
                    "id": 59,
                    "column_1": "Q2",
                    "column_2": 19,
                    "column_3": "Drink",
                    "column_4": 18975,
                    "column_5": 18975
                },
                {
                    "id": 60,
                    "column_1": "Q2",
                    "column_2": 19,
                    "column_3": "Food",
                    "column_4": 68001,
                    "column_5": 68001
                },
                {
                    "id": 61,
                    "column_1": "Q2",
                    "column_2": 19,
                    "column_3": "Non-Consumable",
                    "column_4": 59089,
                    "column_5": 56273
                },
                {
                    "id": 62,
                    "column_1": "Q2",
                    "column_2": 20,
                    "column_3": "Food",
                    "column_4": 27189,
                    "column_5": 27189
                },
                {
                    "id": 63,
                    "column_1": "Q2",
                    "column_2": 21,
                    "column_3": "Drink",
                    "column_4": 11715,
                    "column_5": 11715
                },
                {
                    "id": 64,
                    "column_1": "Q2",
                    "column_2": 21,
                    "column_3": "Food",
                    "column_4": 86635,
                    "column_5": 67839
                },
                {
                    "id": 65,
                    "column_1": "Q2",
                    "column_2": 21,
                    "column_3": "Non-Consumable",
                    "column_4": 91845,
                    "column_5": 91845
                },
                {
                    "id": 66,
                    "column_1": "Q2",
                    "column_2": 23,
                    "column_3": "Food",
                    "column_4": 49048,
                    "column_5": 49048
                },
                {
                    "id": 67,
                    "column_1": "Q2",
                    "column_2": 23,
                    "column_3": "Non-Consumable",
                    "column_4": 2.014E+4,
                    "column_5": 16981
                },
                {
                    "id": 68,
                    "column_1": "Q2",
                    "column_2": 24,
                    "column_3": "Food",
                    "column_4": 38312,
                    "column_5": 32098
                },
                {
                    "id": 69,
                    "column_1": "Q2",
                    "column_2": 24,
                    "column_3": "Non-Consumable",
                    "column_4": 22865,
                    "column_5": 22865
                },
                {
                    "id": 70,
                    "column_1": "Q3",
                    "column_2": 1,
                    "column_3": "Drink",
                    "column_4": 6336,
                    "column_5": 6336
                },
                {
                    "id": 71,
                    "column_1": "Q3",
                    "column_2": 1,
                    "column_3": "Food",
                    "column_4": 29142,
                    "column_5": 28917
                },
                {
                    "id": 72,
                    "column_1": "Q3",
                    "column_2": 1,
                    "column_3": "Non-Consumable",
                    "column_4": 112123,
                    "column_5": 102281
                },
                {
                    "id": 73,
                    "column_1": "Q3",
                    "column_2": 4,
                    "column_3": "Food",
                    "column_4": 102621,
                    "column_5": 84121
                },
                {
                    "id": 74,
                    "column_1": "Q3",
                    "column_2": 4,
                    "column_3": "Non-Consumable",
                    "column_4": 86809,
                    "column_5": 86809
                },
                {
                    "id": 75,
                    "column_1": "Q3",
                    "column_2": 5,
                    "column_3": "Food",
                    "column_4": 60658,
                    "column_5": 57952
                },
                {
                    "id": 76,
                    "column_1": "Q3",
                    "column_2": 5,
                    "column_3": "Non-Consumable",
                    "column_4": 2.052E+4,
                    "column_5": 2.052E+4
                },
                {
                    "id": 77,
                    "column_1": "Q3",
                    "column_2": 6,
                    "column_3": "Food",
                    "column_4": 26904,
                    "column_5": 26904
                },
                {
                    "id": 78,
                    "column_1": "Q3",
                    "column_2": 7,
                    "column_3": "Food",
                    "column_4": 41556,
                    "column_5": 37866
                },
                {
                    "id": 79,
                    "column_1": "Q3",
                    "column_2": 7,
                    "column_3": "Non-Consumable",
                    "column_4": 71181,
                    "column_5": 65154
                },
                {
                    "id": 80,
                    "column_1": "Q3",
                    "column_2": 10,
                    "column_3": "Car",
                    "column_4": 13176,
                    "column_5": 13176
                },
                {
                    "id": 81,
                    "column_1": "Q3",
                    "column_2": 10,
                    "column_3": "Food",
                    "column_4": 148272,
                    "column_5": 134818
                },
                {
                    "id": 82,
                    "column_1": "Q3",
                    "column_2": 10,
                    "column_3": "Non-Consumable",
                    "column_4": 15387,
                    "column_5": 15387
                },
                {
                    "id": 83,
                    "column_1": "Q3",
                    "column_2": 11,
                    "column_3": "Food",
                    "column_4": 1.956E+5,
                    "column_5": 191849
                },
                {
                    "id": 84,
                    "column_1": "Q3",
                    "column_2": 11,
                    "column_3": "Non-Consumable",
                    "column_4": 62979,
                    "column_5": 47019
                },
                {
                    "id": 85,
                    "column_1": "Q3",
                    "column_2": 13,
                    "column_3": "Car",
                    "column_4": 4636,
                    "column_5": 4636
                },
                {
                    "id": 86,
                    "column_1": "Q3",
                    "column_2": 13,
                    "column_3": "Drink",
                    "column_4": 19135,
                    "column_5": 19135
                },
                {
                    "id": 87,
                    "column_1": "Q3",
                    "column_2": 13,
                    "column_3": "Food",
                    "column_4": 62901,
                    "column_5": 58279
                },
                {
                    "id": 88,
                    "column_1": "Q3",
                    "column_2": 13,
                    "column_3": "Non-Consumable",
                    "column_4": 52164,
                    "column_5": 5.026E+4
                },
                {
                    "id": 89,
                    "column_1": "Q3",
                    "column_2": 15,
                    "column_3": "Drink",
                    "column_4": 41374,
                    "column_5": 40362
                },
                {
                    "id": 90,
                    "column_1": "Q3",
                    "column_2": 15,
                    "column_3": "Food",
                    "column_4": 1.8431E+5,
                    "column_5": 1.5832E+5
                },
                {
                    "id": 91,
                    "column_1": "Q3",
                    "column_2": 15,
                    "column_3": "Non-Consumable",
                    "column_4": 33698,
                    "column_5": 33698
                },
                {
                    "id": 92,
                    "column_1": "Q3",
                    "column_2": 17,
                    "column_3": "Drink",
                    "column_4": 77059,
                    "column_5": 77059
                },
                {
                    "id": 93,
                    "column_1": "Q3",
                    "column_2": 17,
                    "column_3": "Food",
                    "column_4": 5.524E+4,
                    "column_5": 33491
                },
                {
                    "id": 94,
                    "column_1": "Q3",
                    "column_2": 17,
                    "column_3": "Non-Consumable",
                    "column_4": 6.273E+4,
                    "column_5": 6.273E+4
                },
                {
                    "id": 95,
                    "column_1": "Q3",
                    "column_2": 19,
                    "column_3": "Drink",
                    "column_4": 58452,
                    "column_5": 58452
                },
                {
                    "id": 96,
                    "column_1": "Q3",
                    "column_2": 19,
                    "column_3": "Food",
                    "column_4": 104916,
                    "column_5": 104916
                },
                {
                    "id": 97,
                    "column_1": "Q3",
                    "column_2": 19,
                    "column_3": "Non-Consumable",
                    "column_4": 46479,
                    "column_5": 32752
                },
                {
                    "id": 98,
                    "column_1": "Q3",
                    "column_2": 21,
                    "column_3": "Food",
                    "column_4": 6.236E+4,
                    "column_5": 51223
                },
                {
                    "id": 99,
                    "column_1": "Q3",
                    "column_2": 21,
                    "column_3": "Non-Consumable",
                    "column_4": 54485,
                    "column_5": 44005
                },
                {
                    "id": 100,
                    "column_1": "Q3",
                    "column_2": 24,
                    "column_3": "Food",
                    "column_4": 73228,
                    "column_5": 64454
                },
                {
                    "id": 101,
                    "column_1": "Q3",
                    "column_2": 24,
                    "column_3": "Non-Consumable",
                    "column_4": 95829,
                    "column_5": 95829
                },
                {
                    "id": 102,
                    "column_1": "Q4",
                    "column_2": 1,
                    "column_3": "Non-Consumable",
                    "column_4": 11567,
                    "column_5": 11567
                },
                {
                    "id": 103,
                    "column_1": "Q4",
                    "column_2": 2,
                    "column_3": "Food",
                    "column_4": 21544,
                    "column_5": 21544
                },
                {
                    "id": 104,
                    "column_1": "Q4",
                    "column_2": 2,
                    "column_3": "Non-Consumable",
                    "column_4": 38927,
                    "column_5": 28943
                },
                {
                    "id": 105,
                    "column_1": "Q4",
                    "column_2": 3,
                    "column_3": "Food",
                    "column_4": 111115,
                    "column_5": 9.265E+4
                },
                {
                    "id": 106,
                    "column_1": "Q4",
                    "column_2": 3,
                    "column_3": "Non-Consumable",
                    "column_4": 44613,
                    "column_5": 44613
                },
                {
                    "id": 107,
                    "column_1": "Q4",
                    "column_2": 6,
                    "column_3": "Food",
                    "column_4": 70939,
                    "column_5": 70083
                },
                {
                    "id": 108,
                    "column_1": "Q4",
                    "column_2": 6,
                    "column_3": "Non-Consumable",
                    "column_4": 48083,
                    "column_5": 23422
                },
                {
                    "id": 109,
                    "column_1": "Q4",
                    "column_2": 7,
                    "column_3": "Drink",
                    "column_4": 12144,
                    "column_5": 12144
                },
                {
                    "id": 110,
                    "column_1": "Q4",
                    "column_2": 7,
                    "column_3": "Food",
                    "column_4": 35695,
                    "column_5": 35695
                },
                {
                    "id": 111,
                    "column_1": "Q4",
                    "column_2": 8,
                    "column_3": "Food",
                    "column_4": 92252,
                    "column_5": 92252
                },
                {
                    "id": 112,
                    "column_1": "Q4",
                    "column_2": 8,
                    "column_3": "Non-Consumable",
                    "column_4": 104777,
                    "column_5": 88286
                },
                {
                    "id": 113,
                    "column_1": "Q4",
                    "column_2": 10,
                    "column_3": "Drink",
                    "column_4": 10146,
                    "column_5": 10146
                },
                {
                    "id": 114,
                    "column_1": "Q4",
                    "column_2": 10,
                    "column_3": "Food",
                    "column_4": 63964,
                    "column_5": 63964
                },
                {
                    "id": 115,
                    "column_1": "Q4",
                    "column_2": 10,
                    "column_3": "Non-Consumable",
                    "column_4": 9842,
                    "column_5": 9842
                },
                {
                    "id": 116,
                    "column_1": "Q4",
                    "column_2": 11,
                    "column_3": "Non-Consumable",
                    "column_4": 4454,
                    "column_5": 524
                },
                {
                    "id": 117,
                    "column_1": "Q4",
                    "column_2": 12,
                    "column_3": "Food",
                    "column_4": 77751,
                    "column_5": 64875
                },
                {
                    "id": 118,
                    "column_1": "Q4",
                    "column_2": 12,
                    "column_3": "Non-Consumable",
                    "column_4": 14208,
                    "column_5": 14208
                },
                {
                    "id": 119,
                    "column_1": "Q4",
                    "column_2": 13,
                    "column_3": "Food",
                    "column_4": 87274,
                    "column_5": 8.443E+4
                },
                {
                    "id": 120,
                    "column_1": "Q4",
                    "column_2": 13,
                    "column_3": "Non-Consumable",
                    "column_4": 122201,
                    "column_5": 110555
                },
                {
                    "id": 121,
                    "column_1": "Q4",
                    "column_2": 15,
                    "column_3": "Food",
                    "column_4": 62414,
                    "column_5": 50118
                },
                {
                    "id": 122,
                    "column_1": "Q4",
                    "column_2": 15,
                    "column_3": "Non-Consumable",
                    "column_4": 15054,
                    "column_5": 15054
                },
                {
                    "id": 123,
                    "column_1": "Q4",
                    "column_2": 16,
                    "column_3": "Drink",
                    "column_4": 4.494E+4,
                    "column_5": 4.494E+4
                },
                {
                    "id": 124,
                    "column_1": "Q4",
                    "column_2": 16,
                    "column_3": "Food",
                    "column_4": 35445,
                    "column_5": 35445
                },
                {
                    "id": 125,
                    "column_1": "Q4",
                    "column_2": 17,
                    "column_3": "Drink",
                    "column_4": 1.092E+4,
                    "column_5": 1.092E+4
                },
                {
                    "id": 126,
                    "column_1": "Q4",
                    "column_2": 17,
                    "column_3": "Food",
                    "column_4": 27539,
                    "column_5": 27539
                },
                {
                    "id": 127,
                    "column_1": "Q4",
                    "column_2": 17,
                    "column_3": "Non-Consumable",
                    "column_4": 60445,
                    "column_5": 55045
                },
                {
                    "id": 128,
                    "column_1": "Q4",
                    "column_2": 19,
                    "column_3": "Food",
                    "column_4": 44799,
                    "column_5": 32232
                },
                {
                    "id": 129,
                    "column_1": "Q4",
                    "column_2": 19,
                    "column_3": "Non-Consumable",
                    "column_4": 16055,
                    "column_5": 7657
                },
                {
                    "id": 130,
                    "column_1": "Q4",
                    "column_2": 21,
                    "column_3": "Drink",
                    "column_4": 24035,
                    "column_5": 24035
                },
                {
                    "id": 131,
                    "column_1": "Q4",
                    "column_2": 21,
                    "column_3": "Food",
                    "column_4": 149606,
                    "column_5": 145736
                },
                {
                    "id": 132,
                    "column_1": "Q4",
                    "column_2": 21,
                    "column_3": "Non-Consumable",
                    "column_4": 56418,
                    "column_5": 36756
                },
                {
                    "id": 133,
                    "column_1": "Q4",
                    "column_2": 24,
                    "column_3": "Food",
                    "column_4": 85284,
                    "column_5": 76275
                },
                {
                    "id": 134,
                    "column_1": "Q4",
                    "column_2": 24,
                    "column_3": "Non-Consumable",
                    "column_4": 32144,
                    "column_5": 32144
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
                },
                "5": {
                    "max": 191849,
                    "min": 524,
                    "distinct": [
                        524,
                        2365,
                        2772,
                        4636,
                        4716,
                        5313,
                        5952,
                        6336,
                        6629,
                        7084,
                        7657,
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
                        14495,
                        1.456E+4,
                        15054,
                        15387,
                        16981,
                        1.715E+4,
                        17386,
                        18975,
                        19135,
                        19992,
                        2.052E+4,
                        21216,
                        21544,
                        22865,
                        23222,
                        2.331E+4,
                        23422,
                        24035,
                        2.462E+4,
                        25367,
                        26904,
                        27181,
                        27189,
                        27539,
                        28917,
                        28943,
                        29706,
                        32098,
                        32144,
                        32232,
                        32752,
                        3.323E+4,
                        33491,
                        33698,
                        34974,
                        35445,
                        35695,
                        3.581E+4,
                        36756,
                        37866,
                        39012,
                        39949,
                        40362,
                        41506,
                        43113,
                        44005,
                        44069,
                        44613,
                        44616,
                        44857,
                        4.494E+4,
                        45143,
                        47019,
                        49048,
                        49369,
                        49577,
                        49772,
                        50118,
                        50215,
                        5.026E+4,
                        51223,
                        52608,
                        54326,
                        55045,
                        56273,
                        56765,
                        57952,
                        58279,
                        58452,
                        6.273E+4,
                        63964,
                        64454,
                        64875,
                        65149,
                        65154,
                        67839,
                        68001,
                        68911,
                        70083,
                        75795,
                        76275,
                        77059,
                        77203,
                        77925,
                        84121,
                        84188,
                        8.443E+4,
                        85758,
                        8.606E+4,
                        86809,
                        87084,
                        88286,
                        89395,
                        91845,
                        92252,
                        9.265E+4,
                        93286,
                        95829,
                        99216,
                        102281,
                        104916,
                        110337,
                        110555,
                        110806,
                        1.2676E+5,
                        134818,
                        145736,
                        1.5832E+5,
                        1.632E+5,
                        191849
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
        setRegularTreeData(this.model, mockedData, attributeColumns, measureColumns)
        return this.model.series
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
                        return KnowageHighchartsSunburstChart.prototype.handleFormatter(this, seriesLabelSetting.label)
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
