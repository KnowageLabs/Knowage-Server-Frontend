<template>
    <div class="p-p-4">
        <Message v-if="searchWarningMessageVisible" class="p-m-4" severity="warn" :closable="false" :style="olapFilterDialogDescriptor.styles.message">
            {{ $t('documentExecution.olap.filterDialog.searchWarningMessage') }}
        </Message>
        <Message v-if="selectedAncestorsWarningVisible" class="p-m-4" severity="warn" :closable="false" :style="olapFilterDialogDescriptor.styles.message">
            {{ $t('documentExecution.olap.filterDialog.ancestorDescendantWarning') }}
        </Message>
        <InputText v-if="!treeLocked" id="olap-filter-tree-search" v-model.trim="searchWord" class="kn-material-input" type="text" :placeholder="$t('common.search')" data-test="search-input" @input="searchTree" />
        <Tree id="kn-parameter-tree" :class="{ 'olap-filter-tree-locked': treeLocked }" :value="nodes" :meta-key-selection="false" :expanded-keys="expandedKeys" :loading="loading" @nodeExpand="loadNodes($event)">
            <template #default="slotProps">
                <Checkbox
                    v-model="selectedFilters"
                    v-tooltip="{ value: $t('documentExecution.olap.filterDialog.parentDisabledTooltip'), disabled: !treeLocked || slotProps.node.data.visible || filterType === 'visible' }"
                    class="p-ml-2"
                    :value="filterType === 'slicer' ? slotProps.node.id : slotProps.node.data"
                    :disabled="treeLocked && filterType !== 'visible' && !slotProps.node.data.visible"
                    @change="onFiltersSelected()"
                />
                <span>{{ slotProps.node.label }}</span>
            </template>
        </Tree>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iNode, iFilterNode } from '../Olap'
import { AxiosResponse } from 'axios'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import olapFilterDialogDescriptor from './OlapFilterDialogDescriptor.json'
import Tree from 'primevue/tree'

export default defineComponent({
    name: 'olap-filter-tree',
    components: { Checkbox, Message, Tree },
    props: { propFilter: { type: Object }, id: { type: String }, clearTrigger: { type: Boolean }, treeLocked: { type: Boolean } },
    emits: ['close', 'loading', 'filtersChanged', 'lockTree', 'rootNode'],
    data() {
        return {
            olapFilterDialogDescriptor,
            nodes: [] as iNode[],
            filter: null as any,
            filterType: '' as string,
            selectedFilters: [] as any,
            expandedKeys: {},
            searchWord: '',
            searchTimeout: null as any,
            searchWarningMessageVisible: false,
            selectedAncestorsWarningVisible: false,
            loading: false
        }
    },
    watch: {
        propFilter() {
            this.loadFilter()
        },
        clearTrigger() {
            this.selectedFilters = []
        },
        treeLocked(value: boolean) {
            if (!value) this.unlockTree()
        }
    },
    created() {
        this.loadFilter()
    },
    methods: {
        loadFilter() {
            this.filter = this.propFilter ? this.propFilter.filter : {}
            this.filterType = this.propFilter?.type

            this.selectedFilters = []
            if (this.filterType === 'slicer') {
                this.filter.hierarchies?.forEach((hierarchy: any) => {
                    hierarchy.slicers?.forEach((slicer: any) => {
                        this.selectedFilters.push(slicer.uniqueName)
                    })
                })
            }
            if (this.selectedFilters.length > 0) this.$emit('lockTree')
            this.$emit('filtersChanged', this.selectedFilters)
            this.loadNodes(null)
        },
        async loadNodes(parent: any) {
            this.$emit('loading', true)
            this.loading = true

            if (!this.filter || (parent && parent.leaf) || this.searchWord.length > 2) {
                this.$emit('loading', false)
                this.loading = false
                return
            }

            let type = 'filtertree'
            if (!parent) type = this.filterType === 'slicer' ? 'slicerTree' : 'visibleMembers'
            const content = [] as any[]

            let postData = {}
            if (parent) {
                postData = { axis: this.filter.axis, hierarchy: this.filter.selectedHierarchyUniqueName, node: parent.id }
            } else if (this.filterType === 'slicer') {
                postData = { hierarchyUniqueName: this.filter.selectedHierarchyUniqueName }
            } else {
                postData = { hierarchy: this.filter.selectedHierarchyUniqueName }
            }

            await this.$http
                .post(import.meta.env.VITE_KNOWAGEWHATIF_CONTEXT + `/restful-services/1.0/hierarchy/${type}?SBI_EXECUTION_ID=${this.id}`, postData)
                .then((response: AxiosResponse<any>) => {
                    response.data.forEach((el: any) => {
                        content.push(this.createNode(el))
                    })
                })
                .catch(() => {})

            this.attachContentToTree(parent, content)
            if (this.filterType === 'visible' && !parent) this.setSelectedFiltersForVisibleType()
            this.$emit('rootNode', this.nodes[0])
            this.$emit('loading', false)
            this.loading = false
        },
        createNode(el: iFilterNode) {
            const tempNode = {
                key: crypto.randomUUID() as string,
                id: '' + el.id,
                label: el.name,
                children: [] as iNode[],
                data: el,
                style: this.olapFilterDialogDescriptor.node.style,
                leaf: this.treeLocked ? true : el.leaf
            } as iNode
            tempNode.children = el.children?.map((child: iFilterNode) => {
                return this.createNode(child)
            })

            if (el.collapsed || this.searchWord.length > 2) {
                this.expandedKeys[tempNode.key] = true
            }

            if (this.filterType !== 'slicer') {
                const index = this.selectedFilters.findIndex((filter: any) => tempNode.id === filter.id && tempNode.data.uniqueName === filter.uniqueName)
                if (index !== -1) this.selectedFilters[index] = { ...tempNode.data }
            }

            return tempNode
        },
        attachContentToTree(parent: iNode | null, content: iNode[]) {
            if (parent) {
                parent.children = []
                parent.children = content
            } else {
                this.nodes = []
                this.nodes = content
            }
        },
        onFiltersSelected() {
            this.selectedAncestorsWarningVisible = this.filterType === 'slicer' && this.hasSelectedAncestorsAndDescendant(this.nodes[0], false)
            this.$emit('filtersChanged', this.selectedFilters)
        },
        hasSelectedAncestorsAndDescendant(node: iNode, ancestorIsSelected: boolean) {
            const nodeIsSelected = this.nodeIsSelected(node)
            if (nodeIsSelected && ancestorIsSelected) {
                return true
            } else if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    if (this.hasSelectedAncestorsAndDescendant(node.children[i], nodeIsSelected || ancestorIsSelected)) return true
                }
            }
            return false
        },
        nodeIsSelected(node: iNode) {
            const index = this.selectedFilters.findIndex((el: any) => el === node.id)
            return index !== -1
        },
        unlockTree() {
            this.expandedKeys = {}
            for (let i = 0; i < this.nodes.length; i++) {
                this.setNodeExpandable(this.nodes[i])
            }
        },
        setNodeExpandable(node: iNode) {
            node.leaf = node.data.leaf
            if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    this.setNodeExpandable(node.children[i])
                }
            }
        },
        searchTree() {
            clearTimeout(this.searchTimeout)
            this.searchWarningMessageVisible = this.searchWord.length > 0 && this.searchWord.length < 3
            if (this.searchWarningMessageVisible) return
            this.searchTimeout = setTimeout(async () => {
                if (this.searchWord.length > 2) {
                    this.loading = true
                    const content = [] as any[]
                    await this.$http
                        .post(import.meta.env.VITE_KNOWAGEWHATIF_CONTEXT + `/restful-services/1.0/hierarchy/search?SBI_EXECUTION_ID=${this.id}`, { axis: this.filter.axis, hierarchy: this.filter.selectedHierarchyUniqueName, name: this.searchWord, showS: false })
                        .then((response: AxiosResponse<any>) => {
                            this.expandedKeys = {}
                            response.data.forEach((el: any) => {
                                content.push(this.createNode(el))
                            })
                        })
                        .catch(() => {})
                    this.attachContentToTree(null, content)
                    this.loading = false
                } else {
                    this.loadNodes(null)
                }
            }, 500)
        },
        setSelectedFiltersForVisibleType() {
            this.$emit('lockTree')
            for (let i = 0; i < this.nodes.length; i++) {
                this.setSelectedVisibleMembers(this.nodes[i])
            }
        },
        setSelectedVisibleMembers(node: iNode) {
            this.expandedKeys[node.key] = true
            if (node.data.visible) this.selectedFilters.push(node.data)
            if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    this.setSelectedVisibleMembers(node.children[i])
                }
            }
        }
    }
})
</script>

<style lang="scss">
#kn-parameter-tree {
    border: none;
}
.olap-filter-tree-locked .p-tree-toggler {
    cursor: not-allowed;
    pointer-events: none;
}
.olap-filter-tree-locked .p-tree-toggler-icon {
    display: none;
    pointer-events: none;
}

#olap-filter-tree-search {
    width: 30%;
}
</style>
