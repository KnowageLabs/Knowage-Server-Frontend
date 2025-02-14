import { IWidget } from '../../../Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationThreshold, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addDialogToMarker, addDialogToMarkerBojan, addMarker, addTooltipToMarker, addTooltipToMarkerBojan, getColumnName, getCoordinates, VisualizationDataType } from '../LeafletHelper'

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
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifedByRangesFromLayersData(layersData, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifedByRangesFromDataAndLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model)
            } else {
                addBaloonMarkersClassifedByRangesFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
            }
            break
        case 'CLASSIFY_BY_QUANTILS':
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifedByQuantilsFromLayersData(layersData, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifedByQuantilsFromDataAndLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds)
            } else {
                addBaloonMarkersClassifedByQuantilsFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
            }
            break
        default:
            if (visualizationDataType === VisualizationDataType.LAYER_ONLY) {
                addBaloonMarkersClassifedByEqualIntervalsFromLayersData(layersData, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds)
            } else if (visualizationDataType === VisualizationDataType.DATASET_AND_LAYER) {
                addBaloonMarkersClassifedByEqualIntervalsFromDataAndLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds)
            } else {
                addBaloonMarkersClassifedByEqualIntervalsFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
            }
    }
}

const getNumericPropertyValues = (geojson: any, propertyName: string): number[] => {
    const values = geojson.features.map((feature: any) => {
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

const addBaloonMarkersClassifedByRangesFromLayersData = (layersData: any, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    let layerPropertyValues = [] as number[]
    if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
        layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
    }

    const ranges = layerVisualizationSettings.balloonConf?.properties?.thresholds ?? []
    const minValue = Math.min(...layerPropertyValues) ?? 0
    const maxValue = Math.max(...layerPropertyValues) ?? 0

    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)
    const defaultColor = layerVisualizationSettings.balloonConf?.style?.color ?? ''

    layersData.features.forEach((feature: any) => {
        const value = feature.properties[layerVisualizationSettings.targetProperty]
        let sizeAndColor = null as { size: number; color: string } | null
        if (layerVisualizationSettings.balloonConf) {
            sizeAndColor = getSizeAndColorFromRanges(value, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize, sortedRanges, defaultColor)
            if (!sizeAndColor) sizeAndColor = { size: 1, color: layerVisualizationSettings.balloonConf?.style.color ?? '' }
            layerVisualizationSettings.balloonConf.size = sizeAndColor.size
            layerVisualizationSettings.balloonConf.style.color = sizeAndColor.color
        }

        const marker = addMarker(feature.geometry.coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value, spatialAttribute)
        markerBounds.push(marker.getLatLng())
        // addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        // addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
    })
}

const addBaloonMarkersClassifedByRangesFromDataAndLayers = (targetDatasetData: any, layersData: any, dataColumn: string, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget) => {
    const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, incrementColumnName(dataColumn))
    const ranges = layerVisualizationSettings.balloonConf?.properties?.thresholds ?? []
    const minValue = valueColumnMinMaxValues?.min ?? 0
    const maxValue = valueColumnMinMaxValues?.max ?? 0
    const formattedRanges = formatRanges(ranges, minValue, maxValue)
    const sortedRanges = sortRanges(formattedRanges)
    const defaultColor = layerVisualizationSettings.balloonConf?.style?.color ?? ''

    const pivotColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
    if (!pivotColumnName) throw Error('Foreign key column ' + layerVisualizationSettings.targetProperty + ' is not present in the dataset')
    const mappedData = transformDataUsingForeginKey(targetDatasetData.rows, pivotColumnName, dataColumn)

    layersData.features.forEach((feature: any) => {
        const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
        const value = mappedData[valueKey]

        let sizeAndColor = null as { size: number; color: string } | null
        if (layerVisualizationSettings.balloonConf) {
            sizeAndColor = getSizeAndColorFromRanges(value, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize, sortedRanges, defaultColor)
            if (!sizeAndColor) sizeAndColor = { size: 1, color: layerVisualizationSettings.balloonConf?.style.color ?? '' }
            layerVisualizationSettings.balloonConf.size = sizeAndColor.size
            layerVisualizationSettings.balloonConf.style.color = sizeAndColor.color
        }

        const marker = addMarker(feature.geometry.coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value, spatialAttribute)
        markerBounds.push(marker.getLatLng())

        addDialogToMarkerBojan(widgetModel, layerVisualizationSettings, value, marker)
        addTooltipToMarkerBojan(widgetModel, layerVisualizationSettings, value, marker)
    })
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

        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf, row[dataColumn], spatialAttribute)
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

const addBaloonMarkersClassifedByQuantilsFromLayersData = (layersData: any, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    if (!layerVisualizationSettings.balloonConf) return

    let layerPropertyValues = [] as number[]
    if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
        layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
    }

    const quantiles = getQuantilesFromLayersData(layerPropertyValues, layerVisualizationSettings.balloonConf.classes)

    layersData.features.forEach((feature: any) => {
        const value = feature.properties[layerVisualizationSettings.targetProperty]
        if (layerVisualizationSettings.balloonConf) layerVisualizationSettings.balloonConf.size = getSizeFromQuantiles(quantiles, value, layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)

        const marker = addMarker(feature.geometry.coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value, spatialAttribute)
        markerBounds.push(marker.getLatLng())
        // addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        // addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
    })
}

const getQuantilesFromLayersData = (rows: number[], numQuantiles: number): number[] => {
    if (!rows || rows.length === 0 || numQuantiles < 1) {
        throw new Error('Invalid input: data array must not be empty, and numQuantiles must be at least 1.')
    }

    const sortedData = [...rows].sort((a, b) => a - b) // Sort in ascending order
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

const addBaloonMarkersClassifedByQuantilsFromDataAndLayers = (targetDatasetData: any, layersData: any, dataColumn: string, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    if (!layerVisualizationSettings.balloonConf) return

    const quantiles = getQuantiles(targetDatasetData.rows, layerVisualizationSettings.balloonConf.classes, dataColumn)
    const pivotColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
    if (!pivotColumnName) throw Error('Foreign key column ' + layerVisualizationSettings.targetProperty + ' is not present in the dataset')
    const mappedData = transformDataUsingForeginKey(targetDatasetData.rows, pivotColumnName, dataColumn)

    layersData.features.forEach((feature: any) => {
        const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
        const value = mappedData[valueKey]

        if (layerVisualizationSettings.balloonConf) layerVisualizationSettings.balloonConf.size = getSizeFromQuantiles(quantiles, value, layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)
        const marker = addMarker(feature.geometry.coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value, spatialAttribute)
        markerBounds.push(marker.getLatLng())

        // TODO - Change Dialog and Tooltip
        // addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        // addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
    })
}

const addBaloonMarkersClassifedByQuantilsFromData = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    if (!layerVisualizationSettings.balloonConf) return
    const quantiles = getQuantiles(data[target.name].rows, layerVisualizationSettings.balloonConf.classes, dataColumn)

    data[target.name].rows.forEach((row) => {
        if (layerVisualizationSettings.balloonConf) layerVisualizationSettings.balloonConf.size = getSizeFromQuantiles(quantiles, row[dataColumn], layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)

        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf, row[dataColumn], spatialAttribute)
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

const addBaloonMarkersClassifedByEqualIntervalsFromLayersData = (layersData: any, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    let layerPropertyValues = [] as number[]
    if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
        layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
    }

    const minValue = Math.min(...layerPropertyValues) ?? 0
    const maxValue = Math.max(...layerPropertyValues) ?? 0

    layersData.features.forEach((feature: any) => {
        const value = feature.properties[layerVisualizationSettings.targetProperty]
        if (layerVisualizationSettings.balloonConf) layerVisualizationSettings.balloonConf.size = getSizeFromEqualIntervals(value, minValue, maxValue, layerVisualizationSettings.balloonConf.classes, layerVisualizationSettings.balloonConf.minSize, layerVisualizationSettings.balloonConf.maxSize)

        const marker = addMarker(feature.geometry.coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value, spatialAttribute)
        markerBounds.push(marker.getLatLng())

        // TODO - Change Dialog and Tooltip
        // addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        // addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
    })
}

const addBaloonMarkersClassifedByEqualIntervalsFromDataAndLayers = (targetDatasetData: any, layersData: any, dataColumn: string, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    if (!layerVisualizationSettings.targetDataset) return

    const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, incrementColumnName(dataColumn))
    const pivotColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
    if (!pivotColumnName) throw Error('Foreign key column ' + layerVisualizationSettings.targetProperty + ' is not present in the dataset')
    const mappedData = transformDataUsingForeginKey(targetDatasetData.rows, pivotColumnName, dataColumn)

    layersData.features.forEach((feature: any) => {
        const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
        const value = mappedData[valueKey]

        if (layerVisualizationSettings.balloonConf)
            layerVisualizationSettings.balloonConf.size = getSizeFromEqualIntervals(
                value,
                valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER,
                valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER,
                layerVisualizationSettings.balloonConf.classes,
                layerVisualizationSettings.balloonConf.minSize,
                layerVisualizationSettings.balloonConf.maxSize
            )

        const marker = addMarker(feature.geometry.coordinates.reverse(), layerGroup, layerVisualizationSettings.balloonConf, value, spatialAttribute)
        markerBounds.push(marker.getLatLng())

        // TODO - Change Dialog and Tooltip
        // addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        // addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
    })
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

        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.balloonConf, row[dataColumn], spatialAttribute)
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
