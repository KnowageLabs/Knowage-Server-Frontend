import { IDashboardDriver, IVariable } from '../../Dashboard'
import { columnFieldRegex, parameterTextCompatibilityRegex, variableTextCompatibilityRegex } from '../../helpers/common/DashboardRegexHelper'

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
        if (variables && variables.length > 0) {
            const dashboardVariable = variables.find((variable: IVariable) => variable.name === variableName)
            if (dashboardVariable) return dashboardVariable.value ?? ''
        }
        return ''
    })
    return originalValue
}

export const replaceDriversPlaceholdersByDriverUrlName = (originalString: string, drivers: IDashboardDriver[]) => {
    if (!originalString) return originalString

    originalString = originalString.replace(parameterTextCompatibilityRegex, (match: string, parameterName: string) => {
        if (drivers && drivers.length > 0) {
            const dashboardVariable = drivers.find((driver: IDashboardDriver) => driver.urlName === parameterName)
            if (dashboardVariable) return dashboardVariable.value ?? ''
        }
        return ''
    })
    return originalString
}

export const replaceDriversPlaceholdersByDriverName = (originalString: string, drivers: IDashboardDriver[]) => {
    if (!originalString) return originalString

    originalString = originalString.replace(parameterTextCompatibilityRegex, (match: string, parameterName: string) => {
        if (drivers && drivers.length > 0) {
            const dashboardVariable = drivers.find((driver: IDashboardDriver) => driver.name === parameterName)
            if (dashboardVariable) return dashboardVariable.value ?? ''
        }
        return ''
    })
    return originalString
}

export const replaceFieldPlaceholdersByColumnName = (originalString: string, formattedRow: any) => {
    if (!originalString) return originalString

    originalString = originalString.replace(columnFieldRegex, (match: string, fieldName: string) => {
        return formattedRow[fieldName] ? formattedRow[fieldName].value : ''
    })
    return originalString
}
