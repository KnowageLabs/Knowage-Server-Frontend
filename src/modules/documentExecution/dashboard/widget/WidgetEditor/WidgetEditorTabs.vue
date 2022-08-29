<template>
    <TabView :activeIndex="activeIndex">
        <TabPanel :header="$t('common.data')">
            <WidgetEditorDataTab :propWidget="propWidget" :datasets="datasets" :selectedDatasets="selectedDatasets" @datasetSelected="$emit('datasetSelected', $event)" data-test="data-tab"></WidgetEditorDataTab>
        </TabPanel>
        <TabPanel :header="$t('common.settings')">
            <WidgetEditorSettingsTab :propWidget="propWidget"></WidgetEditorSettingsTab>
        </TabPanel>
    </TabView>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of managing the widget editing sections.
 */
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset } from '../../Dashboard'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import WidgetEditorDataTab from './WidgetEditorDataTab/WidgetEditorDataTab.vue'
import WidgetEditorSettingsTab from './WidgetEditorSettingsTab/WidgetEditorSettingsTab.vue'

export default defineComponent({
    name: 'widget-editor-tabs',
    components: { TabView, TabPanel, WidgetEditorDataTab, WidgetEditorSettingsTab },
    props: { propWidget: { type: Object as PropType<IWidget>, required: true }, datasets: { type: Array as PropType<IDataset[]> }, selectedDatasets: { type: Array as PropType<IDataset[]> } },
    emits: ['datasetSelected'],
    data() {
        return {
            activeIndex: 0
        }
    }
})
</script>