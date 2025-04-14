<template>
    <div v-if="legendSettings">
        <div class="p-formgrid p-grid p-p-3">
            <span class="p-field p-float-label p-col-12 p-lg-4 p-fluid">
                <Dropdown v-model="legendSettings.position" class="kn-material-input" :options="descriptor.positionOptions" option-value="value" :disabled="legendSettingsDisabled">
                    <template #value="slotProps">
                        <div>
                            <span>{{ getTranslatedLabel(slotProps.value, descriptor.positionOptions, $t) }}</span>
                        </div>
                    </template>
                    <template #option="slotProps">
                        <div>
                            <span>{{ $t(slotProps.option.label) }}</span>
                        </div>
                    </template>
                </Dropdown>
                <label for="attributes" class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.visualizationType.alignment') }} </label>
            </span>
            <span class="p-field p-float-label p-col-12 p-lg-4 p-fluid">
                <Dropdown v-model="legendSettings.alignment" class="kn-material-input" :options="descriptor.alignmentOptions" option-value="value" :disabled="legendSettingsDisabled">
                    <template #value="slotProps">
                        <div>
                            <span>{{ getTranslatedLabel(slotProps.value, descriptor.alignmentOptions, $t) }}</span>
                        </div>
                    </template>
                    <template #option="slotProps">
                        <div>
                            <span>{{ $t(slotProps.option.label) }}</span>
                        </div>
                    </template>
                </Dropdown>
                <label for="attributes" class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.position') }} </label>
            </span>
        </div>

        <hr />

        <div class="p-formgrid p-grid p-p-4">
            <MapLegendVisualizationTypeSettings v-for="(vizualizationTypeLegendSettings, index) in legendSettings.visualizationTypes" :key="index" :prop-visualization-type-legend-settings="vizualizationTypeLegendSettings" :disabled="legendSettingsDisabled"></MapLegendVisualizationTypeSettings>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLegend } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import Dropdown from 'primevue/dropdown'
import descriptor from './MapLegendSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import MapLegendVisualizationTypeSettings from './MapLegendVisualizationTypeSettings.vue'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'

export default defineComponent({
    name: 'map-legend-settings',
    components: { Dropdown, WidgetEditorStyleToolbar, MapLegendVisualizationTypeSettings },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            legendSettings: null as IMapWidgetLegend | null,
            getTranslatedLabel
        }
    },
    computed: {
        legendSettingsDisabled() {
            return !this.widgetModel || !this.widgetModel.settings.legend.enabled
        }
    },
    created() {
        this.loadLegendSettings()
    },
    methods: {
        loadLegendSettings() {
            if (this.widgetModel?.settings?.legend) this.legendSettings = this.widgetModel.settings.legend
            console.log('------- LOADED SETTINGS: ', this.legendSettings)
        }
    }
})
</script>
