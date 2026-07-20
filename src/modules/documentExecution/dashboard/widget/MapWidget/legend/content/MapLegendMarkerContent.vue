<template>
    <div class="config-preview kn-flex" v-if="legendVizualizationSettings?.visualizationType && legendVizualizationSettings.visualizationType.markerConf" :style="getPreviewStyle(legendVizualizationSettings.visualizationType.markerConf)">
        <div v-if="legendVizualizationSettings.visualizationType.type === 'clusters'" class="clusters-config-preview">
            <div class="p-d-flex p-flex-row p-ai-center cluster-preview" :style="getClusterPreviewStyle(legendVizualizationSettings.visualizationType.clusterConf)">10</div>
        </div>

        <i v-if="legendVizualizationSettings.visualizationType.markerConf.type === 'default' || legendVizualizationSettings.visualizationType.markerConf.type === 'icon'" :class="getIconClass(legendVizualizationSettings.visualizationType.markerConf)" />

        <img
            v-if="legendVizualizationSettings.visualizationType.markerConf.type === 'img' || legendVizualizationSettings.visualizationType.markerConf.type === 'url'"
            :src="legendVizualizationSettings.visualizationType.markerConf.type === 'img' ? legendVizualizationSettings.visualizationType.markerConf.img : legendVizualizationSettings.visualizationType.markerConf.url"
            class="image-preview"
        />
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetVisualizationTypeCluster, IMapWidgetVisualizationTypeLegendSettings, IMapWidgetVisualizationTypeMarker } from '../../../../interfaces/mapWidget/DashboardMapWidget'
import { normalizeMapWidgetClusterConfiguration } from '../../../WidgetEditor/helpers/mapWidget/MapWidgetVisualizationConfigurationHelper'

export default {
    name: 'map-legend-marker-content',
    props: {
        propMapWidgetLegendVisualization: { type: Object as PropType<IMapWidgetVisualizationTypeLegendSettings>, required: true }
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
        },
        getPreviewStyle(markerConfig: IMapWidgetVisualizationTypeMarker | undefined) {
            return markerConfig ? `color:${markerConfig.style.color};` : ''
        },
        getIconClass(markerConfig: IMapWidgetVisualizationTypeMarker | undefined) {
            if (!markerConfig) return ''
            switch (markerConfig.type) {
                case 'default':
                    return `fas fa-circle`
                case 'icon':
                    return markerConfig.icon?.className
                default:
                    return 'fas fa-cross'
            }
        },
        getClusterPreviewStyle(clustersConfig: IMapWidgetVisualizationTypeCluster | undefined) {
            if (!clustersConfig) return ''
            const normalizedConfiguration = normalizeMapWidgetClusterConfiguration(clustersConfig)
            return `color:${normalizedConfiguration.style.color}; background-color:${normalizedConfiguration.style['background-color']};`
        }
    }
}
</script>

<style scoped>
.config-preview {
    padding: 0 0.5rem 0 0.1rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex: 0 0 auto;
    overflow: hidden;
    gap: 0.35rem;
}

.image-preview {
    max-height: 36px;
    max-width: 36px;
}

.customColorPreview {
    width: 50px;
    height: 30px;
    display: block;
    cursor: pointer;
    border: 1px solid #ccc;
}

.clusters-config-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    width: 24px;
    height: 24px;
    overflow: hidden;
}

i.fas.fa-circle {
    line-height: 1.1rem;
}

.cluster-preview {
    min-width: 20px;
    border-radius: 50px;
    font-size: 0.9rem;
}
</style>
