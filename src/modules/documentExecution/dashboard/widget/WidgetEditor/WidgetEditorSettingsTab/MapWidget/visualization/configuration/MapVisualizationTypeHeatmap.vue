<template>
    <div v-if="heatmapConfiguration" class="p-formgrid p-grid p-mt-2">
        <div class="p-float-label p-col-12 p-lg-4 p-fluid">
            <InputNumber v-model="heatmapConfiguration.radius" class="kn-material-input" />
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.radius') }}</label>
        </div>
        <div class="p-float-label p-col-12 p-lg-4 p-fluid">
            <InputNumber v-model="heatmapConfiguration.blur" class="kn-material-input" />
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.blur') }}</label>
        </div>
        <div class="p-float-label p-col-12 p-lg-4 p-fluid">
            <InputNumber v-model="heatmapConfiguration.maxZoom" class="kn-material-input" />
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.maxZoom') }}</label>
        </div>
    </div>
</template>

<script lang="ts">
import { IMapWidgetVisualizationTypeHeatmap } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { defineComponent, PropType } from 'vue'
import descriptor from '../MapVisualizationTypeDescriptor.json'
import InputNumber from 'primevue/inputnumber'

export default defineComponent({
    name: 'map-visualization-type-heatmap',
    components: { InputNumber },
    props: { propHeatmapConfiguration: { type: Object as PropType<IMapWidgetVisualizationTypeHeatmap | null>, required: true } },
    emits: [],
    data() {
        return {
            descriptor,
            heatmapConfiguration: null as IMapWidgetVisualizationTypeHeatmap | null
        }
    },
    watch: {
        propHeatmapConfiguration() {
            this.loadHeatmapConfiguration()
        }
    },
    created() {
        this.loadHeatmapConfiguration()
    },
    methods: {
        loadHeatmapConfiguration() {
            this.heatmapConfiguration = this.propHeatmapConfiguration
        }
    }
})
</script>
