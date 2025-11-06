import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getColumnName, getCoordinates, LEGEND_DATA_TYPE } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getChartConditionalStyle, getCoordinatesFromWktPointFeature, isConditionMet, transformDataUsingForeignKeyReturningAllColumns } from './MapVisualizationHelper'
import L from 'leaflet'
import vegaEmbed from 'vega-embed'

interface IChartValuesRecord {
    value: number | string
    measureName: string
}

export type ChartValuesRecord = Record<string, IChartValuesRecord>

export const addMapCharts = (data: any, model: IWidget, target: IMapWidgetLayer, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    if (data && data[target.id] && !targetDatasetData) {
        return addMapChartsUsingData(data, model, target, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables, activeSelections, dashboardId)
    } else {
        return addMapChartsUsingLayer(layersData, layerGroup, layerVisualizationSettings, markerBounds, model, variables, activeSelections, dashboardId, targetDatasetData)
    }
}

const addMapChartsUsingData = (data: any, model: IWidget, target: IMapWidgetLayer, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    const charts = [] as any[]
    const fieldMetadata = getFieldMapFromMetadata(data[target.id])

    const id = 'id-' + performance.now().toString(36) + Math.random().toString(36)
    for (const row of data[target.id].rows) {
        const chartValuesRecord = {} as ChartValuesRecord

        layerVisualizationSettings.chartMeasures?.forEach((chartMeasure: string) => {
            const value = row[fieldMetadata[chartMeasure]]
            chartValuesRecord[chartMeasure] = { value: value, measureName: chartMeasure }
        })

        const customIcon = L.divIcon({
            html: `<div id='${id}'></div>`,
            iconSize: [30, 30],
            iconAnchor: [30, 30],
            className: 'custom-icon'
        })
        const marker = L.marker(getCoordinates(spatialAttribute, row[geoColumn]), { icon: customIcon }).addTo(layerGroup)

        const chart = createVegaChart(chartValuesRecord, layerVisualizationSettings, marker._icon, variables, model)
        charts.push(chart)

        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
        markerBounds.push(marker.getLatLng())
    }

    return { charts: charts, type: LEGEND_DATA_TYPE.CHARTS }
}

const getFieldMapFromMetadata = (data: any) => {
    return Object.fromEntries(data.metaData?.fields?.filter((field: any) => typeof field === 'object' && field.header && field.name).map((field: any) => [field.header, field.name]))
}

const addMapChartsUsingLayer = (layersData: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, variables: IVariable[], activeSelections: ISelection[], dashboardId: string, targetDatasetData?: any) => {
    let mappedData: Record<string, number> | null = null
    let fieldMetadata: Record<string, string> | null = null
    const charts = [] as any[]

    if (targetDatasetData) {
        if (!layerVisualizationSettings.targetDataset) return

        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetDatasetForeignKeyColumn, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetDatasetForeignKeyColumn} is not present in the dataset`)

        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        fieldMetadata = getFieldMapFromMetadata(targetDatasetData)
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addChartsUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, widgetModel, markerBounds, null, fieldMetadata, variables, charts, activeSelections, dashboardId)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChartsUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, widgetModel, markerBounds, coord, fieldMetadata, variables, charts, activeSelections, dashboardId)
            })
        }
    })

    return { charts: charts, type: LEGEND_DATA_TYPE.CHARTS }
}

const addChartsUsingLayersPoint = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null, fieldMetadata: Record<string, string> | null, variables: IVariable[], charts: any[], activeSelections: ISelection[], dashboardId: string) => {
    const chartValuesRecord = {} as ChartValuesRecord

    let foreignKeyValue = null as string | null
    if (mappedData && fieldMetadata) {
        const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
        const mappedRow = mappedData[valueKey]
        if (!mappedRow) return
        foreignKeyValue = layerVisualizationSettings.targetDatasetForeignKeyColumn ? mappedRow[fieldMetadata[layerVisualizationSettings.targetDatasetForeignKeyColumn]] : ''

        layerVisualizationSettings.targetDatasetMeasures?.forEach((targetDatasetMeasure: string) => {
            const columnKey = fieldMetadata[targetDatasetMeasure]
            const value = mappedRow[columnKey]
            chartValuesRecord[targetDatasetMeasure] = { value: value, measureName: targetDatasetMeasure }
        })
    } else {
        layerVisualizationSettings.chartMeasures?.forEach((chartMeasure: string) => {
            chartValuesRecord[chartMeasure] = { value: feature.properties[chartMeasure], measureName: chartMeasure }
        })
    }

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    if (!coordinates) return

    const id = 'id-' + performance.now().toString(36) + Math.random().toString(36)

    const customIcon = L.divIcon({
        html: `<div id='${id}'></div>`,
        iconSize: [30, 30],
        iconAnchor: [30, 30],
        className: 'custom-icon'
    })
    const marker = L.marker(coordinates.reverse(), { icon: customIcon }).addTo(layerGroup)

    const chart = createVegaChart(chartValuesRecord, layerVisualizationSettings, marker._icon, variables, widgetModel)
    charts.push(chart)

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, chartValuesRecord, marker, activeSelections, dashboardId, variables, foreignKeyValue)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, chartValuesRecord, marker, activeSelections, dashboardId, variables, foreignKeyValue)

    markerBounds.push(marker.getLatLng())
}

const createVegaChart = (chartValuesRecord: ChartValuesRecord, layerVisualizationSettings: IMapWidgetVisualizationType, element: HTMLElement, variables: IVariable[], widgetModel: IWidget) => {
    const data = transformChartValuesDataToVegaData(chartValuesRecord) as { category: string; value: number | string }[]
    const { chart, chartDomains, chartColors } = layerVisualizationSettings.pieConf?.type === 'pie' ? createVegaPieChart(data, layerVisualizationSettings, variables, widgetModel) : createVegaBarChart(data, layerVisualizationSettings, variables, widgetModel)

    vegaEmbed(element, chart as any, { renderer: 'svg', actions: false })

    return { chartDomains, chartColors }
}

const createVegaPieChart = (data: { category: string; value: number | string }[], layerVisualizationSettings: IMapWidgetVisualizationType, variables: IVariable[], widgetModel: IWidget) => {
    const { chartData, chartColors, chartDomains } = formatChartColorsAndData(data, layerVisualizationSettings, variables, widgetModel)
    const { filteredChartData, filteredChartColors, filteredChartDomains } = getFilteredChartColorsAndData(chartData, layerVisualizationSettings, chartColors, chartDomains)

    const vegaPieChart = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 30,
        height: 30,
        data: { values: filteredChartData ?? chartData },
        mark: 'arc',
        encoding: {
            theta: { field: 'value', type: 'quantitative' },
            color: { field: 'category', type: 'nominal', scale: { domain: filteredChartDomains ?? chartDomains, range: filteredChartColors ?? chartColors }, legend: null }
        },
        config: getVegaChartConfig()
    }

    return { chart: vegaPieChart, chartColors, chartDomains }
}

const createVegaBarChart = (data: { category: string; value: number | string }[], layerVisualizationSettings: IMapWidgetVisualizationType, variables: IVariable[], widgetModel: IWidget) => {
    const { chartData, chartColors, chartDomains } = formatChartColorsAndData(data, layerVisualizationSettings, variables, widgetModel)
    const { filteredChartData, filteredChartColors, filteredChartDomains } = getFilteredChartColorsAndData(chartData, layerVisualizationSettings, chartColors, chartDomains)

    const vegaBarChart = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 30,
        height: 30,
        data: { values: filteredChartData ?? chartData },
        mark: 'bar',
        encoding: {
            x: { field: 'category', type: 'nominal', axis: null },
            y: { field: 'value', type: 'quantitative', axis: null },
            color: { field: 'category', type: 'nominal', scale: { domain: filteredChartDomains ?? chartDomains, range: filteredChartColors ?? chartColors }, legend: null }
        },
        config: getVegaChartConfig()
    }

    return { chart: vegaBarChart, chartColors, chartDomains }
}

const formatChartColorsAndData = (data: { category: string; value: number | string }[], layerVisualizationSettings: IMapWidgetVisualizationType, variables: IVariable[], widgetModel: IWidget) => {
    const defaultColors = ['red', 'blue', 'green']
    const chartData = data.map((item: { category: string; value: number | string }) => ({ category: item.category, value: item.value })) as { category: string; value: number }[]
    const chartColors = (layerVisualizationSettings.pieConf?.colors ?? defaultColors).slice(0, chartData.length).concat(Array.from({ length: Math.max(0, chartData.length - defaultColors.length) }, (_, i) => defaultColors[i % defaultColors.length]))
    const chartDomains = chartData.map((item: { category: string; value: number | string }) => item.category)

    chartData?.forEach((data: { category: string; value: number }, index: number) => {
        const conditionalStyle = getChartConditionalStyle(widgetModel, layerVisualizationSettings.target, data.category, data.value, variables)
        if (!conditionalStyle) return
        if (chartColors[index]) chartColors[index] = conditionalStyle['background-color']
    })

    return { chartData, chartColors, chartDomains }
}

const getFilteredChartColorsAndData = (chartData: { category: string; value: number }[], layerVisualizationSettings: IMapWidgetVisualizationType, chartColor: string[], chartDomains: string[]) => {
    let filteredChartData = null as { category: string; value: number | string }[] | null
    let filteredChartColors = null as string[] | null
    let filteredChartDomains = null as string[] | null

    const filter = layerVisualizationSettings.filter
    if (!filter || !filter.enabled) return { filteredChartData, filteredChartColors, filteredChartDomains }

    const filteredData = chartData
        .map((item, index) => ({ ...item, color: chartColor[index], domain: chartDomains[index] }))
        .filter((item: { category: string; value: number; color: string; domain: string }) => {
            if (item.category !== filter.column) return true
            return isConditionMet(filter, '' + item.value)
        })

    filteredChartData = filteredData.map(({ category, value }) => ({ category, value }))
    filteredChartColors = filteredData.map(({ color }) => color)
    filteredChartDomains = filteredData.map(({ domain }) => domain)

    return { filteredChartData, filteredChartColors, filteredChartDomains }
}

const getVegaChartConfig = () => {
    return {
        background: null,
        view: {
            stroke: null,
            continuousWidth: false,
            padding: 0
        },
        mark: {
            tooltip: false
        }
    }
}

const transformChartValuesDataToVegaData = (chartValuesRecord: ChartValuesRecord) => {
    const result = [] as { category: string; value: number | string }[]

    for (const key in chartValuesRecord) {
        const { value, measureName } = chartValuesRecord[key]
        if (!value) return

        result.push({ category: measureName, value })
    }

    return result
}
