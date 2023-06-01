export interface MapLayerManager {
    layer: any
}

class AbstractLayerManager implements MapLayerManager {
    layer = null
}

class DatasetBased extends AbstractLayerManager {
    constructor(layer: any) {
        super()
        this.layer = layer
    }
}

class CatalogLayerPlusDataset extends AbstractLayerManager {
    constructor(layer: any) {
        super()
        this.layer = layer
    }
}

export class MapLayerManagerCreator {
    static create(layer: any): MapLayerManager {
        const layerType = layer.type

        if (layerType === 'CATALOG') {
            return new CatalogLayerPlusDataset(layer)
        } else if (layerType === 'DATASET') {
            return new DatasetBased(layer)
        } else {
            throw new Error('No manager for following type of layer: ' + layerType)
        }
    }
}
