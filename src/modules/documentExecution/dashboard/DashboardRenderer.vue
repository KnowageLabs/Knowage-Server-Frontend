<template>
    <KnDashboardTabsPanel v-if="dashboardModel.sheets" v-model:sheets="dashboardModel.sheets" :active-dashboard-sheet="activeDashboardSheet" :current-screen-size="currentScreenSize" class="test" label-position="bottom" :edit="canEditDashboard(document)" :tabs-style="sheetTabsStyle" @sheet-change="sheetChange($event)" @sheetDeleted="onSheetDeleted" @sheet-cloned="onSheetCloned">
        <div v-if="dashboardCssImportsTag" class="dashboard-css-imports" v-html="dashboardCssImportsTag" />
        <div v-if="dashboardCssTag" class="dashboard-css" v-html="dashboardCssTag" />
        <div v-if="activeDashboardSheet" ref="sheetContainer" class="sheet-container" :class="{ 'sheet-container--preview': previewSize }" :style="[backgroundStyle, previewSheetStyle]">
            <GridLayout v-model:layout="activeDashboardSheet.widgets[currentScreenSize]" :responsive-layouts="activeDashboardSheet.widgets" :responsive="true" :cols="colSizes" :row-height="30" :is-draggable="canEditDashboard(document)" :is-resizable="canEditDashboard(document)" :vertical-compact="false" :use-css-transforms="false" :margin="[0, 0]" :style="getGridStyle" @breakpoint-changed="breakpointChangedEvent">
                <WidgetController v-for="item in activeDashboardSheet.widgets[currentScreenSize]" :key="item.i" data-tour-id="dashboard-widget" :active-sheet="activeDashboardSheet" :document="document" :widget="currentWidget(item.id)" :item="item" :datasets="datasets" :dashboard-id="dashboardId" :variables="variables" :model="model"></WidgetController>
                <div v-if="canEditDashboard(document) && newDashboard" class="emptyDashboardWizard">
                    <div v-if="dashboardModel?.configuration?.datasets.length === 0" class="dashboardWizardContainer" data-test="new-button" @click="addDataset">
                        <img :src="getImageSource('images/dashboard/common/databaseWizardDashboard.svg')" />
                        <span>{{ $t('dashboard.wizard.addDataset') }}</span>
                    </div>
                    <div v-if="activeDashboardSheet.widgets?.lg?.length === 0" class="dashboardWizardContainer" data-test="new-button" data-widget-picker-trigger @click="addWidget">
                        <img :src="getImageSource('images/dashboard/common/widgetWizardDashboard.svg')" />
                        <span>{{ $t('dashboard.wizard.addWidget') }}</span>
                    </div>
                </div>
            </GridLayout>
            <img v-if="configurations?.['KNOWAGE.WATERMARK']" :src="poweredBy" class="powered" />
        </div>
        <template #end>
            <q-btn v-if="canEditDashboard(document)" flat dense no-caps class="kn-sheet-tabs__button dashboard-screen-size" :class="{ 'dashboard-screen-size--preview': previewSize }" data-test="screen-size-button">
                <q-icon :name="getCurrentScreenSizeIcon" size="16px" />
                <span class="text-uppercase">{{ currentScreenSize }}</span>
                <span v-if="previewSize" class="dashboard-screen-size__width">{{ previewSizeText }}</span>
                <q-tooltip v-if="!screenSizeMenuOpen" anchor="top middle" self="bottom middle" :delay="300">{{ previewSize ? $t('dashboard.screenSize.previewing', { size: previewSizeText }) : $t(`dashboard.breakpoints.${currentScreenSize}`) }}</q-tooltip>
                <q-menu v-model="screenSizeMenuOpen" class="kn-toolbar-menu" anchor="top right" self="bottom right" :offset="[0, 4]" @before-show="onMenuShow">
                    <div class="kn-toolbar-menu__list" data-test="screen-size-menu">
                        <q-item-label header class="dashboard-screen-size__header">{{ $t('dashboard.screenSize.title') }}</q-item-label>
                        <MainMenuPopupRow icon="sym_o_fit_screen" :label="$t('dashboard.screenSize.fitWindow')" :checked="!previewSize" @activate="setPreviewSize(null)" />
                        <div v-for="size in breakpointSizes" :key="size.breakpoint">
                            <MainMenuPopupRow :icon="size.icon" :label="$t(size.labelKey)" :meta="`${size.width} px · ${size.breakpoint.toUpperCase()}`" :checked="previewSize?.mode === 'breakpoint' && previewSize.breakpoint === size.breakpoint" :disabled="!size.fits" @activate="setPreviewSize({ mode: 'breakpoint', breakpoint: size.breakpoint, width: size.width, height: null })" />
                            <q-tooltip v-if="!size.fits" anchor="center left" self="center right">{{ $t('dashboard.screenSize.tooWide', { width: size.width }) }}</q-tooltip>
                        </div>
                        <q-separator class="q-my-xs" />
                        <div data-test="screen-size-custom">
                            <MainMenuPopupRow icon="sym_o_aspect_ratio" :label="$t('dashboard.screenSize.custom')" :meta="previewSize?.mode === 'custom' ? previewSizeText : ''" :active="previewSize?.mode === 'custom'" trailing-icon="chevron_left" />
                            <q-menu class="kn-toolbar-menu" anchor="top left" self="top right" :offset="[6, 0]" @before-show="onMenuShow">
                                <div class="dashboard-screen-size__custom" @keydown.enter.prevent="applyCustomSize">
                                    <div class="dashboard-screen-size__custom-fields">
                                        <input v-model.number="customWidth" type="text" inputmode="numeric" class="dashboard-screen-size__custom-input" :class="{ 'dashboard-screen-size__custom-input--invalid': !!customError }" :placeholder="$t('dashboard.screenSize.width')" data-test="screen-size-width" />
                                        <span class="dashboard-screen-size__custom-x">×</span>
                                        <input v-model.number="customHeight" type="text" inputmode="numeric" class="dashboard-screen-size__custom-input" :class="{ 'dashboard-screen-size__custom-input--invalid': !!customError }" :placeholder="$t('dashboard.screenSize.height')" data-test="screen-size-height" />
                                    </div>
                                    <div class="dashboard-screen-size__custom-footer">
                                        <span class="dashboard-screen-size__custom-hint" :class="{ 'dashboard-screen-size__custom-hint--error': !!customError }">{{ customError || $t('dashboard.screenSize.customBreakpoint', { breakpoint: customBreakpoint.toUpperCase() }) }}</span>
                                        <q-btn unelevated dense no-caps color="primary" class="dashboard-screen-size__apply" :disable="!!customError" :label="$t('common.apply')" data-test="screen-size-apply" @click="applyCustomSize" />
                                    </div>
                                </div>
                            </q-menu>
                        </div>
                    </div>
                </q-menu>
            </q-btn>
        </template>
    </KnDashboardTabsPanel>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of creating the dashboard visualizazion, specifically to manage responsive structure and sheets.
 */
import { computed, defineComponent, PropType } from 'vue'
import { IBackground, IDashboardSheet, IDataset, IVariable, IWidgetSheetItem } from './Dashboard'
import { canEditDashboard, cloneSheet, normalizeDashboardSheetLayouts } from './DashboardHelpers'
import { mapActions, mapState } from 'pinia'
import { emitter } from './DashboardHelpers'
import WidgetController from './widget/WidgetController.vue'
import KnDashboardTabsPanel from '@/components/UI/KnDashboardTabs/KnDashboardTabsPanel.vue'
import dashboardStore from './Dashboard.store'
import mainStore from '@/App.store'
import poweredBy from '/images/commons/knowage_poweredby.svg'
import { splitDashboardCssForContainer } from './helpers/common/DashboardCssHelper'
import { getSheetBackgroundStyle } from './generalSettings/background/DashboardBackgroundHelper'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import { screenSizeFromWidth } from './widget/SelectorWidget/SelectorWidgetLayoutHelper'
import { getSheetTabsStyle, ISheetTabsStyle } from './sheetTabs/SheetTabsHelper'

// The sheet widths that give each dashboard breakpoint (the lower edge of its range in grid-layout-plus).
const BREAKPOINT_PREVIEWS = [
    { breakpoint: 'lg', width: 1200, labelKey: 'dashboard.screenSize.desktop', icon: 'sym_o_desktop_windows' },
    { breakpoint: 'md', width: 996, labelKey: 'dashboard.screenSize.laptop', icon: 'sym_o_laptop' },
    { breakpoint: 'sm', width: 768, labelKey: 'dashboard.screenSize.tablet', icon: 'sym_o_tablet' }
]
const MIN_PREVIEW_SIZE = 200
const CUSTOM_PREVIEW_STORAGE_KEY = 'knowage.dashboard.customPreviewSize'

// A null height keeps the height of the window.
interface IPreviewSize {
    mode: 'breakpoint' | 'custom'
    breakpoint?: string
    width: number
    height: number | null
}

const loadCustomPreviewSize = (): { width: number | null; height: number | null } => {
    try {
        const saved = JSON.parse(localStorage.getItem(CUSTOM_PREVIEW_STORAGE_KEY) ?? 'null')
        const width = Number(saved?.width)
        const height = Number(saved?.height)
        return { width: width >= MIN_PREVIEW_SIZE ? width : null, height: height >= MIN_PREVIEW_SIZE ? height : null }
    } catch {
        return { width: null, height: null }
    }
}

export default defineComponent({
    name: 'dashboard-manager',
    components: { KnDashboardTabsPanel, WidgetController, MainMenuPopupRow },
    provide() {
        // the multi-column selector arranges its columns per dashboard breakpoint
        return { dashboardScreenSize: computed(() => this.currentScreenSize) }
    },
    props: {
        model: { type: Object },
        document: { type: Object },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        dashboardId: { type: String, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        disableImports: { type: Boolean, default: false }
    },
    emits: ['sheetDeleted'],
    data() {
        return {
            dashboardModel: {} as any,
            colSizes: { lg: 100, md: 100, sm: 50, xs: 20, xxs: 10 } as any,
            startingBreakpoint: '' as string,
            activeDashboardSheet: null as IDashboardSheet | null,
            currentScreenSize: 'lg',
            poweredBy: poweredBy as string,
            canEditDashboard,
            previewSize: null as IPreviewSize | null,
            screenSizeMenuOpen: false,
            availableWidth: 0,
            availableHeight: 0,
            MIN_PREVIEW_SIZE,
            customWidth: null as number | null,
            customHeight: null as number | null
        }
    },
    computed: {
        ...mapState(dashboardStore, {
            dashboard: 'dashboards',
            selectedSheetIndex: 'selectedSheetIndex'
        }),
        ...mapState(mainStore, ['configurations']),
        newDashboard(): boolean {
            return this.$router.currentRoute.value.name === 'new-dashboard'
        },
        // The sheet tab bar: its own settings, or the default look. The "blend" look takes the sheet color.
        sheetTabsStyle(): ISheetTabsStyle {
            return getSheetTabsStyle(this.dashboardModel?.configuration?.sheetTabs, this.dashboardModel?.configuration?.background?.sheetsBackgroundColor ?? '')
        },
        backgroundStyle(): any {
            if (!this.dashboardModel.configuration) return ''
            return getSheetBackgroundStyle(this.dashboardModel.configuration.background as IBackground)
        },
        dashboardCssParts(): { imports: string; scopedCss: string } {
            return splitDashboardCssForContainer(this.dashboardModel?.configuration?.cssToRender ?? '', this.dashboardCssScopeSelector)
        },
        dashboardCssImportsTag(): string {
            if (this.disableImports) return ''
            return this.dashboardCssParts.imports ? `<style>${this.dashboardCssParts.imports}</style>` : ''
        },
        dashboardCssTag(): string {
            return this.dashboardCssParts.scopedCss ? `<style>${this.dashboardCssParts.scopedCss}</style>` : ''
        },
        dashboardCssScopeSelector(): string {
            const dashboardConfigurationId = this.dashboardModel?.configuration?.id ?? this.dashboardId
            return `#dashboard_${dashboardConfigurationId} .dashboard-renderer-container`
        },
        getCurrentScreenSizeIcon() {
            if (['xs', 'xxs'].includes(this.currentScreenSize)) return 'smartphone'
            if (['sm'].includes(this.currentScreenSize)) return 'tablet'
            if (['md'].includes(this.currentScreenSize)) return 'laptop'
            else return 'desktop_windows'
        },
        breakpointSizes(): { breakpoint: string; width: number; labelKey: string; icon: string; cols: number; fits: boolean }[] {
            return BREAKPOINT_PREVIEWS.map((size) => ({ ...size, cols: this.colSizes[size.breakpoint], fits: size.width <= this.availableWidth }))
        },
        // The size the sheet really gets: a custom size is limited to the space the sheet has.
        previewDimensions(): { width: number; height: number | null } | null {
            if (!this.previewSize) return null
            const width = this.availableWidth ? Math.min(this.previewSize.width, this.availableWidth) : this.previewSize.width
            const height = this.previewSize.height && this.availableHeight ? Math.min(this.previewSize.height, this.availableHeight) : this.previewSize.height
            return { width, height }
        },
        previewSizeText(): string {
            const size = this.previewDimensions
            if (!size) return ''
            return size.height ? `${size.width} × ${size.height}` : `${size.width} px`
        },
        customBreakpoint(): string {
            return screenSizeFromWidth(this.customWidth ?? 0)
        },
        customError(): string {
            const rawHeight = this.customHeight as number | string | null
            const width = Number(this.customWidth)
            const height = rawHeight === null || rawHeight === '' ? null : Number(rawHeight)
            if (!Number.isFinite(width) || width < MIN_PREVIEW_SIZE || (height !== null && (!Number.isFinite(height) || height < MIN_PREVIEW_SIZE))) return this.$t('dashboard.screenSize.customTooSmall', { min: MIN_PREVIEW_SIZE })
            if (this.availableWidth && width > this.availableWidth) return this.$t('dashboard.screenSize.customTooWide', { max: this.availableWidth })
            return ''
        },
        // The sheet scrolls, so a fixed width (and height) show what fits at that size.
        previewSheetStyle(): Record<string, string> {
            const size = this.previewDimensions
            if (!size) return {}
            const width = `${size.width}px`
            const style: Record<string, string> = { flex: '0 0 auto', width, minWidth: width, maxWidth: width, margin: '0 auto' }
            if (size.height) {
                // min-height too: the sheet background style sets min-height: 100%
                const height = `${size.height}px`
                Object.assign(style, { height, minHeight: height, maxHeight: height })
            }
            return style
        },
        getGridStyle() {
            if (canEditDashboard(this.document) && this.dashboardModel?.configuration?.background?.showGrid) {
                return { 'background-size': `${100 / this.colSizes[this.currentScreenSize]}% 30px`, 'background-position': `-${100 / this.colSizes[this.currentScreenSize] / 2}% -15px`, 'background-image': 'radial-gradient(circle, #ccc 1px, rgba(0, 0, 0, 0) 1px)' }
            } else return {}
        }
    },
    watch: {
        model() {
            this.loadDashboardModel()
        }
    },
    mounted() {
        this.loadDashboardModel()
    },
    created() {
        this.currentScreenSize = this.currentBreakpoint()
        const savedCustomSize = loadCustomPreviewSize()
        this.customWidth = savedCustomSize.width
        this.customHeight = savedCustomSize.height
        window.addEventListener('resize', this.onWindowResize)
    },
    unmounted() {
        window.removeEventListener('resize', this.onWindowResize)
    },
    methods: {
        ...mapActions(dashboardStore, ['setSelectedSheetIndex', 'setDashboardSheet', 'getDashboard']),
        loadDashboardModel() {
            this.dashboardModel = this.getDashboard(this.dashboardId) ?? {}
            const fullGridWidgets = this.dashboardModel.widgets?.filter((widget) => widget.settings?.responsive?.fullGrid)
            if (!this.dashboardModel.sheets) this.dashboardModel.sheets = []
            if (this.dashboardModel.sheets.length === 0) this.dashboardModel.sheets.push({ label: this.$t('dashboard.sheets.newSheet'), widgets: { lg: [], md: [], sm: [], xs: [], xxs: [] } })
            normalizeDashboardSheetLayouts(this.dashboardModel)
            this.activeDashboardSheet = this.dashboardModel.sheets[this.selectedSheetIndex || 0] || this.dashboardModel.sheets[0]
            if (fullGridWidgets && fullGridWidgets.length > 0) {
                ;['lg', 'md', 'sm', 'xs', 'xxs'].forEach((size) => {
                    if (this.activeDashboardSheet?.widgets[size] && this.activeDashboardSheet?.widgets[size].some((widget) => widget.id === fullGridWidgets[0].id)) {
                        this.activeDashboardSheet?.widgets[size].forEach((widget) => {
                            if (widget.id === fullGridWidgets[0].id) {
                                widget.w = this.colSizes[size]
                                widget.y = 0
                                widget.x = 0
                                widget.h = 20
                            }
                            return widget
                        })
                    } else {
                        if (!this.activeDashboardSheet?.widgets[size]) this.activeDashboardSheet.widgets[size] = []
                        this.activeDashboardSheet?.widgets[size].push({
                            id: fullGridWidgets[0].id,
                            w: this.colSizes[size],
                            y: 0,
                            x: 0,
                            h: 20,
                            i: crypto.randomUUID()
                        })
                    }
                })
            }
        },
        breakpointChangedEvent(size: string) {
            this.currentScreenSize = size
        },
        // The parent of the sheet keeps the full size while the sheet itself is resized for a preview.
        measureAvailableSpace() {
            const parent = (this.$refs.sheetContainer as HTMLElement | undefined)?.parentElement
            this.availableWidth = parent?.clientWidth ?? 0
            this.availableHeight = parent?.clientHeight ?? 0
        },
        onMenuShow() {
            this.measureAvailableSpace()
            if (this.previewSize?.mode === 'custom') {
                this.customWidth = this.previewSize.width
                this.customHeight = this.previewSize.height
            }
        },
        // The sheet gets that width; grid-layout-plus then picks the breakpoint from its own width.
        setPreviewSize(size: IPreviewSize | null) {
            if (size) this.measureAvailableSpace()
            this.previewSize = size
            this.screenSizeMenuOpen = false
        },
        applyCustomSize() {
            if (this.customError) return
            const height = this.customHeight === null || (this.customHeight as any) === '' ? null : Number(this.customHeight)
            try {
                localStorage.setItem(CUSTOM_PREVIEW_STORAGE_KEY, JSON.stringify({ width: Number(this.customWidth), height }))
            } catch {
                // storage can be unavailable; the size still applies for this session
            }
            this.setPreviewSize({ mode: 'custom', width: Number(this.customWidth), height })
        },
        onWindowResize() {
            if (!this.previewSize) return
            this.measureAvailableSpace()
            // a breakpoint width that does not fit anymore would give another breakpoint, so the preview ends
            if (this.previewSize.mode === 'breakpoint' && this.previewSize.width > this.availableWidth) this.previewSize = null
        },
        getImageSource(chartValue: string) {
            return `${import.meta.env.VITE_PUBLIC_PATH}${chartValue}`
        },
        currentWidget(id) {
            return this.dashboardModel.widgets.find((item) => item.id === id)
        },
        sheetChange(index) {
            this.setSelectedSheetIndex(index)
            this.setDashboardSheet({ id: (this as any).dashboardId as any, sheet: index })
            this.activeDashboardSheet = this.dashboardModel.sheets[index]
        },
        addDataset() {
            emitter.emit('openDatasetManagement', this.dashboardId)
        },
        addWidget() {
            emitter.emit('openNewWidgetPicker', this.dashboardId)
        },
        currentBreakpoint() {
            if (window.innerWidth >= 1200) return 'lg'
            else if (window.innerWidth >= 996) return 'md'
            else if (window.innerWidth >= 768) return 'sm'
            else if (window.innerWidth >= 480) return 'xs'
            else return 'xxs'
        },
        onSheetDeleted(payload: { sheetForDelete: IWidgetSheetItem; currentPage: number }) {
            this.$emit('sheetDeleted', payload)
            this.sheetChange(payload.currentPage)
        },
        onSheetCloned(index) {
            cloneSheet(this.dashboardModel, this.dashboardModel.sheets[index], index)
        }
    }
})
</script>
<style lang="scss">
.sheet-container {
    height: 100%;
    min-width: 100%;
    overflow-y: auto;
    overflow-x: clip;
    .powered {
        position: absolute;
        bottom: 5px;
        right: 10px;
        opacity: 0.5;
        width: 120px;
    }
}

.vgl-layout {
    min-height: 100%;
    .vue-grid-item {
        z-index: 1;
    }
    .emptyDashboardWizard {
        position: absolute;
        display: flex;
        justify-content: center;
        height: 130px;
        align-items: center;
        top: 50%;
        left: 50%;
        transform: translateY(-50%) translateX(-50%);
        z-index: 0;
        .dashboardWizardContainer {
            margin: 0 16px;
            display: flex;
            height: 100%;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            opacity: 0.8;
            span {
                font-weight: bold;
            }
            img {
                height: 100px;
            }
        }
    }
}

// The screen size control sits in the sheet tab bar and takes its colors; a preview shows it filled.
.dashboard-screen-size.q-btn.dashboard-screen-size--preview {
    background: var(--kn-sheet-tabs-indicator, var(--q-primary));
    color: #ffffff;
}
.dashboard-screen-size__width {
    opacity: 0.85;
}
.dashboard-screen-size__header {
    padding: 8px 8px 4px;
}
.dashboard-screen-size__custom {
    width: 232px;
    padding: 10px;
    font-size: 14px;
    .dashboard-screen-size__custom-fields {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .dashboard-screen-size__custom-x {
        opacity: 0.6;
        font-size: 12.5px;
    }
    .dashboard-screen-size__custom-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 8px;
    }
    .dashboard-screen-size__custom-hint {
        flex: 1 1 auto;
        min-width: 0;
        font-size: 12px;
        line-height: 1.3;
        opacity: 0.65;
        &--error {
            color: var(--q-negative);
            opacity: 1;
        }
    }
    .dashboard-screen-size__apply {
        flex: 0 0 auto;
        padding: 0 12px;
    }
    .dashboard-screen-size__custom-input {
        flex: 1 1 0;
        min-width: 0;
        height: 30px;
        padding: 0 8px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 13px;
        outline: none;
        &::placeholder {
            opacity: 0.55;
        }
        &:focus {
            border-color: var(--kn-mainmenu-highlight-color, var(--q-primary));
        }
        &--invalid:not(:placeholder-shown) {
            border-color: var(--q-negative);
        }
    }
}
// the edges of the previewed screen
.sheet-container.sheet-container--preview {
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

@media all and (max-width: 600px) {
    .vue-grid-layout {
        .emptyDashboardWizard {
            flex-direction: column;
            gap: 16px;
        }
    }
}
</style>
