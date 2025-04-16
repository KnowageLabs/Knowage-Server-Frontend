<template>
    <div v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.type === 'heatmap' && legendVizualizationSettings.visualizationType.heatmapConf">
        <div id="gradient-container"></div>
        <div id="gradient-labels">
            <span>{{ $t('common.low') }}</span
            ><span>{{ $t('common.high') }}</span>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings } from '../../../../interfaces/mapWidget/DashboardMapWidget'

export default {
    name: 'map-legend-heatmap-content',
    props: {
        propMapWidgetLegendVisualization: { type: Object as PropType<IMapWidgetVisualizationTypeLegendSettings>, required: true },
        layerLegendData: { type: Object as PropType<Record<string, any> | null | undefined>, required: true }
    },
    data() {
        return {
            legendVizualizationSettings: null as IMapWidgetVisualizationTypeLegendSettings | null
        }
    },
    computed: {},
    watch: {
        propMapWidgetLegendVisualization() {
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
#gradient-container {
    background: linear-gradient(to right, blue, cyan, lime, yellow, red);
    width: 100%;
    height: 15px;
    border: 1px solid #999;
    margin-bottom: 5px;
}

#gradient-labels {
    display: flex;
    justify-content: space-between;
    font-size: 1rem;
}
</style>
