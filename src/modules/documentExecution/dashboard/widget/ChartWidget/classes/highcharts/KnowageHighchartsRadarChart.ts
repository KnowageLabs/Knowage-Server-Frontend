import { KnowageHighcharts } from './KnowageHighcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartSerie, IHighchartsSeriesLabelsSetting } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { updateRadarChartModel } from './updater/KnowageHighchartsRadarChartUpdater'
import * as highchartsDefaultValues from '../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import deepcopy from 'deepcopy'
import moment from 'moment'
import { createPolarSerie } from './updater/KnowageHighchartsCommonUpdater'
import { getAllColumnsOfSpecificTypeFromDataResponse, setGroupedByCategoriesData, setRegularData } from './helpers/setData/HighchartsSetDataHelpers'

export class KnowageHighchartsRadarChart extends KnowageHighcharts {
    constructor(model: any) {
        super()
        this.setSpecificOptionsDefaultValues()
        if (model && model.CHART) this.updateModel(deepcopy(model))
        else if (model && model.plotOptions) {
            this.model = deepcopy(model)
            if (model.chart.type !== 'radar') {
                this.formatSeriesFromOtherChartTypeSeries()
                this.setSpecificOptionsDefaultValues()
            }
        }
        this.model.chart.type = 'radar'
        this.model.chart.polar = true
    }

    updateModel(oldModel: any) {
        updateRadarChartModel(oldModel, this.model)
    }

    setSpecificOptionsDefaultValues() {
        if (!this.model.xAxis) this.setRadarXAxis()
        if (!this.model.yAxis) this.setRadarYAxis()
    }

    setData(data: any, widgetModel: IWidget) {
        const mockedData = { "metaData": { "totalProperty": "results", "root": "rows", "id": "id", "fields": ["recNo", { "name": "column_1", "header": "QUARTER", "dataIndex": "column_1", "type": "string", "multiValue": false }, { "name": "column_2", "header": "UNIT_SALES_SUM", "dataIndex": "column_2", "type": "float", "precision": 54, "scale": 4, "multiValue": false }, { "name": "column_3", "header": "UNITS_ORDERED_SUM", "dataIndex": "column_3", "type": "float", "precision": 54, "scale": 0, "multiValue": false }], "cacheDate": "2023-06-01 16:57:10.449" }, "results": 4, "rows": [{ "id": 1, "column_1": "Q1", "column_2": 104893.2241, "column_3": 1744587 }, { "id": 2, "column_1": "Q2", "column_2": 102115.586, "column_3": 1665964 }, { "id": 3, "column_1": "Q3", "column_2": 121873.7686, "column_3": 2.08226E+6 }, { "id": 4, "column_1": "Q4", "column_2": 96443.6608, "column_3": 1646594 }], "stats": { "1": { "max": "Q4", "min": "Q1", "distinct": ["Q1", "Q2", "Q3", "Q4"], "cardinality": 4 }, "2": { "max": 121873.7686, "min": 96443.6608, "distinct": [96443.6608, 102115.586, 104893.2241, 121873.7686], "cardinality": 4 }, "3": { "max": 2.08226E+6, "min": 1646594, "distinct": [1646594, 1665964, 1744587, 2.08226E+6], "cardinality": 4 } } }
        this.model.series = []
        const attributeColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'ATTRIBUTE')
        console.log('---------- ATTRIBUTE COLUMNS: ', attributeColumns)
        const measureColumns = getAllColumnsOfSpecificTypeFromDataResponse(mockedData, widgetModel, 'MEASURE')
        console.log('---------- MEASURE COLUMNS: ', measureColumns)
        const drilldownEnabled = widgetModel.settings.interactions.drilldown ? widgetModel.settings.interactions.drilldown.enabled : false
        console.log('------- drilldownEnabled: ', drilldownEnabled)
        const dateFormat = widgetModel.settings?.configuration?.datetypeSettings && widgetModel.settings.configuration.datetypeSettings.enabled ? widgetModel.settings?.configuration?.datetypeSettings?.format : ''
        // console.log('------- dateFormat: ', dateFormat)

        if (widgetModel.settings.configuration?.grouping?.secondDimension.enabled) {
            const serieName = widgetModel.settings.configuration.grouping.secondDimension.serie
            setGroupedByCategoriesData(this.model, mockedData, attributeColumns, measureColumns, serieName)
        } else {
            setRegularData(this.model, mockedData, attributeColumns, measureColumns, drilldownEnabled, dateFormat)
        }

        return this.model.series
    }

    setSplitedData(splitingColumn: string, data: any) {
        const groupedSerie = data.metaData.fields.find((field: any) => field.header?.startsWith(splitingColumn))
        if (!groupedSerie) return
        const distinctFirstAttributeValues = data.stats[1].distinct
        const distinctValues = data.stats[2].distinct
        const distinctValuesMap = {}
        distinctValues?.forEach((value: string) => {
            distinctValuesMap[value] = { data: [] }
            distinctFirstAttributeValues.forEach((firstAttributeValue: string) => distinctValuesMap[value].data.push({ name: firstAttributeValue, datetype: 'string' }))
        })
        data.rows.forEach((row: any) => {
            distinctValuesMap[row['column_2']]?.data?.push({
                "y": row[groupedSerie.dataIndex],
                "name": row['column_1'],
                "datetype": "string"
            })
        })
        const formattedSeries = [] as any[]
        Object.keys(distinctValuesMap).forEach((key: string) => {
            const serie = {
                name: key,
                data: distinctValuesMap[key].data,
                label: { enabled: false }
            }
            formattedSeries.push(serie)
        })
        this.model.seriesForRender = formattedSeries
    }

    setNormalData(data: any, widgetModel: IWidget, dateFormat: string, drilldownEnabled: boolean) {
        const formattedSeries = [] as any[]
        let areRangeLowColumn = null as IWidgetColumn | null
        let areRangeHighColumn = null as IWidgetColumn | null
        widgetModel.columns.forEach((column: IWidgetColumn) => {
            if (column.fieldType === 'MEASURE') {
                if (!['arearangelow', 'arearangehigh'].includes('' + column.serieType)) {
                    const serie = this.createFormattedSerieFromColumn(column, data, dateFormat, drilldownEnabled)
                    if (serie) formattedSeries.push(serie)
                } else if (column.serieType === 'arearangelow') {
                    areRangeLowColumn = column
                } else if (column.serieType === 'arearangehigh') {
                    areRangeHighColumn = column
                }
            }
        })

        if (areRangeLowColumn && areRangeHighColumn) {
            const serie = this.createFormattedSerieFromAreaRangeColumns(areRangeLowColumn, areRangeHighColumn, data, dateFormat, drilldownEnabled)
            if (serie) formattedSeries.push(serie)
        }
        this.model.seriesForRender = formattedSeries
    }

    createFormattedSerieFromColumn(column: IWidgetColumn, data: any, dateFormat: string, drilldownEnabled: boolean) {
        const serie = createPolarSerie(column.columnName, column.serieType ?? 'line')
        if (!serie || !data.metaData.fields) return null
        serie.type = column.serieType === 'bar' ? 'column' : column.serieType
        serie.pointPlacement = "on"
        const index = data.metaData.fields.findIndex((field: any) => field.header?.startsWith(serie.name))
        const dataIndex = index !== -1 ? data.metaData.fields[index].dataIndex : ''
        const attribute = data.metaData.fields[1]
        serie.data = []
        data?.rows?.forEach((row: any) => {
            serie.data.push({
                name: dateFormat && ['date', 'timestamp'].includes(attribute.type) ? this.getFormattedDateCategoryValue(row[attribute.dataIndex], dateFormat, attribute.type) : row[attribute.dataIndex],
                y: row[dataIndex],
                drilldown: drilldownEnabled
            })
        })
        return serie
    }


    createFormattedSerieFromAreaRangeColumns(areRangeLowColumn: IWidgetColumn, areRangeHighColumn: IWidgetColumn, data: any, dateFormat: string, drilldownEnabled: boolean) {
        const lowSerie = deepcopy(this.model.series.find((serie: any) => serie.name === areRangeLowColumn.columnName))
        const highSerie = deepcopy(this.model.series.find((serie: any) => serie.name === areRangeHighColumn.columnName))
        if (!lowSerie || !highSerie) return null
        lowSerie.type = 'arearange'
        highSerie.type = 'arearange'

        const lowSerieIndex = data.metaData.fields.findIndex((field: any) => field.header?.startsWith(lowSerie.name))
        const lowSerieIndexDataIndex = lowSerieIndex !== -1 ? data.metaData.fields[lowSerieIndex].dataIndex : ''
        const highSerieIndex = data.metaData.fields.findIndex((field: any) => field.header?.startsWith(highSerie.name))
        const highSerieIndexDataIndex = lowSerieIndex !== -1 ? data.metaData.fields[highSerieIndex].dataIndex : ''
        const attribute = data.metaData.fields[1]
        lowSerie.data = []
        data?.rows?.forEach((row: any) => {
            lowSerie.data.push({
                name: dateFormat && ['date', 'timestamp'].includes(attribute.type) ? this.getFormattedDateCategoryValue(row[attribute.dataIndex], dateFormat, attribute.type) : row[attribute.dataIndex],
                low: row[lowSerieIndexDataIndex],
                high: row[highSerieIndexDataIndex],
                drilldown: drilldownEnabled
            })
        })
        lowSerie.name += ' / ' + highSerie.name
        return lowSerie
    }

    getFormattedDateCategoryValue(dateString: string, dateFormat: string, type: 'date' | 'timestamp') {
        if (!dateFormat) return dateString
        const date = moment(dateString, type === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm:ss.SSS')
        return date.isValid() ? date.format(dateFormat) : dateString
    }

    setRadarXAxis() {
        this.model.xAxis = [highchartsDefaultValues.getDefaultRadarXAxis()]
    }

    setRadarYAxis() {
        this.model.yAxis = [highchartsDefaultValues.getDefaultRadarYAxis()]
    }

    updateSeriesLabelSettings(widgetModel: IWidget) {
        if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesSettings) return
        this.setAllSeriesSettings(widgetModel)
        this.setSpecificSeriesSettings(widgetModel)
    }


    setAllSeriesSettings(widgetModel: IWidget) {
        const allSeriesSettings = widgetModel.settings.series.seriesSettings[0]
        if (allSeriesSettings.label.enabled) {
            this.model.seriesForRender?.forEach((serie: any) =>
                this.updateSeriesDataWithSerieSettings(serie, allSeriesSettings))
        } else {
            this.resetSeriesSettings()
        }
    }

    resetSeriesSettings() {
        this.model.seriesForRender?.forEach((serie: any) => serie.dataLabels = { ...highchartsDefaultValues.getDefaultSerieLabelSettings(), position: '' })
    }

    setSpecificSeriesSettings(widgetModel: IWidget) {
        for (let i = 1; i < widgetModel.settings.series.seriesSettings.length; i++) {
            const seriesSettings = widgetModel.settings.series.seriesSettings[i] as IHighchartsSeriesLabelsSetting
            if (seriesSettings.label.enabled) seriesSettings.names.forEach((serieName: string) => this.updateSpecificSeriesLabelSettings(serieName, seriesSettings))
        }
    }

    updateSpecificSeriesLabelSettings(serieName: string, seriesSettings: IHighchartsSeriesLabelsSetting) {
        if (!this.model.seriesForRender) return
        const index = this.model.seriesForRender.findIndex((serie: any) => serie.name === serieName)
        if (index !== undefined && index !== -1) this.updateSeriesDataWithSerieSettings(this.model.seriesForRender[index], seriesSettings)
    }

    updateSeriesDataWithSerieSettings(serie: any, seriesSettings: IHighchartsSeriesLabelsSetting) {
        serie.data.forEach((data: any) => {
            data.dataLabels = {
                backgroundColor: seriesSettings.label.backgroundColor ?? '',
                enabled: true,
                position: '',
                style: {
                    fontFamily: seriesSettings.label.style.fontFamily,
                    fontSize: seriesSettings.label.style.fontSize,
                    fontWeight: seriesSettings.label.style.fontWeight,
                    color: seriesSettings.label.style.color ?? ''
                },
                formatter: function () {
                    return KnowageHighchartsRadarChart.prototype.handleFormatter(this, seriesSettings.label)
                }
            }
        })
    }


    formatSeriesFromOtherChartTypeSeries() {
        this.model.series = this.model.series.map((serie: any) => { return this.getFormattedSerieFromOtherChartTypeSerie(serie) })
    }

    getFormattedSerieFromOtherChartTypeSerie(otherChartSerie: any) {
        const formattedSerie = { name: otherChartSerie.name, data: [], colorByPoint: true, pointPlacement: "on" } as IHighchartsChartSerie
        if (otherChartSerie.accessibility) formattedSerie.accessibility
        return formattedSerie
    }
}