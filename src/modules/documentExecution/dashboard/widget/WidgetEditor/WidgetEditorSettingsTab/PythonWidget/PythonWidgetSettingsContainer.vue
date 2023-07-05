<template>
    <div v-show="widgetModel">
        <PythonWidgetSettingsAccordion v-if="selectedSetting != 'Gallery'" v-show="selectedSetting" :widget-model="widgetModel" :settings="descriptor.settings[selectedSetting]" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></PythonWidgetSettingsAccordion>

        <HTMLWidgetSettingsGallery v-if="selectedSetting == 'Gallery'" v-show="selectedSetting" :widget-model="widgetModel" :html-gallery-prop="pythonGalleryProp" @galleryItemSelected="$emit('galleryItemSelected')"></HTMLWidgetSettingsGallery>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IGalleryItem } from '@/modules/documentExecution/Dashboard/Dashboard'
import descriptor from './PythonWidgetSettingsDescriptor.json'
import PythonWidgetSettingsAccordion from './PythonWidgetSettingsAccordion.vue'
import HTMLWidgetSettingsGallery from '../HTMLWidget/gallery/HTMLWidgetGallery.vue'

export default defineComponent({
    name: 'python-widget-settings-container',
    components: { PythonWidgetSettingsAccordion, HTMLWidgetSettingsGallery },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedSetting: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        pythonGalleryProp: { type: Array as PropType<IGalleryItem[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    emits: ['galleryItemSelected'],
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
