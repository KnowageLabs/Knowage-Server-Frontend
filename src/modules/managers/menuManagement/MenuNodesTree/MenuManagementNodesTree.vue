<template>
    <div class="col listContainer overflow-auto">
        <q-input ref="filter" class="q-ma-sm" dense square standout outlined v-model="filter" :placeholder="$t('common.search')">
            <template v-slot:append>
                <q-icon name="search" />
            </template>
        </q-input>
        <q-tree ref="tree" :filter="filter" class="q-pt-sm functionalitiesTree" :nodes="menuElements" node-key="menuId" default-expand-all selected-color="accent" v-model:selected="selectedKey" @update:selected="onNodeSelect($event)">
            <template #default-header="{ node }">
                <div class="row full-width" :class="{ treeButtons: selectedKey !== node.id }">
                    <q-icon v-if="!node.custIcon && node.icon" :name="iconName(node.icon)" class="q-mr-sm" />
                    <q-avatar v-if="node.custIcon" class="q-mr-sm">
                        <q-img :src="iconName(node.custIcon)" />
                    </q-avatar>
                    <span class="col">{{ node.name }}</span>
                    <q-btn v-if="node.parentId != null" flat round dense size="xs" icon="turn_left" :data-test="'change-with-father-button-' + node.id" @click.stop="changeWithFather(node.id)">
                        <q-tooltip>{{ $t('managers.functionalitiesManagement.swapParent') }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="canBeMovedDown(node)" flat round dense size="xs" icon="arrow_downward" :data-test="'move-down-button-' + node.id" @click.stop="moveDown(node.id)">
                        <q-tooltip>{{ $t('managers.functionalitiesManagement.moveDown') }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="canBeMovedUp(node)" flat round dense size="xs" icon="arrow_upward" :data-test="'move-up-button-' + node.id" @click.stop="moveUp(node.id)">
                        <q-tooltip>{{ $t('managers.functionalitiesManagement.moveUp') }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="canBeDeleted(node)" flat round dense size="xs" icon="delete" :data-test="'delete-button-' + node.id" @click.stop="deleteMenuNode(node.id)">
                        <q-tooltip class="text-capitalize">{{ $t('common.delete') }}</q-tooltip>
                    </q-btn>
                </div>
            </template>
        </q-tree>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Tree from 'primevue/tree'
import { iMenuNode } from '../MenuManagement'
import { arrayToTree } from '@/helpers/commons/arrayToTreeHelper'
import menuNodesTreeDescriptor from './MenuManagementNodesTreeDescriptor.json'

export default defineComponent({
    name: 'menu-nodes-tree',
    components: {
        Tree
    },
    props: {
        elements: Array,
        loading: Boolean
    },
    emits: ['selectedMenuNode', 'unselectedMenuNode', 'deleteMenuNode', 'changeWithFather', 'moveUp', 'moveDown'],
    data() {
        return {
            load: false as boolean,
            menuElements: [] as any[],
            selectedKey: null as any,
            selectedMenuNode: null as any,
            buttonsVisible: [],
            menuNodesTreeDescriptor: menuNodesTreeDescriptor,
            filter: null as any
        }
    },
    watch: {
        elements: {
            handler: async function (element) {
                element = element.map((item) => {
                    item.label = item.name
                    item.id = item.menuId
                    item.key = item.menuId
                    return item
                })

                this.menuElements = [{ label: this.$t('common.home'), name: this.$t('common.home'), icon: 'home', menuId: null, children: await arrayToTree(element, { dataField: null, style: this.menuNodesTreeDescriptor['node-style'] }) }]
                this.expandAll()
            }
        },
        loading: {
            handler: function (l) {
                this.load = l
            }
        }
    },
    methods: {
        expandAll() {
            setTimeout(() => {
                this.$refs.tree?.expandAll()
            }, 500)
        },
        canBeMovedUp(node: iMenuNode) {
            return node.prog !== 1 && node.menuId
        },
        canBeMovedDown(node: iMenuNode) {
            if (node.menuId === null) {
                return false
            }
            let parentNode: iMenuNode | null = null
            if (node.parentId) {
                parentNode = this.findNode(node.parentId, this.menuElements)
            } else {
                parentNode = this.menuElements[0]
            }
            return parentNode && parentNode.children && parentNode.children.length !== node.prog
        },
        findNode(menuId: any, nodes: iMenuNode[]): iMenuNode | null {
            for (const node of nodes) {
                if (node.menuId === menuId) {
                    return node
                }
                const foundNode = this.findNode(menuId, node.children)
                if (foundNode) return foundNode
            }
            return null
        },
        canBeDeleted(node: iMenuNode) {
            return !(node.children?.length > 0)
        },
        deleteMenuNode(elementID: number) {
            this.$emit('deleteMenuNode', elementID)
        },
        changeWithFather(elementID: number) {
            this.$emit('changeWithFather', elementID)
        },
        moveUp(elementID: number) {
            this.$emit('moveUp', elementID)
        },
        moveDown(elementID: number) {
            this.$emit('moveDown', elementID)
        },
        onNodeSelect(event: any) {
            this.selectedMenuNode = this.elements?.find((i) => i.menuId === event)
            this.$emit('selectedMenuNode', this.selectedMenuNode)
        },
        iconName(icon: any) {
            if (icon.className && icon.className != 'custom') return icon.className
            if (icon.src) return icon.src
            else return icon
        }
    }
})
</script>
<style lang="scss" scoped>
.listContainer {
    border: 1px solid var(--kn-list-border-color);
}
.functionalitiesTree {
    border-top: 1px solid var(--kn-list-border-color);
}
.treeButtons {
    &:deep(.q-icon) {
        opacity: 0.2;
    }
    &:hover {
        &:deep(.q-icon) {
            opacity: 0.4;
        }
    }
}
</style>
