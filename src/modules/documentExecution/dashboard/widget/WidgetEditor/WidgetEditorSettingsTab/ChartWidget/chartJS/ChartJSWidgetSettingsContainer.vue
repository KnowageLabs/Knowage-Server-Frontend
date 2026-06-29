<template>
    <div v-show="widgetModel">
        <ChartJSWidgetSettingsAccordion v-show="selectedSetting || isSearchActive" :widget-model="widgetModel" :settings="activeSettings" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId"></ChartJSWidgetSettingsAccordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from './ChartJSWidgetSettingsDescriptor.json'
import ChartJSWidgetSettingsAccordion from './ChartJSWidgetSettingsAccordion.vue'

export default defineComponent({
    name: 'chart-js-widget-settings-container',
    components: { ChartJSWidgetSettingsAccordion },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedSetting: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    inject: {
        widgetSettingsSearch: { from: 'widgetSettingsSearch', default: null }
    },
    data() {
        return {
            descriptor
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
