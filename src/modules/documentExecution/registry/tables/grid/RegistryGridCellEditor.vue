<template>
    <!-- Popup posizionato via Teleport per sfuggire all'overflow hidden della cella -->
    <Teleport to="body">
        <div ref="popupRef" class="knr-cell-editor-popup" :style="popupStyle" @mousedown.stop @keydown.esc.prevent="$emit('cancel')">
            <!-- ── Dropdown ──────────────────────────────────────────────── -->
            <q-select
                v-if="cellType === 'dropdown'"
                ref="inputRef"
                v-model="localValue"
                :options="filteredDropdownOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                use-input
                input-debounce="0"
                dense
                outlined
                class="knr-popup-select"
                @popup-show="loadOptions"
                @filter="filterDropdownOptions"
                @update:model-value="onDropdownChange"
                @keydown.enter.prevent="$emit('confirm', localValue)"
                @keydown.tab.prevent="$emit('confirm', localValue)"
            />

            <!-- ── Date ─────────────────────────────────────────────────── -->
            <div v-else-if="col.columnInfo?.type === 'date'" class="knr-date-picker-wrap">
                <input ref="dateInputRef" v-model="localDateString" type="date" class="knr-native-date-input" @change="onNativeDateChange" @keydown.enter.prevent="onNativeDateChange" @keydown.esc.prevent="$emit('cancel')" />
            </div>

            <!-- ── Timestamp ─────────────────────────────────────────────── -->
            <div v-else-if="col.columnInfo?.type === 'timestamp'" class="knr-date-picker-wrap knr-datetime-picker-wrap">
                <input v-model="localNativeDate" type="date" class="knr-native-date-input" @keydown.esc.prevent="$emit('cancel')" />
                <input v-model="localNativeTime" type="time" step="1" class="knr-native-date-input" @keydown.esc.prevent="$emit('cancel')" />
                <q-btn flat dense size="sm" icon="check" color="primary" @click="onNativeDatetimeConfirm" />
            </div>
        </div>
    </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

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
const dateInputRef = ref<HTMLInputElement | null>(null)
const localValue = ref<any>(null)
const localDateString = ref('') // yyyy-MM-dd for <input type="date">
const localNativeDate = ref('') // yyyy-MM-dd for timestamp date part
const localNativeTime = ref('00:00:00') // HH:mm:ss for timestamp time part
const anchorEl = ref<HTMLElement | null>(null)
const popupStyle = ref<Record<string, string>>({})

// ── Cell type ────────────────────────────────────────────────────────────

const cellType = computed(() => {
    if (props.col?.editorType === 'COMBO') return 'dropdown'
    if (props.col?.columnInfo?.type === 'date' || props.col?.columnInfo?.type === 'timestamp') return 'temporal'
    return 'text'
})

// ── Dropdown options ────────────────────────────────────────────────────

interface IRegistryDropdownOption {
    label: string
    value: any
}

const filteredDropdownOptions = ref<IRegistryDropdownOption[]>([])

const dropdownOptions = computed<IRegistryDropdownOption[]>(() => {
    const opts = props.comboColumnOptions
    if (!opts || !props.col?.field) return []
    const fieldOpts = opts[props.col.field]
    if (!fieldOpts) return []
    const depVal = props.col.dependences ? props.row?.[props.col.dependences] : undefined
    const rawOptions = fieldOpts[depVal ?? 'All'] ?? fieldOpts['All'] ?? []
    const uniqueOptions = new Map<string, IRegistryDropdownOption>()

    rawOptions.forEach((option: any) => {
        const value = option?.column_1
        const dedupeKey = `${typeof value}:${value === null ? 'null' : String(value)}`
        if (!uniqueOptions.has(dedupeKey)) {
            uniqueOptions.set(dedupeKey, {
                value,
                label: value === 0 ? '0' : value === null || value === undefined ? '' : String(value)
            })
        }
    })

    return [...uniqueOptions.values()]
})

function ensureSelectedOptionVisible(options: IRegistryDropdownOption[]) {
    if (localValue.value === null || localValue.value === undefined || localValue.value === '') return options

    if (options.some((option) => Object.is(option.value, localValue.value))) return options

    const selectedOption = dropdownOptions.value.find((option) => Object.is(option.value, localValue.value))
    return selectedOption ? [selectedOption, ...options] : options
}

function syncFilteredDropdownOptions() {
    filteredDropdownOptions.value = ensureSelectedOptionVisible([...dropdownOptions.value])
}

function filterDropdownOptions(val: string, update: (callback: () => void) => void) {
    update(() => {
        const needle = val.toLowerCase()
        const filteredOptions = needle
            ? dropdownOptions.value.filter((option) =>
                  option.label
                      .toLowerCase()
                      .includes(needle)
              )
            : [...dropdownOptions.value]

        filteredDropdownOptions.value = ensureSelectedOptionVisible(filteredOptions)
    })
}

function loadOptions() {
    emit('dropdown-change', { action: 'load-options', row: props.row, column: props.col })
}

function onDropdownChange(val: any) {
    emit('dropdown-change', { action: 'value-changed', row: { ...props.row, [props.col.field]: val }, column: props.col })
    nextTick(() => emit('confirm', val))
}

watch(dropdownOptions, syncFilteredDropdownOptions, { immediate: true })

// ── Date helpers ────────────────────────────────────────────────────────

function onNativeDateChange() {
    // value of <input type="date"> is always yyyy-MM-dd (or '' when cleared)
    emit('confirm', localDateString.value || null)
}

function onNativeDatetimeConfirm() {
    if (!localNativeDate.value) return
    emit('confirm', `${localNativeDate.value} ${localNativeTime.value || '00:00:00'}`)
}

// ── Popup positioning ───────────────────────────────────────────────────

function positionPopup() {
    if (!anchorEl.value || !popupRef.value) return
    const rect = anchorEl.value.getBoundingClientRect()
    const popH = popupRef.value.offsetHeight || 320
    const popW = popupRef.value.offsetWidth || 260

    // Use viewport coordinates (position: fixed — no scroll offset needed)
    let top = rect.bottom
    let left = rect.left

    // Avoid vertical overflow
    if (top + popH > window.innerHeight) {
        top = rect.top - popH
    }
    // Avoid horizontal overflow
    if (left + popW > window.innerWidth) {
        left = window.innerWidth - popW - 8
    }

    popupStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`
    }
}

// ── Close popup on outside click ────────────────────────────────────────

function onClickOutside(e: MouseEvent) {
    const target = e.target as Element
    if (popupRef.value && !popupRef.value.contains(target)) {
        // If the click landed inside a Quasar floating popup (the q-select options list
        // is teleported to body inside a .q-menu element) do NOT close: let q-select
        // handle the selection first; onDropdownChange will emit 'confirm' afterwards.
        if (target?.closest?.('.q-menu')) return

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
    syncFilteredDropdownOptions()
    if (props.col?.columnInfo?.type === 'date' && props.value) {
        // Stored format is yyyy-MM-dd; native <input type="date"> also uses yyyy-MM-dd
        localDateString.value = String(props.value).substring(0, 10)
    }
    if (props.col?.columnInfo?.type === 'timestamp' && props.value) {
        // Stored format is "yyyy-MM-dd HH:mm:ss"
        const str = String(props.value).replace('T', ' ')
        const spaceIdx = str.indexOf(' ')
        localNativeDate.value = spaceIdx !== -1 ? str.substring(0, spaceIdx) : str.substring(0, 10)
        localNativeTime.value = spaceIdx !== -1 ? str.substring(spaceIdx + 1, spaceIdx + 9) : '00:00:00'
    }

    nextTick(() => {
        positionPopup()
        // Auto-focus
        if (dateInputRef.value) {
            dateInputRef.value.focus()
        } else if (inputRef.value) {
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
