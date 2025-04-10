import { IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationThreshold, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, centerTheMap, getColumnName, getCoordinates, VisualizationDataType } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getMappedDataAndColumnIndex } from './MapMarkersVizualizationHelper'
import {
    formatRanges,
    getConditionalStyleUsingTargetDataset,
    getCoordinatesFromWktPointFeature,
    getFeatureValues,
    getMinMaxByName,
    getNumericPropertyValues,
    getQuantiles,
    getQuantilesFromLayersData,
    getRowValues,
    getVizualizationConditionalStyles,
    isConditionMet,
    sortRanges,
    validateNumber
} from './MapVisualizationHelper'

// Showing baloons from the data using geoColumn for the dataset, and property for the layer features (only Points allowed)
export const addBaloonMarkers = (
    map: any,
    data: any,
    model: IWidget,
    target: IMapWidgetLayer,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    markerBounds: any[],
    layersData: any,
    visualizationDataType: VisualizationDataType,
    targetDatasetData: any,
    variables: IVariable[],
    centerMap: boolean = true
) => {
    if (!layerVisualizationSettings.balloonConf) return
    switch (layerVisualizationSettings.balloonConf.method) {
        case 'CLASSIFY_BY_RANGES':
            // We use user defined value ranges to determine what size (depending also on number of ranges) and color should each balloon value have
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifedByRangesUsingLayers(layersData, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, variables)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifedByRangesUsingLayers(layersData, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, variables, targetDatasetData, dataColumn)
            } else {
                addBaloonMarkersClassifedByRangesFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables)
            }
            break
        // We divide the value array into user defined number of subarrays, each having the same number of elements, and determine the balloon size depending where the value fits
        case 'CLASSIFY_BY_QUANTILS':
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifedByQuantilsUsingLayers(null, layersData, null, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, variables)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifedByQuantilsUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, variables)
            } else {
                addBaloonMarkersClassifedByQuantilsFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables)
            }
            break
        default:
            // We divide the value array into user defined number of subarrays, using the minimum and maximum values as starting points (3 classes, 1-10, 10-20, 20-30 for example), and determine the balloon size depending where the value fits
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifiedByEqualIntervalsUsingLayers(layersData, layerGroup, layerVisualizationSettings, markerBounds, model, spatialAttribute, variables)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifiedByEqualIntervalsUsingLayers(layersData, layerGroup, layerVisualizationSettings, markerBounds, model, spatialAttribute, variables, targetDatasetData, dataColumn)
            } else {
                addBaloonMarkersClassifedByEqualIntervalsFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables)
            }
    }

    if (centerMap) centerTheMap(map, markerBounds)
}

const addBaloonMarkersClassifedByRangesUsingLayers = (layersData: any, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, variables: IVariable[], targetDatasetData?: any, dataColumn?: string) => {
    const { mappedData, dataColumnIndex, minValue, maxValue } = getMappedDataMinMax(targetDatasetData, layersData, dataColumn, layerVisualizationSettings)

    const ranges = layerVisualizationSettings.balloonConf?.properties?.thresholds ?? []
    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)
    const defaultColor = layerVisualizationSettings.balloonConf?.style?.color ?? ''

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addBaloonMarkerUsingLayersPointClassifedByRanges(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, sortedRanges, defaultColor, null, variables, dataColumnIndex)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addBaloonMarkerUsingLayersPointClassifedByRanges(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, sortedRanges, defaultColor, coord, variables, dataColumnIndex)
            })
        }
    })
}

const getMappedDataMinMax = (targetDatasetData: any, layersData: any, dataColumn: string | undefined, layerVisualizationSettings: IMapWidgetVisualizationType): { mappedData: Record<string, number> | null; dataColumnIndex: string | null; minValue: number; maxValue: number } => {
    let minValue = 0
    let maxValue = 0

    const { mappedData, dataColumnIndex } = getMappedDataAndColumnIndex(targetDatasetData, dataColumn ?? null, layerVisualizationSettings)

    if (targetDatasetData && dataColumnIndex) {
        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, dataColumnIndex)
        minValue = valueColumnMinMaxValues?.min ?? 0
        maxValue = valueColumnMinMaxValues?.max ?? 0
    } else if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
        const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
        minValue = Math.min(...layerPropertyValues) ?? 0
        maxValue = Math.max(...layerPropertyValues) ?? 0
    }

    return { mappedData, dataColumnIndex, minValue, maxValue }
}

const addBaloonMarkerUsingLayersPointClassifedByRanges = (
    feature: ILayerFeature,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    mappedData: any,
    layerGroup: any,
    spatialAttribute: any,
    widgetModel: IWidget,
    markerBounds: any[],
    sortedRanges: IMapWidgetVisualizationThreshold[],
    defaultColor: string,
    coord: any[] | null,
    variables: IVariable[],
    dataColumnIndex: string | null | undefined
) => {
    const { value, originalVisualizationTypeValue } = getFeatureValues(feature, layerVisualizationSettings, mappedData, dataColumnIndex)

    if (value != null) validateNumber(value)

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return

    if (!layerVisualizationSettings.balloonConf) return
    let sizeAndColor = getSizeAndColorFromRanges(originalVisualizationTypeValue as number, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize, sortedRanges, defaultColor) || { size: 1, color: layerVisualizationSettings.balloonConf?.style.color ?? '' }

    layerVisualizationSettings.balloonConf.size = sizeAndColor.size
    layerVisualizationSettings.balloonConf.style.color = sizeAndColor.color

    const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, originalVisualizationTypeValue, variables)
    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value as number, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)
    markerBounds.push(marker.getLatLng())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
}

const addBaloonMarkersClassifedByRangesFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[]) => {
    const valueColumnMinMaxValues = getMinMaxByName(data[target.name].stats, dataColumn)
    const ranges = layerVisualizationSettings.balloonConf?.properties?.thresholds ?? []
    const minValue = valueColumnMinMaxValues?.min ?? 0
    const maxValue = valueColumnMinMaxValues?.max ?? 0
    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)
    const defaultColor = layerVisualizationSettings.balloonConf?.style?.color ?? ''

    data[target.name].rows.forEach((row: any) => {
        const { value, originalValue } = getRowValues(row, dataColumn, layerVisualizationSettings, data[target.name])

        const filter = layerVisualizationSettings.filter
        if (filter?.enabled && !isConditionMet(filter, value)) return

        let sizeAndColor = null as { size: number; color: string } | null
        if (layerVisualizationSettings.balloonConf) {
            sizeAndColor = getSizeAndColorFromRanges(row[dataColumn], layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize, sortedRanges, defaultColor)
            if (!sizeAndColor) sizeAndColor = { size: 1, color: layerVisualizationSettings.balloonConf?.style.color ?? '' }
            layerVisualizationSettings.balloonConf.size = sizeAndColor.size
            layerVisualizationSettings.balloonConf.style.color = sizeAndColor.color
        }

        const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, layerVisualizationSettings.targetMeasure, originalValue, variables)
        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf ?? null, value, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)
        markerBounds.push(marker.getLatLng())
        addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
    })
}

const getSizeAndColorFromRanges = (value: number, minSize: number, maxSize: number, ranges: IMapWidgetVisualizationThreshold[], defaultColor: string): { size: number; color: string } | null => {
    let step = (maxSize - minSize) / (ranges.length - 1)
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i]
        if (value >= range.from && value < range.to) {
            const color = ranges[i]?.color ?? defaultColor
            return {
                size: minSize + i * step,
                color: color
            }
        }
    }

    const color = defaultColor
    return {
        size: maxSize,
        color: color
    }
}

const addBaloonMarkersClassifedByQuantilsUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, variables: IVariable[]) => {
    const { mappedData, dataColumnIndex, quantiles } = getMappedDataAndQuantiles(targetDatasetData, layersData, dataColumn, layerVisualizationSettings)

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addBaloonMarkerUsingLayersPointClassifedByQuantils(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, quantiles, null, variables, dataColumnIndex)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addBaloonMarkerUsingLayersPointClassifedByQuantils(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, quantiles, coord, variables, dataColumnIndex)
            })
        }
    })
}

export const getMappedDataAndQuantiles = (targetDatasetData: any, layersData: any, dataColumn: string | null, layerVisualizationSettings: IMapWidgetVisualizationType): { mappedData: Record<string, number> | null; dataColumnIndex: string | null; quantiles: number[] } => {
    let quantiles: number[] = []

    const { mappedData, dataColumnIndex } = getMappedDataAndColumnIndex(targetDatasetData, dataColumn, layerVisualizationSettings)

    if (targetDatasetData && dataColumnIndex) {
        quantiles = layerVisualizationSettings.balloonConf ? getQuantiles(targetDatasetData.rows, layerVisualizationSettings.balloonConf.classes, dataColumnIndex) : []
    } else {
        const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
        quantiles = layerVisualizationSettings.balloonConf ? getQuantilesFromLayersData(layerPropertyValues, layerVisualizationSettings.balloonConf.classes) : []
    }

    return { mappedData, dataColumnIndex, quantiles }
}

const addBaloonMarkerUsingLayersPointClassifedByQuantils = (
    feature: ILayerFeature,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    mappedData: any,
    layerGroup: any,
    spatialAttribute: any,
    widgetModel: IWidget,
    markerBounds: any[],
    quantiles: number[],
    coord: any[] | null,
    variables: IVariable[],
    dataColumnIndex: string | null | undefined
) => {
    const { value, originalVisualizationTypeValue } = getFeatureValues(feature, layerVisualizationSettings, mappedData, dataColumnIndex)

    if (value != null) validateNumber(value)

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return

    if (!layerVisualizationSettings.balloonConf) return
    layerVisualizationSettings.balloonConf.size = getSizeFromQuantiles(quantiles, originalVisualizationTypeValue as number, layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)

    const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, originalVisualizationTypeValue, variables)
    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value as number, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)
    markerBounds.push(marker.getLatLng())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
}

const addBaloonMarkersClassifedByQuantilsFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[]) => {
    if (!layerVisualizationSettings.balloonConf) return
    const quantiles = getQuantiles(data[target.name].rows, layerVisualizationSettings.balloonConf.classes, dataColumn)

    data[target.name].rows.forEach((row: any) => {
        const { value, originalValue } = getRowValues(row, dataColumn, layerVisualizationSettings, data[target.name])

        const filter = layerVisualizationSettings.filter
        if (filter?.enabled && !isConditionMet(filter, value)) return

        if (layerVisualizationSettings.balloonConf) layerVisualizationSettings.balloonConf.size = getSizeFromQuantiles(quantiles, originalValue, layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)

        const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, layerVisualizationSettings.targetMeasure, originalValue, variables)
        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf ?? null, value, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)
        markerBounds.push(marker.getLatLng())
        addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
    })
}

const getSizeFromQuantiles = (quantiles: number[], value: number, numQuantiles: number, minSize: number, maxSize: number) => {
    const step = (maxSize - minSize) / (numQuantiles - 1)

    for (let i = 0; i < quantiles.length; i++) {
        if (value < quantiles[i]) {
            return minSize + i * step
        }
    }

    return maxSize
}

const addBaloonMarkersClassifiedByEqualIntervalsUsingLayers = (layersData: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, spatialAttribute: any, variables: IVariable[], targetDatasetData?: any, dataColumn?: string) => {
    const { mappedData, dataColumnIndex, minValue, maxValue } = getMappedDataAndMinMaxValues(targetDatasetData, layersData, dataColumn ?? null, layerVisualizationSettings)

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addBaloonMarkerUsingLayersPointClassifedByEqualIntervals(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, minValue, maxValue, null, variables, dataColumnIndex)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addBaloonMarkerUsingLayersPointClassifedByEqualIntervals(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, minValue, maxValue, coord, variables, dataColumnIndex)
            })
        }
    })
}

const getMappedDataAndMinMaxValues = (targetDatasetData: any, layersData: any, dataColumn: string | null, layerVisualizationSettings: IMapWidgetVisualizationType): { mappedData: Record<string, number> | null; dataColumnIndex: string | null; minValue: number; maxValue: number } => {
    let minValue = Number.MIN_SAFE_INTEGER
    let maxValue = Number.MAX_SAFE_INTEGER

    const { mappedData, dataColumnIndex } = getMappedDataAndColumnIndex(targetDatasetData, dataColumn, layerVisualizationSettings)

    if (targetDatasetData && dataColumnIndex) {
        if (!layerVisualizationSettings.targetDataset) return { mappedData, dataColumnIndex, minValue, maxValue }

        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, dataColumnIndex)
        minValue = valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER
        maxValue = valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER
    } else if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
        const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
        minValue = Math.min(...layerPropertyValues) ?? 0
        maxValue = Math.max(...layerPropertyValues) ?? 0
    }

    return { mappedData, dataColumnIndex, minValue, maxValue }
}

const addBaloonMarkerUsingLayersPointClassifedByEqualIntervals = (
    feature: ILayerFeature,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    mappedData: any,
    layerGroup: any,
    spatialAttribute: any,
    widgetModel: IWidget,
    markerBounds: any[],
    minValue: number,
    maxValue: number,
    coord: any[] | null,
    variables: IVariable[],
    dataColumnIndex: string | null | undefined
) => {
    const { value, originalVisualizationTypeValue } = getFeatureValues(feature, layerVisualizationSettings, mappedData, dataColumnIndex)

    if (value != null) validateNumber(value)

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return

    if (layerVisualizationSettings.balloonConf) {
        layerVisualizationSettings.balloonConf.size = getSizeFromEqualIntervals(originalVisualizationTypeValue as number, minValue, maxValue, layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)
    }

    const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, value, variables)

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf ?? null, value as number, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)
    markerBounds.push(marker.getLatLng())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
}

const addBaloonMarkersClassifedByEqualIntervalsFromData = (
    data: any,
    widgetModel: IWidget,
    target: IMapWidgetLayer,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    markerBounds: any[],
    variables: IVariable[]
) => {
    const valueColumnMinMaxValues = getMinMaxByName(data[target.name].stats, dataColumn)

    data[target.name].rows.forEach((row: any) => {
        const { value, originalValue } = getRowValues(row, dataColumn, layerVisualizationSettings, data[target.name])

        const filter = layerVisualizationSettings.filter
        if (filter?.enabled && !isConditionMet(filter, value)) return

        if (layerVisualizationSettings.balloonConf)
            layerVisualizationSettings.balloonConf.size = getSizeFromEqualIntervals(
                originalValue,
                valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER,
                valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER,
                layerVisualizationSettings.balloonConf.classes,
                layerVisualizationSettings.balloonConf.minSize,
                layerVisualizationSettings.balloonConf.maxSize
            )

        const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, layerVisualizationSettings.targetMeasure, value, variables)
        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf ?? null, value, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)
        markerBounds.push(marker.getLatLng())
        addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
    })
}

const getSizeFromEqualIntervals = (value: number, min: number, max: number, classes: number, minSize: number, maxSize: number) => {
    let range = (max - min) / classes

    let step = (maxSize - minSize) / (classes - 1)

    for (let i = 0; i < classes; i++) {
        if (value < min + (i + 1) * range) {
            return minSize + i * step
        }
    }
    return maxSize
}
