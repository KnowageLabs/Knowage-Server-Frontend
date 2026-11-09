<!-- eslint-disable vue/no-mutating-props -->
<template>
    <div class="sheet-tabs-form">
        <q-select :model-value="sheetTabs.look" :options="lookOptions" emit-value map-options outlined dense :label="$t('dashboard.sheetTabs.look')" data-test="sheet-tabs-look" @update:model-value="onLookChange" />
        <p class="sheet-tabs-form__hint">{{ $t('dashboard.sheetTabs.colorHint') }}</p>

        <q-tabs v-model="part" dense no-caps align="left" :breakpoint="0" active-color="dark" indicator-color="dark" narrow-indicator class="sheet-tabs-form__parts" data-test="sheet-tabs-parts">
            <q-tab name="bar" :label="$t('dashboard.sheetTabs.groups.bar')" :ripple="false" />
            <q-tab name="tabs" :label="$t('dashboard.sheetTabs.groups.tabs')" :ripple="false" />
            <q-tab name="active" :label="$t('dashboard.sheetTabs.groups.activeTab')" :ripple="false" />
        </q-tabs>
        <q-separator />

        <div v-if="part === 'bar'" class="sheet-tabs-form__panel">
            <div class="sheet-tabs-form__colors">
                <SheetTabsColorField :model-value="sheetTabs.background" :look-color="lookColors.background" :label="$t('dashboard.sheetTabs.background')" @update:model-value="setValue('background', $event)" />
                <SheetTabsColorField :model-value="sheetTabs.borderColor" :look-color="lookColors.borderColor" :label="$t('dashboard.sheetTabs.borderColor')" @update:model-value="setValue('borderColor', $event)" />
            </div>
            <div class="sheet-tabs-form__row">
                <span class="sheet-tabs-form__label">{{ $t('dashboard.sheetTabs.height') }}</span>
                <q-btn-toggle :model-value="sheetTabs.height" :options="heightOptions" v-bind="segmented" @update:model-value="setValue('height', $event)" />
            </div>
        </div>

        <div v-else-if="part === 'tabs'" class="sheet-tabs-form__panel">
            <div class="sheet-tabs-form__colors">
                <SheetTabsColorField :model-value="sheetTabs.color" :look-color="lookColors.color" :label="$t('dashboard.sheetTabs.color')" @update:model-value="setValue('color', $event)" />
                <SheetTabsColorField :model-value="sheetTabs.hoverBackground" :look-color="lookColors.hoverBackground" :label="$t('dashboard.sheetTabs.hoverBackground')" @update:model-value="setValue('hoverBackground', $event)" />
            </div>
            <div class="sheet-tabs-form__row">
                <span class="sheet-tabs-form__label">{{ $t('dashboard.sheetTabs.fontSize') }}</span>
                <q-btn-toggle :model-value="sheetTabs.fontSize" :options="fontSizeOptions" v-bind="segmented" @update:model-value="setValue('fontSize', $event)" />
            </div>
            <div class="sheet-tabs-form__row">
                <span class="sheet-tabs-form__label">{{ $t('dashboard.sheetTabs.tabWidth') }}</span>
                <q-btn-toggle :model-value="sheetTabs.tabWidth" :options="tabWidthOptions" v-bind="segmented" @update:model-value="setValue('tabWidth', $event)" />
            </div>
            <q-toggle :model-value="sheetTabs.showIcons" :label="$t('dashboard.sheetTabs.showIcons')" dense class="sheet-tabs-form__toggle" @update:model-value="setValue('showIcons', $event)" />
        </div>

        <div v-else class="sheet-tabs-form__panel">
            <div class="sheet-tabs-form__row">
                <span class="sheet-tabs-form__label">{{ $t('dashboard.sheetTabs.indicator') }}</span>
                <q-btn-toggle :model-value="sheetTabs.indicator" :options="indicatorOptions" v-bind="segmented" @update:model-value="setValue('indicator', $event)" />
            </div>
            <template v-if="sheetTabs.indicator !== 'none'">
                <div class="sheet-tabs-form__row">
                    <span class="sheet-tabs-form__label">{{ $t('dashboard.sheetTabs.indicatorWidth') }}</span>
                    <q-btn-toggle :model-value="sheetTabs.indicatorWidth" :options="indicatorWidthOptions" v-bind="segmented" @update:model-value="setValue('indicatorWidth', $event)" />
                </div>
                <SheetTabsColorField :model-value="sheetTabs.indicatorColor" :look-color="lookColors.indicatorColor" :label="$t('dashboard.sheetTabs.indicatorColor')" @update:model-value="setValue('indicatorColor', $event)" />
            </template>
            <div class="sheet-tabs-form__colors">
                <SheetTabsColorField :model-value="sheetTabs.activeColor" :look-color="lookColors.activeColor" :label="$t('dashboard.sheetTabs.activeColor')" @update:model-value="setValue('activeColor', $event)" />
                <SheetTabsColorField :model-value="sheetTabs.activeBackground" :look-color="lookColors.activeBackground" :label="$t('dashboard.sheetTabs.activeBackground')" @update:model-value="setValue('activeBackground', $event)" />
            </div>
            <q-toggle :model-value="sheetTabs.activeBold" :label="$t('dashboard.sheetTabs.activeBold')" dense class="sheet-tabs-form__toggle" @update:model-value="setValue('activeBold', $event)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IDashboardSheetTabs, IDashboardSheetTabsLook } from '../../Dashboard'
import { getSheetTabsLookColors, setSheetTabsLook, SHEET_TABS_LOOK_IDS, SHEET_TABS_LOOKS } from '../../sheetTabs/SheetTabsHelper'
import SheetTabsColorField from './SheetTabsColorField.vue'

// The sheet tab bar settings: the look, then one tab per part of the bar. General settings and the theme manager use it.
// It edits the object in place and emits `change` only for user input, never on mount.
const props = withDefaults(defineProps<{ sheetTabs: IDashboardSheetTabs; sheetColor?: string }>(), { sheetColor: '' })
const emit = defineEmits<{ (e: 'change'): void }>()
const { t } = useI18n()

const part = ref<'bar' | 'tabs' | 'active'>('bar')
const lookColors = computed(() => getSheetTabsLookColors(props.sheetTabs.look, props.sheetColor))

// One look for every segmented control: the active option is a white chip on a grey track.
const segmented = { 'no-caps': true, unelevated: true, dense: true, 'toggle-color': 'white', 'toggle-text-color': 'dark', 'text-color': 'grey-8', class: 'sheet-tabs-form__segmented' }

const lookOptions = computed(() => SHEET_TABS_LOOK_IDS.map((look) => ({ value: look, label: t(SHEET_TABS_LOOKS[look].labelKey) })))
const heightOptions = computed(() => [
    { value: 32, label: t('dashboard.sheetTabs.heights.compact') },
    { value: 36, label: t('dashboard.sheetTabs.heights.default') },
    { value: 44, label: t('dashboard.sheetTabs.heights.large') }
])
const fontSizeOptions = computed(() => [
    { value: 12, label: t('dashboard.sheetTabs.sizes.small') },
    { value: 13, label: t('dashboard.sheetTabs.sizes.medium') },
    { value: 14, label: t('dashboard.sheetTabs.sizes.large') }
])
const tabWidthOptions = computed(() => [
    { value: 'fit', label: t('dashboard.sheetTabs.tabWidths.fit') },
    { value: 'equal', label: t('dashboard.sheetTabs.tabWidths.equal') }
])
const indicatorOptions = computed(() => [
    { value: 'short', label: t('dashboard.sheetTabs.indicators.short') },
    { value: 'full', label: t('dashboard.sheetTabs.indicators.full') },
    { value: 'none', label: t('dashboard.sheetTabs.indicators.none') }
])
const indicatorWidthOptions = [2, 3, 4].map((value) => ({ value, label: `${value} px` }))

function onLookChange(look: IDashboardSheetTabsLook) {
    setSheetTabsLook(props.sheetTabs, look)
    emit('change')
}

function setValue<K extends keyof IDashboardSheetTabs>(key: K, value: IDashboardSheetTabs[K]) {
    props.sheetTabs[key] = value
    emit('change')
}
</script>

<style lang="scss" scoped>
.sheet-tabs-form__hint {
    margin: 6px 0 14px;
    color: #57606a;
    font-size: 12px;
    line-height: 1.45;
}

.sheet-tabs-form__parts {
    color: #57606a;
    :deep(.q-tab) {
        min-height: 36px;
        padding: 0 12px;
    }
    :deep(.q-tab__label) {
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0;
    }
    // No grey block on the tab after a click; hover still shows it.
    :deep(.q-tab:not(:hover) .q-focus-helper) {
        display: none;
    }
}

.sheet-tabs-form__panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0 4px;
}

.sheet-tabs-form__colors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.sheet-tabs-form__row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.sheet-tabs-form__label {
    flex: 0 0 96px;
    color: #57606a;
    font-size: 13px;
}

.sheet-tabs-form__toggle {
    align-self: flex-start;
    color: #1f2328;
    font-size: 13px;
}

// Segmented control: a grey track, the active option is a raised white chip.
.sheet-tabs-form__segmented {
    padding: 2px;
    border-radius: 7px;
    background: #f1f2f4;
    :deep(.q-btn) {
        min-height: 26px;
        padding: 0 10px;
        border-radius: 5px;
        font-size: 12.5px;
        font-weight: 500;
        white-space: nowrap;
    }
    :deep(.q-btn.bg-white) {
        box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba(0, 0, 0, 0.04);
    }
    :deep(.q-btn:not(.bg-white)) {
        background: transparent;
    }
    :deep(.q-btn + .q-btn) {
        margin-left: 2px;
    }
}
</style>
