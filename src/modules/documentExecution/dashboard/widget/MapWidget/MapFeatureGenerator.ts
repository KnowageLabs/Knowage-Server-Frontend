import { LayerContainer } from './MapLayerContainer'
import { MapManager } from './MapManagerCreator'
import { MapFeatureStyle } from './MapVisualizationManager'
import { FEATURE_PROPERTY_LAYER_ID, FEATURE_PROPERTY_MEASURE_VALUE, FEATURE_PROPERTY_SPATIAL_ATTRIBUTE_VALUE } from './MapConstants'

const REGEX_LAT_LON = new RegExp('^\\s*(?<lat>-?(?:[0-8]?[0-9]|90)(?:\\.[0-9]{1,10})?)[, ](?<lon>-?(?:[0-9]{1,2}|1[0-7][0-9]|180)(?:\\.[0-9]{1,10})?)\\s*$')
const REGEX_LON_LAT = new RegExp('^\\s*(?<lon>-?(?:[0-9]{1,2}|1[0-7][0-9]|180)(?:\\.[0-9]{1,10})?)[, ](?<lat>-?(?:[0-8]?[0-9]|90)(?:\\.[0-9]{1,10})?)\\s*$')

export interface FeatureGenerator {
    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle): any
}

abstract class AbstractFeatureGenerator implements FeatureGenerator {
    protected mapManager: MapManager
    protected layerContainer: LayerContainer

    constructor(mapManager: MapManager, layerContainer: LayerContainer) {
        this.mapManager = mapManager
        this.layerContainer = layerContainer
    }

    protected createMarkerProperties(): void {}

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle) {
        throw new Error('To be implemented')
    }

    protected generateProperties(spatialValue: string, measureValue: any): any {
        const ret = {}

        ret[FEATURE_PROPERTY_LAYER_ID] = this.layerContainer.getLayerId()
        ret[FEATURE_PROPERTY_SPATIAL_ATTRIBUTE_VALUE] = spatialValue
        ret[FEATURE_PROPERTY_MEASURE_VALUE] = measureValue

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

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle): any {
        const m = this.regex.exec(spatialValue)

        if (m == null) {
            throw new Error('Error parsing following value: ' + spatialValue)
        }

        // The + sign convert string to number
        const latitude = +m[this.latitudeGroupIdx]
        const longitude = +m[this.longitudeGroupIdx]
        const properties = this.generateProperties(spatialValue, measureValue)

        return this.mapManager.createMarkerFeature(latitude, longitude, featureStyle, properties)
    }
}
export class GeoJSONGenerator extends AbstractFeatureGenerator {
    constructor(mapManager: MapManager, layerContainer: LayerContainer) {
        super(mapManager, layerContainer)
    }

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle): any {
        const properties = this.generateProperties(spatialValue, measureValue)

        return this.mapManager.createGeoJSONFeature(spatialValue, featureStyle, properties)
    }
}
export class WKTGenerator extends AbstractFeatureGenerator {
    constructor(mapManager: MapManager, layerContainer: LayerContainer) {
        super(mapManager, layerContainer)
    }

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle): any {
        const properties = this.generateProperties(spatialValue, measureValue)

        return this.mapManager.createWKTFeature(spatialValue, featureStyle, properties)
    }
}
