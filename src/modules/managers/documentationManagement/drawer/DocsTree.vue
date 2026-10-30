<template>
    <q-scroll-area class="docs-tree col" data-tour-id="docs-tree">
        <div ref="listEl" class="docs-tree__list" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
            <q-tree v-if="treeNodes.length" :nodes="treeNodes" node-key="id" label-key="label" dense no-connectors no-selection-unset :selected="selectedId" :expanded="expanded" @update:selected="onSelected" @update:expanded="onExpanded">
                <template #default-header="{ node: item }">
                    <div class="docs-row" :class="{ 'docs-row--deleted': item.node.deleted, 'docs-row--menu': menuId === item.id }" :data-row-id="item.id">
                        <span class="docs-row__handle" draggable="true" @dragstart="onDragStart($event, item.id)" @dragend="onDragEnd" @click.stop>
                            <q-icon name="drag_indicator" size="16px" />
                        </span>
                        <span class="docs-row__label ellipsis" :class="[item.letter ? `docs-row__label--${item.letter}` : '', { 'docs-row__label--parent': item.children.length }]">
                            {{ item.label }}
                            <q-tooltip :delay="700" anchor="center right" self="center left">{{ item.label }}</q-tooltip>
                        </span>
                        <q-icon v-if="item.children.length && item.node.file" name="description" size="15px" class="docs-row__icon" />
                        <q-icon v-if="item.node.file === HOME_FILE" name="home" size="15px" class="docs-row__icon">
                            <q-tooltip :delay="500">{{ $t('managers.documentationManagement.tree.startPage') }}</q-tooltip>
                        </q-icon>
                        <q-icon v-if="item.node.roles.length" name="lock" size="15px" class="docs-row__icon">
                            <q-tooltip :delay="500">{{ item.node.roles.join(', ') }}</q-tooltip>
                        </q-icon>
                        <span class="docs-row__actions" @click.stop @keydown.stop>
                            <q-btn v-if="!item.node.deleted" flat round dense size="sm" icon="add" @click="addPageHere(item.id)">
                                <q-tooltip :delay="500">{{ $t('managers.documentationManagement.tree.addPageHere') }}</q-tooltip>
                            </q-btn>
                            <q-btn flat round dense size="sm" icon="more_horiz" :aria-label="$t('managers.documentationManagement.tree.more')" data-tour-id="docs-row-menu">
                                <!-- The row keeps its buttons while the menu is open: the menu is anchored to this button and hides with it. -->
                                <q-menu auto-close anchor="bottom right" self="top right" @show="menuId = item.id" @hide="menuId = null">
                                    <q-list dense style="min-width: 240px">
                                        <template v-if="!item.node.deleted">
                                            <q-item clickable @click="addPageHere(item.id)">
                                                <q-item-section avatar><q-icon name="note_add" size="18px" /></q-item-section>
                                                <q-item-section>{{ $t('managers.documentationManagement.tree.addPageHere') }}</q-item-section>
                                            </q-item>
                                            <q-item clickable @click="openUpload(item.id)">
                                                <q-item-section avatar><q-icon name="upload_file" size="18px" /></q-item-section>
                                                <q-item-section>{{ $t('managers.documentationManagement.tree.uploadHere') }}</q-item-section>
                                            </q-item>
                                            <q-item clickable @click="emit('move', item.id)">
                                                <q-item-section avatar><q-icon name="drive_file_move" size="18px" /></q-item-section>
                                                <q-item-section>{{ $t('managers.documentationManagement.tree.moveTo') }}</q-item-section>
                                            </q-item>
                                            <q-separator />
                                        </template>
                                        <q-item v-if="item.letter" clickable @click="wc.discardNode(item.id)">
                                            <q-item-section avatar><q-icon name="undo" size="18px" /></q-item-section>
                                            <q-item-section>{{ $t('managers.documentationManagement.tree.discard') }}</q-item-section>
                                        </q-item>
                                        <q-item v-if="item.node.deleted" clickable @click="wc.restoreNode(item.id)">
                                            <q-item-section avatar><q-icon name="restore" size="18px" /></q-item-section>
                                            <q-item-section>{{ $t('managers.documentationManagement.restoreItem') }}</q-item-section>
                                        </q-item>
                                        <q-item v-else clickable class="text-negative" @click="confirmDelete(item)">
                                            <q-item-section avatar><q-icon name="delete" size="18px" /></q-item-section>
                                            <q-item-section>{{ $t('managers.documentationManagement.tree.delete') }}</q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-menu>
                            </q-btn>
                        </span>
                        <span class="docs-row__marks">
                            <span v-if="wc.dots.value.has(item.id)" class="docs-row__dot" :title="$t('managers.documentationManagement.legend.dot')" />
                            <DocsLetter :letter="item.letter" />
                        </span>
                    </div>
                </template>
            </q-tree>
            <div v-else class="docs-tree__empty">{{ $t('managers.documentationManagement.tree.empty') }}</div>
            <div class="docs-tree__end" data-end="true" />
            <div ref="lineEl" class="docs-tree__line" />
        </div>
        <input ref="fileInput" type="file" accept=".md,.markdown,text/markdown,text/plain" hidden multiple @change="onFileChosen" />
    </q-scroll-area>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useDocs } from '../useDocsWorkingCopy'
import { ancestorIds, HOME_FILE, subtreeIds } from '../documentationManagementHelpers'
import type { iDocsDropPosition, iDocsLetter, iDocsNode } from '../DocumentationManagement'
import { docsDrag, endDocsDrag, startDocsDrag } from '../docsDrag'
import DocsLetter from './DocsLetter.vue'

interface iTreeItem {
    id: string
    label: string
    node: iDocsNode
    letter: iDocsLetter | ''
    children: iTreeItem[]
}

const props = defineProps<{ selectedId: string | null }>()
const emit = defineEmits<{
    (e: 'select', id: string): void
    (e: 'move', id: string): void
}>()

const wc = useDocs()
const { t } = useI18n()
const $q = useQuasar()

// Collapsed nodes, so a new node starts expanded.
const collapsed = ref<Set<string>>(new Set())
const menuId = ref<string | null>(null)
const listEl = ref<HTMLElement | null>(null)
const lineEl = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let uploadNodeId: string | null = null

const treeNodes = computed<iTreeItem[]>(() => {
    const byParent = new Map<string | null, iDocsNode[]>()
    for (const node of wc.nodes.value) {
        const list = byParent.get(node.parentId) ?? []
        list.push(node)
        byParent.set(node.parentId, list)
    }
    const build = (parentId: string | null): iTreeItem[] =>
        (byParent.get(parentId) ?? []).map((node) => ({
            id: node.id,
            label: node.label || t('managers.documentationManagement.tree.untitled'),
            node,
            letter: wc.letters.value.get(node.id) ?? '',
            children: build(node.id)
        }))
    return build(null)
})

const expanded = computed(() => wc.nodes.value.filter((node) => !collapsed.value.has(node.id)).map((node) => node.id))

function onExpanded(ids: readonly string[]) {
    const open = new Set(ids)
    collapsed.value = new Set(wc.nodes.value.filter((node) => !open.has(node.id)).map((node) => node.id))
}

function expand(id: string) {
    if (!collapsed.value.has(id)) return
    const next = new Set(collapsed.value)
    next.delete(id)
    collapsed.value = next
}

function onSelected(id: string | null) {
    if (id) emit('select', id)
}

// A selected node must be visible.
watch(
    () => props.selectedId,
    async (id) => {
        if (!id) return
        ancestorIds(wc.nodes.value, id).forEach(expand)
        await nextTick()
        listEl.value?.querySelector(`[data-row-id='${id}']`)?.scrollIntoView({ block: 'nearest' })
    }
)

// ── actions ───────────────────────────────────────────────

function addPageHere(parentId: string) {
    expand(parentId)
    const node = wc.addNode(parentId, t('managers.documentationManagement.tree.newPage'), true)
    emit('select', node.id)
}

function confirmDelete(item: iTreeItem) {
    if (!item.children.length) return wc.deleteNode(item.id)
    $q.dialog({ title: t('common.toast.deleteConfirmTitle'), message: t('managers.documentationManagement.tree.deleteWithChildren', { label: item.node.label }), cancel: true, persistent: true }).onOk(() => wc.deleteNode(item.id))
}

function openUpload(id: string) {
    uploadNodeId = id
    fileInput.value?.click()
}

async function onFileChosen(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (!files.length || !uploadNodeId || !wc.nodeById(uploadNodeId)) return
    try {
        await addFiles(uploadNodeId, files)
    } catch (error: any) {
        $q.notify({ type: 'negative', message: error?.message ?? t('common.error.generic') })
    }
}

async function addFiles(parentId: string | null, files: File[]) {
    const pages = await Promise.all(files.filter((file) => /\.(md|markdown)$/i.test(file.name)).map(async (file) => ({ name: file.name, text: await file.text() })))
    if (!pages.length) return
    if (parentId) expand(parentId)
    const created = wc.addPagesFromFiles(parentId, pages)
    emit('select', created[0].id)
}

// ── drag and drop (design-system rules, brainstorm section 7.3) ──
// The q-tree header is the drop target. The row in the header slot carries the node id.

// The target lives in plain variables during dragover: a reactive write per event would re-render the whole tree.
let target: { id: string | null; position: iDocsDropPosition } | null = null
let blocked = new Set<string>()
let draggedEl: HTMLElement | null = null
let insideEl: HTMLElement | null = null

function onDragStart(event: DragEvent, id: string) {
    blocked = new Set(subtreeIds(wc.nodes.value, id))
    const header = (event.currentTarget as HTMLElement).closest('.q-tree__node-header') as HTMLElement
    startDocsDrag(event, { kind: 'node', id }, header)
    // The layout must not change in dragstart: the dimming waits one tick. The q-tree node holds the whole subtree.
    draggedEl = header.closest('.q-tree__node') as HTMLElement
    setTimeout(() => draggedEl?.classList.add('docs-tree__node--dragging'))
}

function onDragEnd() {
    endDocsDrag()
    blocked = new Set()
    clearIndicator()
    draggedEl?.classList.remove('docs-tree__node--dragging')
    draggedEl = null
}

function dragKind(event: DragEvent): 'node' | 'file' | 'files' | null {
    if (docsDrag.payload) return docsDrag.payload.kind
    return event.dataTransfer?.types.includes('Files') ? 'files' : null
}

function clearIndicator() {
    target = null
    if (lineEl.value) lineEl.value.style.display = 'none'
    insideEl?.classList.remove('docs-tree__header--drop-inside')
    insideEl = null
}

function showLine(top: number, left: number) {
    if (!lineEl.value || !listEl.value) return
    lineEl.value.style.display = 'block'
    lineEl.value.style.top = `${top - 1}px`
    lineEl.value.style.left = `${left}px`
    lineEl.value.style.width = `${listEl.value.clientWidth - left}px`
}

function onDragOver(event: DragEvent) {
    const kind = dragKind(event)
    if (!kind || !listEl.value) return
    const header = (event.target as HTMLElement).closest('.q-tree__node-header') as HTMLElement | null
    const rowEl = header?.querySelector('[data-row-id]') as HTMLElement | null
    const endEl = (event.target as HTMLElement).closest('[data-end]')
    let id: string | null = null
    let position: iDocsDropPosition = 'end'

    if (header && rowEl) {
        id = rowEl.dataset.rowId as string
        if (blocked.has(id)) {
            clearIndicator()
            return
        }
        const rect = header.getBoundingClientRect()
        const ratio = (event.clientY - rect.top) / rect.height
        position = kind === 'files' ? 'inside' : ratio < 0.3 ? 'before' : ratio > 0.7 ? 'after' : 'inside'
    } else if (!endEl) {
        return
    } else if (kind === 'files') {
        // Files are dropped on a row. Rejecting here keeps the browser from opening them.
        event.preventDefault()
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'none'
        clearIndicator()
        return
    }

    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = kind === 'files' ? 'copy' : 'move'
    if (target && target.id === id && target.position === position) return
    target = { id, position }

    insideEl?.classList.remove('docs-tree__header--drop-inside')
    insideEl = null
    const listRect = listEl.value.getBoundingClientRect()
    if (!header) {
        const end = listEl.value.querySelector('.docs-tree__end') as HTMLElement
        showLine(end.offsetTop, 4)
    } else if (position === 'inside') {
        if (lineEl.value) lineEl.value.style.display = 'none'
        insideEl = header
        header.classList.add('docs-tree__header--drop-inside')
    } else {
        const rect = header.getBoundingClientRect()
        showLine((position === 'before' ? rect.top : rect.bottom) - listRect.top, rect.left - listRect.left)
    }
}

function onDragLeave(event: DragEvent) {
    if (!listEl.value?.contains(event.relatedTarget as Node | null)) clearIndicator()
}

// Without preventDefault on drop, Firefox types the dragged data into the field under the pointer.
async function onDrop(event: DragEvent) {
    const kind = dragKind(event)
    const current = target
    const payload = docsDrag.payload
    if (!kind) return
    event.preventDefault()
    if (!current) return
    clearIndicator()
    const { id, position } = current
    if (position === 'inside' && id) expand(id)

    if (payload?.kind === 'node') {
        if (!wc.moveTo(payload.id, id, position)) return
        emit('select', payload.id)
    } else if (payload?.kind === 'file') {
        const node = wc.addOrphanToMenu(payload.path, id, position)
        emit('select', node.id)
    } else if (kind === 'files') {
        try {
            await addFiles(id, Array.from(event.dataTransfer?.files ?? []))
        } catch (error: any) {
            $q.notify({ type: 'negative', message: error?.message ?? t('common.error.generic') })
        }
    }
    endDocsDrag()
}
</script>

<style lang="scss" scoped>
.docs-tree__list {
    position: relative;
    min-height: 100%;
    padding: 4px 4px 0;
}

.docs-tree__end {
    height: 32px;
}

.docs-tree__empty {
    padding: 12px;
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.54);
}

.docs-tree__line {
    display: none;
    position: absolute;
    height: 2px;
    background: var(--kn-color-primary);
    pointer-events: none;
    z-index: 1;
}

// Quasar indents a child by 25 px plus the arrow. A narrower step keeps deep trees readable in a 300 px drawer.
:deep(.q-tree__children) {
    padding-left: 12px;
}

:deep(.q-tree__node-header) {
    min-height: 30px;
    margin-top: 0;
    padding: 0 2px;

    &:hover .docs-row__handle,
    &:hover .docs-row__actions {
        visibility: visible;
    }
}

:deep(.q-tree__node-header-content) {
    min-width: 0;
    color: rgba(0, 0, 0, 0.87);
}

:deep(.q-tree__node--selected) {
    background: var(--kn-tree-selected-background-color);

    .q-tree__node-header-content {
        color: rgba(0, 0, 0, 0.87);
    }
}

:deep(.q-tree__arrow) {
    margin-right: 2px;
}

:deep(.docs-tree__header--drop-inside) {
    background: var(--kn-color-selected);
    box-shadow: inset 0 0 0 2px var(--kn-color-primary);
}

:deep(.docs-tree__node--dragging) {
    opacity: 0.4;
}

.docs-row {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 4px;
    min-width: 0;
    height: 30px;
}

.docs-row--deleted .docs-row__label {
    text-decoration: line-through;
}

.docs-row__handle {
    display: inline-flex;
    flex: none;
    margin-left: -2px;
    cursor: grab;
    color: var(--kn-color-default);
    visibility: hidden;
}

.docs-row__label {
    flex: 0 1 auto;
    min-width: 0;
    font-size: 0.875rem;
}

.docs-row__label--parent {
    font-weight: 500;
}

.docs-row__label--U {
    color: var(--kn-docs-change-new);
}

.docs-row__label--M {
    color: var(--kn-docs-change-modified);
}

.docs-row__label--R {
    color: var(--kn-docs-change-renamed);
}

.docs-row__label--D {
    color: var(--kn-docs-change-deleted);
}

.docs-row__icon {
    flex: none;
    color: rgba(0, 0, 0, 0.45);
}

.docs-row__actions {
    display: inline-flex;
    flex: none;
    margin-left: auto;
    visibility: hidden;
}

.docs-row--menu .docs-row__actions,
.docs-row--menu .docs-row__handle {
    visibility: visible;
}

.docs-row__marks {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    min-width: 20px;
    margin-left: auto;
}

.docs-row__actions + .docs-row__marks {
    margin-left: 0;
}

.docs-row__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--kn-docs-change-modified);
}
</style>
