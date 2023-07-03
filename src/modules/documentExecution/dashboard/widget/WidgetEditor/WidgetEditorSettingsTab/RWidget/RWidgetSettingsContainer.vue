<template>
    <div v-show="widgetModel">
        <RWidgetSettingsAccordion v-show="selectedSetting" :widget-model="widgetModel" :settings="descriptor.settings[selectedSetting]" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></RWidgetSettingsAccordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset } from '@/modules/documentExecution/Dashboard/Dashboard'
import descriptor from './RWidgetSettingsDescriptor.json'
import RWidgetSettingsAccordion from './RWidgetSettingsAccordion.vue'

export default defineComponent({
    name: 'r-widget-settings-container',
    components: { RWidgetSettingsAccordion },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedSetting: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true }
    },
    emits: [],
    data() {
        return {
            descriptor,
            setting: ''
        }
    },
    created() {},
    methods: {}
})
</script>
