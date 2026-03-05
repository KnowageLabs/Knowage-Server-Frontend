<template>
    <div class="tree-selector" :style="treeWrapperStyle">
        <template v-if="treeStyle?.popupMode">
            <q-input :model-value="displayValue" dense readonly :placeholder="$t('common.select')">
                <q-popup-edit ref="popup" :model-value="popupDummy" auto-save cover @update:model-value="() => {}">
                    <q-input v-if="treeStyle?.showFilter" v-model="filterText" dense clearable autofocus class="q-mb-sm" />
                    <q-tree
                        ref="tree"
                        :nodes="nodes"
                        node-key="__key"
                        :dense="treeStyle?.dense || false"
                        :accordion="treeStyle?.accordion || false"
                        :default-expand-all="treeStyle?.defaultExpandAll || false"
                        :no-connectors="treeStyle?.noConnectors || false"
                        :dark="treeStyle?.dark || false"
                        :color="treeStyle?.color || undefined"
                        :text-color="treeStyle?.textColor || undefined"
                        :control-color="treeStyle?.controlColor || undefined"
                        :filter="filterText"
                        :no-nodes-label="$t('common.noResults')"
                    >
                        <template #default-header="{ node, key, expanded }">
                            <div :class="['tree-node-label', 'full-width', { 'tree-node-label--selected': isSelectedLeaf(node), 'tree-node-label--disabled': node.disabled }]" :style="getLabelStyle(node)" @click.stop="onNodeHeaderClick(node, key, expanded)">{{ node.label }}</div>
                        </template>
                    </q-tree>
                </q-popup-edit>
            </q-input>
        </template>

        <template v-else>
            <q-input v-if="treeStyle?.showFilter" v-model="filterText" dense clearable class="q-mb-sm" />
            <q-tree
                ref="tree"
                :nodes="nodes"
                node-key="__key"
                :dense="treeStyle?.dense || false"
                :accordion="treeStyle?.accordion || false"
                :default-expand-all="treeStyle?.defaultExpandAll || false"
                :no-connectors="treeStyle?.noConnectors || false"
                :dark="treeStyle?.dark || false"
                :color="treeStyle?.color || undefined"
                :text-color="treeStyle?.textColor || undefined"
                :control-color="treeStyle?.controlColor || undefined"
                :filter="filterText"
                :no-nodes-label="$t('common.noResults')"
            >
                <template #default-header="{ node, key, expanded }">
                    <div :class="['tree-node-label', 'full-width', { 'tree-node-label--selected': isSelectedLeaf(node), 'tree-node-label--disabled': node.disabled }]" :style="getLabelStyle(node)" @click.stop="onNodeHeaderClick(node, key, expanded)">{{ node.label }}</div>
                </template>
            </q-tree>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetTreeStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'

export interface TreeNodeItem {
    label: string
    __key: string
    disabled?: boolean
    selectable?: boolean
    children?: TreeNodeItem[]
}

export default defineComponent({
    name: 'tree-selector',
    props: {
        modelValue: { type: [String, Number, null] as any, default: null },
        nodes: { type: Array as PropType<TreeNodeItem[]>, default: () => [] },
        treeStyle: { type: Object as PropType<ISelectorWidgetTreeStyle>, default: () => ({}) }
    },
    data() {
        return {
            filterText: '' as string,
            popupDummy: null as null
        }
    },
    computed: {
        displayValue(): string {
            return this.modelValue !== null && this.modelValue !== undefined ? String(this.modelValue) : ''
        },
        treeWrapperStyle(): Record<string, string> {
            const style: Record<string, string> = {}
            if (this.treeStyle?.color) style['--tree-node-color'] = this.treeStyle.color
            if (this.treeStyle?.controlColor) style['--tree-control-color'] = this.treeStyle.controlColor
            return style
        }
    },
    methods: {
        isSelectedLeaf(node: TreeNodeItem): boolean {
            return !node.children?.length && this.modelValue !== null && node.label === String(this.modelValue)
        },
        getLabelStyle(node: TreeNodeItem): Record<string, string> {
            const style: Record<string, string> = {}
            if (this.isSelectedLeaf(node) && this.treeStyle?.selectedColor) {
                style.color = this.treeStyle.selectedColor
            } else if (!node.children?.length && this.treeStyle?.textColor) {
                style.color = this.treeStyle.textColor
            }
            return style
        },
        isLeafKey(key: string | null): boolean {
            if (!key) return false
            const node = this.findNodeByKey(this.nodes, key)
            return !!node && (!node.children || node.children.length === 0)
        },
        findNodeByKey(nodes: TreeNodeItem[], key: string): TreeNodeItem | null {
            for (const node of nodes) {
                if (node.__key === key) return node
                if (node.children?.length) {
                    const found = this.findNodeByKey(node.children, key)
                    if (found) return found
                }
            }
            return null
        },
        onNodeHeaderClick(node: TreeNodeItem, key: string, expanded: boolean) {
            if (node.children?.length) {
                // parent node — toggle expansion
                ;(this.$refs.tree as any).setExpanded(key, !expanded)
            } else if (!node.disabled) {
                // leaf node — toggle selection on/off
                const newValue = this.modelValue !== null && node.label === String(this.modelValue) ? null : node.label
                this.$emit('update:modelValue', newValue)
                // close the popup after selection in popup mode
                if (this.treeStyle?.popupMode) {
                    ;(this.$refs.popup as any)?.hide()
                }
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.tree-selector {
    :deep(.q-tree__arrow) {
        color: var(--tree-control-color);
    }

    :deep(.q-tree__node-header-content) {
        color: var(--tree-node-color);
    }
}

.tree-node-label {
    cursor: pointer;
    border-radius: 3px;
    transition: background-color 0.15s ease;

    &:not(.tree-node-label--disabled):hover {
        background-color: rgba(0, 0, 0, 0.08);
    }

    &--selected {
        color: var(--q-primary);
        font-weight: 600;
    }

    &--disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
}
</style>
