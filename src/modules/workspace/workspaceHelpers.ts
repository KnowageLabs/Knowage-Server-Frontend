import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { IFolder, ITrigger, WsCollection, WsDataFilters, WsDataRow, WsDocumentFilters, WsDocumentRow, WsJobRow, WsLink, WsOutputRow, WsScheduledFilters, WsTab } from './Workspace'

export const WORKSPACE_TABS: WsTab[] = ['documents', 'datasets', 'models', 'scheduled']

// The Favorites folder is a top-level workspace folder marked by its description (spec 7.3).
export const FAVORITES_MARKER = 'kn:workspace:favorites'
export const FAVORITES_NAME = 'Favorites'

const F = UserFunctionalitiesConstants

const hasFunctionality = (user: any, functionality: string): boolean => !!user?.functionalities?.includes(functionality)

// One rule per tab, used by the tab strip and by the route guard (spec 5.2).
export function canSeeWorkspaceTab(user: any, tab: WsTab): boolean {
    if (!user) return false
    if (tab === 'documents') return true
    if (tab === 'datasets') return canSeeDatasets(user)
    if (tab === 'models') return canSeeBusinessModels(user)
    if (tab === 'scheduled') return !!user.isSuperadmin || (hasFunctionality(user, F.SEE_SNAPSHOTS_FUNCTIONALITY) && hasFunctionality(user, F.VIEW_SCHEDULED_WORKSPACE))
    return false
}

export const canUseCollections = (user: any): boolean => hasFunctionality(user, F.SAVE_INTO_FOLDER_FUNCTIONALITY)
export const canSeeDatasets = (user: any): boolean => !!user?.isSuperadmin || hasFunctionality(user, F.SELF_SERVICE_DATASET_MANAGEMENT)
export const canSeeBusinessModels = (user: any): boolean => !!user?.isSuperadmin || hasFunctionality(user, F.BUILD_QBE_QUERIES_FUNCTIONALITY)
export const canCloneDataset = (user: any): boolean => hasFunctionality(user, F.DATASET_MANAGEMENT)
export const canRunJobs = (user: any): boolean => hasFunctionality(user, F.RUN_SNAPSHOTS_FUNCTIONALITY)

// Server dates come as ISO strings, epoch ms, or "2026-11-04 13:07:11.0".
export function parseServerDate(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined
    if (typeof value === 'number') return value
    const normalized = String(value).replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(\.\d+)?$/, '$1T$2')
    const time = new Date(normalized).getTime()
    return Number.isNaN(time) ? undefined : time
}

// ---------- Folders, Favorites, collections ----------

export const isFavoritesFolder = (folder: { description?: string | null; parentId?: string | null } | null | undefined): boolean => !!folder && !folder.parentId && folder.description === FAVORITES_MARKER

// When two Favorites folders exist (two tabs created one at the same time), the oldest one wins.
export function findFavoritesFolder(tree: IFolder | null | undefined): IFolder | null {
    const candidates = (tree?.children ?? []).filter((folder) => isFavoritesFolder(folder))
    if (candidates.length === 0) return null
    return [...candidates].sort((a, b) => (parseServerDate(a.created) ?? 0) - (parseServerDate(b.created) ?? 0))[0]
}

// Every folder of the tree except the root and the Favorites folders, in tree order.
export function flattenCollections(tree: IFolder | null | undefined): WsCollection[] {
    const out: WsCollection[] = []
    const walk = (folders: IFolder[], depth: number, parentPath: string) => {
        const sorted = [...folders].sort((a, b) => (a.progr ?? 0) - (b.progr ?? 0) || a.name.localeCompare(b.name))
        for (const folder of sorted) {
            if (depth === 0 && isFavoritesFolder(folder)) continue
            const path = parentPath ? `${parentPath} › ${folder.name}` : folder.name
            out.push({ id: folder.id as string, name: folder.name, description: folder.description ?? '', parentId: folder.parentId, depth, path, created: folder.created, progr: folder.progr, childCount: folder.children?.length ?? 0 })
            walk(folder.children ?? [], depth + 1, path)
        }
    }
    walk(tree?.children ?? [], 0, '')
    return out
}

// All folder ids of the tree (Favorites included), used to fetch folder contents in the fallback load.
export function allFolderIds(tree: IFolder | null | undefined): string[] {
    const ids: string[] = []
    const walk = (folders: IFolder[]) =>
        folders.forEach((folder) => {
            if (folder.id) ids.push(folder.id)
            walk(folder.children ?? [])
        })
    walk(tree?.children ?? [])
    return ids
}

// ---------- Document rows ----------

export const documentKey = (biObjectId: number | string) => `d${biObjectId}`
export const viewKey = (viewId: number | string) => `v${viewId}`

export interface WsFolderContent {
    folderId: string
    content: any[]
}

// Fallback load: one row per document of recents, personal folder and folder links, one row per saved view (plan section 4).
export function mergeDocuments(recents: any[], personalDocs: any[], folderContents: WsFolderContent[]): WsDocumentRow[] {
    const rows = new Map<string, WsDocumentRow>()
    const views: WsDocumentRow[] = []

    for (const doc of personalDocs ?? []) {
        rows.set(documentKey(doc.id), {
            kind: 'DOCUMENT',
            key: documentKey(doc.id),
            id: doc.id,
            biObjectId: doc.id,
            label: doc.label,
            name: doc.name,
            description: doc.description ?? undefined,
            typeCode: doc.typeCode,
            creationUser: doc.creationUser,
            creationDate: doc.creationDate,
            stateCode: doc.stateCode,
            previewFile: doc.previewFile ?? undefined,
            personal: true,
            links: []
        })
    }

    for (const recent of recents ?? []) {
        const key = documentKey(recent.biObjId)
        let row = rows.get(key)
        if (!row) {
            row = { kind: 'DOCUMENT', key, id: recent.biObjId, biObjectId: recent.biObjId, label: recent.documentLabel, name: recent.documentName ?? recent.documentLabel, description: recent.documentDescription ?? undefined, typeCode: recent.documentType, previewFile: recent.previewFile ?? undefined, personal: false, links: [] }
            rows.set(key, row)
        }
        const time = parseServerDate(recent.requestTime)
        if (time !== undefined && (row.lastRun === undefined || time > row.lastRun)) row.lastRun = time
    }

    for (const folder of folderContents ?? []) {
        for (const item of folder.content ?? []) {
            if (item.type === 'VIEW') {
                views.push({
                    kind: 'VIEW',
                    key: viewKey(item.id),
                    id: item.id,
                    biObjectId: item.biObjectId,
                    label: item.documentLabel,
                    name: item.name,
                    description: item.description || undefined,
                    typeCode: item.biObjectTypeCode,
                    viewOf: { biObjectId: item.biObjectId, name: item.documentLabel, label: item.documentLabel },
                    creationDate: item.created,
                    personal: true,
                    links: [{ folderId: item.parentId ?? folder.folderId }]
                })
                continue
            }
            const key = documentKey(item.biObjectId)
            let row = rows.get(key)
            if (!row) {
                row = { kind: 'DOCUMENT', key, id: item.biObjectId, biObjectId: item.biObjectId, label: item.label, name: item.name, description: item.description || undefined, typeCode: item.biObjectTypeCode, personal: false, links: [] }
                rows.set(key, row)
            }
            const link: WsLink = { linkId: item.id, folderId: item.parentId ?? folder.folderId }
            if (!row.links.some((l) => l.linkId === link.linkId)) row.links.push(link)
        }
    }

    return [...rows.values(), ...resolveViewParents(views, rows)]
}

// A view shows its dashboard's name when the dashboard is a row of the list, else its label.
function resolveViewParents(views: WsDocumentRow[], rows: Map<string, WsDocumentRow>): WsDocumentRow[] {
    return views.map((view) => {
        const parent = rows.get(documentKey(view.biObjectId))
        if (parent && view.viewOf) view.viewOf = { ...view.viewOf, name: parent.name, label: parent.label }
        return view
    })
}

// BE1 path: the server already merged the list (backend spec 3).
export function fromBe1(items: any[]): WsDocumentRow[] {
    const rows: WsDocumentRow[] = (items ?? []).map((item: any) => {
        const isView = item.kind === 'VIEW'
        return {
            kind: isView ? 'VIEW' : 'DOCUMENT',
            key: isView ? viewKey(item.id) : documentKey(item.biObjectId ?? item.id),
            id: item.id,
            biObjectId: item.biObjectId ?? item.id,
            label: isView ? item.documentLabel : item.label,
            name: item.name,
            description: item.description || undefined,
            typeCode: isView ? (item.biObjectTypeCode ?? item.typeCode) : item.typeCode,
            viewOf: isView ? { biObjectId: item.biObjectId, name: item.documentName ?? item.documentLabel, label: item.documentLabel } : undefined,
            creationUser: item.creationUser ?? undefined,
            creationDate: item.creationDate ?? undefined,
            stateCode: item.stateCode ?? undefined,
            previewFile: item.previewFile ?? undefined,
            lastRun: isView ? undefined : parseServerDate(item.lastRun),
            personal: isView ? true : !!item.personal,
            links: (item.links ?? []).map((l: any) => ({ linkId: l.linkId ?? undefined, folderId: l.folderId }))
        } as WsDocumentRow
    })
    const byKey = new Map(rows.filter((r) => r.kind === 'DOCUMENT').map((r) => [r.key, r]))
    return [
        ...byKey.values(),
        ...resolveViewParents(
            rows.filter((r) => r.kind === 'VIEW'),
            byKey
        )
    ]
}

export const isRecentRow = (row: WsDocumentRow): boolean => row.lastRun !== undefined && row.lastRun !== null
export const isFavoriteRow = (row: WsDocumentRow, favoritesFolderId: string | null): boolean => row.kind === 'DOCUMENT' && !!favoritesFolderId && row.links.some((l) => l.folderId === favoritesFolderId)
export const isMineRow = (row: WsDocumentRow, userId: string | undefined): boolean => row.kind === 'VIEW' || row.personal || (!!userId && row.creationUser === userId)
export const rowCollectionLinks = (row: WsDocumentRow, favoritesFolderId: string | null): WsLink[] => row.links.filter((l) => l.folderId !== favoritesFolderId)

// "Remove from workspace": a document that is only there because of folder links (not personal, not only a recent).
export const isOnlyLinked = (row: WsDocumentRow): boolean => row.kind === 'DOCUMENT' && !row.personal && row.links.length > 0

// The type key of the Type filter: views have their own type.
export const rowTypeKey = (row: WsDocumentRow): string => (row.kind === 'VIEW' ? 'VIEW' : row.typeCode)

export interface WsDocumentContext {
    favoritesFolderId: string | null
    userId?: string
    typeLabel?: (typeKey: string) => string
}

export function inDocumentScope(row: WsDocumentRow, scope: WsDocumentFilters['scope'], ctx: WsDocumentContext): boolean {
    if (scope === 'recent') return row.kind === 'DOCUMENT' && isRecentRow(row)
    if (scope === 'fav') return isFavoriteRow(row, ctx.favoritesFolderId)
    if (scope === 'mine') return isMineRow(row, ctx.userId)
    return true
}

// The search matches the Name column only, on every tab (user decision 2026-11-04).
const nameMatches = (name: string | undefined, q: string): boolean => {
    const needle = q.trim().toLowerCase()
    return !needle || (name ?? '').toLowerCase().includes(needle)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function documentMatchesSearch(row: WsDocumentRow, q: string, _ctx?: WsDocumentContext): boolean {
    return nameMatches(row.name, q)
}

export function filterDocuments(rows: WsDocumentRow[], filters: WsDocumentFilters, ctx: WsDocumentContext): WsDocumentRow[] {
    return rows.filter((row) => {
        if (!inDocumentScope(row, filters.scope, ctx)) return false
        if (filters.types.length && !filters.types.includes(rowTypeKey(row))) return false
        if (filters.collection && !row.links.some((l) => l.folderId === filters.collection)) return false
        return documentMatchesSearch(row, filters.q, ctx)
    })
}

// Default sort (spec 7.1): last run newest first, then the rows never run, by name.
export function compareDocumentsDefault(a: WsDocumentRow, b: WsDocumentRow): number {
    const ra = a.lastRun ?? null
    const rb = b.lastRun ?? null
    if (ra !== null && rb !== null && ra !== rb) return rb - ra
    if (ra !== null && rb === null) return -1
    if (ra === null && rb !== null) return 1
    return (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' })
}

export const sortDocumentsDefault = (rows: WsDocumentRow[]): WsDocumentRow[] => [...rows].sort(compareDocumentsDefault)

// ---------- Run (spec 7.6). getRouteDocumentType and the route rules are moved unchanged from Workspace.vue. ----------

export function getRouteDocumentType(item: any): string {
    let routeDocumentType = item.biObjectTypeCode === 'DOCUMENT_COMPOSITE' ? 'document-composite' : 'dashboard'

    const type = item.typeCode ? item.typeCode : item.documentType

    switch (type) {
        case 'DATAMART':
            routeDocumentType = 'registry'
            break
        case 'DOCUMENT_COMPOSITE':
            routeDocumentType = 'document-composite'
            break
        case 'OFFICE_DOC':
            routeDocumentType = 'office-doc'
            break
        case 'OLAP':
            routeDocumentType = 'olap'
            break
        case 'MAP':
            routeDocumentType = 'map'
            break
        case 'REPORT':
            routeDocumentType = 'report'
            break
        case 'KPI':
            routeDocumentType = 'kpi'
            break
        case 'DOSSIER':
            routeDocumentType = 'dossier'
            break
        case 'ETL':
            routeDocumentType = 'etl'
            break
    }

    return routeDocumentType
}

export function getExecutionRouteForDocument(document: any, label: string): string {
    const isView = document.type === 'VIEW'
    let routeType = ''
    if (isView && document.biObjectTypeCode === 'DASHBOARD') routeType = isView && !document.executeAsDocument ? 'dashboard-view' : 'dashboard'
    else if (isView) routeType = isView && !document.executeAsDocument ? 'cockpit-view' : 'document-composite'
    else routeType = getRouteDocumentType(document)
    let route = `/workspace/${routeType}/${label}`
    if (isView && !document.executeAsDocument) route += `?viewName=${document.name}&viewId=${document.id}`
    return route
}

// The route of a list row, or null when the row has no label (the caller shows an error, B9).
export function getExecutionRoute(row: WsDocumentRow): string | null {
    const isView = row.kind === 'VIEW'
    const label = isView ? row.viewOf?.label : row.label
    if (!label) return null
    const document = isView ? { type: 'VIEW', biObjectTypeCode: row.typeCode, name: row.name, id: row.id } : { type: 'DOCUMENT', typeCode: row.typeCode }
    return getExecutionRouteForDocument(document, label)
}

// ---------- Data rows (spec 8) ----------

export function datasetToRow(dataset: any, categories: Record<number, string>, userId: string | undefined): WsDataRow {
    return {
        kind: 'DATASET',
        key: `ds${dataset.id}`,
        id: dataset.id,
        label: dataset.label,
        name: dataset.name,
        description: dataset.description ?? undefined,
        dsTypeCd: dataset.dsTypeCd,
        category: categories[dataset.catTypeId] ?? dataset.catTypeCd ?? undefined,
        tags: (dataset.tags ?? []).map((tag: any) => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean),
        owner: dataset.owner,
        modified: dataset.dateIn,
        mine: !!userId && dataset.owner === userId,
        raw: dataset
    }
}

export function businessModelToRow(model: any, categories: Record<number, string>): WsDataRow {
    return {
        kind: 'MODEL',
        key: `bm${model.id}`,
        id: model.id,
        name: model.name,
        description: model.description ?? undefined,
        category: categories[model.category] ?? undefined,
        tags: [],
        dataSourceLabel: model.dataSourceLabel,
        mine: false,
        raw: model
    }
}

export function categoryMap(domains: any[]): Record<number, string> {
    return Object.fromEntries((domains ?? []).map((d: any) => [d.VALUE_ID, d.VALUE_CD ?? d.VALUE_NM]))
}

export function dataMatchesSearch(row: WsDataRow, q: string): boolean {
    return nameMatches(row.name, q)
}

// Filters without the scope (the store gives the rows of the scope).
export function filterData(rows: WsDataRow[], filters: Omit<WsDataFilters, 'scope'>): WsDataRow[] {
    return rows.filter((row) => {
        if (filters.dsTypes.length && (row.kind !== 'DATASET' || !filters.dsTypes.includes(row.dsTypeCd ?? ''))) return false
        if (filters.categories.length && !filters.categories.includes(row.category ?? '')) return false
        return dataMatchesSearch(row, filters.q)
    })
}

// ---------- Scheduled (spec 10) ----------

const FORMATS: [RegExp, string][] = [
    [/pdf/i, 'PDF'],
    [/spreadsheetml|ms-excel|xlsx/i, 'XLSX'],
    [/presentationml|powerpoint/i, 'PPTX'],
    [/wordprocessingml|msword/i, 'DOCX'],
    [/csv/i, 'CSV'],
    [/html/i, 'HTML'],
    [/png/i, 'PNG'],
    [/jpe?g/i, 'JPG'],
    [/zip/i, 'ZIP'],
    [/json/i, 'JSON'],
    [/xml/i, 'XML'],
    [/text\/plain/i, 'TXT']
]

export function formatFromContentType(contentType: string | null | undefined): string {
    if (!contentType) return '?'
    const found = FORMATS.find(([re]) => re.test(contentType))
    if (found) return found[1]
    const subtype = contentType.split(';')[0].split('/')[1] ?? contentType
    return subtype.toUpperCase()
}

// getSnapshootBySchedulation answers { [trigger]: { [startDate]: snapshot[] } }.
export function snapshotsToOutputs(response: any, job: { jobName: string; jobGroup: string }, documentName: (biObjectId: number) => string): WsOutputRow[] {
    const out: WsOutputRow[] = []
    for (const byStart of Object.values(response ?? {})) {
        for (const snapshots of Object.values(byStart as any)) {
            for (const snapshot of snapshots as any[]) {
                out.push({
                    key: `s${snapshot.id}`,
                    snapshotId: snapshot.id,
                    biObjectId: snapshot.biobjId,
                    documentName: documentName(snapshot.biobjId),
                    jobName: job.jobName,
                    jobGroup: job.jobGroup,
                    name: snapshot.name,
                    created: snapshot.dateCreation,
                    contentType: snapshot.contentType,
                    format: formatFromContentType(snapshot.contentType)
                })
            }
        }
    }
    return out
}

export function jobToRow(job: any): WsJobRow {
    return {
        key: `${job.jobGroup}/${job.jobName}`,
        jobName: job.jobName,
        jobGroup: job.jobGroup,
        description: job.jobDescription ?? '',
        documents: (job.documents ?? []).map((d: any) => d.nameTitle ?? d.name),
        triggers: (job.triggers ?? []).map((t: any) => ({ jobName: t.jobName ?? job.jobName, jobGroup: t.jobGroup ?? job.jobGroup, triggerName: t.triggerName, triggerGroup: t.triggerGroup }) as ITrigger)
    }
}

export type WsOutputGroup = 'today' | 'thisWeek' | 'earlier'

export function outputGroup(created: number, now: number = Date.now()): WsOutputGroup {
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    if (created >= startOfToday.getTime()) return 'today'
    if (created >= startOfToday.getTime() - 6 * 24 * 3600 * 1000) return 'thisWeek'
    return 'earlier'
}

export function outputMatchesSearch(row: WsOutputRow, q: string): boolean {
    return nameMatches(row.documentName, q)
}

export function filterOutputs(rows: WsOutputRow[], filters: Omit<WsScheduledFilters, 'view'>): WsOutputRow[] {
    return rows
        .filter((row) => {
            if (filters.jobs.length && !filters.jobs.includes(row.jobName)) return false
            if (filters.formats.length && !filters.formats.includes(row.format)) return false
            return outputMatchesSearch(row, filters.q)
        })
        .sort((a, b) => b.created - a.created)
}

export function filterJobs(rows: WsJobRow[], q: string): WsJobRow[] {
    return rows.filter((row) => nameMatches(row.jobName, q))
}

// ---------- Display ----------

export const DOCUMENT_TYPE_ICONS: Record<string, string> = {
    DASHBOARD: 'sym_o_dashboard',
    DOCUMENT_COMPOSITE: 'sym_o_grid_view',
    REPORT: 'sym_o_description',
    KPI: 'sym_o_speed',
    MAP: 'sym_o_map',
    DOSSIER: 'sym_o_menu_book',
    DATAMART: 'sym_o_table_view',
    OLAP: 'sym_o_view_in_ar',
    OFFICE_DOC: 'sym_o_article',
    ETL: 'sym_o_sync_alt',
    VIEW: 'sym_o_bookmark'
}

export const documentTypeIcon = (typeKey: string): string => DOCUMENT_TYPE_ICONS[typeKey] ?? 'sym_o_draft'

const KNOWN_TYPE_LABELS = ['DASHBOARD', 'DOCUMENT_COMPOSITE', 'REPORT', 'KPI', 'MAP', 'DOSSIER', 'DATAMART', 'OLAP', 'OFFICE_DOC', 'ETL', 'VIEW']

// The i18n key of a type, or null for a type the page does not name (it then shows the code).
export const documentTypeLabelKey = (typeKey: string): string | null => (KNOWN_TYPE_LABELS.includes(typeKey) ? `workspace.types.${typeKey}` : null)

export function formatRelativeTime(time: number, locale: string, now: number = Date.now()): string {
    const seconds = Math.round((time - now) / 1000)
    const abs = Math.abs(seconds)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (abs < 60) return rtf.format(seconds, 'second')
    if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
    if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
    if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), 'day')
    if (abs < 86400 * 365) return rtf.format(Math.round(seconds / (86400 * 30)), 'month')
    return rtf.format(Math.round(seconds / (86400 * 365)), 'year')
}
