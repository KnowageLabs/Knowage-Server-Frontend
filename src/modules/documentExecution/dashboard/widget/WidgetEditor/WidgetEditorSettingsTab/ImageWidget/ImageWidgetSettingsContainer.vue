<template>
    <div v-show="widgetModel">
        <ImageWidgetSettingsAccordion v-if="setting != 'Gallery' || isSearchActive" :widget-model="widgetModel" :settings="activeSettings" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></ImageWidgetSettingsAccordion>

        <ImageWidgetGallery v-if="setting == 'Gallery'" :widget-model="widgetModel" :images-list-prop="imagesList" @uploadedImage="loadImages"></ImageWidgetGallery>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { IImage } from '@/modules/documentExecution/dashboard/interfaces/DashboardImageWidget'
import { mapActions } from 'pinia'
import { AxiosResponse } from 'axios'
import appStore from '@/App.store'
import descriptor from './ImageWidgetSettingsDescriptor.json'
import ImageWidgetSettingsAccordion from './ImageWidgetSettingsAccordion.vue'
import ImageWidgetGallery from './gallery/ImageWidgetGallery.vue'

export default defineComponent({
    name: 'image-widget-settings-container',
    components: { ImageWidgetSettingsAccordion, ImageWidgetGallery },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedSetting: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    emits: ['settingSelected'],
    inject: {
        widgetSettingsSearch: { from: 'widgetSettingsSearch', default: null }
    },
    data() {
        return {
            descriptor,
            imagesList: [] as IImage[],
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
            return this.descriptor?.settings?.[this.setting]
        }
    },
    watch: {
        selectedSetting() {
            this.loadSelectedSetting()
        }
    },
    created() {
        this.loadImages()
        this.loadSelectedSetting()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadSelectedSetting() {
            if (!this.selectedSetting) {
                this.setting = 'Gallery'
                this.$emit('settingSelected', this.setting)
            } else {
                this.setting = this.selectedSetting
            }
        },
        async loadImages() {
            this.setLoading(true)
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/images/listImages`)
                .then((response: AxiosResponse<any>) => (this.imagesList = response.data ? response.data.data : []))
                .catch(() => {})
            this.setLoading(false)
        }
    }
})
</script>
