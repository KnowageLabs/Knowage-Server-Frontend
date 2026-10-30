import { createFolder, deleteFiles, findDocsFolder, getFolders, listFiles, uploadFile } from '@/components/documentation/docsResourceApi'
import type { IDocsFolder } from '@/components/documentation/docsResourceApi'
import { findSubfolder } from '@/components/documentation/DocumentationHelper'
import { basename, dirname, missingFolders } from './documentationManagementHelpers'
import type { iDocsBaseFile, iDocsChange, iDocsSaveRowResult } from './DocumentationManagement'

export interface iDocsSaveContext {
    rows: iDocsChange[]
    contents: Record<string, string>
    configText: string
    baseFiles: Record<string, iDocsBaseFile>
}

export interface iDocsSaveOutcome {
    results: iDocsSaveRowResult[]
    // The files that are on the server now, with what the server reports.
    written: Record<string, { lastModified?: number | string; size?: number }>
    removed: string[]
    // The saved old names that could not be deleted. They stay as pending deletes.
    failedDeletes: string[]
    configSaved: boolean
    error?: { status?: number; message: string }
}

export type iDocsSaveProgress = (index: number, state: 'running' | iDocsSaveRowResult['state'], message?: string) => void

function folderPaths(folder: IDocsFolder, prefix = ''): string[] {
    return (folder.children ?? []).flatMap((child) => {
        const path = prefix ? `${prefix}/${child.label}` : child.label
        return [path, ...folderPaths(child, path)]
    })
}

function keyOf(docs: IDocsFolder, dir: string): string {
    const folder = dir ? findSubfolder(docs, dir.split('/')) : docs
    if (!folder) throw new Error(`Folder not found: ${dir}`)
    return folder.key
}

function messageOf(error: any): string {
    return error?.response?.data?.errors?.[0]?.message ?? error?.response?.data?.message ?? error?.message ?? String(error)
}

// The write order of spec 9.2: folders, pages, config.json, deletes, then a check of what the server reports.
export async function executeSave(context: iDocsSaveContext, progress: iDocsSaveProgress): Promise<iDocsSaveOutcome> {
    const { rows } = context
    const outcome: iDocsSaveOutcome = { results: rows.map((row) => ({ path: row.path, state: 'notTried' as const })), written: {}, removed: [], failedDeletes: [], configSaved: false }
    const uploaded: { index: number; path: string; text: string }[] = []
    const deleted: { index: number; path: string }[] = []
    let current = -1

    try {
        let docs = findDocsFolder(await getFolders())
        if (!docs) throw new Error('docs folder not found')

        const pageRows = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.kind === 'page')
        const missing = missingFolders(
            pageRows.map(({ row }) => row.path),
            folderPaths(docs)
        )
        // Parents first. The keys of the new folders come from a new tree after each one.
        for (const folder of missing) {
            await createFolder(keyOf(docs, dirname(folder)), basename(folder))
            docs = findDocsFolder(await getFolders())
            if (!docs) throw new Error('docs folder not found')
        }

        for (const { row, index } of pageRows) {
            current = index
            progress(index, 'running')
            const text = context.contents[row.path] ?? ''
            await send(keyOf(docs, dirname(row.path)), basename(row.path), text, 'text/markdown')
            uploaded.push({ index, path: row.path, text })
            outcome.results[index].state = 'saved'
            progress(index, 'saved')
        }

        const configIndex = rows.findIndex((row) => row.kind === 'config')
        if (configIndex !== -1) {
            current = configIndex
            progress(configIndex, 'running')
            await send(docs.key, 'config.json', context.configText, 'application/json')
            uploaded.push({ index: configIndex, path: 'config.json', text: context.configText })
            outcome.results[configIndex].state = 'saved'
            progress(configIndex, 'saved')
        }

        // A renamed page: the old name goes after the new file and the menu are written.
        const tasks = rows.flatMap((row, index) => (row.kind === 'delete' ? [{ index, path: row.path }] : row.kind === 'page' && row.deleteOld && row.oldPath ? [{ index, path: row.oldPath }] : []))
        for (const task of tasks) {
            current = task.index
            const isDeleteRow = rows[task.index].kind === 'delete'
            if (isDeleteRow) progress(task.index, 'running')
            try {
                await deleteFiles(keyOf(docs, dirname(task.path)), [basename(task.path)])
            } catch (error) {
                if (isDeleteRow) throw error
                outcome.failedDeletes.push(task.path)
                continue
            }
            deleted.push(task)
            if (isDeleteRow) {
                outcome.results[task.index].state = 'saved'
                progress(task.index, 'saved')
            }
        }
        current = -1
    } catch (error: any) {
        outcome.error = { status: error?.response?.status, message: messageOf(error) }
        if (current !== -1) {
            outcome.results[current] = { path: rows[current].path, state: 'failed', message: outcome.error.message }
            progress(current, 'failed', outcome.error.message)
        }
        rows.forEach((_, index) => {
            if (outcome.results[index].state === 'notTried') progress(index, 'notTried')
        })
    }

    await verify(context, outcome, uploaded, deleted, progress)
    return outcome
}

async function send(key: string, name: string, text: string, type: string) {
    const response = await uploadFile(key, name, text, type)
    if (response?.errors && (!Array.isArray(response.errors) || response.errors.length)) throw new Error(messageOf({ response: { data: response } }))
}

// A refused upload can still answer 200 (spec 3.3, item 1): only a new lastModified or size proves the write.
async function verify(context: iDocsSaveContext, outcome: iDocsSaveOutcome, uploaded: { index: number; path: string; text: string }[], deleted: { index: number; path: string }[], progress: iDocsSaveProgress) {
    if (!uploaded.length && !deleted.length) return
    const listings: Record<string, Record<string, { lastModified?: number | string; size?: number }>> = {}
    try {
        const docs = findDocsFolder(await getFolders())
        if (!docs) return
        const dirs = Array.from(new Set([...uploaded, ...deleted].map((item) => dirname(item.path))))
        await Promise.all(
            dirs.map(async (dir) => {
                const files = await listFiles(keyOf(docs, dir))
                listings[dir] = Object.fromEntries(files.map((file) => [file.name, { lastModified: file.lastModified, size: file.size }]))
            })
        )
    } catch {
        // Without a listing the write cannot be proven; the rows stay as the server answered.
        return
    }

    const refuse = (index: number, path: string) => {
        const message = 'The server did not write the file. Check that you have permission to change the docs.'
        outcome.results[index] = { path, state: 'failed', message }
        progress(index, 'failed', message)
    }

    for (const item of uploaded) {
        const listed = listings[dirname(item.path)]?.[basename(item.path)]
        const base = context.baseFiles[item.path]
        const changed = !!listed && (!base || String(listed.lastModified) !== String(base.lastModified) || listed.size !== base.size)
        if (!changed) {
            refuse(item.index, item.path)
            continue
        }
        outcome.written[item.path] = listed
        if (item.path === 'config.json') outcome.configSaved = true
    }
    for (const item of deleted) {
        if (listings[dirname(item.path)]?.[basename(item.path)]) {
            if (context.rows[item.index].kind === 'delete' && outcome.results[item.index].state === 'saved') refuse(item.index, item.path)
            outcome.failedDeletes.push(item.path)
        } else outcome.removed.push(item.path)
    }
}
