<template>
    <div v-if="markerSettings" class="p-ai-center kn-flex p-p-4">
        <form class="p-fluid p-formgrid p-grid">
            <div class="p-col-12 p-grid">
                <div class="p-field p-col-12 p-md-4 p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.marker.startMarkerType') }}</label>
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <Dropdown v-model="markerSettings.lowMarker.symbol" class="kn-material-input kn-flex" :options="descriptor.markerTypes" option-value="value">
                            <template #value="slotProps">
                                <div>
                                    <span>{{ getTranslatedLabel(slotProps.value, descriptor.markerTypes, $t) }}</span>
                                </div>
                            </template>
                            <template #option="slotProps">
                                <div>
                                    <span>{{ $t(slotProps.option.label) }}</span>
                                </div>
                            </template>
                        </Dropdown>
                    </div>
                </div>
                <div class="p-field p-col-12 p-md-4 p-mt-5">
                    <WidgetEditorColorPicker :initial-value="markerSettings.lowMarker.fillColor" :label="$t('dashboard.widgetEditor.highcharts.marker.startMarkerColor')" @change="onMarkerColorChanged($event, 'lowMarker')"></WidgetEditorColorPicker>
                </div>
                <div class="p-field p-col-12 p-md-4 p-mt-5">
                    <span class="p-float-label">
                        <InputNumber v-model="markerSettings.lowMarker.radius" class="kn-material-input p-inputtext-sm" />
                        <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.marker.startMarkerRadius') }}</label>
                    </span>
                </div>
            </div>

            <div class="p-col-12 p-grid">
                <div class="p-field p-col-12 p-md-4 p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.marker.endMarkerType') }}</label>
                    <div class="p-d-flex p-flex-row p-ai-center">
                        <Dropdown v-model="markerSettings.marker.symbol" class="kn-material-input kn-flex" :options="descriptor.markerTypes" option-value="value">
                            <template #value="slotProps">
                                <div>
                                    <span>{{ getTranslatedLabel(slotProps.value, descriptor.markerTypes, $t) }}</span>
                                </div>
                            </template>
                            <template #option="slotProps">
                                <div>
                                    <span>{{ $t(slotProps.option.label) }}</span>
                                </div>
                            </template>
                        </Dropdown>
                    </div>
                </div>
                <div class="p-field p-col-12 p-md-4 p-mt-5">
                    <WidgetEditorColorPicker :initial-value="markerSettings.marker.fillColor" :label="$t('dashboard.widgetEditor.highcharts.marker.endMarkerColor')" @change="onMarkerColorChanged($event, 'marker')"></WidgetEditorColorPicker>
                </div>
                <div class="p-field p-col-12 p-md-4 p-mt-5">
                    <span class="p-float-label">
                        <InputNumber v-model="markerSettings.marker.radius" class="kn-material-input p-inputtext-sm" />
                        <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.marker.endMarkerRadius') }}</label>
                    </span>
                </div>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsMarkerSettings } from '../../../../../../../interfaces/highcharts/DashboardHighchartsWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsMarkerSettingsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import WidgetEditorColorPicker from '../../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'highcharts-marker-settings',
    components: { Dropdown, InputNumber, WidgetEditorColorPicker },
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
