<template>
    <div class="kn-page">
        <div class="p-grid p-m-0">
            <div class="p-col-4 p-sm-4 p-md-3 p-p-0 column window-height">
                <Toolbar class="kn-toolbar kn-toolbar--primary">
                    <template #start>
                        {{ $t('managers.functionalitiesManagement.title') }}
                    </template>
                    <template #end>
                        <FabButton v-if="selectedFunctionality" icon="fas fa-plus" data-test="new-button" @click="showForm(null, selectedFunctionality.id)" />
                    </template>
                </Toolbar>
                <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                <div class="col listContainer overflow-auto">
                    <q-input ref="filter" class="q-ma-sm" dense square standout outlined v-model="filter" :placeholder="$t('common.search')">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                    <q-tree ref="tree" :filter="filter" class="q-pt-sm functionalitiesTree" :nodes="nodes" node-key="id" default-expand-all selected-color="primary" @update:selected="updateSelected" v-model:selected="selectedFunctionalityKey">
                        <template #default-header="{ node }">
                            <div class="row full-width" :class="{ treeButtons: selectedFunctionalityKey !== node.id }">
                                <span class="col">{{ node.label }}</span>
                                <q-btn v-if="canBeMovedDown(node.data)" flat round dense size="xs" icon="arrow_downward" :data-test="'move-down-button-' + node.id" @click.stop="moveDown(node.id)" />
                                <q-btn v-if="canBeMovedUp(node.data)" flat round dense size="xs" icon="arrow_upward" :data-test="'move-up-button-' + node.id" @click.stop="moveUp(node.id)" />
                                <q-btn v-if="canBeDeleted(node)" flat round dense size="xs" icon="delete" :data-test="'delete-button-' + node.id" @click.stop="deleteFunctionalityConfirm(node.id)" />
                            </div>
                        </template>
                    </q-tree>
                </div>
            </div>

            <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 column window-height">
                <KnHint v-if="showHint" :title="'managers.functionalitiesManagement.title'" :hint="'managers.functionalitiesManagement.hint'" data-test="functionality-hint"></KnHint>
                <FunctionalitiesManagementDetail v-if="formVisible" :functionality="selectedFunctionality" :parent-id="functionalityParentId" :roles-short="rolesShort" @touched="touched = true" @close="onClose" @inserted="loadPage($event)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iFunctionality, iNode } from './FunctionalitiesManagement'
import FunctionalitiesManagementDetail from './detailTabView/FunctionalitiesManagementDetail.vue'
import { AxiosResponse } from 'axios'
import FabButton from '@/components/UI/KnFabButton.vue'
import functionalitiesManagementDescriptor from './FunctionalitiesManagementDescriptor.json'
import KnHint from '@/components/UI/KnHint.vue'
import Tree from 'primevue/tree'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'functionalities-management',
    components: {
        FunctionalitiesManagementDetail,
        FabButton,
        KnHint,
        Tree
    },
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            functionalitiesManagementDescriptor,
            functionalities: [] as iFunctionality[],
            rolesShort: [] as { id: number; name: 'string' }[],
            nodes: [] as iNode[],
            selectedFunctionality: null as iFunctionality | null,
            selectedFunctionalityKey: [] as Array<number> | [],
            functionalityParentId: null as number | null,
            expandedKeys: {},
            showHint: true,
            touched: false,
            loading: false,
            buttonsVisible: [],
            formVisible: false,
            filter: ''
        }
    },
    async mounted() {
        await this.loadPage(null)
    },
    methods: {
        async loadFunctionalities() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/functionalities/').then((response: AxiosResponse<any>) => (this.functionalities = response.data))
        },
        async loadRolesShort() {
            this.rolesShort = []
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/roles/short/').then((response: AxiosResponse<any>) => (this.rolesShort = response.data))
        },
        async createNodeTree() {
            this.nodes = []
            const foldersWithMissingParent = [] as iNode[]
            await this.functionalities.forEach((functionality: iFunctionality) => {
                if (functionality.codType !== 'USER_FUNCT') {
                    const node = {
                        key: functionality.id,
                        id: functionality.id,
                        parentId: functionality.parentId,
                        label: functionality.name,
                        children: [] as iNode[],
                        data: functionality,
                        style: this.functionalitiesManagementDescriptor.node.style
                    }
                    node.children = foldersWithMissingParent.filter((folder: iNode) => node.id === folder.parentId)

                    this.attachFolderToTree(node, foldersWithMissingParent)
                }
            })
            this.expandAll()
        },
        attachFolderToTree(folder: iNode, foldersWithMissingParent: iNode[]) {
            if (folder.parentId) {
                let parentFolder = null as iNode | null

                for (let i = 0; i < foldersWithMissingParent.length; i++) {
                    if (folder.parentId === foldersWithMissingParent[i].id) {
                        foldersWithMissingParent[i].children.push(folder)
                        break
                    }
                }

                for (let i = 0; i < this.nodes.length; i++) {
                    parentFolder = this.findParentFolder(folder, this.nodes[i])
                    if (parentFolder) {
                        parentFolder.children?.push(folder)
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
            if (folderToAdd.parentId === folderToSearch.id) {
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
        expandAll() {
            this.$refs.tree?.expandAll()
        },

        showForm(functionality: iFunctionality, parentId: number) {
            this.showHint = false
            this.functionalityParentId = parentId
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
        onClose() {
            this.touched = false
            this.formVisible = false
            this.showHint = true
        },
        setSelected(functionality: iFunctionality) {
            this.selectedFunctionality = functionality
            this.formVisible = true
        },
        canBeMovedUp(functionality: iFunctionality) {
            return functionality.prog !== 1
        },
        moveUp(functionalityId: number) {
            this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/functionalities/moveUp/${functionalityId}`).then(() => this.loadPage(null))
        },
        canBeMovedDown(functionality: iFunctionality) {
            let canBeMoved = false
            this.functionalities.forEach((currentFunctionality) => {
                if (functionality.parentId === currentFunctionality.parentId && functionality.prog < currentFunctionality.prog) {
                    canBeMoved = true
                }
            })

            return canBeMoved
        },
        moveDown(functionalityId: number) {
            this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/functionalities/moveDown/${functionalityId}`).then(() => this.loadPage(null))
        },
        canBeDeleted(functionality: iFunctionality) {
            return functionality.parentId && functionality.codType !== 'LOW_FUNCT'
        },
        deleteFunctionalityConfirm(functionalityId: number) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.touched = false
                    this.deleteFunctionality(functionalityId)
                }
            })
        },
        async deleteFunctionality(functionalityId: number) {
            await this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/functionalities/${functionalityId}`)
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteSuccess')
                    })
                    this.selectedFunctionality = null
                    this.formVisible = false
                    this.showHint = true
                    this.loadPage(null)
                })
                .catch((error) => {
                    this.store.setError({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: error.message
                    })
                })
        },
        async loadPage(functionalityId: any) {
            this.loading = true
            await this.loadFunctionalities()
            await this.loadRolesShort()
            this.createNodeTree()
            const id = functionalityId ? functionalityId : this.selectedFunctionality?.id
            this.selectedFunctionality = this.functionalities.find((functionality) => functionality.id === id) as any
            this.touched = false
            this.loading = false
        },
        updateSelected(value: any) {
            this.selectedFunctionality = this.functionalities.find((functionality) => functionality.id === value) as any
            if (this.selectedFunctionality) this.showForm(this.selectedFunctionality, this.selectedFunctionality.parentId)
        }
    }
})
</script>
<style lang="scss" scoped>
.listContainer {
    border: 1px solid var(--kn-list-border-color);
}
.functionalitiesTree {
    border-top: 1px solid var(--kn-list-border-color);
}
.treeButtons {
    &:deep(.q-icon) {
        opacity: 0.4;
    }
}
</style>
