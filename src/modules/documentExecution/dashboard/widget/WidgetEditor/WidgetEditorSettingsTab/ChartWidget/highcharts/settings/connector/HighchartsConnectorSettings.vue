<template>
    <div v-if="seriesSettings" class="p-ai-center kn-flex p-p-4">
        <form class="p-fluid p-formgrid p-grid">
            <div class="p-col-12 p-grid">
                <div class="p-field p-col-12 p-md-6">
                    <WidgetEditorColorPicker :initial-value="seriesSettings.connectorColor" :label="$t('dashboard.widgetEditor.highcharts.connector.connectorColor')" @change="onConnectorColorChanged($event)"></WidgetEditorColorPicker>
                </div>
                <div class="p-field p-col-12 p-md-6">
                    <span class="p-float-label">
                        <InputNumber v-model="seriesSettings.connectorWidth" class="kn-material-input p-inputtext-sm" />
                        <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.connector.connectorWidth') }}</label>
                    </span>
                </div>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import InputNumber from 'primevue/inputnumber'
import WidgetEditorColorPicker from '../../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'highcharts-connector-settings',
    components: { InputNumber, WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true } },
    emits: [],
    data() {
        return {
            seriesSettings: null as any
        }
    },
    mounted() {
        this.loadSeriesSettings()
    },
    methods: {
        loadSeriesSettings() {
            if (this.widgetModel?.settings.chartModel?.model?.plotOptions) this.seriesSettings = this.widgetModel.settings.chartModel.model.plotOptions.series
        },
        onConnectorColorChanged(event: string | null) {
            if (!event || !this.seriesSettings) return
            this.seriesSettings.connectorColor = event
        }
    }
})
</script>
