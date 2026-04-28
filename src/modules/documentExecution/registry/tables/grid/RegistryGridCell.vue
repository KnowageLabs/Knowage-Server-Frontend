<template>
    <td ref="tdRef" class="knr-td" :class="cellClasses" :style="col.color ? { '--knr-col-color': col.color } : undefined" :title="!isEditing ? displayValue : undefined" @mousedown.left="onMouseDown" @mouseover="$emit('cell-mouseover', rowIndex, colIndex)" @dblclick="onDblClick">
        <!-- ── Vista (non in editing) ──────────────────────────────────── -->
        <template v-if="!isEditing">
            <i v-if="cellType === 'checkbox'" :class="['fas', modelValue ? 'fa-check' : 'fa-times']" style="font-size: 12px" />
            <span v-else class="knr-cell-display">{{ displayValue }}</span>
        </template>

        <!-- ── Editing: input inline per text / number ────────────────── -->
        <template v-else-if="cellType === 'text' || cellType === 'number'">
            <input ref="inputRef" v-model="localValue" class="knr-cell-input" :type="cellType === 'number' ? 'number' : 'text'" :step="cellType === 'number' ? numericStep : undefined" :maxlength="cellType === 'text' ? 250 : undefined" @blur="onInputBlur" @keydown.enter.prevent="confirmAndMove('down')" @keydown.tab.prevent="confirmAndMove('right')" @keydown.shift.tab.prevent="confirmAndMove('left')" @keydown.esc.prevent="$emit('edit-cancel')" />
        </template>

        <!-- ── Editing: checkbox inline ───────────────────────────────── -->
        <template v-else-if="cellType === 'checkbox' && isEditing">
            <q-checkbox v-model="localValue" dense @update:model-value="onCheckboxChange" />
        </template>

        <!-- ── Editing: popup (Dropdown / Calendar) via componente figlio -->
        <template v-else-if="isEditing && (cellType === 'dropdown' || cellType === 'temporal')">
            <RegistryGridCellEditor :col="col" :row="row" :value="localValue" :combo-column-options="comboColumnOptions" :cell-el="tdRef" @confirm="onPopupConfirm" @cancel="$emit('edit-cancel')" @dropdown-change="$emit('dropdown-change', $event)" />
        </template>
    </td>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { setInputDataType, getInputStep, formatRegistryNumber } from '@/helpers/commons/tableHelpers'
import { luxonFormatDate, formatDateWithLocale, localeDate } from '@/helpers/commons/localeHelper'
import RegistryGridCellEditor from './RegistryGridCellEditor.vue'

const props = defineProps<{
    row: any
    col: any
    rowIndex: number
    colIndex: number
    isSelected: boolean
    isAnchor: boolean
    isEditing: boolean
    editValue?: any
    comboColumnOptions?: any
}>()

const emit = defineEmits<{
    (e: 'cell-mousedown', event: MouseEvent, row: number, col: number): void
    (e: 'cell-mouseover', row: number, col: number): void
    (e: 'edit-start', row: number, col: number): void
    (e: 'edit-confirm', row: number, col: number, value: any, moveDir?: 'down' | 'right' | 'left'): void
    (e: 'edit-cancel'): void
    (e: 'dropdown-change', payload: any): void
}>()

const { locale } = useI18n()

const inputRef = ref<HTMLInputElement | null>(null)
const localValue = ref<any>(null)
const tdRef = ref<HTMLElement | null>(null)

// ── Cell type ────────────────────────────────────────────────────────────

const cellType = computed(() => getCellType(props.col))

function getCellType(col: any): string {
    if (!col?.columnInfo) return 'text'
    if (col.editorType === 'TEXT' && col.columnInfo.type === 'boolean') return 'checkbox'
    if (col.editorType === 'COMBO') return 'dropdown'
    if (col.columnInfo.type === 'date' || col.columnInfo.type === 'timestamp') return 'temporal'
    if (setInputDataType(col.columnInfo.type) === 'number') return 'number'
    return 'text'
}

// ── Display value (formatted) ───────────────────────────────────────────

const modelValue = computed(() => props.row?.[props.col?.field])

const displayValue = computed(() => {
    const v = modelValue.value
    if (v === null || v === undefined || v === '') return ''
    const type = props.col?.columnInfo?.type

    if (type === 'date') {
        // localeDate() returns Luxon-compatible tokens (e.g. 'dd/MM/yyyy')
        // Note: primeVueDate() is for PrimeVue calendar inputs only — its 'mm' token means minutes in Luxon
        return luxonFormatDate(v, 'yyyy-MM-dd', String(localeDate())) ?? String(v)
    }
    if (type === 'timestamp') {
        return formatDateWithLocale(v, { dateStyle: 'short', timeStyle: 'medium' }, true) ?? String(v)
    }
    if (['int', 'float', 'decimal', 'long'].includes(type)) {
        const config = formatRegistryNumber(props.col)
        const formatted = Intl.NumberFormat(locale.value, {
            useGrouping: config?.useGrouping,
            minimumFractionDigits: config?.minFractionDigits,
            maximumFractionDigits: config?.maxFractionDigits
        }).format(Number(v))
        return formatted === 'NaN' ? '*' : formatted
    }
    if (type === 'boolean') return v ? '✓' : '✗'

    return String(v)
})

// ── Step for numeric input ───────────────────────────────────────────────

const numericStep = computed(() => getInputStep(props.col?.columnInfo?.type))

// ── CSS classes ──────────────────────────────────────────────────────────

const cellClasses = computed(() => ({
    'knr-selected': props.isSelected && !props.isAnchor,
    'knr-anchor': props.isAnchor,
    'knr-cell-disabled': !props.col?.isEditable,
    'knr-cell-edited': props.row?.isEdited?.includes(props.col?.field),
    'knr-cell-editing': props.isEditing
}))

// ── Sync local value with editValue prop ────────────────────────────────

watch(
    () => props.isEditing,
    (editing) => {
        if (editing) {
            localValue.value = props.editValue !== undefined ? props.editValue : modelValue.value
            if (cellType.value === 'text' || cellType.value === 'number') {
                nextTick(() => {
                    inputRef.value?.focus()
                    inputRef.value?.select()
                })
            }
        }
    }
)

watch(
    () => props.editValue,
    (v) => {
        if (props.isEditing) localValue.value = v
    }
)

// ── Event handlers ───────────────────────────────────────────────────────

function onMouseDown(event: MouseEvent) {
    // Prevent the browser from starting a text selection drag;
    // skip when the cell is being edited so the input stays fully interactive.
    if (!props.isEditing) event.preventDefault()
    emit('cell-mousedown', event, props.rowIndex, props.colIndex)
}

function onDblClick() {
    if (props.col?.isEditable) {
        emit('edit-start', props.rowIndex, props.colIndex)
    }
}

function onInputBlur() {
    // Small delay to avoid interfering with clicks on other elements
    setTimeout(() => {
        if (props.isEditing) {
            emit('edit-confirm', props.rowIndex, props.colIndex, parseLocalValue())
        }
    }, 80)
}

function confirmAndMove(dir: 'down' | 'right' | 'left') {
    emit('edit-confirm', props.rowIndex, props.colIndex, parseLocalValue(), dir)
}

function onCheckboxChange(v: boolean) {
    emit('edit-confirm', props.rowIndex, props.colIndex, v)
}

function onPopupConfirm(value: any) {
    emit('edit-confirm', props.rowIndex, props.colIndex, value)
}

/** Converts the local value to the type expected by the column */
function parseLocalValue(): any {
    const v = localValue.value
    const type = props.col?.columnInfo?.type
    if (type === undefined) return v
    if (['int', 'long'].includes(type)) {
        const n = parseInt(v, 10)
        return isNaN(n) ? v : n
    }
    if (['float', 'decimal'].includes(type)) {
        const n = parseFloat(String(v).replace(',', '.'))
        return isNaN(n) ? v : n
    }
    return v
}
</script>
