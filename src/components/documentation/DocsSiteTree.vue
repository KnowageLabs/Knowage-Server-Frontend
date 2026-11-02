<template>
    <!-- A node with a page is selectable: a click opens it. A node without a page is not: a click opens or closes it (QTree behavior). -->
    <q-tree class="docs-site-tree" :class="{ 'docs-site-tree--dense': dense }" :nodes="treeNodes" node-key="key" label-key="label" :dense="dense" no-connectors no-selection-unset :selected="activeKey" :expanded="expanded" @update:selected="onSelected" @update:expanded="onExpanded">
        <template #default-header="{ node }">
            <div class="docs-site-tree__row" :class="{ 'docs-site-tree__row--section': node.section, 'docs-site-tree__row--active': node.key === activeKey }">
                <span class="docs-site-tree__label">{{ node.label }}</span>
                <!-- The chevron is on the right (spec 14.3). The QTree arrow on the left is hidden. -->
                <button v-if="node.children.length" type="button" class="docs-site-tree__chevron" :class="{ 'docs-site-tree__chevron--closed': collapsed.has(node.key) }" tabindex="-1" :aria-label="node.label" @click.stop="emit('toggle', node.key)">
                    <q-icon name="expand_more" size="18px" />
                </button>
            </div>
        </template>
    </q-tree>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IDocsSiteNode } from './DocumentationHelper'

// The reader menu (spec 14.3, Sidebar): a QTree with the arrow on the right and a guide line per level.
const props = withDefaults(defineProps<{ nodes: IDocsSiteNode[]; activePath: string; collapsed: Set<string>; dense?: boolean }>(), { dense: false })
const emit = defineEmits<{
    (e: 'select', path: string): void
    (e: 'toggle', key: string): void
}>()

const toTreeNodes = (nodes: IDocsSiteNode[]): any[] => nodes.map((node) => ({ ...node, selectable: !!node.path, children: toTreeNodes(node.children) }))
const treeNodes = computed(() => toTreeNodes(props.nodes))

const byKey = computed(() => {
    const map = new Map<string, IDocsSiteNode>()
    const walk = (nodes: IDocsSiteNode[]) =>
        nodes.forEach((node) => {
            map.set(node.key, node)
            walk(node.children)
        })
    walk(props.nodes)
    return map
})

const activeKey = computed(() => Array.from(byKey.value.values()).find((node) => node.path && node.path === props.activePath)?.key ?? null)
const expanded = computed(() =>
    Array.from(byKey.value.values())
        .filter((node) => node.children.length && !props.collapsed.has(node.key))
        .map((node) => node.key)
)

function onSelected(key: string | null) {
    const path = key ? byKey.value.get(key)?.path : ''
    if (path) emit('select', path)
}

// QTree sends the whole list. The layout keeps the closed nodes, so only the node that changed is reported.
function onExpanded(keys: readonly string[]) {
    const open = new Set(keys)
    const changed = expanded.value.find((key) => !open.has(key)) ?? keys.find((key) => !expanded.value.includes(key))
    if (changed) emit('toggle', changed)
}
</script>

<style lang="scss" scoped>
.docs-site-tree {
    font-size: 14px;

    :deep(.q-tree__node) {
        padding: 0;
    }

    :deep(.q-tree__node-header) {
        margin: 0;
        padding: 0;
        border-radius: 6px;
        outline: none;
    }

    // The hover and focus come from the row, so the active line and the background stay in one place.
    :deep(.q-tree__node-header .q-focus-helper),
    :deep(.q-tree__arrow) {
        display: none;
    }

    :deep(.q-tree__node--child > .q-tree__node-header) {
        padding-left: 0;
    }

    :deep(.q-tree__node-header-content) {
        min-width: 0;
        color: inherit;
    }

    // One guide line per level, 12 px in.
    :deep(.q-tree__children) {
        margin: 0 0 4px 12px;
        padding-left: 4px;
        border-left: 1px solid var(--kn-docs-border);
    }

    :deep(.q-tree__node-header:focus-visible .docs-site-tree__row) {
        color: var(--kn-docs-text);
        background: rgba(0, 0, 0, 0.06);
    }
}

.docs-site-tree__row {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: flex-start;
    gap: 4px;
    min-width: 0;
    min-height: 28px;
    padding: 4px 4px 4px 8px;
    border-radius: 6px;
    color: var(--kn-docs-text-muted);
    line-height: 20px;

    &:hover {
        color: var(--kn-docs-text);
        background: rgba(0, 0, 0, 0.04);
    }
}

.docs-site-tree__row--section {
    color: var(--kn-docs-text);
    font-weight: 600;
}

// The open page: a 2 px line on the guide line (spec D33).
.docs-site-tree__row--active,
.docs-site-tree__row--active:hover {
    color: var(--kn-docs-primary);
    font-weight: 500;
    background: none;

    &::before {
        content: '';
        position: absolute;
        top: 4px;
        bottom: 4px;
        left: -5px;
        width: 2px;
        background: var(--kn-docs-primary);
    }
}

.docs-site-tree__row--section.docs-site-tree__row--active {
    font-weight: 600;
}

// Long labels wrap to 2 lines at most (spec D34).
.docs-site-tree__label {
    flex: 1 1 auto;
    min-width: 0;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow-wrap: anywhere;
}

.docs-site-tree__chevron {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--kn-docs-text-muted);
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.06);
    }
}

.docs-site-tree__chevron--closed {
    transform: rotate(-90deg);
}

.docs-site-tree--dense .docs-site-tree__row {
    min-height: 24px;
    padding-top: 2px;
    padding-bottom: 2px;
}
</style>
