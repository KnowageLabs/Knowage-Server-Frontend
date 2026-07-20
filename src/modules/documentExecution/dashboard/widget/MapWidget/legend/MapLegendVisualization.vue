<template>
    <div v-if="legendVizualizationSettings" class="map-legend-visualization">
        <div v-if="legendVizualizationSettings.text" class="map-legend-text">
            {{ legendVizualizationSettings.text }}
        </div>

        <div class="map-legend-marker-row" v-if="legendVizualizationSettings.visualizationType && ['markers', 'clusters'].includes(legendVizualizationSettings.visualizationType.type)">
            <div class="map-legend-marker-preview">
                <MapLegendMarkerContent :prop-map-widget-legend-visualization="legendVizualizationSettings"></MapLegendMarkerContent>
            </div>
        </div>

        <MapLegendBalloonsContent v-if="legendVizualizationSettings.visualizationType?.type === 'balloons'" :prop-map-widget-legend-visualization="legendVizualizationSettings" :layer-legend-data="layerLegendData"> </MapLegendBalloonsContent>
        <MapLegendChartsContent v-else-if="legendVizualizationSettings.visualizationType?.type === 'pies'" :prop-map-widget-legend-visualization="legendVizualizationSettings" :layer-legend-data="layerLegendData"> </MapLegendChartsContent>
        <MapLegendHeatmapContent v-else-if="legendVizualizationSettings.visualizationType?.type === 'heatmap'" :prop-map-widget-legend-visualization="legendVizualizationSettings" :layer-legend-data="layerLegendData"> </MapLegendHeatmapContent>
        <MapLegendChoroplethContent v-else-if="legendVizualizationSettings.visualizationType?.type === 'choropleth'" :prop-map-widget-legend-visualization="legendVizualizationSettings" :layer-legend-data="layerLegendData"> </MapLegendChoroplethContent>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings } from '../../../interfaces/mapWidget/DashboardMapWidget'
import MapLegendMarkerContent from './content/MapLegendMarkerContent.vue'
import MapLegendBalloonsContent from './content/MapLegendBalloonsContent.vue'
import MapLegendChartsContent from './content/MapLegendChartsContent.vue'
import MapLegendHeatmapContent from './content/MapLegendHeatmapContent.vue'
import MapLegendChoroplethContent from './content/MapLegendChoroplethContent.vue'

export default {
    name: 'map-legend-visualization',
    components: { MapLegendMarkerContent, MapLegendBalloonsContent, MapLegendChartsContent, MapLegendHeatmapContent, MapLegendChoroplethContent },
    props: {
        propMapWidgetLegendVisualization: { type: Object as PropType<IMapWidgetVisualizationTypeLegendSettings>, required: true },
        legendData: { type: Object as PropType<Record<string, any> | null | undefined>, required: true }
    },
    data() {
        return {
            legendVizualizationSettings: null as IMapWidgetVisualizationTypeLegendSettings | null,
            layerLegendData: null as any
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
            this.loadLegendForTheLayer()
        },
        loadLegendForTheLayer() {
            if (!this.legendData || !this.legendVizualizationSettings?.visualizationType?.id) {
                this.layerLegendData = null
                return
            }
            this.layerLegendData = this.legendData?.[this.legendVizualizationSettings.visualizationType.id] ?? null
        }
    }
}
</script>

<style scoped>
.map-legend-visualization {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.map-legend-text {
    width: 100%;
    line-height: 1.35;
    color: #333;
    background-color: #f9f9f9;
    border-radius: 6px;
    padding: 0.375rem 0.5rem;
    box-shadow: none;
    font-size: 0.75rem;
}

.map-legend-marker-row {
    display: flex;
    align-items: center;
    min-height: 24px;
}

.map-legend-marker-preview {
    display: flex;
    align-items: center;
}
</style>
