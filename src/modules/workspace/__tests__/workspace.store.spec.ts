import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IFolder } from '../Workspace'
import * as api from '../workspaceApi'
import useWorkspaceStore from '../workspace.store'

vi.mock('../workspaceApi')

const tree: IFolder = {
    id: null,
    parentId: null,
    name: 'root',
    description: '',
    progr: 0,
    created: '2026-11-11T09:00:00Z',
    children: [
        { id: 'finance', parentId: null, name: 'Finance', description: '', progr: 1, created: '2026-11-11T09:00:00Z', children: [] },
        { id: 'favorites', parentId: null, name: 'Favorites', description: 'kn:workspace:favorites', progr: 2, created: '2026-11-11T09:00:00Z', children: [] }
    ]
}

const documents = [
    {
        kind: 'DOCUMENT',
        id: 5,
        biObjectId: 5,
        label: 'SALES',
        name: 'Sales',
        description: null,
        typeCode: 'DASHBOARD',
        creationUser: 'me',
        creationDate: '2026-11-11T09:00:00Z',
        stateCode: 'REL',
        previewFile: 'sales.png',
        lastRun: '2026-11-11T10:00:00Z',
        personal: true,
        links: [{ linkId: 'sales-finance', folderId: 'finance' }, { linkId: 'sales-favorite', folderId: 'favorites' }]
    },
    {
        kind: 'DOCUMENT',
        id: 7,
        biObjectId: 7,
        label: 'REPORT',
        name: 'Report',
        description: null,
        typeCode: 'REPORT',
        creationUser: null,
        creationDate: null,
        stateCode: null,
        previewFile: null,
        lastRun: null,
        personal: false,
        links: [{ linkId: 'report-finance', folderId: 'finance' }]
    },
    {
        kind: 'VIEW',
        id: 'sales-view',
        biObjectId: 5,
        documentLabel: 'SALES',
        documentName: 'Sales',
        biObjectTypeCode: 'DASHBOARD',
        label: 'SAVED_EMEA',
        name: 'EMEA',
        description: null,
        creationUser: 'me',
        creationDate: null,
        links: [{ folderId: 'finance' }]
    }
]

describe('workspace document loading', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.stubEnv('VITE_WORKSPACE_BE1', undefined)
        setActivePinia(createPinia())
        vi.mocked(api.getFolderTree).mockResolvedValue(tree)
        vi.mocked(api.getWorkspaceDocuments).mockResolvedValue(documents)
        vi.mocked(api.getRecents).mockResolvedValue([])
        vi.mocked(api.getPersonalDocuments).mockResolvedValue([])
        vi.mocked(api.getFolderContent).mockResolvedValue([])
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('loads the aggregate and folder tree concurrently by default, sharing requests between callers', async () => {
        let resolveFolders!: (value: IFolder) => void
        vi.mocked(api.getFolderTree).mockReturnValueOnce(new Promise<IFolder>((resolve) => (resolveFolders = resolve)))
        const store = useWorkspaceStore()

        const firstLoad = store.loadDocuments()
        const secondLoad = store.loadDocuments()
        const aggregateRequestsBeforeFoldersResolve = vi.mocked(api.getWorkspaceDocuments).mock.calls.length
        resolveFolders(tree)
        await Promise.all([firstLoad, secondLoad])
        await store.loadDocuments()

        expect(aggregateRequestsBeforeFoldersResolve).toBe(1)
        expect(api.getFolderTree).toHaveBeenCalledOnce()
        expect(api.getWorkspaceDocuments).toHaveBeenCalledOnce()
        expect(api.getRecents).not.toHaveBeenCalled()
        expect(api.getPersonalDocuments).not.toHaveBeenCalled()
        expect(api.getFolderContent).not.toHaveBeenCalled()
        expect(store.documentSource).toBe('be1')
        expect(store.documents.map((row) => row.key)).toEqual(['d5', 'd7', 'vsales-view'])
        expect(store.documents[0]).toMatchObject({
            personal: true,
            lastRun: Date.parse('2026-11-11T10:00:00Z'),
            creationUser: 'me',
            creationDate: '2026-11-11T09:00:00Z',
            previewFile: 'sales.png',
            links: documents[0].links
        })
        expect(store.documents[1].lastRun).toBeUndefined()
        expect(store.documents[1].previewFile).toBeUndefined()
        expect(store.documents[2]).toMatchObject({
            kind: 'VIEW',
            name: 'EMEA',
            label: 'SALES',
            creationUser: 'me',
            viewOf: { biObjectId: 5, name: 'Sales', label: 'SALES' },
            links: [{ folderId: 'finance' }]
        })
        expect(store.favoritesFolderId).toBe('favorites')
        expect(store.documentsLoaded).toBe(true)
        expect(store.documentsLoading).toBe(false)
    })

    it('uses the legacy loader only when explicitly disabled', async () => {
        vi.stubEnv('VITE_WORKSPACE_BE1', 'false')
        const store = useWorkspaceStore()

        await store.loadDocuments()

        expect(api.getWorkspaceDocuments).not.toHaveBeenCalled()
        expect(api.getRecents).toHaveBeenCalledOnce()
        expect(api.getPersonalDocuments).toHaveBeenCalledOnce()
        expect(vi.mocked(api.getFolderContent).mock.calls).toEqual([['finance'], ['favorites']])
        expect(store.documentSource).toBe('fallback')
    })

    it('does not fan out legacy requests after an aggregate error and allows retrying', async () => {
        const error = new Error('Workspace unavailable')
        vi.mocked(api.getWorkspaceDocuments).mockRejectedValueOnce(error)
        const store = useWorkspaceStore()

        await expect(store.loadDocuments()).rejects.toBe(error)

        expect(api.getRecents).not.toHaveBeenCalled()
        expect(api.getPersonalDocuments).not.toHaveBeenCalled()
        expect(api.getFolderContent).not.toHaveBeenCalled()
        expect(store.documentsLoaded).toBe(false)
        expect(store.documentsLoading).toBe(false)

        await store.loadDocuments()

        expect(api.getWorkspaceDocuments).toHaveBeenCalledTimes(2)
        expect(store.documentsLoaded).toBe(true)
    })
})
