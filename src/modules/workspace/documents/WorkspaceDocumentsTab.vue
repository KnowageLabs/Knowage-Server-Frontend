<template>
    <div class="kn-ws-tab column no-wrap" data-ws-tab="documents">
        <!-- kept alive: only the shown tab puts its New button in the shell -->
        <Teleport v-if="tabActive" defer to="#kn-ws-new-slot">
            <WorkspaceNewDocumentMenu @cockpit="cockpitVisible = true" @dossier="openDossierDesigner(null)" />
        </Teleport>

        <!-- reload bar: right under the tabs, full width; the first load shows the skeleton instead -->
        <div class="kn-ws-progress-slot">
            <q-linear-progress v-if="store.documentsLoading && store.documentsLoaded" indeterminate color="primary" />
        </div>

        <WorkspaceToolbar :scope="query.scope" :scope-options="SCOPE_OPTIONS" :search="query.q" :search-placeholder="$t('workspace.search.documents')" @update:scope="update({ scope: $event })" @update:search="update({ q: $event })">
            <template #filters>
                <WorkspaceFiltersButton v-if="collectionsAllowed" :groups="collectionGroups" icon="sym_o_folder" :label="$t('workspace.collection')" :active-label="activeCollectionName" :clearable="false" data-ws="collection" tour-id="ws-collection" @toggle="(_group, value) => update({ collection: value === activeCollection ? '' : value })" />
                <WorkspaceFiltersButton :groups="typeGroups" @toggle="(_group, value) => toggleInList('type', value)" @clear="update({ type: [] })" />
            </template>
        </WorkspaceToolbar>

        <div class="col column no-wrap kn-ws-body">
            <KnHint v-if="workspaceEmpty" class="col" title="workspace.empty.workspaceTitle" hint="workspace.empty.workspaceHint" data-ws="empty" />
            <WorkspaceDocumentsTable v-else :rows="rows" :loading="store.documentsLoading && !store.documentsLoaded" :show-star="collectionsAllowed" :favorites-folder-id="store.favoritesFolderId" :type-label="typeLabel" :actions-for="(row) => actions.rowActions(row)" data-tour-id="ws-list" @open="openDrawer" @run="actions.run" @star="actions.toggleFavorite" @clear="clearAll" @new-collection="openNewCollection" />
        </div>

        <WorkspaceDrawer v-model="drawerOpen">
            <WorkspaceDocumentDrawer :row="drawerRow" :actions="actions" :type-label="typeLabel" @select="openDrawer" @new-collection="openNewCollection($event, true)" @removed="drawerOpen = false" />
        </WorkspaceDrawer>

        <WorkspaceCollectionDialog v-model="collectionDialog.open" :collection="collectionDialog.collection" :parent="collectionDialog.parent" :dialog-class="collectionDialog.aboveDrawer ? 'kn-ws-above-drawer' : undefined" @saved="onCollectionSaved" />
        <WorkspaceManageCollectionsDialog v-model="manageOpen" @rename="openRenameCollection" @create="openNewCollectionIn" />
        <WorkspaceEditDetailsDialog v-model="editDialog.open" :row="editDialog.row" :dialog-class="drawerOpen ? 'kn-ws-above-drawer' : undefined" />
        <WorkspaceViewRenameDialog v-model="renameDialog.open" :row="renameDialog.row" :dialog-class="drawerOpen ? 'kn-ws-above-drawer' : undefined" />
        <WorkspaceCockpitDialog v-model="cockpitVisible" @closed="store.loadDocuments(true)" />
        <DossierDesignerDialog v-if="appStore.isEnterprise && dossier.open" :visible="dossier.open" :selected-document="dossier.document" @close="closeDossierDesigner" />
        <input ref="previewInput" type="file" accept="image/*" class="hidden" @change="onPreviewPicked" />
    </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import KnHint from '@/components/UI/KnHint.vue'
import DossierDesignerDialog from '@/modules/documentExecution/dossier/designer/DossierDesignerDialog.vue'
import useWorkspaceStore from '../workspace.store'
import { WsCollection, WsDocumentRow } from '../Workspace'
import { canUseCollections, documentTypeIcon, documentTypeLabelKey, filterDocuments, inDocumentScope, rowTypeKey, sortDocumentsDefault } from '../workspaceHelpers'
import { useWorkspaceQuery } from '../common/useWorkspaceQuery'
import WorkspaceDrawer from '../common/WorkspaceDrawer.vue'
import WorkspaceFiltersButton, { WsFilterGroup } from '../common/WorkspaceFiltersButton.vue'
import WorkspaceToolbar, { WsScopeOption } from '../common/WorkspaceToolbar.vue'
import { useDocumentActions } from './useDocumentActions'
import WorkspaceCockpitDialog from './WorkspaceCockpitDialog.vue'
import WorkspaceCollectionDialog from './WorkspaceCollectionDialog.vue'
import WorkspaceDocumentDrawer from './WorkspaceDocumentDrawer.vue'
import WorkspaceDocumentsTable from './WorkspaceDocumentsTable.vue'
import WorkspaceEditDetailsDialog from './WorkspaceEditDetailsDialog.vue'
import WorkspaceManageCollectionsDialog from './WorkspaceManageCollectionsDialog.vue'
import WorkspaceNewDocumentMenu from './WorkspaceNewDocumentMenu.vue'
import WorkspaceViewRenameDialog from './WorkspaceViewRenameDialog.vue'

const SCOPE_OPTIONS: WsScopeOption[] = [
    { value: 'all', labelKey: 'workspace.scope.all' },
    { value: 'recent', labelKey: 'workspace.scope.recent', icon: 'sym_o_history' },
    { value: 'fav', labelKey: 'workspace.scope.favorites', icon: 'sym_o_star' },
    { value: 'mine', labelKey: 'workspace.scope.mine', icon: 'sym_o_person' }
]

const { t, te } = useI18n()
const appStore = mainStore()
const store = useWorkspaceStore()

const tabActive = ref(true)
onActivated(() => (tabActive.value = true))
onDeactivated(() => (tabActive.value = false))

const {
    state: query,
    update,
    toggleInList
} = useWorkspaceQuery({
    scope: { param: 'scope', kind: 'enum', values: ['all', 'recent', 'fav', 'mine'], default: 'all' },
    type: { param: 'type', kind: 'list' },
    collection: { param: 'collection', kind: 'string' },
    q: { param: 'q', kind: 'string' }
} as const)

const collectionsAllowed = computed(() => canUseCollections(appStore.user))
const typeLabel = (typeKey: string) => {
    const key = documentTypeLabelKey(typeKey)
    return key && te(key) ? t(key) : typeKey
}

// A collection id that is not a folder of the user (deleted, the Favorites folder) is ignored.
const activeCollection = computed(() => (collectionsAllowed.value && store.collections.some((c) => c.id === query.value.collection) ? query.value.collection : null))
const context = computed(() => ({ favoritesFolderId: store.favoritesFolderId, userId: appStore.user?.userId, typeLabel }))
const scopedRows = computed(() => store.documents.filter((row) => inDocumentScope(row, query.value.scope as any, context.value)))
const rows = computed(() => sortDocumentsDefault(filterDocuments(store.documents, { scope: query.value.scope as any, types: query.value.type, collection: activeCollection.value, q: query.value.q }, context.value)))
const workspaceEmpty = computed(() => store.documentsLoaded && store.documents.length === 0)

// The counts are for the current scope, before the filters (spec 6.2).
const typeGroups = computed<WsFilterGroup[]>(() => {
    const typeKeys = [...new Set(store.documents.map(rowTypeKey))].sort((a, b) => typeLabel(a).localeCompare(typeLabel(b)))
    return [
        {
            id: 'type',
            labelKey: 'workspace.filter.type',
            options: typeKeys.map((key) => ({ value: key, label: typeLabel(key), icon: documentTypeIcon(key), count: scopedRows.value.filter((r) => rowTypeKey(r) === key).length, selected: query.value.type.includes(key) }))
        }
    ]
})

// The Collection button (spec 6.4): one choice, the folder tree, New and Manage.
const activeCollectionName = computed(() => store.collections.find((c) => c.id === activeCollection.value)?.name)
const collectionGroups = computed<WsFilterGroup[]>(() => [
    {
        id: 'collection',
        labelKey: 'workspace.filter.collections',
        single: true,
        noneValue: '',
        options: [{ value: '', label: t('workspace.filter.anyCollection'), selected: !activeCollection.value }, ...store.collections.map((c) => ({ value: c.id, label: c.name, indent: c.depth, count: scopedRows.value.filter((r) => r.links.some((l) => l.folderId === c.id)).length, selected: activeCollection.value === c.id }))],
        actions: [
            { id: 'new', icon: 'sym_o_create_new_folder', labelKey: 'workspace.newCollection', run: () => openNewCollection(null) },
            { id: 'manage', icon: 'sym_o_edit', labelKey: 'workspace.manageCollections', run: () => (manageOpen.value = true) }
        ]
    }
])

// The "no rows" button also resets the scope and the search (spec 11).
const clearAll = () => update({ scope: 'all', type: [], collection: '', q: '' })

// ---------- Drawer ----------

const drawerOpen = ref(false)
const drawerKey = ref<string | null>(null)
const drawerRow = computed(() => store.documents.find((d) => d.key === drawerKey.value) ?? null)
function openDrawer(row: WsDocumentRow) {
    drawerKey.value = row.key
    drawerOpen.value = true
}
// a row removed while its drawer is open closes the drawer
watch(drawerRow, (row) => {
    if (!row && drawerOpen.value) drawerOpen.value = false
})

// ---------- Dialogs ----------

const collectionDialog = reactive({ open: false, collection: null as WsCollection | null, parent: null as WsCollection | null, aboveDrawer: false, forRow: null as WsDocumentRow | null })
const manageOpen = ref(false)
const editDialog = reactive({ open: false, row: null as WsDocumentRow | null })
const renameDialog = reactive({ open: false, row: null as WsDocumentRow | null })
const cockpitVisible = ref(false)
const dossier = reactive({ open: false, document: null as any })

function openNewCollection(row: WsDocumentRow | null, aboveDrawer = false) {
    Object.assign(collectionDialog, { open: true, collection: null, parent: null, aboveDrawer: aboveDrawer || drawerOpen.value, forRow: row })
}
function openRenameCollection(collection: WsCollection) {
    Object.assign(collectionDialog, { open: true, collection, parent: null, aboveDrawer: false, forRow: null })
}
// From Manage collections: top level (null) or inside a collection (its + button).
function openNewCollectionIn(parent: WsCollection | null) {
    Object.assign(collectionDialog, { open: true, collection: null, parent, aboveDrawer: false, forRow: null })
}
// A collection created from "Add to collection" gets the document (or the view) right away.
async function onCollectionSaved(folderId: string | null) {
    const row = collectionDialog.forRow
    if (!row || !folderId || collectionDialog.collection) return
    try {
        if (row.kind === 'VIEW') await store.moveView(row, folderId)
        else await store.linkDocumentOnce(row, folderId)
    } catch {
        // the axios interceptor shows the error
    }
}

function openDossierDesigner(row: WsDocumentRow | null) {
    dossier.document = row ? { id: row.biObjectId, label: row.label, name: row.name, description: row.description, typeCode: row.typeCode } : null
    dossier.open = true
}
function closeDossierDesigner(event: { refreshHistory: boolean }) {
    dossier.open = false
    if (event?.refreshHistory) store.loadDocuments(true)
}

// ---------- Upload preview image: a hidden file input opened by the menu item ----------

const previewInput = ref<HTMLInputElement | null>(null)
const previewRow = ref<WsDocumentRow | null>(null)
function pickPreviewImage(row: WsDocumentRow) {
    previewRow.value = row
    if (previewInput.value) {
        previewInput.value.value = ''
        previewInput.value.click()
    }
}
async function onPreviewPicked(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file || !previewRow.value) return
    try {
        await store.uploadPreview(previewRow.value, file)
        appStore.setInfo({ title: 'common.uploading', msg: 'common.toast.uploadSuccess' })
    } catch {
        // the axios interceptor shows the error
    }
}

const actions = useDocumentActions({
    openEditDetails: (row) => Object.assign(editDialog, { open: true, row }),
    openRenameView: (row) => Object.assign(renameDialog, { open: true, row }),
    openDossierDesigner,
    pickPreviewImage
})

onMounted(() => {
    store.loadDocuments().catch(() => {})
})
</script>
