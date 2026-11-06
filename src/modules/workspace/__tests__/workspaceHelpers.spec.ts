import { describe, expect, it } from 'vitest'
import { canSeeWorkspaceTab, compareDocumentsDefault, filterDocuments, findFavoritesFolder, flattenCollections, formatFromContentType, fromBe1, getExecutionRoute, getRouteDocumentType, isFavoriteRow, isMineRow, isOnlyLinked, mergeDocuments, outputGroup, parseServerDate, rowCollectionLinks, snapshotsToOutputs, sortDocumentsDefault } from '../workspaceHelpers'
import { parseWorkspaceQuery, serializeWorkspaceQuery } from '../common/useWorkspaceQuery'

const FAV = 'fav-folder'
const FINANCE = 'finance'
const WEEKLY = 'weekly'

const tree: any = {
    id: null,
    name: 'root',
    children: [
        { id: FINANCE, parentId: null, name: 'Finance', description: '', progr: 1, created: '2026-01-01T00:00:00Z', children: [{ id: 'q4', parentId: FINANCE, name: 'Q4 close', description: '', progr: 1, created: '2026-01-02T00:00:00Z', children: [] }] },
        { id: FAV, parentId: null, name: 'Favorites', description: 'kn:workspace:favorites', progr: 2, created: '2026-02-01T00:00:00Z', children: [] },
        { id: 'fav-newer', parentId: null, name: 'Favorites', description: 'kn:workspace:favorites', progr: 3, created: '2026-03-01T00:00:00Z', children: [] },
        { id: WEEKLY, parentId: null, name: 'Weekly', description: '', progr: 4, created: '2026-01-03T00:00:00Z', children: [] }
    ]
}

const recents = [
    { biObjId: 5, requestTime: 1000, documentLabel: 'SALES', documentName: 'Sales', documentType: 'DASHBOARD' },
    { biObjId: 5, requestTime: 3000, documentLabel: 'SALES', documentName: 'Sales', documentType: 'DASHBOARD' },
    { biObjId: 7, requestTime: 2000, documentLabel: 'KPI_X', documentName: 'Kpi x', documentType: 'KPI' }
]
const personal = [{ id: 5, label: 'SALES', name: 'Sales', typeCode: 'DASHBOARD', creationUser: 'me', creationDate: '2026-11-04 13:07:11.0', stateCode: 'REL' }]
const contents = [
    {
        folderId: FINANCE,
        content: [
            { id: 'l1', biObjectId: 5, biObjectTypeCode: 'DASHBOARD', parentId: FINANCE, label: 'SALES', name: 'Sales', type: 'IMPORTED_DOC' },
            { id: 'l2', biObjectId: 9, biObjectTypeCode: 'REPORT', parentId: FINANCE, label: 'REP', name: 'Report', type: 'IMPORTED_DOC' },
            { id: 'v1', biObjectId: 5, biObjectTypeCode: 'DASHBOARD', parentId: FINANCE, label: 'EMEA', name: 'Q3 EMEA', description: '', documentLabel: 'SALES', type: 'VIEW' }
        ]
    },
    { folderId: WEEKLY, content: [{ id: 'l3', biObjectId: 5, biObjectTypeCode: 'DASHBOARD', parentId: WEEKLY, label: 'SALES', name: 'Sales', type: 'IMPORTED_DOC' }] },
    { folderId: FAV, content: [{ id: 'l4', biObjectId: 7, biObjectTypeCode: 'KPI', parentId: FAV, label: 'KPI_X', name: 'Kpi x', type: 'IMPORTED_DOC' }] }
]

const rows = mergeDocuments(recents, personal, contents)
const byKey = (key: string) => rows.find((r) => r.key === key)!
const ctx = { favoritesFolderId: FAV, userId: 'me' }
const filters = (patch: any = {}) => ({ scope: 'all', types: [], collection: null, q: '', ...patch })

describe('mergeDocuments', () => {
    it('keeps one row for a document found in recents, the personal folder and two collections', () => {
        expect(rows.filter((r) => r.biObjectId === 5 && r.kind === 'DOCUMENT')).toHaveLength(1)
        const sales = byKey('d5')
        expect(sales.personal).toBe(true)
        expect(sales.lastRun).toBe(3000)
        expect(sales.creationUser).toBe('me')
        expect(sales.links.map((l) => l.folderId).sort()).toEqual([FINANCE, WEEKLY].sort())
    })

    it('creates rows for documents known only from recents or links', () => {
        expect(byKey('d7').typeCode).toBe('KPI')
        expect(byKey('d7').creationUser).toBeUndefined()
        expect(byKey('d9').links).toEqual([{ linkId: 'l2', folderId: FINANCE }])
    })

    it('makes a row per view, with the name of its dashboard', () => {
        const view = byKey('vv1')
        expect(view.kind).toBe('VIEW')
        expect(view.viewOf).toEqual({ biObjectId: 5, name: 'Sales', label: 'SALES' })
        expect(view.links).toEqual([{ folderId: FINANCE }])
    })
})

describe('fromBe1', () => {
    it('maps documents and views to the same rows as the fallback', () => {
        const be1 = fromBe1([
            { kind: 'DOCUMENT', id: 5, biObjectId: 5, label: 'SALES', name: 'Sales', typeCode: 'DASHBOARD', creationUser: 'me', lastRun: 3000, personal: true, links: [{ linkId: 'l1', folderId: FINANCE }] },
            { kind: 'VIEW', id: 'v1', biObjectId: 5, documentLabel: 'SALES', documentName: 'Sales', biObjectTypeCode: 'DASHBOARD', name: 'Q3 EMEA', lastRun: null, personal: true, links: [{ folderId: FINANCE }] }
        ])
        expect(be1.map((r) => r.key)).toEqual(['d5', 'vv1'])
        expect(be1[1].viewOf?.name).toBe('Sales')
        expect(be1[1].lastRun).toBeUndefined()
        expect(be1[0].lastRun).toBe(3000)
    })
})

describe('Favorites and collections', () => {
    it('finds the oldest Favorites folder and hides every Favorites folder from the collections', () => {
        expect(findFavoritesFolder(tree)?.id).toBe(FAV)
        const collections = flattenCollections(tree)
        expect(collections.map((c) => c.path)).toEqual(['Finance', 'Finance › Q4 close', 'Weekly'])
        expect(collections[1].depth).toBe(1)
    })

    it('derives fav, mine and the collection links', () => {
        expect(isFavoriteRow(byKey('d7'), FAV)).toBe(true)
        expect(isFavoriteRow(byKey('d5'), FAV)).toBe(false)
        expect(rowCollectionLinks(byKey('d7'), FAV)).toEqual([])
        expect(isMineRow(byKey('d5'), 'me')).toBe(true)
        expect(isMineRow(byKey('d9'), 'me')).toBe(false)
        expect(isMineRow(byKey('vv1'), 'me')).toBe(true)
        expect(isOnlyLinked(byKey('d9'))).toBe(true)
        expect(isOnlyLinked(byKey('d5'))).toBe(false)
    })
})

describe('filterDocuments', () => {
    it('applies the scopes', () => {
        expect(
            filterDocuments(rows, filters({ scope: 'recent' }), ctx)
                .map((r) => r.key)
                .sort()
        ).toEqual(['d5', 'd7'])
        expect(filterDocuments(rows, filters({ scope: 'fav' }), ctx).map((r) => r.key)).toEqual(['d7'])
        expect(
            filterDocuments(rows, filters({ scope: 'mine' }), ctx)
                .map((r) => r.key)
                .sort()
        ).toEqual(['d5', 'vv1'])
        expect(filterDocuments(rows, filters(), ctx)).toHaveLength(4)
    })

    it('filters by type (views have their own type) and by one collection, without its subfolders', () => {
        expect(filterDocuments(rows, filters({ types: ['VIEW'] }), ctx).map((r) => r.key)).toEqual(['vv1'])
        expect(
            filterDocuments(rows, filters({ types: ['DASHBOARD', 'KPI'] }), ctx)
                .map((r) => r.key)
                .sort()
        ).toEqual(['d5', 'd7'])
        expect(
            filterDocuments(rows, filters({ collection: FINANCE }), ctx)
                .map((r) => r.key)
                .sort()
        ).toEqual(['d5', 'd9', 'vv1'])
        expect(filterDocuments(rows, filters({ collection: 'q4' }), ctx)).toHaveLength(0)
    })

    it('searches the name only', () => {
        expect(filterDocuments(rows, filters({ q: 'emea' }), ctx).map((r) => r.key)).toEqual(['vv1'])
        // a view whose dashboard is "Sales" does not match: only its own name counts
        expect(filterDocuments(rows, filters({ q: 'sales' }), ctx).map((r) => r.key)).toEqual(['d5'])
        expect(filterDocuments(rows, filters({ q: 'kpi x' }), ctx).map((r) => r.key)).toEqual(['d7'])
        // the label (KPI_X) and the type are not searched
        expect(filterDocuments(rows, filters({ q: 'kpi_x' }), ctx)).toHaveLength(0)
        expect(filterDocuments(rows, filters({ q: 'dashboard' }), ctx)).toHaveLength(0)
    })
})

describe('default sort', () => {
    it('puts the last run first, then the rows never run by name', () => {
        expect(sortDocumentsDefault(rows).map((r) => r.key)).toEqual(['d5', 'd7', 'vv1', 'd9'])
        expect(compareDocumentsDefault(byKey('d9'), byKey('d5'))).toBeGreaterThan(0)
    })
})

describe('run route', () => {
    it.each([
        ['DATAMART', 'registry'],
        ['DOCUMENT_COMPOSITE', 'document-composite'],
        ['OFFICE_DOC', 'office-doc'],
        ['OLAP', 'olap'],
        ['MAP', 'map'],
        ['REPORT', 'report'],
        ['KPI', 'kpi'],
        ['DOSSIER', 'dossier'],
        ['ETL', 'etl'],
        ['DASHBOARD', 'dashboard'],
        ['UNKNOWN', 'dashboard']
    ])('maps %s to %s', (typeCode, route) => {
        expect(getRouteDocumentType({ typeCode })).toBe(route)
    })

    it('opens documents by label and views with their dashboard label', () => {
        expect(getExecutionRoute(byKey('d7'))).toBe('/workspace/kpi/KPI_X')
        expect(getExecutionRoute(byKey('vv1'))).toBe('/workspace/dashboard-view/SALES?viewName=Q3 EMEA&viewId=v1')
        expect(getExecutionRoute({ ...byKey('vv1'), typeCode: 'DOCUMENT_COMPOSITE' })).toBe('/workspace/cockpit-view/SALES?viewName=Q3 EMEA&viewId=v1')
        expect(getExecutionRoute({ ...byKey('d7'), label: '' })).toBeNull()
    })
})

describe('tabs, data and scheduled', () => {
    it('shows a tab with its functionality', () => {
        const user = (functionalities: string[], isSuperadmin = false) => ({ functionalities, isSuperadmin })
        expect(canSeeWorkspaceTab(user([]), 'documents')).toBe(true)
        expect(canSeeWorkspaceTab(user([]), 'datasets')).toBe(false)
        expect(canSeeWorkspaceTab(user(['SelfServiceDatasetManagement']), 'datasets')).toBe(true)
        expect(canSeeWorkspaceTab(user(['BuildQbeQueriesFunctionality']), 'datasets')).toBe(false)
        expect(canSeeWorkspaceTab(user(['BuildQbeQueriesFunctionality']), 'models')).toBe(true)
        expect(canSeeWorkspaceTab(user(['SeeSnapshotsFunctionality']), 'scheduled')).toBe(false)
        expect(canSeeWorkspaceTab(user(['SeeSnapshotsFunctionality', 'ViewScheduledWorkspace']), 'scheduled')).toBe(true)
        expect(canSeeWorkspaceTab(user([], true), 'scheduled')).toBe(true)
    })

    it('maps snapshots to outputs and groups them', () => {
        const response = { trig: { 123: [{ id: 21, biobjId: 2, name: 'snap', dateCreation: 1000, contentType: 'application/pdf;charset=UTF-8' }] } }
        const outputs = snapshotsToOutputs(response, { jobName: 'job', jobGroup: 'grp' }, () => 'Doc')
        expect(outputs).toEqual([{ key: 's21', snapshotId: 21, biObjectId: 2, documentName: 'Doc', jobName: 'job', jobGroup: 'grp', name: 'snap', created: 1000, contentType: 'application/pdf;charset=UTF-8', format: 'PDF' }])
        expect(formatFromContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('XLSX')
        const now = new Date('2026-11-04T12:00:00').getTime()
        expect(outputGroup(new Date('2026-11-04T07:00:00').getTime(), now)).toBe('today')
        expect(outputGroup(new Date('2026-11-01T07:00:00').getTime(), now)).toBe('thisWeek')
        expect(outputGroup(new Date('2026-10-01T07:00:00').getTime(), now)).toBe('earlier')
    })

    it('reads the server date formats', () => {
        expect(parseServerDate('2026-11-04 13:07:11.0')).toBe(new Date('2026-11-04T13:07:11').getTime())
        expect(parseServerDate(5)).toBe(5)
        expect(parseServerDate(null)).toBeUndefined()
    })
})

describe('query state', () => {
    const schema = {
        scope: { param: 'scope', kind: 'enum', values: ['all', 'recent'], default: 'all' },
        kind: { param: 'kind', kind: 'list', values: ['DATASET', 'MODEL'], lowercase: true },
        q: { param: 'q', kind: 'string' }
    } as const

    it('ignores unknown values and writes only what differs from the defaults', () => {
        const state = parseWorkspaceQuery(schema, { scope: 'bogus', kind: 'model,thing', q: 'x' })
        expect(state).toEqual({ scope: 'all', kind: ['MODEL'], q: 'x' })
        expect(serializeWorkspaceQuery(schema, state)).toEqual({ kind: 'model', q: 'x' })
    })
})
