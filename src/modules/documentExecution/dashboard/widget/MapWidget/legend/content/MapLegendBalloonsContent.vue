<template>
    <div v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.type === 'balloons' && legendVizualizationSettings.visualizationType.balloonConf && layerLegendData">
        <div v-if="legendItems.length" class="balloons-legend-list">
            <div v-for="(legendItem, index) in legendItems" :key="index" class="balloons-legend-item">
                <span class="balloons-legend-dot" :style="getLegendDotStyle(legendItem.color, legendItem.size)"></span>
                <span class="balloons-legend-label">{{ legendItem.label }}</span>
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
    computed: {
        legendItems() {
            if (!this.layerLegendData) return []

            const defaultColor = this.legendVizualizationSettings?.visualizationType?.balloonConf?.style?.color ?? '#4caf50'

            if (this.layerLegendData.type === LEGEND_DATA_TYPE.BALLOONS_INTERVALS) {
                return (this.layerLegendData.intervals ?? []).map((interval: any) => ({
                    color: defaultColor,
                    size: interval.size,
                    label: formatMapLegendRangeLabel(interval.minValue, interval.maxValue)
                }))
            }

            if (this.layerLegendData.type === LEGEND_DATA_TYPE.BALLOONS_QUANTILES) {
                return (this.layerLegendData.qunatileMappings ?? []).map((quantileInfo: any) => ({
                    color: defaultColor,
                    size: quantileInfo.size,
                    label: formatMapLegendRangeLabel(quantileInfo.min, quantileInfo.max, quantileInfo.min === Number.NEGATIVE_INFINITY, !Number.isFinite(quantileInfo.max))
                }))
            }

            if (this.layerLegendData.type === LEGEND_DATA_TYPE.BALLOONS_RANGES) {
                const rawThresholds = this.legendVizualizationSettings?.visualizationType?.balloonConf?.properties?.thresholds ?? []
                return (this.layerLegendData.ranges ?? [])
                    .map((rangeInfo: any, index: number) => ({ rangeInfo, rawThreshold: rawThresholds[index] }))
                    .sort((left: any, right: any) => left.rangeInfo.min - right.rangeInfo.min)
                    .map(({ rangeInfo, rawThreshold }: any) => ({
                        color: rangeInfo.color ?? defaultColor,
                        size: rangeInfo.size,
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
        getLegendDotStyle(color: string, size?: number) {
            const dotSize = Math.max(12, Math.min(18, Math.round(size ?? 12)))
            return {
                backgroundColor: color || 'transparent',
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                flexBasis: `${dotSize}px`
            }
        }
    }
}
</script>

<style scoped>
.balloons-legend-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.balloons-legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 20px;
}

.balloons-legend-dot {
    border: 1px solid #222;
    border-radius: 50%;
    flex: 0 0 12px;
}

.balloons-legend-label {
    line-height: 1.25;
}
</style>
