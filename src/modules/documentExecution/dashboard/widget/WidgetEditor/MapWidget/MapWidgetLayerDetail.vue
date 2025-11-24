<template>
    <div v-if="layer" class="p-d-flex p-flex-column kn-flex">
        <MapWidgetLayerInfo :selected-layer="layer" :layers="layers"></MapWidgetLayerInfo>
        <MapWidgetMetadata class="p-mt-2" :selected-layer="layer" :prop-widget="propWidget" :variables="variables" :dashboard-id="dashboardId"></MapWidgetMetadata>
    </div>
    <div v-else>
        <KnHint class="kn-hint-sm" :title="'dashboard.widgetEditor.map.layerHintTitle'" :hint="'dashboard.widgetEditor.map.layerHintText'" data-test="hint"></KnHint>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { ILayer, IMapWidgetLayer } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import MapWidgetLayerInfo from './layerInfo/MapWidgetLayerInfo.vue'
import MapWidgetMetadata from './metadata/MapWidgetMetadata.vue'
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    name: 'map-widget-layer-detail',
    components: { KnHint, MapWidgetLayerInfo, MapWidgetMetadata },
    props: { selectedLayer: { type: Object as PropType<IMapWidgetLayer | null>, required: true }, layers: { type: Array as PropType<ILayer[]>, required: true }, propWidget: { type: Object as PropType<IWidget>, required: true }, variables: { type: Array as PropType<IVariable[]>, required: true }, dashboardId: { type: String, required: true } },
    data() {
        return {
            layer: null as IMapWidgetLayer | null
        }
    },
    watch: {
        selectedLayer() {
            this.loadLayer()
        }
    },
    created() {
        this.loadLayer()
    },
    methods: {
        loadLayer() {
            this.layer = this.selectedLayer
        }
    }
})
</script>
