<template>
    <q-card flat bordered class="column-list" :class="{ 'column-list--invalid': error }" :style="{ '--column-list-cells': cellsTemplate }">
        <q-card-section v-if="label" class="column-list__header row items-center no-wrap q-py-sm">
            <div class="kn-editor-card-label col">{{ $t(label) }}</div>
            <q-icon v-if="hint" name="help_outline" size="18px" class="kn-editor-card-hint">
                <q-tooltip anchor="center left" self="center right" max-width="300px">{{ $t(hint) }}</q-tooltip>
            </q-icon>
        </q-card-section>
        <q-separator v-if="label" />
        <div ref="body" class="column-list__body" @drop.stop.prevent="onListDrop" @dragover.prevent @dragenter="listEnterCount++" @dragleave="listEnterCount--">
            <div v-if="rows.length > 0 && $slots.header" class="column-list__row column-list__row--header">
                <div class="column-list__cell"></div>
                <div v-if="showTypeIcon" class="column-list__cell"></div>
                <div class="column-list__cells">
                    <slot name="header"></slot>
                </div>
                <div class="column-list__actions"></div>
            </div>
            <div v-for="(row, index) in rows" :key="row[rowKey] ?? index" class="column-list__item" :class="[getRowClass?.(row), { 'column-list__item--last': index === rows.length - 1 }]">
                <div class="column-list__row" :draggable="armedIndex === index" @dragstart="onRowDragStart($event, index)" @dragend="resetReorder" @dragover="onRowDragOver($event, index)" @drop="onRowDrop($event)">
                    <div v-if="reorderEnabled" class="column-list__cell column-list__handle" data-test="reorder-handle" @pointerdown="armHandle(index)" @mouseenter="emit('handleHover', row)" @mouseleave="emit('handleHover', null)">
                        <q-icon name="drag_indicator" size="18px" />
                    </div>
                    <div v-else class="column-list__cell"></div>
                    <div v-if="showTypeIcon" class="column-list__cell column-list__type">
                        <q-icon :name="row.fieldType === 'ATTRIBUTE' ? 'fas fa-font' : 'fas fa-hashtag'" size="13px" />
                    </div>
                    <div class="column-list__cells">
                        <slot name="cells" :row="row" :index="index"></slot>
                    </div>
                    <div class="column-list__actions">
                        <slot name="actions" :row="row" :index="index"></slot>
                        <q-btn flat round dense size="sm" icon="settings" :class="{ 'column-list__cog--open': isExpanded(row, index) }" data-test="expand-button" @click.stop="toggleExpanded(row, index)">
                            <q-tooltip :delay="500">{{ $t('common.settings') }}</q-tooltip>
                        </q-btn>
                        <slot name="trailing" :row="row" :index="index"></slot>
                    </div>
                </div>
                <q-slide-transition>
                    <div v-if="isExpanded(row, index)" class="column-list__expansion">
                        <slot name="expansion" :row="row" :index="index"></slot>
                    </div>
                </q-slide-transition>
            </div>
            <!-- Reorder indicator: positioned directly in the DOM, so a drag causes no re-render -->
            <div ref="indicator" class="column-list__indicator"></div>
            <!-- Empty table: the drop area is part of the layout, so it shows before the drag starts -->
            <div v-if="rows.length === 0 && (dropActive || emptyHint)" class="kn-dropzone kn-dropzone--area column-list__area" :class="{ 'kn-dropzone-visible': dropActive, 'kn-dropzone-active': dropActive && listHovered }" data-test="column-drop-area">
                <q-icon name="add_circle_outline" size="18px" />
                <span>{{ $t(emptyHint ?? 'dashboard.widgetEditor.dragColumnsHint') }}</span>
            </div>
            <!-- Table with rows: an overlay, so nothing moves while the user aims; it lets the pointer through -->
            <div v-else-if="dropActive" class="kn-dropzone kn-dropzone--area column-list__overlay" :class="{ 'kn-dropzone-active': listHovered }" data-test="column-drop-area">
                <q-icon name="add_circle_outline" size="18px" />
                <span>{{ $t(emptyHint ?? 'dashboard.widgetEditor.dragColumnsHint') }}</span>
            </div>
        </div>
    </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const ROW_DATA_TYPE = 'application/x-kn-row'

const props = withDefaults(
    defineProps<{
        rows: any[]
        rowKey?: string
        label?: string
        hint?: string
        error?: boolean
        dropActive?: boolean
        emptyHint?: string | null
        reorderEnabled?: boolean
        showTypeIcon?: boolean
        // grid-template-columns of the cells, shared by the header row and the rows so that they line up
        cellsTemplate?: string
        getRowClass?: (row: any) => string
    }>(),
    { rowKey: 'id', label: undefined, hint: undefined, error: false, dropActive: false, emptyHint: null, reorderEnabled: false, showTypeIcon: true, cellsTemplate: 'minmax(0, 1fr)', getRowClass: undefined }
)

const emit = defineEmits<{
    (e: 'columnDrop', event: DragEvent): void
    (e: 'rowReorder', event: { dragIndex: number; dropIndex: number; value: any[] }): void
    (e: 'handleHover', row: any | null): void
}>()

// Each list gets its own id, so a row dropped on another list never reorders this one.
const listId = crypto.randomUUID()
const body = ref<HTMLElement | null>(null)
const indicator = ref<HTMLElement | null>(null)
const expandedKeys = ref(new Set<string | number>())
const armedIndex = ref<number | null>(null)

// Drag state is not reactive: dragover fires every few milliseconds, and a reactive write there re-renders all the rows
let dragIndex: number | null = null
let dropTarget: { index: number; after: boolean } | null = null

// dragenter/dragleave fire for every child element: count them, the template only reads the boolean
const listEnterCount = ref(0)
const listHovered = computed(() => listEnterCount.value > 0)

watch(
    () => props.dropActive,
    () => (listEnterCount.value = 0)
)

function getKey(row: any, index: number): string | number {
    return row[props.rowKey] ?? index
}

function isExpanded(row: any, index: number): boolean {
    return expandedKeys.value.has(getKey(row, index))
}

function toggleExpanded(row: any, index: number) {
    const key = getKey(row, index)
    const keys = new Set(expandedKeys.value)
    keys.has(key) ? keys.delete(key) : keys.add(key)
    expandedKeys.value = keys
}

function armHandle(index: number) {
    armedIndex.value = index
    // A click on the handle without a drag must not leave the row draggable
    window.addEventListener('pointerup', () => (armedIndex.value = dragIndex === null ? null : armedIndex.value), { once: true })
}

function isOwnRowDrag(event: DragEvent): boolean {
    return dragIndex !== null && !!event.dataTransfer?.types.includes(ROW_DATA_TYPE)
}

function onRowDragStart(event: DragEvent, index: number) {
    // Only the handle arms the row; a drag that starts in an input or a form must not move the row.
    if (armedIndex.value !== index || !event.dataTransfer) {
        event.preventDefault()
        return
    }
    event.dataTransfer.setData(ROW_DATA_TYPE, JSON.stringify({ listId, index }))
    event.dataTransfer.effectAllowed = 'move'
    dragIndex = index
}

function onRowDragOver(event: DragEvent, index: number) {
    if (!isOwnRowDrag(event)) return
    event.preventDefault()
    const rowRect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const after = event.clientY > rowRect.top + rowRect.height / 2
    if (dropTarget?.index === index && dropTarget.after === after) return
    dropTarget = { index, after }
    showIndicator(event.currentTarget as HTMLElement, after)
}

function showIndicator(rowElement: HTMLElement, after: boolean) {
    if (!indicator.value || !body.value) return
    const itemElement = rowElement.parentElement as HTMLElement
    const bodyTop = body.value.getBoundingClientRect().top
    const itemRect = itemElement.getBoundingClientRect()
    indicator.value.style.top = `${(after ? itemRect.bottom : itemRect.top) - bodyTop - 1}px`
    indicator.value.style.display = 'block'
}

function onRowDrop(event: DragEvent) {
    if (!isOwnRowDrag(event) || !dropTarget) return
    event.preventDefault()
    event.stopPropagation()
    const data = JSON.parse(event.dataTransfer?.getData(ROW_DATA_TYPE) || '{}')
    const target = dropTarget
    resetReorder()
    if (data.listId !== listId) return

    const from = data.index as number
    let to = target.after ? target.index + 1 : target.index
    if (from < to) to--
    if (from === to) return

    // Same payload as the PrimeVue DataTable row-reorder event: value[dropIndex] is the moved row.
    const value = [...props.rows]
    const [moved] = value.splice(from, 1)
    value.splice(to, 0, moved)
    emit('rowReorder', { dragIndex: from, dropIndex: to, value })
}

function onListDrop(event: DragEvent) {
    const rowDrag = !!event.dataTransfer?.types.includes(ROW_DATA_TYPE)
    resetReorder()
    if (rowDrag) return
    emit('columnDrop', event)
}

function resetReorder() {
    armedIndex.value = null
    dragIndex = null
    dropTarget = null
    listEnterCount.value = 0
    if (indicator.value) indicator.value.style.display = 'none'
}
</script>

<style lang="scss" scoped>
.column-list {
    border-radius: 4px;

    &--invalid {
        border-color: var(--kn-color-error);
    }
}

.column-list__body {
    position: relative;
    min-height: 48px;
}

.column-list__item:not(.column-list__item--last) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.column-list__row {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 6px 4px;

    &:not(.column-list__row--header):hover {
        background-color: var(--kn-editor-list-hover-background);
    }

    &--header {
        min-height: 0;
        padding-top: 8px;
        padding-bottom: 0;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #9e9e9e;
    }
}

.column-list__cell {
    flex: 0 0 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--kn-editor-list-icon-color);
}

.column-list__handle {
    cursor: grab;
}

.column-list__cells {
    flex: 1;
    min-width: 0;
    margin-left: 6px;
    display: grid;
    grid-template-columns: var(--column-list-cells);
    gap: 8px;
    align-items: center;
}

// White fields, so the row hover does not make them look disabled
.column-list__cells :deep(.q-field--outlined .q-field__control) {
    background-color: #fff;
}

// Fixed width (sort or edit + settings + delete), so the cells of all rows line up under the header
.column-list__actions {
    flex: 0 0 104px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-left: 8px;
    color: rgba(0, 0, 0, 0.38);
    transition: color 0.15s;
}

.column-list__row:hover .column-list__actions {
    color: rgba(0, 0, 0, 0.7);
}

.column-list__cog--open {
    color: var(--q-primary);
}

.column-list__indicator {
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--kn-color-primary);
    pointer-events: none;
    z-index: 3;
}

.column-list__area {
    width: auto;
    margin: 8px;
}

.column-list__overlay {
    position: absolute;
    inset: 4px;
    z-index: 2;
    width: auto;
    pointer-events: none;
    background-color: rgba(255, 255, 255, 0.88);

    &.kn-dropzone-active {
        background-color: color-mix(in srgb, var(--kn-dropzone-active-background) 85%, transparent);
    }
}

.column-list__expansion {
    padding: 12px;
    background-color: var(--kn-editor-column-expansion-background);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: inset 3px 0 0 0 var(--kn-color-borders);

    // Fields stay white on the grey panel
    :deep(.q-field--outlined .q-field__control) {
        background-color: #fff;
    }
}

// Dynamic column groups (table widget)
.dynamic-col-row .column-list__row {
    box-shadow: inset 3px 0 0 0 var(--kn-color-fab);
}

.dynamic-col-row--active .column-list__row {
    background-color: var(--kn-editor-list-hover-background);
    box-shadow:
        inset 3px 0 0 0 var(--kn-color-fab),
        inset 0 0 0 1px var(--kn-color-fab);
}

// Selector description columns: driven by another column, no actions
.col-is-descriptor .column-list__row {
    background-color: var(--kn-editor-list-hover-background);
    box-shadow: inset 3px 0 0 0 var(--kn-color-fab);

    .column-list__actions {
        visibility: hidden;
        pointer-events: none;
    }
}
</style>
