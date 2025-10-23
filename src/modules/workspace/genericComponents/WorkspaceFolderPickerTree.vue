<template>
    <q-banner rounded dense class="bg-info q-mt-sm text-center">
        <template v-slot:avatar>
            <q-icon name="info" />
        </template>
        {{ $t('documentExecution.main.addToWorkspaceHint') }}
    </q-banner>
    <q-tree class="q-mt-sm" :nodes="nodes" node-key="id" default-expand-all selected-color="accent" selection-mode="single" v-model:selected="selectedFolderKey" @update:selected="setSelectedFolder($event)"> </q-tree>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IFolder } from '../Workspace'
import Tree from 'primevue/tree'

export default defineComponent({
    name: 'workspace-document-tree',
    components: { Tree },
    props: { propFolders: { type: Object as PropType<IFolder | null>, required: true } },
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
        },
        getAllFolders() {
            this.folders = this.propFolders ? { ...this.propFolders } : ({} as IFolder)
        },
        createNodeTree() {
            if (this.folders && Array.isArray(this.folders.children) && this.folders.children.length > 0) {
                this.nodes = this.formatNodes(this.folders.children, null)
            } else if (this.folders && this.folders.id) {
                this.nodes = this.formatNodes([this.folders], null)
            } else {
                this.nodes = []
            }
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
                    icon: 'folder'
                }
                if (node.children && node.children.length > 0) {
                    node.children = this.formatNodes(node.children, node)
                }
                return node
            })
        },

        setSelectedFolder(folder: any) {
            this.selectedFolder = folder
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
