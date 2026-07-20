import { formatNumberWithLocale } from '@/helpers/commons/localeHelper'

const MAX_LEGEND_DECIMALS = 6
type LegendRangeBoundary = 'min' | 'max'

const normalizeLegendValue = (value: number) => Number.parseFloat(value.toFixed(MAX_LEGEND_DECIMALS))

const getLegendPrecision = (value: number): number => {
    const decimalPart = value.toString().split('.')[1]
    return decimalPart ? decimalPart.length : 0
}

export const formatMapLegendNumber = (value: number | null | undefined, integer: boolean = false): string => {
    if (value === null || value === undefined) return 'N/A'

    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return 'N/A'

    if (integer) {
        const roundedValue = Math.round(numericValue)
        return formatNumberWithLocale(roundedValue, 0)
    }

    const normalizedValue = normalizeLegendValue(numericValue)
    return formatNumberWithLocale(normalizedValue, getLegendPrecision(normalizedValue))
}

const formatMapLegendRangeBoundary = (value: number | null | undefined, boundary: LegendRangeBoundary, openEnded: boolean = false): string => {
    if (openEnded || value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) return boundary
    return formatMapLegendNumber(value)
}

export const formatMapLegendRangeLabel = (min: number | null | undefined, max: number | null | undefined, openStart: boolean = false, openEnd: boolean = false): string => {
    const formattedMin = formatMapLegendRangeBoundary(min, 'min', openStart)
    const formattedMax = formatMapLegendRangeBoundary(max, 'max', openEnd)
    return `[${formattedMin}-${formattedMax}]`
}
