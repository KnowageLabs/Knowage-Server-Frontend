import axios from 'axios'
import { IFolder } from './Workspace'

// Every HTTP call of the workspace page. Payloads are the ones of the old views (research section 4).
const REST = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services`
const NO_ERRORS = { headers: { 'X-Disable-Errors': 'true' } }

// ---------- Documents ----------

export const getRecents = async (): Promise<any[]> => {
    const response = await axios.get(`${REST}/2.0/recents`)
    return Array.isArray(response.data) ? response.data : []
}

export const getPersonalDocuments = async (): Promise<any[]> => (await axios.get(`${REST}/documents/myAnalysisDocsList`)).data?.root ?? []

// BE1 (backend spec 3): the merged list, built on the server.
export const getWorkspaceDocuments = async (): Promise<any[]> => (await axios.get(`${REST}/2.0/workspace/documents`)).data ?? []

export const getDocumentById = async (id: number | string): Promise<any> => (await axios.get(`${REST}/2.0/documents/${id}`)).data

// Edit details (B6 fixed: name as name, label as label).
export const updateDocumentDetails = (document: { id: number; name: string; label: string; description?: string }) =>
    axios.post(`${REST}/2.0/saveDocument/`, { document: { name: document.name, label: document.label, description: document.description, id: document.id }, updateFromWorkspace: true }, NO_ERRORS)

export const cloneDocument = (id: number) => axios.post(`${REST}/documents/clone?docId=${id}`)

export const deleteDocument = (label: string) => axios.delete(`${REST}/1.0/documents/${label}`)

export const uploadPreviewImage = (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${REST}/2.0/analysis/${id}`, formData)
}

// The preview image of a document, as a blob (same service as the Document Browser sidebar).
export const getPreviewImage = async (fileName: string): Promise<Blob> => (await axios.get(`${REST}/preview-file/download?fileName=${encodeURIComponent(fileName)}`, { responseType: 'blob' })).data

// The document-browser folders, to find the personal folder of the user (new dashboard).
export const getDocumentBrowserFolders = async (): Promise<any[]> => (await axios.get(`${REST}/2.0/folders?includeDocs=false`)).data ?? []

// ---------- Workspace folders (1.0/repository) ----------

export const getFolderTree = async (): Promise<IFolder> => (await axios.get(`${REST}/1.0/repository`)).data

export const getFolderContent = async (folderId: string): Promise<any[]> => (await axios.get(`${REST}/1.0/repository/${folderId}`)).data?.content ?? []

export const createFolder = async (folder: { name: string; description: string; parentId: string | null; progr: number }): Promise<IFolder> => (await axios.post(`${REST}/1.0/repository`, folder)).data

export const updateFolder = (folder: { id: string; name: string; description: string; parentId: string | null; progr: number }) => axios.put(`${REST}/1.0/repository`, folder)

export const deleteFolder = (folderId: string) => axios.delete(`${REST}/1.0/repository/${folderId}`, NO_ERRORS)

export const linkDocument = async (biObjectId: number, folderId: string): Promise<any> => (await axios.post(`${REST}/1.0/repository/document`, { biObjectId, parentId: folderId })).data

export const unlinkDocument = (linkId: string) => axios.delete(`${REST}/1.0/repository/document/${linkId}`)

export const getView = async (viewId: string): Promise<any> => (await axios.get(`${REST}/1.0/repository/view/${viewId}`)).data

// PUT writes every field, so the caller sends the full view read with getView.
export const updateView = (view: any) => axios.put(`${REST}/1.0/repository/view`, view)

export const deleteView = (viewId: string) => axios.delete(`${REST}/1.0/repository/view/${viewId}`)

// ---------- Data ----------

export const getDatasets = async (scopePath: 'owned' | 'enterprise' | 'mydata'): Promise<any[]> => (await axios.get(`${REST}/3.0/datasets/${scopePath}/`)).data?.root ?? []

export const getDatasetCategories = async (): Promise<any[]> => (await axios.get(`${REST}/domainsforfinaluser/ds-categories`)).data ?? []

export const getBusinessModels = async (): Promise<any[]> => (await axios.get(`${REST}/2.0/businessmodels/?fileExtension=jar`)).data ?? []

export const getModelCategories = async (): Promise<any[]> => (await axios.get(`${REST}/domainsforfinaluser/bm-categories`)).data ?? []

// The full dataset; the service answers an array.
export const getDatasetByLabel = async (label: string): Promise<any> => (await axios.get(`${REST}/1.0/datasets/${label}`)).data?.[0]

export const getDatasetFilters = async (label: string, role: string | null): Promise<any> => (await axios.post(`${REST}/3.0/datasets/${label}/filters`, { role })).data

export const exportDataset = (id: number, format: 'xls' | 'csv', body: any) => axios.post(`${REST}/2.0/export/dataset/${id}/${format}`, body ?? {})

export const downloadDatasetFile = (label: string, fileType: string) => axios.get(`${REST}/2.0/datasets/download/file?dsLabel=${label}&type=${fileType.toLowerCase()}`, { responseType: 'blob' })

export const cloneDataset = (dataset: any) => axios.post(`${REST}/1.0/datasets`, dataset, NO_ERRORS)

export const deleteDataset = (label: string) => axios.delete(`${REST}/1.0/datasets/${label}`)

// ---------- Scheduled ----------

export const getJobs = async (): Promise<any[]> => (await axios.get(`${REST}/scheduleree/listAllJobs`)).data?.root ?? []

export const getSnapshotsOfJob = async (jobName: string): Promise<any> => (await axios.get(`${REST}/1.0/documentsnapshot/getSnapshootBySchedulation?schedulation=${encodeURIComponent(jobName)}`)).data ?? {}

export const runTriggers = (triggers: { jobName: string; jobGroup: string; triggerName: string; triggerGroup: string }[]) => axios.post(`${REST}/scheduleree/executeMultipleTrigger`, triggers)

export const downloadSnapshot = (biObjectId: number, snapshotId: number) =>
    axios.get(`${REST}/2.0/snapshotsContent?OBJECT_ID=${biObjectId}&SNAPSHOT_ID=${snapshotId}`, { responseType: 'blob', headers: { Accept: '*/*' } })
