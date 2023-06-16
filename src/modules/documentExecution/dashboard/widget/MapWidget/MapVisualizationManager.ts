import { VegaLiteIcon } from './LeafletExtension'
import { MapManager } from './MapManagerCreator'
import L from 'leaflet'

const VISUALIZATION_TYPE_MARKER = 'markers'
const VISUALIZATION_TYPE_PIE = 'pies'

export class MapFeatureStyle {
    color = 'red'
    strokeColor = 'black'
    strokeWidth = 2
    icon: L.Icon | string
    iconRadius = 7
}

interface StyleHandler {
    setNext(handler: StyleHandler)
    handle(mapManager: MapManager, settings: any, row: any, measureValue: any, featureStyle: MapFeatureStyle): void
}

class AbstractStyleHandler implements StyleHandler {
    private nextHandler: StyleHandler | null

    constructor() {
        this.nextHandler = null
    }

    public setNext(handler: StyleHandler): StyleHandler {
        this.nextHandler = handler
        return handler
    }

    public handle(mapManager: MapManager, settings: any, row: any, measureValue: any, featureStyle: MapFeatureStyle): void {
        if (this.nextHandler) {
            this.nextHandler.handle(mapManager, settings, row, measureValue, featureStyle)
        }
    }
}

class CacheStyleHandler extends AbstractStyleHandler {
    public handle(mapManager: MapManager, settings: any, row: any, measureValue: any, featureStyle: MapFeatureStyle): void {
        // TODO

        super.handle(mapManager, settings, row, measureValue, featureStyle)
    }
}

class ConditionalStyleHandler extends AbstractStyleHandler {
    private mapManager: MapManager
    private enabled: boolean

    constructor(mapManager: MapManager) {
        super()

        this.mapManager = mapManager

        const model = mapManager.getModel()
        const settings = model.settings
        const conditionalStyles = settings.conditionalStyles

        this.enabled = conditionalStyles.enabled
        if (this.enabled) {
            for (const condition of conditionalStyles.conditions) {
                console.log(condition)
                // TODO
            }
        }
    }

    public handle(mapManager: MapManager, settings: any, row: any, measureValue: any, featureStyle: MapFeatureStyle): void {
        super.handle(mapManager, settings, row, measureValue, featureStyle)
    }
}

const MARKER_CONF_TYPE_DEFAULT = 'default'

class MarkerStyleHandler extends AbstractStyleHandler {
    public handle(mapManager: MapManager, settings: any, row: any, measureValue: any, featureStyle: MapFeatureStyle): void {
        const markerConf = settings.markerConf
        const markerType = markerConf.type
        const markerStyle = markerConf.style

        if (markerType === MARKER_CONF_TYPE_DEFAULT) {
            featureStyle.strokeColor = markerStyle.borderColor || featureStyle.strokeColor
            featureStyle.color = markerStyle.color || featureStyle.color
        } else {
            throw new Error('Following marker type is not supported: ' + markerType)
        }

        super.handle(mapManager, settings, row, measureValue, featureStyle)

        const width = featureStyle.iconRadius * 2 + featureStyle.strokeWidth * 2
        const height = width
        const offset = featureStyle.iconRadius + featureStyle.strokeWidth

        featureStyle.icon = `
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${width}" height="${height}">
                <circle
                    style="background-color: transparent; fill: ${featureStyle.color}; stroke: ${featureStyle.strokeColor}; stroke-width: ${featureStyle.strokeWidth}"
                    r="${featureStyle.iconRadius}"
                    cy="${offset}"
                    cx="${offset}" />
            </svg>
        `
    }
}

class PieStyleHandler extends AbstractStyleHandler {
    public handle(mapManager: MapManager, settings: any, row: any, measureValue: any, featureStyle: MapFeatureStyle): void {
        featureStyle.icon = new VegaLiteIcon({})
    }
}

export interface MapVisualizationManager {
    getStyle(row: any, measureValue: any): MapFeatureStyle
}

class AbstractMapVisualizationManager implements MapVisualizationManager {
    protected mapManager: MapManager
    protected settings: any

    constructor(mapManager: MapManager, settings: any) {
        this.mapManager = mapManager
        this.settings = settings
    }

    getStyle(row: any, measureValue: any): MapFeatureStyle {
        throw new Error('To be implemented')
    }
}

export class MarkerMapVisualizationManager extends AbstractMapVisualizationManager {
    private styleHandler: StyleHandler

    constructor(mapManager: MapManager, settings: any) {
        super(mapManager, settings)

        const sh1 = new CacheStyleHandler()
        const sh2 = new MarkerStyleHandler()
        const sh3 = new ConditionalStyleHandler(mapManager)

        sh1.setNext(sh2).setNext(sh3)

        this.styleHandler = sh1
    }

    getStyle(row: any, measureValue: any): MapFeatureStyle {
        const featureStyle = new MapFeatureStyle()
        this.styleHandler.handle(this.mapManager, this.settings, row, measureValue, featureStyle)
        return featureStyle
    }
}

export class PieVisualizationManager extends AbstractMapVisualizationManager {
    private styleHandler: StyleHandler

    constructor(mapManager: MapManager, settings: any) {
        super(mapManager, settings)

        const sh1 = new PieStyleHandler()

        this.styleHandler = sh1
    }

    getStyle(row: any, measureValue: any): MapFeatureStyle {
        const featureStyle = new MapFeatureStyle()
        this.styleHandler.handle(this.mapManager, this.settings, row, measureValue, featureStyle)
        return featureStyle
    }
}

export class MapVisualizationManagerCreator {
    static create(mapManager: MapManager, type: string, settings: any): MapVisualizationManager {
        if (type === VISUALIZATION_TYPE_MARKER) {
            return new MarkerMapVisualizationManager(mapManager, settings)
        } else if (type === VISUALIZATION_TYPE_PIE) {
            return new PieVisualizationManager(mapManager, settings)
        } else {
            throw new Error('Following visualization type is not supported: ' + type)
        }
    }
}
