<template>
    <div class="kn-page">
        <div class="p-grid p-m-0">
            <div class="p-col-4 p-sm-4 p-md-3 p-p-0 column window-height">
                <Toolbar class="kn-toolbar kn-toolbar--primary">
                    <template #start>
                        {{ $t('managers.menuManagement.title') }}
                    </template>
                    <template #end>
                        <KnFabButton icon="fas fa-plus" data-test="new-button" @click="showForm()"></KnFabButton>
                    </template>
                </Toolbar>
                <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                <MenuNodesTree :elements="menuNodes" :loading="loading" data-test="menu-nodes-tree" @deleteMenuNode="onNodeDelete" @selectedMenuNode="onNodeSelect" @unselectedMenuNode="onNodeUnselect" @changeWithFather="onChangeWithFather" @moveUp="onMoveUp" @moveDown="onMoveDown"></MenuNodesTree>
            </div>

            <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 column window-height">
                <KnHint v-if="hideForm" :title="'managers.menuManagement.title'" :hint="'managers.menuManagement.hint'"></KnHint>
                <MenuElementsDetail
                    v-if="!hideForm"
                    :selected-roles="selectedMenuNode.roles"
                    :parent-node-roles="parentNodeRoles"
                    :roles="roles"
                    :selected-menu-node="selectedMenuNode"
                    :menu-nodes="menuNodes"
                    :static-pages-list="staticPagesList"
                    :hidden="hideForm"
                    @refreshRecordSet="loadMenuNodes"
                    @closesForm="closeForm"
                    @dataChanged="dirty = true"
                ></MenuElementsDetail>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import KnHint from '@/components/UI/KnHint.vue'
import { iMenuNode } from './MenuManagement'
import MenuNodesTree from './MenuNodesTree/MenuManagementNodesTree.vue'
import MenuElementsDetail from './ElementDetailsCard/MenuManagementElementsDetail.vue'
import { iRole, iStaticPage } from '../usersManagement/UsersManagement'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'menu-management',
    components: {
        MenuNodesTree,
        MenuElementsDetail,
        KnFabButton,
        KnHint
    },
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            apiUrl: import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/',
            menuNodes: [] as iMenuNode[],
            staticPagesList: [] as iStaticPage[],
            selectedMenuNode: {} as any,
            parentNodeRoles: [] as iRole[] | null,
            loading: false as boolean,
            hideForm: true as boolean,
            dirty: false as boolean,
            roles: [] as iRole[]
        }
    },
    async created() {
        await this.loadMenuNodes()
        await this.loadRoles()
        await this.loadStaticPages()
    },
    methods: {
        async loadRoles() {
            this.loading = this.hideForm = true
            this.dirty = false
            await this.$http
                .get(this.apiUrl + 'roles')
                .then((response: AxiosResponse<any>) => {
                    this.roles = response.data
                })
                .finally(() => (this.loading = false))
        },
        showForm() {
            this.hideForm = false
            if (Object.keys(this.selectedMenuNode).length === 0 && this.selectedMenuNode.constructor === Object) {
                this.selectedMenuNode = {}
                this.initMenuNode()
            } else {
                const selectedNode = this.selectedMenuNode
                this.selectedMenuNode = {}
                this.initMenuNode()
                this.selectedMenuNode.parentId = selectedNode.id
            }
        },
        initMenuNode() {
            this.selectedMenuNode.level = 0
            this.selectedMenuNode.icon = {}
            this.selectedMenuNode.roles = []
            this.selectedMenuNode.custIcon =
                this.selectedMenuNode.externalApplicationUrl =
                this.selectedMenuNode.functionality =
                this.selectedMenuNode.initialPath =
                this.selectedMenuNode.objId =
                this.selectedMenuNode.objParameters =
                this.selectedMenuNode.staticPage =
                this.selectedMenuNode.parentId =
                    null
            this.selectedMenuNode.hideSliders = this.selectedMenuNode.hideToolbar = this.selectedMenuNode.viewIcons = false
        },
        closeForm() {
            this.hideForm = true
        },
        async loadMenuNodes() {
            this.loading = true
            this.hideForm = true
            this.dirty = false
            await this.$http
                .get(this.apiUrl + 'menu')
                .then((response: AxiosResponse<any>) => {
                    this.menuNodes = response.data
                })
                .finally(() => (this.loading = false))
        },
        async loadStaticPages() {
            this.loading = true
            this.hideForm = true
            this.dirty = false
            await this.$http
                .get(this.apiUrl + 'menu/htmls')
                .then((response: AxiosResponse<any>) => {
                    this.staticPagesList = response.data
                })
                .finally(() => (this.loading = false))
        },
        onNodeSelect(menuNode?: iMenuNode) {
            if (this.dirty) {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.dirty = false
                        if (menuNode) this.prepareFormData(menuNode)
                        else this.hideForm = true
                    }
                })
            } else {
                if (menuNode && menuNode.menuId) this.prepareFormData(menuNode)
                else {
                    this.selectedMenuNode = { ...menuNode }
                    this.parentNodeRoles = null
                    this.hideForm = true
                }
            }
        },
        onNodeUnselect() {
            this.selectedMenuNode = {}
            this.initMenuNode()
        },
        onNodeDelete(id: number) {
            this.deleteNode(id)
        },
        onChangeWithFather(id: number) {
            this.changeWithFather(id)
        },
        onMoveUp(id: number) {
            this.moveUp(id)
        },
        onMoveDown(id: number) {
            this.moveDown(id)
        },
        async changeWithFather(id: number) {
            this.loading = true
            this.axios
                .get(this.apiUrl + 'menu/changeWithFather/' + id)
                .then(() => {
                    this.loadMenuNodes()
                })
                .finally(() => {
                    this.loading = false
                })
        },
        async moveUp(id: number) {
            this.loading = true
            this.axios
                .get(this.apiUrl + 'menu/moveUp/' + id)
                .then(() => {
                    this.loadMenuNodes()
                })
                .finally(() => {
                    this.loading = false
                })
        },
        async moveDown(id: number) {
            this.loading = true
            this.axios
                .get(this.apiUrl + 'menu/moveDown/' + id)
                .then(() => {
                    this.loadMenuNodes()
                })
                .finally(() => {
                    this.loading = false
                })
        },
        async deleteNode(id: number) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteConfirmTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: async () => {
                    this.loading = true
                    this.axios
                        .delete(this.apiUrl + 'menu/' + id)
                        .then(() => {
                            this.store.setInfo({
                                title: this.$t('managers.menuManagement.info.deleteTitle'),
                                msg: this.$t('managers.menuManagement.info.deleteMessage')
                            })
                            this.loadMenuNodes()
                        })
                        .finally(() => {
                            this.loading = false
                        })
                }
            })
        },
        prepareFormData(menuNode: iMenuNode) {
            if (this.hideForm) {
                this.hideForm = false
            }
            this.selectedMenuNode = { ...menuNode, staticPage: menuNode.staticPage }
            this.parentNodeRoles = null
            if (menuNode.parentId) {
                const parentNode = this.menuNodes.find((node) => node.menuId === menuNode.parentId)
                if (parentNode) {
                    this.parentNodeRoles = parentNode.roles
                }
            }
        }
    }
})
</script>
