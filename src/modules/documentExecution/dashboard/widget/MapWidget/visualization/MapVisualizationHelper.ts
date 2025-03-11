import { IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationThreshold, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, getColumnName, getCoordinates, VisualizationDataType } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import * as mapWidgetDefaultValues from '../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'
import L from 'leaflet'

// Showing markers from the data using geoColumn for the dataset, and property for the layer features (only Points allowed)
export const addMarkers = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any) => {
    if (data && data[target.name]) {
        addMarkersFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
    } else {
        addMarkersUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model)
    }
}

const addMarkersFromData = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    for (const row of data[target.name].rows) {
        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.markerConf ?? null, row[dataColumn], spatialAttribute)
        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
        markerBounds.push(marker.getLatLng())
    }
}

const addMarkersUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget) => {
    let mappedData: Record<string, number> | null = null

    if (targetDatasetData && dataColumn) {
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw new Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)
        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addMarkerUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, null)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addMarkerUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, coord)
            })
        }
    })
}

const addMarkerUsingLayersPoint = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null) => {
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : valueKey
    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.markerConf ?? null, value as any, spatialAttribute)
    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    markerBounds.push(marker.getLatLng())
}

// Showing baloons from the data using geoColumn for the dataset, and property for the layer features (only Points allowed)
export const addBaloonMarkers = (
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
    targetDatasetData: any
) => {
    if (!layerVisualizationSettings.balloonConf) return
    switch (layerVisualizationSettings.balloonConf.method) {
        case 'CLASSIFY_BY_RANGES':
            // We use user defined value ranges to determine what size (depending also on number of ranges) and color should each balloon value have
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifedByRangesUsingLayers(layersData, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifedByRangesUsingLayers(layersData, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, targetDatasetData, dataColumn)
            } else {
                addBaloonMarkersClassifedByRangesFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
            }
            break
        // We divide the value array into user defined number of subarrays, each having the same number of elements, and determine the balloon size depending where the value fits
        case 'CLASSIFY_BY_QUANTILS':
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifedByQuantilsUsingLayers(null, layersData, null, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifedByQuantilsUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model)
            } else {
                addBaloonMarkersClassifedByQuantilsFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
            }
            break
        default:
            // We divide the value array into user defined number of subarrays, using the minimum and maximum values as starting points (3 classes, 1-10, 10-20, 20-30 for example), and determine the balloon size depending where the value fits
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifiedByEqualIntervalsUsingLayers(layersData, layerGroup, layerVisualizationSettings, markerBounds, model, spatialAttribute)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifiedByEqualIntervalsUsingLayers(layersData, layerGroup, layerVisualizationSettings, markerBounds, model, spatialAttribute, targetDatasetData, dataColumn)
            } else {
                addBaloonMarkersClassifedByEqualIntervalsFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
            }
    }
}

const getNumericPropertyValues = (geojson: any, propertyName: string): number[] => {
    const values = geojson.features.map((feature: ILayerFeature) => {
        const value = feature.properties[propertyName]

        if (typeof value !== 'number') {
            throw new Error(`Property "${propertyName}" contains a non-numeric value: ${value}`)
        }

        return value
    })

    return values
}

const getMinMaxByName = (data: Record<string, any>, columnName: string): { min: number; max: number } | null => {
    for (const key in data) {
        if (data[key].name === columnName) {
            const min = parseFloat(data[key].min.toString().split(' ')[0])
            const max = parseFloat(data[key].max.toString().split(' ')[0])

            return { min, max }
        }
    }
    return null
}

const incrementColumnName = (columnName: string): string => {
    const match = columnName.match(/^column_(\d+)$/)

    if (match) {
        const nextNumber = parseInt(match[1], 10) + 1
        return `column_${nextNumber}`
    }

    throw new Error('Invalid column name format')
}

const addBaloonMarkersClassifedByRangesUsingLayers = (layersData: any, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, targetDatasetData?: any, dataColumn?: string) => {
    let minValue = 0,
        maxValue = 0,
        mappedData: any = null

    if (targetDatasetData && dataColumn) {
        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, incrementColumnName(dataColumn))
        minValue = valueColumnMinMaxValues?.min ?? 0
        maxValue = valueColumnMinMaxValues?.max ?? 0
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw Error('Foreign key column ' + layerVisualizationSettings.targetProperty + ' is not present in the dataset')
        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
    } else if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
        const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
        minValue = Math.min(...layerPropertyValues) ?? 0
        maxValue = Math.max(...layerPropertyValues) ?? 0
    }

    const ranges = layerVisualizationSettings.balloonConf?.properties?.thresholds ?? []
    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)
    const defaultColor = layerVisualizationSettings.balloonConf?.style?.color ?? ''

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addBaloonMarkerUsingLayersPointClassifedByRanges(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, sortedRanges, defaultColor, null)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addBaloonMarkerUsingLayersPointClassifedByRanges(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, sortedRanges, defaultColor, coord)
            })
        }
    })
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
    coord: any[] | null
) => {
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : valueKey

    validateNumber(value)
    if (!layerVisualizationSettings.balloonConf) return
    let sizeAndColor = getSizeAndColorFromRanges(value as number, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize, sortedRanges, defaultColor) || { size: 1, color: layerVisualizationSettings.balloonConf?.style.color ?? '' }

    layerVisualizationSettings.balloonConf.size = sizeAndColor.size
    layerVisualizationSettings.balloonConf.style.color = sizeAndColor.color

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value as number, spatialAttribute)
    markerBounds.push(marker.getLatLng())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
}

const addBaloonMarkersClassifedByRangesFromData = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    const valueColumnMinMaxValues = getMinMaxByName(data[target.name].stats, incrementColumnName(dataColumn))
    const ranges = layerVisualizationSettings.balloonConf?.properties?.thresholds ?? []
    const minValue = valueColumnMinMaxValues?.min ?? 0
    const maxValue = valueColumnMinMaxValues?.max ?? 0
    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)
    const defaultColor = layerVisualizationSettings.balloonConf?.style?.color ?? ''

    data[target.name].rows.forEach((row) => {
        let sizeAndColor = null as { size: number; color: string } | null
        if (layerVisualizationSettings.balloonConf) {
            sizeAndColor = getSizeAndColorFromRanges(row[dataColumn], layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize, sortedRanges, defaultColor)
            if (!sizeAndColor) sizeAndColor = { size: 1, color: layerVisualizationSettings.balloonConf?.style.color ?? '' }
            layerVisualizationSettings.balloonConf.size = sizeAndColor.size
            layerVisualizationSettings.balloonConf.style.color = sizeAndColor.color
        }

        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf ?? null, row[dataColumn], spatialAttribute)
        markerBounds.push(marker.getLatLng())
        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
    })
}

const formatRanges = (ranges: IMapWidgetVisualizationThreshold[], valueColumnMinValue: number, valueColumnMaxValue: number): IMapWidgetVisualizationThreshold[] => {
    return ranges.map(({ color, from, to }) => ({
        color,
        from: Math.min(from ?? valueColumnMinValue, to ?? valueColumnMaxValue),
        to: Math.max(from ?? valueColumnMinValue, to ?? valueColumnMaxValue)
    }))
}

const sortRanges = (ranges: IMapWidgetVisualizationThreshold[]): IMapWidgetVisualizationThreshold[] => {
    return ranges.sort((a, b) => {
        if (a.from !== b.from) {
            return a.from - b.from
        }
        return a.to - b.to
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

const addBaloonMarkersClassifedByQuantilsUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget) => {
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
        if (feature.geometry?.type === 'Point') {
            addBaloonMarkerUsingLayersPointClassifedByQuantils(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, quantiles, null)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addBaloonMarkerUsingLayersPointClassifedByQuantils(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, quantiles, coord)
            })
        }
    })
}

const addBaloonMarkerUsingLayersPointClassifedByQuantils = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], quantiles: number[], coord: any[] | null) => {
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : valueKey
    validateNumber(value)

    if (!layerVisualizationSettings.balloonConf) return
    layerVisualizationSettings.balloonConf.size = getSizeFromQuantiles(quantiles, value as number, layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value as number, spatialAttribute)
    markerBounds.push(marker.getLatLng())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
}

const getQuantilesFromLayersData = (rows: number[], numQuantiles: number): number[] => {
    if (!rows || rows.length === 0 || numQuantiles < 1) {
        throw new Error('Invalid input: data array must not be empty, and numQuantiles must be at least 1.')
    }

    const sortedData = [...rows].sort((a, b) => a - b)
    const quantiles: number[] = []

    for (let i = 1; i < numQuantiles; i++) {
        const index = (i / numQuantiles) * (sortedData.length - 1)
        const lowerIndex = Math.floor(index)
        const upperIndex = Math.ceil(index)

        const quantileValue = lowerIndex === upperIndex ? sortedData[lowerIndex] : sortedData[lowerIndex] + (index - lowerIndex) * (sortedData[upperIndex] - sortedData[lowerIndex])

        quantiles.push(quantileValue)
    }

    return quantiles
}

const addBaloonMarkersClassifedByQuantilsFromData = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    if (!layerVisualizationSettings.balloonConf) return
    const quantiles = getQuantiles(data[target.name].rows, layerVisualizationSettings.balloonConf.classes, dataColumn)

    data[target.name].rows.forEach((row: any) => {
        if (layerVisualizationSettings.balloonConf) layerVisualizationSettings.balloonConf.size = getSizeFromQuantiles(quantiles, row[dataColumn], layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)

        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf ?? null, row[dataColumn], spatialAttribute)
        markerBounds.push(marker.getLatLng())
        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
    })
}

const getQuantiles = (rows: number[] | null, numQuantiles: number, valueColumn: string): number[] => {
    if (!rows || rows.length === 0 || numQuantiles < 1) {
        throw new Error('Invalid input: data array must not be empty, and numQuantiles must be at least 1.')
    }

    const sortedData = [...rows].sort((a, b) => a[valueColumn] - b[valueColumn])
    const values = sortedData.map((item) => item[valueColumn])
    const quantiles: number[] = []

    for (let i = 1; i < numQuantiles; i++) {
        const index = (i / numQuantiles) * (values.length - 1)
        const lowerIndex = Math.floor(index)
        const upperIndex = Math.ceil(index)

        const quantileValue = lowerIndex === upperIndex ? values[lowerIndex] : values[lowerIndex] + (index - lowerIndex) * (values[upperIndex] - values[lowerIndex])

        quantiles.push(quantileValue)
    }

    return quantiles
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

const addBaloonMarkersClassifiedByEqualIntervalsUsingLayers = (layersData: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, spatialAttribute: any, targetDatasetData?: any, dataColumn?: string) => {
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
        if (feature.geometry?.type === 'Point') {
            addBaloonMarkerUsingLayersPointClassifedByEqualIntervals(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, minValue, maxValue, null)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addBaloonMarkerUsingLayersPointClassifedByEqualIntervals(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, minValue, maxValue, coord)
            })
        }
    })
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
    coord: any[] | null
) => {
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : feature.properties[layerVisualizationSettings.targetProperty]

    validateNumber(value)

    if (layerVisualizationSettings.balloonConf) {
        layerVisualizationSettings.balloonConf.size = getSizeFromEqualIntervals(value as number, minValue, maxValue, layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)
    }

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf ?? null, value as number, spatialAttribute)
    markerBounds.push(marker.getLatLng())

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
}

const transformDataUsingForeginKey = (rows: any, pivotColumnIndex: string, valueColumnIndex: string) => {
    return rows.reduce((acc: number, row: any) => {
        acc[row[pivotColumnIndex]] = row[valueColumnIndex]
        return acc
    }, {})
}

const addBaloonMarkersClassifedByEqualIntervalsFromData = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    const valueColumnMinMaxValues = getMinMaxByName(data[target.name].stats, incrementColumnName(dataColumn))

    data[target.name].rows.forEach((row) => {
        if (layerVisualizationSettings.balloonConf)
            layerVisualizationSettings.balloonConf.size = getSizeFromEqualIntervals(
                row[dataColumn],
                valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER,
                valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER,
                layerVisualizationSettings.balloonConf.classes,
                layerVisualizationSettings.balloonConf.minSize,
                layerVisualizationSettings.balloonConf.maxSize
            )

        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf ?? null, row[dataColumn], spatialAttribute)
        markerBounds.push(marker.getLatLng())
        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
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

const validateNumber = (value: string | number): void => {
    if (isNaN(Number(value))) {
        throw new Error(`Value: "${value}" must be a number!`)
    }
}

export const addClusters = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any) => {
    const defaultClusterConfiguration = mapWidgetDefaultValues.getDefaultVisualizationClusterConfiguration()
    const maxClusterRadius = layerVisualizationSettings.clusterConf?.maxClusterRadius ?? defaultClusterConfiguration.maxClusterRadius
    const clusterIconRadius = layerVisualizationSettings?.clusterConf?.radiusSize ?? defaultClusterConfiguration.radiusSize
    const clusterIconFontSize = layerVisualizationSettings?.clusterConf?.style?.['font-size'] ?? defaultClusterConfiguration.style['font-size']
    const clusterIconFontColor = layerVisualizationSettings?.clusterConf?.style?.color ?? defaultClusterConfiguration.style.color
    const clusterIconBackgroundColor = layerVisualizationSettings?.clusterConf?.style?.['background-color'] ?? defaultClusterConfiguration.style['background-color']
    const clusters = L.markerClusterGroup({
        maxClusterRadius: maxClusterRadius,
        iconCreateFunction: function (cluster) {
            return L.divIcon({
                html: `<div style="
                    font-size: ${clusterIconFontSize};
                    background-color: ${clusterIconBackgroundColor};
                    color: ${clusterIconFontColor};
                    width: ${clusterIconRadius}px;
                    height: ${clusterIconRadius}px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                     user-select: none;">
                    ${cluster.getChildCount()}
                </div>`,
                className: 'custom-cluster-icon',
                iconSize: L.Point(clusterIconRadius, clusterIconRadius)
            })
        }
    })

    clusters.knProperties = { cluster: true, layerId: target.layerId }
    if (data && data[target.name]) {
        addClustersFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, clusters)
    } else {
        addClustersUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, clusters)
    }
}

const addClustersFromData = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], clusters: any) => {
    for (const row of data[target.name].rows) {
        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.markerConf ?? null, row[dataColumn], spatialAttribute)
        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
        clusters.addLayer(marker)
        markerBounds.push(marker.getLatLng())
    }
    layerGroup.addLayer(clusters)
}

const addClustersUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, clusters: any) => {
    let mappedData: Record<string, number> | null = null

    if (targetDatasetData && dataColumn) {
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw new Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)
        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addClusterUsingLayersFeature(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, clusters, null)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addClusterUsingLayersFeature(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, clusters, coord)
            })
        }
    })
    layerGroup.addLayer(clusters)
}

const addClusterUsingLayersFeature = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], clusters: any, coord: any[] | null) => {
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : valueKey

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.markerConf ?? null, value as any, spatialAttribute)
    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    clusters.addLayer(marker)
    markerBounds.push(marker.getLatLng())
}

// Showing only the defined data, no measures, no extra logic. It will show all Point, LineString and Polygon from WKT.
export const addGeography = (data: any, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, markerBounds: any[], layersData: any, map: any) => {
    if (data && data[target.name]) {
        addGeograhyFromData(data, target, dataColumn, spatialAttribute, geoColumn, layerGroup, markerBounds)
    } else {
        addGeographyUsingLayers(layersData, spatialAttribute, layerGroup, markerBounds, map)
    }
}

const addGeograhyFromData = (data: any, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, markerBounds: any[]) => {
    for (const row of data[target.name].rows) {
        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, null, row[dataColumn], spatialAttribute)
        markerBounds.push(marker.getLatLng())
    }
}

const addGeographyUsingLayers = (layersData: any, spatialAttribute: any, layerGroup: any, markerBounds: any[], map: any) => {
    layersData.features.forEach((feature: ILayerFeature) => {
        const type = feature.geometry?.type
        if (!type) return
        if (type === 'Point') {
            const coordinates = getCoordinatesFromWktPointFeature(feature)
            const marker = addMarker(coordinates.reverse(), layerGroup, null, 0, spatialAttribute)
            markerBounds.push(marker.getLatLng())
        } else if (type === 'MultiPoint') {
            const multiPointCoords = (feature.geometry.coordinates as any).map(([x, y]: [number, number]) => [y, x])
            L.layerGroup(multiPointCoords.map((coord) => L.marker(coord).addTo(map))).addTo(map)
        } else if (type === 'LineString') {
            L.polyline(feature.geometry.coordinates.reverse(), { color: 'blue' }).addTo(map)
        } else if (type === 'MultiLineString') {
            const multiLineCoords = (feature.geometry.coordinates as any).map((line: any) => line.map(([x, y]: [number, number]) => [y, x]))
            L.layerGroup(multiLineCoords.map((coords: number[]) => L.polyline(coords, { color: 'blue' }).addTo(map))).addTo(map)
        } else if (type === 'Polygon' || type === 'MultiPolygon') {
            let polygonCoords: any
            if (type === 'Polygon') {
                polygonCoords = (feature.geometry.coordinates as any).map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x]))
            } else if (type === 'MultiPolygon') {
                polygonCoords = (feature.geometry.coordinates as any).map((polygon: any) => polygon.map((ring: any) => ring.map(([x, y]: [number, number]) => [y, x])))
            }

            L.polygon(polygonCoords).addTo(map)
        }
    })
}

const getCoordinatesFromWktPointFeature = (feature: any) => {
    if (!feature?.geometry || !feature?.geometry.coordinates) return []
    return feature.geometry.coordinates.length > 2 ? feature.geometry.coordinates.slice(0, 2) : feature.geometry.coordinates
}
