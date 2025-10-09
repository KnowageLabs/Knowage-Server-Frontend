import { formatNumber } from './qbeHelpers'

export function setInputDataType(columnType: string) {
    switch (columnType) {
        case 'int':
        case 'float':
        case 'decimal':
        case 'long':
            return 'number'
        case 'date':
            return 'date'
        default:
            return 'text'
    }
}

export function getInputStep(dataType: string) {
    if (dataType === 'float') {
        return '.01'
    } else if (dataType === 'int') {
        return '1'
    } else {
        return 'any'
    }
}

export const numberFormatRegex = '^(####|#.###|#,###){1}([,.]?)(#*)$' //eslint-disable-line no-useless-escape

export const formatRegistryNumber = (column: any) => {
    const configTypeToUse = column.type ?? column.columnInfo?.type
    const precisionToUse = column.precision ?? column.columnInfo?.precision

    if (configTypeToUse === 'int' || !configTypeToUse) return { useGrouping: true, minFractionDigits: 0, maxFractionDigits: 0 }
    return { useGrouping: true, minFractionDigits: precisionToUse ?? 2, maxFractionDigits: precisionToUse ?? 2 }
}

const isFrontendFormatCompatibleWithBackendFormat = (column: any, frontendConfiguration: { useGrouping: boolean; minFractionDigits: number; maxFractionDigits: number }) => {
    const backendNumberConfiguration = formatNumber(column.columnInfo)
    return frontendConfiguration.maxFractionDigits <= backendNumberConfiguration?.minFractionDigits
}
