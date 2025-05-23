<template>
    <TabView :active-index="activeIndex">
        <TabPanel v-if="propWidget && propWidget.type !== 'selection' && propWidget.type !== 'image'" :header="$t(propWidget.type === 'map' ? 'common.layers' : 'common.data')">
            <MapWidgetLayersTab v-if="propWidget.type === 'map'" :prop-widget="propWidget" :datasets="datasets" :selected-datasets="selectedDatasets" :layers="layers" :variables="variables"></MapWidgetLayersTab>
            <WidgetEditorDataTab v-else :prop-widget="propWidget" :datasets="datasets" :variables="variables" :selected-datasets="selectedDatasets" data-test="data-tab" @datasetSelected="$emit('datasetSelected', $event)"></WidgetEditorDataTab>
        </TabPanel>
        <TabPanel :header="$t('common.settings')">
            <WidgetEditorSettingsTab :prop-widget="propWidget" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :layers="layers" @settingChanged="$emit('settingChanged', $event)"></WidgetEditorSettingsTab>
        </TabPanel>
    </TabView>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of managing the widget editing sections.
 */
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '../../Dashboard'
import { ILayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import WidgetEditorDataTab from './WidgetEditorDataTab/WidgetEditorDataTab.vue'
import WidgetEditorSettingsTab from './WidgetEditorSettingsTab/WidgetEditorSettingsTab.vue'
import MapWidgetLayersTab from './MapWidget/MapWidgetLayersTab.vue'
import { AxiosResponse } from 'axios'

export default defineComponent({
    name: 'widget-editor-tabs',
    components: { TabView, TabPanel, WidgetEditorDataTab, WidgetEditorSettingsTab, MapWidgetLayersTab },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    emits: ['datasetSelected', 'settingChanged'],
    data() {
        return {
            activeIndex: 0,
            layers: [] as ILayer[]
        }
    },
    created() {
        if (this.propWidget.type === 'map') this.loadLayers()
    },
    methods: {
        async loadLayers() {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/layers')
                .then((response: AxiosResponse<any>) => (this.layers = response.data.root))
                .catch(() => {})
        }
    }
})
</script>
