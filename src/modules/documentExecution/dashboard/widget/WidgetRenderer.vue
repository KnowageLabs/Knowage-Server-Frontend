<template>
    <div class="widget-container" :style="getWidgetContainerStyle()">
        <ProgressSpinner v-if="widget.type == 'static-pivot-table' && widgetLoading" class="kn-progress-spinner" />
        <div v-if="widget.settings.style.title && widget.settings.style.title.enabled" class="p-d-flex p-ai-center" style="border-radius: 0px" :style="getWidgetTitleStyle()">
            {{ widget.settings?.style.title.text }}
        </div>
        <div class="widget-container-renderer" :style="getWidgetPadding()">
            <TableWidget v-if="widget.type == 'table'" :prop-widget="widget" :datasets="datasets" :data-to-show="dataToShow" :editor-mode="false" :prop-active-selections="activeSelections" :dashboard-id="dashboardId" :prop-variables="variables" @page-changed="$emit('reloadData')" @sorting-changed="$emit('reloadData')" @launch-selection="$emit('launchSelection', $event)" @dataset-interaction-preview="$emit('datasetInteractionPreview', $event)" />
            <!-- <SelectorWidgetContainer v-if="widget.type == 'selector'" :prop-widget="widget" :data-to-show="dataToShow" :widget-initial-data="widgetInitialData" :prop-active-selections="activeSelections" :editor-mode="false" :dashboard-id="dashboardId" :datasets="datasets" :selection-is-locked="selectionIsLocked" :variables="variables" /> -->
            <SelectorWidgetContainer v-if="widget.type == 'selector' && widget.columns && widget.columns.length > 1" :prop-widget="widget" :data-to-show="dataToShow" :widget-initial-data="widgetInitialData" :prop-active-selections="activeSelections" :editor-mode="false" :dashboard-id="dashboardId" :datasets="datasets" :selection-is-locked="selectionIsLocked" />
            <SelectorWidget v-else-if="widget.type == 'selector'" :prop-widget="widget" :data-to-show="getSingleSelectorData()" :widget-initial-data="getSingleSelectorInitialData()" :prop-active-selections="activeSelections" :editor-mode="false" :dashboard-id="dashboardId" :datasets="datasets" :selection-is-locked="selectionIsLocked" :local-mode="false" />
            <ActiveSelectionsWidget v-if="widget.type == 'selection'" :prop-widget="widget" :prop-active-selections="activeSelections" :editor-mode="false" :dashboard-id="dashboardId" />
            <WebComponentContainer v-if="!widgetLoading && (widget.type == 'html' || widget.type == 'text')" :prop-widget="widget" :widget-data="dataToShow" :prop-active-selections="activeSelections" :editor-mode="false" :dashboard-id="dashboardId" :variables="variables" @dataset-interaction-preview="$emit('datasetInteractionPreview', $event)"></WebComponentContainer>
            <HighchartsContainer v-if="widget.type === 'highcharts' && isEnterprise" :widget-model="widget" :datasets="datasets" :data-to-show="widgetData" :prop-active-selections="activeSelections" :editor-mode="false" :dashboard-id="dashboardId" :prop-variables="variables" @dataset-interaction-preview="$emit('datasetInteractionPreview', $event)"></HighchartsContainer>
            <ChartJSContainer v-if="widget.type === 'chartJS'" :widget-model="widget" :data-to-show="widgetData" :prop-active-selections="activeSelections" :editor-mode="false" :dashboard-id="dashboardId"></ChartJSContainer>
            <ImageWidget v-if="widget.type === 'image'" :widget-model="widget" :dashboard-id="dashboardId" :editor-mode="false" :prop-variables="variables" />
            <CustomChartWidget v-if="widget.type == 'customchart'" :prop-widget="widget" :widget-data="widgetData" :prop-active-selections="activeSelections" :editor-mode="false" :dashboard-id="dashboardId" :variables="variables" @loading="$emit('loading', $event)" @dataset-interaction-preview="$emit('datasetInteractionPreview', $event)"></CustomChartWidget>
            <PivotWidget v-if="widget.type == 'static-pivot-table' && !widgetLoading" :prop-widget="widget" :datasets="datasets" :data-to-show="dataToShow" :editor-mode="false" :prop-active-selections="activeSelections" :dashboard-id="dashboardId" :prop-variables="variables" />
            <MapWidget v-if="widget.type == 'map' && !widgetLoading" :prop-widget="widget" :datasets="datasets" :data-to-show="dataToShow" :prop-active-selections="activeSelections" :dashboard-id="dashboardId" :prop-variables="variables" />
            <CEPivotWidget v-if="widget.type == 'ce-pivot-table' && !widgetLoading" :prop-widget="widget" :datasets="datasets" :data-to-show="dataToShow" :editor-mode="false" :prop-active-selections="activeSelections" :dashboard-id="dashboardId" />
            <DiscoveryWidget
                v-if="widget.type === 'discovery'"
                :prop-widget="widget"
                :datasets="datasets"
                :data-to-show="dataToShow"
                :editor-mode="false"
                :prop-active-selections="activeSelections"
                :dashboard-id="dashboardId"
                :widget-loading="widgetLoading"
                :prop-variables="variables"
                @page-changed="$emit('reloadData')"
                @facets-changed="$emit('reloadData')"
                @sorting-changed="$emit('reloadData')"
                @search-word-changed="$emit('reloadData')"
                @dataset-interaction-preview="$emit('datasetInteractionPreview', $event)"
            />
            <PythonWidgetContainer v-if="widget.type === 'python'" :widget-model="widget" :data-to-show="dataToShow" :dashboard-id="dashboardId" :editor-mode="false" />
            <SpacerWidget v-if="widget.type === 'spacer'" />
        </div>
    </div>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of creating the common widget elements to be rendered.
 */
import { defineComponent, PropType } from 'vue'
import { getWidgetStyleByType } from '../widget/TableWidget/TableWidgetHelper'
import { IDashboardDataset, ISelection, IVariable } from '../Dashboard'
import TableWidget from './TableWidget/TableWidget.vue'
import SelectorWidget from './SelectorWidget/SelectorWidget.vue'
import SelectorWidgetContainer from './SelectorWidget/SelectorWidgetContainer.vue'
import ActiveSelectionsWidget from './ActiveSelectionsWidget/ActiveSelectionsWidget.vue'
import WebComponentContainer from './WebComponent/WebComponentContainer.vue'
import HighchartsContainer from '../widget/ChartWidget/Highcharts/HighchartsContainer.vue'
import ChartJSContainer from '../widget/ChartWidget/ChartJS/ChartJSContainer.vue'
import ImageWidget from '../widget/ImageWidget/ImageWidget.vue'
import PivotWidget from '@/workspaces/PivotWidget/PivotWidget.vue'
import CEPivotWidget from '../widget/cePivotWidget/cePivotWidget.vue'
import CustomChartWidget from '../widget/CustomChartWidget/CustomChartWidget.vue'
import DiscoveryWidget from '../widget/DiscoveryWidget/DiscoveryWidget.vue'
import MapWidget from '../widget/MapWidget/MapWidget.vue'
import PythonWidgetContainer from '../widget/PythonWidget/PythonWidgetContainer.vue'
import SpacerWidget from '../widget/SpacerWidget/SpacerWidget.vue'
import { mapState } from 'pinia'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'widget-renderer',
    components: { TableWidget, SelectorWidget, SelectorWidgetContainer, ActiveSelectionsWidget, WebComponentContainer, HighchartsContainer, ChartJSContainer, ImageWidget, CustomChartWidget, PivotWidget, DiscoveryWidget, CEPivotWidget, PythonWidgetContainer, MapWidget, SpacerWidget },
    props: {
        widget: { required: true, type: Object as any },
        widgetLoading: { required: true, type: Boolean as any },
        widgetData: { required: true, type: Object },
        widgetInitialData: { required: true, type: Object },
        datasets: { type: Array as PropType<IDashboardDataset[]>, required: true },
        dashboardId: { type: String, required: true },
        selectionIsLocked: { type: Boolean, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['interaction', 'launchSelection', 'reloadData', 'loading', 'datasetInteractionPreview'],
    data() {
        return {
            dataToShow: {} as any,
            activeSelections: [] as ISelection[],
            htmlContent: '' as string,
            textModel: '' as string
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        shouldOverflowBeVisible() {
            return this.widget?.type === 'map'
        }
    },
    watch: {
        widgetData() {
            this.loadDataToShow()
        },
        propActiveSelections() {
            this.loadActiveSelections()
        }
    },
    created() {
        this.loadActiveSelections()
        this.loadDataToShow()
    },
    methods: {
        async loadDataToShow() {
            this.dataToShow = this.widgetData
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        },
        getSingleSelectorData(): any {
            // For single-column selectors, extract first column data from multi-column format
            if (!this.widget?.columns?.[0]?.columnName) return { rows: [] }
            const columnName = this.widget.columns[0].columnName
            return this.widgetData?.[columnName] || { rows: [] }
        },
        getSingleSelectorInitialData(): any {
            // For single-column selectors, extract first column initial data
            if (!this.widget?.columns?.[0]?.columnName) return { rows: [] }
            const columnName = this.widget.columns[0].columnName
            return this.widgetInitialData?.[columnName] || { rows: [] }
        },
        getWidgetTitleStyle() {
            const widgetTitle = this.widget.settings.style.title
            const styleString = getWidgetStyleByType(this.widget, 'title')
            let heightValue = '25px'
            if (widgetTitle.height !== undefined && widgetTitle.height !== null) {
                const height = String(widgetTitle.height)
                heightValue = /^\d+$/.test(height) ? `${height}px` : height
            }
            return styleString + `height: ${heightValue};`
        },
        getWidgetContainerStyle() {
            const styleString = getWidgetStyleByType(this.widget, 'borders') + getWidgetStyleByType(this.widget, 'shadows') + getWidgetStyleByType(this.widget, 'background')
            return styleString + `overflow: ${this.shouldOverflowBeVisible ? 'visible' : 'hidden'}`
        },
        getWidgetPadding() {
            const styleString = getWidgetStyleByType(this.widget, 'padding')
            return styleString + `overflow: ${this.shouldOverflowBeVisible ? 'visible' : 'hidden'}`
        }
    }
})
</script>

<style lang="scss" scoped>
.widget-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #fff;

    &.overflow-visible {
        overflow: visible !important;
    }

    .widget-container-renderer {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;

        .widget-container.overflow-visible & {
            overflow: visible !important;
        }
    }
}
</style>
