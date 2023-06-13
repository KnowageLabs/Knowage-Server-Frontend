import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { updateSunburstChartModel } from './updater/KnowageHighchartsSunburstChartUpdater'
import deepcopy from 'deepcopy'
import { createHierarchyFromData, createTreeSeriesStructureFromHierarchy, getAllColumnsOfSpecificTypeFromDataResponse } from './helpers/setData/HighchartsSetDataHelpers'
import { updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable } from './helpers/dataLabels/HighchartsDataLabelsHelpers'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'


export class KnowageHighchartsSunburstChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'sunburst') {
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
        this.setSunburstXAxis()
        this.setSunburstYAxis()
    }

    setPlotOptions() {
        this.model.plotOptions.line = {
            marker: {
                symbol: "circle",
                lineWidth: 2
            }
        }
    }

    setSunburstXAxis() {
        if (this.model.xAxis && this.model.xAxis[0]) this.model.xAxis[0].visible = false
        else this.model.xAxis = [{ visible: false, ...highchartsDefaultValues.getDefaultBarXAxis() }]
    }

    setSunburstYAxis() {
        if (this.model.yAxis && this.model.yAxis[0]) this.model.yAxis[0].visible = false
        else this.model.yAxis = [{ visible: false, ...highchartsDefaultValues.getDefaultBarYAxis() }]
    }

    setData(data: any, widgetModel: IWidget) {
        this.model.series = []

        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'ATTRIBUTE')
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(data, widgetModel, 'MEASURE')
        const interactions = widgetModel.settings?.interactions
        const interactionsEnabled = interactions.selection.enabled || interactions.crossNavigation.enabled
        this.setSunburstData(data, widgetModel, attributeColumns, measureColumns, interactionsEnabled)
        return this.model.series
    }


    setSunburstData = (data: any, widgetModel: IWidget, attributeColumns: any[], measureColumns: any[], interactionsEnabled = false) => {
        if (!data || !measureColumns[0] || attributeColumns.length < 2) return
        const measureColumn = measureColumns[0]
        const centerTextSettings = widgetModel.settings.configuration.centerText
        const serieElement = this.createSerieElement(measureColumn, centerTextSettings, interactionsEnabled)
        const hierarchy = {} as any
        createHierarchyFromData(this.model, hierarchy, data, attributeColumns, measureColumn)


        const treemapArray = createTreeSeriesStructureFromHierarchy(hierarchy)
        treemapArray.forEach((el: any) => {
            if (el.value === 0) delete el.value
        })

        this.formatFirstSunburstElement(treemapArray, attributeColumns, centerTextSettings)
        serieElement.data = treemapArray

        this.model.series = [serieElement]

        let index = 0
        hierarchy.children?.forEach((el: any) => {
            this.model.series.push({
                "id": el.id,
                "type": "area",
                "name": el.name,
                "color": this.model.colors[index],
                showInLegend: true
            })
            index++
            if (index === this.model.colors.length) index = 0
        })

        this.model.colors = []
    }

    createSerieElement(measureColumn: any, centerTextSettings: any, interactionsEnabled: boolean) {
        const serieElement = {
            id: 0, name: measureColumn.column.columnName, data: [] as any[],
            layoutAlgorithm: 'squarified',
            type: 'sunburst',
            allowDrillToNode: !interactionsEnabled,
            showInLegend: false,
            animationLimit: 1000,
            levels: [
                {
                    level: 1,
                    levelIsConstant: false,
                    dataLabels: {
                        enabled: true,
                    }
                },
                {
                    level: 2,
                    colorByPoint: true
                },
                {
                    level: 3,
                    colorVariation: {
                        key: "brightness",
                        to: 0.5
                    }
                },
                {
                    level: 4,
                    colorVariation: {
                        key: "brightness",
                        to: 0.5
                    }
                }
            ],
        }

        return serieElement
    }

    formatFirstSunburstElement(treemapArray: any[], attributeColumns: any[], centerTextSettings: any) {
        if (!treemapArray[0]) return
        treemapArray[0].parent = null,
            treemapArray[0].id = 'root',
            treemapArray[0].name = centerTextSettings.text ?? attributeColumns[0].column.columnName,
            treemapArray[0].dataLabels = {
                enabled: true,
                style: {
                    fontFamily: centerTextSettings.style['font-family'] ?? 'Arial',
                    fontStyle: centerTextSettings.style['font-style'] ?? "normal",
                    fontSize: centerTextSettings.style['font-size'] ?? "12px",
                    color: centerTextSettings.style.color ?? "#000000",
                    width: "10000"
                }
            }
    }


    updateSeriesLabelSettings(widgetModel: IWidget) {
        updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable(this.model, widgetModel)
    }

}
