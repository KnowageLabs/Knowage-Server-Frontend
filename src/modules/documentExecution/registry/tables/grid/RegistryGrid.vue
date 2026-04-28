<template>
    <div ref="containerRef" class="knr-container" tabindex="0" @keydown="onKeyDown" @mouseup="stopDrag" @mouseleave="stopDrag">
        <div ref="scrollAreaRef" class="knr-scroll-area" @scroll="onScroll">
            <table class="knr-table">
                <!-- ── HEADER ──────────────────────────────────────────────── -->
                <thead>
                    <tr>
                        <!-- Angolo in alto a sinistra -->
                        <th class="knr-th knr-index-col" @click="selection.selectAll()">
                            <i class="fas fa-table" style="font-size: 10px; opacity: 0.7" />
                        </th>

                        <th v-for="(col, ci) in visibleColumns" :key="col.field" class="knr-th" :class="{ 'knr-col-selected': selection.isColHeaderSelected(ci) }" :style="{ width: columnWidths[ci] + 'px', minWidth: columnWidths[ci] + 'px' }" @click="onHeaderClick(ci, $event)">
                            <div class="knr-th-content">
                                <span class="knr-th-label">{{ col.title ?? col.columnInfo?.header ?? col.field }}</span>
                                <i v-if="sortModel.fieldName === col.field && sortModel.orderType !== 'NONE'" class="knr-sort-icon" :class="sortModel.orderType === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down'" />
                            </div>
                            <div class="knr-resize-handle" @mousedown.stop="startColResize($event, ci)" />
                        </th>
                    </tr>
                </thead>

                <!-- ── BODY ────────────────────────────────────────────────── -->
                <tbody>
                    <tr v-for="(row, ri) in rows" :key="row.uniqueId ?? ri" :class="{ 'knr-row-new': row.isNew }">
                        <!-- Indice riga (sticky sinistra) -->
                        <td class="knr-td knr-index-col" :class="{ 'knr-row-header-selected': selection.isRowHeaderSelected(ri) }" @click.exact="selection.selectEntireRow(ri)" @click.shift="selection.selectEntireRow(ri, true)">
                            {{ ri + 1 }}
                        </td>

                        <!-- Celle dati -->
                        <RegistryGridCell
                            v-for="(col, ci) in visibleColumns"
                            :key="col.field"
                            :row="row"
                            :col="col"
                            :row-index="ri"
                            :col-index="ci"
                            :is-selected="selection.isCellSelected(ri, ci)"
                            :is-anchor="selection.isAnchor(ri, ci)"
                            :is-editing="editing.isEditing(ri, ci)"
                            :edit-value="editing.isEditing(ri, ci) ? editing.editValue.value : undefined"
                            :combo-column-options="comboColumnOptions"
                            @cell-mousedown="onCellMouseDown"
                            @cell-mouseover="onCellMouseOver"
                            @edit-start="onEditStart"
                            @edit-confirm="onEditConfirm"
                            @edit-cancel="onEditCancel"
                            @dropdown-change="onDropdownChange"
                        />
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useGridSelection } from '../../composables/useGridSelection'
import { useGridEditing } from '../../composables/useGridEditing'
import { useGridKeyboard } from '../../composables/useGridKeyboard'
import { useGridClipboard } from '../../composables/useGridClipboard'
import { useGridColumnResize } from '../../composables/useGridColumnResize'
import RegistryGridCell from './RegistryGridCell.vue'
import registryDescriptor from '../../RegistryDescriptor.json'

const props = defineProps<{
    columns: any[]
    rows: any[]
    comboColumnOptions?: any
    sortModel?: { fieldName: string; orderType: string }
    dataLoading?: boolean
    pagination?: any
    keyColumnName?: string
}>()

const emit = defineEmits<{
    (e: 'row-changed', row: any, field?: string): void
    (e: 'row-deleted', rows: any[]): void
    (e: 'page-changed', params: any): void
    (e: 'sorting-changed', sortModel: any): void
    (e: 'dropdown-change', payload: any): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollAreaRef = ref<HTMLElement | null>(null)
const scrollTimeout = ref<any>(null)

// ── Visible columns ──────────────────────────────────────────────────────
const visibleColumns = computed(() => props.columns.filter((c) => c.isVisible !== false))

// ── Composables ───────────────────────────────────────────────────────────
const selection = useGridSelection(
    () => props.rows.length,
    () => visibleColumns.value.length
)

const editing = useGridEditing()

const clipboard = useGridClipboard()

const { columnWidths, initWidths, startColResize } = useGridColumnResize()

const sortModel = computed(() => props.sortModel ?? { fieldName: '', orderType: 'NONE' })

// ── Keyboard handler ────────────────────────────────────────────────────
const { onKeyDown } = useGridKeyboard(
    selection,
    editing,
    clipboard,
    () => props.rows,
    () => visibleColumns.value,
    (row, col) => row[col.field],
    (col) => !!col.isEditable,
    (r, c, value) => applyEditConfirm(r, c, value),
    (r, c) => applyDeleteCell(r, c)
)

// ── Initialize column widths ────────────────────────────────────────────
watch(
    () => props.columns,
    (cols) => {
        if (cols.length) initWidths(visibleColumns.value)
    },
    { immediate: true }
)

// ── Mouse: drag selection ────────────────────────────────────────────────
let isDragging = false

function onCellMouseDown(event: MouseEvent, ri: number, ci: number) {
    // If a cell is already being edited, let the cell handle blur/confirm on its own
    if (editing.isAnyEditing()) {
        return
    }
    isDragging = true
    if (event.shiftKey) {
        selection.extendSelection(ri, ci)
    } else {
        selection.startSelection(ri, ci)
    }
    containerRef.value?.focus({ preventScroll: true })
}

function onCellMouseOver(ri: number, ci: number) {
    if (isDragging) {
        selection.extendSelection(ri, ci)
    }
}

function stopDrag() {
    isDragging = false
}

// ── Header click: sort cycling + column selection ───────────────────────

function onHeaderClick(ci: number, event: MouseEvent) {
    if (event.shiftKey) {
        selection.selectEntireCol(ci, true)
    } else {
        cycleSortModel(visibleColumns.value[ci].field)
        selection.selectEntireCol(ci)
    }
}

function cycleSortModel(fieldName: string) {
    const current = props.sortModel ?? { fieldName: '', orderType: 'NONE' }
    let nextOrder: string
    if (current.fieldName !== fieldName || current.orderType === 'NONE') nextOrder = 'ASC'
    else if (current.orderType === 'ASC') nextOrder = 'DESC'
    else nextOrder = 'NONE'
    emit('sorting-changed', { fieldName: nextOrder === 'NONE' ? '' : fieldName, orderType: nextOrder })
}

// ── Edit lifecycle ───────────────────────────────────────────────────────

function onEditStart(ri: number, ci: number) {
    const col = visibleColumns.value[ci]
    if (!col?.isEditable) return
    const currentVal = props.rows[ri]?.[col.field]
    editing.startEdit(ri, ci, currentVal)
}

function onEditConfirm(ri: number, ci: number, value: any, moveDir?: 'down' | 'right' | 'left') {
    applyEditConfirm(ri, ci, value)
    editing.confirmEdit()

    // Post-confirm navigation
    if (moveDir === 'down') selection.moveFocusTo(ri + 1, ci)
    else if (moveDir === 'right') selection.moveFocusTo(ri, ci + 1)
    else if (moveDir === 'left') selection.moveFocusTo(ri, ci - 1)
    else selection.startSelection(ri, ci)

    nextTick(() => containerRef.value?.focus({ preventScroll: true }))
}

function onEditCancel() {
    const pos = editing.cancelEdit()
    if (pos) selection.startSelection(pos.row, pos.col)
    nextTick(() => containerRef.value?.focus({ preventScroll: true }))
}

function applyEditConfirm(ri: number, ci: number, value: any) {
    const col = visibleColumns.value[ci]
    const row = props.rows[ri]
    if (!col || !row) return

    const oldValue = row[col.field]
    if (oldValue === value) return

    row[col.field] = value
    if (row.isEdited) {
        if (!row.isEdited.includes(col.field)) row.isEdited.push(col.field)
    } else {
        row.isEdited = [col.field]
    }
    emit('row-changed', row, col.field)
}

function applyDeleteCell(ri: number, ci: number) {
    applyEditConfirm(ri, ci, '')
}

// ── Dropdown change (dependent columns) ─────────────────────────────────

function onDropdownChange(payload: any) {
    emit('dropdown-change', payload)
}

// ── Infinite scroll ───────────────────────────────────────────────────────

function onScroll(event: Event) {
    if (scrollTimeout.value) clearTimeout(scrollTimeout.value)
    scrollTimeout.value = setTimeout(() => {
        const el = event.target as HTMLElement
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        if (distanceFromBottom < 50 && props.pagination && !props.pagination.enabled && (props.pagination.size ?? 0) > registryDescriptor.paginationLimit) {
            const pageSize = props.pagination.limit ?? registryDescriptor.paginationNumberOfItems
            const newStart = (props.pagination.start ?? 0) + pageSize
            if (newStart >= (props.pagination.size ?? 0)) return
            emit('page-changed', {
                paginationStart: newStart,
                paginationLimit: pageSize,
                size: props.pagination.size,
                enabled: false
            })
        }
    }, 300)
}

// ── Public API ────────────────────────────────────────────────────────────

function getSelectedRows(): any[] {
    const range = selection.selectionRange.value
    if (!range) return []
    const result: any[] = []
    for (let r = range.rowMin; r <= range.rowMax; r++) {
        if (props.rows[r]) result.push(props.rows[r])
    }
    // De-duplicate (in case an entire column selection produces duplicates)
    return [...new Map(result.map((row) => [row.uniqueId, row])).values()]
}

function clearSelectedRows() {
    selection.clearSelection()
}

defineExpose({ getSelectedRows, clearSelectedRows })
</script>
