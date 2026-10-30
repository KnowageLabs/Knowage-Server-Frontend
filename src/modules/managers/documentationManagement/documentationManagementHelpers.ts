import type { iDocsChange, iDocsDropPosition, iDocsLetter, iDocsNode, iDocsSite, iDocsSkipReason, iDocsState, iDocsZipEntry, iDocsZipResult } from './DocumentationManagement'

export const HOME_FILE = 'index.md'
export const MAX_ZIP_ENTRIES = 500
export const MAX_ZIP_BYTES = 50 * 1024 * 1024
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']
// The server rule for upload names: [\w,\s\-_().]+
const SERVER_NAME_RULE = /^[\w,\s\-_().]+$/

export function newId(): string {
    return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `n${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
}

// ── config.json <-> nodes ─────────────────────────────────

export function normalizeFile(path: unknown): string {
    return typeof path === 'string' ? path.trim().replace(/^\/+/, '') : ''
}

export function configToSite(config: any): iDocsSite {
    const logo = config?.logo
    return {
        title: typeof config?.title === 'string' ? config.title : '',
        logo: logo === true ? true : typeof logo === 'string' && logo ? logo : false,
        dense: config?.dense === true,
        menu: config?.menu !== false
    }
}

export function configToNodes(config: any): iDocsNode[] {
    const nodes: iDocsNode[] = []
    const walk = (items: any, parentId: string | null) => {
        if (!Array.isArray(items)) return
        for (const item of items) {
            if (!item || typeof item !== 'object' || Array.isArray(item)) continue
            const { label, path, roles, content, ...extra } = item
            const node: iDocsNode = {
                id: newId(),
                parentId,
                label: typeof label === 'string' ? label : '',
                file: normalizeFile(path),
                roles: Array.isArray(roles) ? roles.filter((role) => typeof role === 'string') : [],
                extra
            }
            nodes.push(node)
            walk(content, node.id)
        }
    }
    walk(config?.content, null)
    return nodes
}

// Starts from the base config, so the keys the manager does not know stay (D9).
export function nodesToConfig(baseConfig: any, site: iDocsSite, nodes: iDocsNode[]): any {
    const base = baseConfig && typeof baseConfig === 'object' && !Array.isArray(baseConfig) ? baseConfig : {}
    const out: any = { ...base }

    if (site.title || 'title' in base) out.title = site.title
    if (site.logo) out.logo = site.logo
    else if ('logo' in base) out.logo = false
    else delete out.logo
    if (site.dense || 'dense' in base) out.dense = site.dense
    else delete out.dense
    if (!site.menu || 'menu' in base) out.menu = site.menu
    else delete out.menu

    const live = nodes.filter((node) => !node.deleted)
    const build = (parentId: string | null): any[] =>
        live
            .filter((node) => node.parentId === parentId)
            .map((node) => {
                const item: any = { label: node.label }
                if (node.file) item.path = '/' + node.file
                if (node.roles.length) item.roles = [...node.roles]
                Object.assign(item, node.extra)
                const children = build(node.id)
                if (children.length) item.content = children
                return item
            })
    out.content = build(null)
    return out
}

function canonical(value: any): any {
    if (Array.isArray(value)) return value.map(canonical)
    if (value && typeof value === 'object')
        return Object.keys(value)
            .sort()
            .reduce((result: Record<string, any>, key) => {
                result[key] = canonical(value[key])
                return result
            }, {})
    return value
}

// Compares normalized structures, not text: a load followed by a compare finds no change.
export function isConfigChanged(baseConfig: any, site: iDocsSite, nodes: iDocsNode[]): boolean {
    const baseOut = nodesToConfig(baseConfig, configToSite(baseConfig), configToNodes(baseConfig))
    const current = nodesToConfig(baseConfig, site, nodes)
    return JSON.stringify(canonical(baseOut)) !== JSON.stringify(canonical(current))
}

// ── tree utilities (the flat list is in display order, a subtree is contiguous) ──

export function childrenOf(nodes: iDocsNode[], parentId: string | null): iDocsNode[] {
    return nodes.filter((node) => node.parentId === parentId)
}

export function subtreeIds(nodes: iDocsNode[], id: string): string[] {
    const ids = [id]
    for (let i = 0; i < ids.length; i++) childrenOf(nodes, ids[i]).forEach((child) => ids.push(child.id))
    return ids
}

export function depthOf(nodes: iDocsNode[], id: string): number {
    let depth = 0
    let current = nodes.find((node) => node.id === id)
    while (current?.parentId) {
        depth++
        current = nodes.find((node) => node.id === current!.parentId)
    }
    return depth
}

export function ancestorIds(nodes: iDocsNode[], id: string): string[] {
    const ids: string[] = []
    let current = nodes.find((node) => node.id === id)
    while (current?.parentId) {
        ids.push(current.parentId)
        current = nodes.find((node) => node.id === current!.parentId)
    }
    return ids
}

// Moves a node with its subtree. Returns null when the drop is refused (into the own subtree).
export function moveNode(nodes: iDocsNode[], id: string, targetId: string | null, position: iDocsDropPosition): iDocsNode[] | null {
    const moved = subtreeIds(nodes, id)
    if (position !== 'end' && targetId && moved.includes(targetId)) return null
    if (position !== 'end' && !targetId) return null

    const movedNodes = nodes.filter((node) => moved.includes(node.id)).map((node) => ({ ...node }))
    const rest = nodes.filter((node) => !moved.includes(node.id))
    const root = movedNodes.find((node) => node.id === id)!

    let index = rest.length
    if (position === 'end') root.parentId = null
    else {
        const target = rest.find((node) => node.id === targetId)
        if (!target) return null
        const targetIndex = rest.indexOf(target)
        const subtreeEnd = targetIndex + subtreeIds(rest, target.id).length
        if (position === 'before') {
            root.parentId = target.parentId
            index = targetIndex
        } else if (position === 'after') {
            root.parentId = target.parentId
            index = subtreeEnd
        } else {
            root.parentId = target.id
            index = subtreeEnd
        }
    }
    rest.splice(index, 0, ...movedNodes)
    return rest
}

// Adds a node as the last child of a parent (or at the end of the top level).
export function appendNode(nodes: iDocsNode[], node: iDocsNode, parentId: string | null): iDocsNode[] {
    const result = [...nodes]
    const index = parentId ? result.findIndex((n) => n.id === parentId) + subtreeIds(result, parentId).length : result.length
    result.splice(index, 0, { ...node, parentId })
    return result
}

// ── file names ────────────────────────────────────────────

export function slugify(label: string): string {
    const slug = label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return slug || 'page'
}

export function isValidFileName(path: string): boolean {
    if (!path || path.startsWith('/')) return false
    return path.split('/').every((segment) => SERVER_NAME_RULE.test(segment) && !/^\.+$/.test(segment))
}

export function dirname(path: string): string {
    const index = path.lastIndexOf('/')
    return index === -1 ? '' : path.slice(0, index)
}

export function basename(path: string): string {
    return path.slice(path.lastIndexOf('/') + 1)
}

export function joinPath(folder: string, name: string): string {
    return folder ? `${folder}/${name}` : name
}

// `-1`, `-2` ... when the name exists. The comparison ignores case, because the server file system may.
export function uniqueFileName(folder: string, base: string, existing: Iterable<string>, extension = '.md'): string {
    const taken = new Set(Array.from(existing, (path) => path.toLowerCase()))
    let candidate = joinPath(folder, base + extension)
    for (let i = 1; taken.has(candidate.toLowerCase()); i++) candidate = joinPath(folder, `${base}-${i}${extension}`)
    return candidate
}

// The folder where the pages of a node's children go: the folder of its own page, else the slugs of its ancestors.
export function folderForChildren(nodes: iDocsNode[], parentId: string | null): string {
    if (!parentId) return ''
    const parent = nodes.find((node) => node.id === parentId)
    if (!parent) return ''
    const dir = dirname(parent.file)
    if (dir) return dir
    return joinPath(folderForChildren(nodes, parent.parentId), slugify(parent.label))
}

export function missingFolders(paths: string[], existingFolders: Iterable<string>): string[] {
    const existing = new Set(existingFolders)
    const missing = new Set<string>()
    for (const path of paths) {
        const segments = dirname(path).split('/').filter(Boolean)
        for (let i = 1; i <= segments.length; i++) {
            const folder = segments.slice(0, i).join('/')
            if (!existing.has(folder)) missing.add(folder)
        }
    }
    return Array.from(missing).sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b))
}

// ── change marks ──────────────────────────────────────────

export function usedFiles(nodes: iDocsNode[]): Set<string> {
    const files = new Set<string>([HOME_FILE])
    nodes.forEach((node) => {
        if (!node.deleted && node.file) files.add(node.file)
    })
    return files
}

// A page file is changed when its content differs from the server, or when it is new.
export function pageChanged(state: iDocsState, path: string): boolean {
    const content = state.contents[path]
    if (content === undefined) return false
    const base = state.baseFiles[path]
    if (!base) return true
    return base.content !== undefined && content !== base.content
}

function previousSiblingId(nodes: iDocsNode[], node: iDocsNode, existingIds: Set<string>): string | null {
    const siblings = nodes.filter((n) => n.parentId === node.parentId && existingIds.has(n.id))
    const index = siblings.findIndex((n) => n.id === node.id)
    return index > 0 ? siblings[index - 1].id : null
}

function samePosition(state: iDocsState, node: iDocsNode, base: iDocsNode): boolean {
    if (node.parentId !== base.parentId) return false
    const baseIds = new Set(state.baseNodes.map((n) => n.id))
    return previousSiblingId(state.nodes, node, baseIds) === previousSiblingId(state.baseNodes, base, baseIds)
}

export function nodeLetter(state: iDocsState, node: iDocsNode): iDocsLetter | '' {
    const base = state.baseNodes.find((n) => n.id === node.id)
    if (node.deleted) return base ? 'D' : ''
    if (!base) return 'U'

    if (node.file !== base.file) {
        if (!node.file) return 'M'
        if (base.file) return 'R'
        return state.baseFiles[node.file] ? 'M' : 'U'
    }
    if (node.label !== base.label || JSON.stringify(node.roles) !== JSON.stringify(base.roles) || JSON.stringify(canonical(node.extra)) !== JSON.stringify(canonical(base.extra)) || !samePosition(state, node, base)) return 'M'
    if (node.file && pageChanged(state, node.file)) return state.baseFiles[node.file] ? 'M' : 'U'
    return ''
}

// The letter of a page file that is not a node (Home, Not in menu).
export function fileLetter(state: iDocsState, path: string): iDocsLetter | '' {
    if (state.deletedPaths.includes(path)) return 'D'
    if (!pageChanged(state, path)) return ''
    return state.baseFiles[path] ? 'M' : 'U'
}

// The save rows in write order: pages, config.json, deletes (spec 9.2).
export function buildChangeList(state: iDocsState): iDocsChange[] {
    const rows: iDocsChange[] = []
    const used = usedFiles(state.nodes)
    const seen = new Set<string>()
    const liveNodes = state.nodes.filter((node) => !node.deleted)

    const deleted = new Set<string>()
    const deleteRows: iDocsChange[] = []
    for (const node of state.nodes) {
        const base = state.baseNodes.find((n) => n.id === node.id)
        if (!node.deleted || !base || !base.file || used.has(base.file) || !state.baseFiles[base.file] || deleted.has(base.file)) continue
        deleted.add(base.file)
        deleteRows.push({ kind: 'delete', letter: 'D', path: base.file, reason: 'deletedNode', nodeId: node.id })
    }
    for (const path of state.deletedPaths) {
        if (used.has(path) || deleted.has(path) || !state.baseFiles[path]) continue
        deleted.add(path)
        deleteRows.push({ kind: 'delete', letter: 'D', path, reason: 'removedFile' })
    }

    for (const node of liveNodes) {
        if (!node.file || seen.has(node.file)) continue
        const base = state.baseNodes.find((n) => n.id === node.id)
        const renamed = !!base && !!base.file && base.file !== node.file
        const isNew = !state.baseFiles[node.file]
        if (!renamed && !pageChanged(state, node.file) && !(isNew && state.contents[node.file] !== undefined)) continue
        seen.add(node.file)
        rows.push({
            kind: 'page',
            letter: renamed ? 'R' : isNew ? 'U' : 'M',
            path: node.file,
            oldPath: renamed ? base!.file : undefined,
            deleteOld: renamed ? !used.has(base!.file) && !!state.baseFiles[base!.file] && !state.deletedPaths.includes(base!.file) : undefined,
            reason: renamed ? 'renamed' : isNew ? 'new' : 'content',
            nodeId: node.id
        })
    }
    for (const path of Object.keys(state.contents)) {
        if (seen.has(path) || deleted.has(path) || state.deletedPaths.includes(path) || !path.endsWith('.md') || !pageChanged(state, path)) continue
        // A file that no node uses (Home, Not in menu).
        seen.add(path)
        rows.push({ kind: 'page', letter: state.baseFiles[path] ? 'M' : 'U', path, reason: state.baseFiles[path] ? 'content' : 'new' })
    }

    if (state.baseConfig === null || isConfigChanged(state.baseConfig, state.site, state.nodes)) {
        rows.push({ kind: 'config', letter: state.baseConfig === null ? 'U' : 'M', path: 'config.json', reason: 'settings' })
    }

    rows.push(...deleteRows)
    return rows
}

// The .md files of docs that no node uses and that Save will not delete.
export function orphanFiles(state: iDocsState): string[] {
    const used = usedFiles(state.nodes)
    const known = new Set([...Object.keys(state.baseFiles), ...Object.keys(state.contents)])
    return Array.from(known)
        .filter((path) => path.endsWith('.md') && !used.has(path))
        .sort((a, b) => a.localeCompare(b))
}

// ── zip import ────────────────────────────────────────────

function extensionOf(path: string): string {
    const name = basename(path)
    const index = name.lastIndexOf('.')
    return index === -1 ? '' : name.slice(index + 1).toLowerCase()
}

// The import rules of spec 7.6, item 4.
export function filterZipEntries(entries: iDocsZipEntry[]): iDocsZipResult {
    const result: iDocsZipResult = { pages: [], images: [], config: null, skipped: [] }
    let count = 0
    let bytes = 0
    const skip = (path: string, reason: iDocsSkipReason) => result.skipped.push({ path, reason })

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const path = entry.path.replace(/\\/g, '/')
        if (path.endsWith('/')) continue

        if (count >= MAX_ZIP_ENTRIES || bytes + entry.size > MAX_ZIP_BYTES) {
            const reason: iDocsSkipReason = count >= MAX_ZIP_ENTRIES ? 'tooManyEntries' : 'tooLarge'
            for (let j = i; j < entries.length; j++) if (!entries[j].path.endsWith('/')) skip(entries[j].path, reason)
            break
        }
        count++
        bytes += entry.size

        const segments = path.split('/')
        if (path.startsWith('/') || /^[a-z]:/i.test(path) || segments.includes('..')) {
            skip(entry.path, 'unsafePath')
            continue
        }
        if (!isValidFileName(path)) {
            skip(entry.path, 'badName')
            continue
        }
        const extension = extensionOf(path)
        if (path === 'config.json') result.config = { path, size: entry.size }
        else if (extension === 'md') result.pages.push({ path, size: entry.size })
        else if (IMAGE_EXTENSIONS.includes(extension)) result.images.push({ path, size: entry.size })
        else skip(entry.path, 'unsupported')
    }
    return result
}

// ── reader role helpers ───────────────────────────────────

// A node keeps its id when the same label and file exist in the base. Used after a restore or an import.
export function reconcileIds(working: iDocsNode[], base: iDocsNode[]): iDocsNode[] {
    const free = [...base]
    const idMap = new Map<string, string>()
    working.forEach((node) => {
        const index = free.findIndex((b) => b.label === node.label && b.file === node.file)
        if (index === -1) return
        idMap.set(node.id, free[index].id)
        free.splice(index, 1)
    })
    return working.map((node) => ({ ...node, id: idMap.get(node.id) ?? node.id, parentId: node.parentId ? (idMap.get(node.parentId) ?? node.parentId) : null }))
}

// The path of a target (relative to docs) as written in a page of the folder fromDir.
export function relativePath(fromDir: string, target: string): string {
    const from = fromDir.split('/').filter(Boolean)
    const to = target.split('/')
    let common = 0
    while (common < from.length && common < to.length - 1 && from[common] === to[common]) common++
    return [...Array(from.length - common).fill('..'), ...to.slice(common)].join('/')
}

export function labelFromFileName(path: string): string {
    const name = basename(path).replace(/\.md$/i, '').replace(/[-_]+/g, ' ').trim()
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : path
}

// The role lists of the ancestors that have their own roles. A node is visible only to roles that are in every one of them.
export function inheritedRoles(nodes: iDocsNode[], id: string): string[][] {
    return ancestorIds(nodes, id)
        .map((ancestorId) => nodes.find((node) => node.id === ancestorId)?.roles ?? [])
        .filter((roles) => roles.length > 0)
}
