<template>
    <MapWidgetLayerDetail id="map-widget-layer-detail" class="p-d-flex kn-flex kn-overflow p-p-3" :selected-layer="selectedLayer" :layers="layers" :prop-widget="propWidget" :variables="variables" :dashboard-id="dashboardId"></MapWidgetLayerDetail>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IDataset, IWidget, IVariable } from '../../../Dashboard'
import { mapState } from 'pinia'
import { ILayer, IMapWidgetLayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import mainStore from '@/App.store'
import MapWidgetLayerDetail from './MapWidgetLayerDetail.vue'

export default defineComponent({
    name: 'map-widget-layers-tab',
    components: { MapWidgetLayerDetail },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        datasets: {
            type: Array as PropType<IDataset[]>,
            default: function () {
                return []
            }
        },
        selectedDatasets: {
            type: Array as PropType<IDataset[]>,
            default: function () {
                return []
            }
        },
        layers: { type: Array as PropType<ILayer[]>, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true },
        selectedLayer: { type: Object as PropType<IMapWidgetLayer | null>, default: null }
    },
    emits: ['layerSelected'],
    data() {
        return {
            widget: {} as IWidget
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        })
    },
    created() {
        this.loadWidget()
    },
    methods: {
        loadWidget() {
            this.widget = this.propWidget
        }
    }
})
</script>

<style lang="scss" scoped>
#map-widget-layer-detail {
    overflow: auto;
}
</style>
