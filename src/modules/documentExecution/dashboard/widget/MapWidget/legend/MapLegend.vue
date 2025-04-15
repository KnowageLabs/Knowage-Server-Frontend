<template>
    <div v-if="legend" :class="positionClass" class="map-legend q-pa-sm shadow-2 text-black rounded-borders">
        <h2 v-if="legend.title">{{ legend.title }}</h2>

        <div class="p-formgrid p-grid">
            <MapLegendVisualization class="p-col-12" v-for="(legendVizualizationSettings, index) in legend.visualizationTypes" :key="index" :prop-map-widget-legend-visualization="legendVizualizationSettings" :legend-data="legendData"></MapLegendVisualization>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetLegend } from '../../../interfaces/mapWidget/DashboardMapWidget'
import MapLegendVisualization from './MapLegendVisualization.vue'

export default {
    name: 'map-legend',
    components: { MapLegendVisualization },
    props: {
        propMapWidgetLegend: { type: Object as PropType<IMapWidgetLegend>, required: true },
        legendData: { type: Object as PropType<Record<string, any> | null | undefined>, required: true }
    },
    data() {
        return {
            legend: null as IMapWidgetLegend | null,
            position: 'east'
        }
    },
    computed: {
        positionClass() {
            switch (this.position) {
                case 'north':
                    return 'legend-vertical legend-top'
                case 'south':
                    return 'legend-vertical legend-bottom'
                case 'west':
                    return 'legend-horizontal  legend-west'
                case 'east':
                    return 'legend-horizontal legend-east'
                case 'center':
                    return 'legend-center'
                default:
                    return 'legend-east'
            }
        }
    },
    watch: {
        propMapWidgetLegend() {
            this.loadLegend()
        }
    },
    mounted() {
        this.loadLegend()
    },
    methods: {
        loadLegend() {
            this.legend = this.propMapWidgetLegend
        }
    }
}
</script>

<style scoped>
.map-legend {
    position: absolute;
    z-index: 2147483647 !important;
    background: white;
    padding: 8px;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

    overflow-y: auto;
    max-height: 100%;
}

.legend-vertical {
    max-height: 300px;
    width: 100%;
}

.legend-horizontal {
    height: 100%;
    max-width: 300px;
}

.legend-top {
    top: -300px;
}

.legend-bottom {
    bottom: -300px;
}

.legend-east {
    right: -300px;
}

.legend-west {
    left: -300px;
}
</style>
