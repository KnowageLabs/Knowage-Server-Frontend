<template>
    <div v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.type === 'heatmap' && legendVizualizationSettings.visualizationType.heatmapConf">
        <div>
            <div class="heatmap-legend-row heatmap-legend-title-row">
                <span>{{ $t('dashboard.widgetEditor.map.legend.minValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.maxValue') }}</span>
            </div>
            <div class="heatmap-legend-row">
                <span>{{ formatValue(minValue) }}</span>
                <span>{{ formatValue(maxValue) }}</span>
            </div>
        </div>

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
import { formatMapLegendNumber } from '../MapLegendFormattingHelper'

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
    computed: {
        minValue() {
            if (!this.layerLegendData || !this.layerLegendData.heatMapData) return null
            const minValue = Math.min(...this.layerLegendData.heatMapData.map((item) => item[2]))

            return minValue
        },
        maxValue() {
            if (!this.layerLegendData || !this.layerLegendData.heatMapData) return null
            const maxValue = Math.max(...this.layerLegendData.heatMapData.map((item) => item[2]))

            return maxValue
        }
    },
    watch: {
        propMapWidgetLegendVisualization() {
            this.loadLegendVisualizationSettings()
        },

        maxValue() {}
    },
    mounted() {
        this.loadLegendVisualizationSettings()
    },
    methods: {
        loadLegendVisualizationSettings() {
            this.legendVizualizationSettings = this.propMapWidgetLegendVisualization
        },
        formatValue(value: number | null): string {
            return formatMapLegendNumber(value)
        }
    }
}
</script>

<style scoped>
.heatmap-legend-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    padding: 0.35rem 0;
    border-top: 1px solid #eee;
    word-break: break-word;
    gap: 0.5rem;
}

.heatmap-legend-row span,
.heatmap-legend-row div {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
}

.heatmap-legend-title-row {
    font-weight: bold;
    background-color: #f0f0f0;
    border-top: none;
}

#gradient-container {
    background: linear-gradient(to right, blue, cyan, lime, yellow, red);
    width: 100%;
    height: 10px;
    border: 1px solid #999;
    margin: 4px 0;
}

#gradient-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
}
</style>
