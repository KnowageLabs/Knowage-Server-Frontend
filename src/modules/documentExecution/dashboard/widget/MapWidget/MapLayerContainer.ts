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

    preShowData(datastore: any): void
    showData(datastore: any): void
}

class AbstractLayerContainer implements LayerContainer {
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

    constructor(mapManager: MapManager, layerId: string, layer: any, visualizationManager: MapVisualizationManager) {
        this.mapManager = mapManager
        this.layerId = layerId
        this.layer = layer
        this.visualizationManager = visualizationManager

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
            this.featureGenerator = new MarkerGenerator(this.mapManager, isLongLat)
        } else if (this.coordType === COORD_TYPE_GEOJSON) {
            this.featureGenerator = new GeoJSONGenerator(this.mapManager)
        } else if (this.coordType == COORD_TYPE_WKT) {
            this.featureGenerator = new WKTGenerator(this.mapManager)
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
        this.controlPanelItem = this.mapManager.getControlPanel().getLayer(this.layerId)
        this.selectedMeasure = this.controlPanelItem?.getSelected()?.getName()
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
    private spatialAttributeColumnName = null
    private measureColumnName = null

    constructor(mapManager: MapManager, layerId: string, layer: any, visualizationManager: MapVisualizationManager) {
        super(mapManager, layerId, layer, visualizationManager)
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
        super.preShowData(datastore)

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

        this.spatialAttributeColumnName = this.dsColumnsFromLayerField.get(neededSpatialAttribute.name)

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

        console.log(this.measureColumnName)

        this.featureGenerator.generate(spatialAttributeValue, measureValue, featureStyle)
    }
}
