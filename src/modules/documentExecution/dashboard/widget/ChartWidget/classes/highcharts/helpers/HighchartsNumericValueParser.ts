export const parseHighchartsNumericValue = (value: any): number | null => {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    if (typeof value !== 'string') return null

    const normalizedValue = normalizeNumericString(value)
    if (!normalizedValue) return null

    const parsedValue = Number(normalizedValue)
    return Number.isFinite(parsedValue) ? parsedValue : null
}

const normalizeNumericString = (value: string) => {
    const sanitizedValue = value.trim().replace(/[\s\u00A0']/g, '')
    if (!sanitizedValue) return null

    const loweredValue = sanitizedValue.toLowerCase()
    if (loweredValue === 'null' || loweredValue === 'auto') return null

    const lastCommaIndex = sanitizedValue.lastIndexOf(',')
    const lastDotIndex = sanitizedValue.lastIndexOf('.')

    if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
        const decimalSeparator = lastCommaIndex > lastDotIndex ? ',' : '.'
        const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
        return sanitizedValue.split(thousandsSeparator).join('').replace(decimalSeparator, '.')
    }

    if (lastCommaIndex !== -1) {
        if (/^[+-]?\d{1,3}(,\d{3})+$/.test(sanitizedValue)) return sanitizedValue.replace(/,/g, '')
        return sanitizedValue.replace(',', '.')
    }

    if (lastDotIndex !== -1 && /^[+-]?\d{1,3}(\.\d{3})+$/.test(sanitizedValue)) {
        return sanitizedValue.replace(/\./g, '')
    }

    return sanitizedValue
}
