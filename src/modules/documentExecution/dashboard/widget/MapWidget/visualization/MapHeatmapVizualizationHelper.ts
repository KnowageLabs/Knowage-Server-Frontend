import { getColumnName, getCoordinates, LEGEND_DATA_TYPE, VisualizationDataType } from '../LeafletHelper'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getCoordinatesFromWktPointFeature, getMinMaxByName, getNumericPropertyValues, getTargetDataColumn, getTargetProperty, incrementColumnName, isConditionMet, transformDataUsingForeignKeyReturningAllColumns, validateNumber } from './MapVisualizationHelper'
import * as mapWidgetDefaultValues from '../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'
import L from 'leaflet'
import 'leaflet.heat'

export const createHeatmapVisualization = (map: any, data: any, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerVisualizationSettings: IMapWidgetVisualizationType, layersData: any, visualizationDataType: VisualizationDataType, targetDatasetData: any, centerMap: boolean = true) => {
    if (!layerVisualizationSettings.heatmapConf) return

    if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
        return createHeatmapVisualizationLayers(map, layersData, target, layerVisualizationSettings, centerMap)
    } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
        return createHeatmapVisualizationLayers(map, layersData, target, layerVisualizationSettings, centerMap, targetDatasetData, dataColumn)
    } else {
        return createHeatmapVisualizationFromData(map, data, target, dataColumn, spatialAttribute, geoColumn, layerVisualizationSettings, centerMap)
    }
}

const createHeatmapVisualizationLayers = (map: any, layersData: any, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, centerMap: boolean, targetDatasetData?: any, dataColumn?: string) => {
    let max = 0
    const heatMapData = [] as number[][]
    let mappedData: Record<string, number> | null = null
    let dataColumnIndex = dataColumn
    let layerTargetProperty = null

    if (targetDatasetData && dataColumn) {
        if (!layerVisualizationSettings.targetDataset) return

        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, incrementColumnName(dataColumn))
        max = valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetDatasetForeignKeyColumn, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetDatasetForeignKeyColumn} is not present in the dataset`)

        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        dataColumnIndex = getTargetDataColumn(targetDatasetData, layerVisualizationSettings, dataColumn)
    } else if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
        layerTargetProperty = getTargetProperty(layerVisualizationSettings)
        if (!layerTargetProperty) layerTargetProperty = layerVisualizationSettings.targetProperty
        const layerPropertyValues = layerTargetProperty ? getNumericPropertyValues(layersData, layerTargetProperty) : []
        max = Math.max(...layerPropertyValues) ?? 0
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addHeatmapPointUsingLayers(feature, layerVisualizationSettings, mappedData, heatMapData, null, layerTargetProperty, dataColumnIndex)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addHeatmapPointUsingLayers(feature, layerVisualizationSettings, mappedData, heatMapData, coord, layerTargetProperty, dataColumnIndex)
            })
        }
    })

    createHeatLayer(map, heatMapData, layerVisualizationSettings, max, target.layerId, centerMap)

    return { heatMapData, type: LEGEND_DATA_TYPE.HEATMAP }
}

const addHeatmapPointUsingLayers = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, heatMapData: number[][], coord: any[] | null, layerTargetProperty: string | null, dataColumnIndex: string | null | undefined) => {
    const valueKey = feature.properties[layerTargetProperty ?? layerVisualizationSettings.targetProperty]
    let value = null as string | number | null
    if (mappedData && dataColumnIndex) {
        value = mappedData[valueKey] ? mappedData[valueKey][dataColumnIndex] : null
    } else {
        value = valueKey
    }

    if (!value) return
    validateNumber(value)

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    if (!coordinates) return
    if (coordinates?.length === 2) heatMapData.push([...coordinates.reverse(), value])
}

const createHeatmapVisualizationFromData = (map: any, data: any, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerVisualizationSettings: IMapWidgetVisualizationType, centerMap: boolean) => {
    let max = 0
    const heatMapData = [] as number[][]

    data[target.name].rows.forEach((row: any) => {
        const dataColumnIndex = getTargetDataColumn(data[target.name], layerVisualizationSettings, dataColumn)
        const value = row[dataColumnIndex ?? dataColumn]

        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        if (!coordinates) return

        if (value > max) max = value
        if (coordinates?.length === 2) heatMapData.push([...coordinates, value])
    })

    createHeatLayer(map, heatMapData, layerVisualizationSettings, max, target.layerId, centerMap)

    return { heatMapData, type: LEGEND_DATA_TYPE.HEATMAP }
}

const createHeatLayer = (map: any, heatMapData: number[][], layerVisualizationSettings: IMapWidgetVisualizationType, max: number, layerId: string, centerMap: boolean) => {
    const defaultVisualizationHeatmapConfiguration = mapWidgetDefaultValues.getDefaultVisualizationHeatmapConfiguration()
    map.whenReady(() => {
        setTimeout(() => {
            map.invalidateSize()

            let tempHeatMapData = heatMapData

            const filter = layerVisualizationSettings.filter
            if (filter?.enabled && filter.operator && filter.value != null) {
                tempHeatMapData = filterHeatmapData(tempHeatMapData, filter.operator, filter.value)
            }

            const heatLayer = L.heatLayer(tempHeatMapData, {
                radius: layerVisualizationSettings.heatmapConf?.radius ?? defaultVisualizationHeatmapConfiguration.radius,
                blur: layerVisualizationSettings.heatmapConf?.blur ?? defaultVisualizationHeatmapConfiguration.blur,
                maxZoom: layerVisualizationSettings.heatmapConf?.maxZoom ?? defaultVisualizationHeatmapConfiguration.maxZoom,
                max: max,
                knProperties: { heatmap: true, layerId: layerId }
            }).addTo(map)

            heatLayer.knProperties = { heatmap: true, layerId: layerId }

            if (centerMap) centerAndRedrawTheLayerOnMap(map, heatLayer, tempHeatMapData)
        }, 50)
    })
}

export const centerAndRedrawTheLayerOnMap = (map: any, heatLayer: any, heatMapData: number[][]) => {
    setTimeout(() => {
        if (heatLayer && map.hasLayer(heatLayer)) heatLayer.redraw()
    }, 50)

    map.once('resize', () => {
        if (heatLayer && map.hasLayer(heatLayer)) heatLayer.redraw()
    })
    fitBoundsForMapCentering(map, heatMapData)
}

const fitBoundsForMapCentering = (map: any, heatMapData: number[][]) => {
    if (heatMapData.length > 0) {
        const bounds = L.latLngBounds(heatMapData.map((point) => [point[0], point[1]]))
        map.fitBounds(bounds)
    }
}

const filterHeatmapData = (data: number[][], operator: string, valueToCompare: string): number[][] => {
    return data.filter((row) => row.length === 3 && isConditionMet({ operator, value: valueToCompare }, '' + row[2]))
}
