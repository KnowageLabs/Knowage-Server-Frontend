<template>
    <KnDashboardTabsPanel v-model:sheets="dashboardModel.sheets" :style="backgroundStyle" :current-screen-size="currentScreenSize" class="test" label-position="bottom" :edit="canEditDashboard(document)" @sheet-change="sheetChange($event)" @sheetDeleted="onSheetDeleted">
        <div id="dashboard-css" v-html="dashboardCss" />

        <div v-if="activeDashboardSheet" class="sheet-container">
            <GridLayout
                :layout.sync="activeDashboardSheet.widgets[currentScreenSize]"
                :responsive-layouts="activeDashboardSheet.widgets"
                :responsive="true"
                :cols="colSizes"
                :row-height="30"
                :is-draggable="canEditDashboard(document)"
                :is-resizable="canEditDashboard(document)"
                :vertical-compact="false"
                :use-css-transforms="false"
                :margin="[0, 0]"
                :style="getGridStyle"
                @breakpoint-changed="breakpointChangedEvent"
            >
                <WidgetController
                    v-for="item in activeDashboardSheet.widgets[currentScreenSize]"
                    :key="item.i"
                    :active-sheet="activeDashboardSheet"
                    :document="document"
                    :widget="currentWidget(item.id)"
                    :item="item"
                    :datasets="datasets"
                    :dashboard-id="dashboardId"
                    :variables="variables"
                    :model="model"
                ></WidgetController>
                <div v-if="canEditDashboard(document)" class="emptyDashboardWizard">
                    <div v-if="dashboardModel?.configuration?.datasets.length === 0" class="dashboardWizardContainer" data-test="new-button" @click="addDataset">
                        <img :src="getImageSource('images/dashboard/common/databaseWizardDashboard.svg')" />
                        <span>{{ $t('dashboard.wizard.addDataset') }}</span>
                    </div>
                    <div v-if="activeDashboardSheet.widgets?.lg?.length === 0" class="dashboardWizardContainer" data-test="new-button" @click="addWidget">
                        <img :src="getImageSource('images/dashboard/common/widgetWizardDashboard.svg')" />
                        <span>{{ $t('dashboard.wizard.addWidget') }}</span>
                    </div>
                </div>
            </GridLayout>
        </div>
    </KnDashboardTabsPanel>
    <div v-if="canEditDashboard(document)" class="responsive-device">
        <q-icon :name="getCurrentScreenSizeIcon" :title="$t(`dashboard.breakpoints.${currentScreenSize}`)" />
    </div>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of creating the dashboard visualizazion, specifically to manage responsive structure and sheets.
 */
import { defineComponent, PropType } from 'vue'
import { IBackground, IDashboardSheet, IDataset, IVariable, IWidgetSheetItem } from './Dashboard'
import { canEditDashboard } from './DashboardHelpers'
import { mapActions, mapState } from 'pinia'
import { emitter } from './DashboardHelpers'
import WidgetController from './widget/WidgetController.vue'
import KnDashboardTabsPanel from '@/components/UI/KnDashboardTabs/KnDashboardTabsPanel.vue'
import dashboardStore from './Dashboard.store'

export default defineComponent({
    name: 'dashboard-manager',
    components: { KnDashboardTabsPanel, WidgetController },
    props: {
        model: { type: Object },
        document: { type: Object },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        dashboardId: { type: String, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: [],
    data() {
        return {
            dashboardModel: {} as any,
            colSizes: { lg: 100, md: 100, sm: 50, xs: 20, xxs: 10 } as any,
            startingBreakpoint: '' as string,
            activeDashboardSheet: null as IDashboardSheet | null,
            currentScreenSize: 'lg',
            canEditDashboard
        }
    },
    computed: {
        ...mapState(dashboardStore, {
            dashboard: 'dashboards',
            selectedSheetIndex: 'selectedSheetIndex'
        }),
        backgroundStyle(): any {
            if (!this.dashboardModel.configuration) return ''

            const backgroundConfig = this.dashboardModel.configuration.background as IBackground
            const backgroundStyle = { 'background-size': backgroundConfig?.imageBackgroundSize || '100%', 'background-position': 'center', 'background-repeat': 'no-repeat', 'min-height': '100%' }

            if (backgroundConfig?.imageBackgroundUrl) backgroundStyle['background-image'] = `url('${backgroundConfig.imageBackgroundUrl}')`
            if (backgroundConfig?.sheetsBackgroundColor) backgroundStyle['background-color'] = backgroundConfig.sheetsBackgroundColor
            backgroundStyle['background-size'] = backgroundConfig?.imageBackgroundSize || 'contain'

            return backgroundStyle
        },
        dashboardCss(): any {
            return `<style>${this.dashboardModel?.configuration?.cssToRender}</style>`
        },
        getCurrentScreenSizeIcon() {
            if (['xs', 'xxs'].includes(this.currentScreenSize)) return 'smartphone'
            if (['sm'].includes(this.currentScreenSize)) return 'tablet'
            if (['md'].includes(this.currentScreenSize)) return 'laptop'
            else return 'desktop_windows'
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
    },
    methods: {
        ...mapActions(dashboardStore, ['setSelectedSheetIndex', 'setDashboardSheet', 'getDashboard']),
        loadDashboardModel() {
            this.dashboardModel = this.getDashboard(this.dashboardId) ?? {}
            const fullGridWidgets = this.dashboardModel.widgets?.filter((widget) => widget.settings?.responsive?.fullGrid)
            if (!this.dashboardModel.sheets) this.dashboardModel.sheets = []
            if (this.dashboardModel.sheets.length === 0) this.dashboardModel.sheets.push({ label: this.$t('dashboard.sheets.newSheet'), widgets: { lg: [], md: [], sm: [], xs: [], xxs: [] } })
            this.activeDashboardSheet = this.dashboardModel.sheets[this.selectedSheetIndex || 0]
            if (fullGridWidgets && fullGridWidgets.length > 0) {
                ;['lg', 'md', 'sm', 'xs', 'xxs'].forEach((size) => {
                    if (this.activeDashboardSheet?.widgets[size] && this.activeDashboardSheet?.widgets[size].some((widget) => widget.id === fullGridWidgets[0].id)) {
                        this.activeDashboardSheet?.widgets[size].map((widget) => {
                            if (widget.id === fullGridWidgets[0].id) {
                                widget.w = this.colSizes[this.currentScreenSize]
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
            this.sheetChange(payload.currentPage)
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

.responsive-device {
    position: absolute;
    bottom: 1px;
    right: 8px;
    z-index: 999;
    background-color: #cccccc6e;
    border: 1px solid #ccc;
    padding: 4px 8px;
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
