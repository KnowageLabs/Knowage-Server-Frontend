<template>
    <Toolbar class="kn-toolbar kn-toolbar--primary">
        <template #start>
            <div class="row items-center" style="min-width: 600px">
                <i id="sidebar-button" class="fa fa-ellipsis-v p-mr-3" @click="toggleSidebarView" />
                <span>{{ searchMode ? $t('documentBrowser.documentsSearch') : $t('documentBrowser.title') }}</span>
                <i v-if="searchMode" class="fa fa-arrow-left search-pointer p-mx-4" @click="exitSearchMode" />
                <q-input v-if="searchMode" dense class="col" dark standout clearable autofocus v-model="searchWord" @keydown.enter.prevent="loadDocuments">
                    <template v-slot:after>
                        <q-btn round size="sm" dense flat icon="search" @click="loadDocuments" />
                    </template>
                </q-input>
            </div>
        </template>

        <template #end>
            <q-btn v-if="!searchMode" class="q-mr-xl" size="sm" flat round icon="search" @click="openSearchBar()">
                <q-tooltip>{{ $t('documentBrowser.wholeBrowserSearch') }}</q-tooltip>
            </q-btn>
            <q-btn v-if="(isSuperAdmin || canAddNewDocument) && selectedFolder && selectedFolder.parentId && selectedFolder.codType !== 'USER_FUNCT'" round class="customFabButton" icon="fas fa-plus">
                <q-menu data-test="menu">
                    <q-list dense style="min-width: 200px">
                        <q-item v-for="item in items" :key="item" v-close-popup clickable @click="item.command">
                            <q-item-section
                                ><div>
                                    {{ item.label }}
                                    <q-badge v-if="item.beta" rounded color="red" text-color="white" label="Beta" />
                                </div>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
        </template>
    </Toolbar>

    <ProgressBar v-if="loading" class="kn-progress-bar" mode="indeterminate" data-test="progress-bar" />

    <div id="document-browser-detail" class="p-d-flex p-flex-row kn-flex p-m-0">
        <div v-if="sidebarVisible && windowWidth < 1024" id="document-browser-sidebar-backdrop" @click="sidebarVisible = false"></div>

        <div v-show="!searchMode" class="document-sidebar kn-flex" style="width: 350px" :class="{ 'sidebar-hidden': isSidebarHidden, 'document-sidebar-absolute': sidebarVisible && windowWidth < 1024 }">
            <DocumentBrowserTree :prop-folders="folders" :selected-breadcrumb="selectedBreadcrumb" :selected-folder-prop="selectedFolder" @folderSelected="setSelectedFolder"></DocumentBrowserTree>
        </div>

        <div id="detail-container" class="p-d-flex p-flex-column">
            <DocumentBrowserDetail
                v-if="selectedFolder || searchMode"
                :prop-documents="searchMode ? searchedDocuments : documents"
                :breadcrumbs="breadcrumbs"
                :search-mode="searchMode"
                @breadcrumbClicked="setSelectedBreadcrumb($event)"
                @documentCloned="loadDocuments"
                @documentStateChanged="loadDocuments"
                @itemSelected="$emit('itemSelected', $event)"
                @showDocumentDetails="openDocumentDetails"
            ></DocumentBrowserDetail>
            <DocumentBrowserHint v-else data-test="document-browser-hint"></DocumentBrowserHint>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import DocumentBrowserHint from './DocumentBrowserHint.vue'
import DocumentBrowserTree from './DocumentBrowserTree.vue'
import DocumentBrowserDetail from './DocumentBrowserDetail.vue'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import Menu from 'primevue/menu'
import mainStore from '../../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { iFolder } from '../DocumentBrowser'

export default defineComponent({
    name: 'document-browser-home',
    components: { DocumentBrowserHint, DocumentBrowserTree, DocumentBrowserDetail, KnFabButton, Menu },
    props: { documentSaved: { type: Object as PropType<any> }, documentSavedTrigger: { type: Boolean } },
    emits: ['itemSelected'],
    setup() {
        const store = mainStore()
        return { store }
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
            searchMode: false,
            items: [] as any[],
            user: null as any,
            sidebarVisible: false,
            windowWidth: window.innerWidth,
            loading: false,
            showDocumentDetails: false,
            selectedDocument: null as any,
            documentId: null as any
        }
    },
    computed: {
        isSuperAdmin(): boolean {
            return this.user?.isSuperadmin
        },
        canAddNewDocument(): boolean {
            return this.user?.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_MANAGEMENT)
        },
        hasCreateCockpitFunctionality(): boolean {
            return this.user.functionalities?.includes(UserFunctionalitiesConstants.CREATE_COCKPIT_FUNCTIONALITY)
        },
        isSidebarHidden(): boolean {
            if (this.sidebarVisible) {
                return false
            } else {
                return this.windowWidth < 1024
            }
        }
    },
    watch: {
        documentSavedTrigger() {
            if (!this.documentSaved) return

            if (this.documentSaved.folderId) this.selectedFolder.id = this.documentSaved.folderId
            this.loadDocumentsWithBreadcrumbs()
        }
    },
    async created() {
        window.addEventListener('resize', this.onResize)

        await this.loadFolders()
        this.user = (this.store.$state as any).user

        if (this.$route.name === 'document-browser-functionality') {
            this.setFolderFromRoute()
        }

        this.createMenuItems()

        this.setRouterWatcher()
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.onResize)
    },
    methods: {
        setRouterWatcher() {
            this.$watch(
                () => this.$route.params.pathMatch,
                (toParams) => {
                    if (this.$route.name === 'document-browser-functionality' && toParams.length > 0) this.setFolderFromRoute()
                }
            )
        },
        onResize() {
            this.windowWidth = window.innerWidth
        },
        async setFolderFromRoute() {
            if (this.$route.params.pathMatch.length > 0) {
                this.selectedFolder = this.findSelectedFolder()
                if (!this.selectedFolder) return
                localStorage.setItem('documentSelectedFolderId', JSON.stringify(this.selectedFolder.id))
                await this.loadDocumentsWithBreadcrumbs()
            }
        },
        findSelectedFolder() {
            const id = this.$route.params.pathMatch[this.$route.params.pathMatch.length - 1]
            const index = this.folders.findIndex((folder: iFolder) => folder.id == id)
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
            this.loading = true
            const url = this.searchMode ? `/restful-services/2.0/documents?searchAttributes=all&searchKey=${this.searchWord}` : `/restful-services/2.0/documents?folderId=${this.selectedFolder?.id}`
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + url).then((response: AxiosResponse<any>) => {
                this.searchMode ? (this.searchedDocuments = response.data) : (this.documents = response.data)
            })
            this.loading = false
        },
        async setSelectedFolder(folder: any) {
            if (this.selectedFolder?.id === folder.id) {
                return
            }
            this.selectedFolder = folder
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
            let currentFolder = { key: this.selectedFolder.name, label: this.selectedFolder.name, data: this.selectedFolder } as any
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
        exitSearchMode() {
            this.searchMode = false
        },
        createMenuItems() {
            this.items = []
            this.items.push({ label: this.$t('documentBrowser.genericDocument'), command: () => this.createNewDocument() })
            if (this.hasCreateCockpitFunctionality) {
                this.items.push({ label: this.$t('common.cockpit'), command: () => this.createNewCockpit() })
                this.items.push({ label: this.$t('dashboard.dashboard'), beta: true, command: () => this.createNewDashboard() })
            }
        },
        createNewDocument() {
            this.documentId = null
            this.$emit('itemSelected', { item: null, mode: 'documentDetail', functionalityId: this.selectedFolder.id })
        },
        async openDocumentDetails(event) {
            this.documentId = event.id
            this.$emit('itemSelected', { item: event, mode: 'documentDetail', functionalityId: null })
        },
        createNewCockpit() {
            this.$emit('itemSelected', { item: null, mode: 'createCockpit', functionalityId: this.selectedFolder.id })
        },
        createNewDashboard() {
            this.$emit('itemSelected', { item: null, mode: 'createDashboard', functionalityId: this.selectedFolder.id })
        },
        toggleSidebarView() {
            this.sidebarVisible = !this.sidebarVisible
        },
        openSearchBar() {
            this.searchMode = true
        },
        onCloseDetails() {
            this.showDocumentDetails = false
            this.loadDocuments()
        }
    }
})
</script>

<style lang="scss" scoped>
#sidebar-button {
    display: none;
    cursor: pointer;
}

.document-sidebar {
    border-right: 1px solid #c2c2c2;
}

.document-sidebar-absolute {
    position: absolute;
    z-index: 100;
    width: 400px;
    height: 100%;
    background-color: white;
}

#document-browser-detail {
    position: relative;
}

#document-browser-sidebar-backdrop {
    background-color: rgba(33, 33, 33, 1);
    opacity: 0.48;
    z-index: 50;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

.sidebar-hidden {
    display: none;
}

@media screen and (max-width: 1024px) {
    #sidebar-button {
        display: inline;
    }
}

#document-browser-home-toolbar {
    width: 100%;
}

.search-pointer:hover {
    cursor: pointer;
}

#document-search {
    min-width: 500px;
    background-color: var(--kn-color-primary);
    color: white;
    border-bottom-color: white;
}

#document-search::placeholder {
    color: white;
}

.full-width {
    width: 100%;
}

#detail-container {
    overflow: auto;
    max-height: calc(100vh - 71px);
    flex: 3;
}

.searchInput {
    background-color: transparent;
}
</style>
