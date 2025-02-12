import { IWidget } from '../../../Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationThreshold, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addDialogToMarker, addMarker, addTooltipToMarker, getCoordinates } from '../LeafletHelper'

export const addBaloonMarkers = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
    if (!layerVisualizationSettings.balloonConf) return
    const valueColumnMinMaxValues = getMinMaxByName(data[target.name].stats, incrementColumnName(dataColumn))
    switch (layerVisualizationSettings.balloonConf.method) {
        case 'CLASSIFY_BY_RANGES':
            addBaloonMarkersClassifedByRanges(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, valueColumnMinMaxValues)
            break
        case 'CLASSIFY_BY_QUANTILS':
            addBaloonMarkersClassifedByQuantils(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds)
            break
        default:
            addBaloonMarkersClassifedByEqualIntervals(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, valueColumnMinMaxValues)
    }
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

const addBaloonMarkersClassifedByRanges = (
    data: any,
    model: IWidget,
    target: IMapWidgetLayer,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    markerBounds: any[],
    valueColumnMinMaxValues: { min: number; max: number } | null
) => {
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

const addBaloonMarkersClassifedByQuantils = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[]) => {
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

const addBaloonMarkersClassifedByEqualIntervals = (
    data: any,
    model: IWidget,
    target: IMapWidgetLayer,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    markerBounds: any[],
    valueColumnMinMaxValues: { min: number; max: number } | null
) => {
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
