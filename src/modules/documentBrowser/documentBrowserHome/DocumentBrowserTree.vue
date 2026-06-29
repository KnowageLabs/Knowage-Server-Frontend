<template>
    <div class="column no-wrap full-height">
        <div class="q-px-sm">
            <q-input v-model="treeFilter" dense borderless clearable :placeholder="$t('common.search')">
                <template #prepend>
                    <q-icon name="search" size="xs" />
                </template>
            </q-input>
        </div>
        <q-separator></q-separator>
        <q-scroll-area class="col">
            <q-tree :nodes="filteredNodes as any" node-key="key" v-model:selected="selectedKey" v-model:expanded="expandedKeys" selected-color="primary" @update:selected="onNodeSelected">
                <template #default-header="{ node }">
                    <q-icon :name="expandedKeys.includes(node.key) && node.children?.length ? 'folder_open' : 'folder'" class="q-mr-sm" color="primary" size="sm" />
                    <span class="text-body2">{{ getTranslatedLabel(node.label) }}</span>
                </template>
            </q-tree>
        </q-scroll-area>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iFolder, iNode } from '../DocumentBrowser'
import mainStore from '../../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    name: 'document-browser-tree',
    props: { propFolders: { type: Array as PropType<Array<iFolder>> }, selectedBreadcrumb: { type: Object }, selectedFolderProp: { type: Object } },
    emits: ['folderSelected'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            folders: [] as iFolder[],
            nodes: [] as iNode[],
            selectedKey: null as string | null,
            expandedKeys: [] as string[],
            selectedFolder: null as any,
            treeFilter: ''
        }
    },
    computed: {
        isAdmin(): boolean {
            const user = (this.store.$state as any).user
            return user?.isSuperadmin || user?.functionalities?.includes(UserFunctionalitiesConstants.VIEW_MY_FOLDER_ADMIN)
        },
        filteredNodes(): iNode[] {
            if (!this.treeFilter?.trim()) return this.nodes
            return this.filterNodes(this.nodes, this.treeFilter.toLowerCase())
        }
    },
    watch: {
        propFolders() {
            this.loadFolders()
            this.createNodeTree()
        },
        selectedBreadcrumb() {
            this.onBreadcrumbSelected()
        },
        selectedFolderProp() {
            this.selectedFolder = this.selectedFolderProp
            if (!this.selectedFolder) return
            this.selectedKey = String(this.selectedFolder.id)
            for (let i = 0; i < this.nodes.length; i++) {
                const temp = this.findNode(this.nodes[i], this.selectedFolder.id, 'id')
                if (temp) {
                    const tempKeyStr = String(temp.key)
                    if (!this.expandedKeys.includes(tempKeyStr)) this.expandedKeys.push(tempKeyStr)
                    const tempPath = this.selectedFolder.path?.substring(1)?.split('/')
                    tempPath?.forEach((el: string) => {
                        const tempFolderByCode = this.findNode(this.nodes[i], el, 'code')
                        if (tempFolderByCode) {
                            const codeKeyStr = String(tempFolderByCode.key)
                            if (!this.expandedKeys.includes(codeKeyStr)) this.expandedKeys.push(codeKeyStr)
                        }
                    })
                    break
                }
            }
        },
        treeFilter(val: string | null) {
            if (val && val.trim()) {
                const allKeys: string[] = []
                this.collectKeys(this.filteredNodes, allKeys)
                this.expandedKeys = allKeys
            }
        }
    },
    created() {
        this.loadFolders()
        this.createNodeTree()
    },
    methods: {
        loadFolders() {
            this.folders = this.propFolders as iFolder[]
            this.loadSelectedFolderFromLocalStorage()
        },
        createNodeTree() {
            const personalFolder = {
                key: 'Personal_Folders',
                icon: 'folder',
                id: -1,
                prog: 0,
                parentId: null,
                label: 'Personal_Folders',
                children: [] as iNode[],
                data: {
                    id: -1,
                    codType: 'LOW_FUNCT',
                    code: 'Personal_Folders',
                    createRoles: [],
                    description: 'Personal Folders',
                    name: 'Personal_Folders',
                    parentId: null,
                    subfolders: [],
                    path: '/Personal-Folders'
                }
            }
            this.nodes = this.isAdmin ? [personalFolder] : []
            const foldersWithMissingParent = [] as iNode[]
            this.folders.forEach((folder: iFolder) => {
                const node = { key: String(folder.id), icon: 'folder', id: folder.id, prog: folder.prog, parentId: folder.parentId, label: folder.name, children: [] as iNode[], data: folder }
                node.children = foldersWithMissingParent.filter((folder: iNode) => node.id === folder.parentId && folder.data.codType !== 'LOW_FUNCT')
                this.attachFolderToTree(node, foldersWithMissingParent, personalFolder)
            })
            while (foldersWithMissingParent.length !== 0) this.attachFoldersFromMissngParentArrayToTheTree(foldersWithMissingParent, personalFolder)
            this.sortNodesAndChildren(this.nodes)
        },
        sortNodesAndChildren(nodes: iNode[]) {
            nodes.sort((a: iNode, b: iNode) => a.prog - b.prog)
            nodes.forEach((node: iNode) => {
                if (node.children) this.sortNodesAndChildren(node.children)
            })
        },
        attachFolderToTree(folder: iNode, foldersWithMissingParent: iNode[], personalFolder: iNode) {
            if (folder.parentId && folder.parentId !== -1) {
                let parentFolder = null as iNode | null
                for (let i = 0; i < foldersWithMissingParent.length; i++) {
                    if (folder.parentId === foldersWithMissingParent[i].id && foldersWithMissingParent[i].data.codType !== 'USER_FUNCT') {
                        folder.data.parentFolder = foldersWithMissingParent[i]
                        foldersWithMissingParent[i].children?.push(folder)
                        break
                    }
                }
                for (let i = 0; i < this.nodes.length; i++) {
                    parentFolder = this.findParentFolder(folder, this.nodes[i])
                    if (parentFolder && parentFolder.data.codType !== 'USER_FUNCT') {
                        folder.data.parentFolder = parentFolder
                        parentFolder.children?.push(folder)
                        break
                    }
                }
                if (!parentFolder && folder.data.codType !== 'USER_FUNCT') {
                    foldersWithMissingParent.push(folder)
                }
            } else if (folder.data.codType === 'USER_FUNCT') {
                if (this.isAdmin) {
                    folder.data.parentFolder = personalFolder
                    folder.data.parentId = personalFolder.id
                    personalFolder.children?.push(folder)
                }
            } else {
                this.nodes.push(folder)
            }
        },
        findParentFolder(folderToAdd: iNode, folderToSearch: iNode) {
            if (folderToAdd.data.codType === 'USER_FUNCT') return null
            if (folderToAdd.parentId === folderToSearch.id) return folderToSearch
            let tempFolder = null as iNode | null
            if (folderToSearch.children) {
                for (let i = 0; i < folderToSearch.children.length; i++) {
                    tempFolder = this.findParentFolder(folderToAdd, folderToSearch.children[i])
                    if (tempFolder) break
                }
            }
            return tempFolder
        },
        attachFoldersFromMissngParentArrayToTheTree(foldersWithMissingParent: iNode[], personalFolder: iNode) {
            for (let i = foldersWithMissingParent.length - 1; i >= 0; i--) {
                this.attachFolderToTree(foldersWithMissingParent[i], foldersWithMissingParent, personalFolder)
                foldersWithMissingParent.splice(i)
            }
        },
        onNodeSelected(key: string | null) {
            if (!key) return
            const node = this.findNodeByKey(this.nodes, key)
            if (node) this.setSelectedFolder(node)
        },
        setSelectedFolder(node: iNode) {
            this.selectedFolder = node.data
            localStorage.setItem('documentSelectedFolderId', JSON.stringify(this.selectedFolder.id))
            this.$emit('folderSelected', this.selectedFolder)
        },
        onBreadcrumbSelected() {
            this.selectedFolder = this.selectedBreadcrumb?.node
            if (this.selectedFolder) this.selectedKey = this.selectedFolder.key
        },
        loadSelectedFolderFromLocalStorage() {
            const folderId = localStorage.getItem('documentSelectedFolderId')
            if (folderId) {
                const index = this.folders.findIndex((el: iFolder) => el.id === JSON.parse(folderId))
                if (index !== -1) {
                    this.selectedFolder = this.folders[index]
                    this.selectedKey = String(this.folders[index].id)
                    if (!this.expandedKeys.includes(String(this.folders[index].id))) this.expandedKeys.push(String(this.folders[index].id))
                    this.$emit('folderSelected', this.selectedFolder)
                }
            }
        },
        findNode(node: iNode, value: number | string, property: string): iNode | null {
            if (node.data[property] === value) return node
            if (node.children != null) {
                let result = null as any
                for (let i = 0; result == null && i < node.children.length; i++) {
                    result = this.findNode(node.children[i], value, property)
                }
                return result
            }
            return null
        },
        findNodeByKey(nodes: iNode[], key: string): iNode | null {
            for (const node of nodes) {
                if (node.key === key) return node
                if (node.children?.length) {
                    const found = this.findNodeByKey(node.children, key)
                    if (found) return found
                }
            }
            return null
        },
        filterNodes(nodes: iNode[], filter: string): iNode[] {
            return nodes.reduce((acc: iNode[], node: iNode) => {
                const children = this.filterNodes(node.children || [], filter)
                if (node.label.toLowerCase().includes(filter) || children.length > 0) {
                    acc.push({ ...node, children })
                }
                return acc
            }, [])
        },
        collectKeys(nodes: iNode[], keys: string[]) {
            nodes.forEach((n) => {
                keys.push(String(n.key))
                if (n.children?.length) this.collectKeys(n.children, keys)
            })
        },
        getTranslatedLabel(label: string) {
            return (this as any).$internationalization(label)
        }
    }
})
</script>

<style lang="scss" scoped>
.q-tree {
    padding: 0 4px;
}
</style>
