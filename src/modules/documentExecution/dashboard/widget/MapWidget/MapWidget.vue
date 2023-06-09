<template>
    <div id="map" ref="map" class="mapContainer"></div>
    <div v-if="mapManager" class="kn-parameter-sidebar kn-map-sidebar">
        <div class="kn-map-sidebar-section">Options</div>
        <details v-for="item in mapManager.getControlPanel().getLayers()" :key="item.getLayerId()" class="kn-map-sidebar-layer">
            <summary>{{ item.getAlias() }}</summary>
            <span v-if="item.getMeasures().length == 0">TODO : Please show some measure</span>
            <span v-for="measure in item.getMeasures()" v-else :key="measure.getName()">{{ measure.getAlias() }}</span>
        </details>
        <div class="kn-map-sidebar-section">Filters</div>
        <details v-for="item in mapManager.getControlPanel().getLayers()" :key="item.getLayerId()" class="kn-map-sidebar-layer">
            <summary>{{ item.getAlias() }}</summary>
            <span>TODO : show filters</span>
        </details>
    </div>
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { IDashboardDataset, ISelection, IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import mainStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import 'leaflet/dist/leaflet.css'
import { MapLayerManager } from './MapLayerManagerCreator'
import { MapManagerCreator } from './MapManagerCreator'

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
            widgetModel: {} as any,
            activeSelections: [] as ISelection[],
            zoom: 2 as number,
            layerManagers: [] as MapLayerManager[],
            map: null as any,
            mapManager: null as any
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
        this.mapManager = MapManagerCreator.create(this.$refs.map, this.widgetModel)

        this.mapManager.init()

        this.mapManager.showData(this.dataToShow)

        //        console.log(this.$refs.map)
        //
        //        this.map = L.map(this.$refs.map).setView([45, 11], 10)
        //
        //        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //            maxZoom: 19
        //        }).addTo(this.map)
        //
        //        // GeoJSON
        //        L.geoJson(sampleGeoJsonData).addTo(this.map)
        //
        //        // Simple marker
        //        new L.Marker([45, 11]).addTo(this.map)
        //
        //        // Font Awesome marker
        //        const fontAwesomeIcon = L.divIcon({ className: 'fa-solid fa-house' })
        //        new L.Marker([45.1, 11], { icon: fontAwesomeIcon }).addTo(this.map)
        //
        //        // Choropleth
        //        const color = function (d) {
        //            return 'red'
        //        }
        //        const chIcon = L.divIcon({
        //            className: 'fa-solid fa-user-circle',
        //            html: `<span style=”color: red” />`
        //        })
        //        function style(feature) {
        //            return {
        //                'background-color': color(feature),
        //                color: color(feature)
        //            }
        //        }
        //        new L.Marker([45.0, 10.5], { icon: chIcon, style: style, title: 'Sample Tooltip' }).addTo(this.map)
        //        new L.Marker([44.9, 10.5], { icon: chIcon, style: style, title: 'Sample Tooltip' }).addTo(this.map)
        //        new L.Marker([44.8, 10.5], { icon: chIcon, style: style, title: 'Sample Tooltip' }).addTo(this.map)
        //        new L.Marker([44.7, 10.5], { icon: chIcon, style: style, title: 'Sample Tooltip' }).addTo(this.map)
        //
        //        // Custom legend
        //        const popupPos = L.latLng(45, 11.5)
        //        L.popup().setLatLng(popupPos).setContent('<p>Hello world!<br />This is a nice popup.</p>').openOn(this.map)
        //
        //        this.layerManagers.length = 0
        //        const layers = this.propWidget.layers
        //
        //        for (const layer of layers) {
        //            const layerManager = MapLayerManagerCreator.create(layer)
        //
        //            this.layerManagers.push(layerManager)
        //        }
        //
        //        console.log(layers)
        //        console.log(this.layerManagers)
    },
    updated() {
        this.mapManager.invalidateSize()
    },
    unmounted() {},
    methods: {
        ...mapActions(mainStore, ['setSelections']),
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadWidgetModel() {
            this.widgetModel = this.propWidget
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
.kn-map-sidebar {
    background-color: green;
    min-width: 10em;
    width: auto;

    z-index: 900;
}
.kn-map-sidebar-section {
    background-color: blue;
    font-size: x-large;
}
.kn-map-sidebar-layer {
    font-size: large;
}
</style>
