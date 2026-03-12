<template>
    <!-- Popup posizionato via Teleport per sfuggire all'overflow hidden della cella -->
    <Teleport to="body">
        <div ref="popupRef" class="knr-cell-editor-popup" :style="popupStyle" @mousedown.stop @keydown.esc.prevent="$emit('cancel')">
            <!-- ── Dropdown ──────────────────────────────────────────────── -->
            <q-select v-if="cellType === 'dropdown'" ref="inputRef" v-model="localValue" :options="dropdownOptions" option-value="column_1" option-label="column_1" emit-value map-options use-input fill-input input-debounce="0" dense outlined class="knr-popup-select" @popup-show="loadOptions" @update:model-value="onDropdownChange" @keydown.enter.prevent="$emit('confirm', localValue)" @keydown.tab.prevent="$emit('confirm', localValue)" />

            <!-- ── Date / Timestamp ─────────────────────────────────────── -->
            <q-date v-else-if="col.columnInfo?.type === 'date'" v-model="localDateString" :mask="dateMask" today-btn @update:model-value="onDateChange" />

            <div v-else-if="col.columnInfo?.type === 'timestamp'" class="knr-popup-datetime column q-gutter-xs q-pa-sm">
                <q-date v-model="localDateString" :mask="dateMask" today-btn @update:model-value="syncDateTime" />
                <q-time v-model="localTimeString" with-seconds format24h @update:model-value="syncDateTime" />
                <div class="row justify-end q-mt-xs">
                    <q-btn flat dense size="sm" icon="check" @click="$emit('confirm', combinedDatetime)" />
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { luxonFormatDate, primeVueDate } from '@/helpers/commons/localeHelper'

const props = defineProps<{
    col: any
    row: any
    value: any
    comboColumnOptions?: any
    cellEl?: HTMLElement | null
}>()

const emit = defineEmits<{
    (e: 'confirm', value: any): void
    (e: 'cancel'): void
    (e: 'dropdown-change', payload: any): void
}>()

const popupRef = ref<HTMLElement | null>(null)
const inputRef = ref<any>(null)
const localValue = ref<any>(null)
const localDateString = ref('')
const localTimeString = ref('00:00:00')
const anchorEl = ref<HTMLElement | null>(null)
const popupStyle = ref<Record<string, string>>({})

// ── Cell type ────────────────────────────────────────────────────────────

const cellType = computed(() => {
    if (props.col?.editorType === 'COMBO') return 'dropdown'
    if (props.col?.columnInfo?.type === 'date' || props.col?.columnInfo?.type === 'timestamp') return 'temporal'
    return 'text'
})

// ── Dropdown options ────────────────────────────────────────────────────

const dropdownOptions = computed<any[]>(() => {
    const opts = props.comboColumnOptions
    if (!opts || !props.col?.field) return []
    const fieldOpts = opts[props.col.field]
    if (!fieldOpts) return []
    const depVal = props.col.dependences ? props.row?.[props.col.dependences] : undefined
    return fieldOpts[depVal ?? 'All'] ?? fieldOpts['All'] ?? []
})

function loadOptions() {
    emit('dropdown-change', { action: 'load-options', row: props.row, column: props.col })
}

function onDropdownChange(val: any) {
    emit('dropdown-change', { action: 'value-changed', row: { ...props.row, [props.col.field]: val }, column: props.col })
    nextTick(() => emit('confirm', val))
}

// ── Date helpers ────────────────────────────────────────────────────────

const dateMask = computed(() => props.col?.format || primeVueDate() || 'YYYY/MM/DD')

function onDateChange(val: string) {
    emit('confirm', luxonFormatDate(val, 'yyyy-MM-dd', dateMask.value) || val)
}

function syncDateTime() {
    // does not close: waits for the user to press the confirm button
}

const combinedDatetime = computed(() => {
    if (!localDateString.value) return null
    const dateStr = luxonFormatDate(localDateString.value, 'yyyy-MM-dd', dateMask.value) || localDateString.value
    return `${dateStr} ${localTimeString.value || '00:00:00'}`
})

// ── Popup positioning ───────────────────────────────────────────────────

function positionPopup() {
    if (!anchorEl.value || !popupRef.value) return
    const rect = anchorEl.value.getBoundingClientRect()
    const popH = popupRef.value.offsetHeight || 320
    const popW = popupRef.value.offsetWidth || 200

    let top = rect.bottom + window.scrollY
    let left = rect.left + window.scrollX

    // Avoid vertical overflow
    if (rect.bottom + popH > window.innerHeight) {
        top = rect.top + window.scrollY - popH
    }
    // Avoid horizontal overflow
    if (left + popW > window.innerWidth) {
        left = window.innerWidth - popW - 8
    }

    popupStyle.value = {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`
    }
}

// ── Close popup on outside click ────────────────────────────────────────

function onClickOutside(e: MouseEvent) {
    if (popupRef.value && !popupRef.value.contains(e.target as Node)) {
        if (cellType.value === 'dropdown') emit('confirm', localValue.value)
        else emit('cancel')
    }
}

// ── Lifecycle ────────────────────────────────────────────────────────────

onMounted(() => {
    // Use the td element passed from the parent cell (DOM traversal fails after Teleport to body)
    anchorEl.value = props.cellEl ?? null

    // Initialize local value
    localValue.value = props.value ?? null
    if (props.col?.columnInfo?.type === 'date' && props.value) {
        localDateString.value = luxonFormatDate(props.value, dateMask.value, 'yyyy-MM-dd') || ''
    }
    if (props.col?.columnInfo?.type === 'timestamp' && props.value) {
        const str = String(props.value)
        const parts = str.split(' ')
        localDateString.value = luxonFormatDate(parts[0], dateMask.value, 'yyyy-MM-dd') || ''
        localTimeString.value = parts[1] || '00:00:00'
    }

    nextTick(() => {
        positionPopup()
        // Auto-focus the main input field
        if (inputRef.value) {
            if (typeof inputRef.value.focus === 'function') inputRef.value.focus()
            else if (inputRef.value.$el?.focus) inputRef.value.$el.focus()
        }
    })

    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('resize', positionPopup)
    window.addEventListener('scroll', positionPopup, true)
})

onUnmounted(() => {
    document.removeEventListener('mousedown', onClickOutside)
    window.removeEventListener('resize', positionPopup)
    window.removeEventListener('scroll', positionPopup, true)
})
</script>
