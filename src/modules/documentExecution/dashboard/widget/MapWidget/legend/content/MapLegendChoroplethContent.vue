<template>
    <div v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.type === 'choropleth' && legendVizualizationSettings.visualizationType.analysisConf && layerLegendData">
        <div v-if="legendItems.length" class="choropleth-legend-list">
            <div v-for="(legendItem, index) in legendItems" :key="index" class="choropleth-legend-item">
                <span class="choropleth-legend-dot" :style="getLegendDotStyle(legendItem.color)"></span>
                <span class="choropleth-legend-label">{{ legendItem.label }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings } from '../../../../interfaces/mapWidget/DashboardMapWidget'
import { LEGEND_DATA_TYPE } from '../../LeafletHelper'
import { formatMapLegendRangeLabel } from '../MapLegendFormattingHelper'

export default {
    name: 'map-legend-choropleth-content',
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
    computed: {
        legendItems() {
            if (!this.layerLegendData) return []

            const defaultColor = this.legendVizualizationSettings?.visualizationType?.analysisConf?.style?.color ?? '#4caf50'
            const colorGradients = this.layerLegendData?.colorGradients ?? []

            if (this.layerLegendData.type === LEGEND_DATA_TYPE.CHOROPLETH_INTERVALS) {
                return (this.layerLegendData.intervals ?? []).map((interval: any, index: number) => ({
                    color: colorGradients[index] ?? defaultColor,
                    label: formatMapLegendRangeLabel(interval.min, interval.max)
                }))
            }

            if (this.layerLegendData.type === LEGEND_DATA_TYPE.CHOROPLETH_QUANTILES) {
                return (this.layerLegendData.qunatileMappings ?? []).map((quantileInfo: any, index: number) => ({
                    color: colorGradients[index] ?? defaultColor,
                    label: formatMapLegendRangeLabel(quantileInfo.min, quantileInfo.max, quantileInfo.min === Number.NEGATIVE_INFINITY, !Number.isFinite(quantileInfo.max))
                }))
            }

            if (this.layerLegendData.type === LEGEND_DATA_TYPE.CHOROPLETH_RANGES) {
                const rawThresholds = this.legendVizualizationSettings?.visualizationType?.analysisConf?.properties?.thresholds ?? []
                return (this.layerLegendData.ranges ?? [])
                    .map((rangeInfo: any, index: number) => ({ rangeInfo, rawThreshold: rawThresholds[index] }))
                    .sort((left: any, right: any) => left.rangeInfo.min - right.rangeInfo.min)
                    .map(({ rangeInfo, rawThreshold }: any) => ({
                        color: rangeInfo.color ?? defaultColor,
                        label: formatMapLegendRangeLabel(rangeInfo.min, rangeInfo.max, rawThreshold?.from == null, rawThreshold?.to == null)
                    }))
            }

            return []
        }
    },
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
        },
        getLegendDotStyle(color: string) {
            return {
                backgroundColor: color || 'transparent'
            }
        }
    }
}
</script>

<style scoped>
.choropleth-legend-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.choropleth-legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 20px;
}

.choropleth-legend-dot {
    width: 12px;
    height: 12px;
    border: 1px solid #222;
    border-radius: 50%;
    flex: 0 0 12px;
}

.choropleth-legend-label {
    line-height: 1.25;
}
</style>
