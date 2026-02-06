<template>
    <div v-if="propWidget" class="p-d-flex kn-flex">
        <!-- <div v-if="propWidget" class="accordion-container"> -->
        <!-- <div class="accordion-wrapper"> -->
        <KnHint v-if="!selectedSetting" class="p-as-center" :title="'common.settings'" :hint="'dashboard.widgetEditor.settings.hint'"></KnHint>
        <TableWidgetSettingsContainer v-if="selectedSetting && propWidget.type === 'table'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></TableWidgetSettingsContainer>
        <SelectorWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'selector'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables"></SelectorWidgetSettingsContainer>
        <SelectionsWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'selection'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables"></SelectionsWidgetSettingsContainer>
        <HTMLWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'html'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :prop-gallery-items="galleryItems" @galleryItemSelected="onGalleryItemSelected"></HTMLWidgetSettingsContainer>
        <TextWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'text'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></TextWidgetSettingsContainer>
        <HighchartsWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'highcharts' && user.enterprise" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :descriptor="descriptor"></HighchartsWidgetSettingsContainer>
        <ChartJSWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'chartJS'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></ChartJSWidgetSettingsContainer>
        <ImageWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'image'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" @settingSelected="$emit('settingChanged', $event)"></ImageWidgetSettingsContainer>
        <CustomChartWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'customchart'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :custom-chart-gallery-prop="customChartGallery" @galleryItemSelected="onGalleryItemSelected"></CustomChartWidgetSettingsContainer>
        <PivotTableWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'static-pivot-table'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></PivotTableWidgetSettingsContainer>
        <DiscoveryWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'discovery'" class="model-div kn-flex p-py-3 p-pr-3" :widgetModel="propWidget" :selectedSetting="selectedSetting" :datasets="datasets" :selectedDatasets="selectedDatasets" :variables="variables" :dashboardId="dashboardId"></DiscoveryWidgetSettingsContainer>
        <MapWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'map'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :layers="layers"></MapWidgetSettingsContainer>
        <cePivotTableWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'ce-pivot-table'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></cePivotTableWidgetSettingsContainer>
        <PythonWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'python'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId" :prop-gallery-items="galleryItems" @galleryItemSelected="onGalleryItemSelected"></PythonWidgetSettingsContainer>
        <SpacerWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'spacer'" class="model-div kn-flex p-py-3 p-pr-3" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></SpacerWidgetSettingsContainer>
        <!-- </div> -->
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable, IGalleryItem } from '../../../Dashboard'
import { ILayer } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { getSettingsDescriptor } from '../helpers/WidgetEditorHelpers'
import customDashboardHeaderDescriptor from './HTMLWidget/CustomDashboardHeaderDescriptor.json'
import htmlDescriptor from './HTMLWidget/HTMLWidgetSettingsDescriptor.json'
import HighchartsScatterSettingsDescriptor from './ChartWidget/highcharts/descriptors/HighchartsScatterSettingsDescriptor.json'
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
import PythonWidgetSettingsContainer from './PythonWidget/PythonWidgetSettingsContainer.vue'
import SpacerWidgetSettingsContainer from './SpacerWidget/SpacerWidgetSettingsContainer.vue'
import WidgetEditorSettingsList from './WidgetEditorSettingsList.vue'
import { mapState, mapActions } from 'pinia'
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import KnHint from '@/components/UI/KnHint.vue'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'widget-editor-settings-tab',
    components: {
        KnHint,
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
        cePivotTableWidgetSettingsContainer,
        PythonWidgetSettingsContainer,
        SpacerWidgetSettingsContainer
    },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true },
        layers: { type: Array as PropType<ILayer[]>, required: true },
        selectedSetting: { type: String, default: '' }
    },
    emits: ['settingChanged'],
    data() {
        return {
            descriptor: null as any,
            selectedDescriptor: {},
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
            // Get the base descriptor from helper
            this.descriptor = getSettingsDescriptor(this.propWidget.type, this.propWidget?.settings?.chartModel?.model?.chart?.type)

            // Apply custom logic for specific widget types
            if (this.propWidget.type === 'html') {
                // Override with custom dashboard header descriptor if applicable
                if (this.propWidget.settings.isCustomDashboardHeader) {
                    this.descriptor = { ...customDashboardHeaderDescriptor }
                } else {
                    this.descriptor = { ...htmlDescriptor }
                }
                this.checkIfHtmlWidgetGalleryOptionIsDisabled()
            } else if (this.propWidget.type === 'highcharts' && this.propWidget?.settings?.chartModel?.model?.chart?.type === 'scatter') {
                // Apply special jitter logic for scatter charts
                this.descriptor = this.getScatterChartDescriptor()
            }
        },
        getScatterChartDescriptor() {
            const isJittered = this.propWidget?.settings.chartModel?.model?.plotOptions?.scatter?.jitter ?? false
            const descriptor = deepcopy(HighchartsScatterSettingsDescriptor)
            if (!isJittered) descriptor.settings.Configuration = descriptor.settings.Configuration.filter((item) => item.type !== 'JitterSettings')
            return descriptor
        },
        async loadGallery() {
            this.galleryItems = this.propWidget.type === 'html' ? await this.getHTMLGaleryItems(this.dashboardId, this.$http) : await this.getPythonGaleryItems(this.dashboardId, this.$http)
        },
        checkIfHtmlWidgetGalleryOptionIsDisabled() {
            const index = this.descriptor.settingsListOptions.findIndex((option: any) => option.value === 'Gallery')
            if (index !== -1) this.descriptor.settingsListOptions[index].disabled = this.galleryItems.length === 0
        },
        onGalleryItemSelected() {
            this.$emit('settingChanged', 'Editor')
        }
    }
})
</script>
<style lang="scss" scoped>
.accordion-container {
    display: flex;
    flex: 1;
    overflow: auto;
    justify-content: center;
    .accordion-wrapper {
        display: flex;
        flex: 1;
        max-width: 59rem;
    }
}
</style>
