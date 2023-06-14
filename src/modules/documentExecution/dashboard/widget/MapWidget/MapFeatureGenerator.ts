import { MapManager } from './MapManagerCreator'
import { MapFeatureStyle } from './MapVisualizationManager'

const REGEX_LAT_LON = new RegExp('^\\s*(?<lat>-?(?:[0-8]?[0-9]|90)(?:\\.[0-9]{1,10})?)[, ](?<lon>-?(?:[0-9]{1,2}|1[0-7][0-9]|180)(?:\\.[0-9]{1,10})?)\\s*$')
const REGEX_LON_LAT = new RegExp('^\\s*(?<lon>-?(?:[0-9]{1,2}|1[0-7][0-9]|180)(?:\\.[0-9]{1,10})?)[, ](?<lat>-?(?:[0-8]?[0-9]|90)(?:\\.[0-9]{1,10})?)\\s*$')

export interface FeatureGenerator {
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

export class MarkerGenerator extends AbstractFeatureGenerator {
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
export class GeoJSONGenerator extends AbstractFeatureGenerator {
    constructor(mapManager: MapManager) {
        super(mapManager)
    }

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle) {
        const properties = {}

        this.mapManager.createGeoJSONFeature(spatialValue, featureStyle, properties)
    }
}
export class WKTGenerator extends AbstractFeatureGenerator {
    constructor(mapManager: MapManager) {
        super(mapManager)
    }

    generate(spatialValue: string, measureValue: any, featureStyle: MapFeatureStyle) {
        const properties = {}

        this.mapManager.createWKTFeature(spatialValue, featureStyle, properties)
    }
}
