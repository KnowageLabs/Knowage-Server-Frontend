<template>
    <Tree id="folders-tree" v-model:selectionKeys="selectedFolderKey" :value="nodes" selection-mode="single" @node-select="setSelectedFolder($event)" @node-unselect="removeSelectedFolder" @node-expand="setOpenFolderIcon($event)" @node-collapse="setClosedFolderIcon($event)">
        <template #default="slotProps">
            <div class="p-d-flex p-flex-row p-ai-center" @mouseover="buttonsVisible[slotProps.node.id] = true" @mouseleave="buttonsVisible[slotProps.node.id] = false">
                <span>{{ slotProps.node.label }}</span>
                <div v-show="mode === 'select' && buttonsVisible[slotProps.node.id]" class="p-ml-2">
                    <Button icon="fa fa-plus" class="p-button-link p-button-sm p-p-0" @click.stop="createFolder(slotProps.node)" />
                    <Button v-if="slotProps.node.label !== 'root'" icon="far fa-trash-alt" class="p-button-link p-button-sm p-p-0" @click.stop="deleteFolderConfirm(slotProps.node)" />
                </div>
            </div>
        </template>
    </Tree>
    <WorkspaceNewFolderDialog :visible="newFolderDialogVisible" @close="newFolderDialogVisible = false" @create="createNewFolder"></WorkspaceNewFolderDialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { IFolder } from '../Workspace'
import { mapActions } from 'pinia'
import Tree from 'primevue/tree'
import WorkspaceNewFolderDialog from './WorkspaceNewFolderDialog.vue'
import workspaceDocumentTreeDescriptor from './WorkspaceDocumentTreeDescriptor.json'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'workspace-document-tree',
    components: { Tree, WorkspaceNewFolderDialog },
    props: { mode: { type: String }, selectedBreadcrumb: { type: Object }, selectedFolderId: { type: String } },
    emits: ['folderSelected', 'delete', 'createFolder'],
    data() {
        return {
            workspaceDocumentTreeDescriptor,
            folders: {} as IFolder,
            nodes: [] as any[],
            selectedFolderKey: {},
            selectedFolder: null as any,
            buttonsVisible: {},
            newFolderDialogVisible: false
        }
    },
    watch: {
        selectedBreadcrumb() {
            this.onBreadcrumbSelected()
        }
    },
    async created() {
        await this.loadData()
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError', 'setLoading']),
        async loadData() {
            this.setLoading(true)
            await this.getAllFolders()
            this.createNodeTree()
            if (this.selectedFolderId) this.setSelectedFolderFromPropKey()
            this.setLoading(false)
        },
        async getAllFolders() {
            await this.$http.get(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository`).then((response: AxiosResponse<any>) => (this.folders = { ...response.data }))
            console.log('---------- LOADED FOLDERS: ', this.folders)
        },
        createNodeTree() {
            this.nodes = [] as any[]
            this.nodes = this.formatNodes([this.folders], null)
        },
        formatNodes(tree: any, parent: any) {
            return tree.map((node: any) => {
                node = {
                    key: node.id,
                    id: node.id,
                    label: node.name,
                    children: node.children ?? [],
                    data: node,
                    style: { padding: 0 },
                    leaf: node.children.length === 0,
                    parent: parent,
                    icon: 'pi pi-folder'
                }
                if (node.children && node.children.length > 0) {
                    node.children = this.formatNodes(node.children, node)
                }
                return node
            })
        },
        setSelectedFolderFromPropKey() {
            if (!this.selectedFolderId) return
            this.selectedFolderKey = { [this.selectedFolderId]: true }
            const selectedFolder = this.findNodeInTree(this.selectedFolderId)
            console.log('----- selectedFolder: ', selectedFolder)
        },
        findNodeInTree(key: any) {
            let node = null as any
            for (let i = 0; i < this.nodes.length; i++) {
                node = this.findNode(this.nodes[i], key)
                if (node) break
            }

            return node
        },
        findNode(node: any, nodeKey: string) {
            if (node.key === nodeKey) {
                return node
            } else if (node.children != null) {
                let result = null as any
                for (let i = 0; result == null && i < node.children.length; i++) {
                    result = this.findNode(node.children[i], nodeKey)
                }
                return result
            }
            return null
        },
        setOpenFolderIcon(node: any) {
            node.icon = 'pi pi-folder-open'
        },
        setClosedFolderIcon(node: any) {
            node.icon = 'pi pi-folder'
        },
        setSelectedFolder(folder: any) {
            this.selectedFolder = folder
            this.$emit('folderSelected', this.selectedFolder)
        },
        removeSelectedFolder() {
            this.selectedFolder = null
            this.$emit('folderSelected', this.selectedFolder)
        },
        createFolder(folder: any) {
            this.selectedFolder = folder
            this.newFolderDialogVisible = true
        },
        async createNewFolder(newFolder: any) {
            console.log('----------- this.selectedFolder?: ', this.selectedFolder)
            console.log('----------- newFolder: ', newFolder)
            newFolder.parentId = this.selectedFolder?.id
            newFolder.progr = this.selectedFolder.children.length + 1
            this.setLoading(true)
            await this.$http
                .post(import.meta.env.VITE_RESTFUL_SERVICES_PATH + '1.0/repository', newFolder, { headers: { 'X-Disable-Errors': 'true' } })
                .then(async () => {
                    this.setInfo({ title: this.$t('workspace.myRepository.folderCreatedMessage') })
                    await this.loadData()
                })
                .catch((response: any) => this.setError({ title: this.$t('common.error.generic'), msg: response }))
                .finally(() => (this.newFolderDialogVisible = false))
            this.setLoading(false)
        },
        deleteFolderConfirm(folder: any) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: async () => this.deleteFolder(folder)
            })
        },
        async deleteFolder(folder: any) {
            this.setLoading(true)
            await this.$http
                .delete(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository/${folder.id}`, { headers: { 'X-Disable-Errors': 'true' } })
                .then(async () => {
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    await this.loadData()
                    this.$router.push('/workspace')
                })
                .catch((response: any) => this.setError({ title: this.$t('common.toast.deleteTitle'), msg: response.message === 'sbi.workspace.organizer.folder.error.delete' ? this.$t('workspace.myRepository.folderDeleteError') : response.message }))
            this.setLoading(false)
        },
        onBreadcrumbSelected() {
            this.selectedFolder = this.selectedBreadcrumb?.node
            this.selectedFolderKey = {}
            this.selectedFolderKey[this.selectedFolder.key] = true
        }
    }
})
</script>

<style lang="scss" scoped>
#folders-tree {
    border: none;
}
</style>
