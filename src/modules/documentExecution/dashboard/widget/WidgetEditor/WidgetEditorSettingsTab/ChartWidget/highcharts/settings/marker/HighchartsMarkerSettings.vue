<template>
    <div v-if="markerSettings" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-4">
                <q-select v-model="markerSettings.lowMarker.symbol" :label="$t('dashboard.widgetEditor.highcharts.marker.startMarkerType')" emit-value map-options outlined dense :options="descriptor.markerTypes" option-value="value" option-label="label">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.markerTypes, $t) }}</span>
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
                <WidgetEditorColorPicker :initial-value="markerSettings.lowMarker.fillColor" :label="$t('dashboard.widgetEditor.highcharts.marker.startMarkerColor')" @change="onMarkerColorChanged($event, 'lowMarker')" />
            </div>
            <div class="col-4">
                <q-input v-model.number="markerSettings.lowMarker.radius" type="number" :label="$t('dashboard.widgetEditor.highcharts.marker.startMarkerRadius')" outlined dense />
            </div>
        </div>
        <q-separator class="q-mb-sm" />
        <div class="row q-col-gutter-sm">
            <div class="col-4">
                <q-select v-model="markerSettings.marker.symbol" :label="$t('dashboard.widgetEditor.highcharts.marker.endMarkerType')" emit-value map-options outlined dense :options="descriptor.markerTypes" option-value="value" option-label="label">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.markerTypes, $t) }}</span>
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
                <WidgetEditorColorPicker :initial-value="markerSettings.marker.fillColor" :label="$t('dashboard.widgetEditor.highcharts.marker.endMarkerColor')" @change="onMarkerColorChanged($event, 'marker')" />
            </div>
            <div class="col-4">
                <q-input v-model.number="markerSettings.marker.radius" type="number" :label="$t('dashboard.widgetEditor.highcharts.marker.endMarkerRadius')" outlined dense />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsMarkerSettings } from '../../../../../../../interfaces/highcharts/DashboardHighchartsWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsMarkerSettingsDescriptor.json'
import WidgetEditorColorPicker from '../../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'highcharts-marker-settings',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true } },
    emits: [],
    data() {
        return {
            descriptor,
            markerSettings: null as { marker: IHighchartsMarkerSettings; lowMarker: IHighchartsMarkerSettings } | null,
            getTranslatedLabel
        }
    },
    mounted() {
        this.loadMarkerSettings()
    },
    methods: {
        loadMarkerSettings() {
            if (this.widgetModel?.settings.chartModel?.model?.plotOptions) this.markerSettings = this.widgetModel.settings.chartModel.model.plotOptions.series
        },
        onMarkerColorChanged(event: string | null, type: 'lowMarker' | 'marker') {
            if (!event || !this.markerSettings) return
            this.markerSettings[type].fillColor = event
        }
    }
})
</script>
