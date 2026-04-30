<template>
    <div v-show="widgetModel">
        <PythonWidgetSettingsAccordion v-if="selectedSetting != 'Gallery' || isSearchActive" v-show="selectedSetting || isSearchActive" :widget-model="widgetModel" :settings="activeSettings" :datasets="datasets" :selected-datasets="selectedDatasets" :dashboard-id="dashboardId"></PythonWidgetSettingsAccordion>

        <HTMLWidgetSettingsGallery v-if="selectedSetting == 'Gallery'" v-show="selectedSetting" :widget-model="widgetModel" :dashboard-id="dashboardId" :prop-gallery-items="propGalleryItems" @galleryItemSelected="$emit('galleryItemSelected')"></HTMLWidgetSettingsGallery>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IGalleryItem } from '@/modules/documentExecution/dashboard/Dashboard'
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
        dashboardId: { type: String, required: true },
        propGalleryItems: { type: Array as PropType<IGalleryItem[]>, required: true }
    },
    emits: ['galleryItemSelected'],
    inject: {
        widgetSettingsSearch: { from: 'widgetSettingsSearch', default: null }
    },
    data() {
        return {
            descriptor,
            setting: ''
        }
    },
    computed: {
        isSearchActive(): boolean {
            return ((this.widgetSettingsSearch as any) ?? '').length >= 3
        },
        activeSettings(): { title: string; type: string }[] | undefined {
            const search = (this.widgetSettingsSearch as any) ?? ''
            if (search.length >= 3 && this.descriptor?.settings) {
                const seen = new Set<string>()
                return (Object.values(this.descriptor.settings) as { title: string; type: string }[][]).flat().filter((s: { title: string; type: string }) => {
                    if (seen.has(s.type)) return false
                    seen.add(s.type)
                    return true
                })
            }
            return this.descriptor?.settings?.[this.selectedSetting]
        }
    },
    created() {},
    methods: {}
})
</script>
