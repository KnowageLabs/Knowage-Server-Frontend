import deepcopy from 'deepcopy'
import { IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetConditionalStyle, IMapWidgetLayerFilter, IMapWidgetVisualizationThreshold, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { replaceVariablesPlaceholdersByVariableName } from '../../interactionsHelpers/InteractionsParserHelper'

export const transformDataUsingForeginKey = (rows: any, pivotColumnIndex: string, valueColumnIndex: string) => {
    return rows.reduce((acc: number, row: any) => {
        acc[row[pivotColumnIndex]] = row[valueColumnIndex]
        return acc
    }, {})
}

export const getCoordinatesFromWktPointFeature = (feature: any) => {
    if (!feature?.geometry || !feature?.geometry.coordinates) return []
    return feature.geometry.coordinates.length > 2 ? feature.geometry.coordinates.slice(0, 2) : feature.geometry.coordinates
}

export const getMinMaxByName = (data: Record<string, any>, columnName: string): { min: number; max: number } | null => {
    for (const key in data) {
        if (data[key].name === columnName) {
            const min = parseFloat(data[key].min.toString().split(' ')[0])
            const max = parseFloat(data[key].max.toString().split(' ')[0])

            return { min, max }
        }
    }
    return null
}

export const incrementColumnName = (columnName: string): string => {
    const match = columnName.match(/^column_(\d+)$/)

    if (match) {
        const nextNumber = parseInt(match[1], 10) + 1
        return `column_${nextNumber}`
    }

    throw new Error('Invalid column name format')
}

export const getQuantiles = (rows: number[] | null, numQuantiles: number, valueColumn: string): number[] => {
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

export const getNumericPropertyValues = (geojson: any, propertyName: string): number[] => {
    const values = geojson.features.map((feature: ILayerFeature) => {
        const value = feature.properties[propertyName]

        if (typeof value !== 'number') {
            throw new Error(`Property "${propertyName}" contains a non-numeric value: ${value}`)
        }

        return value
    })

    return values
}

export const getQuantilesFromLayersData = (rows: number[], numQuantiles: number): number[] => {
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

export const validateNumber = (value: string | number): void => {
    if (isNaN(Number(value))) {
        throw new Error(`Value: "${value}" must be a number!`)
    }
}

export const formatRanges = (ranges: IMapWidgetVisualizationThreshold[], valueColumnMinValue: number, valueColumnMaxValue: number): IMapWidgetVisualizationThreshold[] => {
    return ranges.map(({ color, from, to }) => ({
        color,
        from: Math.min(from ?? valueColumnMinValue, to ?? valueColumnMaxValue),
        to: Math.max(from ?? valueColumnMinValue, to ?? valueColumnMaxValue)
    }))
}

export const sortRanges = (ranges: IMapWidgetVisualizationThreshold[]): IMapWidgetVisualizationThreshold[] => {
    return ranges.sort((a, b) => {
        if (a.from !== b.from) {
            return a.from - b.from
        }
        return a.to - b.to
    })
}

export const getVizualizationConditionalStyles = (widgetModel: IWidget, target: string, targetProperty: string, valueToCompare: any, variables: IVariable[], targetDataset?: string | undefined) => {
    const conditionalStyles = widgetModel.settings?.conditionalStyles
    if (!conditionalStyles || !conditionalStyles.enabled) return null
    let style = null as any

    const conditionalStyle = conditionalStyles.conditions?.find((tempConditionalStyle: IMapWidgetConditionalStyle) => (tempConditionalStyle.targetLayer === target || tempConditionalStyle.targetLayer === targetDataset) && tempConditionalStyle.targetColumn === targetProperty)

    if (conditionalStyle) {
        const tempConditionalStyle = deepcopy(conditionalStyle)
        if (tempConditionalStyle.condition.value) tempConditionalStyle.condition.value = replaceVariablesPlaceholdersByVariableName(tempConditionalStyle.condition.value, variables)
        if (tempConditionalStyle.condition.value != null) tempConditionalStyle.condition.value = +tempConditionalStyle.condition.value
        if (isConditionMet(tempConditionalStyle.condition, valueToCompare)) style = tempConditionalStyle.properties
    }

    return style
}

export const isConditionMet = (condition: any, valueToCompare: string) => {
    let fullfilledCondition = false
    if (!condition || !condition.operator) return true

    switch (condition.operator) {
        case '=':
        case '==':
            fullfilledCondition = valueToCompare == condition.value
            break
        case '>=':
            fullfilledCondition = valueToCompare >= condition.value
            break
        case '<=':
            fullfilledCondition = valueToCompare <= condition.value
            break
        case 'IN':
            fullfilledCondition = condition.value.split(',').indexOf(valueToCompare) != -1
            break
        case '>':
            fullfilledCondition = valueToCompare > condition.value
            break
        case '<':
            fullfilledCondition = valueToCompare < condition.value
            break
        case '!=':
            fullfilledCondition = valueToCompare != condition.value
            break
    }
    return fullfilledCondition
}

export const transformDataUsingForeignKeyReturningAllColumns = (rows: any[], pivotColumnIndex: string) => {
    return rows.reduce((acc: Record<string, any>, row: any) => {
        acc[row[pivotColumnIndex]] = { ...row }
        return acc
    }, {})
}
