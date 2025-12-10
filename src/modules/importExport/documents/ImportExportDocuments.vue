<template>
    <div class="import-export-documents-container">
        <ImportDocumentsDialog v-if="displayImportDialog" @close="displayImportDialog = false" />
        <ExportDocumentsDialog v-if="displayExportDialog" @export="exportDocuments" @close="displayExportDialog = false" />

        <q-card class="p-my-2 p-d-flex p-ai-center">
            <q-input class="p-col-3" v-model="searchFilter" dense :placeholder="$t('common.search')" type="text">
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
            <q-select class="p-col-3" v-model="selectedFilters" dense multiple emit-value map-options :options="availableFilters" option-label="label" option-value="value" :label="$t('managers.importExportDocs.status')" />
            <q-input class="p-col-2" v-model="dateFilter" dense type="date" :label="$t('managers.importExportDocs.date')">
                <template #prepend>
                    <q-icon name="event" />
                </template>
            </q-input>
            <q-btn class="p-ml-3" icon="fas fa-magnifying-glass" size="sm" round flat :disable="loading" @click="loadDocuments">
                <q-tooltip>{{ $t('common.search') }}</q-tooltip>
            </q-btn>
        </q-card>

        <q-card class="p-d-flex p-flex-column kn-flex kn-overflow">
            <q-tree ref="documentTree" :nodes="nodes" :filter="searchFilter" node-key="key" tick-strategy="leaf" v-model:ticked="selectedDocumentKeys">
                <template #default-header="{ node }">
                    <div class="row items-center full-width">
                        <q-icon :name="node.icon" class="q-mr-sm" />
                        <span>{{ node.label }}</span>
                    </div>
                </template>
            </q-tree>
        </q-card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { mapState } from 'pinia'
import { iNode, iFile } from './ImportExportDocuments'
import { findObjectById, findObjectByKey } from './ImportExportDocumentsHelpers'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import { primeVueDate } from '@/helpers/commons/localeHelper'
import deepcopy from 'deepcopy'
import mainStore from '../../../App.store'
import ExportDocumentsDialog from './exportDialog/ExportDocumentsDialog.vue'
import ImportDocumentsDialog from './importDialog/ImportDocumentsDialog.vue'

export default defineComponent({
    name: 'import-export-documents',
    components: { ExportDocumentsDialog, ImportDocumentsDialog },
    props: {
        triggerImport: { type: Number, default: 0 },
        triggerExport: { type: Number, default: 0 }
    },
    emits: ['documentsReady'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            displayImportDialog: false,
            displayExportDialog: false,
            fileName: '',
            loading: false,
            folders: [] as any[],
            nodes: [] as iNode[],
            selectedDocumentKeys: [] as string[],
            selectedDocumentsKeys: {} as any,
            selectedDocument: null as any,
            dateFilter: null as any,
            searchFilter: '',
            availableFilters: [
                { label: this.$t('managers.importExportDocs.dev'), value: 'DEV' },
                { label: this.$t('managers.importExportDocs.test'), value: 'TEST' },
                { label: this.$t('managers.importExportDocs.rel'), value: 'REL' }
            ] as any[],
            selectedFilters: ['DEV', 'TEST', 'REL'] as any
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user',
            isEnterprise: 'isEnterprise',
            licenses: 'licenses'
        }),
        getCurrentDateFormat() {
            return primeVueDate()
        },
        hasSelection(): boolean {
            return this.selectedDocumentKeys.length > 0
        }
    },
    watch: {
        triggerImport(newVal, oldVal) {
            if (newVal !== oldVal && newVal > 0) this.toggleImportDialog()
        },
        triggerExport(newVal, oldVal) {
            if (newVal !== oldVal && newVal > 0) this.toggleExportDialog()
        },
        selectedDocumentKeys: {
            deep: true,
            handler() {
                this.updateSelectedDocumentsKeys()
                this.$emit('documentsReady', this.hasSelection)
            }
        },
        selectedDocumentsKeys: {
            deep: true,
            handler() {
                this.$emit('documentsReady', this.hasSelection)
            }
        }
    },
    created() {
        this.loadDocuments()
    },
    mounted() {
        this.$emit('documentsReady', this.hasSelection)
    },
    methods: {
        loadDocuments() {
            const dateFilter = this.dateFilter ? new Date(this.dateFilter).toString() : undefined
            const statusFilter = this.selectedFilters.toString()

            this.loading = true
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/serverManager/importExport/folders`, {
                    params: {
                        dateFilter: dateFilter,
                        status: statusFilter
                    }
                })
                .then((response: AxiosResponse<any>) => {
                    this.folders = response.data
                    this.folders?.sort((a: any, b: any) => {
                        return a.id - b.id
                    })
                })
                .catch((error) => console.error(error))
                .finally(() => {
                    this.loading = false
                    this.createNodeTree()
                    this.removeEmptyFolders()
                })
        },
        createNodeTree() {
            this.nodes = []
            const foldersWithMissingParent = [] as iNode[]

            this.folders.forEach((file: iFile) => {
                if (file.codType != 'USER_FUNCT') {
                    const node = {
                        key: crypto.randomUUID(),
                        id: file.id,
                        parentId: file.parentId,
                        label: file.name,
                        children: this.formatFolderChildren(file.biObjects, file.path),
                        data: file,
                        icon: 'folder',
                        selectable: true,
                        path: file.path,
                        isFolder: true
                    }

                    const temp = foldersWithMissingParent.filter((folder: iNode) => node.id === folder.parentId)
                    temp.forEach((el: any) => node.children.push(el))
                    this.attachFolderToTree(node, foldersWithMissingParent)
                }
            })
        },
        formatFolderChildren(folderChildren: any[], filePath: string) {
            const formattedChildren = [] as iNode[]
            folderChildren.forEach((document: any) => {
                formattedChildren.push({ key: crypto.randomUUID(), icon: 'description', id: document.id, label: document.name, data: document, selectable: true, path: filePath, isFolder: false })
            })

            return formattedChildren
        },
        updateSelectedDocumentsKeys() {
            // Update the old structure for compatibility with export logic
            this.selectedDocumentsKeys = {}
            this.selectedDocumentKeys.forEach((key) => {
                this.selectedDocumentsKeys[key] = { checked: true, partialChecked: false }
            })
        },
        attachFolderToTree(folder: iNode, foldersWithMissingParent: iNode[]) {
            if (folder.parentId) {
                let parentFolder = null as iNode | null
                for (let i = 0; i < foldersWithMissingParent.length; i++) {
                    if (folder.parentId === foldersWithMissingParent[i].id) {
                        foldersWithMissingParent[i].children?.push(folder)
                        parentFolder = foldersWithMissingParent[i]
                        break
                    }
                }
                for (let i = 0; i < this.nodes.length; i++) {
                    parentFolder = this.findParentFolder(folder, this.nodes[i])
                    if (parentFolder && !parentFolder.data.stateCode) {
                        parentFolder.children?.push(deepcopy(folder))
                        break
                    }
                }
                if (!parentFolder) {
                    foldersWithMissingParent.push(folder)
                }
            } else {
                this.nodes.push(folder)
            }
        },
        findParentFolder(folderToAdd: iNode, folderToSearch: iNode) {
            if (folderToAdd.parentId === folderToSearch.id && !folderToSearch.data.stateCode) {
                return folderToSearch
            } else {
                let tempFolder = null as iNode | null
                if (folderToSearch.children) {
                    for (let i = 0; i < folderToSearch.children.length; i++) {
                        tempFolder = this.findParentFolder(folderToAdd, folderToSearch.children[i])
                        if (tempFolder) {
                            break
                        }
                    }
                }
                return tempFolder
            }
        },
        toggleExportDialog() {
            if (this.hasSelection) {
                this.displayExportDialog = !this.displayExportDialog
            }
        },
        exportDocuments(exportPayload) {
            this.store.setLoading(true)

            exportPayload.DOCUMENT_ID_LIST = []
            for (const fileId in this.selectedDocumentsKeys) {
                const file = findObjectByKey(this.nodes, fileId)
                if (file && !file.isFolder) {
                    if (exportPayload.EXPORT_SELECTED_FUNCTIONALITY) exportPayload.DOCUMENT_ID_LIST.push({ id: file.id, folder: file.path })
                    else exportPayload.DOCUMENT_ID_LIST.push(file.id.toString())
                }
            }

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/export', exportPayload)
                .then((response: AxiosResponse<any>) => {
                    this.downloadExportedDocuments(response.data.FILE_NAME_EXPORT)
                })
                .catch((error) => console.error(error))
                .finally(() => {
                    this.store.setLoading(false)
                    this.toggleExportDialog()
                })
        },
        downloadExportedDocuments(fileName) {
            const postData = { FILE_NAME: fileName }
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/downloadExportFile', postData, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/zip; charset=utf-8'
                    }
                })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.errors) {
                        this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                    } else {
                        downloadDirectFromResponse(response)
                        this.store.setInfo({ title: this.$t('common.downloading'), msg: this.$t('importExport.export.successfullyCompleted') })
                    }
                })
                .catch((error) => console.error(error))
                .finally(() => {})
        },
        toggleImportDialog() {
            this.displayImportDialog = !this.displayImportDialog
        },
        filterDocuments(folder: iNode, parentFolder: any) {
            if (folder.children && folder.children.length > 0) {
                for (let i = folder.children.length - 1; i >= 0; i--) {
                    this.filterDocuments(folder.children[i], folder)
                }
            }

            if (folder.children?.length == 0 && parentFolder && parentFolder.children) {
                const array = parentFolder.children
                const index = array.findIndex((node: iNode) => node.id === folder.id)
                array.splice(index, 1)
            }
        },
        removeEmptyFolders() {
            for (let i = 0; i < this.nodes.length; i++) {
                this.filterDocuments(this.nodes[i], null as any)
                if (this.nodes[i].children?.length === 0) {
                    this.nodes[i].selectable = false
                }
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-documents-container {
    display: flex;
    flex-direction: column;
    height: 95vh;
}
</style>
