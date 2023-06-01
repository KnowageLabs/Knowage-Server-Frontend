import { MapManager } from './MapManagerCreator'

export const LAYER_TYPE_DATASET = 'DATASET'
export const LAYER_TYPE_CATALOG = 'CATALOG'

export const FIELD_TYPE_SPATIAL_ATTRIBUTE = 'SPATIAL_ATTRIBUTE'
export const FIELD_TYPE_ATTRIBUTE = 'ATTRIBUTE'
export const FIELD_TYPE_MEASURE = 'MEASURE'

export class ControlPanelItemMeasure {
    public name: string

    constructor(name: string) {
        this.name = name
    }
}

export class ControlPanelItem {
    public name: string
    public measures: ControlPanelItemMeasure[]

    constructor(name: string, measures: ControlPanelItemMeasure[]) {
        this.name = name
        this.measures = measures
    }
}

export class ControlPanel {
    mapManager: MapManager
    layers = [] as ControlPanelItem[]

    constructor(mapManager: MapManager) {
        this.mapManager = mapManager
    }

    public addLayer(item: ControlPanelItem) {
        this.layers.push(item)
    }

    public removeLayer(item: ControlPanelItem) {
        const elemIdx = this.layers.indexOf(item)

        if (elemIdx < 0) {
            throw new Error('Following element not found: ' + item)
        }

        this.layers.splice(elemIdx, 1)
    }

    public getLayers(): ControlPanelItem[] {
        return this.layers
    }
}

interface FeatureGenerator {
    generate(spatialValue: string): any
}

abstract class AbstractFeatureGenerator implements FeatureGenerator {
    constructor(spatialValue)
}

class MarkerGenerator implements FeatureGenerator {
    generate() {}
}
class GeoJSONGenerator implements FeatureGenerator {}
class WKTGenerator implements FeatureGenerator {}

export interface LayerContainer {
    getAttributes(): any[]
    getAttributeByName(name: string): any
    getMeasures(): any[]
    getMeasureByName(name: string): any
    getSpatialAttribute(): any

    getLayer(): any

    preShowData(datastore: any): void
    showData(datastore: any): void
}

class AbstractLayerContainer implements LayerContainer {
    protected layer: any

    protected spatialAttribute = null
    protected attributes = [] as any[]
    protected measures = [] as any[]

    protected attributeByName = new Map<string, any>()
    protected measureByName = new Map<string, any>()

    protected columnsByName = new Map()

    protected featureGenerator = null as FeatureGenerator

    protected mapManager: MapManager

    constructor(mapManager: MapManager, layer: any) {
        this.mapManager = mapManager
        this.layer = layer

        this.initColumns()
    }

    getAttributes(): any[] {
        return this.attributes
    }

    getAttributeByName(name: string) {
        return this.attributeByName.get(name)
    }

    getLayer() {
        return this.layer
    }

    getMeasures(): any[] {
        return this.measures
    }

    getMeasureByName(name: string) {
        return this.measureByName.get(name)
    }

    getSpatialAttribute() {
        return this.spatialAttribute
    }

    preShowData(datastore: any): void {
        throw new Error('To be implemented')
    }

    showData(datastore: any) {
        throw new Error('To be implemented')
    }

    protected initColumns(): void {
        throw new Error('To be implemented')
    }
}

export class DatasetBasedLayer extends AbstractLayerContainer {
    private dsColumnsFromLayerField = new Map<string, string>()
    private coordType = null
    private coordFormat = null

    constructor(mapManager: MapManager, layer: any) {
        super(mapManager, layer)
    }

    protected initColumns(): void {
        const layer = this.getLayer()
        for (const column of layer.content.columnSelectedOfDataset) {
            const fieldType = column.fieldType
            const name = column.name

            if (fieldType == FIELD_TYPE_SPATIAL_ATTRIBUTE) {
                if (this.spatialAttribute != null) {
                    throw new Error('Multiple spatial attribute')
                }
                this.spatialAttribute = column
                const properties = column.properties
                this.coordType = properties?.coordType
                this.coordFormat = properties?.coordFormat
            } else if (fieldType == FIELD_TYPE_ATTRIBUTE) {
                this.attributes.push(column)
                this.attributeByName.set(name, column)
            } else if (fieldType === FIELD_TYPE_MEASURE) {
                this.measures.push(column)
                this.measureByName.set(name, column)
            }
        }
    }

    preShowData(datastore: any): void {
        const metaData = datastore.metaData
        // The first item is the string "recNo"
        const fields = (metaData.fields as []).slice(1)

        const neededMeasures = this.measures

        for (const field of fields) {
            this.dsColumnsFromLayerField.set(field.header, field.name)
        }

        // Spatial attribute
        const neededSpatialAttribute = this.spatialAttribute
        const hasNeededSpatialAttribute = fields.find((e) => e.header === neededSpatialAttribute.name)

        if (!hasNeededSpatialAttribute) {
            throw new Error('Dataset is missing spatial attribute')
        }

        // Attributes
        const neededAttributes = this.attributes
        let hasNeededAttributes = true

        for (const neededAttribute of neededAttributes) {
            hasNeededAttributes = hasNeededAttributes && fields.find((e) => e.header === neededAttribute.name)
        }

        if (!hasNeededAttributes) {
            throw new Error('Dataset is missing required attributes')
        }

        let hasNeededMeasures = true

        for (const neededMeasure of neededMeasures) {
            hasNeededMeasures = hasNeededMeasures && fields.find((e) => e.header === neededMeasure.name)
        }

        if (!hasNeededMeasures) {
            throw new Error('Dataset is missing required attributes')
        }
    }

    showData(datastore: any) {}
}
