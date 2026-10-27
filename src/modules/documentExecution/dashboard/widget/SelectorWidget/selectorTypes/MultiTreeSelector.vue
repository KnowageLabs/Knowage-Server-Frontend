<template>
    <div class="multi-tree-selector" :style="treeWrapperStyle">
        <template v-if="treeStyle?.popupMode">
            <q-input :model-value="displayValue" dense readonly :placeholder="$t('common.select')">
                <q-popup-edit :model-value="popupDummy" auto-save cover @update:model-value="() => {}">
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
                        :tick-strategy="treeStyle?.showCheckboxes ? 'leaf-filtered' : 'none'"
                        :ticked="tickedKeys"
                        no-nodes-label="no nodes"
                        @update:ticked="onTickedChange"
                    >
                        <template #default-header="{ node, key, expanded }">
                            <div class="tree-node-header row no-wrap items-center full-width">
                                <div :class="['tree-node-label', 'col', { 'tree-node-label--selected': isSelectedLeaf(node), 'tree-node-label--disabled': node.disabled }]" :style="getLabelStyle(node)" @click.stop="onNodeHeaderClick(node, key, expanded)">{{ node.label }}</div>
                                <template v-if="node.children?.length">
                                    <q-btn v-if="!treeStyle?.showCheckboxes" class="tree-node-select-all" flat dense no-caps size="sm" :label="isBranchSelected(node) ? $t('common.clear') : $t('common.selectAll')" @click.stop="toggleBranch(node)" />
                                    <q-menu context-menu separate-close-popup>
                                        <q-list dense>
                                            <q-item v-close-popup clickable @click="selectBranch(node)">
                                                <q-item-section>{{ $t('common.selectAll') }}</q-item-section>
                                            </q-item>
                                            <q-item v-close-popup clickable @click="clearBranch(node)">
                                                <q-item-section>{{ $t('common.clear') }}</q-item-section>
                                            </q-item>
                                        </q-list>
                                    </q-menu>
                                </template>
                            </div>
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
                :tick-strategy="treeStyle?.showCheckboxes ? 'leaf-filtered' : 'none'"
                :ticked="tickedKeys"
                no-nodes-label="no nodes"
                @update:ticked="onTickedChange"
            >
                <template #default-header="{ node, key, expanded }">
                    <div class="tree-node-header row no-wrap items-center full-width">
                        <div :class="['tree-node-label', 'col', { 'tree-node-label--selected': isSelectedLeaf(node), 'tree-node-label--disabled': node.disabled }]" :style="getLabelStyle(node)" @click.stop="onNodeHeaderClick(node, key, expanded)">{{ node.label }}</div>
                        <template v-if="node.children?.length">
                            <q-btn v-if="!treeStyle?.showCheckboxes" class="tree-node-select-all" flat dense no-caps size="sm" :label="isBranchSelected(node) ? $t('common.clear') : $t('common.selectAll')" @click.stop="toggleBranch(node)" />
                            <q-menu context-menu separate-close-popup>
                                <q-list dense>
                                    <q-item v-close-popup clickable @click="selectBranch(node)">
                                        <q-item-section>{{ $t('common.selectAll') }}</q-item-section>
                                    </q-item>
                                    <q-item v-close-popup clickable @click="clearBranch(node)">
                                        <q-item-section>{{ $t('common.clear') }}</q-item-section>
                                    </q-item>
                                </q-list>
                            </q-menu>
                        </template>
                    </div>
                </template>
            </q-tree>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetTreeStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import type { TreeNodeItem } from './TreeSelector.vue'

export default defineComponent({
    name: 'multi-tree-selector',
    props: {
        modelValue: { type: Array as PropType<(string | number)[]>, default: () => [] },
        nodes: { type: Array as PropType<TreeNodeItem[]>, default: () => [] },
        treeStyle: { type: Object as PropType<ISelectorWidgetTreeStyle>, default: () => ({}) }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            filterText: '' as string,
            popupDummy: null as null
        }
    },
    computed: {
        displayValue(): string {
            if (!this.modelValue?.length) return ''
            else return String(this.modelValue)
        },
        treeWrapperStyle(): Record<string, string> {
            const style: Record<string, string> = {}
            if (this.treeStyle?.color) style['--multi-tree-color'] = this.treeStyle.color
            if (this.treeStyle?.controlColor) style['--multi-tree-control-color'] = this.treeStyle.controlColor
            return style
        },
        selectedLabels(): Set<string> {
            return new Set(this.modelValue.map(String))
        },
        leafNodes(): TreeNodeItem[] {
            const leaves = [] as TreeNodeItem[]
            const collect = (nodes: TreeNodeItem[]) => nodes.forEach((node) => (node.children?.length ? collect(node.children) : leaves.push(node)))
            collect(this.nodes)
            return leaves
        },
        tickedKeys(): string[] {
            // The selection is keyed by leaf label, so every leaf with a selected label is ticked
            return this.leafNodes.filter((node) => this.selectedLabels.has(String(node.label))).map((node) => node.__key)
        }
    },
    methods: {
        isSelectedLeaf(node: TreeNodeItem): boolean {
            return !node.children?.length && this.selectedLabels.has(String(node.label))
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
        onNodeHeaderClick(node: TreeNodeItem, key: string, expanded: boolean) {
            if (node.children?.length) {
                ;(this.$refs.tree as any).setExpanded(key, !expanded)
            } else if (!node.disabled) {
                const newValues = this.selectedLabels.has(String(node.label)) ? this.modelValue.filter((v) => String(v) !== String(node.label)) : [...this.modelValue, node.label]
                this.$emit('update:modelValue', newValues)
            }
        },
        getBranchLeafLabels(node: TreeNodeItem): string[] {
            // Same leaves as the Quasar 'leaf-filtered' tick strategy: enabled leaves that match the filter
            const filter = this.filterText?.toLowerCase()
            const labels = [] as string[]
            const collect = (current: TreeNodeItem) => {
                if (current.children?.length) current.children.forEach(collect)
                else if (!current.disabled && (!filter || String(current.label).toLowerCase().includes(filter))) labels.push(String(current.label))
            }
            collect(node)
            return labels
        },
        isBranchSelected(node: TreeNodeItem): boolean {
            const labels = this.getBranchLeafLabels(node)
            return labels.length > 0 && labels.every((label) => this.selectedLabels.has(label))
        },
        selectBranch(node: TreeNodeItem) {
            const labelsToAdd = this.getBranchLeafLabels(node).filter((label) => !this.selectedLabels.has(label))
            if (labelsToAdd.length) this.$emit('update:modelValue', [...this.modelValue, ...new Set(labelsToAdd)])
        },
        clearBranch(node: TreeNodeItem) {
            const labelsToRemove = new Set(this.getBranchLeafLabels(node))
            if (this.modelValue.some((value) => labelsToRemove.has(String(value)))) this.$emit('update:modelValue', this.modelValue.filter((value) => !labelsToRemove.has(String(value))))
        },
        toggleBranch(node: TreeNodeItem) {
            if (this.isBranchSelected(node)) this.clearBranch(node)
            else this.selectBranch(node)
        },
        onTickedChange(keys: string[]) {
            // Compare with the previous ticked keys, so a leaf label that exists under two branches changes only on its own click
            const newKeys = new Set(keys)
            const oldKeys = new Set(this.tickedKeys)
            const addedLabels = new Set<string>()
            const removedLabels = new Set<string>()
            this.leafNodes.forEach((node) => {
                if (newKeys.has(node.__key) && !oldKeys.has(node.__key)) addedLabels.add(String(node.label))
                else if (!newKeys.has(node.__key) && oldKeys.has(node.__key)) removedLabels.add(String(node.label))
            })
            if (!addedLabels.size && !removedLabels.size) return

            const newValues = this.modelValue.filter((value) => !removedLabels.has(String(value)))
            addedLabels.forEach((label) => {
                if (!this.selectedLabels.has(label)) newValues.push(label)
            })
            this.$emit('update:modelValue', newValues)
        }
    }
})
</script>

<style lang="scss" scoped>
.multi-tree-selector {
    :deep(.q-tree__arrow) {
        color: var(--multi-tree-control-color);
    }

    :deep(.q-tree__node-header-content) {
        color: var(--multi-tree-color);
    }
}

// Not nested under .multi-tree-selector: in popup mode the tree is teleported out of it
.tree-node-header:hover .tree-node-select-all {
    opacity: 1;
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

.tree-node-select-all {
    opacity: 0;
    margin-left: 8px;
    transition: opacity 0.15s ease;

    &:focus-visible {
        opacity: 1;
    }

    @media (hover: none) {
        opacity: 1;
    }
}
</style>
