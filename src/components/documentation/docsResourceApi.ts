import axios from 'axios'
import { findFoldersWithLabel } from './DocumentationHelper'

export interface IDocsFolder {
    key: string
    label: string
    relativePath?: string
    children?: IDocsFolder[]
}

export interface IDocsRemoteFile {
    name: string
    size?: number
    lastModified?: number | string
}

const RESOURCES_URL = import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/2.0/resources'
const JSON_HEADERS = { 'Content-Type': 'application/json' }
const DOWNLOAD_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/zip; charset=utf-8' }

export async function getFolders(): Promise<IDocsFolder[]> {
    const response = await axios.get(`${RESOURCES_URL}/folders`)
    return Array.isArray(response.data?.root) ? response.data.root : Array.isArray(response.data) ? response.data : []
}

// The same rule as the viewer: the first folder labelled docs, anywhere in the tree.
export function findDocsFolder(root: IDocsFolder[]): IDocsFolder | null {
    return findFoldersWithLabel(root, 'docs')[0] ?? null
}

export async function listFiles(key: string): Promise<IDocsRemoteFile[]> {
    const response = await axios.get(`${RESOURCES_URL}/files`, { params: { key } })
    return Array.isArray(response.data) ? response.data : []
}

// Plain text, no JSON parsing: a broken config.json must stay a string.
export async function downloadText(key: string, name: string): Promise<string> {
    const response = await axios.post(`${RESOURCES_URL}/files/download`, { key, selectedFilesNames: [name] }, { headers: DOWNLOAD_HEADERS, responseType: 'text', transformResponse: (data) => data })
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
}

export async function downloadBlob(key: string, name: string): Promise<Blob> {
    const response = await axios.post(`${RESOURCES_URL}/files/download`, { key, selectedFilesNames: [name] }, { headers: DOWNLOAD_HEADERS, responseType: 'blob' })
    return response.data
}

export async function uploadFile(key: string, name: string, content: Blob | string, type?: string) {
    const formData = new FormData()
    const blob = typeof content === 'string' ? new Blob([content], { type: type ?? 'text/plain' }) : content
    formData.append('file', blob, name)
    formData.append('key', key)
    formData.append('extract', 'false')
    const response = await axios.post(`${RESOURCES_URL}/files/uploadFile`, formData)
    return response.data
}

export async function deleteFiles(key: string, names: string[]) {
    await axios.delete(`${RESOURCES_URL}/files`, { headers: JSON_HEADERS, data: { key, selectedFilesNames: names } })
}

export async function createFolder(parentKey: string, folderName: string) {
    await axios.post(`${RESOURCES_URL}/folders`, { key: parentKey, folderName }, { headers: JSON_HEADERS })
}
