<template>
    <div v-show="widgetModel && descriptor">
        <HTMLWidgetSettingsAccordion v-if="selectedSetting != 'Gallery' || isSearchActive" v-show="selectedSetting || isSearchActive" :widget-model="widgetModel" :settings="activeSettings" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></HTMLWidgetSettingsAccordion>

        <HTMLWidgetSettingsGallery v-if="selectedSetting == 'Gallery'" v-show="selectedSetting" :widget-model="widgetModel" :dashboard-id="dashboardId" :prop-gallery-items="propGalleryItems" @galleryItemSelected="$emit('galleryItemSelected')"></HTMLWidgetSettingsGallery>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable, IGalleryItem } from '@/modules/documentExecution/dashboard/Dashboard'
import htmlDescriptor from './HTMLWidgetSettingsDescriptor.json'
import customDashboardHeaderDescriptor from './CustomDashboardHeaderDescriptor.json'
import HTMLWidgetSettingsAccordion from './HTMLWidgetSettingsAccordion.vue'
import HTMLWidgetSettingsGallery from './gallery/HTMLWidgetGallery.vue'

export default defineComponent({
    name: 'html-widget-settings-container',
    components: { HTMLWidgetSettingsAccordion, HTMLWidgetSettingsGallery },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedSetting: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true },
        propGalleryItems: { type: Array as PropType<IGalleryItem[]>, required: true }
    },
    emits: ['galleryItemSelected'],
    inject: {
        widgetSettingsSearch: { from: 'widgetSettingsSearch', default: null }
    },
    data() {
        return {
            descriptor: null as any,
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
    created() {
        this.loadDescriptor()
    },
    methods: {
        loadDescriptor() {
            this.descriptor = this.widgetModel.settings.isCustomDashboardHeader ? customDashboardHeaderDescriptor : htmlDescriptor
        }
    }
})
</script>
