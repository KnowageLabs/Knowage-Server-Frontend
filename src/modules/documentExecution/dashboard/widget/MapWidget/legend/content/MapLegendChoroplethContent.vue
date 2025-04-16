<template>
    <div v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.type === 'choropleth' && legendVizualizationSettings.visualizationType.analysisConf && layerLegendData">
        <div v-if="layerLegendData.type === LEGEND_DATA_TYPE.CHOROPLETH_INTERVALS" class="choropleth-legend-table">
            <div class="choropleth-legend-header">{{ $t('dashboard.widgetEditor.map.legend.numberOfClasses') }}: {{ layerLegendData.intervals?.length ?? 0 }}</div>
            <div class="choropleth-legend-row choropleth-legend-title-row">
                <span>{{ $t('dashboard.widgetEditor.map.legend.minValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.maxValue') }}</span>
            </div>
            <div v-for="(interval, index) in layerLegendData.intervals" :key="index" class="choropleth-legend-row">
                <span>{{ formatValue(interval.min) }}</span>
                <span>{{ formatValue(interval.max) }}</span>
            </div>
        </div>
        <div v-else-if="layerLegendData.type === LEGEND_DATA_TYPE.CHOROPLETH_QUANTILES" class="choropleth-legend-table">
            <div class="choropleth-legend-header">{{ $t('dashboard.widgetEditor.map.legend.numberOfClasses') }}: {{ layerLegendData.qunatileMappings?.length }}</div>
            <div class="choropleth-legend-row choropleth-legend-title-row">
                <span>{{ $t('dashboard.widgetEditor.map.legend.minValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.maxValue') }}</span>
            </div>
            <div v-for="(quantileInfo, index) in layerLegendData.qunatileMappings" :key="index" class="choropleth-legend-row">
                <span>{{ formatValue(quantileInfo.min) }}</span>
                <span>{{ formatValue(quantileInfo.max) }}</span>
            </div>
        </div>
        <div v-else-if="layerLegendData.type === LEGEND_DATA_TYPE.CHOROPLETH_RANGES" class="choropleth-legend-table">
            <div class="choropleth-legend-header">{{ $t('dashboard.widgetEditor.map.legend.numberOfRanges') }}: {{ layerLegendData.ranges?.length }}</div>
            <div class="choropleth-legend-row choropleth-legend-title-row">
                <span>{{ $t('dashboard.widgetEditor.map.legend.minValue') }}</span>
                <span>{{ $t('dashboard.widgetEditor.map.legend.maxValue') }}</span>
                <span>{{ $t('common.size') }}</span>
                <span>{{ $t('common.color') }}</span>
            </div>
            <div v-for="(rangeInfo, index) in layerLegendData.ranges" :key="index" class="choropleth-legend-row">
                <span>{{ formatValue(rangeInfo.min) }}</span>
                <span>{{ formatValue(rangeInfo.max) }}</span>
                <div class="ranges-color-preview" :style="{ backgroundColor: rangeInfo.color }"></div>
            </div>
        </div>

        <div v-if="layerLegendData.type !== LEGEND_DATA_TYPE.CHOROPLETH_RANGES" id="gradient-container" :style="getGradientLinearStyle()"></div>
        <div v-if="layerLegendData.type !== LEGEND_DATA_TYPE.CHOROPLETH_RANGES" id="gradient-labels">
            <span>{{ $t('common.low') }}</span
            ><span>{{ $t('common.high') }}</span>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings } from '../../../../interfaces/mapWidget/DashboardMapWidget'
import { LEGEND_DATA_TYPE } from '../../LeafletHelper'

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
        formatValue(value: number): string {
            if (!isFinite(value)) return 'N/A'
            return value.toFixed(2)
        },
        getGradientLinearStyle() {
            const colorGradients = this.layerLegendData?.colorGradients
            if (!colorGradients || colorGradients.length === 0) return { background: '' }

            const colorGradientsString = colorGradients.join(', ')
            const graidentLinearStyle = {
                background: `linear-gradient(to right, ${colorGradientsString})`
            }
            return graidentLinearStyle
        }
    }
}
</script>

<style scoped>
.choropleth-legend-table {
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

.choropleth-legend-header {
    font-weight: bold;
}

.choropleth-legend-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-top: 1px solid #eee;
    word-break: break-word;
    gap: 1rem;
}

.choropleth-legend-row span,
.choropleth-legend-row div {
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

.choropleth-legend-title-row {
    font-weight: bold;
    background-color: #f0f0f0;
    border-top: none;
}

#gradient-container {
    width: 100%;
    height: 15px;
    border: 1px solid #999;
    margin: 5px 0;
}

#gradient-labels {
    display: flex;
    justify-content: space-between;
    font-size: 1rem;
}
</style>
