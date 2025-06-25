<template>
    <div v-if="legendSettings">
        <div class="p-formgrid p-grid p-p-3">
            <q-input dense class="p-lg-4" filled v-model="legendSettings.title" :label="$t('common.title')" disable readonly />

            <span class="p-field p-float-label p-col-12 p-lg-6 p-fluid">
                <Dropdown v-model="legendSettings.position" class="kn-material-input" :options="descriptor.positionOptions" option-value="value" :disabled="legendSettingsDisabled" @change="onLegendPositionChange()">
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
                <label class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.position') }} </label>
            </span>
        </div>

        <hr />

        <div class="p-formgrid p-grid p-col-12 p-p-4" v-for="(vizualizationTypeLegendSettings, index) in legendSettings.visualizationTypes" :key="index">
            <MapLegendVisualizationTypeSettings :prop-visualization-type-legend-settings="vizualizationTypeLegendSettings" :disabled="legendSettingsDisabled"></MapLegendVisualizationTypeSettings>

            <hr class="kn-width-full p-my-2" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLegend } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import Dropdown from 'primevue/dropdown'
import descriptor from './MapLegendSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import MapLegendVisualizationTypeSettings from './MapLegendVisualizationTypeSettings.vue'

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
    watch: {
        widgetModel: {
            handler(newVal) {
                if (newVal?.settings?.legend) {
                    this.loadLegendSettings()
                }
            },
            deep: true,
            immediate: true
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadLegendSettings()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('mapFieldsUpdated', this.loadLegendSettings)
        },
        removeEventListeners() {
            emitter.off('mapFieldsUpdated', this.loadLegendSettings)
        },
        loadLegendSettings() {
            if (this.widgetModel?.settings?.legend) this.legendSettings = this.widgetModel.settings.legend
        },
        onLegendPositionChange() {
            if (!this.legendSettings) return
            this.legendSettings.positionX = 0
            this.legendSettings.positionY = 0
        }
    }
})
</script>
