import { downloadBlob, findDocsFolder, getFolders, listFiles } from '@/components/documentation/docsResourceApi'
import { filterZipEntries, flattenFolders, joinPath, slugify } from './documentationManagementHelpers'

// Export site (spec 14.2): the saved files of the server, never the working copy.

const PARALLEL_DOWNLOADS = 4

export class DocsExportError extends Error {
    constructor(public path: string) {
        super(path)
    }
}

export interface iDocsExportResult {
    data: Uint8Array
    files: number
    skipped: number
}

export async function buildDocsExport(onProgress?: (done: number, total: number) => void): Promise<iDocsExportResult> {
    const docs = findDocsFolder(await getFolders())
    if (!docs) throw new Error('docs folder not found')

    const listings = await Promise.all(flattenFolders(docs).map(async (folder) => (await listFiles(folder.key)).map((file) => ({ path: joinPath(folder.path, file.name), size: Number(file.size) || 0, key: folder.key, name: file.name }))))
    const remote = new Map(listings.flat().map((file) => [file.path, file]))

    // The import rules decide what goes in, so the zip is always a valid import (spec 14.2, item 4).
    const accepted = filterZipEntries(Array.from(remote.values(), ({ path, size }) => ({ path, size })))
    const paths = [...(accepted.config ? [accepted.config] : []), ...accepted.pages, ...accepted.images].map((entry) => entry.path)

    const entries: Record<string, Uint8Array> = {}
    let next = 0
    let done = 0
    let failed = false
    const worker = async () => {
        while (next < paths.length && !failed) {
            const path = paths[next++]
            const file = remote.get(path)!
            try {
                const blob = await downloadBlob(file.key, file.name)
                entries[path] = new Uint8Array(await blob.arrayBuffer())
            } catch {
                failed = true
                throw new DocsExportError(path)
            }
            onProgress?.(++done, paths.length)
        }
    }
    await Promise.all(Array.from({ length: Math.min(PARALLEL_DOWNLOADS, paths.length) }, worker))

    const { zipSync } = await import('fflate')
    return { data: zipSync(entries), files: paths.length, skipped: accepted.skipped.length }
}

export function exportFileName(title: string, date = new Date()): string {
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return title.trim() ? `docs-${slugify(title)}-${day}.zip` : `docs-${day}.zip`
}

export function downloadZip(data: Uint8Array, fileName: string) {
    const url = URL.createObjectURL(new Blob([data], { type: 'application/zip' }))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url))
}
