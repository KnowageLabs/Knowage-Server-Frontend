<template>
    <div v-if="vizualizationTypeLegendSettings && vizualizationTypeLegendSettings.visualizationType" class="q-pa-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
                <q-input dense outlined v-model="vizualizationTypeLegendSettings.visualizationType.label" :label="$t('common.name')" disable />
            </div>
            <div class="col-6">
                <q-input dense outlined v-model="vizualizationTypeLegendSettings.visualizationType.type" :label="$t('common.type')" disable />
            </div>
        </div>
        <div class="row q-col-gutter-sm">
            <div class="col-12">
                <q-input outlined v-model="vizualizationTypeLegendSettings.text" type="textarea" :label="$t('common.text')" :rows="2" maxlength="500" counter />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import descriptor from './MapLegendSettingsDescriptor.json'

export default defineComponent({
    name: 'map-legend-visualiztion-type-settings',
    components: {},
    props: { propVisualizationTypeLegendSettings: { type: Object as PropType<IMapWidgetVisualizationTypeLegendSettings>, required: true }, disabled: { type: Boolean } },
    data() {
        return {
            descriptor,
            vizualizationTypeLegendSettings: null as IMapWidgetVisualizationTypeLegendSettings | null
        }
    },
    watch: {
        propVisualizationTypeLegendSettings() {
            this.loadLegendSettings()
        }
    },
    created() {
        this.loadLegendSettings()
    },
    methods: {
        loadLegendSettings() {
            this.vizualizationTypeLegendSettings = this.propVisualizationTypeLegendSettings
        }
    }
})
</script>
