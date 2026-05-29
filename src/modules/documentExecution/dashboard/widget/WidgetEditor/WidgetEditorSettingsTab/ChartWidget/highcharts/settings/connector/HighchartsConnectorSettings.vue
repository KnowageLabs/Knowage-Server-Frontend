<template>
    <div v-if="seriesSettings" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="seriesSettings.connectorColor" :label="$t('dashboard.widgetEditor.highcharts.connector.connectorColor')" @change="onConnectorColorChanged($event)" />
            </div>
            <div class="col-6">
                <q-input v-model.number="seriesSettings.connectorWidth" type="number" :label="$t('dashboard.widgetEditor.highcharts.connector.connectorWidth')" outlined dense />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import WidgetEditorColorPicker from '../../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'highcharts-connector-settings',
    components: { WidgetEditorColorPicker },
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
