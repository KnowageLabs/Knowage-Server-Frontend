import { LayerContainer } from './MapLayerContainer'
import { MapManager } from './MapManagerCreator'
import { MapFeatureStyle } from './MapVisualizationManager'
import {
    FEATURE_PROPERTY_LAYER_ID,
    FEATURE_PROPERTY_MEASURE_VALUE,
    FEATURE_PROPERTY_MEASURE_STATS,
    FEATURE_PROPERTY_SPATIAL_ATTRIBUTE_VALUE,
    FEATURE_PROPERTY_CATEGORY_VALUE,
    FEATURE_PROPERTY_CATEGORY_STATS,
    FEATURE_PROPERTY_MEASURE_COLUMN_NAME,
    FEATURE_PROPERTY_MEASURE_ALIAS,
    FEATURE_PROPERTY_CATEGORY_COLUMN_NAME,
    FEATURE_PROPERTY_CATEGORY_ALIAS,
    FEATURE_PROPERTY_ID
} from './MapConstants'

const REGEX_LAT_LON = new RegExp('^\\s*(?<lat>-?(?:[0-8]?[0-9]|90)(?:\\.[0-9]{1,10})?)[, ](?<lon>-?(?:[0-9]{1,2}|1[0-7][0-9]|180)(?:\\.[0-9]{1,10})?)\\s*$')
const REGEX_LON_LAT = new RegExp('^\\s*(?<lon>-?(?:[0-9]{1,2}|1[0-7][0-9]|180)(?:\\.[0-9]{1,10})?)[, ](?<lat>-?(?:[0-8]?[0-9]|90)(?:\\.[0-9]{1,10})?)\\s*$')

export interface FeatureGenerator {
    generate(row: any, featureStyle: MapFeatureStyle): any
}

abstract class AbstractFeatureGenerator implements FeatureGenerator {
    protected mapManager: MapManager
    protected layerContainer: LayerContainer

    constructor(mapManager: MapManager, layerContainer: LayerContainer) {
        this.mapManager = mapManager
        this.layerContainer = layerContainer
    }

    protected createMarkerProperties(): void {}

    generate(row: any, featureStyle: MapFeatureStyle) {
        throw new Error('Method not implemented.')
    }

    protected generateProperties(row: any): any {
        const ret = {}
        const layerContainer = this.layerContainer

        const layerId = layerContainer.getLayerId()
        const spatialAttributeValue = layerContainer.getSpatialAttributeValueFromRow(row)
        const measureValue = layerContainer.getMeasureValueFromRow(row)
        const measureColumnName = layerContainer.getMeasureColumnName()
        const measureAlias = layerContainer.getMeasureAlias()
        const measureStats = layerContainer.getMeasureStatsFromDatastore()
        // DELETE : const categoryValue = layerContainer.getCategoryValueFromRow(row)
        // DELETE : const categoryColumnName = layerContainer.getCategoryColumnName()
        // DELETE : const categoryAlias = layerContainer.getCategoryAlias()
        // DELETE : const categoryStats = layerContainer.getCategoryStatsFromDatastore()

        ret[FEATURE_PROPERTY_LAYER_ID] = layerId

        ret[FEATURE_PROPERTY_SPATIAL_ATTRIBUTE_VALUE] = spatialAttributeValue

        ret[FEATURE_PROPERTY_MEASURE_VALUE] = measureValue
        ret[FEATURE_PROPERTY_MEASURE_COLUMN_NAME] = measureColumnName
        ret[FEATURE_PROPERTY_MEASURE_ALIAS] = measureAlias
        ret[FEATURE_PROPERTY_MEASURE_STATS] = measureStats

        // DELETE : ret[FEATURE_PROPERTY_CATEGORY_VALUE] = categoryValue
        // DELETE : ret[FEATURE_PROPERTY_CATEGORY_COLUMN_NAME] = categoryColumnName
        // DELETE : ret[FEATURE_PROPERTY_CATEGORY_ALIAS] = categoryAlias
        // DELETE : ret[FEATURE_PROPERTY_CATEGORY_STATS] = categoryStats

        return ret
    }
}

export class MarkerGenerator extends AbstractFeatureGenerator {
    private isLongLat = false
    private regex = REGEX_LAT_LON
    private latitudeGroupIdx = 1
    private longitudeGroupIdx = 2

    constructor(mapManager: MapManager, layerContainer: LayerContainer, isLongLat: boolean) {
        super(mapManager, layerContainer)
        this.isLongLat = isLongLat

        if (this.isLongLat) {
            this.regex = REGEX_LON_LAT

            this.latitudeGroupIdx = 2
            this.longitudeGroupIdx = 1
        }
    }

    generate(row: any, featureStyle: MapFeatureStyle): any {
        const layerContainer = this.layerContainer
        const spatialValue = layerContainer.getSpatialAttributeValueFromRow(row)
        const m = this.regex.exec(spatialValue)

        if (m == null) {
            throw new Error('Error parsing following value: ' + spatialValue)
        }

        // The + sign convert string to number
        const latitude = +m[this.latitudeGroupIdx]
        const longitude = +m[this.longitudeGroupIdx]
        const properties = this.generateProperties(row)

        return this.mapManager.createMarkerFeature(latitude, longitude, featureStyle, properties)
    }
}
export class GeoJSONGenerator extends AbstractFeatureGenerator {
    constructor(mapManager: MapManager, layerContainer: LayerContainer) {
        super(mapManager, layerContainer)
    }

    generate(row: any, featureStyle: MapFeatureStyle): any {
        const layerContainer = this.layerContainer
        const spatialValue = layerContainer.getSpatialAttributeValueFromRow(row)
        const properties = this.generateProperties(row)

        return this.mapManager.createGeoJSONFeature(spatialValue, featureStyle, properties)
    }
}
export class WKTGenerator extends AbstractFeatureGenerator {
    constructor(mapManager: MapManager, layerContainer: LayerContainer) {
        super(mapManager, layerContainer)
    }

    generate(row: any, featureStyle: MapFeatureStyle): any {
        const layerContainer = this.layerContainer
        const spatialValue = layerContainer.getSpatialAttributeValueFromRow(row)
        const properties = this.generateProperties(row)

        return this.mapManager.createWKTFeature(spatialValue, featureStyle, properties)
    }
}
