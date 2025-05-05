<template>
    <div v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.type === 'balloons' && legendVizualizationSettings.visualizationType.balloonConf && layerLegendData">
        <div v-if="layerLegendData.type === LEGEND_DATA_TYPE.BALLOONS_INTERVALS" class="balloons-legend-table">
            <div class="balloons-legend-header">{{ $t('dashboard.widgetEditor.map.legend.numberOfClasses') }}: {{ layerLegendData.numberOfClasses }}</div>
            <div class="balloons-legend-row balloons-legend-title-row">
                <span>{{ $t('dashboard.widgetEditor.map.legend.minValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.maxValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.intervalSize') }}</span>
            </div>
            <div v-for="(interval, index) in layerLegendData.intervals" :key="index" class="balloons-legend-row">
                <span>{{ formatValue(interval.minValue) }}</span>
                <span>{{ formatValue(interval.maxValue) }}</span>
                <span>{{ formatValue(interval.size, true) }}</span>
            </div>
        </div>
        <div v-else-if="layerLegendData.type === LEGEND_DATA_TYPE.BALLOONS_QUANTILES" class="balloons-legend-table">
            <div class="balloons-legend-header">{{ $t('dashboard.widgetEditor.map.legend.numberOfClasses') }}: {{ layerLegendData.qunatileMappings?.length }}</div>
            <div class="balloons-legend-row balloons-legend-title-row">
                <span>{{ $t('dashboard.widgetEditor.map.legend.minValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.maxValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.quantileSize') }}</span>
            </div>
            <div v-for="(quantileInfo, index) in layerLegendData.qunatileMappings" :key="index" class="balloons-legend-row">
                <span>{{ formatValue(quantileInfo.min) }}</span>
                <span>{{ formatValue(quantileInfo.max) }}</span>
                <span>{{ formatValue(quantileInfo.size, true) }}</span>
            </div>
        </div>
        <div v-else-if="layerLegendData.type === LEGEND_DATA_TYPE.BALLOONS_RANGES" class="balloons-legend-table">
            <div class="balloons-legend-header">{{ $t('dashboard.widgetEditor.map.legend.numberOfRanges') }}: {{ layerLegendData.ranges?.length }}</div>
            <div class="balloons-legend-row balloons-legend-title-row">
                <span>{{ $t('dashboard.widgetEditor.map.legend.minValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.maxValue') }}</span>
                <span>{{ $t('common.size') }}</span>
                <span>{{ $t('common.color') }}</span>
            </div>
            <div v-for="(rangeInfo, index) in layerLegendData.ranges" :key="index" class="balloons-legend-row">
                <span>{{ formatValue(rangeInfo.min) }}</span>
                <span>{{ formatValue(rangeInfo.max) }}</span>
                <span>{{ formatValue(rangeInfo.size, true) }}</span>
                <div class="ranges-color-preview" :style="{ backgroundColor: rangeInfo.color }"></div>
            </div>
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
        },
        formatValue(value: number, integer: boolean = false): string {
            if (!isFinite(value)) return 'N/A'
            else if (integer) return Math.round(value).toString()
            return value.toFixed(2)
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
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-top: 1px solid #eee;
    word-break: break-word;
    gap: 1rem;
}

.balloons-legend-row span,
.balloons-legend-row div {
    flex: 1;
    min-width: 0;
}

.ranges-color-preview {
    width: 15px;
    height: 15px;
    border: 1px solid #ccc;
    border-radius: 2px;
    flex: 0 0 15px;
}

.balloons-legend-title-row {
    font-weight: bold;
    background-color: #f0f0f0;
    border-top: none;
}
</style>
