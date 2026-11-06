import { defineStore } from 'pinia'
import { IFolder, WsCollection, WsDataRow, WsDataScope, WsDocumentRow, WsJobRow, WsLink, WsOutputRow, WsTab } from './Workspace'
import * as api from './workspaceApi'
import { allFolderIds, businessModelToRow, categoryMap, datasetToRow, FAVORITES_MARKER, FAVORITES_NAME, findFavoritesFolder, flattenCollections, fromBe1, jobToRow, mergeDocuments, snapshotsToOutputs } from './workspaceHelpers'

type DocumentSource = 'be1' | 'fallback'

const DATASET_SCOPE_PATH: Record<WsDataScope, string> = { mine: 'owned', available: 'enterprise', all: 'mydata' }

// One request per list at a time: the shell (tab counts) and the tab can ask for the same list together.
const inflight = new Map<string, Promise<any>>()
function shared<T>(key: string, run: () => Promise<T>): Promise<T> {
    const pending = inflight.get(key)
    if (pending) return pending
    const promise = run().finally(() => inflight.delete(key))
    inflight.set(key, promise)
    return promise
}

interface IWorkspaceState {
    documents: WsDocumentRow[]
    documentsLoaded: boolean
    documentsLoading: boolean
    documentSource: DocumentSource | null
    folderTree: IFolder | null
    datasets: Record<WsDataScope, WsDataRow[] | null>
    datasetsLoading: boolean
    models: WsDataRow[] | null
    modelsLoading: boolean
    datasetCategories: Record<number, string>
    modelCategories: Record<number, string>
    categoriesLoaded: boolean
    outputs: WsOutputRow[]
    jobs: WsJobRow[]
    scheduledLoaded: boolean
    scheduledLoading: boolean
    lastTab: WsTab | null
    tabQueries: Partial<Record<WsTab, Record<string, string>>>
}

const useWorkspaceStore = defineStore('workspace', {
    state: (): IWorkspaceState => ({
        documents: [],
        documentsLoaded: false,
        documentsLoading: false,
        documentSource: null,
        folderTree: null,
        datasets: { all: null, mine: null, available: null },
        datasetsLoading: false,
        models: null,
        modelsLoading: false,
        datasetCategories: {},
        modelCategories: {},
        categoriesLoaded: false,
        outputs: [],
        jobs: [],
        scheduledLoaded: false,
        scheduledLoading: false,
        lastTab: null,
        tabQueries: {}
    }),
    getters: {
        favoritesFolderId: (state): string | null => (findFavoritesFolder(state.folderTree)?.id as string) ?? null,
        collections: (state): WsCollection[] => flattenCollections(state.folderTree),
        documentCount: (state): number | null => (state.documentsLoaded ? state.documents.length : null)
    },
    actions: {
        rememberTab(tab: WsTab, query: Record<string, any>) {
            this.lastTab = tab
            this.tabQueries[tab] = Object.fromEntries(Object.entries(query).filter(([, v]) => typeof v === 'string' && v !== ''))
        },

        async loadFolders() {
            this.folderTree = await api.getFolderTree()
            return this.folderTree
        },

        // The only place that knows the three sources of the Documents list (plan section 4).
        async loadDocuments(force = false) {
            if (this.documentsLoaded && !force) return
            return shared('documents', () => this.fetchDocuments())
        },

        async fetchDocuments() {
            this.documentsLoading = true
            try {
                const tree = await this.loadFolders()
                if (import.meta.env.VITE_WORKSPACE_BE1 === 'true') {
                    this.documents = fromBe1(await api.getWorkspaceDocuments())
                    this.documentSource = 'be1'
                } else {
                    const [recents, personal, contents] = await Promise.all([api.getRecents().catch(() => []), api.getPersonalDocuments().catch(() => []), Promise.all(allFolderIds(tree).map(async (folderId) => ({ folderId, content: await api.getFolderContent(folderId).catch(() => []) })))])
                    this.documents = mergeDocuments(recents, personal, contents)
                    this.documentSource = 'fallback'
                }
                this.documentsLoaded = true
            } finally {
                this.documentsLoading = false
            }
        },

        async loadDataCategories() {
            if (this.categoriesLoaded) return
            const [ds, bm] = await Promise.all([api.getDatasetCategories().catch(() => []), api.getModelCategories().catch(() => [])])
            this.datasetCategories = categoryMap(ds)
            this.modelCategories = categoryMap(bm)
            this.categoriesLoaded = true
        },

        // Each list is loaded once per visit (spec 8.1). The tab guards check the functionalities.
        async loadDatasets(scope: WsDataScope, userId?: string, force = false) {
            if (!force && this.datasets[scope] !== null) return
            return shared(`datasets-${scope}`, async () => {
                this.datasetsLoading = true
                try {
                    await this.loadDataCategories()
                    await this.fetchDatasets(scope, userId)
                } finally {
                    this.datasetsLoading = false
                }
            })
        },

        async loadModels(force = false) {
            if (!force && this.models !== null) return
            return shared('models', async () => {
                this.modelsLoading = true
                try {
                    await this.loadDataCategories()
                    this.models = (await api.getBusinessModels()).map((m: any) => businessModelToRow(m, this.modelCategories))
                } finally {
                    this.modelsLoading = false
                }
            })
        },

        // "All" is mydata plus the owned list: mydata leaves out owned datasets whose category the user
        // cannot see (found on the local server), and All must never show less than Mine.
        async fetchDatasets(scope: WsDataScope, userId?: string) {
            const toRows = (list: any[]) => list.map((d: any) => datasetToRow(d, this.datasetCategories, userId))
            if (scope !== 'all') {
                this.datasets[scope] = toRows(await api.getDatasets(DATASET_SCOPE_PATH[scope] as any))
                return
            }
            const [all, owned] = await Promise.all([api.getDatasets('mydata'), this.datasets.mine ? Promise.resolve(null) : api.getDatasets('owned')])
            if (owned) this.datasets.mine = toRows(owned)
            const byId = new Map<number, WsDataRow>()
            ;[...toRows(all), ...(this.datasets.mine ?? [])].forEach((row) => byId.set(row.id, row))
            this.datasets.all = [...byId.values()]
        },

        invalidateData() {
            this.datasets = { all: null, mine: null, available: null }
        },

        // ---------- Favorites and collections (spec 7.3, 7.4) ----------

        // Finds the Favorites folder by its marker, else creates it (top level).
        async ensureFavoritesFolder(): Promise<string> {
            if (this.favoritesFolderId) return this.favoritesFolderId
            return shared('favorites-folder', async () => {
                const tree = await this.loadFolders()
                const existing = findFavoritesFolder(tree)
                if (existing?.id) return existing.id
                await api.createFolder({ name: FAVORITES_NAME, description: FAVORITES_MARKER, parentId: null, progr: (tree?.children?.length ?? 0) + 1 })
                const reloaded = await this.loadFolders()
                const created = findFavoritesFolder(reloaded)
                if (!created?.id) throw new Error('Favorites folder not created')
                return created.id
            })
        },

        // Links a document into a folder unless the folder already links it (the backend accepts duplicates).
        async linkDocumentOnce(row: WsDocumentRow, folderId: string) {
            const content = await api.getFolderContent(folderId)
            const existing = content.find((item: any) => item.type !== 'VIEW' && item.biObjectId === row.biObjectId)
            const link: WsLink = { linkId: existing?.id ?? (await api.linkDocument(row.biObjectId, folderId))?.id, folderId }
            this.patchDocument(row.key, (doc) => {
                if (!doc.links.some((l) => l.folderId === folderId)) doc.links.push(link)
            })
        },

        async unlinkDocumentFromFolder(row: WsDocumentRow, folderId: string) {
            const content = await api.getFolderContent(folderId)
            const linkIds = content.filter((item: any) => item.type !== 'VIEW' && item.biObjectId === row.biObjectId).map((item: any) => item.id)
            await Promise.all(linkIds.map((id: string) => api.unlinkDocument(id)))
            this.patchDocument(row.key, (doc) => (doc.links = doc.links.filter((l) => l.folderId !== folderId)))
        },

        async star(row: WsDocumentRow) {
            const folderId = await this.ensureFavoritesFolder()
            await this.linkDocumentOnce(row, folderId)
        },

        async unstar(row: WsDocumentRow) {
            if (!this.favoritesFolderId) return
            await this.unlinkDocumentFromFolder(row, this.favoritesFolderId)
        },

        // A view lives in exactly one folder: PUT writes every field, so the full view is read first.
        async moveView(row: WsDocumentRow, folderId: string) {
            const view = await api.getView(row.id as string)
            await api.updateView({ ...view, parentId: folderId })
            this.patchDocument(row.key, (doc) => (doc.links = [{ folderId }]))
        },

        async renameView(row: WsDocumentRow, name: string, description: string) {
            const view = await api.getView(row.id as string)
            await api.updateView({ ...view, name, label: name, description })
            this.patchDocument(row.key, (doc) => {
                doc.name = name
                doc.description = description || undefined
            })
        },

        // Top level by default; Manage collections creates one inside another (its + button).
        async createCollection(name: string, description: string, parentId: string | null = null): Promise<string | null> {
            const tree = this.folderTree ?? (await this.loadFolders())
            const siblings = parentId ? this.collections.filter((c) => c.parentId === parentId).length : (tree?.children?.length ?? 0)
            const created = await api.createFolder({ name, description, parentId, progr: siblings + 1 })
            await this.loadFolders()
            return (created?.id as string) ?? this.collections.find((c) => c.name === name && c.parentId === parentId)?.id ?? null
        },

        async updateCollection(collection: WsCollection, patch: { name?: string; description?: string; parentId?: string | null; progr?: number }) {
            await api.updateFolder({ id: collection.id, name: patch.name ?? collection.name, description: patch.description ?? collection.description, parentId: patch.parentId !== undefined ? patch.parentId : collection.parentId, progr: patch.progr ?? collection.progr })
            await this.loadFolders()
        },

        // Moves a collection (with what it holds) under another one, or to the top level (parentId null), as the last child.
        // The caller offers only valid targets: never the collection itself or one inside it.
        async moveCollection(collection: WsCollection, parentId: string | null) {
            const siblings = parentId ? this.collections.filter((c) => c.parentId === parentId).length : (this.folderTree?.children?.length ?? 0)
            await this.updateCollection(collection, { parentId, progr: siblings + 1 })
        },

        // The backend deletes only an empty folder (spec 2.2).
        async deleteCollection(collection: WsCollection) {
            await api.deleteFolder(collection.id)
            await this.loadFolders()
        },

        // What a folder holds, for the disabled delete button of "Manage collections".
        collectionContents(folderId: string) {
            const docs = this.documents.filter((d) => d.kind === 'DOCUMENT' && d.links.some((l) => l.folderId === folderId)).length
            const views = this.documents.filter((d) => d.kind === 'VIEW' && d.links.some((l) => l.folderId === folderId)).length
            const folders = this.collections.filter((c) => c.parentId === folderId).length
            return { docs, views, folders }
        },

        // ---------- Document actions (spec 7.2) ----------

        patchDocument(key: string, change: (row: WsDocumentRow) => void) {
            const row = this.documents.find((d) => d.key === key)
            if (row) change(row)
        },

        removeDocumentRow(key: string) {
            this.documents = this.documents.filter((d) => d.key !== key)
        },

        async removeFromWorkspace(row: WsDocumentRow) {
            const folderIds = [...new Set(row.links.map((l) => l.folderId))]
            await Promise.all(folderIds.map((folderId) => this.unlinkDocumentFromFolder(row, folderId)))
            const updated = this.documents.find((d) => d.key === row.key)
            if (updated && !updated.personal && updated.lastRun === undefined) this.removeDocumentRow(row.key)
        },

        async deleteView(row: WsDocumentRow) {
            await api.deleteView(row.id as string)
            this.removeDocumentRow(row.key)
        },

        async deleteDocument(row: WsDocumentRow) {
            await api.deleteDocument(row.label)
            this.removeDocumentRow(row.key)
            await this.loadDocuments(true)
        },

        async editDocumentDetails(row: WsDocumentRow, details: { name: string; label: string; description: string }) {
            await api.updateDocumentDetails({ id: row.biObjectId, ...details })
            this.patchDocument(row.key, (doc) => {
                doc.name = details.name
                doc.label = details.label
                doc.description = details.description || undefined
            })
            this.documents.filter((d) => d.kind === 'VIEW' && d.biObjectId === row.biObjectId).forEach((view) => (view.viewOf = { biObjectId: row.biObjectId, name: details.name, label: details.label }))
        },

        // Clone and preview upload change rows the page cannot build itself: reload the list.
        async cloneDocument(row: WsDocumentRow) {
            await api.cloneDocument(row.biObjectId)
            await this.loadDocuments(true)
        },

        async uploadPreview(row: WsDocumentRow, file: File) {
            await api.uploadPreviewImage(row.biObjectId, file)
            await this.loadDocuments(true)
        },

        // listAllJobs, then the snapshots of every job in parallel (spec 10.1).
        async loadScheduled(force = false) {
            if (this.scheduledLoaded && !force) return
            return shared('scheduled', () => this.fetchScheduled())
        },

        async fetchScheduled() {
            this.scheduledLoading = true
            try {
                const jobs = await api.getJobs()
                this.jobs = jobs.map(jobToRow)
                const names = new Map<number, string>(this.documents.filter((d) => d.kind === 'DOCUMENT').map((d) => [d.biObjectId, d.name]))
                const perJob = await Promise.all(jobs.map(async (job: any) => ({ job, snapshots: await api.getSnapshotsOfJob(job.jobName).catch(() => ({})) })))
                const unknownIds = new Set<number>()
                perJob.forEach(({ snapshots }) => Object.values(snapshots).forEach((byStart: any) => Object.values(byStart).forEach((list: any) => list.forEach((s: any) => !names.has(s.biobjId) && unknownIds.add(s.biobjId)))))
                await Promise.all(
                    [...unknownIds].map((id) =>
                        api
                            .getDocumentById(id)
                            .then((doc) => names.set(id, doc?.name ?? doc?.label ?? String(id)))
                            .catch(() => names.set(id, String(id)))
                    )
                )
                this.outputs = perJob.flatMap(({ job, snapshots }) => snapshotsToOutputs(snapshots, job, (id) => names.get(id) ?? String(id)))
                this.scheduledLoaded = true
            } finally {
                this.scheduledLoading = false
            }
        }
    }
})

export default useWorkspaceStore
