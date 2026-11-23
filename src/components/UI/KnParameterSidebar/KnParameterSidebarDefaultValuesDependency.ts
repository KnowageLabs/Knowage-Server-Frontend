import type { iParameter } from './KnParameterSidebar'
import { getValidDate } from '@/modules/documentExecution/main/DocumentExecutionHelpers'

export interface DefaultValue {
    value: string | number | null
    description: string | null
}

export const getDefaultValueDependencyOrder = (parameters: iParameter[]): iParameter[] => {
    const sorted: iParameter[] = []
    const visiting = new Set<iParameter>()
    const visited = new Set<iParameter>()
    const visit = (parameter: iParameter) => {
        if (visited.has(parameter) || !parameter.dependencies?.defaultValue?.length) return
        if (visiting.has(parameter)) throw new Error('Cyclic default value dependencies')
        visiting.add(parameter)
        parameter.dependencies.defaultValue.forEach((urlName) => {
            const parent = parameters.find((candidate) => candidate.urlName === urlName)
            if (parent) visit(parent)
        })
        visiting.delete(parameter)
        visited.add(parameter)
        sorted.push(parameter)
    }
    parameters.forEach(visit)
    return sorted
}

export const applyRecalculatedDefaultValues = (parameter: iParameter, defaults: DefaultValue[], dateFormat: string) => {
    const columns = parameter.metadata?.colsMap ?? {}
    const valueColumn = Object.keys(columns).find((key) => columns[key] === parameter.metadata.valueColumn)
    const descriptionColumn = Object.keys(columns).find((key) => columns[key] === parameter.metadata.descriptionColumn)
    const values = defaults.flatMap((item) => {
        if (!item || !Object.prototype.hasOwnProperty.call(item, 'value')) throw new Error('Invalid default value')
        if (item.value == null || item.value === '') return []
        if (typeof item.value !== 'string' && typeof item.value !== 'number') throw new Error('Invalid default value')
        const description = String(item.description ?? item.value)
        const row: { value: string | number; desc: string; [key: string]: string | number } = { value: item.value, desc: description }
        if (valueColumn) row[valueColumn] = item.value
        if (descriptionColumn && descriptionColumn !== valueColumn) row[descriptionColumn] = description
        const value = parameter.type === 'DATE' && !parameter.selectionType ? getValidDate('' + item.value, dateFormat) : item.value
        if (parameter.type === 'DATE' && !parameter.selectionType && value === '') throw new Error('Invalid default date')
        return [{ row, selection: { value, description } }]
    })
    parameter.driverDefaultValue = values.map((value) => value.row)
    parameter.parameterValue = values.map((value) => value.selection)
    if (!parameter.multivalue) parameter.parameterValue = parameter.parameterValue.length ? parameter.parameterValue.slice(0, 1) : [{ value: parameter.type === 'DATE' ? null : '', description: '' }]
    parameter.initialValue = parameter.parameterValue[0]?.value
}
