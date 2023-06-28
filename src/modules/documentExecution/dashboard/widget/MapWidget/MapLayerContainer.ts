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
    getFeatureGenerator(): FeatureGenerator

    preShowData(datastore: any): void
    showData(datastore: any): void
    afterShowData(datastore: any): void

    getSpatialAttributeValueFromRow(row: any): any

    getMeasureValueFromRow(row: any): any
    getMeasureColumnName(): string
    getMeasureAlias(): string
    getMeasureStatsFromDatastore(): any

    // DELETE : getCategoryValueFromRow(row: any): any
    // DELETE : getCategoryColumnName(): string
    // DELETE : getCategoryAlias(): string
    // DELETE : getCategoryStatsFromDatastore(): any
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

    protected spatialAttributeColumnName = null

    protected measureColumnName = null
    protected measureAlias = null
    protected measureStats = null

    // DELETE : protected categoryColumnName = null
    // DELETE : protected categoryAlias = null
    // DELETE : protected categoryStats = null

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

    getFeatureGenerator(): FeatureGenerator {
        return this.featureGenerator
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
        throw new Error('Method not implemented.')
    }

    showData(datastore: any) {
        throw new Error('Method not implemented.')
    }

    afterShowData(datastore: any): void {
        throw new Error('Method not implemented.')
    }

    getSpatialAttributeColumnName(): string {
        return this.spatialAttributeColumnName
    }

    getSpatialAttributeValueFromRow(row: any) {
        return row[this.spatialAttributeColumnName]
    }

    getMeasureValueFromRow(row: any) {
        return row[this.measureColumnName]
    }

    getMeasureColumnName(): string {
        return this.measureColumnName
    }

    getMeasureAlias(): string {
        return this.measureAlias
    }

    getMeasureStatsFromDatastore() {
        return this.measureStats
    }

    // DELETE : getCategoryValueFromRow(row: any) {
    // DELETE :     return row[this.categoryColumnName]
    // DELETE : }
    // DELETE : getCategoryColumnName(): string {
    // DELETE :     return this.categoryColumnName
    // DELETE : }
    // DELETE : getCategoryAlias(): string {
    // DELETE :     return this.categoryAlias
    // DELETE : }
    // DELETE : getCategoryStatsFromDatastore() {
    // DELETE :     return this.categoryStats
    // DELETE : }

    protected initColumns(): void {
        throw new Error('Method not implemented.')
    }
}

export class DatasetBasedLayer extends AbstractLayerContainer {
    private dsColumnsFromLayerField = new Map<string, string>()
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

        // TODO : this.proprietaryLayer.showDataStore(this, datastore)
    }

    showRow(row: any) {
        const featureStyle = this.visualizationManager.getStyle(row)

        const feature = this.featureGenerator.generate(row, featureStyle)

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

        // Get active measure
        this.controlPanelItem = this.mapManager.getControlPanel().getLayer(this.layerId)
        const selectedMeasure = this.controlPanelItem?.getSelected()

        this.spatialAttributeColumnName = this.dsColumnsFromLayerField.get(neededSpatialAttribute.name)

        this.selectedMeasure = selectedMeasure?.getName()
        this.measureAlias = selectedMeasure?.getAlias()
        this.measureColumnName = this.dsColumnsFromLayerField.get(this.selectedMeasure)
        this.measureStats = Object.values(datastore.stats).find((value) => value.name === this.measureColumnName)
    }

    private initProprietaryLayer(): void {
        this.proprietaryLayer = this.mapManager.createProprietaryLayer(this)
    }
}
