import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationThreshold, IMapWidgetVisualizationType, IMapWidgetVisualizationTypeChoropleth } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getColumnName, getCoordinates, LEGEND_DATA_TYPE, VisualizationDataType } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData, createDialogFromDataset } from './MapDialogHelper'
import { executeMapInteractions, columnsMatch } from '../interactions/MapInteractionsHelper'
import { formatRanges, getConditionalStyleUsingTargetDataset, getCoordinatesFromWktPointFeature, getFeatureValues, getMinMaxByName, getNumericPropertyValues, getQuantiles, getQuantilesFromLayersData, getRowValues, getTargetDataColumn, isConditionMet, sortRanges, transformDataUsingForeignKeyReturningAllColumns, validateNumber } from './MapVisualizationHelper'
import L from 'leaflet'
import * as mapWidgetDefaultValues from '../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'
import { getQuantileSizeMappings, getSizeAndColorRangesForLegend } from './MapBaloonsVizualizationHelper'

// Helper: find the configured interaction column for a visualization (selection/crossNavigation/link/preview)
const findInteractionColumnForVisualization = (widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType): string | null => {
    // try selection
    const selectionConfig = widgetModel?.settings?.interactions?.selection?.selections?.find((s: any) => s.vizualizationType?.id === layerVisualizationSettings.id || s.vizualizationType?.target === layerVisualizationSettings.target || s.vizualizationType?.label === layerVisualizationSettings.label)
    if (selectionConfig?.column) return selectionConfig.column.name

    const crossNavConfig = widgetModel?.settings?.interactions?.crossNavigation?.crossNavigationVizualizationTypes?.find((c: any) => c.vizualizationType?.id === layerVisualizationSettings.id || c.vizualizationType?.target === layerVisualizationSettings.target || c.vizualizationType?.label === layerVisualizationSettings.label)
    if (crossNavConfig?.column) return crossNavConfig.column.name

    const linkConfig = widgetModel?.settings?.interactions?.link?.linkVizualizationTypes?.find((l: any) => l.vizualizationType?.id === layerVisualizationSettings.id || l.vizualizationType?.target === layerVisualizationSettings.target || l.vizualizationType?.label === layerVisualizationSettings.label)
    if (linkConfig?.column) return linkConfig.column.name

    const previewConfig = widgetModel?.settings?.interactions?.preview?.previewVizualizationTypes?.find((p: any) => p.vizualizationType?.id === layerVisualizationSettings.id || p.vizualizationType?.target === layerVisualizationSettings.target || p.vizualizationType?.label === layerVisualizationSettings.label)
    if (previewConfig?.column) return previewConfig.column.name

    return null
}

export const createChoropleth = (map: L.Map, data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, layersData: any, visualizationDataType: VisualizationDataType, targetDatasetData: any, variables: IVariable[], bounds: any, activeSelections: ISelection[], dashboardId: string) => {
    if (!layerVisualizationSettings.analysisConf) return

    switch (layerVisualizationSettings.analysisConf.method) {
        case 'CLASSIFY_BY_RANGES':
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                return createChoroplethClassifiedByRangesUsingLayers(layerGroup, layersData, layerVisualizationSettings, model, bounds, variables, activeSelections, dashboardId)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                return createChoroplethClassifiedByRangesUsingLayers(layerGroup, layersData, layerVisualizationSettings, model, bounds, variables, activeSelections, dashboardId, targetDatasetData, dataColumn)
            } else {
                return createChoroplethClassifiedByRangesFromData(layerGroup, data, model, target, dataColumn, spatialAttribute, geoColumn, layerVisualizationSettings, bounds, variables, activeSelections, dashboardId)
            }
        case 'CLASSIFY_BY_QUANTILS':
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                return createChoroplethClassifiedByQuantilsUsingLayers(null, layersData, null, layerGroup, layerVisualizationSettings, model, bounds, variables, activeSelections, dashboardId)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                return createChoroplethClassifiedByQuantilsUsingLayers(targetDatasetData, layersData, dataColumn, layerGroup, layerVisualizationSettings, model, bounds, variables, activeSelections, dashboardId)
            } else {
                return createChoroplethClassifiedByQuantilsFromData(layerGroup, data, model, target, dataColumn, spatialAttribute, geoColumn, layerVisualizationSettings, bounds, variables, activeSelections, dashboardId)
            }
        default:
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                return createChoroplethClassifiedByEqualIntervalsUsingLayers(layerGroup, layersData, layerVisualizationSettings, model, bounds, variables, activeSelections, dashboardId)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                return createChoroplethClassifiedByEqualIntervalsUsingLayers(layerGroup, layersData, layerVisualizationSettings, model, bounds, variables, activeSelections, dashboardId, targetDatasetData, dataColumn)
            } else {
                return createChoroplethClassifiedByEqualIntervalsFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, bounds, variables, activeSelections, dashboardId)
            }
    }
}

const createChoroplethClassifiedByEqualIntervalsUsingLayers = (layerGroup: any, layersData: any, layerVisualizationSettings: IMapWidgetVisualizationType, widgetModel: IWidget, bounds: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string, targetDatasetData?: any, dataColumn?: string, foreignKeyColumn?: string) => {
    if (!layerVisualizationSettings.analysisConf) return

    let minValue = Number.MIN_SAFE_INTEGER
    let maxValue = Number.MAX_SAFE_INTEGER
    let mappedData: Record<string, number> | null = null
    let dataColumnIndex = dataColumn

    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const numberOfClasses = layerVisualizationSettings.analysisConf?.classes ?? defaultChoroplethValues.classes
    const colorGradients = generateColorGradient(layerVisualizationSettings.analysisConf?.style.color ?? defaultChoroplethValues.style.color, layerVisualizationSettings.analysisConf?.style.toColor ?? defaultChoroplethValues.style.toColor, numberOfClasses)

    if (targetDatasetData && dataColumn) {
        if (!layerVisualizationSettings.targetDataset) return

        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, dataColumn)
        minValue = valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER
        maxValue = valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER

        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetDatasetForeignKeyColumn, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetDatasetForeignKeyColumn} is not present in the dataset`)

        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        dataColumnIndex = getTargetDataColumn(targetDatasetData, layerVisualizationSettings, dataColumn)
    } else {
        if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
            const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
            minValue = Math.min(...layerPropertyValues) ?? 0
            maxValue = Math.max(...layerPropertyValues) ?? 0
        }
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Polygon') {
            addChoroplethPolygonUsingLayersPointClassifedByEqualIntervals(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, minValue, maxValue, null, bounds, variables, dataColumnIndex, numberOfClasses, defaultChoroplethValues, colorGradients, activeSelections, dashboardId, targetDatasetData)
        } else if (feature.geometry?.type === 'MultiPolygon') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChoroplethPolygonUsingLayersPointClassifedByEqualIntervals(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, minValue, maxValue, coord, bounds, variables, dataColumnIndex, numberOfClasses, defaultChoroplethValues, colorGradients, activeSelections, dashboardId, targetDatasetData)
            })
        }
    })

    return { intervals: getEqualIntervalsForLegend(minValue, maxValue, numberOfClasses), colorGradients: colorGradients, type: LEGEND_DATA_TYPE.CHOROPLETH_INTERVALS }
}

const addChoroplethPolygonUsingLayersPointClassifedByEqualIntervals = (
    layerGroup: any,
    feature: ILayerFeature,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    mappedData: any,
    widgetModel: IWidget,
    minValue: number,
    maxValue: number,
    coord: any[] | null,
    bounds: any,
    variables: IVariable[],
    dataColumnIndex: string | null | undefined,
    numberOfClasses: number,
    defaultChoroplethValues: IMapWidgetVisualizationTypeChoropleth,
    colorGradients: string[],
    activeSelections: ISelection[],
    dashboardId: string,
    targetDatasetData?: any
) => {
    const { value, originalVisualizationTypeValue } = getFeatureValues(feature, layerVisualizationSettings, mappedData, dataColumnIndex)

    let foreignKeyValue
    if (layerVisualizationSettings.targetDatasetForeignKeyColumn) {
        foreignKeyValue = feature.properties ? feature.properties[layerVisualizationSettings.targetDatasetForeignKeyColumn] : null
    }

    if (!value) return
    validateNumber(value)

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return

    const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, originalVisualizationTypeValue, variables)

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    if (!coordinates) return
    const polygonCoords = Array.isArray(coordinates) ? (coordinates as any).map((ring: any) => (Array.isArray(ring[0]) ? ring.map(([x, y]: [number, number]) => [y, x]) : [])) : []
    const color = colorGradients[getRangeIndexFromEqualIntervals(originalVisualizationTypeValue, minValue, maxValue, numberOfClasses)] ?? defaultChoroplethValues.style.color

    const polygon = createPolygon(polygonCoords, color, layerVisualizationSettings, defaultChoroplethValues, layerGroup, bounds, conditionalStyle)
    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon, activeSelections, dashboardId, variables, foreignKeyValue, targetDatasetData, mappedData)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon, activeSelections, dashboardId, variables, foreignKeyValue, targetDatasetData, mappedData)
    attachPolygonInteractionHandlers(polygon, feature, layerVisualizationSettings, widgetModel, activeSelections, dashboardId, variables)
}

const createChoroplethClassifiedByEqualIntervalsFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, bounds: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    if (!layerVisualizationSettings.analysisConf) return
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()

    const valueColumnMinMaxValues = getMinMaxByName(data[target.id].stats, dataColumn)
    const numberOfClasses = layerVisualizationSettings.analysisConf?.classes ?? defaultChoroplethValues.classes
    const colorGradients = generateColorGradient(layerVisualizationSettings.analysisConf?.style.color ?? defaultChoroplethValues.style.color, layerVisualizationSettings.analysisConf?.style.toColor ?? defaultChoroplethValues.style.toColor, numberOfClasses)

    data[target.id].rows.forEach((row: any) => {
        const { value, originalValue } = getRowValues(row, dataColumn, layerVisualizationSettings, data[target.id])
        if (!value) return

        const filter = layerVisualizationSettings.filter
        if (filter?.enabled && !isConditionMet(filter, value)) return

        const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, value, variables)
        if (!row[geoColumn]) return
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        if (!coordinates) return
        const polygonCoords = Array.isArray(coordinates) ? (coordinates as any).map((ring: any) => (Array.isArray(ring[0]) ? ring.map(([x, y]: [number, number]) => [y, x]) : [])) : []
        const color = colorGradients[getRangeIndexFromEqualIntervals(originalValue, valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER, valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER, numberOfClasses)] ?? defaultChoroplethValues.style.color

        const polygon = createPolygon(polygonCoords, color, layerVisualizationSettings, defaultChoroplethValues, layerGroup, bounds, conditionalStyle)

        addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, polygon, activeSelections, dashboardId, variables)
        addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, polygon, activeSelections, dashboardId, variables)
    })

    return { intervals: getEqualIntervalsForLegend(valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER, valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER, numberOfClasses), colorGradients: colorGradients, type: LEGEND_DATA_TYPE.CHOROPLETH_INTERVALS }
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

const getEqualIntervalsForLegend = (min: number, max: number, classes: number | undefined): { min: number; max: number }[] => {
    if (!classes || classes <= 0) return []

    const rangeSize = (max - min) / classes
    const ranges: { min: number; max: number }[] = []

    for (let i = 0; i < classes; i++) {
        const rangeMin = min + i * rangeSize
        const rangeMax = i === classes - 1 ? max : rangeMin + rangeSize
        ranges.push({ min: rangeMin, max: rangeMax })
    }

    return ranges
}

const createChoroplethClassifiedByQuantilsUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, widgetModel: IWidget, bounds: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    if (!layerVisualizationSettings.analysisConf) return

    let quantiles: number[]
    let mappedData: Record<string, number> | null = null
    let dataColumnIndex = dataColumn

    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const numberOfClasses = layerVisualizationSettings.analysisConf?.classes ?? defaultChoroplethValues.classes
    const colorGradients = generateColorGradient(layerVisualizationSettings.analysisConf?.style.color ?? defaultChoroplethValues.style.color, layerVisualizationSettings.analysisConf?.style.toColor ?? defaultChoroplethValues.style.toColor, numberOfClasses)

    if (targetDatasetData && dataColumn) {
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetDatasetForeignKeyColumn, targetDatasetData)
        if (!foreignKeyColumnName) throw new Error(`Foreign key column ${layerVisualizationSettings.targetDatasetForeignKeyColumn} is not present in the dataset`)
        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        quantiles = getQuantiles(targetDatasetData.rows, layerVisualizationSettings.analysisConf.classes, dataColumn)
        dataColumnIndex = getTargetDataColumn(targetDatasetData, layerVisualizationSettings, dataColumn)
    } else {
        const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
        quantiles = getQuantilesFromLayersData(layerPropertyValues, layerVisualizationSettings.analysisConf.classes)
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Polygon') {
            addChoroplethPolygonUsingLayersPointClassifedByQuantils(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, quantiles, null, bounds, variables, dataColumnIndex, defaultChoroplethValues, colorGradients, activeSelections, dashboardId, targetDatasetData)
        } else if (feature.geometry?.type === 'MultiPolygon') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChoroplethPolygonUsingLayersPointClassifedByQuantils(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, quantiles, coord, bounds, variables, dataColumnIndex, defaultChoroplethValues, colorGradients, activeSelections, dashboardId, targetDatasetData)
            })
        }
    })

    return { qunatileMappings: getQuantileSizeMappings(quantiles, layerVisualizationSettings.analysisConf.classes, layerVisualizationSettings.analysisConf.minSize, layerVisualizationSettings.analysisConf.maxSize), colorGradients: colorGradients, type: LEGEND_DATA_TYPE.CHOROPLETH_QUANTILES }
}

const addChoroplethPolygonUsingLayersPointClassifedByQuantils = (
    layerGroup: any,
    feature: ILayerFeature,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    mappedData: any,
    widgetModel: IWidget,
    quantiles: number[],
    coord: any[] | null,
    bounds: any,
    variables: IVariable[],
    dataColumnIndex: string | null | undefined,
    defaultChoroplethValues: IMapWidgetVisualizationTypeChoropleth,
    colorGradients: string[],
    activeSelections: ISelection[],
    dashboardId: string,
    targetDatasetData?: any
) => {
    const { value, originalVisualizationTypeValue } = getFeatureValues(feature, layerVisualizationSettings, mappedData, dataColumnIndex)

    let foreignKeyValue
    if (layerVisualizationSettings.targetDatasetForeignKeyColumn) {
        foreignKeyValue = feature.properties ? feature.properties[layerVisualizationSettings.targetDatasetForeignKeyColumn] : null
    }

    if (!value) return
    validateNumber(value)

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return

    const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, originalVisualizationTypeValue, variables)

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    if (!coordinates) return
    const polygonCoords = Array.isArray(coordinates) ? (coordinates as any).map((ring: any) => (Array.isArray(ring[0]) ? ring.map(([x, y]: [number, number]) => [y, x]) : [])) : []
    const color = colorGradients[getQuantileIndex(quantiles, originalVisualizationTypeValue)] ?? defaultChoroplethValues.style.color

    const polygon = createPolygon(polygonCoords, color, layerVisualizationSettings, defaultChoroplethValues, layerGroup, bounds, conditionalStyle)

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon, activeSelections, dashboardId, variables, foreignKeyValue, targetDatasetData, mappedData)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon, activeSelections, dashboardId, variables, foreignKeyValue, targetDatasetData, mappedData)
    attachPolygonInteractionHandlers(polygon, feature, layerVisualizationSettings, widgetModel, activeSelections, dashboardId, variables)
}

const createChoroplethClassifiedByQuantilsFromData = (layerGroup: any, data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerVisualizationSettings: IMapWidgetVisualizationType, bounds: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    if (!layerVisualizationSettings.analysisConf) return
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const quantiles = getQuantiles(data[target.name].rows, layerVisualizationSettings.analysisConf.classes, dataColumn)
    const numberOfClasses = layerVisualizationSettings.analysisConf?.classes ?? defaultChoroplethValues.classes

    const colorGradients = generateColorGradient(layerVisualizationSettings.analysisConf?.style.color ?? defaultChoroplethValues.style.color, layerVisualizationSettings.analysisConf?.style.toColor ?? defaultChoroplethValues.style.toColor, numberOfClasses)

    data[target.id].rows.forEach((row: any) => {
        const { value, originalValue } = getRowValues(row, dataColumn, layerVisualizationSettings, data[target.name])
        if (!value) return

        const filter = layerVisualizationSettings.filter
        if (filter?.enabled && !isConditionMet(filter, value)) return

        const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, value, variables)
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        if (!coordinates) return

        const polygonCoords = Array.isArray(coordinates) ? (coordinates as any).map((ring: any) => (Array.isArray(ring[0]) ? ring.map(([x, y]: [number, number]) => [y, x]) : [])) : []
        const color = colorGradients[getQuantileIndex(quantiles, originalValue)] ?? defaultChoroplethValues.style.color

        const polygon = createPolygon(polygonCoords, color, layerVisualizationSettings, defaultChoroplethValues, layerGroup, bounds, conditionalStyle)
        addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, polygon, activeSelections, dashboardId, variables)
        addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, polygon, activeSelections, dashboardId, variables)
    })

    return { qunatileMappings: getQuantileSizeMappings(quantiles, layerVisualizationSettings.analysisConf.classes, layerVisualizationSettings.analysisConf.minSize, layerVisualizationSettings.analysisConf.maxSize), colorGradients: colorGradients, type: LEGEND_DATA_TYPE.CHOROPLETH_QUANTILES }
}

const getQuantileIndex = (quantiles: number[], value: number): number => {
    for (let i = 0; i < quantiles.length; i++) {
        if (value < quantiles[i]) {
            return i
        }
    }
    return quantiles.length
}

const createChoroplethClassifiedByRangesUsingLayers = (layerGroup: any, layersData: any, layerVisualizationSettings: IMapWidgetVisualizationType, widgetModel: IWidget, bounds: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string, targetDatasetData?: any, dataColumn?: string) => {
    let minValue = Number.MIN_SAFE_INTEGER
    let maxValue = Number.MAX_SAFE_INTEGER
    let mappedData: Record<string, number> | null = null
    let dataColumnIndex = dataColumn

    const defaultColor = layerVisualizationSettings.analysisConf?.style?.color ?? ''

    if (targetDatasetData && dataColumn) {
        if (!layerVisualizationSettings.targetDataset) return

        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, dataColumn)
        minValue = valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER
        maxValue = valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER

        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetDatasetForeignKeyColumn, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetDatasetForeignKeyColumn} is not present in the dataset`)

        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        dataColumnIndex = getTargetDataColumn(targetDatasetData, layerVisualizationSettings, dataColumn)
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
            addChoroplethPolygonUsingLayersPointClassifedByRanges(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, sortedRanges, null, bounds, variables, dataColumnIndex, activeSelections, dashboardId, targetDatasetData)
        } else if (feature.geometry?.type === 'MultiPolygon') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addChoroplethPolygonUsingLayersPointClassifedByRanges(layerGroup, feature, layerVisualizationSettings, mappedData, widgetModel, sortedRanges, coord, bounds, variables, dataColumnIndex, activeSelections, dashboardId, targetDatasetData)
            })
        }
    })

    return { ranges: getSizeAndColorRangesForLegend(minValue, maxValue, ranges, defaultColor), type: LEGEND_DATA_TYPE.CHOROPLETH_RANGES }
}

const addChoroplethPolygonUsingLayersPointClassifedByRanges = (layerGroup: any, feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, widgetModel: IWidget, sortedRanges: IMapWidgetVisualizationThreshold[], coord: any[] | null, bounds: any, variables: IVariable[], dataColumnIndex: string | null | undefined, activeSelections: ISelection[], dashboardId: string, targetDatasetData?: any) => {
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()

    let foreignKeyValue

    if (layerVisualizationSettings.targetDatasetForeignKeyColumn) {
        foreignKeyValue = feature.properties ? feature.properties[layerVisualizationSettings.targetDatasetForeignKeyColumn] : null
    }

    const { value, originalVisualizationTypeValue } = getFeatureValues(feature, layerVisualizationSettings, mappedData, dataColumnIndex)
    if (!value) return

    const filter = layerVisualizationSettings.filter
    if (value != null) validateNumber(value)

    if (filter?.enabled && !isConditionMet(filter, value)) return
    if (!layerVisualizationSettings.analysisConf) return

    let rangeIndexAndColor = getRangeIndexAndColor(originalVisualizationTypeValue as number, sortedRanges, defaultChoroplethValues.style.color + '')

    const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, originalVisualizationTypeValue, variables)
    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    if (!coordinates) return
    const polygonCoords = Array.isArray(coordinates) ? (coordinates as any).map((ring: any) => (Array.isArray(ring[0]) ? ring.map(([x, y]: [number, number]) => [y, x]) : [])) : []

    const polygon = createPolygon(polygonCoords, rangeIndexAndColor.color, layerVisualizationSettings, defaultChoroplethValues, layerGroup, bounds, conditionalStyle)
    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon, activeSelections, dashboardId, variables, foreignKeyValue, targetDatasetData, mappedData)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, polygon, activeSelections, dashboardId, variables, foreignKeyValue, targetDatasetData, mappedData)
    attachPolygonInteractionHandlers(polygon, feature, layerVisualizationSettings, widgetModel, activeSelections, dashboardId, variables)
}

const createChoroplethClassifiedByRangesFromData = (layerGroup: any, data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerVisualizationSettings: IMapWidgetVisualizationType, bounds: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    const defaultChoroplethValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const valueColumnMinMaxValues = getMinMaxByName(data[target.name].stats, dataColumn)
    const ranges = layerVisualizationSettings.analysisConf?.properties?.thresholds ?? []
    const minValue = valueColumnMinMaxValues?.min ?? 0
    const maxValue = valueColumnMinMaxValues?.max ?? 0
    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)
    const defaultColor = layerVisualizationSettings.analysisConf?.style?.color ?? ''

    data[target.id].rows.forEach((row: any) => {
        if (!layerVisualizationSettings.analysisConf) return
        const { value, originalValue } = getRowValues(row, dataColumn, layerVisualizationSettings, data[target.name])
        if (!value) return

        const filter = layerVisualizationSettings.filter
        if (filter?.enabled && !isConditionMet(filter, value)) return

        let rangeIndexAndColor = getRangeIndexAndColor(originalValue, sortedRanges, defaultColor)
        if (!rangeIndexAndColor) rangeIndexAndColor = { index: 0, color: layerVisualizationSettings.analysisConf?.style.color ?? '' }

        const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, value, variables)
        const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
        if (!coordinates) return
        const polygonCoords = Array.isArray(coordinates) ? (coordinates as any).map((ring: any) => (Array.isArray(ring[0]) ? ring.map(([x, y]: [number, number]) => [y, x]) : [])) : []

        const polygon = createPolygon(polygonCoords, rangeIndexAndColor.color, layerVisualizationSettings, defaultChoroplethValues, layerGroup, bounds, conditionalStyle)

        addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, polygon, activeSelections, dashboardId, variables)
        addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, polygon, activeSelections, dashboardId, variables)
    })

    return { ranges: getSizeAndColorRangesForLegend(minValue, maxValue, ranges, defaultColor), type: LEGEND_DATA_TYPE.CHOROPLETH_RANGES }
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

const createPolygon = (polygonCoords: number[], color: string | null, layerVisualizationSettings: IMapWidgetVisualizationType, defaultChoroplethValues: IMapWidgetVisualizationTypeChoropleth, layerGroup: any, bounds: any, conditionalStyle: { ['background-color']?: string; icon?: string } | null) => {
    const polygon = L.polygon(polygonCoords, { color: conditionalStyle?.['background-color'] ?? color, fillColor: conditionalStyle?.['background-color'] ?? color, weight: layerVisualizationSettings.analysisConf?.style.borderWidth ?? defaultChoroplethValues.style.borderWidth }).addTo(layerGroup)
    bounds.extend(polygon.getBounds())
    return polygon
}

// Generalized interaction handler for choropleth polygons
const attachPolygonInteractionHandlers = (polygon: any, feature: any, layerVisualizationSettings: IMapWidgetVisualizationType, widgetModel: IWidget, activeSelections: ISelection[], dashboardId: string, variables: IVariable[]) => {
    try {
        if (!widgetModel.settings.dialog?.enabled) {
            polygon.on &&
                polygon.on('click', (ev: any) => {
                    try {
                        try {
                            const popup = createDialogFromDataset(false, layerVisualizationSettings, widgetModel.settings.dialog, null, feature, widgetModel, activeSelections, dashboardId, variables)
                            const content = popup && (popup as any).getContent ? (popup as any).getContent() : null
                            if (content && content.querySelector) {
                                const clickables = Array.from(content.querySelectorAll('.clickable-custom-leaflet-list-item')) as HTMLElement[]

                                const crossNavConfigs = widgetModel?.settings?.interactions?.crossNavigation?.crossNavigationVizualizationTypes ?? []

                                for (const item of clickables) {
                                    const dataValue = item.getAttribute('data-value') ?? ''
                                    const [rawValueColumn] = dataValue.split(':')
                                    const itemColumn = (rawValueColumn || '').trim()

                                    const matched = crossNavConfigs.some((c: any) => {
                                        const viz = c.vizualizationType
                                        const vizMatches = viz && (viz.id === layerVisualizationSettings.id || viz.target === layerVisualizationSettings.target || viz.label === layerVisualizationSettings.label)
                                        return vizMatches && columnsMatch(c.column, itemColumn)
                                    })

                                    if (matched) {
                                        item.click()
                                        return
                                    }
                                }
                            }
                        } catch (err) {
                            // ignore and fall back to synthetic event
                        }

                        const column = findInteractionColumnForVisualization(widgetModel, layerVisualizationSettings)
                        if (!column) return

                        const dataMap = feature.properties ?? {}
                        const valueForColumn = feature.properties?.[column]
                        const dataValue = `${column}: ${valueForColumn}`

                        const fakeElement: any = {
                            getAttribute: (name: string) => (name === 'data-value' ? dataValue : null),
                            _dataMap: dataMap
                        }

                        executeMapInteractions({ currentTarget: fakeElement }, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables)
                    } catch (err) {
                        // ignore
                    }
                })
        } else {
            polygon.on &&
                polygon.on('click', (ev: any) => {
                    try {
                        if (polygon.getPopup && polygon.getPopup()) polygon.openPopup()
                    } catch (err) {
                        // ignore
                    }
                })
        }
    } catch (err) {
        // ignore
    }
}
