<template>
    <div class="kn-page">
        <ImportDocumentsDialog v-if="displayImportDialog" @close="displayImportDialog = false" />
        <ExportDocumentsDialog v-if="displayExportDialog" @export="exportDocuments" @close="displayExportDialog = false" />
        <Toolbar class="kn-toolbar kn-toolbar--primary">
            <template #start>
                {{ $t('managers.importExportDocs.title') }}
            </template>
            <template #end>
                <Button class="kn-button p-button-text" @click="toggleImportDialog">{{ $t('common.import') }}</Button>
                <Button class="kn-button p-button-text" :disabled="Object.values(selectedDocumentsKeys).length == 0" @click="toggleExportDialog">{{ $t('common.export') }}</Button>
            </template>
        </Toolbar>
        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
        <div class="kn-page-content p-d-flex p-flex-column p-m-0">
            <form class="p-fluid p-formgrid p-grid p-m-2 p-pt-2 p-ai-center">
                <div class="p-field p-col-5">
                    <span class="p-float-label">
                        <Calendar id="startDate" v-model="dateFilter" class="kn-material-input" :show-icon="true" :manual-input="true" :show-button-bar="true" />
                        <label for="attributes" class="kn-material-input-label"> {{ $t('managers.importExportDocs.date') }} </label>
                    </span>
                </div>
                <div class="p-field p-col-6">
                    <span class="p-float-label kn-height-full">
                        <Multiselect v-model="selectedFilters" class="kn-material-input kn-height-full" :options="availableFilters" option-label="label" option-value="value"> </Multiselect>
                        <label for="attributes" class="kn-material-input-label"> {{ $t('managers.importExportDocs.status') }} </label>
                    </span>
                </div>
                <Button icon="fas fa-magnifying-glass p-field p-col-1" class="p-button-rounded p-button-text p-button-plain expand-button" :disabled="loading" @click="loadDocuments" />
            </form>

            <Tree
                v-model:selectionKeys="selectedDocumentsKeys"
                class="import-export-document-tree kn-tree"
                :value="nodes"
                :loading="loading"
                selection-mode="checkbox"
                :meta-key-selection="false"
                :filter="true"
                filter-mode="lenient"
                @node-expand="setOpenFolderIcon($event)"
                @node-collapse="setClosedFolderIcon($event)"
            >
            </Tree>
            <!-- <div class="p-d-flex p-flex-column kn-flex">
                <Button class="kn-button--secondary" @click="logMe">LOG ME</Button>

                {{ selectedDocumentsKeys }}
            </div> -->
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { mapState } from 'pinia'
import { iNode, iFile } from './ImportExportDocuments'
import { findObjectById } from './ImportExportDocumentsHelpers'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import { primeVueDate } from '@/helpers/commons/localeHelper'
import deepcopy from 'deepcopy'
import mainStore from '../../../App.store'
import ProgressBar from 'primevue/progressbar'
import Tree from 'primevue/tree'
import ExportDocumentsDialog from './exportDialog/ExportDocumentsDialog.vue'
import ImportDocumentsDialog from './importDialog/ImportDocumentsDialog.vue'
import Calendar from 'primevue/calendar'
import Multiselect from 'primevue/multiselect'

export default defineComponent({
    name: 'import-export',
    components: { ProgressBar, Tree, ExportDocumentsDialog, ImportDocumentsDialog, Calendar, Multiselect },
    emits: [],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            // importExportDescriptor: importExportDescriptor,
            displayImportDialog: false,
            displayExportDialog: false,
            fileName: '',
            loading: false,
            folders: [] as any[],
            nodes: [] as iNode[],
            selectedDocumentsKeys: {} as any,
            selectedDocument: null as any,
            dateFilter: null as any,
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
        }
    },
    created() {
        this.loadDocuments()
    },
    methods: {
        loadDocuments() {
            const dateFilter = this.dateFilter ? this.dateFilter.toString() : undefined
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
                })
        },
        createNodeTree() {
            this.nodes = []
            const foldersWithMissingParent = [] as iNode[]

            this.folders.forEach((file: iFile) => {
                if (file.codType != 'USER_FUNCT') {
                    const node = {
                        key: file.id,
                        id: file.id,
                        parentId: file.parentId,
                        label: file.name,
                        children: this.formatFolderChildren(file.biObjects, file.path),
                        data: file,
                        icon: 'pi pi-folder',
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
                if (document.visible) {
                    formattedChildren.push({ key: document.id, icon: 'pi pi-file', id: document.id, label: document.name, data: document, selectable: true, path: filePath })
                }
            })

            return formattedChildren
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
        setOpenFolderIcon(node: iNode) {
            node.icon = 'pi pi-folder-open'
        },
        setClosedFolderIcon(node: iNode) {
            node.icon = 'pi pi-folder'
        },
        logMe() {
            // console.log(this.selectedDocumentsKeys)
            // console.log(this.nodes)

            // for (const doc in this.selectedDocumentsKeys) {
            //     console.log(doc)
            //     if (this.selectedDocumentsKeys[doc].checked) console.log(doc, 'true')
            //     else console.log(doc, 'false')
            // }
            console.log(this.dateFilter)
        },
        toggleExportDialog() {
            this.displayExportDialog = !this.displayExportDialog
        },
        exportDocuments(exportPayload) {
            this.store.setLoading(true)

            exportPayload.DOCUMENT_ID_LIST = []
            for (const fileId in this.selectedDocumentsKeys) {
                const file = findObjectById(this.nodes, fileId)
                if (file && !file.isFolder) {
                    if (exportPayload.EXPORT_SELECTED_FUNCTIONALITY) exportPayload.DOCUMENT_ID_LIST.push({ id: file.id, folder: file.path })
                    else exportPayload.DOCUMENT_ID_LIST.push(fileId)
                }
            }

            console.log('exportPayload', exportPayload)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/export', exportPayload)
                .then(() => {
                    this.downloadExportedDocuments(exportPayload)
                })
                .catch((error) => console.error(error))
                .finally(() => {
                    this.store.setLoading(false)
                    this.toggleExportDialog()
                })
        },
        downloadExportedDocuments(exportPayload) {
            const postData = { FILE_NAME: exportPayload.EXPORT_FILE_NAME }
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/downloadExportFile', postData, {
                    responseType: 'arraybuffer', // important...because we need to convert it to a blob. If we don't specify this, response.data will be the raw data. It cannot be converted to blob directly.
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
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-document-tree {
    display: flex;
    flex-direction: column;
    flex: 1;
    border: none;
    padding-top: 0;
    overflow: auto;
}
</style>
