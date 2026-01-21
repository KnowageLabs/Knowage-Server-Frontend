<template>
    <div class="spacer-widget-settings-container">
        <SpacerWidgetSettingsAccordion v-if="widgetModel" :widget-model="widgetModel" :settings="descriptor.settings[setting]" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '../../../Dashboard'
import descriptor from './SpacerWidgetSettingsDescriptor.json'
import SpacerWidgetSettingsAccordion from './SpacerWidgetSettingsAccordion.vue'

export default defineComponent({
    name: 'spacer-widget-settings-container',
    components: {
        SpacerWidgetSettingsAccordion
    },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedSetting: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]> },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            descriptor,
            setting: ''
        }
    },
    watch: {
        selectedSetting() {
            this.loadSelectedSetting()
        }
    },
    created() {
        this.loadSelectedSetting()
    },
    methods: {
        loadSelectedSetting() {
            this.setting = this.selectedSetting
        }
    }
})
</script>

<style lang="scss" scoped>
.spacer-widget-settings-container {
    width: 100%;
    height: 100%;
}
</style>
