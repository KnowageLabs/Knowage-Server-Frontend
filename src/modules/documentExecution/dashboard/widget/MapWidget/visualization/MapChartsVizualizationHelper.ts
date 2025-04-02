import { IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { centerTheMap, getColumnName, getCoordinates } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getCoordinatesFromWktPointFeature, getVizualizationConditionalStyles, isConditionMet, transformDataUsingForeignKeyReturningAllColumns } from './MapVisualizationHelper'
import L from 'leaflet'
import vegaEmbed from 'vega-embed'

interface IChartValuesRecord {
    value: number | string
    measureName: string
}

export type ChartValuesRecord = Record<string, IChartValuesRecord>

export const addMapCharts = (
    map: any,
    data: any,
    model: IWidget,
    target: IMapWidgetLayer,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    markerBounds: any[],
    layersData: any,
    targetDatasetData: any,
    variables: IVariable[],
    centerMap: boolean = true
) => {
    if (data && data[target.name] && !targetDatasetData) {
        addMapChartsUsingData(data, model, target, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables)
    } else {
        addMapChartsUsingLayer(layersData, layerGroup, layerVisualizationSettings, markerBounds, model, variables, targetDatasetData)
    }

    if (centerMap) centerTheMap(map, markerBounds)
}

const addMapChartsUsingData = (data: any, model: IWidget, target: IMapWidgetLayer, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[]) => {
    const fieldMetadata = getFieldMapFromMetadata(data[target.name])

    const id = 'id-' + performance.now().toString(36) + Math.random().toString(36)
    for (const row of data[target.name].rows) {
        const chartValuesRecord = {} as ChartValuesRecord

        layerVisualizationSettings.chartMeasures?.forEach((chartMeasure: string) => {
            const value = row[fieldMetadata[chartMeasure]]
            chartValuesRecord[chartMeasure] = { value: value, measureName: chartMeasure }
        })

        const customIcon = L.divIcon({
            html: `<div id='${id}'></div>`,
            iconSize: [30, 30],
            className: 'custom-icon'
        })
        const marker = L.marker(getCoordinates(spatialAttribute, row[geoColumn], null), { icon: customIcon }).addTo(layerGroup)

        createVegaChart(chartValuesRecord, layerVisualizationSettings, marker._icon, variables, model)

        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
        markerBounds.push(marker.getLatLng())
    }
}

const getFieldMapFromMetadata = (data: any) => {
    return Object.fromEntries(data.metaData?.fields?.filter((field: any) => typeof field === 'object' && field.header && field.name).map((field: any) => [field.header, field.name]))
}

const addMapChartsUsingLayer = (layersData: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, variables: IVariable[], targetDatasetData?: any) => {
    let mappedData: Record<string, number> | null = null
    let fieldMetadata: Record<string, string> | null = null
    if (targetDatasetData) {
        if (!layerVisualizationSettings.targetDataset) return

        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)

        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        fieldMetadata = getFieldMapFromMetadata(targetDatasetData)
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addChartsUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, widgetModel, markerBounds, null, fieldMetadata, variables)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChartsUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, widgetModel, markerBounds, coord, fieldMetadata, variables)
            })
        }
    })
}

const addChartsUsingLayersPoint = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null, fieldMetadata: Record<string, string> | null, variables: IVariable[]) => {
    const chartValuesRecord = {} as ChartValuesRecord

    if (mappedData && fieldMetadata) {
        const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
        const mappedRow = mappedData[valueKey]

        layerVisualizationSettings.chartMeasures?.forEach((chartMeasure: string) => {
            const columnKey = fieldMetadata[chartMeasure]
            const value = mappedRow[columnKey]
            chartValuesRecord[chartMeasure] = { value: value, measureName: chartMeasure }
        })
    } else {
        layerVisualizationSettings.chartMeasures?.forEach((chartMeasure: string) => {
            chartValuesRecord[chartMeasure] = { value: feature.properties[chartMeasure], measureName: chartMeasure }
        })
    }

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)

    const id = 'id-' + performance.now().toString(36) + Math.random().toString(36)

    const customIcon = L.divIcon({
        html: `<div id='${id}'></div>`,
        iconSize: [30, 30],
        className: 'custom-icon'
    })
    const marker = L.marker(coordinates.reverse(), { icon: customIcon }).addTo(layerGroup)

    createVegaChart(chartValuesRecord, layerVisualizationSettings, marker._icon, variables, widgetModel)

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, chartValuesRecord, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, chartValuesRecord, marker)

    markerBounds.push(marker.getLatLng())
}

const createVegaChart = (chartValuesRecord: ChartValuesRecord, layerVisualizationSettings: IMapWidgetVisualizationType, element: HTMLElement, variables: IVariable[], widgetModel: IWidget) => {
    const data = transformChartValuesDataToVegaData(chartValuesRecord) as { category: string; value: number | string }[]
    const chart = layerVisualizationSettings.pieConf?.type === 'pie' ? createVegaPieChart(data, layerVisualizationSettings, variables, widgetModel) : createVegaBarChart(data, layerVisualizationSettings, variables, widgetModel)

    vegaEmbed(element, chart as any, { renderer: 'svg', actions: false })
}

const createVegaPieChart = (data: { category: string; value: number | string }[], layerVisualizationSettings: IMapWidgetVisualizationType, variables: IVariable[], widgetModel: IWidget) => {
    const { chartData, chartColors, chartDomains } = formatChartColorsAndData(data, layerVisualizationSettings, variables, widgetModel)

    const vegaPieChart = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 30,
        height: 30,
        data: { values: chartData },
        mark: 'arc',
        encoding: {
            theta: { field: 'value', type: 'quantitative' },
            color: { field: 'category', type: 'nominal', scale: { domain: chartDomains, range: chartColors }, legend: null }
        },
        config: getVegaChartConfig()
    }

    return vegaPieChart
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

    return vegaBarChart
}

const formatChartColorsAndData = (data: { category: string; value: number | string }[], layerVisualizationSettings: IMapWidgetVisualizationType, variables: IVariable[], widgetModel: IWidget) => {
    const defaultColors = ['red', 'blue', 'green']
    const chartData = data.map((item: { category: string; value: number | string }) => ({ category: item.category, value: item.value })) as { category: string; value: number }[]
    const chartColors = (layerVisualizationSettings.pieConf?.colors ?? defaultColors).slice(0, chartData.length).concat(Array.from({ length: Math.max(0, chartData.length - defaultColors.length) }, (_, i) => defaultColors[i % defaultColors.length]))
    const chartDomains = chartData.map((item: { category: string; value: number | string }) => item.category)

    chartData?.forEach((data: { category: string; value: number }, index: number) => {
        const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, data.category, data.value, variables)
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

        result.push({ category: measureName, value })
    }

    return result
}
