<template>
    <q-dialog :model-value="true" persistent @escape-key="emit('close')">
        <q-card class="kip column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('components.knIconPicker.chooseIcon') }}</q-toolbar-title>
                <q-btn flat round dense icon="close" data-test="close-icon-button" @click="emit('close')" />
            </q-toolbar>

            <q-tabs v-if="availableSets.length > 1" v-model="activeSet" dense no-caps align="left" active-color="primary" indicator-color="primary" class="kip__tabs">
                <q-tab v-for="set in availableSets" :key="set" :name="set" :label="setLabel(set)" />
            </q-tabs>

            <div class="kip__filters row items-center no-wrap">
                <q-input v-model="searchWord" outlined dense clearable autofocus debounce="150" class="col" :placeholder="$t('common.search')" data-test="search-input">
                    <template #prepend><q-icon name="search" /></template>
                </q-input>
                <q-btn-toggle v-if="activeSet === 'fontawesome'" v-model="faCategory" dense no-caps unelevated toggle-color="primary" color="grey-3" text-color="grey-8" :options="faCategories" />
            </div>
            <q-separator />

            <div class="col kip__body">
                <q-scroll-area v-if="listItems.length > 0" :ref="setScrollArea" class="fit">
                    <q-virtual-scroll v-if="scrollTarget" :key="activeSet + faCategory + searchWord" :scroll-target="scrollTarget" :items="listItems" :virtual-scroll-item-size="ROW_HEIGHT" class="kip__list">
                        <template #default="{ item }">
                            <div v-if="item.type === 'label'" class="kip__section-label">{{ item.text }}</div>
                            <div v-else class="kip__row" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
                                <button v-for="icon in item.icons" :key="icon.className ?? icon.image" type="button" class="kip__icon" :class="{ 'kip__icon--active': isSelected(icon) }" :title="icon.label" @click="select(icon)" @dblclick="selectAndSave(icon)">
                                    <img v-if="icon.image" :src="icon.image" class="kip__custom-image" />
                                    <q-icon v-else :name="icon.className" size="22px" />
                                </button>
                            </div>
                        </template>
                    </q-virtual-scroll>
                </q-scroll-area>
                <div v-else class="kip__empty column items-center justify-center fit">
                    <q-icon name="search_off" size="2.5rem" color="grey-5" class="q-mb-sm" />
                    <span>{{ $t('common.info.noDataFound') }}</span>
                </div>
            </div>
            <q-separator />

            <div class="kip__footer row items-center no-wrap">
                <div class="kip__preview row items-center no-wrap col">
                    <template v-if="selected">
                        <span class="kip__preview-icon">
                            <img v-if="selected.image" :src="selected.image" class="kip__custom-image" />
                            <q-icon v-else :name="selected.className" size="22px" />
                        </span>
                        <span class="ellipsis q-ml-md">{{ selected.label }}</span>
                    </template>
                    <span v-else class="text-grey-6">{{ $t('components.knIconPicker.noneSelected') }}</span>
                </div>
                <template v-if="enableBase64">
                    <input ref="fileInput" type="file" accept=".ico,.svg,.png,image/*" class="hidden" @change="onFileSelected" />
                    <q-btn flat no-caps icon="upload" :label="$t('components.knIconPicker.upload')" @click="fileInput?.click()" />
                </template>
                <q-btn flat no-caps :label="$t('common.cancel')" data-test="close-button" @click="emit('close')" />
                <q-btn unelevated no-caps color="primary" :label="$t('common.save')" :disable="!selected" data-test="save-button" @click="save" />
            </div>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import mainStore from '@/App.store'
import descriptor from './KnIconPickerDescriptor.json'
import materialSymbolNames from './KnMaterialSymbolsNames.json'
import type { IIcon, IIconSet } from './KnIconPicker.d'

type IPickerIcon = IIcon & { key: string }
type IListItem = { type: 'label'; text: string } | { type: 'icons'; icons: IIcon[] }

const props = withDefaults(defineProps<{ currentIcon?: IIcon | Record<string, any> | string; enableBase64?: boolean; sets?: IIconSet[] }>(), {
    currentIcon: undefined,
    enableBase64: false,
    sets: () => ['material', 'fontawesome']
})
const emit = defineEmits<{
    (e: 'close'): void
    (e: 'save', icon: IIcon): void
}>()

const { t } = useI18n()
const $q = useQuasar()
const store = mainStore()

const RECENT_KEY = 'iconPickerRecentlyUsedIcons'
const MATERIAL_PREFIX = 'sym_o_'
const ROW_HEIGHT = 48

const searchKey = (text: string) => text.toLowerCase().replace(/[_-]+/g, ' ').trim()

// ── Icon sets ─────────────────────────────────────────────

const fontAwesomeIcons: IPickerIcon[] = (descriptor.icons as IIcon[]).map((icon) => ({ ...icon, key: searchKey(icon.label ?? '') }))

const materialIcons: IPickerIcon[] = materialSymbolNames.map((name, index) => {
    const label = name.replace(/_/g, ' ')
    return { id: -1 - index, category: 'material', className: MATERIAL_PREFIX + name, label, key: searchKey(label) }
})

const availableSets = computed(() => props.sets)
const activeSet = ref<IIconSet>(props.sets[0] ?? 'fontawesome')
const faCategory = ref('all')

const faCategories = computed(() => [
    { label: t('components.knIconPicker.all'), value: 'all' },
    { label: t('components.knIconPicker.solid'), value: 'solid' },
    { label: t('components.knIconPicker.regular'), value: 'regular' },
    { label: t('components.knIconPicker.brands'), value: 'brands' }
])

function setLabel(set: IIconSet): string {
    return set === 'material' ? t('components.knIconPicker.materialSymbols') : t('components.knIconPicker.fontAwesome')
}

// ── Search and list ───────────────────────────────────────

const searchWord = ref<string | null>('')

const filteredIcons = computed(() => {
    const term = searchKey(searchWord.value ?? '')
    const source = activeSet.value === 'material' ? materialIcons : fontAwesomeIcons.filter((icon) => faCategory.value === 'all' || icon.category === faCategory.value)
    return term ? source.filter((icon) => icon.key.includes(term)) : source
})

const columns = computed(() => ($q.screen.xs ? 6 : 12))

function chunk(icons: IIcon[]): IListItem[] {
    const rows: IListItem[] = []
    for (let i = 0; i < icons.length; i += columns.value) rows.push({ type: 'icons', icons: icons.slice(i, i + columns.value) })
    return rows
}

// The recently used icons are the first rows of the list, unless the list is being searched.
const listItems = computed<IListItem[]>(() => {
    const items: IListItem[] = []
    const searching = searchKey(searchWord.value ?? '').length > 0
    const recent = recentIcons.value.filter((icon) => (icon.image ? true : icon.className?.startsWith(MATERIAL_PREFIX) ? activeSet.value === 'material' : activeSet.value === 'fontawesome'))
    if (!searching && recent.length > 0 && filteredIcons.value.length > 0) {
        items.push({ type: 'label', text: t('components.knIconPicker.recentlyUsed') }, ...chunk(recent), { type: 'label', text: setLabel(activeSet.value) })
    }
    return [...items, ...chunk(filteredIcons.value)]
})

// The virtual list scrolls inside the Quasar scroll area.
const scrollTarget = ref<Element | undefined>()

function setScrollArea(area: any) {
    scrollTarget.value = area?.getScrollTarget?.()
}

// A different list starts from the top.
watch([activeSet, faCategory, searchWord], () => {
    if (scrollTarget.value) scrollTarget.value.scrollTop = 0
})

// ── Selection ─────────────────────────────────────────────

const selected = ref<IIcon | null>(null)

function isSelected(icon: IIcon): boolean {
    if (!selected.value) return false
    return icon.image ? icon.image === selected.value.image : icon.className === selected.value.className && !selected.value.image
}

function select(icon: IIcon) {
    const { key: _key, ...rest } = icon as IPickerIcon
    selected.value = { ...rest }
}

function selectAndSave(icon: IIcon) {
    select(icon)
    save()
}

// The current icon can be a class name, an image, or an object with a className or an icon.
function resolveCurrentIcon() {
    const current = props.currentIcon
    if (!current) return
    if (typeof current === 'object' && current.image) {
        selected.value = { ...(current as IIcon) }
        return
    }
    const className = typeof current === 'string' ? current : current.className ?? current.icon
    if (!className) return
    if (className.startsWith('data:')) {
        selected.value = { id: -1, category: 'custom', label: 'Custom Image', image: className }
        return
    }
    const fontAwesome = fontAwesomeIcons.find((icon) => icon.className === className)
    if (fontAwesome) {
        select(fontAwesome)
        if (props.sets.includes('fontawesome')) activeSet.value = 'fontawesome'
    } else if (className.startsWith(MATERIAL_PREFIX)) {
        const label = className.slice(MATERIAL_PREFIX.length).replace(/_/g, ' ')
        selected.value = { id: -1, category: 'material', className, label }
        if (props.sets.includes('material')) activeSet.value = 'material'
    }
}

// ── Upload ────────────────────────────────────────────────

const fileInput = ref<HTMLInputElement | null>(null)

function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.ico')) {
        store.setError({ title: t('common.error.incompatibleType'), msg: t('common.error.allowedFileTypes') + ' .ico, .svg, .png' })
        return
    }
    const reader = new FileReader()
    reader.onload = () => {
        selected.value = { id: -1, category: 'custom', label: file.name, image: reader.result as string }
    }
    reader.readAsDataURL(file)
}

// ── Recently used ─────────────────────────────────────────

const recentIcons = ref<IIcon[]>([])

function loadRecentIcons() {
    try {
        const stored: IIcon[] = JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]')
        recentIcons.value = stored.filter((icon) => {
            if (icon.image) return props.enableBase64
            if (icon.className?.startsWith(MATERIAL_PREFIX)) return props.sets.includes('material')
            return props.sets.includes('fontawesome')
        })
    } catch {
        recentIcons.value = []
    }
}

function rememberIcon(icon: IIcon) {
    try {
        const all: IIcon[] = JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? '[]')
        const others = all.filter((item) => (icon.image ? item.image !== icon.image : item.className !== icon.className))
        sessionStorage.setItem(RECENT_KEY, JSON.stringify([icon, ...others].slice(0, 10)))
    } catch {
        // The recently used icons are a convenience only.
    }
}

function save() {
    if (!selected.value) return
    const icon = { ...selected.value }
    rememberIcon(icon)
    emit('save', icon)
}

onMounted(() => {
    resolveCurrentIcon()
    loadRecentIcons()
})
</script>

<style scoped lang="scss">
// One spacing unit for the whole dialog: 16px on every side.
.kip {
    --kip-space: 16px;

    width: 760px;
    max-width: 94vw;
    height: 75vh;
    max-height: 680px;

    &__tabs {
        flex-shrink: 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);

        :deep(.q-tab) {
            padding: 0 var(--kip-space);
        }
    }

    &__filters {
        flex-shrink: 0;
        gap: var(--kip-space);
        padding: var(--kip-space);
    }

    &__body {
        min-height: 0;
    }

    &__list {
        padding: 0 var(--kip-space);
    }

    &__section-label {
        display: flex;
        align-items: flex-end;
        height: 32px;
        padding-bottom: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.54);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    &__row {
        display: grid;
        gap: 4px;
        height: 48px;
    }

    &__icon {
        display: flex;
        justify-content: center;
        align-items: center;
        min-width: 0;
        height: 44px;
        border: 1px solid transparent;
        border-radius: 4px;
        background: transparent;
        color: rgba(0, 0, 0, 0.75);
        cursor: pointer;

        &:hover {
            background: rgba(0, 0, 0, 0.06);
        }

        &--active {
            border-color: var(--q-primary);
            background: rgba(0, 0, 0, 0.06);
            color: var(--q-primary);
        }
    }

    &__custom-image {
        max-width: 26px;
        max-height: 26px;
    }

    &__empty {
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.54);
    }

    &__footer {
        flex-shrink: 0;
        gap: var(--kip-space);
        padding: var(--kip-space);
    }

    &__preview {
        min-width: 0;
        font-size: 0.875rem;
    }

    &__preview-icon {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 36px;
        height: 36px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 4px;
    }
}
</style>
