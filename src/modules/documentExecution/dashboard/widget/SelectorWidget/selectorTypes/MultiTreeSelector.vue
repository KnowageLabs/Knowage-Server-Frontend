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
                        no-nodes-label="no nodes"
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
                no-nodes-label="no nodes"
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
        }
    },
    methods: {
        isSelectedLeaf(node: TreeNodeItem): boolean {
            return !node.children?.length && this.modelValue.map(String).includes(String(node.label))
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
                const current = this.modelValue.map(String)
                const newValues = current.includes(String(node.label)) ? this.modelValue.filter((v) => String(v) !== String(node.label)) : [...this.modelValue, node.label]
                this.$emit('update:modelValue', newValues)
            }
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
