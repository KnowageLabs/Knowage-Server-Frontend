<template>
    <div class="p-d-flex p-flex-column">
        <MapVisualizationTypeMarkers v-if="visType.type === 'markers'" :marker-config-prop="visTypeProp.markerConf" @marker-configuration-updated="$emit('marker-configuration-updated')" />
        <MapVisualizationTypeBalloonsChoropleth v-else-if="visType.type === 'balloons'" :prop-visualization-type-configuration="visType.balloonConf ?? null" type="balloons"></MapVisualizationTypeBalloonsChoropleth>
        <MapVisualizationTypePie v-else-if="visType.type === 'pies'" :widget-model="widgetModel" :vis-type-prop="visType ?? null" :layer-properties="visType.properties" :dataset-columns="[]"></MapVisualizationTypePie>
        <MapVisualizationTypeClusters v-if="visType.type === 'clusters'" :cluster-config-prop="visTypeProp.clusterConf" :marker-config-prop="visTypeProp.markerConf" />
        <MapVisualizationTypeHeatmap v-else-if="visType.type === 'heatmap'" :prop-heatmap-configuration="visType.heatmapConf ?? null"></MapVisualizationTypeHeatmap>
        <MapVisualizationTypeBalloonsChoropleth v-else-if="visType.type === 'choropleth'" :prop-visualization-type-configuration="visType.analysisConf ?? null" type="choropleth"></MapVisualizationTypeBalloonsChoropleth>
    </div>
</template>

<script lang="ts">
import { IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import descriptor from './MapVisualizationTypeDescriptor.json'
import MapVisualizationTypeMarkers from './configuration/MapVisualizationTypeMarkers.vue'
import MapVisualizationTypePie from './configuration/MapVisualizationTypePie.vue'
import MapVisualizationTypeBalloonsChoropleth from './configuration/MapVisualizationTypeBalloonsChoropleth.vue'
import MapVisualizationTypeClusters from './configuration/MapVisualizationTypeClusters.vue'
import MapVisualizationTypeHeatmap from './configuration/MapVisualizationTypeHeatmap.vue'

export default defineComponent({
    name: 'map-visualization-type',
    components: { MapVisualizationTypeMarkers, MapVisualizationTypeClusters, MapVisualizationTypeHeatmap, MapVisualizationTypeBalloonsChoropleth, MapVisualizationTypePie },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, visTypeProp: { type: Object as PropType<IMapWidgetVisualizationType>, required: true } },
    emits: ['marker-configuration-updated'],
    data() {
        return {
            descriptor,
            visType: {} as IMapWidgetVisualizationType
        }
    },
    watch: {
        widgetModel() {
            this.loadVisType()
        }
    },
    created() {
        this.loadVisType()
    },
    methods: {
        loadVisType() {
            this.visType = this.visTypeProp as IMapWidgetVisualizationType
        }
    }
})
</script>

<style lang="scss" scoped></style>
