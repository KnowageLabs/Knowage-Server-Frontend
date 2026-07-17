import { AxiosResponse } from 'axios'

const disableErrors = { headers: { 'X-Disable-Errors': 'true' } }

// Builds a { datasetLabel: columnName[] } map for the datasets used by a target dashboard document.
// Used by the cross-navigation editor so the user can pick an explicit target dataset/column to propagate a selection into.
// Returns an empty map when the target is not a dashboard, has no template, or any request fails (feature degrades gracefully).
export async function loadTargetDashboardDatasetsColumnsMap(targetDocumentId: number, $http: any): Promise<Record<string, string[]>> {
    const map: Record<string, string[]> = {}
    if (!targetDocumentId) return map

    const templates = await $http
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${targetDocumentId}/templates`, disableErrors)
        .then((response: AxiosResponse<any>) => response.data)
        .catch(() => [])
    if (!templates?.length) return map

    const activeTemplate = templates.find((template: any) => template.active) ?? templates[0]
    if (!activeTemplate?.id) return map

    const template = await $http
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${targetDocumentId}/templates/selected/${activeTemplate.id}`, disableErrors)
        .then((response: AxiosResponse<any>) => response.data)
        .catch(() => null)

    const targetDatasets = template?.configuration?.datasets
    if (!targetDatasets?.length) return map

    const datasetIds = targetDatasets.map((dataset: any) => dataset.id ?? dataset.dsId).filter((id: any) => id != null)
    if (!datasetIds.length) return map

    const datasets = await $http
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/?asPagedList=true&seeTechnical=true&ids=${datasetIds.join(',')}`, disableErrors)
        .then((response: AxiosResponse<any>) => response.data?.item ?? [])
        .catch(() => [])

    datasets.forEach((dataset: any) => {
        map[dataset.label] = (dataset.metadata?.fieldsMeta ?? []).map((field: any) => field.name)
    })
    return map
}
