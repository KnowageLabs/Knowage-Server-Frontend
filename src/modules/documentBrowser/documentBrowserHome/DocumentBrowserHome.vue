<template>
    <!-- <q-layout view="lHr Lpr lFr" container> -->
    <q-layout view="hHr Lpr lFr" container>
        <q-header bordered>
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-btn flat round dense :icon="drawerOpen ? 'menu_open' : 'menu'" class="q-mr-sm" @click="drawerOpen = !drawerOpen" />
                <q-separator class="q-mr-sm" vertical color="grey-7"></q-separator>
                <DocumentBrowserBreadcrumb v-if="breadcrumbs.length" :breadcrumbs="breadcrumbs" @breadcrumbClicked="setSelectedBreadcrumb" />
                <span v-else class="text-subtitle1 text-weight-medium">{{ $t('documentBrowser.title') }}</span>
                <q-space />
                <q-separator vertical color="grey-7"></q-separator>
                <q-input v-model="searchWord" dense dark clearable borderless :placeholder="$t('documentBrowser.wholeBrowserSearch')" class="q-mx-sm doc-search-input" @keydown.enter.prevent="loadSearchDocuments" @update:model-value="onSearchInput">
                    <template #prepend>
                        <q-icon name="search" size="xs" />
                    </template>
                </q-input>
                <q-separator vertical color="grey-7"></q-separator>
                <q-btn-dropdown v-if="(isSuperAdmin || canAddNewDocument) && selectedFolder && selectedFolder.parentId && selectedFolder.codType !== 'USER_FUNCT'" class="q-ml-md" :label="$t('common.create')" unelevated color="accent" size="sm" dropdown-icon="add">
                    <q-list dense style="min-width: 200px">
                        <q-item v-for="item in items" :key="item.label" v-close-popup clickable @click="item.command">
                            <q-item-section>
                                <div>
                                    {{ item.label }}
                                    <q-badge v-if="item.beta" rounded color="red" text-color="white" label="Beta" />
                                </div>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
            </q-toolbar>
            <q-linear-progress v-if="loading" indeterminate color="primary" class="kn-progress-bar" data-test="progress-bar" />
            <!-- <q-banner v-if="isSearching" class="bg-blue-1 text-blue-9" dense>
                <template #avatar><q-icon name="search" color="blue-6" /></template>
                {{ searchedDocuments.length }} {{ $t('documentBrowser.documentsFound') }}
                <template #action>
                    <q-btn flat dense :label="$t('common.clear')" size="sm" @click="onSearchClear" />
                </template>
            </q-banner> -->
        </q-header>

        <q-drawer v-model="drawerOpen" side="left" :width="300" :breakpoint="0" show-if-above bordered class="column no-wrap">
            <DocumentBrowserTree :prop-folders="folders" :selected-breadcrumb="selectedBreadcrumb" :selected-folder-prop="selectedFolder" @folderSelected="setSelectedFolder" />
        </q-drawer>

        <q-drawer v-model="sidebarOpen" overlay side="right" :width="320" :breakpoint="0" bordered class="column no-wrap doc-sidebar-drawer">
            <DocumentBrowserSidebar v-if="selectedDocument" :selected-document="selectedDocument" data-test="document-browser-sidebar" @documentCloneClick="cloneDocument" @documentDeleteClick="deleteDocument" @itemSelected="$emit('itemSelected', $event)" @documentChangeStateClicked="changeDocumentState" @showDocumentDetails="openDocumentDetails" @closePanel="closeSidebar" />
        </q-drawer>

        <Transition name="doc-backdrop">
            <div v-if="sidebarOpen" class="doc-sidebar-backdrop" @click="closeSidebar" />
        </Transition>

        <q-page-container>
            <q-page class="row">
                <q-scroll-area class="col">
                    <DocumentBrowserTable v-if="selectedFolder || isSearching" :prop-documents="isSearching ? searchedDocuments : documents" :search-mode="isSearching" @selected="onDocumentSelected" @itemSelected="$emit('itemSelected', $event)" />
                    <DocumentBrowserHint v-else data-test="document-browser-hint" />
                </q-scroll-area>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import DocumentBrowserHint from './DocumentBrowserHint.vue'
import DocumentBrowserTree from './DocumentBrowserTree.vue'
import DocumentBrowserTable from './tables/DocumentBrowserTable.vue'
import DocumentBrowserBreadcrumb from './breadcrumbs/DocumentBrowserBreadcrumb.vue'
import DocumentBrowserSidebar from './sidebar/DocumentBrowserSidebar.vue'
import mainStore from '../../../App.store'
import { mapState } from 'pinia'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { iFolder } from '../DocumentBrowser'

export default defineComponent({
    name: 'document-browser-home',
    components: { DocumentBrowserHint, DocumentBrowserTree, DocumentBrowserTable, DocumentBrowserBreadcrumb, DocumentBrowserSidebar },
    props: { documentSaved: { type: Object as PropType<any> }, documentSavedTrigger: { type: Boolean } },
    emits: ['itemSelected'],
    setup() {
        const route = useRoute()
        const router = useRouter()
        const $q = useQuasar()
        return { route, router, $q }
    },
    data() {
        return {
            folders: [] as iFolder[],
            selectedFolder: null as any,
            documents: [] as any[],
            searchedDocuments: [] as any[],
            breadcrumbs: [] as any[],
            selectedBreadcrumb: null as any,
            searchWord: null as any,
            searchExecuted: false,
            drawerOpen: true,
            sidebarOpen: false,
            items: [] as any[],
            loading: false,
            selectedDocument: null as any,
            documentId: null as any
        }
    },
    computed: {
        ...mapState(mainStore, { storeUser: 'user' }),
        isSuperAdmin(): boolean {
            return this.storeUser?.isSuperadmin
        },
        canAddNewDocument(): boolean {
            return this.storeUser?.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_MANAGEMENT)
        },
        hasCreateCockpitFunctionality(): boolean {
            return this.storeUser?.functionalities?.includes(UserFunctionalitiesConstants.CREATE_COCKPIT_FUNCTIONALITY)
        },
        isSearching(): boolean {
            return this.searchExecuted && !!this.searchWord?.trim()
        }
    },
    watch: {
        documentSavedTrigger() {
            if (!this.documentSaved) return
            if (this.documentSaved.folderId) this.selectedFolder.id = this.documentSaved.folderId
            this.loadDocumentsWithBreadcrumbs()
        },
        documents() {
            this.closeSidebar()
        },
        searchedDocuments() {
            this.closeSidebar()
        }
    },
    async created() {
        await this.loadFolders()

        if (this.route.name === 'document-browser-functionality') {
            this.setFolderFromRoute()
        }

        this.createMenuItems()

        this.setRouterWatcher()
    },
    methods: {
        setRouterWatcher() {
            this.$watch(
                () => this.route.params.pathMatch,
                (toParams) => {
                    if (this.route.name === 'document-browser-functionality' && toParams.length > 0) this.setFolderFromRoute()
                }
            )
        },
        async setFolderFromRoute() {
            if (this.route.params.pathMatch.length > 0) {
                this.selectedFolder = this.findSelectedFolder()
                if (!this.selectedFolder) return
                localStorage.setItem('documentSelectedFolderId', JSON.stringify(this.selectedFolder.id))
                await this.loadDocumentsWithBreadcrumbs()
            }
        },
        findSelectedFolder() {
            const id = this.route.params.pathMatch[this.route.params.pathMatch.length - 1]
            const index = this.folders.findIndex((folder: iFolder) => String(folder.id) === String(id))
            return index !== -1 ? this.folders[index] : null
        },
        async loadFolders() {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/folders/`).then((response: AxiosResponse<any>) => {
                this.folders = response.data
                this.folders?.sort((a: iFolder, b: iFolder) => {
                    return a.id - b.id
                })
            })

            this.loading = false
        },
        async loadDocuments() {
            if (!this.selectedFolder?.id || this.selectedFolder.id === -1) return
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents?folderId=${this.selectedFolder.id}`).then((response: AxiosResponse<any>) => {
                this.documents = response.data
            })
            this.loading = false
        },
        async loadSearchDocuments() {
            if (!this.searchWord?.trim()) return
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents?searchAttributes=all&searchKey=${this.searchWord}`).then((response: AxiosResponse<any>) => {
                this.searchedDocuments = response.data
                this.searchExecuted = true
            })
            this.loading = false
        },
        onSearchInput(val: string | number | null) {
            if (!val || !String(val).trim()) this.onSearchClear()
        },
        onSearchClear() {
            this.searchWord = null
            this.searchedDocuments = []
            this.searchExecuted = false
        },
        async setSelectedFolder(folder: any) {
            if (this.searchExecuted) this.onSearchClear()
            if (this.selectedFolder?.id === folder.id) return
            this.selectedFolder = folder
            this.closeSidebar()
            this.changeFolderRotue()
            await this.loadDocumentsWithBreadcrumbs()
        },
        changeFolderRotue() {
            const tempPath = this.selectedFolder.path?.substring(1)?.split('/')
            if (!tempPath) return
            let temp = ''
            for (let i = 0; i < tempPath.length; i++) {
                const index = this.folders.findIndex((folder: iFolder) => folder.code == tempPath[i])
                if (index !== -1) {
                    temp += `/${this.folders[index].id}`
                }
            }
            history.pushState({}, '', import.meta.env.VITE_PUBLIC_PATH + 'document-browser' + temp)
        },
        async loadDocumentsWithBreadcrumbs() {
            if (this.selectedFolder && this.selectedFolder.id !== -1) {
                await this.loadDocuments()
                this.createBreadcrumbs()
            } else {
                this.documents = []
            }
        },
        createBreadcrumbs() {
            if (!this.selectedFolder) return
            let currentFolder = { key: String(this.selectedFolder.id), label: this.selectedFolder.name, data: this.selectedFolder } as any
            this.breadcrumbs = [] as any[]
            do {
                this.breadcrumbs.unshift({ label: currentFolder.data.name, node: currentFolder })
                currentFolder = currentFolder.data.parentFolder
            } while (currentFolder)
        },
        async setSelectedBreadcrumb(breadcrumb: any) {
            this.selectedBreadcrumb = breadcrumb

            if (this.selectedFolder?.id === breadcrumb.node.data.id) {
                return
            }
            this.selectedFolder = breadcrumb.node.data
            await this.loadDocuments()
        },
        createMenuItems() {
            this.items = []
            this.items.push({ label: this.$t('documentBrowser.genericDocument'), command: () => this.createNewDocument() })
            if (this.hasCreateCockpitFunctionality) {
                this.items.push({ label: this.$t('common.cockpit'), command: () => this.createNewCockpit() })
                this.items.push({ label: this.$t('dashboard.dashboard'), command: () => this.createNewDashboard() })
            }
        },
        createNewDocument() {
            this.documentId = null
            this.$emit('itemSelected', { item: null, mode: 'documentDetail', functionalityId: this.selectedFolder.id })
        },
        async openDocumentDetails(event: any) {
            this.documentId = event.id
            this.$emit('itemSelected', { item: event, mode: 'documentDetail', functionalityId: null })
        },
        createNewCockpit() {
            this.$emit('itemSelected', { item: null, mode: 'createCockpit', functionalityId: this.selectedFolder.id })
        },
        createNewDashboard() {
            this.$emit('itemSelected', { item: null, mode: 'createDashboard', functionalityId: this.selectedFolder.id })
        },
        onDocumentSelected(document: any) {
            this.selectedDocument = document
            this.sidebarOpen = !!document
        },
        closeSidebar() {
            this.selectedDocument = null
            this.sidebarOpen = false
        },
        async cloneDocument(document: any) {
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/documents/clone?docId=${document.id}`)
                .then(() => {
                    const store = mainStore()
                    store.setInfo({ title: this.$t('common.toast.createTitle'), msg: this.$t('common.toast.success') })
                    this.loadDocumentsWithBreadcrumbs()
                })
                .catch(() => {})
        },
        async deleteDocument(document: any) {
            await this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${document.label}`)
                .then(() => {
                    const store = mainStore()
                    store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.success') })
                    this.closeSidebar()
                    this.loadDocumentsWithBreadcrumbs()
                })
                .catch(() => {})
        },
        async changeDocumentState(event: any) {
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/documents/changeStateDocument?docId=${event.document.id}&direction=${event.direction}`)
                .then(() => {
                    const store = mainStore()
                    store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.success') })
                    this.loadDocumentsWithBreadcrumbs()
                })
                .catch(() => {})
        }
    }
})
</script>

<style lang="scss" scoped>
.doc-search-input {
    width: 240px;
}

.doc-sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 2000;
    pointer-events: all;
}

.doc-backdrop-enter-active,
.doc-backdrop-leave-active {
    transition: opacity 0.25s ease;
}
.doc-backdrop-enter-from,
.doc-backdrop-leave-to {
    opacity: 0;
}

:deep(.doc-sidebar-drawer) {
    z-index: 2001 !important;
}

:deep(.q-scrollarea__content) {
    height: 100%;
}
</style>
