import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ControlPanel, ControlPanelItem, ControlPanelItemMeasure, DatasetBasedLayer, LAYER_TYPE_CATALOG, LAYER_TYPE_DATASET, LayerContainer } from './MapDataStructure'

export interface MapManager {
    changeShowedMeasure(layer: any, name: string): void
    init(): void
    invalidateSize(): void
    getControlPanel(): ControlPanel
    getMapFramework(): any
    showData(dataToShow: any): void
}

class AbstractManager implements MapManager {
    private element: Element
    private model: any
    private controlPanel: ControlPanel
    private layersById = new Map<string, LayerContainer>()
    private columnsByLayerId

    protected map: any

    constructor(element: Element, model: any) {
        this.element = element
        this.model = model
        this.controlPanel = new ControlPanel(this)
    }

    changeShowedMeasure(layer: any, name: string): void {
        throw new Error('To be implemented')
    }

    init(): void {
        this.initLayers()
    }

    invalidateSize(): void {
        throw new Error('To be implemented')
    }

    getControlPanel(): ControlPanel {
        return this.controlPanel
    }

    getMapFramework() {
        return this.map
    }

    showData(dataToShow: any): void {
        const perLayerShowDataPromises = [] as Promise<any>[]

        for (const [key, value] of Object.entries(dataToShow)) {
            const layerName = key
            const datastore = value
            const layerManager = this.layersById.get(layerName)

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
            const label = this.getDsLaberFromLayer(layer)
            const measures = this.getDsShowedMeasuresFromLayer(layer)
            const measuresAsItems = [] as ControlPanelItemMeasure[]

            for (const measure of measures) {
                const measureAsItem = new ControlPanelItemMeasure(measure.name)

                measuresAsItems.push(measureAsItem)
            }

            const item = new ControlPanelItem(label, measuresAsItems)

            this.controlPanel.addLayer(item)
        }
    }

    protected getDsLaberFromLayer(layer: any): string {
        return layer.dataset.label
    }

    protected getDsAttributesFromLayer(layer: any): any[] {
        return this.layersById.get(this.idFromLayer(layer))?.getAttributes() ?? []
    }

    protected getDsMeasuresFromLayer(layer: any): any[] {
        return this.layersById.get(this.idFromLayer(layer))?.getMeasures() ?? []
    }

    protected getDsSpatialAttributesFromLayer(layer: any): any {
        return this.layersById.get(this.idFromLayer(layer))?.getSpatialAttribute
    }

    protected getDsShowedMeasuresFromLayer(layer: any): any[] {
        console.log('----')
        console.log(layer)
        return this.getDsMeasuresFromLayer(layer).filter((e) => {
            console.log(e)
            return e.properties.showMap == true
        })
    }

    private initLayers(): void {
        this.layersById.clear()
        for (const layer of this.model.layers) {
            const layerId = this.idFromLayer(layer)
            const type = layer.type
            let container = null as any

            if (type === LAYER_TYPE_DATASET) {
                container = new DatasetBasedLayer(this, layer)
            } else if (type === LAYER_TYPE_CATALOG) {
                throw new Error('Following layer type is not supported: ' + type)
            } else {
                throw new Error('Following layer type is not supported: ' + type)
            }

            this.layersById.set(layerId, container)
        }
    }

    private idFromLayer(layer: any) {
        return layer.layerID
    }

    private layerNameFromDataset(dataset: any) {
        return dataset.label
    }
}

class Leaflet extends AbstractManager {
    constructor(element: Element, model: any) {
        super(element, model)
    }

    init(): void {
        super.init()

        this.initMap()
        this.initBaseLayer()
        this.initControlPanel()
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
