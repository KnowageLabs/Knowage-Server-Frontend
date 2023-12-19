<template>
    <WidgetEditorSettingsList v-if="descriptor" :widget-model="propWidget" :options="descriptor.settingsListOptions" :propSelectedItem="selectedSetting" @itemClicked="onItemClicked"></WidgetEditorSettingsList>
    <div v-if="propWidget" class="p-d-flex kn-flex kn-overflow">
        <TableWidgetSettingsContainer
            v-if="propWidget.type === 'table'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
        ></TableWidgetSettingsContainer>
        <SelectorWidgetSettingsContainer
            v-else-if="propWidget.type === 'selector'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
        ></SelectorWidgetSettingsContainer>
        <SelectionsWidgetSettingsContainer
            v-else-if="propWidget.type === 'selection'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
        ></SelectionsWidgetSettingsContainer>
        <HTMLWidgetSettingsContainer
            v-else-if="propWidget.type === 'html'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
            :prop-gallery-items="galleryItems"
            @galleryItemSelected="onGalleryItemSelected"
        ></HTMLWidgetSettingsContainer>
        <TextWidgetSettingsContainer
            v-else-if="propWidget.type === 'text'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
        ></TextWidgetSettingsContainer>
        <HighchartsWidgetSettingsContainer
            v-else-if="propWidget.type === 'highcharts' && user.enterprise"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
            :descriptor="descriptor"
        >
        </HighchartsWidgetSettingsContainer>
        <ChartJSWidgetSettingsContainer
            v-else-if="propWidget.type === 'chartJS'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
        >
        </ChartJSWidgetSettingsContainer>
        <ImageWidgetSettingsContainer
            v-else-if="propWidget.type === 'image'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
            @settingSelected="$emit('settingChanged', $event)"
        >
        </ImageWidgetSettingsContainer>
        <CustomChartWidgetSettingsContainer
            v-else-if="propWidget.type === 'customchart'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
            :custom-chart-gallery-prop="customChartGallery"
            @galleryItemSelected="onGalleryItemSelected"
        ></CustomChartWidgetSettingsContainer>
        <PivotTableWidgetSettingsContainer
            v-else-if="propWidget.type === 'static-pivot-table'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
        ></PivotTableWidgetSettingsContainer>
        <DiscoveryWidgetSettingsContainer
            v-else-if="propWidget.type === 'discovery'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widgetModel="propWidget"
            :selectedSetting="selectedSetting"
            :datasets="datasets"
            :selectedDatasets="selectedDatasets"
            :variables="variables"
            :dashboardId="dashboardId"
        ></DiscoveryWidgetSettingsContainer>
        <MapWidgetSettingsContainer
            v-else-if="propWidget.type === 'map'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
            :layers="layers"
        ></MapWidgetSettingsContainer>
        <VegaChartsSettingsContainer
            v-else-if="propWidget.type === 'vega'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
        ></VegaChartsSettingsContainer>
        <cePivotTableWidgetSettingsContainer
            v-else-if="propWidget.type === 'ce-pivot-table'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :variables="variables"
            :dashboard-id="dashboardId"
        ></cePivotTableWidgetSettingsContainer>
        <PythonWidgetSettingsContainer
            v-else-if="propWidget.type === 'python'"
            class="model-div kn-flex kn-overflow p-py-3 p-pr-3"
            :widget-model="propWidget"
            :selected-setting="selectedSetting"
            :datasets="datasets"
            :selected-datasets="selectedDatasets"
            :dashboard-id="dashboardId"
            :prop-gallery-items="galleryItems"
            @galleryItemSelected="onGalleryItemSelected"
        ></PythonWidgetSettingsContainer>
        <RWidgetSettingsContainer v-else-if="propWidget.type === 'r'" class="model-div kn-flex kn-overflow p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></RWidgetSettingsContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable, IGalleryItem } from '../../../Dashboard'
import { ILayer } from '../../../interfaces/mapWidget/DashboardMapWidget'
import tableDescriptor from './TableWidget/TableWidgetSettingsDescriptor.json'
import TableWidgetSettingsContainer from './TableWidget/TableWidgetSettingsContainer.vue'
import SelectorWidgetSettingsContainer from './SelectorWidget/SelectorWidgetSettingsContainer.vue'
import SelectionsWidgetSettingsContainer from './SelectionsWidget/SelectionsWidgetSettingsContainer.vue'
import HTMLWidgetSettingsContainer from './HTMLWidget/HTMLWidgetSettingsContainer.vue'
import TextWidgetSettingsContainer from './TextWidget/TextWidgetSettingsContainer.vue'
import HighchartsWidgetSettingsContainer from './ChartWidget/highcharts/HighchartsWidgetSettingsContainer.vue'
import ChartJSWidgetSettingsContainer from './ChartWidget/chartJS/ChartJSWidgetSettingsContainer.vue'
import ImageWidgetSettingsContainer from './ImageWidget/ImageWidgetSettingsContainer.vue'
import CustomChartWidgetSettingsContainer from './CustomChartWidget/CustomChartWidgetSettingsContainer.vue'
import PivotTableWidgetSettingsContainer from './PivotTableWidget/PivotTableWidgetSettingsContainer.vue'
import cePivotTableWidgetSettingsContainer from './cePivotTableWidget/cePivotTableWidgetSettingsContainer.vue'
import DiscoveryWidgetSettingsContainer from './DiscoveryWidget/DiscoveryWidgetSettingsContainer.vue'
import MapWidgetSettingsContainer from './MapWidget/MapWidgetSettingsContainer.vue'
import VegaChartsSettingsContainer from './ChartWidget/vega/VegaChartsSettingsContainer.vue'
import PythonWidgetSettingsContainer from './PythonWidget/PythonWidgetSettingsContainer.vue'
import RWidgetSettingsContainer from './RWidget/RWidgetSettingsContainer.vue'
import selectorDescriptor from './SelectorWidget/SelectorWidgetSettingsDescriptor.json'
import selectionsDescriptor from './SelectionsWidget/SelectionsWidgetSettingsDescriptor.json'
import WidgetEditorSettingsList from './WidgetEditorSettingsList.vue'
import htmlDescriptor from './HTMLWidget/HTMLWidgetSettingsDescriptor.json'
import customDashboardHeaderDescriptor from './HTMLWidget/CustomDashboardHeaderDescriptor.json'
import textDescriptor from './TextWidget/TextWidgetSettingsDescriptor.json'
import chartJSDescriptor from './ChartWidget/chartJS/ChartJSWidgetSettingsDescriptor.json'
import HighchartsPieSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsPieSettingsDescriptor.json'
import HighchartsGaugeSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsGaugeSettingsDescriptor.json'
import HighchartsActivityGaugeSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsActivityGaugeSettingsDescriptor.json'
import HighchartsSolidGaugeSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsSolidGaugeSettingsDescriptor.json'
import HighchartsHeatmapSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsHeatmapSettingsDescriptor.json'
import HighchartsRadarSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsRadarSettingsDescriptor.json'
import HighchartsBarSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsBarSettingsDescriptor.json'
import HighchartsBubbleSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsBubbleSettingsDescriptor.json'
import HighchartsScatterSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsScatterSettingsDescriptor.json'
import HighchartsLineSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsLineSettingsDescriptor.json'
import HighchartsSunburstSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsSunburstSettingsDescriptor.json'
import HighchartsTreemapSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsTreemapSettingsDescriptor.json'
import HighchartsChordSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsChordSettingsDescriptor.json'
import HighchartsParallelSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsParallelSettingsDescriptor.json'
import HighchartsPictorialSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsPictorialSettingsDescriptor.json'
import HighchartsSankeySettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsSankeySettingsDescriptor.json'
import HighchartsFunnelSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsFunnelSettingsDescriptor.json'
import HighchartsDumbbellSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsDumbbellSettingsDescriptor.json'
import HighchartsStreamgraphSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsStreamgraphSettingsDescriptor.json'
import HighchartsPackedBubbleSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsPackedBubbleSettingsDescriptor.json'
import HighchartsWaterfallSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsWaterfallSettingsDescriptor.json'
import imageDescriptor from './ImageWidget/ImageWidgetSettingsDescriptor.json'
import customChartDescriptor from './CustomChartWidget/CustomChartWidgetSettingsDescriptor.json'
import pivotTableDescriptor from './PivotTableWidget/PivotTableSettingsDescriptor.json'
import cePivotTableDescriptor from './cePivotTableWidget/cePivotTableSettingsDescriptor.json'
import discoveryDescriptor from './DiscoveryWidget/DiscoveryWidgetSettingsDescriptor.json'
import mapWidgetDescriptor from './MapWidget/MapSettingsDescriptor.json'
import vegaChartsDescriptor from './ChartWidget/vega/VegaChartsSettingsDescriptor.json'
import pythonWidgetDescriptor from './PythonWidget/PythonWidgetSettingsDescriptor.json'
import rWidgetDescriptor from './RWidget/RWidgetSettingsDescriptor.json'
import { mapState, mapActions } from 'pinia'
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'widget-editor-settings-tab',
    components: {
        TableWidgetSettingsContainer,
        WidgetEditorSettingsList,
        SelectorWidgetSettingsContainer,
        SelectionsWidgetSettingsContainer,
        HTMLWidgetSettingsContainer,
        TextWidgetSettingsContainer,
        HighchartsWidgetSettingsContainer,
        ChartJSWidgetSettingsContainer,
        ImageWidgetSettingsContainer,
        CustomChartWidgetSettingsContainer,
        PivotTableWidgetSettingsContainer,
        DiscoveryWidgetSettingsContainer,
        MapWidgetSettingsContainer,
        VegaChartsSettingsContainer,
        cePivotTableWidgetSettingsContainer,
        PythonWidgetSettingsContainer,
        RWidgetSettingsContainer
    },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true },
        layers: { type: Array as PropType<ILayer[]>, required: true }
    },
    emits: ['settingChanged'],
    data() {
        return {
            descriptor: null as any,
            selectedDescriptor: {},
            selectedSetting: '',
            galleryItems: [] as IGalleryItem[],
            customChartGallery: [] as IGalleryItem[]
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        }),
        chartType() {
            return this.propWidget?.settings.chartModel?.model?.chart.type
        }
    },
    watch: {
        chartType() {
            this.loadDescriptor()
        }
    },
    async created() {
        if (['html', 'python'].includes(this.propWidget?.type)) await this.loadGallery()
        if (this.propWidget?.type === 'customchart') this.customChartGallery = await this.getCustomChartGaleryItems(this.dashboardId, this.$http)
        this.loadDescriptor()
    },
    methods: {
        ...mapActions(dashboardStore, ['getHTMLGaleryItems', 'getPythonGaleryItems', 'getCustomChartGaleryItems']),
        loadDescriptor() {
            switch (this.propWidget.type) {
                case 'table':
                    this.descriptor = tableDescriptor
                    break
                case 'selector':
                    this.descriptor = selectorDescriptor
                    break
                case 'selection':
                    this.descriptor = selectionsDescriptor
                    break
                case 'html':
                    this.descriptor = this.propWidget.settings.isCustomDashboardHeader ? { ...customDashboardHeaderDescriptor } : { ...htmlDescriptor }
                    this.checkIfHtmlWidgetGalleryOptionIsDisabled()
                    break
                case 'text':
                    this.descriptor = textDescriptor
                    break
                case 'highcharts':
                    this.descriptor = this.getHighchartsDescriptor()
                    break
                case 'chartJS':
                    this.descriptor = chartJSDescriptor
                    break
                case 'image':
                    this.descriptor = imageDescriptor
                    break
                case 'customchart':
                    this.descriptor = customChartDescriptor
                    break
                case 'static-pivot-table':
                    this.descriptor = pivotTableDescriptor
                    break
                case 'ce-pivot-table':
                    this.descriptor = cePivotTableDescriptor
                    break
                case 'discovery':
                    this.descriptor = discoveryDescriptor
                    break
                case 'map':
                    this.descriptor = mapWidgetDescriptor
                    break
                case 'vega':
                    this.descriptor = vegaChartsDescriptor
                    break
                case 'python':
                    this.descriptor = pythonWidgetDescriptor
                    break
                case 'r':
                    this.descriptor = rWidgetDescriptor
            }
        },
        getHighchartsDescriptor() {
            switch (this.chartType) {
                case 'pie':
                    return HighchartsPieSettingsDescriptor
                case 'gauge':
                    return HighchartsGaugeSettingsDescriptor
                case 'activitygauge':
                    return HighchartsActivityGaugeSettingsDescriptor
                case 'solidgauge':
                    return HighchartsSolidGaugeSettingsDescriptor
                case 'heatmap':
                    return HighchartsHeatmapSettingsDescriptor
                case 'radar':
                    return HighchartsRadarSettingsDescriptor
                case 'area':
                case 'bar':
                case 'column':
                    return HighchartsBarSettingsDescriptor
                case 'bubble':
                    return HighchartsBubbleSettingsDescriptor
                case 'scatter':
                    return HighchartsScatterSettingsDescriptor
                case 'line':
                    return HighchartsLineSettingsDescriptor
                case 'treemap':
                    return HighchartsTreemapSettingsDescriptor
                case 'sunburst':
                    return HighchartsSunburstSettingsDescriptor
                case 'dependencywheel':
                    return HighchartsChordSettingsDescriptor
                case 'spline':
                    return HighchartsParallelSettingsDescriptor
                case 'pictorial':
                    return HighchartsPictorialSettingsDescriptor
                case 'sankey':
                    return HighchartsSankeySettingsDescriptor
                case 'funnel':
                    return HighchartsFunnelSettingsDescriptor
                case 'dumbbell':
                    return HighchartsDumbbellSettingsDescriptor
                case 'streamgraph':
                    return HighchartsStreamgraphSettingsDescriptor
                case 'packedbubble':
                    return HighchartsPackedBubbleSettingsDescriptor
                case 'waterfall':
                    return HighchartsWaterfallSettingsDescriptor
            }
        },
        onItemClicked(item: any) {
            this.selectedSetting = item.value
            this.$emit('settingChanged', item.value)
            this.selectedDescriptor = { table: item.descriptor }
        },
        async loadGallery() {
            this.galleryItems = this.propWidget.type === 'html' ? await this.getHTMLGaleryItems(this.dashboardId, this.$http) : await this.getPythonGaleryItems(this.dashboardId, this.$http)
        },
        checkIfHtmlWidgetGalleryOptionIsDisabled() {
            const index = this.descriptor.settingsListOptions.findIndex((option: any) => option.value === 'Gallery')
            if (index !== -1) this.descriptor.settingsListOptions[index].disabled = this.galleryItems.length === 0
        },
        onGalleryItemSelected() {
            this.selectedSetting = 'Editor'
            this.$emit('settingChanged', 'Editor')
        }
    }
})
</script>
