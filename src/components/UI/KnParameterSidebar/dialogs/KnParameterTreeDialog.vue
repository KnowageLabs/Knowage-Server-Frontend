<template>
    <Dialog v-model:visible="dialogVisible" class="p-fluid kn-dialog--toolbar--primary" :content-style="knParameterTreeDialogDescriptor.dialog.style" :modal="true" :dismissable-mask="true" :closable="true" @after-hide="closeDialog">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('common.parameter') + ': ' + parameter?.label }}
                </template>
            </Toolbar>
        </template>
        <q-input v-model="searchText" filled clearable class="q-my-sm" :placeholder="$t('common.search')" :disable="loading" @update:model-value="onSearchInput">
            <template #prepend>
                <q-icon name="search" />
            </template>
        </q-input>
        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

        <q-tree
            id="kn-parameter-tree"
            :nodes="nodes"
            node-key="id"
            v-model:selected="selectedKey"
            v-model:ticked="tickedKeys"
            :tick-strategy="tickStrategy"
            :no-nodes-label="$t('common.info.noDataFound')"
            no-connectors
            selected-color="accent"
            @update:selected="onSingleSelectionChange"
            @lazy-load="onLazyLoad"
        >
            <template #default-header="{ node, expanded }">
                <q-icon :name="node.leaf ? 'description' : (expanded ? 'folder_open' : 'folder')" class="q-mr-sm" />
                <span>{{ node.label }}</span>
            </template>
        </q-tree>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" data-test="close-button" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
                <Button class="kn-button kn-button--primary" data-test="save-button" @click="save"> {{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { iParameter } from '../KnParameterSidebar'
import Dialog from 'primevue/dialog'
import knParameterTreeDialogDescriptor from './KnParameterTreeDialogDescriptor.json'
import { mapState } from 'pinia'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'kn-parameter-tree-dialog',
    components: { Dialog },
    props: { visible: { type: Boolean }, selectedParameter: { type: Object }, formatedParameterValues: { type: Object }, document: { type: Object }, mode: { type: String }, selectedRole: { type: String } },
    emits: ['close', 'save'],
    data() {
        return {
            knParameterTreeDialogDescriptor,
            parameter: null as iParameter | null,
            nodes: [] as any[],
            nodeDataMap: {} as Record<string, { value: string; description: string; leaf: boolean }>,
            selectedKey: null as string | null,
            tickedKeys: [] as string[],
            selectedValue: null as { value: string; description: string } | null,
            multivalue: false,
            loading: false,
            dialogVisible: false,
            searchText: '' as string,
            isSearchMode: false,
            searchDebounceTimer: null as ReturnType<typeof setTimeout> | null
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        }),
        tickStrategy(): 'none' | 'strict' | 'leaf' | 'leaf-filtered' {
            if (!this.multivalue) return 'none'
            return this.parameter?.allowInternalNodeSelection ? 'strict' : 'leaf-filtered'
        }
    },
    watch: {
        async visible() {
            this.changeDialogVisibility()
            await this.loadTree()
        },
        async selectedParameter() {
            this.changeDialogVisibility()
            await this.loadTree()
        }
    },
    async created() {
        this.changeDialogVisibility()
        await this.loadTree()
    },
    beforeUnmount() {
        if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
    },
    methods: {
        changeDialogVisibility() {
            this.dialogVisible = this.visible
        },
        async loadTree() {
            this.loadParameter()
            if (this.parameter && this.formatedParameterValues && this.visible) {
                await this.loadRootNodes()
            }
        },
        loadParameter() {
            this.parameter = this.selectedParameter as iParameter
            this.multivalue = this.selectedParameter?.multivalue ?? false
            this.selectedKey = null
            this.selectedValue = null
            this.tickedKeys = []
            this.searchText = ''
            this.isSearchMode = false
            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer)
                this.searchDebounceTimer = null
            }
        },
        async loadRootNodes() {
            this.loading = true
            this.nodeDataMap = {}
            this.nodes = []
            if (!this.document) {
                this.loading = false
                return
            }
            const content = await this.fetchNodes(null)
            this.nodes = content
            content.forEach((node: any) => this.checkIfNodeIsSelected(node))
            this.loading = false
        },
        async onLazyLoad({ node, done, fail }: { node: any; done: (nodes?: any[]) => void; fail: () => void }) {
            if (this.isSearchMode) {
                done([])
                return
            }
            if (!this.document) {
                fail()
                return
            }
            try {
                const content = await this.fetchNodes(node)
                content.forEach((child: any) => this.checkIfNodeIsSelected(child))
                done(content)
            } catch (error) {
                console.log('ERROR loading tree node children:', error)
                fail()
            }
        },
        async callTreeService(parent: any, filterValue?: string): Promise<any[]> {
            if (!this.document) return []
            const sessionRole = this.user.sessionRole
            const role = sessionRole && sessionRole !== this.$t('role.defaultRolePlaceholder') ? sessionRole : this.selectedRole
            let url = '/restful-services/2.0/documentexecution/admissibleValuesTree'
            if (this.mode !== 'execution') {
                url = this.document.type === 'businessModel'
                    ? `/restful-services/1.0/businessmodel/${this.document.name}/admissibleValuesTree`
                    : `/restful-services/3.0/datasets/${this.document.label}/admissibleValuesTree`
            }
            const postData: any = {
                label: this.document.label ?? this.document.name,
                role,
                parameterId: this.parameter?.urlName,
                mode: 'complete',
                treeLovNode: parent ? parent.id : 'lovroot',
                parameters: this.formatedParameterValues
            }
            if (filterValue) postData.filterValue = filterValue
            const rows: any[] = []
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData)
                .then((response: AxiosResponse<any>) => rows.push(...response.data.rows))
                .catch((error: any) => console.log('ERROR: ', error))
            return rows
        },
        async fetchNodes(parent: any): Promise<any[]> {
            const rows = await this.callTreeService(parent)
            return rows.map((el: any) => this.createNode(el))
        },
        createNode(el: any) {
            const node: any = {
                id: el.id,
                label: el.label,
                data: { value: el.data, description: el.label },
                leaf: el.leaf,
                noTick: !this.isNodeSelectable(el)
            }
            if (!el.leaf) {
                node.lazy = true
            }
            this.nodeDataMap[el.id] = { value: el.data, description: el.label, leaf: el.leaf }
            return node
        },
        isNodeSelectable(el: any) {
            if (!this.parameter) return true
            return this.parameter.allowInternalNodeSelection || el.leaf
        },
        checkIfNodeIsSelected(node: any) {
            this.nodeDataMap[node.id] = { value: node.data.value, description: node.data.description, leaf: node.leaf }
            if (node.leaf) {
                const index = this.parameter?.parameterValue.findIndex((el: any) => el.value === node.data.value)
                if (index !== -1) {
                    if (this.multivalue) {
                        if (!this.tickedKeys.includes(node.id)) {
                            this.tickedKeys = [...this.tickedKeys, node.id]
                        }
                    } else {
                        this.selectedKey = node.id
                        this.selectedValue = { value: node.data.value, description: node.data.description }
                    }
                }
            }
        },
        onSingleSelectionChange(id: string | null) {
            if (!id) {
                this.selectedValue = null
                return
            }
            const info = this.nodeDataMap[id]
            if (!info) {
                this.selectedValue = null
                return
            }
            const selectable = !this.parameter || this.parameter.allowInternalNodeSelection || info.leaf
            if (!selectable) {
                this.$nextTick(() => { this.selectedKey = null })
                this.selectedValue = null
            } else {
                this.selectedValue = { value: info.value, description: info.description }
            }
        },
        onSearchInput(value: string | number | null) {
            if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer)
            this.searchDebounceTimer = setTimeout(async () => {
                this.searchDebounceTimer = null
                const text = (value != null ? String(value) : '').trim()
                if (text.length > 0) {
                    await this.loadFilteredTree(text)
                } else {
                    this.isSearchMode = false
                    await this.loadRootNodes()
                }
            }, 400)
        },
        async loadFilteredTree(filterValue: string) {
            this.loading = true
            this.isSearchMode = true
            this.nodeDataMap = {}
            this.nodes = []
            const rows = await this.callTreeService(null, filterValue)
            this.nodes = this.buildTreeFromFlatList(rows)
            this.loading = false
        },
        buildTreeFromFlatList(rows: any[]): any[] {
            const stack: any[] = []
            const roots: any[] = []
            for (const el of rows) {
                const parts = String(el.id).split('___SEPA__')
                const level = parseInt(parts[parts.length - 1], 10)
                const node: any = {
                    id: el.id,
                    label: el.label,
                    data: { value: el.data, description: el.label },
                    leaf: el.leaf,
                    children: [],
                    noTick: !this.isNodeSelectable(el)
                }
                this.nodeDataMap[el.id] = { value: el.data, description: el.label, leaf: el.leaf }
                this.checkIfNodeIsSelected(node)
                if (level === 0) {
                    roots.push(node)
                } else {
                    const parent = stack[level - 1]
                    if (parent) parent.children.push(node)
                }
                stack[level] = node
            }
            return roots
        },
        closeDialog() {
            this.$emit('close')
            this.loadParameter()
            this.selectedValue = null
            this.nodeDataMap = {}
            this.nodes = []
        },
        save() {
            if (!this.parameter) return
            if (!this.multivalue) {
                this.parameter.parameterValue = this.selectedValue ? [{ value: this.selectedValue.value, description: this.selectedValue.description ?? '' }] : []
            } else {
                this.parameter.parameterValue = this.tickedKeys
                    .map((key) => this.nodeDataMap[key])
                    .filter(Boolean)
                    .map((data) => ({ value: data.value, description: data.description ?? '' }))
            }
            this.selectedKey = null
            this.selectedValue = null
            this.tickedKeys = []
            this.nodeDataMap = {}
            this.nodes = []
            this.$emit('save', this.parameter)
        }
    }
})
</script>
<style lang="scss" scoped>
#kn-parameter-tree {
    border: none;
}
</style>
