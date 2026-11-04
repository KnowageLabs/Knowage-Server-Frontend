<template>
    <q-banner v-if="nodes.length === 0 && !loading" class="bg-info text-black q-ma-sm" rounded dense>{{ $t('workspace.addViewFolderHint') }}</q-banner>
    <q-tree v-if="nodes && nodes.length > 0" :nodes="nodes" node-key="id" v-model:selected="selectedFolderKey" @update:selected="setSelectedFolder" class="fit">
        <template #default-header="{ node }">
            <div class="row full-width">
                <q-icon :name="node.icon" class="q-mr-sm" />
                <span class="col">{{ node.label }}</span>
            </div>
        </template>
    </q-tree>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { IFolder } from '../Workspace'
import { mapActions } from 'pinia'
import workspaceDocumentTreeDescriptor from './WorkspaceDocumentTreeDescriptor.json'
import mainStore from '@/App.store'
import { isFavoritesFolder } from '../workspaceHelpers'

export default defineComponent({
    name: 'workspace-document-tree',
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
        ...mapActions(mainStore, ['setLoading']),
        async loadData() {
            this.setLoading(true)
            this.loading = true
            try {
                await this.getAllFolders()
                this.createNodeTree()
                if (this.selectedFolderId) this.setSelectedFolderFromPropKey()
            } catch {
                // the axios interceptor already shows the error
            } finally {
                this.loading = false
                this.setLoading(false)
            }
        },
        async getAllFolders() {
            // the Favorites folder of My Workspace is never a place to save into (spec 7.3 item 4)
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/repository`).then((response: AxiosResponse<any>) => (this.folders = { ...response.data, children: (response.data?.children ?? []).filter((folder: IFolder) => !isFavoritesFolder(folder)) }))
        },
        createNodeTree() {
            this.nodes = [] as any[]
            this.nodes = this.formatNodes([this.folders], null)
            if (this.mode === 'move') this.nodes = this.nodes[0].children
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
