<template>
    <div v-if="legendVizualizationSettings" class="p-col-12">
        <textarea v-if="legendVizualizationSettings.text"> {{ legendVizualizationSettings.text }} </textarea>

        <div class="p-formgrid p-grid" v-if="legendVizualizationSettings.visualizationType">
            <q-input dense class="p-lg-12" filled v-model="legendVizualizationSettings.visualizationType.layerName" :label="$t('common.name')" disable />

            <div class="p-col-12 p-d-flex p-flex-row p-jc-around p-ai-center">
                <p class="target-property kn-flex">{{ legendVizualizationSettings.visualizationType.targetProperty }}</p>
                <div class="config-preview kn-flex" v-if="legendVizualizationSettings.visualizationType.type === 'markers' && legendVizualizationSettings.visualizationType.markerConf" :style="getPreviewStyle(legendVizualizationSettings.visualizationType.markerConf)">
                    <i v-if="legendVizualizationSettings.visualizationType.markerConf.type === 'default' || legendVizualizationSettings.visualizationType.markerConf.type === 'icon'" :class="getIconClass(legendVizualizationSettings.visualizationType.markerConf)" />
                    <img
                        v-if="legendVizualizationSettings.visualizationType.markerConf.type === 'img' || legendVizualizationSettings.visualizationType.markerConf.type === 'url'"
                        :src="legendVizualizationSettings.visualizationType.markerConf.type === 'img' ? legendVizualizationSettings.visualizationType.markerConf.img : legendVizualizationSettings.visualizationType.markerConf.url"
                        class="image-preview"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { IMapWidgetVisualizationTypeLegendSettings, IMapWidgetVisualizationTypeMarker } from '../../../interfaces/mapWidget/DashboardMapWidget'

export default {
    name: 'map-legend-visualzation',
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
            console.log('----------- LOADED legendVizualizationSettings: ', this.legendVizualizationSettings)
        },
        getPreviewStyle(markerConfig: IMapWidgetVisualizationTypeMarker | undefined) {
            return markerConfig ? `color:${markerConfig.style.color}; font-size: 1.2rem;` : ''
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
        }
    }
}
</script>

<style scoped>
.target-property {
    margin: 0;
    padding: 0;
}

.config-preview {
    padding-right: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 0 0 100px;
    overflow: hidden;
    .i {
        overflow: clip;
    }
}

.image-preview {
    max-height: 50px;
    max-width: 50px;
}

.customColorPreview {
    width: 50px;
    height: 30px;
    display: block;
    cursor: pointer;
    border: 1px solid #ccc;
}
</style>
