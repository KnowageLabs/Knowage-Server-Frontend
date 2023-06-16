import { FIELD_TYPE_SPATIAL_ATTRIBUTE, FIELD_TYPE_ATTRIBUTE, FIELD_TYPE_MEASURE } from './MapConstants'
import { ControlPanelItem } from './MapControlPanel'
import { FeatureGenerator, GeoJSONGenerator, MarkerGenerator, WKTGenerator } from './MapFeatureGenerator'
import { MapManager } from './MapManagerCreator'
import { MapVisualizationManager } from './MapVisualizationManager'

const COORD_TYPE_STRING = 'string'
const COORD_TYPE_GEOJSON = 'json'
const COORD_TYPE_WKT = 'wkt'

const COORD_TYPE_FORMAT_LAT_LON = 'lat lon'
const COORD_TYPE_FORMAT_LON_LAT = 'lon lat'

export interface LayerContainer {
    getAttributes(): any[]
    getAttributeByName(name: string): any
    getMeasures(): any[]
    getMeasureByName(name: string): any
    getSpatialAttribute(): any

    getLayer(): any
    getLayerId(): string
    getLayerIndex(): number

    getVisualizationManager(): MapVisualizationManager

    preShowData(datastore: any): void
    showData(datastore: any): void
    afterShowData(datastore: any): void
}

class AbstractLayerContainer implements LayerContainer {
    protected index: number
    protected layer: any
    protected layerId: string

    protected spatialAttribute = null
    protected attributes = [] as any[]
    protected measures = [] as any[]

    protected attributeByName = new Map<string, any>()
    protected measureByName = new Map<string, any>()

    protected featureGenerator: FeatureGenerator
    protected visualizationManager: MapVisualizationManager

    protected mapManager: MapManager

    protected coordType = null
    protected coordFormat = null

    protected controlPanelItem: ControlPanelItem | undefined
    protected selectedMeasure: string | undefined

    constructor(mapManager: MapManager, layerId: string, layer: any, visualizationManager: MapVisualizationManager, index: number) {
        this.mapManager = mapManager
        this.layerId = layerId
        this.layer = layer
        this.visualizationManager = visualizationManager
        this.index = index

        this.initColumns()

        if (this.coordType === undefined || this.coordType === COORD_TYPE_STRING) {
            let isLongLat = false
            if (this.coordFormat === COORD_TYPE_FORMAT_LAT_LON) {
                isLongLat = false
            } else if (this.coordFormat === COORD_TYPE_FORMAT_LON_LAT) {
                isLongLat = true
            } else {
                throw new Error('Following coordinate format is not supported: ' + this.coordFormat)
            }
            this.featureGenerator = new MarkerGenerator(this.mapManager, this, isLongLat)
        } else if (this.coordType === COORD_TYPE_GEOJSON) {
            this.featureGenerator = new GeoJSONGenerator(this.mapManager, this)
        } else if (this.coordType == COORD_TYPE_WKT) {
            this.featureGenerator = new WKTGenerator(this.mapManager, this)
        } else {
            throw new Error('Following cordinate type is not supported: ' + this.coordType)
        }
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

    getLayerId(): string {
        return this.layerId
    }

    getLayerIndex(): number {
        return this.index
    }

    getVisualizationManager(): MapVisualizationManager {
        return this.visualizationManager
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

    afterShowData(datastore: any): void {
        throw new Error('To be implemented')
    }

    protected initColumns(): void {
        throw new Error('To be implemented')
    }
}

export class DatasetBasedLayer extends AbstractLayerContainer {
    private dsColumnsFromLayerField = new Map<string, string>()
    private spatialAttributeColumnName = null
    private measureColumnName = null
    private proprietaryLayer = null

    constructor(mapManager: MapManager, layerId: string, layer: any, visualizationManager: MapVisualizationManager, index: number) {
        super(mapManager, layerId, layer, visualizationManager, index)
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
        this.initColumnsFromDatastore(datastore)
        this.initProprietaryLayer()
    }

    showData(datastore: any): void {
        const rows = datastore.rows

        for (const row of rows) {
            try {
                this.showRow(row)
            } catch (e) {
                console.log('Error showing following record: ' + row, e)
                throw new Error('Error showing following record: ' + row)
            }
        }
    }

    showRow(row: any) {
        const spatialAttributeValue = row[this.spatialAttributeColumnName]
        const measureValue = row[this.measureColumnName]
        const featureStyle = this.visualizationManager.getStyle(row)

        const feature = this.featureGenerator.generate(spatialAttributeValue, measureValue, featureStyle)

        this.mapManager.addFeatureToProprietaryLayer(feature, this.proprietaryLayer)
    }

    afterShowData(datastore: any): void {
        this.mapManager.addProprietaryLayerToProprietaryMap(this.proprietaryLayer)
    }

    private initColumnsFromDatastore(datastore: any): void {
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

        this.measureColumnName = this.dsColumnsFromLayerField.get(this.selectedMeasure)

        // Get active measure
        this.controlPanelItem = this.mapManager.getControlPanel().getLayer(this.layerId)
        this.selectedMeasure = this.controlPanelItem?.getSelected()?.getName()

        // Cache column name for spatial attribute and current measure
        this.spatialAttributeColumnName = this.dsColumnsFromLayerField.get(neededSpatialAttribute.name)
        this.measureColumnName = this.dsColumnsFromLayerField.get(this.selectedMeasure)
    }

    private initProprietaryLayer(): void {
        this.proprietaryLayer = this.mapManager.createProprietaryLayer(this)
    }
}
