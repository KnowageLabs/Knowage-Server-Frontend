import { MapManager } from './MapManagerCreator'
import { MapFeatureStyle, MapVisualizationManager } from './MapVisualizationManager'
import { FIELD_TYPE_SPATIAL_ATTRIBUTE, FIELD_TYPE_ATTRIBUTE, FIELD_TYPE_MEASURE } from './MapConstants'
import { ControlPanelItem } from './MapControlPanel'

const COORD_TYPE_STRING = 'string'
const COORD_TYPE_GEOJSON = 'json'
const COORD_TYPE_WKT = 'wkt'

const COORD_TYPE_FORMAT_LAT_LON = 'lat lon'
const COORD_TYPE_FORMAT_LON_LAT = 'lon lat'

const REGEX_LAT_LON = new RegExp('^\\s*(?<lat>-?(?:[0-8]?[0-9]|90)(?:\\.[0-9]{1,10})?)[, ](?<lon>-?(?:[0-9]{1,2}|1[0-7][0-9]|180)(?:\\.[0-9]{1,10})?)\\s*$')
const REGEX_LON_LAT = new RegExp('^\\s*(?<lon>-?(?:[0-9]{1,2}|1[0-7][0-9]|180)(?:\\.[0-9]{1,10})?)[, ](?<lat>-?(?:[0-8]?[0-9]|90)(?:\\.[0-9]{1,10})?)\\s*$')

interface FeatureGenerator {
    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle): any
}

abstract class AbstractFeatureGenerator implements FeatureGenerator {
    protected mapManager: MapManager

    constructor(mapManager: MapManager) {
        this.mapManager = mapManager
    }

    protected createMarkerProperties(): void {}

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle) {
        throw new Error('To be implemented')
    }
}

class MarkerGenerator extends AbstractFeatureGenerator {
    private isLongLat = false
    private regex = REGEX_LAT_LON
    private latitudeGroupIdx = 1
    private longitudeGroupIdx = 2

    constructor(mapManager: MapManager, isLongLat: boolean) {
        super(mapManager)
        this.isLongLat = isLongLat

        if (this.isLongLat) {
            this.regex = REGEX_LON_LAT

            this.latitudeGroupIdx = 2
            this.longitudeGroupIdx = 1
        }
    }

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle) {
        const m = this.regex.exec(spatialValue)

        if (m == null) {
            throw new Error('Error parsing following value: ' + spatialValue)
        }

        // The + sign convert string to number
        const latitude = +m[this.latitudeGroupIdx]
        const longitude = +m[this.longitudeGroupIdx]
        const properties = {}

        this.mapManager.createMarkerFeature(latitude, longitude, featureStyle, properties)
    }
}
class GeoJSONGenerator extends AbstractFeatureGenerator {
    constructor(mapManager: MapManager) {
        super(mapManager)
    }

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle) {
        const properties = {}

        this.mapManager.createGeoJSONFeature(spatialValue, featureStyle, properties)
    }
}
class WKTGenerator extends AbstractFeatureGenerator {
    constructor(mapManager: MapManager) {
        super(mapManager)
    }

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle) {
        const properties = {}

        this.mapManager.createWKTFeature(spatialValue, featureStyle, properties)
    }
}

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
            const isLongLat = this.coordFormat == COORD_TYPE_FORMAT_LON_LAT
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
