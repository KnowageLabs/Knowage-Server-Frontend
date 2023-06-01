export interface MapLayerVisualization {
    layer: any
}

class AbstractLayerVisualization implements MapLayerVisualization {
    layer = null
}

class MarkerVisualization extends AbstractLayerVisualization {}

class BalloonVisualization extends AbstractLayerVisualization {}

class PieVisualization extends AbstractLayerVisualization {}

class ClusterVisualization extends AbstractLayerVisualization {}

class HeatMapVisualization extends AbstractLayerVisualization {}

class ChoroplethMapVisualization extends AbstractLayerVisualization {}

export class MapLayerManagerCreator {
    static create(layer: any): MapLayerVisualization {
        const visualizationType = null

        if (visualizationType === 'markers') {
            return new MarkerVisualization()
        } else if (visualizationType === 'balloons') {
            return new BalloonVisualization()
        } else if (visualizationType === 'pies') {
            return new PieVisualization()
        } else if (visualizationType === 'clusters') {
            return new ClusterVisualization()
        } else if (visualizationType === 'heatmap') {
            return new HeatMapVisualization()
        } else if (visualizationType === 'choropleth') {
            return new ChoroplethMapVisualization()
        } else {
            throw new Error('Following visualization type is not supported: ' + visualizationType)
        }
    }
}
