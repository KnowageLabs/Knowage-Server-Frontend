<template>
    <div v-show="widgetModel">
        <PivotTableSettingsAccordion v-show="selectedSetting" :widget-model="widgetModel" :settings="descriptor.settings[selectedSetting]" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></PivotTableSettingsAccordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from './cePivotTableSettingsDescriptor.json'
import PivotTableSettingsAccordion from '../PivotTableWidget/PivotTableSettingsAccordion.vue'

export default defineComponent({
    name: 'pivot-table-settings-container',
    components: { PivotTableSettingsAccordion },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedSetting: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            descriptor
        }
    },
    created() {},
    methods: {}
})
</script>
