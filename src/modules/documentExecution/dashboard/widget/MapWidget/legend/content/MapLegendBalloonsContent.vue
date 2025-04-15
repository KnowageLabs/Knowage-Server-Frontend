<template>
    <div v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.type === 'balloons' && legendVizualizationSettings.visualizationType.balloonConf && layerLegendData" class="balloons-legend-table">
        <div class="balloons-legend-header">{{ $t('dashboard.widgetEditor.map.legend.numberOfClasses') }}: {{ layerLegendData.numberOfClasses }}</div>
        <div class="balloons-legend-row legend-title-row">
            <span>{{ $t('dashboard.widgetEditor.map.legend.minValue') }}</span>
            <span>{{ $t('dashboard.widgetEditor.map.legend.maxValue') }}</span>
            <span>{{ $t('dashboard.widgetEditor.map.legend.intervalSize') }}</span>
        </div>
        <div v-for="(interval, index) in layerLegendData.intervals" :key="index" class="balloons-legend-row">
            <span>{{ interval.minValue }}</span>
            <span>{{ interval.maxValue }}</span>
            <span>{{ interval.size }}</span>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings } from '../../../../interfaces/mapWidget/DashboardMapWidget'
import { LEGEND_DATA_TYPE } from '../../LeafletHelper'

export default {
    name: 'map-legend-balloons-content',
    components: {},
    props: {
        propMapWidgetLegendVisualization: { type: Object as PropType<IMapWidgetVisualizationTypeLegendSettings>, required: true },
        layerLegendData: { type: Object as PropType<Record<string, any> | null | undefined>, required: true }
    },
    data() {
        return {
            LEGEND_DATA_TYPE,
            legendVizualizationSettings: null as IMapWidgetVisualizationTypeLegendSettings | null
        }
    },
    computed: {},
    watch: {
        propMapWidgetLegendVisualization() {
            this.loadLegendVisualizationSettings()
        },
        legendData() {
            this.loadLegendVisualizationSettings()
        }
    },
    mounted() {
        this.loadLegendVisualizationSettings()
    },
    methods: {
        loadLegendVisualizationSettings() {
            this.legendVizualizationSettings = this.propMapWidgetLegendVisualization
        }
    }
}
</script>

<style scoped>
.balloons-legend-table {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    box-sizing: border-box;
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    background-color: #fafafa;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.balloons-legend-header {
    font-weight: bold;
}

.balloons-legend-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    padding: 0.5rem 0;
    border-top: 1px solid #eee;
    word-break: break-word;
}

.legend-title-row {
    font-weight: bold;
    background-color: #f0f0f0;
    border-top: none;
}
</style>
