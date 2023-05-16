<template>
    <div id="map" ref="map" class="mapContainer"></div>
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { IDashboardDataset, ISelection, IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import 'leaflet/dist/leaflet.css'
import { map } from 'leaflet/src/map'
import { tileLayer } from 'leaflet/src/layer/tile/TileLayer'
import { Marker } from 'leaflet/src/layer/marker/Marker'

export default defineComponent({
    name: 'map-widget',
    components: {},
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        editorMode: { type: Boolean, required: false },
        datasets: { type: Array as PropType<IDashboardDataset[]>, required: true },
        dataToShow: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true },
        propVariables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['launchSelection'],
    data() {
        return {
            widgetModel: {} as string,
            activeSelections: [] as ISelection[],
            zoom: 2 as number,
            Lmap: undefined as any
        }
    },
    watch: {
        propWidget: {
            handler() {
                this.loadWidgetModel()
            },
            deep: true
        },
        propActiveSelections() {
            this.loadActiveSelections()
        }
    },
    created() {
        this.loadWidgetModel()
        this.loadActiveSelections()
    },
    mounted() {
        console.log(this.$refs.map)
        this.Lmap = map(this.$refs.map).setView([51.505, -0.09], 13)
        tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.Lmap)
        const marker = new Marker([51.5, -0.09]).addTo(this.Lmap)
    },
    updated() {
        this.Lmap.invalidateSize()
    },
    unmounted() {},
    methods: {
        ...mapActions(mainStore, ['setSelections']),
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadWidgetModel() {
            this.widgetModel = JSON.stringify(this.propWidget)
        },
        loadActiveSelections() {
            this.activeSelections = this.propActiveSelections
        }
    }
})
</script>
<style lang="scss">
.mapContainer {
    width: 100%;
    height: 100%;
}
</style>
