<template>
    <div v-if="vizualizationTypeLegendSettings && vizualizationTypeLegendSettings.visualizationType" class="p-formgrid p-grid p-col-12">
        <q-input dense class="p-lg-6" filled v-model="vizualizationTypeLegendSettings.visualizationType.layerName" :label="$t('common.name')" disable />
        <q-input dense class="p-lg-6" filled v-model="vizualizationTypeLegendSettings.visualizationType.type" :label="$t('common.type')" disable />

        <q-input filled class="p-lg-12" v-model="vizualizationTypeLegendSettings.text" type="textarea" :label="$t('common.text')" :rows="4" maxlength="500" counter />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import Dropdown from 'primevue/dropdown'
import descriptor from './MapLegendSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'map-legend-visualiztion-type-settings',
    components: { Dropdown, WidgetEditorStyleToolbar },
    props: { propVisualizationTypeLegendSettings: { type: Object as PropType<IMapWidgetVisualizationTypeLegendSettings>, required: true }, disabled: { type: Boolean } },
    data() {
        return {
            descriptor,
            vizualizationTypeLegendSettings: null as IMapWidgetVisualizationTypeLegendSettings | null,
            getTranslatedLabel
        }
    },

    created() {
        this.loadLegendSettings()
    },
    methods: {
        loadLegendSettings() {
            this.vizualizationTypeLegendSettings = this.propVisualizationTypeLegendSettings
            console.log('------- LOADED: ', this.vizualizationTypeLegendSettings)
        }
    }
})
</script>
