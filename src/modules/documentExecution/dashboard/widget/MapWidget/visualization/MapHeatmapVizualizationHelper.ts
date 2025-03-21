import { getColumnName, getCoordinates, VisualizationDataType } from '../LeafletHelper'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getCoordinatesFromWktPointFeature, getMinMaxByName, getNumericPropertyValues, incrementColumnName, transformDataUsingForeginKey, validateNumber } from './MapVisualizationHelper'
import L from 'leaflet'
import 'leaflet.heat'
import * as mapWidgetDefaultValues from '../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'

export const createHeatmapVisualization = (map: any, data: any, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerVisualizationSettings: IMapWidgetVisualizationType, layersData: any, visualizationDataType: VisualizationDataType, targetDatasetData: any) => {
    if (!layerVisualizationSettings.heatmapConf) return

    if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
        createHeatmapVisualizationLayers(map, layersData, target, layerVisualizationSettings)
    } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
        createHeatmapVisualizationLayers(map, layersData, target, layerVisualizationSettings, targetDatasetData, dataColumn)
    } else {
        createHeatmapVisualizationFromData(map, data, target, dataColumn, spatialAttribute, geoColumn, layerVisualizationSettings)
    }
}

const createHeatmapVisualizationLayers = (map: any, layersData: any, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, targetDatasetData?: any, dataColumn?: string) => {
    let max = 0
    const heatMapData = [] as number[][]
    let mappedData: Record<string, number> | null = null

    if (targetDatasetData && dataColumn) {
        if (!layerVisualizationSettings.targetDataset) return

        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, incrementColumnName(dataColumn))
        max = valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)

        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
    } else if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
        const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
        max = Math.max(...layerPropertyValues) ?? 0
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addHeatmapPointUsingLayers(feature, layerVisualizationSettings, mappedData, heatMapData, null)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addHeatmapPointUsingLayers(feature, layerVisualizationSettings, mappedData, heatMapData, coord)
            })
        }
    })

    createHeatLayer(map, heatMapData, layerVisualizationSettings, max, target.layerId)
}

const addHeatmapPointUsingLayers = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, heatMapData: number[][], coord: any[] | null) => {
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : feature.properties[layerVisualizationSettings.targetProperty]
    validateNumber(value)

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    if (coordinates?.length === 2) heatMapData.push([...coordinates.reverse(), value])
}

const createHeatmapVisualizationFromData = (map: any, data: any, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerVisualizationSettings: IMapWidgetVisualizationType) => {
    let max = 0
    const heatMapData = [] as number[][]

    data[target.name].rows.forEach((row: any) => {
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        const value = row[dataColumn]
        if (value > max) max = value
        if (coordinates?.length === 2) heatMapData.push([...coordinates, value])
    })

    createHeatLayer(map, heatMapData, layerVisualizationSettings, max, target.layerId)
}

const createHeatLayer = (map: any, heatMapData: number[][], layerVisualizationSettings: IMapWidgetVisualizationType, max: number, layerId: string) => {
    const defaultVisualizationHeatmapConfiguration = mapWidgetDefaultValues.getDefaultVisualizationHeatmapConfiguration()
    map.whenReady(() => {
        setTimeout(() => {
            map.invalidateSize()

            if (!heatMapData || heatMapData.length === 0) {
                throw Error('Heatmap data is empty, skipping heatmap creation.')
            }

            const heatLayer = L.heatLayer(heatMapData, {
                radius: layerVisualizationSettings.heatmapConf?.radius ?? defaultVisualizationHeatmapConfiguration.radius,
                blur: layerVisualizationSettings.heatmapConf?.blur ?? defaultVisualizationHeatmapConfiguration.blur,
                maxZoom: layerVisualizationSettings.heatmapConf?.maxZoom ?? defaultVisualizationHeatmapConfiguration.maxZoom,
                max: max,
                knProperties: { heatmap: true, layerId: layerId }
            }).addTo(map)

            heatLayer.knProperties = { heatmap: true, layerId: layerId }

            centerAndRedrawTheLayerOnMap(map, heatLayer, heatMapData)
        }, 500)
    })
}

export const centerAndRedrawTheLayerOnMap = (map: any, heatLayer: any, heatMapData: number[][]) => {
    setTimeout(() => {
        heatLayer.redraw()
    }, 300)

    map.once('resize', () => {
        heatLayer.redraw()
    })
    fitBoundsForMapCentering(map, heatMapData)
}

const fitBoundsForMapCentering = (map: any, heatMapData: number[][]) => {
    if (heatMapData.length > 0) {
        const bounds = L.latLngBounds(heatMapData.map((point) => [point[0], point[1]]))
        map.fitBounds(bounds)
    }
}
