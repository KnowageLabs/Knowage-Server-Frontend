import { IAssociation, IAssociationField } from '../../Dashboard'

// A parameter takes part in an association as '$P{name}'; a column takes part by its alias
export const getParameterColumn = (parameterName: string) => `$P{${parameterName}}`

export const getDatasetLabel = (datasetId: number, datasets: any[]) => datasets.find((dataset) => dataset.id.dsId === datasetId)?.label ?? String(datasetId)

export const getFieldLabel = (field: IAssociationField, datasets: any[]) => `${getDatasetLabel(field.dataset, datasets)}.${field.column}`

// 'SALES.region = STORES.region'; empty for an association with no fields
export const getAssociationSummary = (association: IAssociation, datasets: any[]) => association.fields.map((field) => getFieldLabel(field, datasets)).join(' = ')

const getFieldKey = (datasetId: number, column: string) => `${datasetId}|${column}`

// For every field, the summaries of the associations that use it, except the given one
export const getFieldUsage = (associations: IAssociation[], excludedAssociation: IAssociation | null, datasets: any[]) => {
    const usage = {} as Record<string, string[]>
    associations.forEach((association) => {
        if (association === excludedAssociation) return
        const summary = getAssociationSummary(association, datasets)
        association.fields.forEach((field) => {
            const key = getFieldKey(field.dataset, field.column)
            usage[key] = [...(usage[key] ?? []), summary]
        })
    })
    return (datasetId: number, column: string): string[] => usage[getFieldKey(datasetId, column)] ?? []
}
