<template>
    <KnDashboardTabsPanel v-model:sheets="dashboardModel.sheets" :style="backgroundStyle" class="test" label-position="bottom" :edit="canEditDashboard(document)" @sheet-change="sheetChange($event)">
        <div id="dashboard-css" v-html="dashboardCss" />
        <KnDashboardTab v-for="(sheet, index) in dashboardModel.sheets" :key="index" :index="index">
            <grid-layout
                v-model:layout="sheet.widgets['lg']"
                :responsive-layouts="sheet.widgets"
                :responsive="true"
                :cols="{ lg: 50, md: 100, sm: 50, xs: 20, xxs: 10 }"
                :row-height="30"
                :is-draggable="canEditDashboard(document)"
                :is-resizable="canEditDashboard(document)"
                :vertical-compact="false"
                :use-css-transforms="false"
                :margin="[0, 0]"
                @breakpoint-changed="breakpointChangedEvent"
            >
                <WidgetController v-for="item in sheet.widgets['lg']" :key="item.i" :active-sheet="sheet" :document="document" :widget="currentWidget(item.id)" :item="item" :datasets="datasets" :dashboard-id="dashboardId" :variables="variables" :model="model"></WidgetController>
                <div v-if="canEditDashboard(document)" class="emptyDashboardWizard">
                    <div v-if="dashboardModel?.configuration?.datasets.length === 0" class="dashboardWizardContainer" @click="addDataset">
                        <img :src="getImageSource('images/dashboard/common/databaseWizardDashboard.svg')" />
                        <span>{{ $t('dashboard.wizard.addDataset') }}</span>
                    </div>
                    <div v-if="sheet.widgets?.lg?.length === 0" class="dashboardWizardContainer" @click="addWidget">
                        <img :src="getImageSource('images/dashboard/common/widgetWizardDashboard.svg')" />
                        <span>{{ $t('dashboard.wizard.addWidget') }}</span>
                    </div>
                </div>
            </grid-layout>
        </KnDashboardTab>
    </KnDashboardTabsPanel>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of creating the dashboard visualizazion, specifically to manage responsive structure and sheets.
 */
import { defineComponent, PropType } from 'vue'
import { IBackground, IDataset, IVariable } from './Dashboard'
import { canEditDashboard } from './DashboardHelpers'
import { mapActions, mapState } from 'pinia'
import WidgetController from './widget/WidgetController.vue'
import KnDashboardTabsPanel from '@/components/UI/KnDashboardTabs/KnDashboardTabsPanel.vue'
import KnDashboardTab from '@/components/UI/KnDashboardTabs/KnDashboardTab.vue'
import dashboardStore from './Dashboard.store'

export default defineComponent({
    name: 'dashboard-manager',
    components: { KnDashboardTab, KnDashboardTabsPanel, WidgetController },
    props: {
        model: { type: Object },
        document: { type: Object },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        dashboardId: { type: String, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['addWidget', 'addDataset'],
    data() {
        return {
            dashboardModel: {} as any,
            startingBreakpoint: '' as string,
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
        }
    },
    mounted() {
        this.dashboardModel = this.model ?? {}
        if (!this.dashboardModel.sheets) this.dashboardModel.sheets = []
        if (this.dashboardModel.sheets.length === 0) this.dashboardModel.sheets.push({ label: 'new sheet', widgets: { lg: [] } })
    },
    methods: {
        ...mapActions(dashboardStore, ['setSelectedSheetIndex', 'setDashboardSheet']),
        breakpointChangedEvent: function () {
            // breakpointChangedEvent: function(newBreakpoint, newLayout) {
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
        },
        addDataset() {
            this.$emit('addDataset')
        },
        addWidget() {
            this.$emit('addWidget')
        }
    }
})
</script>
<style lang="scss">
.vue-grid-layout {
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
</style>
