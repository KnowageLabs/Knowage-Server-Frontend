import axios, { AxiosResponse } from 'axios'
import { condensedParameters } from '../schedulerHelpers'

// The document, role and parameter calls shared by the documents card (parameter dialog) and the add drawer

export interface iDocumentData {
    label: string
    tempDocument: any
    roles: any[]
    apiParameters: any[]
    deletedParams: any[]
}

export async function loadDocumentData(document: any): Promise<iDocumentData> {
    const label = document.label ?? document.name
    const tempDocument = await loadDocumentInfo(label)
    const roles = await loadSelectedDocumentRoles(tempDocument)
    const apiParameters = await loadSelectedDocumentParameters(label)
    const deletedParams = updateDocumentParameters(document, apiParameters)
    return { label, tempDocument, roles, apiParameters, deletedParams }
}

// A new document gets the parameters of the API; an existing one keeps its values and reports the parameters that do not exist anymore
function updateDocumentParameters(document: any, apiParameters: any[]) {
    if (!document.parameters) {
        document.parameters = apiParameters
        return []
    }
    const deletedParams = document.parameters.filter((parameter: any) => !apiParameters.some((apiParameter: any) => apiParameter.name === parameter.name))
    for (let i = 0; i < apiParameters.length; i++) {
        const index = document.parameters.findIndex((el: any) => el.name === apiParameters[i].name)
        if (index !== -1) {
            document.parameters[index].id = apiParameters[i].id
            document.parameters[index].temporal = apiParameters[i].temporal
        }
    }
    return deletedParams
}

async function loadDocumentInfo(documentLabel: string) {
    let tempDocument = null as any
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${documentLabel}`).then((response: AxiosResponse<any>) => (tempDocument = response.data))
    return tempDocument
}

async function loadSelectedDocumentRoles(tempDocument: any) {
    let tempRoles = [] as string[]
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents/${tempDocument.id}/userroles`).then((response: AxiosResponse<any>) => (tempRoles = response.data))
    return tempRoles.map((el: string) => {
        const userAndRole = el.split('|')
        return { userAndRole: el, user: userAndRole[0], role: userAndRole[1] }
    })
}

async function loadSelectedDocumentParameters(label: string) {
    let tempParameters = [] as any[]
    await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents/${label}/parameters`).then((response: AxiosResponse<any>) => (tempParameters = response.data))
    return tempParameters.map((el: any) => ({ id: el.parID, name: el.parameterUrlName, value: '', type: 'fixed', iterative: false, temporal: el.parameter.temporal, multivalue: el.multivalue, documentLabel: label }))
}

// The new row of the job: the first role of the document is the default of every parameter
export async function createJobDocument(document: any) {
    const documentCopy = { ...document, parameters: undefined }
    const { label, tempDocument, roles, apiParameters } = await loadDocumentData(documentCopy)
    const parameters = documentCopy.parameters ?? apiParameters
    parameters.forEach((parameter: any) => (parameter.role = roles[0]?.role))
    return { name: label, nameTitle: tempDocument.label, description: condensedParameters(parameters), parameters }
}
