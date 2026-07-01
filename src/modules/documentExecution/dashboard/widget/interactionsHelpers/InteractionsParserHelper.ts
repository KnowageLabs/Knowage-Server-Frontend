import { IDashboardDriver, IVariable } from '../../Dashboard'
import { columnFieldRegex, parameterTextCompatibilityRegex, variableTextCompatibilityRegex } from '../../helpers/common/DashboardRegexHelper'

const driverDescriptionSuffix = '_description'

const getDriverValueByPlaceholder = (drivers: IDashboardDriver[], parameterName: string, key: 'urlName' | 'name') => {
    if (!drivers?.length) return ''

    const exactMatchDriver = drivers.find((driver: IDashboardDriver) => driver[key] === parameterName)
    if (exactMatchDriver) return exactMatchDriver.value ?? ''

    if (!parameterName.endsWith(driverDescriptionSuffix)) return ''

    const driverName = parameterName.substring(0, parameterName.length - driverDescriptionSuffix.length)
    const descriptionMatchDriver = drivers.find((driver: IDashboardDriver) => driver[key] === driverName)
    return descriptionMatchDriver?.description ?? ''
}

export const replaceVariablesPlaceholdersByVariableName = (originalValue: string | number, variables: IVariable[]) => {
    if (!originalValue) return originalValue

    if (typeof originalValue !== 'string') {
        try {
            originalValue = originalValue.toString()
        } catch (error) {
            return ''
        }
    }

    originalValue = originalValue.replace(variableTextCompatibilityRegex, (match: string, variableName: string) => {
        if (!variables?.length) return ''

        const dashboardVariable = variables.find((variable: IVariable) => variable.name === variableName)
        if (dashboardVariable) return dashboardVariable.value ?? ''

        const separatorIndex = variableName.indexOf('.')
        if (separatorIndex === -1) return ''

        const variableKey = variableName.substring(separatorIndex + 1)
        const selectedVariableName = variableName.substring(0, separatorIndex)
        const pivotedVariable = variables.find((variable: IVariable) => variable.name === selectedVariableName)
        if (!pivotedVariable?.pivotedValues) return ''

        return pivotedVariable.pivotedValues[variableKey] ?? ''
    })
    return originalValue
}

export const replaceDriversPlaceholdersByDriverUrlName = (originalString: string, drivers: IDashboardDriver[]) => {
    if (!originalString) return originalString

    originalString = originalString.replace(parameterTextCompatibilityRegex, (match: string, parameterName: string) => {
        return getDriverValueByPlaceholder(drivers, parameterName, 'urlName')
    })
    return originalString
}

export const replaceDriversPlaceholdersByDriverName = (originalString: string, drivers: IDashboardDriver[]) => {
    if (!originalString) return originalString

    originalString = originalString.replace(parameterTextCompatibilityRegex, (match: string, parameterName: string) => {
        return getDriverValueByPlaceholder(drivers, parameterName, 'name')
    })
    return originalString
}

export const replaceVariablesAndDriversPlaceholders = (originalString: string, variables: IVariable[], drivers: IDashboardDriver[]) => {
    if (!originalString) return originalString

    let formattedString = replaceVariablesPlaceholdersByVariableName(originalString, variables)
    formattedString = replaceDriversPlaceholdersByDriverUrlName(formattedString, drivers)
    return formattedString
}

export const replaceFieldPlaceholdersByColumnName = (originalString: string, formattedRow: any) => {
    if (!originalString) return originalString

    originalString = originalString.replace(columnFieldRegex, (match: string, fieldName: string) => {
        return formattedRow[fieldName] ? formattedRow[fieldName].value : ''
    })
    return originalString
}
