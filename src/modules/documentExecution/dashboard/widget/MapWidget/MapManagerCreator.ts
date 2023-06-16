import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ControlPanel, ControlPanelItem, ControlPanelItemMeasure } from './MapControlPanel'
import { MapVisualizationManagerCreator, PieVisualizationManager } from './MapVisualizationManager'
import { LAYER_TYPE_DATASET, LAYER_TYPE_CATALOG, FEATURE_PROPERTY_LAYER_ID } from './MapConstants'
import { MapFeatureStyle } from './MapVisualizationManager'
import { Wkt } from 'wicket'
import { DatasetBasedLayer, LayerContainer } from './MapLayerContainer'
import { LeafleatBaseFeatureGroup, LeafleatPerSpatialAttributeFeatureGroup } from './LeafletExtension'

export interface MapManager {
    changeShowedMeasure(layer: any, name: string): void
    init(): void
    invalidateSize(): void
    getControlPanel(): ControlPanel
    showData(dataToShow: any): void
    getModel(): any

    getProprietaryMap(): any
    createProprietaryLayer(layerContainer: LayerContainer): any
    addProprietaryLayerToProprietaryMap(proprietaryLayer: any)
    addFeatureToProprietaryLayer(feature: any, proprietaryLayer: any)
    switchLayerVisibility(layerId: string)

    createMarkerFeature(latitude: number, longitude: number, style: MapFeatureStyle, properties: any): any
    createGeoJSONFeature(spatialValue: string, style: MapFeatureStyle, properties: any): any
    createWKTFeature(spatialValue: string, style: MapFeatureStyle, properties: any): any
}

class AbstractManager implements MapManager {
    private model: any
    private controlPanel: ControlPanel
    private layerContainerByLayerId = new Map<string, LayerContainer>()
    private visualizationByLayerId = new Map<string, any>()
    private columnsByLayerId

    protected layerVisibilityState: any
    protected element: unknown
    protected map: any

    constructor(element: unknown, model: any, layerVisibilityState: any) {
        this.element = element
        this.model = model
        this.layerVisibilityState = layerVisibilityState
        this.controlPanel = new ControlPanel(this)
    }

    addFeatureToProprietaryLayer(feature: any, proprietaryLayer: any) {
        throw new Error('To be implemented')
    }

    addProprietaryLayerToProprietaryMap(proprietaryLayer: any) {
        throw new Error('To be implemented')
    }

    changeShowedMeasure(layer: any, name: string): void {
        throw new Error('To be implemented')
    }

    createProprietaryLayer(layerContainer: LayerContainer): any {
        throw new Error('To be implemented')
    }

    createGeoJSONFeature(spatialValue: string, style: MapFeatureStyle, properties: any): any {
        throw new Error('To be implemented')
    }

    createMarkerFeature(latitude: number, longitude: number, style: MapFeatureStyle, properties: any): any {
        throw new Error('To be implemented')
    }

    createWKTFeature(spatialValue: string, style: MapFeatureStyle, properties: any): any {
        throw new Error('To be implemented')
    }

    init(): void {
        this.initVisualizations()
        this.initLayers()
        this.initControlPanel()
    }

    switchLayerVisibility(layerId: string) {
        throw new Error('To be implemented')
    }

    invalidateSize(): void {
        throw new Error('To be implemented')
    }

    getControlPanel(): ControlPanel {
        return this.controlPanel
    }

    getProprietaryMap(): any {
        return this.map
    }

    getModel(): any {
        return this.model
    }

    showData(dataToShow: any): void {
        const perLayerShowDataPromises = [] as Promise<any>[]

        for (const [key, value] of Object.entries(dataToShow)) {
            const layerID = key
            const datastore = value
            const layerManager = this.layerContainerByLayerId.get(layerID)

            const currPromise = new Promise((resolve, reject) => {
                try {
                    layerManager?.preShowData(datastore)
                    layerManager?.showData(datastore)
                    layerManager?.afterShowData(datastore)
                    resolve({})
                } catch (e) {
                    reject({ error: e })
                }
            })

            perLayerShowDataPromises.push(currPromise)
        }

        Promise.any(perLayerShowDataPromises).then((values) => {
            console.log(values)
        })
    }

    protected initControlPanel() {
        const layers = this.model.layers

        for (const layer of layers) {
            const layerId = this.getLayerIdFromLayer(layer)
            const alias = this.getAliasFromLayer(layer)
            const measures = this.getDsShowedMeasuresFromLayer(layer)
            const measuresAsItems = [] as ControlPanelItemMeasure[]

            for (const measure of measures) {
                const measureAsItem = new ControlPanelItemMeasure(measure.alias, measure.name)

                measuresAsItems.push(measureAsItem)
            }

            const item = new ControlPanelItem(layerId, alias, measuresAsItems)

            this.controlPanel.addLayer(item)
        }
    }

    protected getDsLabelFromLayer(layer: any): string {
        return layer.dataset.label
    }

    protected getDsAttributesFromLayer(layer: any): any[] {
        return this.layerContainerByLayerId.get(this.getLayerIdFromLayer(layer))?.getAttributes() ?? []
    }

    protected getDsMeasuresFromLayer(layer: any): any[] {
        return this.layerContainerByLayerId.get(this.getLayerIdFromLayer(layer))?.getMeasures() ?? []
    }

    protected getDsSpatialAttributesFromLayer(layer: any): any {
        return this.layerContainerByLayerId.get(this.getLayerIdFromLayer(layer))?.getSpatialAttribute
    }

    protected getDsShowedMeasuresFromLayer(layer: any): any[] {
        return this.getDsMeasuresFromLayer(layer).filter((e) => {
            return e.properties.showMap == true
        })
    }

    private getLayerIdFromLayer(layer: any) {
        return layer.layerID
    }

    private getAliasFromLayer(layer: any) {
        return layer.alias
    }

    private initVisualizations(): void {
        const visualizations = this.model.settings.visualization.types

        this.visualizationByLayerId.clear()

        for (const visualization of visualizations) {
            const type = visualization.type
            const targets = visualization.target

            const visualizationManager = MapVisualizationManagerCreator.create(this, type, visualization)

            for (const target of targets) {
                if (this.visualizationByLayerId.has(target)) {
                    throw new Error('Following layer is associated to more than one visualization: ' + target)
                }

                this.visualizationByLayerId.set(target, visualizationManager)
            }
        }
    }

    private initLayers(): void {
        this.layerContainerByLayerId.clear()
        const initPromises = [] as Promise<any>[]

        let i = 0
        for (const layer of this.model.layers) {
            const currPromise = new Promise((resolve, reject) => {
                try {
                    const layerId = this.getLayerIdFromLayer(layer)
                    const type = layer.type
                    let container = null as any
                    const visualizationManager = this.visualizationByLayerId.get(layerId)

                    if (type === LAYER_TYPE_DATASET) {
                        container = new DatasetBasedLayer(this, layerId, layer, visualizationManager, i)
                    } else if (type === LAYER_TYPE_CATALOG) {
                        throw new Error('Following layer type is not supported: ' + type)
                    } else {
                        throw new Error('Following layer type is not supported: ' + type)
                    }

                    this.layerContainerByLayerId.set(layerId, container)

                    this.layerVisibilityState[layerId] = true

                    resolve({})
                } catch (e) {
                    reject({ error: e })
                }
            })

            initPromises.push(currPromise)

            i++
        }

        Promise.any(initPromises).then((values) => {
            console.log(values)
        })
    }

    private layerNameFromDataset(dataset: any) {
        return dataset.label
    }
}

class Leaflet extends AbstractManager {
    private WKT = new Wkt()

    private RISE_OB_HOVER = true
    private AUTOPAN_ON_FOCUS = false

    constructor(element: unknown, model: any, layerVisibilityState: any) {
        super(element, model, layerVisibilityState)
    }

    addFeatureToProprietaryLayer(feature: any, proprietaryLayer: any): void {
        proprietaryLayer.addLayer(feature)
    }

    addProprietaryLayerToProprietaryMap(proprietaryLayer: any): void {
        this.map.addLayer(proprietaryLayer)
    }

    createProprietaryLayer(layerContainer: LayerContainer): void {
        const index = layerContainer.getLayerIndex()
        const layerId = layerContainer.getLayerId()
        const visualizationManager = layerContainer.getVisualizationManager()

        const paneName = this.paneName(layerId)

        const pane = this.map.createPane(paneName)
        pane.style.zIndex = 601 + index

        let ret = new LeafleatBaseFeatureGroup([], { pane: paneName })

        if (visualizationManager instanceof PieVisualizationManager) {
            ret = new LeafleatPerSpatialAttributeFeatureGroup([], { pane: paneName })
        }

        return ret
        // return L.featureGroup([], { pane: paneName })
    }

    createGeoJSONFeature(spatialValue: string, style: MapFeatureStyle, properties: any): any {
        const layerId = properties[FEATURE_PROPERTY_LAYER_ID]
        const paneName = this.paneName(layerId)

        const geoJsonStyle = {
            color: style.strokeColor,
            fillColor: style.color,
            weight: style.strokeWidth,
            // We don't need them, using "rgba()" in colors is enough
            opacity: 1,
            fillOpacity: 1
        }

        try {
            const spatialValueAsObject = JSON.parse(spatialValue)
            const ret = L.geoJSON(spatialValueAsObject, {
                style: geoJsonStyle,
                pane: paneName
            })

            this.addCustomProperties(ret, properties)

            return ret
        } catch (e) {
            console.log('Error parsing GeoJSON: ', e)
            throw new Error('Error parsing GeoJSON: see console')
        }
    }

    createMarkerFeature(latitude: number, longitude: number, style: MapFeatureStyle, properties: any): any {
        const layerId = properties[FEATURE_PROPERTY_LAYER_ID]
        const paneName = this.paneName(layerId)

        const coordinate = L.latLng(latitude, longitude)
        const text = coordinate.lat + ' ' + coordinate.lng
        const originaliIcon = style.icon

        let icon = ''
        if (typeof originaliIcon === 'object') {
            icon = originaliIcon
        } else if (typeof originaliIcon === 'string') {
            icon = L.divIcon({
                html: originaliIcon,
                className: '',
                iconSize: [24, 40],
                iconAnchor: [12, 40]
            })
        }

        const ret = L.marker(coordinate, {
            alt: text,
            riseOnHover: this.RISE_OB_HOVER,
            autoPanOnFocus: this.AUTOPAN_ON_FOCUS,
            title: text,
            icon: icon,
            pane: paneName
        })

        this.addCustomProperties(ret, properties)

        return ret
    }

    createWKTFeature(spatialValue: string, style: MapFeatureStyle, properties: any): any {
        const layerId = properties[FEATURE_PROPERTY_LAYER_ID]
        const paneName = this.paneName(layerId)

        const geoJsonStyle = {
            color: style.strokeColor,
            fillColor: style.color,
            weight: style.strokeWidth,
            // We don't need them, using "rgba()" in colors is enough
            opacity: 1,
            fillOpacity: 1
        }

        try {
            const spatialValueAsObject = this.WKT.read(spatialValue).toJson()
            const ret = L.geoJSON(spatialValueAsObject, {
                style: geoJsonStyle,
                pane: paneName
            })

            this.addCustomProperties(ret, properties)

            return ret
        } catch (e) {
            console.log('Error parsing GeoJSON: ', e)
            throw new Error('Error parsing GeoJSON: see console')
        }
    }

    init(): void {
        super.init()

        this.initMap()
        this.initBaseLayer()
    }

    invalidateSize(): void {
        this.map.invalidateSize()
    }

    switchLayerVisibility(layerId: string) {
        const paneName = this.paneName(layerId)
        this.map.getPane(paneName).style.display = this.map.getPane(paneName).style.display == 'none' ? 'block' : 'none'
        this.layerVisibilityState[layerId] = this.map.getPane(paneName).style.display != 'none'
    }

    private initMap() {
        this.map = L.map(this.element).setView([45, 11], 10)
    }

    private initBaseLayer() {
        this.getOpenStreetMapBaseLayer().addTo(this.map)
    }

    private getOpenStreetMapBaseLayer() {
        return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        })
    }

    private addCustomProperties(feature: any, properties: any) {
        feature.knProperties = properties
    }

    private paneName(layerId: string) {
        return 'knowage-' + layerId
    }
}

export class MapManagerCreator {
    static create(element: unknown, model: anyù, layerVisibilityState: any): MapManager {
        return new Leaflet(element, model, layerVisibilityState)
    }
}
