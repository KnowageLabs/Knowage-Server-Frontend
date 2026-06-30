import { IDashboardDriver, IVariable } from '../Dashboard'

export interface IDashboardPlaceholderOption {
    label: string
    placeholder: string
}

const getUniquePlaceholderOptions = (options: IDashboardPlaceholderOption[]) => {
    const placeholdersMap = new Map<string, IDashboardPlaceholderOption>()
    options.forEach((option) => {
        if (!placeholdersMap.has(option.placeholder)) placeholdersMap.set(option.placeholder, option)
    })
    return Array.from(placeholdersMap.values())
}

export const getDashboardParameterPlaceholder = (driverUrlName: string) => `$P{${driverUrlName}}`

export const getDashboardVariablePlaceholder = (variableName: string, variableKey?: string | null) => {
    return variableKey ? `$V{${variableName}.${variableKey}}` : `$V{${variableName}}`
}

export const getDashboardParameterPlaceholderOptions = (drivers: IDashboardDriver[] = []) => {
    const options = drivers
        .filter((driver) => !!driver?.urlName)
        .map((driver) => ({
            label: driver.driverLabel || driver.name || driver.urlName,
            placeholder: getDashboardParameterPlaceholder(driver.urlName)
        }))

    return getUniquePlaceholderOptions(options)
}

export const getDashboardVariablePlaceholderOptions = (variables: IVariable[] = []) => {
    const options = variables
        .filter((variable) => !!variable?.name)
        .flatMap((variable) => {
            if (variable.type !== 'dataset' || variable.column) return [{ label: variable.name, placeholder: getDashboardVariablePlaceholder(variable.name) }]

            const variableKeys = variable.pivotedValues ? Object.keys(variable.pivotedValues) : []
            return variableKeys.map((variableKey) => ({
                label: `${variable.name}.${variableKey}`,
                placeholder: getDashboardVariablePlaceholder(variable.name, variableKey)
            }))
        })

    return getUniquePlaceholderOptions(options)
}
