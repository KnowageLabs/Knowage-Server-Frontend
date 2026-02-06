<template>
    <div v-if="propWidget" class="p-d-flex kn-flex">
        <!-- <div v-if="propWidget" class="accordion-container"> -->
        <!-- <div class="accordion-wrapper"> -->
        <KnHint v-if="!selectedSetting" class="p-as-center" :title="'common.settings'" :hint="'dashboard.widgetEditor.settings.hint'"></KnHint>
        <TableWidgetSettingsContainer v-if="selectedSetting && propWidget.type === 'table'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></TableWidgetSettingsContainer>
        <SelectorWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'selector'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables"></SelectorWidgetSettingsContainer>
        <SelectionsWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'selection'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables"></SelectionsWidgetSettingsContainer>
        <HTMLWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'html'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :prop-gallery-items="galleryItems" @galleryItemSelected="onGalleryItemSelected"></HTMLWidgetSettingsContainer>
        <TextWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'text'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></TextWidgetSettingsContainer>
        <HighchartsWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'highcharts' && user.enterprise" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :descriptor="descriptor"></HighchartsWidgetSettingsContainer>
        <ChartJSWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'chartJS'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></ChartJSWidgetSettingsContainer>
        <ImageWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'image'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" @settingSelected="$emit('settingChanged', $event)"></ImageWidgetSettingsContainer>
        <CustomChartWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'customchart'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :custom-chart-gallery-prop="customChartGallery" @galleryItemSelected="onGalleryItemSelected"></CustomChartWidgetSettingsContainer>
        <PivotTableWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'static-pivot-table'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></PivotTableWidgetSettingsContainer>
        <DiscoveryWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'discovery'" class="kn-flex" :widgetModel="propWidget" :selectedSetting="selectedSetting" :datasets="datasets" :selectedDatasets="selectedDatasets" :variables="variables" :dashboardId="dashboardId"></DiscoveryWidgetSettingsContainer>
        <MapWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'map'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :layers="layers"></MapWidgetSettingsContainer>
        <cePivotTableWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'ce-pivot-table'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></cePivotTableWidgetSettingsContainer>
        <PythonWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'python'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId" :prop-gallery-items="galleryItems" @galleryItemSelected="onGalleryItemSelected"></PythonWidgetSettingsContainer>
        <SpacerWidgetSettingsContainer v-else-if="selectedSetting && propWidget.type === 'spacer'" class="kn-flex" :widget-model="propWidget" :selected-setting="selectedSetting" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></SpacerWidgetSettingsContainer>
        <!-- </div> -->
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable, IGalleryItem } from '../../../Dashboard'
import { ILayer } from '../../../interfaces/mapWidget/DashboardMapWidget'
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
import { mapState } from 'pinia'
import mainStore from '@/App.store'
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    name: 'widget-editor-settings-tab',
    components: {
        KnHint,
        TableWidgetSettingsContainer,
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
        selectedSetting: { type: String, default: '' },
        descriptor: { type: Object as PropType<any>, required: true },
        galleryItems: { type: Array as PropType<IGalleryItem[]>, default: () => [] },
        customChartGallery: { type: Array as PropType<IGalleryItem[]>, default: () => [] }
    },
    emits: ['settingChanged'],
    data() {
        return {
            selectedDescriptor: {}
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
    watch: {},
    async created() {},
    beforeMount() {
        if (this.propWidget.type === 'html' && this.propWidget.settings.isCustomDashboardHeader) {
            this.selectedDescriptor = { ...this.descriptor }
        }
    },
    methods: {
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
