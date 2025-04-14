<template>
    <div v-if="vizualizationTypeLegendSettings">
        {{ vizualizationTypeLegendSettings }}
        <div class="p-formgrid p-grid p-p-4">
            <q-input dense class="col" filled v-model="vizualizationTypeLegendSettings.title" :label="$t('dashboard.widgetEditor.map.legendTitle')" />
        </div>

        <hr />

        <div class="p-formgrid p-grid p-p-4">
            <q-input filled class="col" v-model="vizualizationTypeLegendSettings.text" type="textarea" :label="t('dashboard.widgetEditor.map.legendText')" :rows="4" maxlength="500" counter />
        </div>
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
