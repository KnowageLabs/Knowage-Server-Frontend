export type iDocsLetter = 'U' | 'M' | 'R' | 'D'

export interface iDocsSite {
    title: string
    // true: the tenant logo. A string: an image (http or data URL, or a path under docs). false: no logo.
    logo: boolean | string
    dense: boolean
    menu: boolean
}

export interface iDocsNode {
    // Generated on load. It is never written to config.json.
    id: string
    parentId: string | null
    label: string
    // Relative to docs, without the leading slash. Empty: the node has no page.
    file: string
    roles: string[]
    // Every key of the node that the manager does not edit (header, hand-written keys).
    extra: Record<string, any>
    deleted?: boolean
}

export interface iDocsBaseFile {
    lastModified?: number | string
    size?: number
    // Loaded on the first open of the file.
    content?: string
}

export interface iDocsState {
    baseConfig: any | null
    baseSite: iDocsSite
    baseNodes: iDocsNode[]
    baseFiles: Record<string, iDocsBaseFile>
    site: iDocsSite
    nodes: iDocsNode[]
    // Only the files that were opened or changed.
    contents: Record<string, string>
    // Saved files that Save deletes and that no node uses (Not in menu).
    deletedPaths: string[]
}

export type iDocsChangeReason = 'new' | 'content' | 'renamed' | 'settings' | 'deletedNode' | 'removedFile'

export interface iDocsChange {
    kind: 'page' | 'config' | 'delete'
    letter: iDocsLetter
    path: string
    oldPath?: string
    // A renamed page: the old file is deleted after the new one is written, unless another node still uses it.
    deleteOld?: boolean
    reason: iDocsChangeReason
    nodeId?: string
}

export type iDocsDropPosition = 'before' | 'after' | 'inside' | 'end'

export interface iDocsZipEntry {
    path: string
    size: number
}

export type iDocsSkipReason = 'unsafePath' | 'badName' | 'unsupported' | 'tooManyEntries' | 'tooLarge'

export interface iDocsZipResult {
    pages: iDocsZipEntry[]
    images: iDocsZipEntry[]
    config: iDocsZipEntry | null
    skipped: { path: string; reason: iDocsSkipReason }[]
}

export interface iDocsWorkingCopyStorage {
    version: 1
    savedAt: number
    site: iDocsSite
    nodes: iDocsNode[]
    // The base tree of that time, so the ids of the nodes still match it after a reload.
    baseNodes: iDocsNode[]
    // The changed pages only.
    contents: Record<string, string>
    deletedPaths: string[]
    // The lastModified of each base file when the copy was made.
    baseModified: Record<string, number | string | undefined>
}

export interface iDocsSaveRowResult {
    path: string
    state: 'saved' | 'failed' | 'notTried'
    message?: string
}
