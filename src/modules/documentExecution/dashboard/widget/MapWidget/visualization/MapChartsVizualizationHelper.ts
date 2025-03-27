import { IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { centerTheMap, getColumnName, getCoordinates } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getCoordinatesFromWktPointFeature } from './MapVisualizationHelper'
import L from 'leaflet'
import vegaEmbed from 'vega-embed'

interface IChartValuesRecord {
    value: number | string
    measureName: string
}

export type ChartValuesRecord = Record<string, IChartValuesRecord>

export const addMapCharts = (map: any, data: any, model: IWidget, target: IMapWidgetLayer, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any) => {
    if (data && data[target.name] && !targetDatasetData) {
        addMapChartsUsingData(data, model, target, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
    } else {
        addMapChartsUsingLayer(layersData, layerGroup, layerVisualizationSettings, markerBounds, model, targetDatasetData)
    }

    centerTheMap(map, markerBounds)
}

const addMapChartsUsingData = (data: any, model: IWidget, target: IMapWidgetLayer, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
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

        createVegaChart(chartValuesRecord, layerVisualizationSettings, marker._icon)

        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
        markerBounds.push(marker.getLatLng())
    }
}

const getFieldMapFromMetadata = (data: any) => {
    return Object.fromEntries(data.metaData?.fields?.filter((field: any) => typeof field === 'object' && field.header && field.name).map((field: any) => [field.header, field.name]))
}

const addMapChartsUsingLayer = (layersData: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, targetDatasetData?: any) => {
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
            addChartsUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, widgetModel, markerBounds, null, fieldMetadata)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChartsUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, widgetModel, markerBounds, coord, fieldMetadata)
            })
        }
    })
}

const transformDataUsingForeignKeyReturningAllColumns = (rows: any[], pivotColumnIndex: string) => {
    return rows.reduce((acc: Record<string, any>, row: any) => {
        acc[row[pivotColumnIndex]] = { ...row }
        return acc
    }, {})
}

const addChartsUsingLayersPoint = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null, fieldMetadata: Record<string, string> | null) => {
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

    createVegaChart(chartValuesRecord, layerVisualizationSettings, marker._icon)

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, chartValuesRecord, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, chartValuesRecord, marker)

    markerBounds.push(marker.getLatLng())
}

function createVegaChart(chartValuesRecord: ChartValuesRecord, layerVisualizationSettings: IMapWidgetVisualizationType, element: HTMLElement) {
    const data = transformChartValuesDataToVegaData(chartValuesRecord) as { category: string; value: number | string }[]
    const chart = layerVisualizationSettings.pieConf?.type === 'pie' ? createVegaPieChart(data, layerVisualizationSettings) : createVegaBarChart(data, layerVisualizationSettings)

    vegaEmbed(element, chart as any, { renderer: 'svg', actions: false })
}

const createVegaPieChart = (data: { category: string; value: number | string }[], layerVisualizationSettings: IMapWidgetVisualizationType) => {
    return {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 30,
        height: 30,
        data: { values: data.map((item: { category: string; value: number | string }) => ({ category: item.category, value: item.value })) },
        mark: 'arc',
        encoding: {
            theta: { field: 'value', type: 'quantitative' },
            color: { field: 'category', type: 'nominal', scale: { range: layerVisualizationSettings.pieConf?.colors ?? ['red', 'blue', 'green'] }, legend: null }
        },
        config: getVegaChartConfig()
    }
}

const createVegaBarChart = (data: { category: string; value: number | string }[], layerVisualizationSettings: IMapWidgetVisualizationType) => {
    return {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 30,
        height: 30,
        data: { values: data.map((item: { category: string; value: number | string }) => ({ category: item.category, value: item.value })) },
        mark: 'bar',
        encoding: {
            x: { field: 'category', type: 'nominal', axis: null },
            y: { field: 'value', type: 'quantitative', axis: null },
            color: { field: 'category', type: 'nominal', scale: { range: layerVisualizationSettings.pieConf?.colors ?? ['red', 'blue', 'green'] }, legend: null }
        },
        config: getVegaChartConfig()
    }
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
