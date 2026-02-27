<template>
    <q-toolbar>
        <q-tabs v-model="activeTab" dense inline-label class="text-dark">
            <q-tab v-if="propWidget && !['selection', 'image', 'spacer'].includes(propWidget.type)" name="data" :label="$t(propWidget.type === 'map' ? 'common.layers' : 'common.data')" />
            <q-tab name="settings" :label="$t('common.settings')" />
        </q-tabs>
    </q-toolbar>

    <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel v-if="propWidget && !['selection', 'image', 'spacer'].includes(propWidget.type)" name="data" class="q-pa-md">
            <MapWidgetLayersTab v-if="propWidget.type === 'map'" :prop-widget="propWidget" :datasets="datasets" :selected-datasets="selectedDatasets" :layers="layers" :variables="variables" :dashboard-id="dashboardId"></MapWidgetLayersTab>
            <WidgetEditorDataTab v-else :prop-widget="propWidget" :datasets="datasets" :variables="variables" :selected-datasets="selectedDatasets" data-test="data-tab" @datasetSelected="$emit('datasetSelected', $event)"></WidgetEditorDataTab>
        </q-tab-panel>
        <q-tab-panel name="settings" class="q-pa-md">
            <WidgetEditorSettingsTab :prop-widget="propWidget" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :layers="layers" @settingChanged="$emit('settingChanged', $event)"></WidgetEditorSettingsTab>
        </q-tab-panel>
    </q-tab-panels>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of managing the widget editing sections.
 */
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '../../Dashboard'
import { ILayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import WidgetEditorDataTab from './WidgetEditorDataTab/WidgetEditorDataTab.vue'
import WidgetEditorSettingsTab from './WidgetEditorSettingsTab/WidgetEditorSettingsTab.vue'
import MapWidgetLayersTab from './MapWidget/MapWidgetLayersTab.vue'
import { AxiosResponse } from 'axios'

export default defineComponent({
    name: 'widget-editor-tabs',
    components: { WidgetEditorDataTab, WidgetEditorSettingsTab, MapWidgetLayersTab },
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
            activeTab: 'data',
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

<style lang="scss" scoped>
.widget-editor-tabs-layout {
    // :deep(.q-header) {
    //     box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    // }

    // :deep(.q-page-container) {
    //     height: 100%;
    // }

    // :deep(.q-tab-panels) {
    //     height: 100%;
    // }

    // :deep(.q-tab-panel) {
    //     height: 100%;
    //     overflow-y: auto;
    // }
}
</style>
