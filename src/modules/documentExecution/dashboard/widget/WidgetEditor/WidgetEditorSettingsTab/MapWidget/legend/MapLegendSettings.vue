<template>
    <div v-if="legendSettings">
        <div class="q-px-md q-pb-sm">
            <div class="row q-col-gutter-sm q-mb-sm">
                <div class="col-4">
                    <q-input v-model="legendSettings.title" :label="$t('common.title')" outlined dense :disable="legendSettingsDisabled" />
                </div>
                <div class="col-4">
                    <q-select v-model="legendSettings.position" :options="descriptor.positionOptions" option-value="value" option-label="label" :label="$t('dashboard.widgetEditor.position')" emit-value map-options outlined dense :disable="legendSettingsDisabled" @update:model-value="onLegendPositionChange">
                        <template #selected-item="slotProps">
                            <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.positionOptions, $t) }}</span>
                        </template>
                        <template #option="slotProps">
                            <q-item v-bind="slotProps.itemProps">
                                <q-item-section
                                    ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                                >
                            </q-item>
                        </template>
                    </q-select>
                </div>
                <div class="col-4">
                    <q-input v-model.number="legendSettings.width" type="number" :label="$t('common.width') + ' (px)'" outlined dense :disable="legendSettingsDisabled" />
                </div>
            </div>
        </div>
        <q-separator />
        <div v-for="(vizualizationTypeLegendSettings, index) in legendSettings.visualizationTypes" :key="index">
            <MapLegendVisualizationTypeSettings :prop-visualization-type-legend-settings="vizualizationTypeLegendSettings" :disabled="legendSettingsDisabled"></MapLegendVisualizationTypeSettings>
            <q-separator />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLegend } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from './MapLegendSettingsDescriptor.json'
import MapLegendVisualizationTypeSettings from './MapLegendVisualizationTypeSettings.vue'
import { normalizeMapLegendSettings } from '../../../../MapWidget/MapWidgetInfoSettingsHelper'

export default defineComponent({
    name: 'map-legend-settings',
    components: { MapLegendVisualizationTypeSettings },
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
            if (this.widgetModel?.settings?.legend) this.legendSettings = normalizeMapLegendSettings(this.widgetModel, this.widgetModel.settings.legend)
        },
        onLegendPositionChange() {
            if (!this.legendSettings) return
            this.legendSettings.positionX = 0
            this.legendSettings.positionY = 0
        }
    }
})
</script>
