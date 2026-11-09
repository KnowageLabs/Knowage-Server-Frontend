<template>
    <KnDashboardTabsPanel v-if="dashboardModel.sheets" v-model:sheets="dashboardModel.sheets" :active-dashboard-sheet="activeDashboardSheet" :current-screen-size="currentScreenSize" class="test" label-position="bottom" :edit="canEditDashboard(document)" @sheet-change="sheetChange($event)" @sheetDeleted="onSheetDeleted" @sheet-cloned="onSheetCloned">
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
    </KnDashboardTabsPanel>
    <q-btn v-if="canEditDashboard(document)" flat dense no-caps class="responsive-device" :class="{ 'responsive-device--preview': previewSize }" data-test="screen-size-button">
        <q-icon :name="getCurrentScreenSizeIcon" size="16px" />
        <span class="text-uppercase">{{ currentScreenSize }}</span>
        <span v-if="previewSize" class="responsive-device__width">{{ previewSize.screen }} × {{ previewSize.screenHeight }}</span>
        <q-tooltip v-if="!screenSizeMenuOpen" anchor="top middle" self="bottom middle" :delay="300">{{ previewSize ? $t('dashboard.screenSize.previewing', { size: `${previewSize.screen} × ${previewSize.screenHeight}` }) : $t(`dashboard.breakpoints.${currentScreenSize}`) }}</q-tooltip>
        <q-menu v-model="screenSizeMenuOpen" class="kn-toolbar-menu" anchor="top right" self="bottom right" :offset="[0, 4]" @before-show="measureAvailableSpace">
            <div class="kn-toolbar-menu__list" data-test="screen-size-menu">
                <q-item-label header class="dashboard-screen-size__header">{{ $t('dashboard.screenSize.title') }}</q-item-label>
                <MainMenuPopupRow icon="sym_o_fit_screen" :label="$t('dashboard.screenSize.fitWindow')" :checked="!previewSize" @activate="setPreviewSize(null)" />
                <div v-for="size in screenSizes" :key="size.screen">
                    <MainMenuPopupRow :icon="size.icon" :label="$t(size.labelKey)" :meta="`${size.screen} × ${size.height} · ${size.breakpoint.toUpperCase()}`" :checked="previewSize?.screen === size.screen" :disabled="!size.fits" @activate="setPreviewSize(size)" />
                    <q-tooltip v-if="!size.fits" anchor="center left" self="center right">{{ $t('dashboard.screenSize.tooWide', { width: size.screen }) }}</q-tooltip>
                </div>
            </div>
        </q-menu>
    </q-btn>
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

// Screens an editor can preview the sheet at (16:9). Common desktop and laptop sizes, Windows scaling included;
// 1152 is the one that gives the md layout. The sheet is narrower than the screen by the main menu, and shorter
// by the browser and the taskbar (BROWSER_UI_HEIGHT) and by the dashboard toolbar and the sheet tabs (measured).
const PREVIEW_SCREENS = [
    { screen: 1920, height: 1080, labelKey: 'dashboard.screenSize.fullHd', icon: 'sym_o_desktop_windows' },
    { screen: 1536, height: 864, labelKey: 'dashboard.screenSize.laptop', icon: 'sym_o_laptop' },
    { screen: 1366, height: 768, labelKey: 'dashboard.screenSize.laptop', icon: 'sym_o_laptop' },
    { screen: 1152, height: 648, labelKey: 'dashboard.screenSize.smallLaptop', icon: 'sym_o_laptop' }
]
// Windows taskbar (48) + browser tabs and address bar (about 72)
const BROWSER_UI_HEIGHT = 120

interface IPreviewSize {
    screen: number
    screenHeight: number
    sheetWidth: number
    sheetHeight: number
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
            availableHeight: 0
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
        screenSizes(): { screen: number; height: number; labelKey: string; icon: string; sheetWidth: number; breakpoint: string; fits: boolean }[] {
            const menuWidth = this.mainMenuWidth()
            return PREVIEW_SCREENS.map((size) => {
                const sheetWidth = size.screen - menuWidth
                return { ...size, sheetWidth, breakpoint: screenSizeFromWidth(sheetWidth), fits: sheetWidth <= this.availableWidth }
            })
        },
        // The sheet scrolls, so a fixed width and height show what fits on that screen.
        previewSheetStyle(): Record<string, string> {
            if (!this.previewSize) return {}
            const width = `${this.previewSize.sheetWidth}px`
            // min-height too: the sheet background style sets min-height: 100%
            const height = `${this.previewSize.sheetHeight}px`
            return { flex: '0 0 auto', width, minWidth: width, maxWidth: width, height, minHeight: height, maxHeight: height, margin: '0 auto' }
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
        mainMenuWidth(): number {
            const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kn-mainmenu-width'))
            return Number.isFinite(value) ? value : 58
        },
        // The parent of the sheet keeps the full size while the sheet itself is resized for a preview.
        measureAvailableSpace() {
            const parent = (this.$refs.sheetContainer as HTMLElement | undefined)?.parentElement
            this.availableWidth = parent?.clientWidth ?? 0
            this.availableHeight = parent?.clientHeight ?? 0
        },
        // The sheet gets the size it has on that screen; grid-layout-plus then picks the breakpoint from its own width.
        setPreviewSize(size: { screen: number; height: number; sheetWidth: number } | null) {
            if (!size) this.previewSize = null
            else {
                this.measureAvailableSpace()
                // what the page shows above and below the sheet (dashboard toolbar, sheet tabs)
                const pageChrome = window.innerHeight - this.availableHeight
                // a screen taller than the window cannot show: the sheet then keeps the window height
                const sheetHeight = Math.min(this.availableHeight, size.height - BROWSER_UI_HEIGHT - pageChrome)
                this.previewSize = { screen: size.screen, screenHeight: size.height, sheetWidth: size.sheetWidth, sheetHeight }
            }
            this.screenSizeMenuOpen = false
        },
        onWindowResize() {
            if (!this.previewSize) return
            const size = this.screenSizes.find((item) => item.screen === this.previewSize?.screen)
            this.measureAvailableSpace()
            if (!size || size.sheetWidth > this.availableWidth) this.previewSize = null
            else this.setPreviewSize(size)
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

.responsive-device.q-btn {
    position: absolute;
    bottom: 1px;
    right: 8px;
    z-index: 999;
    min-height: 0;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 0;
    background-color: #cccccc6e;
    font-size: 0.7rem;
    line-height: 1;
    .q-btn__content {
        gap: 4px;
    }
    &.responsive-device--preview {
        border-color: var(--q-primary);
        background-color: var(--q-primary);
        color: #fff;
    }
    .responsive-device__width {
        opacity: 0.85;
    }
}
.dashboard-screen-size__header {
    padding: 8px 8px 4px;
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
