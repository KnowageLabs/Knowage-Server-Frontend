import { IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationThreshold, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getColumnName, getCoordinates, VisualizationDataType } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import L from 'leaflet'
import { formatRanges, getCoordinatesFromWktPointFeature, getMinMaxByName, getNumericPropertyValues, getQuantiles, getQuantilesFromLayersData, incrementColumnName, sortRanges, transformDataUsingForeginKey, validateNumber } from './MapVisualizationHelper'
import * as mapWidgetDefaultValues from '../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'

export const createChoropleth = (
    map: L.Map,
    data: any,
    model: IWidget,
    target: IMapWidgetLayer,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    layersData: any,
    visualizationDataType: VisualizationDataType,
    targetDatasetData: any
) => {
    if (!layerVisualizationSettings.analysisConf) return

    const bounds = L.latLngBounds()

    switch (layerVisualizationSettings.analysisConf.method) {
        case 'CLASSIFY_BY_RANGES':
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                createChoroplethClassifiedByRangesUsingLayers(layerGroup, layersData, layerVisualizationSettings, model, bounds)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                createChoroplethClassifiedByRangesUsingLayers(layerGroup, layersData, layerVisualizationSettings, model, bounds, targetDatasetData, dataColumn)
            } else {
                createChoroplethClassifiedByRangesFromData(layerGroup, data, model, target, dataColumn, spatialAttribute, geoColumn, layerVisualizationSettings, bounds)
            }
            break
        case 'CLASSIFY_BY_QUANTILS':
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                createChoroplethClassifiedByQuantilsUsingLayers(null, layersData, null, spatialAttribute, layerGroup, layerVisualizationSettings, model, bounds)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                createChoroplethClassifiedByQuantilsUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, model, bounds)
            } else {
                createChoroplethClassifiedByQuantilsFromData(layerGroup, data, model, target, dataColumn, spatialAttribute, geoColumn, layerVisualizationSettings, bounds)
            }
            break
        default:
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                createChoroplethClassifiedByEqualIntervalsUsingLayers(layerGroup, layersData, layerVisualizationSettings, model, bounds)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                createChoroplethClassifiedByEqualIntervalsUsingLayers(layerGroup, layersData, layerVisualizationSettings, model, bounds, targetDatasetData, dataColumn)
            } else {
                createChoroplethClassifiedByEqualIntervalsFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, bounds)
            }
    }

    setTimeout(() => {
        if (bounds.isValid()) {
            map.invalidateSize()
            map.fitBounds(bounds)
        }
    }, 100)
}

const createChoroplethClassifiedByEqualIntervalsUsingLayers = (layerGroup: any, layersData: any, layerVisualizationSettings: IMapWidgetVisualizationType, widgetModel: IWidget, bounds: any, targetDatasetData?: any, dataColumn?: string) => {
    let minValue = Number.MIN_SAFE_INTEGER
    let maxValue = Number.MAX_SAFE_INTEGER
    let mappedData: Record<string, number> | null = null

    if (targetDatasetData && dataColumn) {
        if (!layerVisualizationSettings.targetDataset) return

        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, incrementColumnName(dataColumn))
        minValue = valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER
        maxValue = valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER

        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)

        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
    } else {
        if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
            const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
            minValue = Math.min(...layerPropertyValues) ?? 0
            maxValue = Math.max(...layerPropertyValues) ?? 0
        }
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Polygon') {
            addChoroplethPolygonUsingLayersPointClassifedByEqualIntervals(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, minValue, maxValue, null, bounds)
        } else if (feature.geometry?.type === 'MultiPolygon') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChoroplethPolygonUsingLayersPointClassifedByEqualIntervals(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, minValue, maxValue, coord, bounds)
            })
        }
    })
}

const addChoroplethPolygonUsingLayersPointClassifedByEqualIntervals = (layerGroup: any, feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, widgetModel: IWidget, minValue: number, maxValue: number, coord: any[] | null, bounds: any) => {
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : feature.properties[layerVisualizationSettings.targetProperty]
    const numberOfClasses = layerVisualizationSettings.analysisConf?.classes ?? defaultChoroplethValues.classes

    validateNumber(value)

    const colorGradients = generateColorGradient(layerVisualizationSettings.analysisConf?.style.color ?? defaultChoroplethValues.style.color, layerVisualizationSettings.analysisConf?.style.toColor ?? defaultChoroplethValues.style.toColor, numberOfClasses)
    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const polygonCoords = (coordinates as any).map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x]))
    const color = colorGradients[getRangeIndexFromEqualIntervals(value, minValue, maxValue, numberOfClasses)] ?? defaultChoroplethValues.style.color

    const polygon = L.polygon(polygonCoords, { color: color, fillColor: color, weight: layerVisualizationSettings.analysisConf?.style.borderWidth ?? defaultChoroplethValues.style.borderWidth }).addTo(layerGroup)
    bounds.extend(polygon.getBounds())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon)
}

const createChoroplethClassifiedByEqualIntervalsFromData = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, bounds: any) => {
    if (!layerVisualizationSettings.analysisConf) return
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const valueColumnMinMaxValues = getMinMaxByName(data[target.name].stats, incrementColumnName(dataColumn))
    const numberOfClasses = layerVisualizationSettings.analysisConf?.classes ?? defaultChoroplethValues.classes

    const colorGradients = generateColorGradient(layerVisualizationSettings.analysisConf?.style.color ?? defaultChoroplethValues.style.color, layerVisualizationSettings.analysisConf?.style.toColor ?? defaultChoroplethValues.style.toColor, numberOfClasses)

    data[target.name].rows.forEach((row: any) => {
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        const polygonCoords = (coordinates as any).map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x]))
        const color = colorGradients[getRangeIndexFromEqualIntervals(row[dataColumn], valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER, valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER, numberOfClasses)] ?? defaultChoroplethValues.style.color
        const polygon = L.polygon(polygonCoords, { color: color, fillColor: color, weight: layerVisualizationSettings.analysisConf?.style.borderWidth ?? defaultChoroplethValues.style.borderWidth }).addTo(layerGroup)
        bounds.extend(polygon.getBounds())

        addDialogToMarker(data, model, target, layerVisualizationSettings, row, polygon)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, polygon)
    })
}

const getRangeIndexFromEqualIntervals = (value: number, min: number, max: number, classes: number | undefined): number => {
    if (!classes) return 0

    let range = (max - min) / classes

    for (let i = 0; i < classes; i++) {
        if (value < min + (i + 1) * range) {
            return i
        }
    }

    return classes - 1
}

const createChoroplethClassifiedByQuantilsUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, widgetModel: IWidget, bounds: any) => {
    if (!layerVisualizationSettings.balloonConf) return

    let quantiles: number[]
    let mappedData: Record<string, number> | null = null

    if (targetDatasetData && dataColumn) {
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw new Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)
        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
        quantiles = getQuantiles(targetDatasetData.rows, layerVisualizationSettings.balloonConf.classes, dataColumn)
    } else {
        const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
        quantiles = getQuantilesFromLayersData(layerPropertyValues, layerVisualizationSettings.balloonConf.classes)
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Polygon') {
            addChoroplethPolygonUsingLayersPointClassifedByQuantils(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, quantiles, null, bounds)
        } else if (feature.geometry?.type === 'MultiPolygon') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChoroplethPolygonUsingLayersPointClassifedByQuantils(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, quantiles, coord, bounds)
            })
        }
    })
}

const addChoroplethPolygonUsingLayersPointClassifedByQuantils = (layerGroup: any, feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, widgetModel: IWidget, quantiles: number[], coord: any[] | null, bounds: any) => {
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : valueKey
    const numberOfClasses = layerVisualizationSettings.analysisConf?.classes ?? defaultChoroplethValues.classes
    validateNumber(value)

    const colorGradients = generateColorGradient(layerVisualizationSettings.analysisConf?.style.color ?? defaultChoroplethValues.style.color, layerVisualizationSettings.analysisConf?.style.toColor ?? defaultChoroplethValues.style.toColor, numberOfClasses)
    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)

    const polygonCoords = (coordinates as any).map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x]))
    const color = colorGradients[getQuantileIndex(quantiles, value)] ?? defaultChoroplethValues.style.color

    const polygon = L.polygon(polygonCoords, { color: color, fillColor: color, weight: layerVisualizationSettings.analysisConf?.style.borderWidth ?? defaultChoroplethValues.style.borderWidth }).addTo(layerGroup)
    bounds.extend(polygon.getBounds())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon)
}

const createChoroplethClassifiedByQuantilsFromData = (layerGroup: any, data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerVisualizationSettings: IMapWidgetVisualizationType, bounds: any) => {
    if (!layerVisualizationSettings.analysisConf) return
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const quantiles = getQuantiles(data[target.name].rows, layerVisualizationSettings.analysisConf.classes, dataColumn)
    const numberOfClasses = layerVisualizationSettings.analysisConf?.classes ?? defaultChoroplethValues.classes

    const colorGradients = generateColorGradient(layerVisualizationSettings.analysisConf?.style.color ?? defaultChoroplethValues.style.color, layerVisualizationSettings.analysisConf?.style.toColor ?? defaultChoroplethValues.style.toColor, numberOfClasses)

    data[target.name].rows.forEach((row: any) => {
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)

        const polygonCoords = (coordinates as any).map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x]))
        const color = colorGradients[getQuantileIndex(quantiles, row[dataColumn])] ?? defaultChoroplethValues.style.color

        const polygon = L.polygon(polygonCoords, { color: color, fillColor: color, weight: layerVisualizationSettings.analysisConf?.style.borderWidth ?? defaultChoroplethValues.style.borderWidth }).addTo(layerGroup)
        bounds.extend(polygon.getBounds())

        addDialogToMarker(data, model, target, layerVisualizationSettings, row, polygon)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, polygon)
    })
}

const getQuantileIndex = (quantiles: number[], value: number): number => {
    for (let i = 0; i < quantiles.length; i++) {
        if (value < quantiles[i]) {
            return i
        }
    }
    return quantiles.length
}

const createChoroplethClassifiedByRangesUsingLayers = (layerGroup: any, layersData: any, layerVisualizationSettings: IMapWidgetVisualizationType, widgetModel: IWidget, bounds: any, targetDatasetData?: any, dataColumn?: string) => {
    let minValue = Number.MIN_SAFE_INTEGER
    let maxValue = Number.MAX_SAFE_INTEGER
    let mappedData: Record<string, number> | null = null

    if (targetDatasetData && dataColumn) {
        if (!layerVisualizationSettings.targetDataset) return

        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, incrementColumnName(dataColumn))
        minValue = valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER
        maxValue = valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER

        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)

        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
    } else {
        if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
            const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
            minValue = Math.min(...layerPropertyValues) ?? 0
            maxValue = Math.max(...layerPropertyValues) ?? 0
        }
    }

    const ranges = layerVisualizationSettings.analysisConf?.properties?.thresholds ?? []
    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Polygon') {
            addChoroplethPolygonUsingLayersPointClassifedByRanges(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, sortedRanges, null, bounds)
        } else if (feature.geometry?.type === 'MultiPolygon') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChoroplethPolygonUsingLayersPointClassifedByRanges(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, sortedRanges, coord, bounds)
            })
        }
    })
}

const addChoroplethPolygonUsingLayersPointClassifedByRanges = (layerGroup: any, feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, widgetModel: IWidget, sortedRanges: IMapWidgetVisualizationThreshold[], coord: any[] | null, bounds: any) => {
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : valueKey

    validateNumber(value)
    if (!layerVisualizationSettings.analysisConf) return
    let rangeIndexAndColor = getRangeIndexAndColor(value as number, sortedRanges, defaultChoroplethValues.style.color + '')

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const polygonCoords = (coordinates as any).map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x]))

    const polygon = L.polygon(polygonCoords, { color: rangeIndexAndColor.color, fillColor: rangeIndexAndColor.color, weight: layerVisualizationSettings.analysisConf?.style.borderWidth ?? defaultChoroplethValues.style.borderWidth }).addTo(layerGroup)
    bounds.extend(polygon.getBounds())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon)
}

const createChoroplethClassifiedByRangesFromData = (layerGroup: any, data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerVisualizationSettings: IMapWidgetVisualizationType, bounds: any) => {
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const valueColumnMinMaxValues = getMinMaxByName(data[target.name].stats, incrementColumnName(dataColumn))
    const ranges = layerVisualizationSettings.analysisConf?.properties?.thresholds ?? []
    const minValue = valueColumnMinMaxValues?.min ?? 0
    const maxValue = valueColumnMinMaxValues?.max ?? 0
    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)
    const defaultColor = layerVisualizationSettings.analysisConf?.style?.color ?? ''

    data[target.name].rows.forEach((row: any) => {
        if (!layerVisualizationSettings.analysisConf) return
        let rangeIndexAndColor = getRangeIndexAndColor(row[dataColumn], sortedRanges, defaultColor)
        if (!rangeIndexAndColor) rangeIndexAndColor = { index: 0, color: layerVisualizationSettings.analysisConf?.style.color ?? '' }
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        const polygonCoords = (coordinates as any).map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x]))
        const polygon = L.polygon(polygonCoords, { color: rangeIndexAndColor.color, fillColor: rangeIndexAndColor.color, weight: layerVisualizationSettings.analysisConf?.style.borderWidth ?? defaultChoroplethValues.style.borderWidth }).addTo(layerGroup)
        bounds.extend(polygon.getBounds())

        addDialogToMarker(data, model, target, layerVisualizationSettings, row, polygon)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, polygon)
    })
}

const getRangeIndexAndColor = (value: number, ranges: IMapWidgetVisualizationThreshold[], defaultColor: string): { index: number; color: string } => {
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i]
        if (value >= range.from && value < range.to) {
            return {
                index: i,
                color: range.color ?? defaultColor
            }
        }
    }

    return { index: ranges.length, color: defaultColor }
}

const generateColorGradient = (colorStart: string | undefined, colorEnd: string | undefined, steps: number | undefined): string[] => {
    if (!colorStart || !colorEnd || !steps) return []

    const extractRGBA = (color: string): number[] => {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
        if (!match) throw new Error('Invalid RGBA format')
        return match.slice(1, 5).map(Number)
    }

    const start = extractRGBA(colorStart)
    const end = extractRGBA(colorEnd)
    const gradient: string[] = []

    for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1)
        const interpolated = start.map((startVal, index) => startVal + (end[index] - startVal) * ratio)
        gradient.push(`rgba(${interpolated[0]}, ${interpolated[1]}, ${interpolated[2]}, ${interpolated[3]})`)
    }

    return gradient
}
