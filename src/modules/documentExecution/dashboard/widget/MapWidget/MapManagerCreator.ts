import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ControlPanel, ControlPanelItem, ControlPanelItemMeasure } from './MapControlPanel'
import { DatasetBasedLayer, LayerContainer } from './MapDataStructure'
import { MapVisualizationManagerCreator } from './MapVisualizationManager'
import { LAYER_TYPE_DATASET, LAYER_TYPE_CATALOG } from './MapConstants'
import { MapFeatureStyle } from './MapVisualizationManager'
import { Wkt } from 'wicket'

export interface MapManager {
    changeShowedMeasure(layer: any, name: string): void
    init(): void
    invalidateSize(): void
    getControlPanel(): ControlPanel
    getMapFramework(): any
    showData(dataToShow: any): void

    createMarkerFeature(latitude: number, longitude: number, style: MapFeatureStyle, properties: any): any
    createGeoJSONFeature(spatialValue: string, style: MapFeatureStyle, properties: any): void
    createWKTFeature(spatialValue: string, style: MapFeatureStyle, properties: any): void
}

class AbstractManager implements MapManager {
    private model: any
    private controlPanel: ControlPanel
    private layerContainerByLayerId = new Map<string, LayerContainer>()
    private visualizationByLayerId = new Map<string, any>()
    private columnsByLayerId

    protected element: Element
    protected map: any

    constructor(element: Element, model: any) {
        this.element = element
        this.model = model
        this.controlPanel = new ControlPanel(this)
    }

    changeShowedMeasure(layer: any, name: string): void {
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

    invalidateSize(): void {
        throw new Error('To be implemented')
    }

    getControlPanel(): ControlPanel {
        return this.controlPanel
    }

    getMapFramework(): any {
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
                    resolve({})
                } catch (e) {
                    reject({ error: e })
                }
            })

            perLayerShowDataPromises.push(currPromise)
        }

        Promise.all(perLayerShowDataPromises).then((values) => {
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
        for (const layer of this.model.layers) {
            const layerId = this.getLayerIdFromLayer(layer)
            const type = layer.type
            let container = null as any
            const visualizationManager = this.visualizationByLayerId.get(layerId)

            if (type === LAYER_TYPE_DATASET) {
                container = new DatasetBasedLayer(this, layerId, layer, visualizationManager)
            } else if (type === LAYER_TYPE_CATALOG) {
                throw new Error('Following layer type is not supported: ' + type)
            } else {
                throw new Error('Following layer type is not supported: ' + type)
            }

            this.layerContainerByLayerId.set(layerId, container)
        }
    }

    private layerNameFromDataset(dataset: any) {
        return dataset.label
    }
}

class Leaflet extends AbstractManager {
    private WKT = new Wkt()

    private RISE_OB_HOVER = true
    private AUTOPAN_ON_FOCUS = false

    constructor(element: Element, model: any) {
        super(element, model)
    }

    createGeoJSONFeature(spatialValue: string, style: MapFeatureStyle, properties: any): any {
        const geoJsonStyle = {
            color: style.strokeColor,
            fillColor: style.color,
            weight: style.strokeWidth,
            // We don't need them, using "rgba()" in colors is enough
            opacity: 1,
            fillOpacity: 1
        }

        let ret = null
        try {
            const spatialValueAsObject = JSON.parse(spatialValue)
            ret = L.geoJSON(spatialValueAsObject, {
                style: geoJsonStyle
            })

            ret.addTo(this.map)
        } catch (e) {
            console.log('Error parsing GeoJSON: ', e)
            throw new Error('Error parsing GeoJSON: see console')
        }

        return ret
    }

    createMarkerFeature(latitude: number, longitude: number, style: MapFeatureStyle, properties: any): any {
        const coordinate = L.latLng(latitude, longitude)
        const text = coordinate.lat + ' ' + coordinate.lng

        const svgIcon = L.divIcon({
            html: style.icon,
            className: '',
            iconSize: [24, 40],
            iconAnchor: [12, 40]
        })

        const ret = L.marker(coordinate, {
            alt: text,
            riseOnHover: this.RISE_OB_HOVER,
            autoPanOnFocus: this.AUTOPAN_ON_FOCUS,
            title: text,
            icon: svgIcon
        })
        ret.addTo(this.map)
        return ret
    }

    createWKTFeature(spatialValue: string, style: MapFeatureStyle, properties: any): any {
        const geoJsonStyle = {
            color: style.strokeColor,
            fillColor: style.color,
            weight: style.strokeWidth,
            // We don't need them, using "rgba()" in colors is enough
            opacity: 1,
            fillOpacity: 1
        }

        let ret = null
        try {
            const spatialValueAsObject = this.WKT.read(spatialValue).toJson()
            ret = L.geoJSON(spatialValueAsObject, {
                style: geoJsonStyle
            })

            ret.addTo(this.map)
        } catch (e) {
            console.log('Error parsing GeoJSON: ', e)
            throw new Error('Error parsing GeoJSON: see console')
        }

        return ret
    }

    init(): void {
        super.init()

        this.initMap()
        this.initBaseLayer()
    }

    invalidateSize(): void {
        this.map.invalidateSize()
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
}

export class MapManagerCreator {
    static create(element: Element, model: any): MapManager {
        return new Leaflet(element, model)
    }
}
