<template>
    <div v-if="legendVizualizationSettings" class="p-col-12">
        <textarea v-if="legendVizualizationSettings.text"> {{ legendVizualizationSettings.text }} </textarea>

        <div class="p-formgrid p-grid" v-if="legendVizualizationSettings.visualizationType">
            <div class="p-col-12 p-d-flex p-flex-row p-jc-around p-ai-center">
                <p class="target-property kn-flex">{{ legendVizualizationSettings.visualizationType.targetProperty }}</p>

                <MapLegendMarkerContent class="kn-flex" v-if="['markers', 'clusters'].includes(legendVizualizationSettings.visualizationType.type)" :prop-map-widget-legend-visualization="legendVizualizationSettings"></MapLegendMarkerContent>
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
import { LEGEND_DATA_TYPE } from '../LeafletHelper'
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
            LEGEND_DATA_TYPE,
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
            if (!this.legendData || !this.legendVizualizationSettings?.visualizationType?.id) return
            this.layerLegendData = this.legendData[this.legendVizualizationSettings.visualizationType.id]
        }
    }
}
</script>

<style scoped>
.target-property {
    margin: 0;
    padding: 0;
}
</style>
