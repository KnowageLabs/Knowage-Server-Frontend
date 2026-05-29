<template>
    <div v-if="heatmapPlotOptions" class="q-px-md q-pb-md">
        <div class="row items-center q-col-gutter-sm q-mb-sm">
            <div class="col-12">
                <q-toggle v-model="heatmapPlotOptions.connectNulls" :label="$t('dashboard.widgetEditor.highcharts.heatmap.nullValues.connectNulls')" dense @update:model-value="modelChanged" />
            </div>
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="heatmapPlotOptions.nullColor" :label="$t('dashboard.widgetEditor.highcharts.heatmap.nullValues.nullColor')" @change="onSelectionColorChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'highcharts-heatmap-null-settings',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            heatmapPlotOptions: null as any
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            if (this.widgetModel.settings?.chartModel?.model?.plotOptions) this.heatmapPlotOptions = this.widgetModel.settings.chartModel.model.plotOptions.heatmap
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onSelectionColorChanged(event: string | null) {
            if (!event || !this.heatmapPlotOptions) return
            this.heatmapPlotOptions.nullColor = event
            this.modelChanged()
        }
    }
})
</script>
