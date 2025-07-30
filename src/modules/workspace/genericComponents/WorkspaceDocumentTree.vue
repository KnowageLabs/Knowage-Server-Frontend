<template>
    <q-banner v-if="nodes.length === 0 && !loading" class="bg-info text-black q-ma-sm" rounded dense>{{ $t('workspace.addViewFolderHint') }}</q-banner>
    <q-tree v-if="nodes && nodes.length > 0" :nodes="nodes" node-key="id" v-model:selected="selectedFolderKey" @update:selected="setSelectedFolder" class="fit">
        <template #default-header="{ node }">
            <div class="row full-width">
                <q-icon :name="node.icon" class="q-mr-sm" />
                <span class="col">{{ node.label }}</span>
                <q-btn v-show="mode === 'select'" flat round dense size="xs" icon="add" @click.stop="createFolder(node)">
                    <q-tooltip>{{ $t('common.add') }}</q-tooltip>
                </q-btn>
                <q-btn v-show="mode === 'select'" v-if="node.id" flat round dense size="xs" icon="edit" @click.stop="editFolder(node.data)">
                    <q-tooltip>{{ $t('common.edit') }}</q-tooltip>
                </q-btn>
                <q-btn v-show="mode === 'select'" v-if="node.id" flat round dense size="xs" icon="delete" @click.stop="deleteFolderConfirm(node)">
                    <q-tooltip class="text-capitalized">{{ $t('common.delete') }}</q-tooltip>
                </q-btn>
            </div>
        </template>
    </q-tree>
    <WorkspaceNewFolderDialog :visible="newFolderDialogVisible" :selected-folder="selectedFolderForEdit" :propFolders="folders" @close="onNewFolderDialogClose" @create="createNewFolder" @edit="onEditFolder"></WorkspaceNewFolderDialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { IFolder } from '../Workspace'
import { mapActions } from 'pinia'
import WorkspaceNewFolderDialog from './WorkspaceNewFolderDialog.vue'
import workspaceDocumentTreeDescriptor from './WorkspaceDocumentTreeDescriptor.json'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'workspace-document-tree',
    components: { WorkspaceNewFolderDialog },
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
            newFolderDialogVisible: false,
            selectedFolderForEdit: null as any,
            loading: false
        }
    },
    watch: {
        selectedBreadcrumb() {
            this.onBreadcrumbSelected()
        },
        async selectedFolderId() {
            await this.loadData()
        }
    },
    async created() {
        await this.loadData()
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError', 'setLoading']),
        async loadData() {
            this.setLoading(true)
            this.loading = true
            await this.getAllFolders()
            this.createNodeTree()
            if (this.selectedFolderId) this.setSelectedFolderFromPropKey()
            this.loading = false
            this.setLoading(false)
        },
        async getAllFolders() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/repository`).then((response: AxiosResponse<any>) => (this.folders = { ...response.data }))
        },
        createNodeTree() {
            this.nodes = [] as any[]
            this.nodes = this.formatNodes([this.folders], null)
            if (this.mode === 'move') this.nodes = this.nodes[0].children
        },
        formatNodes(tree: any, parent: any) {
            console.log(tree)
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
                    icon: 'folder_open'
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
            if (selectedFolder) this.selectedFolder = selectedFolder
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
        findSelectedObjects(nodes, keys) {
            const result = []
            for (const node of nodes) {
                if (keys.includes(node.id)) {
                    result.push(node)
                }
                if (node.children) {
                    result.push(...this.findSelectedObjects(node.children, keys))
                }
            }
            return result
        },
        setSelectedFolder(folder: any) {
            this.selectedFolder = this.findSelectedObjects(this.nodes, folder)[0]
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
        editFolder(folder: any) {
            this.selectedFolderForEdit = folder
            this.newFolderDialogVisible = true
        },
        async createNewFolder(newFolder: any) {
            newFolder.parentId = this.selectedFolder?.id
            newFolder.progr = this.selectedFolder.children.length + 1
            this.setLoading(true)
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/repository', newFolder)
                .then(async () => {
                    this.setInfo({ title: this.$t('workspace.myRepository.folderCreatedMessage') })
                    await this.loadData()
                })
                .catch((response: any) => this.setError({ title: this.$t('common.error.generic'), msg: response }))
                .finally(() => this.onNewFolderDialogClose())
            this.setLoading(false)
        },
        async onEditFolder(folder: any) {
            this.setLoading(true)
            const postData = { id: folder.id, name: folder.name, description: folder.description, parentId: folder.parentId, progr: folder.progr }
            await this.$http
                .put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/repository`, postData)
                .then(async () => {
                    this.setInfo({ title: this.$t('common.toast.updateTitle') })
                    await this.loadData()
                })
                .catch((response: any) => this.setError({ title: this.$t('common.error.generic'), msg: response }))
                .finally(() => this.onNewFolderDialogClose())
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
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/repository/${folder.id}`, { headers: { 'X-Disable-Errors': 'true' } })
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
        },
        onNewFolderDialogClose() {
            this.newFolderDialogVisible = false
            this.selectedFolderForEdit = null
        }
    }
})
</script>

<style lang="scss" scoped>
#folders-tree {
    border: none;
}
</style>
