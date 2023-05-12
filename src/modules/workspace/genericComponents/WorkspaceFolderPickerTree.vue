<template>
    <Tree id="folders-tree" v-model:selectionKeys="selectedFolderKey" :value="nodes" selection-mode="single" @node-select="setSelectedFolder($event)" @node-unselect="removeSelectedFolder" @node-expand="setOpenFolderIcon($event)" @node-collapse="setClosedFolderIcon($event)">
        <template #default="slotProps">
            <div class="p-d-flex p-flex-row p-ai-center">
                <span>{{ slotProps.node.label }}</span>
            </div>
        </template>
    </Tree>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IFolder } from '../Workspace'
import Tree from 'primevue/tree'

export default defineComponent({
    name: 'workspace-document-tree',
    components: { Tree },
    props: { propFolders: { type: Object as PropType<IFolder | null>, required: true }, selectedFolderId: { type: String } },
    emits: ['folderSelected'],
    data() {
        return {
            folders: {} as IFolder,
            nodes: [] as any[],
            selectedFolderKey: {},
            selectedFolder: null as any
        }
    },
    watch: {
        propFolders() {
            this.loadData()
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        loadData() {
            this.getAllFolders()
            this.createNodeTree()
            if (this.selectedFolderId) this.setSelectedFolderFromPropKey()
        },
        getAllFolders() {
            this.folders = this.propFolders ? { ...this.propFolders } : ({} as IFolder)
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
        setSelectedFolder(folder: any) {
            this.selectedFolder = folder
            this.$emit('folderSelected', this.selectedFolder)
        },
        removeSelectedFolder() {
            this.selectedFolder = null
            this.$emit('folderSelected', this.selectedFolder)
        }
    }
})
</script>

<style lang="scss" scoped>
#folders-tree {
    border: none;
}
</style>
