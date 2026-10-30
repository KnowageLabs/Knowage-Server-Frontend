import { computed, inject, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'
import axios from 'axios'
import deepcopy from 'deepcopy'
import { useDebounceFn } from '@vueuse/core'
import mainStore from '@/App.store'
import { createFolder, downloadBlob, downloadText, findDocsFolder, getFolders, listFiles, uploadFile } from '@/components/documentation/docsResourceApi'
import type { IDocsFolder } from '@/components/documentation/docsResourceApi'
import { findSubfolder } from '@/components/documentation/DocumentationHelper'
import { executeSave } from './docsSave'
import type { iDocsSaveOutcome, iDocsSaveProgress } from './docsSave'
import { buildDocsTemplate } from './documentationManagementTemplate'
import {
    ancestorIds,
    appendNode,
    basename,
    buildChangeList,
    configToNodes,
    configToSite,
    dirname,
    fileLetter,
    folderForChildren,
    HOME_FILE,
    joinPath,
    labelFromFileName,
    missingFolders,
    moveNode,
    newId,
    nodeLetter,
    nodesToConfig,
    orphanFiles,
    pageChanged,
    reconcileIds,
    relativePath,
    slugify,
    subtreeIds,
    uniqueFileName,
    usedFiles
} from './documentationManagementHelpers'
import type { iDocsBaseFile, iDocsChange, iDocsDropPosition, iDocsLetter, iDocsNode, iDocsSite, iDocsState, iDocsWorkingCopyStorage } from './DocumentationManagement'

export type DocsStatus = 'loading' | 'ready' | 'noSite' | 'brokenConfig' | 'error'

const STORAGE_PREFIX = 'kn-docs-manager'
const IMAGE_FOLDER = 'images'
const IMAGE_EXTENSIONS: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/webp': 'webp' }

const emptySite = (): iDocsSite => ({ title: '', logo: false, dense: false, menu: true })

function flattenFolders(folder: IDocsFolder, prefix = ''): { path: string; key: string }[] {
    return [{ path: prefix, key: folder.key }, ...(folder.children ?? []).flatMap((child) => flattenFolders(child, prefix ? `${prefix}/${child.label}` : child.label))]
}

export function useDocsWorkingCopy() {
    const store = mainStore()

    const status = ref<DocsStatus>('loading')
    const configError = ref('')
    const rawConfig = ref('')
    const root = ref<IDocsFolder[]>([])
    const docsFolder = ref<IDocsFolder | null>(null)
    const baseConfig = ref<any | null>(null)
    const baseSite = ref<iDocsSite>(emptySite())
    const baseNodes = ref<iDocsNode[]>([])
    const baseFiles = ref<Record<string, iDocsBaseFile>>({})
    const site = ref<iDocsSite>(emptySite())
    const nodes = ref<iDocsNode[]>([])
    const contents = ref<Record<string, string>>({})
    const deletedPaths = ref<string[]>([])
    const roles = ref<string[]>([])
    const storageFailed = ref(false)

    const state = computed<iDocsState>(() => ({
        baseConfig: baseConfig.value,
        baseSite: baseSite.value,
        baseNodes: baseNodes.value,
        baseFiles: baseFiles.value,
        site: site.value,
        nodes: nodes.value,
        contents: contents.value,
        deletedPaths: deletedPaths.value
    }))

    // ── derived ───────────────────────────────────────────

    const changes = computed<iDocsChange[]>(() => (status.value === 'ready' ? buildChangeList(state.value) : []))
    const hasChanges = computed(() => changes.value.length > 0)
    const letters = computed(() => {
        const map = new Map<string, iDocsLetter | ''>()
        nodes.value.forEach((node) => map.set(node.id, nodeLetter(state.value, node)))
        return map
    })
    // A node with a change anywhere below it shows the dot, at every level up to the top.
    const dots = computed(() => {
        const set = new Set<string>()
        letters.value.forEach((letter, id) => {
            if (letter) ancestorIds(nodes.value, id).forEach((ancestor) => set.add(ancestor))
        })
        return set
    })
    const orphans = computed(() => orphanFiles(state.value))
    const siteChanged = computed(() => JSON.stringify(site.value) !== JSON.stringify(baseSite.value))
    const homeLetter = computed(() => fileLetter(state.value, HOME_FILE))
    const folderPaths = computed(() => (docsFolder.value ? flattenFolders(docsFolder.value).map((folder) => folder.path) : []))

    function letterOfFile(path: string): iDocsLetter | '' {
        return fileLetter(state.value, path)
    }

    function nodeById(id: string | null | undefined): iDocsNode | undefined {
        return id ? nodes.value.find((node) => node.id === id) : undefined
    }

    function allKnownFiles(): string[] {
        return Array.from(new Set([...Object.keys(baseFiles.value), ...Object.keys(contents.value), ...nodes.value.map((node) => node.file).filter(Boolean)]))
    }

    // ── load ──────────────────────────────────────────────

    function setBase(config: any | null) {
        baseConfig.value = config
        baseSite.value = configToSite(config)
        baseNodes.value = configToNodes(config)
        site.value = deepcopy(baseSite.value)
        nodes.value = deepcopy(baseNodes.value)
        contents.value = {}
        deletedPaths.value = []
    }

    async function refreshFolders() {
        root.value = await getFolders()
        docsFolder.value = findDocsFolder(root.value)
        return docsFolder.value
    }

    async function loadRoles() {
        try {
            const response = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/roles')
            roles.value = (Array.isArray(response.data) ? response.data : []).map((role: any) => role.name).filter(Boolean)
        } catch {
            roles.value = []
        }
    }

    async function load() {
        status.value = 'loading'
        try {
            const docs = await refreshFolders()
            loadRoles()
            if (!docs) {
                baseFiles.value = {}
                setBase(null)
                status.value = 'noSite'
                return
            }
            const listings = await Promise.all(
                flattenFolders(docs).map(async (folder) => ({ folder, files: await listFiles(folder.key).catch(() => []) }))
            )
            const files: Record<string, iDocsBaseFile> = {}
            listings.forEach(({ folder, files: list }) => list.forEach((file) => (files[joinPath(folder.path, file.name)] = { lastModified: file.lastModified, size: file.size })))
            baseFiles.value = files

            if (!files['config.json']) {
                setBase(null)
                status.value = 'noSite'
                pendingCopy.value = findStored()
                return
            }
            const text = await downloadText(docs.key, 'config.json')
            let parsed: any
            try {
                parsed = JSON.parse(text)
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('config.json must be a JSON object')
            } catch (error: any) {
                rawConfig.value = text
                configError.value = error?.message ?? String(error)
                setBase(null)
                status.value = 'brokenConfig'
                return
            }
            setBase(parsed)
            status.value = 'ready'
            pendingCopy.value = findStored()
        } catch {
            status.value = 'error'
        }
    }

    // Saves a hand-fixed config.json on its own, then loads the site (spec 7.1, item 4).
    async function saveRawConfig(text: string) {
        JSON.parse(text)
        const docs = docsFolder.value ?? (await refreshFolders())
        if (!docs) throw new Error('docs folder not found')
        await uploadFile(docs.key, 'config.json', text, 'application/json')
        await load()
    }

    async function createSite() {
        let docs = docsFolder.value
        if (!docs) {
            const rootKey = root.value[0]?.key
            if (!rootKey) throw new Error('The resource root was not found')
            await createFolder(rootKey, 'docs')
            docs = await refreshFolders()
            if (!docs) throw new Error('docs folder was not created')
        }
        const template = buildDocsTemplate(store.user?.organization ?? '')
        baseFiles.value = {}
        setBase(null)
        site.value = configToSite(template.config)
        nodes.value = configToNodes(template.config)
        contents.value = { ...template.files }
        status.value = 'ready'
    }

    // ── files ─────────────────────────────────────────────

    function keyOfFolder(dir: string): string | null {
        const docs = docsFolder.value
        if (!docs) return null
        return (dir ? findSubfolder(docs, dir.split('/')) : docs)?.key ?? null
    }

    // The text of a saved file. It is the base that the letters compare with.
    async function ensureBase(path: string): Promise<string | undefined> {
        const base = baseFiles.value[path]
        if (!base) return undefined
        if (base.content === undefined) {
            const key = keyOfFolder(dirname(path))
            if (!key) return undefined
            base.content = await downloadText(key, basename(path))
        }
        return base.content
    }

    // Opening a file must not make it dirty: the working text starts as the saved text.
    async function ensureContent(path: string): Promise<string> {
        if (contents.value[path] === undefined) {
            const text = await ensureBase(path)
            if (contents.value[path] === undefined) contents.value[path] = text ?? ''
        }
        return contents.value[path]
    }

    function setContent(path: string, text: string) {
        contents.value[path] = text
    }

    async function replaceContent(path: string, text: string) {
        await ensureBase(path)
        contents.value[path] = text
    }

    async function readSaved(path: string): Promise<string | undefined> {
        return ensureBase(path)
    }

    // ── nodes ─────────────────────────────────────────────

    function newPageFile(parentId: string | null, label: string): string {
        return uniqueFileName(folderForChildren(nodes.value, parentId), slugify(label), allKnownFiles())
    }

    function addNode(parentId: string | null, label: string, withPage: boolean, template?: string): iDocsNode {
        const node: iDocsNode = { id: newId(), parentId, label, file: '', roles: [], extra: {} }
        if (withPage) {
            node.file = newPageFile(parentId, label)
            contents.value[node.file] = template ?? `# ${label}\n\n`
        }
        nodes.value = appendNode(nodes.value, node, parentId)
        return node
    }

    function createPage(id: string, template?: string) {
        const node = nodeById(id)
        if (!node || node.file) return
        node.file = newPageFile(node.parentId, node.label)
        contents.value[node.file] = template ?? `# ${node.label}\n\n`
    }

    function addPagesFromFiles(parentId: string | null, files: { name: string; text: string }[]): iDocsNode[] {
        return files.map(({ name, text }) => {
            const label = labelFromFileName(name)
            const node: iDocsNode = { id: newId(), parentId, label, file: newPageFile(parentId, label), roles: [], extra: {} }
            contents.value[node.file] = text
            nodes.value = appendNode(nodes.value, node, parentId)
            return node
        })
    }

    function dropUnusedNewContent(path: string) {
        if (!path || baseFiles.value[path] || usedFiles(nodes.value).has(path)) return
        delete contents.value[path]
    }

    // Moves the text with the page. The old name is deleted by Save, unless another node uses it.
    async function setNodeFile(id: string, file: string) {
        const node = nodeById(id)
        if (!node || node.file === file) return
        const old = node.file
        const text = old ? await ensureContent(old) : (contents.value[file] ?? '')
        node.file = file
        contents.value[file] = text
        if (old) {
            if (baseFiles.value[old]?.content !== undefined) contents.value[old] = baseFiles.value[old].content as string
            dropUnusedNewContent(old)
        }
    }

    function removeNodes(ids: string[]) {
        const files = ids.map((id) => nodeById(id)?.file ?? '')
        nodes.value = nodes.value.filter((node) => !ids.includes(node.id))
        files.forEach(dropUnusedNewContent)
    }

    // A saved node is marked, a new node goes away at once.
    function deleteNode(id: string) {
        const ids = subtreeIds(nodes.value, id)
        const saved = ids.filter((nodeId) => baseNodes.value.some((base) => base.id === nodeId))
        const fresh = ids.filter((nodeId) => !saved.includes(nodeId))
        nodes.value.forEach((node) => {
            if (saved.includes(node.id)) node.deleted = true
        })
        removeNodes(fresh)
    }

    function restoreNode(id: string) {
        const ids = [...ancestorIds(nodes.value, id), ...subtreeIds(nodes.value, id)]
        nodes.value.forEach((node) => {
            if (ids.includes(node.id)) delete node.deleted
        })
    }

    function moveTo(id: string, targetId: string | null, position: iDocsDropPosition): boolean {
        const moved = moveNode(nodes.value, id, targetId, position)
        if (!moved) return false
        nodes.value = moved
        return true
    }

    function addOrphanToMenu(path: string, targetId: string | null = null, position: iDocsDropPosition = 'end'): iDocsNode {
        const node: iDocsNode = { id: newId(), parentId: null, label: labelFromFileName(path), file: path, roles: [], extra: {} }
        nodes.value = appendNode(nodes.value, node, null)
        deletedPathsRemove(path)
        if (targetId) moveTo(node.id, targetId, position)
        return node
    }

    function deletedPathsRemove(path: string) {
        deletedPaths.value = deletedPaths.value.filter((p) => p !== path)
    }

    function deleteOrphan(path: string) {
        if (baseFiles.value[path]) {
            if (!deletedPaths.value.includes(path)) deletedPaths.value.push(path)
        } else delete contents.value[path]
    }

    function restoreOrphan(path: string) {
        deletedPathsRemove(path)
    }

    // ── discard ───────────────────────────────────────────

    function revertContent(path: string) {
        const base = baseFiles.value[path]
        if (base?.content !== undefined) contents.value[path] = base.content
        else delete contents.value[path]
    }

    function discardFile(path: string) {
        nodes.value.forEach((node) => {
            if (node.file !== path || baseFiles.value[path]) return
            node.file = baseNodes.value.find((base) => base.id === node.id)?.file ?? ''
        })
        revertContent(path)
        deletedPathsRemove(path)
    }

    function discardNode(id: string) {
        const base = baseNodes.value.find((b) => b.id === id)
        const node = nodeById(id)
        if (!node) return
        if (!base) return deleteNode(id)
        if (node.file !== base.file) {
            const current = node.file
            node.file = base.file
            dropUnusedNewContent(current)
        }
        node.label = base.label
        node.roles = [...base.roles]
        node.extra = deepcopy(base.extra)
        delete node.deleted
        if (base.file) revertContent(base.file)
        // Back to the saved place: after the saved previous sibling, else first in the saved parent.
        const siblings = baseNodes.value.filter((b) => b.parentId === base.parentId)
        const previous = siblings[siblings.indexOf(base) - 1]
        if (previous && nodeById(previous.id)?.parentId === base.parentId) return void moveTo(id, previous.id, 'after')
        const parent = base.parentId ? nodeById(base.parentId) : undefined
        if (base.parentId && !parent) return
        const first = nodes.value.find((n) => n.parentId === base.parentId && n.id !== id)
        if (first) moveTo(id, first.id, 'before')
        else if (parent) moveTo(id, parent.id, 'inside')
    }

    function discardConfig() {
        const before = usedFiles(nodes.value)
        site.value = deepcopy(baseSite.value)
        nodes.value = deepcopy(baseNodes.value)
        const after = usedFiles(nodes.value)
        before.forEach((path) => {
            if (!after.has(path)) dropUnusedNewContent(path)
        })
    }

    function discardAll() {
        site.value = deepcopy(baseSite.value)
        nodes.value = deepcopy(baseNodes.value)
        contents.value = {}
        deletedPaths.value = []
        clearStored()
    }

    // ── images (uploaded at once, spec D13) ───────────────

    async function ensureFolder(path: string): Promise<string> {
        if (!docsFolder.value && !(await refreshFolders())) throw new Error('docs folder not found')
        for (const folder of missingFolders([joinPath(path, 'x')], folderPaths.value)) {
            await createFolder(keyOfFolder(dirname(folder)) as string, basename(folder))
            await refreshFolders()
        }
        const key = keyOfFolder(path)
        if (!key) throw new Error(`Folder not found: ${path}`)
        return key
    }

    // Returns the path relative to docs.
    async function uploadImage(file: Blob, wantedName: string, folder = IMAGE_FOLDER): Promise<string> {
        const key = await ensureFolder(folder)
        const existing = (await listFiles(key)).map((item) => joinPath(folder, item.name))
        let extension = wantedName.includes('.') ? wantedName.split('.').pop()!.toLowerCase() : (IMAGE_EXTENSIONS[file.type] ?? 'png')
        extension = extension.replace(/[^a-z0-9]/g, '') || 'png'
        const base = slugify(wantedName.replace(/\.[^.]+$/, ''))
        const path = uniqueFileName(folder, base, existing, '.' + extension)
        await uploadFile(key, basename(path), file)
        // A refused upload can answer 200 (spec 3.3, item 1).
        if (!(await listFiles(key)).some((item) => item.name === basename(path))) throw new Error('The image was not saved')
        return path
    }

    // An image of an imported zip keeps its name and path, because the pages point to it. An existing file is replaced.
    async function uploadAsset(path: string, file: Blob) {
        const key = await ensureFolder(dirname(path))
        await uploadFile(key, basename(path), file)
        if (!(await listFiles(key)).some((item) => item.name === basename(path))) throw new Error(`The file was not saved: ${path}`)
    }

    async function listImages(): Promise<{ name: string; path: string; key: string }[]> {
        await refreshFolders()
        const key = keyOfFolder(IMAGE_FOLDER)
        if (!key) return []
        const files = await listFiles(key)
        return files.filter((item) => /\.(png|jpe?g|gif|svg|webp)$/i.test(item.name)).map((item) => ({ name: item.name, path: joinPath(IMAGE_FOLDER, item.name), key }))
    }

    async function readImage(path: string): Promise<Blob | null> {
        const key = keyOfFolder(dirname(path))
        return key ? downloadBlob(key, basename(path)) : null
    }

    // ── import (spec 7.6) ─────────────────────────────────

    async function analyzeImport(pages: { path: string; text: string }[], deleteMissing: boolean) {
        let added = 0
        let changed = 0
        for (const page of pages) {
            if (!baseFiles.value[page.path]) added++
            else if ((await ensureBase(page.path)) !== page.text) changed++
        }
        const inZip = new Set(pages.map((page) => page.path))
        const removed = deleteMissing ? Object.keys(baseFiles.value).filter((path) => path.endsWith('.md') && !inZip.has(path)) : []
        return { added, changed, removed }
    }

    async function applyImport(plan: { config: any | null; pages: { path: string; text: string }[]; deleteMissing: boolean }) {
        for (const page of plan.pages) {
            await ensureBase(page.path)
            contents.value[page.path] = page.text
            deletedPathsRemove(page.path)
        }
        if (plan.config) {
            site.value = configToSite(plan.config)
            nodes.value = reconcileIds(configToNodes(plan.config), baseNodes.value)
        }
        if (plan.deleteMissing) {
            const inZip = new Set(plan.pages.map((page) => page.path))
            Object.keys(baseFiles.value)
                .filter((path) => path.endsWith('.md') && path !== HOME_FILE && !inZip.has(path))
                .forEach((path) => {
                    if (!deletedPaths.value.includes(path)) deletedPaths.value.push(path)
                })
        }
    }

    // ── save ──────────────────────────────────────────────

    async function save(rows: iDocsChange[], progress: iDocsSaveProgress): Promise<iDocsSaveOutcome> {
        const configText = JSON.stringify(nodesToConfig(baseConfig.value, site.value, nodes.value), null, 2) + '\n'
        const outcome = await executeSave({ rows, contents: contents.value, configText, baseFiles: baseFiles.value }, progress)

        const pendingDeletes = new Set<string>(outcome.failedDeletes)
        rows.forEach((row, index) => {
            const result = outcome.results[index]
            if (row.kind === 'delete' && result.state !== 'saved') pendingDeletes.add(row.path)
            if (row.kind === 'page' && row.deleteOld && row.oldPath && !outcome.removed.includes(row.oldPath)) pendingDeletes.add(row.oldPath)
        })

        rows.forEach((row, index) => {
            if (outcome.results[index].state !== 'saved' || row.kind !== 'page') return
            const written = outcome.written[row.path]
            baseFiles.value[row.path] = { ...written, content: contents.value[row.path] ?? '' }
        })
        outcome.removed.forEach((path) => {
            delete baseFiles.value[path]
            delete contents.value[path]
            deletedPathsRemove(path)
        })

        if (outcome.configSaved) {
            baseConfig.value = nodesToConfig(baseConfig.value, site.value, nodes.value)
            baseSite.value = deepcopy(site.value)
            nodes.value = nodes.value.filter((node) => !node.deleted)
            baseNodes.value = deepcopy(nodes.value)
            baseFiles.value['config.json'] = { ...outcome.written['config.json'], content: configText }
            pendingDeletes.forEach((path) => {
                if (baseFiles.value[path] && !deletedPaths.value.includes(path)) deletedPaths.value.push(path)
            })
        }
        await refreshFolders().catch(() => null)
        persistNow()
        return outcome
    }

    // ── working copy in localStorage (spec 10) ────────────

    const storageKey = computed(() => `${STORAGE_PREFIX}:${store.user?.organization ?? ''}:${store.user?.userId ?? ''}`)
    // A stored copy waits for the user's answer. Until then nothing may overwrite it.
    const pendingCopy = ref<iDocsWorkingCopyStorage | null>(null)

    function writeStorage(value: string | null) {
        try {
            if (value === null) localStorage.removeItem(storageKey.value)
            else localStorage.setItem(storageKey.value, value)
            return true
        } catch {
            return false
        }
    }

    function persistNow() {
        if (status.value !== 'ready' || pendingCopy.value) return
        if (!hasChanges.value) {
            writeStorage(null)
            return
        }
        const changed: Record<string, string> = {}
        Object.keys(contents.value).forEach((path) => {
            if (pageChanged(state.value, path)) changed[path] = contents.value[path]
        })
        const baseModified: Record<string, number | string | undefined> = {}
        Object.keys(baseFiles.value).forEach((path) => (baseModified[path] = baseFiles.value[path].lastModified))
        const copy: iDocsWorkingCopyStorage = { version: 1, savedAt: Date.now(), site: site.value, nodes: nodes.value, baseNodes: baseNodes.value, contents: changed, deletedPaths: deletedPaths.value, baseModified }
        if (!writeStorage(JSON.stringify(copy))) storageFailed.value = true
    }

    const persistSoon = useDebounceFn(persistNow, 1000)
    watch([site, nodes, contents, deletedPaths], () => persistSoon(), { deep: true })

    function findStored(): iDocsWorkingCopyStorage | null {
        try {
            const text = localStorage.getItem(storageKey.value)
            if (!text) return null
            const copy = JSON.parse(text)
            return copy?.version === 1 && Array.isArray(copy.nodes) ? copy : null
        } catch {
            return null
        }
    }

    function clearStored() {
        writeStorage(null)
    }

    // The files that changed on the server since the copy was made.
    function changedOnServer(copy: iDocsWorkingCopyStorage): string[] {
        return Object.keys(copy.baseModified ?? {}).filter((path) => baseFiles.value[path] && String(baseFiles.value[path].lastModified) !== String(copy.baseModified[path]))
    }

    const signature = (list: iDocsNode[]) => list.map((node) => `${list.findIndex((p) => p.id === node.parentId)}|${node.label}|${node.file}`).join('\n')

    async function restorePendingCopy() {
        const copy = pendingCopy.value
        if (!copy) return
        pendingCopy.value = null
        if (signature(copy.baseNodes) === signature(baseNodes.value)) {
            baseNodes.value = deepcopy(copy.baseNodes)
            nodes.value = deepcopy(copy.nodes)
        } else nodes.value = reconcileIds(deepcopy(copy.nodes), baseNodes.value)
        site.value = deepcopy(copy.site)
        deletedPaths.value = [...copy.deletedPaths]
        contents.value = { ...copy.contents }
        // The letters compare with the saved text, so it must be known.
        await Promise.all(Object.keys(copy.contents).map((path) => ensureBase(path).catch(() => undefined)))
        status.value = 'ready'
    }

    function discardPendingCopy() {
        pendingCopy.value = null
        clearStored()
    }

    function pageFolderOf(file: string): string {
        return dirname(file)
    }

    return {
        status,
        configError,
        rawConfig,
        docsFolder,
        baseConfig,
        baseSite,
        baseNodes,
        baseFiles,
        site,
        nodes,
        contents,
        deletedPaths,
        roles,
        storageFailed,
        state,
        changes,
        hasChanges,
        letters,
        dots,
        orphans,
        siteChanged,
        homeLetter,
        load,
        saveRawConfig,
        createSite,
        letterOfFile,
        nodeById,
        allKnownFiles,
        ensureBase,
        ensureContent,
        setContent,
        replaceContent,
        readSaved,
        addNode,
        createPage,
        addPagesFromFiles,
        setNodeFile,
        deleteNode,
        restoreNode,
        moveTo,
        addOrphanToMenu,
        deleteOrphan,
        restoreOrphan,
        discardFile,
        discardNode,
        discardConfig,
        discardAll,
        uploadImage,
        uploadAsset,
        listImages,
        readImage,
        analyzeImport,
        applyImport,
        save,
        persistNow,
        pendingCopy,
        clearStored,
        changedOnServer,
        restorePendingCopy,
        discardPendingCopy,
        pageFolderOf,
        relativePath,
        refreshFolders,
        keyOfFolder,
        ensureFolder
    }
}

export type DocsWorkingCopy = ReturnType<typeof useDocsWorkingCopy>
export const docsKey: InjectionKey<DocsWorkingCopy> = Symbol('docsWorkingCopy')

export function useDocs(): DocsWorkingCopy {
    const wc = inject(docsKey)
    if (!wc) throw new Error('The documentation manager state is not provided')
    return wc
}
