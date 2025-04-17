<template>
    <div v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.type === 'pies' && legendVizualizationSettings.visualizationType.pieConf && layerLegendData?.charts[0]" class="chart-legend-flex-wrapper">
        <div class="chart-legend-flex-row chart-legend-flex-header">
            <div>{{ $t('common.measure') }}</div>
            <div>{{ $t('common.color') }}</div>
        </div>

        <div class="chart-legend-flex-row" v-for="(chartDomain, index) in layerLegendData.charts[0].chartDomains" :key="index">
            <div>{{ chartDomain }}</div>
            <div class="chart-measure-color-cell">
                <span class="chart-measure-color-swatch" :style="{ backgroundColor: layerLegendData.charts?.[0]?.chartColors?.[index] ?? 'transparent' }"></span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings } from '../../../../interfaces/mapWidget/DashboardMapWidget'

export default {
    name: 'map-legend-charts-content',
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
.chart-legend-flex-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
}

.chart-legend-flex-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.chart-legend-flex-header {
    font-weight: bold;
}

.chart-measure-color-swatch {
    display: inline-block;
    width: 15px;
    height: 15px;
    border: 1px solid #ccc;
    border-radius: 2px;
}

.chart-measure-color-cell {
    display: flex;
    align-items: center;
}
</style>
