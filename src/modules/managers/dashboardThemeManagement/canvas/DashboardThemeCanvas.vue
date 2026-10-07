<template>
    <div ref="canvasRef" class="kn-canvas theme-canvas" :style="canvasStyle">
        <div class="kn-canvas__dots"></div>

        <div ref="viewportRef" class="kn-canvas__viewport" :class="{ 'kn-canvas__viewport--space-pan': panZoom.isSpacePressed.value }" @pointermove="onPointerMove" @pointerleave="hover = null">
            <div ref="stageRef" class="theme-canvas__stage" :style="{ width: `${CANVAS_SIZE.width}px`, height: `${CANVAS_SIZE.height}px` }">
                <!-- The focused widget sits above this scrim; the rest of the canvas is dimmed. -->
                <div v-if="activeType && dimEnabled" class="theme-canvas__scrim"></div>
                <div v-for="tile in tiles" :key="tile.themeType" class="theme-canvas__tile" :class="tileClass(tile)" :style="tileStyle(tile)" :data-theme-type="tile.themeType">
                    <WidgetRenderer :key="tile.renderKey" :widget="tile.mock.widget" :widget-loading="false" :widget-data="tile.mock.data" :widget-initial-data="tile.mock.initialData" :datasets="NO_DATASETS" :dashboard-id="PREVIEW_DASHBOARD_ID" :selection-is-locked="false" :prop-active-selections="tile.themeType === 'activeSelections' ? MOCK_ACTIVE_SELECTIONS : NO_SELECTIONS" :variables="NO_VARIABLES" />
                </div>
            </div>
        </div>

        <div class="kn-canvas__grain"></div>

        <div class="theme-canvas__overlay">
            <div v-if="hoverChip" class="theme-canvas__hover-chip" :style="{ left: `${hoverChip.x}px`, top: `${hoverChip.y}px` }">
                <span class="theme-canvas__hover-chip-bar"></span>
                {{ $t('managers.dashboardThemeManager.canvas.clickToEdit') }}
            </div>
            <div v-for="menu in variantMenus" :key="menu.themeType" class="theme-canvas__variant-menu" :style="{ left: `${menu.rect.left + menu.rect.width}px`, top: `${menu.rect.top}px` }">
                <q-btn-dropdown dense unelevated no-caps size="sm" color="white" text-color="dark" class="theme-canvas__variant-button" :label="menu.label(menu.current)">
                    <q-list dense>
                        <q-item v-for="variant in menu.variants" :key="variant" v-close-popup clickable :active="variant === menu.current" @click="menu.select(variant)">
                            <q-item-section>{{ menu.label(variant) }}</q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
            </div>
        </div>

        <div class="theme-canvas__floating theme-canvas__floating--top-left">
            <slot name="top-left"></slot>
        </div>
        <div class="theme-canvas__floating theme-canvas__floating--top-right" :style="{ right: `${panelWidth + 12}px` }">
            <slot name="top-right"></slot>
        </div>

        <div class="kn-canvas-controls kn-canvas-controls--vertical theme-canvas__zoom">
            <button class="kn-canvas-controls__button" type="button" :aria-label="$t('managers.dashboardThemeManager.canvas.zoomIn')" @click="panZoom.zoomIn()">
                <q-icon name="add" />
                <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('managers.dashboardThemeManager.canvas.zoomIn') }}</q-tooltip>
            </button>
            <button class="kn-canvas-controls__button" type="button" :aria-label="$t('managers.dashboardThemeManager.canvas.zoomOut')" @click="panZoom.zoomOut()">
                <q-icon name="remove" />
                <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('managers.dashboardThemeManager.canvas.zoomOut') }}</q-tooltip>
            </button>
            <button class="kn-canvas-controls__button" type="button" :aria-label="$t('managers.dashboardThemeManager.canvas.fit')" @click="fit()">
                <q-icon name="fit_screen" />
                <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('managers.dashboardThemeManager.canvas.fit') }}</q-tooltip>
            </button>
            <button data-tour-id="theme-dim" class="kn-canvas-controls__button" :class="{ 'kn-canvas-controls__button--active': dimEnabled }" type="button" :aria-pressed="dimEnabled" :aria-label="$t('managers.dashboardThemeManager.canvas.dimOthers')" @click="toggleDim">
                <q-icon :name="dimEnabled ? 'filter_center_focus' : 'center_focus_weak'" />
                <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('managers.dashboardThemeManager.canvas.dimOthers') }}</q-tooltip>
            </button>
            <button class="kn-canvas-controls__button theme-canvas__zoom-value" type="button" :aria-label="$t('managers.dashboardThemeManager.canvas.resetZoom')" @click="panZoom.zoomTo(1)">
                {{ Math.round(panZoom.scale.value * 100) }}%
                <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('managers.dashboardThemeManager.canvas.resetZoom') }}</q-tooltip>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import WidgetRenderer from '@/modules/documentExecution/dashboard/widget/WidgetRenderer.vue'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { applyStylesToWidget } from '@/modules/documentExecution/dashboard/generalSettings/themes/ThemesHelper'
import { IDashboardTheme } from '../DashboardThememanagement'
import { IEditorWidgetType } from '../DashboardThemeHelper'
import { ACTIVE_SELECTIONS_SECTION_VARIANTS, ACTIVE_SELECTIONS_VARIANTS, CANVAS_LAYOUT, CANVAS_SIZE, createMockWidget, createPreviewDashboard, createSelectorMock, IActiveSelectionsVariant, IMockWidget, ISelectorVariant, MOCK_ACTIVE_SELECTIONS, MOCK_IMAGE_URL, MOCK_MAP_URL, PREVIEW_DASHBOARD_ID, SELECTOR_SECTION_VARIANTS, SELECTOR_VARIANTS } from './DashboardThemeMockWidgets'
import { ICanvasRect, useCanvasPanZoom } from './useCanvasPanZoom'

interface ICanvasTile {
    themeType: IEditorWidgetType
    left: number
    top: number
    width: number
    height: number
    mock: IMockWidget
    renderKey: number
}

const props = defineProps<{
    theme: IDashboardTheme
    panelWidth: number
    selectorVariant: ISelectorVariant
    activeSelectionsVariant: IActiveSelectionsVariant
    // The widget type being edited. It is interactive and the rest of the canvas is dimmed.
    activeType: IEditorWidgetType | null
}>()

const emit = defineEmits<{
    (e: 'select', type: IEditorWidgetType): void
    (e: 'deselect'): void
    (e: 'update:selectorVariant', variant: ISelectorVariant): void
    (e: 'update:activeSelectionsVariant', variant: IActiveSelectionsVariant): void
}>()

const { t } = useI18n()
const store = dashboardStore()

// Constant props: a new [] on every canvas render (each pan and hover) would re-render all the widgets.
const NO_DATASETS = []
const NO_SELECTIONS = []
const NO_VARIABLES = []

// Types whose widget applies the theme only when it renders: they remount on every theme change.
// The discovery widget builds its grid columns from the style once and does not watch the widget.
const REMOUNT_ON_CHANGE: IEditorWidgetType[] = ['pivot', 'discovery']

const canvasRef = ref<HTMLElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)
const hover = ref<{ themeType: IEditorWidgetType; x: number; y: number } | null>(null)

// Dimming the other widgets is a viewer preference, on by default. Storage can be unavailable (private mode).
const DIM_STORAGE_KEY = 'kn-dashboard-theme-canvas-dim'
const dimEnabled = ref(readDimPreference())

function readDimPreference() {
    try {
        return localStorage.getItem(DIM_STORAGE_KEY) !== 'false'
    } catch {
        return true
    }
}

function toggleDim() {
    dimEnabled.value = !dimEnabled.value
    try {
        localStorage.setItem(DIM_STORAGE_KEY, String(dimEnabled.value))
    } catch {
        // The preference only lasts for this visit.
    }
}

store.setDashboard(PREVIEW_DASHBOARD_ID, createPreviewDashboard())

const typeTitle = (type: IEditorWidgetType) => t('managers.dashboardThemeManager.widgetTitle', { type: t(`managers.dashboardThemeManager.widgetNames.${type}`) })

const tiles = reactive<ICanvasTile[]>(
    CANVAS_LAYOUT.map((item) => ({
        ...item,
        mock: item.themeType === 'selector' ? withTitle(createSelectorMock(props.selectorVariant), 'selector') : createMockWidget(item.themeType, typeTitle(item.themeType)),
        renderKey: 0
    }))
)

function withTitle(mock: IMockWidget, type: IEditorWidgetType) {
    if (mock.widget.settings?.style?.title) mock.widget.settings.style.title.text = typeTitle(type)
    mock.widget.id = `${PREVIEW_DASHBOARD_ID}-${type}`
    return mock
}

const panZoom = useCanvasPanZoom(viewportRef, stageRef, {
    minScale: 0.25,
    maxScale: 2,
    getFreeArea: () => {
        const rect = canvasRef.value?.getBoundingClientRect()
        return { left: 0, top: 0, width: Math.max(0, (rect?.width ?? 0) - props.panelWidth), height: rect?.height ?? 0 }
    },
    onClick: onCanvasClick
})

// The dot spacing doubles or halves with the zoom, so the screen spacing stays between 18 and 36 px.
// Without this, zooming out packs the dots into a dense pattern.
const DOT_GAP = 24
const dotStep = computed(() => {
    let step = DOT_GAP * panZoom.scale.value
    while (step < 18) step *= 2
    while (step > 36) step /= 2
    return step
})

const canvasStyle = computed(() => ({
    '--kn-canvas-pan-x': `${panZoom.x.value * panZoom.scale.value}px`,
    '--kn-canvas-pan-y': `${panZoom.y.value * panZoom.scale.value}px`,
    '--kn-canvas-dot-step': `${dotStep.value}px`,
    '--kn-canvas-scale': panZoom.scale.value
}))

function tileStyle(tile: ICanvasTile) {
    const style: Record<string, string> = { left: `${tile.left}px`, top: `${tile.top}px`, width: `${tile.width}px`, height: `${tile.height}px` }
    if (tile.themeType === 'image') style['--theme-canvas-image'] = `url("${MOCK_IMAGE_URL}")`
    if (tile.themeType === 'map') style['--theme-canvas-map'] = `url("${MOCK_MAP_URL}")`
    return style
}

// Widgets ignore the pointer until the user clicks one: a drag over them pans and the wheel zooms.
// The clicked (active) widget is interactive, and a drag on it does not pan.
function tileClass(tile: ICanvasTile) {
    const active = tile.themeType === props.activeType
    return [`theme-canvas__tile--${tile.themeType}`, active ? ['theme-canvas__tile--active', panZoom.EXCLUDE_CLASS] : 'theme-canvas__tile--idle']
}

function tileAt(event: { clientX: number; clientY: number }) {
    const element = document.elementsFromPoint(event.clientX, event.clientY).find((candidate) => (candidate as HTMLElement).dataset?.themeType) as HTMLElement | undefined
    return element ? (element.dataset.themeType as IEditorWidgetType) : null
}

// A label next to the cursor, as on hex.tech, says what a click does.
function onPointerMove(event: PointerEvent) {
    if (panZoom.isPanning.value) {
        hover.value = null
        return
    }
    const themeType = tileAt(event)
    const canvas = canvasRef.value?.getBoundingClientRect()
    hover.value = themeType && canvas ? { themeType, x: event.clientX - canvas.left, y: event.clientY - canvas.top } : null
}

const hoverChip = computed(() => (hover.value && hover.value.themeType !== props.activeType ? { x: hover.value.x + 16, y: hover.value.y + 14 } : null))

function tileRect(type: IEditorWidgetType): ICanvasRect | null {
    const tile = tiles.find((item) => item.themeType === type)
    return tile ? { left: tile.left, top: tile.top, width: tile.width, height: tile.height } : null
}

// A variant is labelled with the theme section that styles it.
function sectionLabel(sectionVariants: Record<string, string>, variant: string) {
    const section = Object.keys(sectionVariants).find((key) => sectionVariants[key] === variant) ?? variant
    return t(`managers.dashboardThemeManager.styleTypes.${section}`)
}

// The focused widget gets a variant menu above its top-right corner, if it has variants. It follows the pan and zoom.
const variantMenus = computed(() => {
    if (panZoom.isPanning.value || !props.activeType) return []
    const menus = [
        { themeType: 'selector' as IEditorWidgetType, variants: SELECTOR_VARIANTS as readonly string[], current: props.selectorVariant as string, label: (variant: string) => sectionLabel(SELECTOR_SECTION_VARIANTS, variant), select: (variant: string) => emit('update:selectorVariant', variant as ISelectorVariant) },
        { themeType: 'activeSelections' as IEditorWidgetType, variants: ACTIVE_SELECTIONS_VARIANTS as readonly string[], current: props.activeSelectionsVariant as string, label: (variant: string) => sectionLabel(ACTIVE_SELECTIONS_SECTION_VARIANTS, variant), select: (variant: string) => emit('update:activeSelectionsVariant', variant as IActiveSelectionsVariant) }
    ]
    return menus
        .filter((menu) => props.activeType === menu.themeType)
        .map((menu) => {
            const rect = tileRect(menu.themeType)
            return rect ? { ...menu, rect: panZoom.toViewportRect(rect) } : null
        })
        .filter((menu) => !!menu)
})

// A click on a widget focuses it. A click on the background or the scrim ends the focus.
function onCanvasClick(event: PointerEvent) {
    if (!viewportRef.value?.contains(event.target as Node)) return
    const themeType = tileAt(event)
    if (themeType) emit('select', themeType)
    else if (props.activeType) emit('deselect')
}

function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !props.activeType) return
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    emit('deselect')
}

// Applies the theme the way a dashboard does, so the preview shows what a dashboard gets.
function applyTheme() {
    tiles.forEach((tile) => {
        const typeConfig = props.theme.config[tile.themeType]
        if (!typeConfig) return
        applyStylesToWidget(tile.mock.widget, props.theme, typeConfig)
        if (tile.mock.widget.type === 'highcharts') emitter.emit('refreshChart', tile.mock.widget)
        if (REMOUNT_ON_CHANGE.includes(tile.themeType)) tile.renderKey++
    })
}

let applyTimer: ReturnType<typeof setTimeout> | null = null
watch(
    () => props.theme.config,
    () => {
        if (applyTimer) clearTimeout(applyTimer)
        applyTimer = setTimeout(applyTheme, 150)
    },
    { deep: true }
)

watch(
    () => props.theme,
    () => applyTheme()
)

watch(
    () => props.selectorVariant,
    (variant) => {
        const tile = tiles.find((item) => item.themeType === 'selector')
        if (!tile) return
        tile.mock = withTitle(createSelectorMock(variant), 'selector')
        applyStylesToWidget(tile.mock.widget, props.theme, props.theme.config.selector)
        tile.renderKey++
    }
)

// The active selections widget reads its display type reactively, so it needs no remount.
watch(
    () => props.activeSelectionsVariant,
    (variant) => {
        const tile = tiles.find((item) => item.themeType === 'activeSelections')
        if (tile) tile.mock.widget.settings.configuration.type = variant
    },
    { immediate: true }
)

applyTheme()

function fit() {
    panZoom.fitToFreeArea(CANVAS_SIZE)
}

onMounted(() => {
    panZoom.ready.then(() => panZoom.fitWidth(CANVAS_SIZE))
    window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown)
    if (applyTimer) clearTimeout(applyTimer)
    store.removeDashboard({ id: PREVIEW_DASHBOARD_ID })
})

defineExpose({ fit })
</script>

<style lang="scss" scoped>
.theme-canvas {
    width: 100%;
    height: 100%;
}

.theme-canvas__stage {
    position: relative;
}

.theme-canvas__tile {
    position: absolute;
    border-radius: 2px;
    transition: box-shadow 0.15s;

    :deep(.widget-container) {
        height: 100%;
    }

    // Until a click, the widget content ignores the pointer: iframes, grids and maps would take every drag and wheel event.
    &--idle :deep(.widget-container) {
        pointer-events: none;
    }

    // The outline keeps a 2px screen width at every zoom.
    &--idle:hover {
        outline: calc(2px / var(--kn-canvas-scale)) solid color-mix(in oklab, var(--kn-canvas-selection-color) 60%, transparent);
        outline-offset: calc(3px / var(--kn-canvas-scale));
    }

    &--active {
        z-index: 6;
        box-shadow: 0 12px 48px -12px rgba(0, 0, 0, 0.55);
    }

    // In a dashboard the map container does not clip (overflow: visible, for the legend), so the tiles ignore the
    // border radius. The canvas map has no legend: clip it, so the frame style shows as it does on other widgets.
    &--map :deep(.widget-container) {
        overflow: hidden !important;
    }

    &--map :deep(.leaflet-container) {
        background-image: var(--theme-canvas-map) !important;
        background-size: cover !important;
        background-position: center !important;
    }

    &--image :deep(#container) {
        background-image: var(--theme-canvas-image) !important;
        background-size: cover !important;
        background-position: center !important;
    }
}

.theme-canvas__overlay {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
}

.theme-canvas__scrim {
    position: absolute;
    // Covers the canvas around the stage too.
    inset: -20000px;
    z-index: 5;
    background-color: rgba(17, 24, 39, 0.45);
    animation: theme-canvas-fade 0.15s ease-out;
}

@keyframes theme-canvas-fade {
    from {
        opacity: 0;
    }
}

.theme-canvas__hover-chip {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px 3px 5px;
    border: 1px solid var(--kn-canvas-control-border-color);
    border-radius: 4px;
    background-color: var(--kn-canvas-control-background-color);
    color: var(--kn-canvas-control-color);
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.2);
}

.theme-canvas__hover-chip-bar {
    width: 3px;
    height: 12px;
    border-radius: 2px;
    background-color: var(--kn-canvas-selection-color);
}

.theme-canvas__variant-menu {
    position: absolute;
    transform: translate(-100%, calc(-100% - 6px));
    pointer-events: auto;
}

.theme-canvas__variant-button {
    border: 1px solid var(--kn-canvas-control-border-color);
}

.theme-canvas__floating {
    position: absolute;
    top: 12px;
    z-index: 4;

    &--top-left {
        left: 12px;
    }
}

.theme-canvas__zoom {
    position: absolute;
    z-index: 4;
    left: 12px;
    bottom: 12px;
}

.theme-canvas__zoom-value {
    font-size: 0.7rem;
}
</style>
