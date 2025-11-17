<template>
    <div class="kn-page">
        <div class="kn-page-content row p-m-0">
            <div class="col-3 column p-p-0">
                <Toolbar class="kn-toolbar kn-toolbar--primary">
                    <template #start>
                        {{ $t('managers.resourceManagement.title') }}
                    </template>
                    <template #end>
                        <Button icon="fas fa-sync-alt" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" @click="loadPage(showHint, formVisible)" />
                        <Button icon="fas fa-folder-plus" class="p-button-text p-button-sm p-button-rounded p-button-plain p-p-0" @click="openCreateFolderDialog"
                    /></template>
                </Toolbar>
                <div class="tree-container column">
                    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                    <ResourceManagementMetadataDialog v-model:visibility="displayMetadataDialog" v-model:id="metadataKey"></ResourceManagementMetadataDialog>
                    <ResourceManagementCreateFolderDialog v-model:visibility="folderCreation" :path="selectedFolder ? selectedFolder.relativePath : ''" @createFolder="createFolder" />

                    <q-input v-model="filter" class="q-ma-sm" outlined dense square debounce="300" :placeholder="$t('common.search')">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                    <q-tree v-if="nodes" class="kn-tree kn-flex p-flex-column foldersTree scroll" selected-color="accent" :nodes="nodes" node-key="key" :filter="filter" default-expand-all v-model:selected="selectedKeys" selection="single" v-model:expanded="expandedKeys" data-test="functionality-tree" @update:selected="(target) => showForm(target)">
                        <template #default-header="{ node }">
                            <div class="row full-width treeButtons">
                                <q-icon v-if="!node.custIcon && node.icon" :name="node.icon" class="q-mr-sm" size="sm" />
                                <span class="col kn-truncated">{{ node.label }}</span>

                                <q-btn v-if="node.modelFolder" flat round dense size="xs" icon="table" :data-test="'move-up-button-' + node.id" @click.stop="openMetadataDialog(node)">
                                    <q-tooltip>{{ $t('managers.resourceManagement.openMetadata') }}</q-tooltip>
                                </q-btn>
                                <q-btn flat round dense size="xs" icon="download" :data-test="'download-button-' + node.id" @click.stop="downloadDirect(node)">
                                    <q-tooltip>{{ $t('common.download') }}</q-tooltip>
                                </q-btn>
                                <q-btn v-if="node.level > 0" flat round dense size="xs" icon="delete" :data-test="'delete-button-' + node.key" @click.stop="showDeleteDialog(node)">
                                    <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                                </q-btn>
                            </div>
                        </template>
                    </q-tree>
                </div>
            </div>
            <div class="col p-p-0 p-m-0 kn-page">
                <KnHint v-if="showHint" :title="'managers.resourceManagement.title'" :hint="'managers.resourceManagement.hint'"></KnHint>
                <ResourceManagementDetail v-if="formVisible" :folder="selectedFolder" :parent-key="folderParentKey" @touched="touched = true" @close="onClose" @inserted="loadPage($event)" @folderCreated="loadPage" @closed="switchToHint()" @fileUploaded="loadPage(false, true)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import descriptor from './ResourceManagementDescriptor.json'
import Tree from 'primevue/tree'
import { IFolderTemplate } from '@/modules/managers/resourceManagement/ResourceManagement'
import { downloadDirectFromResponseWithCustomName } from '@/helpers/commons/fileHelper'
import ResourceManagementMetadataDialog from '@/modules/managers/resourceManagement/ResourceManagementMetadataDialog.vue'
import ResourceManagementDetail from './ResourceManagementDetail.vue'
import KnHint from '@/components/UI/KnHint.vue'
import ResourceManagementCreateFolderDialog from './ResourceManagementCreateFolderDialog.vue'
import mainStore from '../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'resource-management',
    components: { KnHint, ResourceManagementMetadataDialog, ResourceManagementCreateFolderDialog, ResourceManagementDetail, Tree },
    data() {
        return {
            descriptor,
            displayMetadataDialog: false,
            loading: false,
            nodes: [] as IFolderTemplate[],
            expandedKeys: {},
            selectedKeys: null,
            metadataKey: null,
            dirty: false,
            buttonsVisible: [],
            showHint: true,
            touched: false,
            selectedFolder: {} as IFolderTemplate,
            folderCreation: false,
            formVisible: false,
            filter: '' as string
        }
    },
    async created() {
        this.loadPage()
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo']),
        createFolder(folderName: string) {
            if (folderName && this.selectedFolder) {
                const obj = {} as JSON
                obj['key'] = '' + this.selectedFolder.key
                obj['folderName'] = folderName
                this.$http
                    .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/folders`, obj, {
                        responseType: 'arraybuffer', // important...because we need to convert it to a blob. If we don't specify this, response.data will be the raw data. It cannot be converted to blob directly.

                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(() => {
                        this.$emit('folderCreated', true)
                    })
                    .catch((error) => {
                        this.setError({
                            title: this.$t('common.error.saving'),
                            msg: this.$t(error)
                        })
                    })
                    .finally(() => {
                        this.loading = false
                        this.openCreateFolderDialog()
                        this.loadPage(this.showHint, this.formVisible)
                    })
            }
        },
        getCurrentFolderPath() {
            return this.selectedFolder ? this.selectedFolder.relativePath : undefined
        },
        getCurrentFolderKey() {
            return this.selectedFolder ? '' + this.selectedFolder.key : undefined
        },
        getButtonClass(node) {
            let visibility = ' kn-hide'
            if (this.buttonsVisible[node.key] && !node.edit) visibility = ''
            return 'p-button-text p-button-sm p-button-rounded p-button-plain p-p-0' + visibility
        },
        openCreateFolderDialog() {
            this.folderCreation = !this.folderCreation
        },
        toggleInput(node) {
            if (node.level > 0) {
                if (node.edit && node.label !== node.edit) {
                    if (this.selectedFolder) {
                        const obj = {} as JSON
                        obj['key'] = this.selectedFolder.key
                        obj['folderName'] = node.label
                        this.loading = true
                        this.$http
                            .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/folders/update`, obj, {
                                responseType: 'arraybuffer', // important...because we need to convert it to a blob. If we don't specify this, response.data will be the raw data. It cannot be converted to blob directly.

                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                            .then(() => {
                                delete node.edit
                                this.setInfo({
                                    title: this.$t('managers.resoruceManagement.renameFolder'),
                                    msg: this.$t('managers.resoruceManagement.folderRenamedSuccessfully')
                                })
                            })
                            .catch((error) => {
                                this.setError({
                                    title: this.$t('managers.resoruceManagement.renameFolder'),
                                    msg: this.$t(error)
                                })
                            })
                            .finally(() => {
                                this.loading = false
                            })
                    }
                } else node.edit = node.label
            }
        },
        addIcon(nodes) {
            for (const idx in nodes) {
                const node = nodes[idx]
                node.icon = 'folder'
                if (node.children && node.children.length > 0) {
                    this.addIcon(node.children)
                }
            }
        },
        loadPage(showHint?, formVisible?): void {
            this.loading = true
            this.showHint = showHint != undefined ? showHint : true
            this.formVisible = formVisible != undefined ? formVisible : false
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/folders`)
                .then((response: AxiosResponse<any>) => {
                    const root = response.data.root[0]
                    root.label = 'HOME'
                    root.icon = 'home'
                    this.addIcon(root.children)
                    this.nodes = response.data.root
                    this.loading = false
                })
                .finally(() => (this.loading = false))
        },
        openMetadataDialog(node): void {
            this.metadataKey = node.key
            this.displayMetadataDialog = !this.displayMetadataDialog
        },
        deleteFolder(node) {
            this.loading = true
            this.$http
                .delete(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/folders`, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        key: node.key
                    }
                })
                .then(() => {
                    this.loadPage()
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteSuccess')
                    })
                })
                .catch(() => {
                    this.setError({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteFailed')
                    })
                })
                .finally(() => (this.loading = false))
        },
        downloadDirect(node) {
            this.loading = true
            const obj = {} as JSON
            obj['key'] = node.key
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/folders/download`, obj, {
                    responseType: 'arraybuffer', // important...because we need to convert it to a blob. If we don't specify this, response.data will be the raw data. It cannot be converted to blob directly.

                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/zip; charset=utf-8'
                    }
                })
                .then((response: AxiosResponse<any>) => {
                    downloadDirectFromResponseWithCustomName(response, node.label + '.zip')
                })
                .finally(() => (this.loading = false))
        },
        setDirty(): void {
            this.dirty = true
        },
        findNodeById(tree, id) {
            for (const node of tree) {
                if (node.key === id) {
                    return node
                }
                if (node.children && node.children.length > 0) {
                    const foundNode = this.findNodeById(node.children, id)
                    if (foundNode) {
                        return foundNode
                    }
                }
            }
            return null
        },
        showForm(folderId: string) {
            let functionality: any
            if (folderId) {
                functionality = this.findNodeById(this.nodes, folderId)
            } else {
                functionality = {} as IFolderTemplate
            }
            /*             this.functionalityParentId = parentId */
            if (!this.touched) {
                this.setSelected(functionality)
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.setSelected(functionality)
                    }
                })
            }
        },
        setSelected(functionality: IFolderTemplate) {
            this.selectedFolder = functionality
            this.formVisible = true
            this.showHint = false
        },
        showDeleteDialog(node) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteConfirmTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteFolder(node)
            })
        },
        switchToHint() {
            this.formVisible = false
            this.showHint = true

            this.expandedKeys = {}
            this.selectedKeys = null
            this.metadataKey = null
            this.dirty = false

            this.touched = false
            this.selectedFolder = {} as IFolderTemplate
        }
    }
})
</script>

<style lang="scss" scoped>
.tree-container {
    border: 1px solid var(--kn-list-border-color);
    flex: 1 0 0;
    max-width: 100%;
}
#folders-tree {
    flex: 1 0 0;
    overflow: auto;
}
.knTreeLabel {
    border: none;
}
.foldersTree {
    border-radius: 0;
    flex: 1 0 0;
}
.rightFolderIconsBar {
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-end;
    flex: 1;
}
.treeCustomElement {
    align-items: center;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
}
.rightFolderIcon {
    margin-right: 0.5rem;
}
.p-tree .p-tree-container .p-treenode {
    padding: 0;
    margin: 0;
}
.p-treenode-content {
    border-radius: 0 !important;
}
.p-treenode-label {
    width: 100%;
    height: 100%;
}
.p-tree-toggler p-link {
    margin: 0px;
}
.p-treenode-icon {
    margin: 0px;
}
.treeButtons {
    &:deep(.q-icon) {
        opacity: 0.2;
    }
    &:hover {
        &:deep(.q-icon) {
            opacity: 0.4;
        }
    }
}
</style>
