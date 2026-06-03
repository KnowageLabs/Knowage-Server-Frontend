<template>
    <q-tree :nodes="nodes" node-key="path" tick-strategy="strict" v-model:ticked="selectedFolders" default-expand-all @update:ticked="emitSelectedFolders">
        <template #default-header="{ node }">
            <div class="row items-center">
                <q-icon :name="node.icon" color="grey" class="q-mr-xs" />
                <span>{{ node.label }}</span>
            </div>
        </template>
    </q-tree>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    name: 'scheduler-document-accordion-tree',
    props: { propFunctionalities: { type: Array }, propSelectedFolders: { type: Array } },
    data() {
        return {
            functionalities: [] as any[],
            selectedFolders: [] as any[],
            nodes: [] as any[]
        }
    },
    watch: {
        propFunctionalities() {
            this.loadFunctionalities()
            this.createNodeTree()
        },
        propSelectedFolders() {
            this.loadSelectedFolders()
        }
    },
    async created() {
        this.loadFunctionalities()
        this.createNodeTree()
        this.loadSelectedFolders()
    },
    methods: {
        loadFunctionalities() {
            this.functionalities = this.propFunctionalities as any[]
        },
        loadSelectedFolders() {
            this.selectedFolders = this.propSelectedFolders ? [...(this.propSelectedFolders as any[])] : []
        },
        createNodeTree() {
            this.nodes = []
            const foldersWithMissingParent = [] as any[]
            this.functionalities.forEach((folder: any) => {
                const node = {
                    path: folder.path,
                    id: folder.id,
                    parentId: folder.parentId,
                    label: folder.name,
                    children: [] as any[],
                    data: folder,
                    icon: 'folder',
                    noTick: !(folder.codType === 'USER_FUNCT' || folder.parentId)
                }
                node.children = foldersWithMissingParent.filter((f: any) => node.id === f.parentId)
                this.attachFolderToTree(node, foldersWithMissingParent)
            })
        },
        attachFolderToTree(folder: any, foldersWithMissingParent: any[]) {
            if (folder.parentId) {
                let parentFolder = null as any
                for (let i = 0; i < foldersWithMissingParent.length; i++) {
                    if (folder.parentId === foldersWithMissingParent[i].id) {
                        folder.data.parentFolder = foldersWithMissingParent[i]
                        foldersWithMissingParent[i].children?.push(folder)
                        break
                    }
                }
                for (let i = 0; i < this.nodes.length; i++) {
                    parentFolder = this.findParentFolder(folder, this.nodes[i])
                    if (parentFolder) {
                        folder.data.parentFolder = parentFolder
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
        findParentFolder(folderToAdd: any, folderToSearch: any) {
            if (folderToAdd.parentId === folderToSearch.id) {
                return folderToSearch
            } else {
                let tempFolder = null as any
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
        emitSelectedFolders() {
            this.$emit('selected', this.selectedFolders)
        }
    }
})
</script>

<style lang="scss" scoped></style>
