<template>
    <div v-show="widgetModel">
        <MapSettingsAccordion v-show="selectedSetting || isSearchActive" :widgetModel="widgetModel" :settings="activeSettings" :datasets="datasets" :selectedDatasets="selectedDatasets" :variables="variables" :dashboardId="dashboardId" :layers="layers"></MapSettingsAccordion>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { ILayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import descriptor from './MapSettingsDescriptor.json'
import MapSettingsAccordion from './MapSettingsAccordion.vue'

export default defineComponent({
    name: 'map-widget-settings-container',
    components: { MapSettingsAccordion },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedSetting: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true },
        layers: { type: Array as PropType<ILayer[]>, required: true }
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
