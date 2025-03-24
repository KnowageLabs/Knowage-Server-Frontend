import { IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, getColumnName, VisualizationDataType } from '../LeafletHelper'
import { addDialogToMarkerForLayerData, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getCoordinatesFromWktPointFeature, getMinMaxByName, getNumericPropertyValues, incrementColumnName, transformDataUsingForeginKey, validateNumber } from './MapVisualizationHelper'
import L from 'leaflet'
import Chart from 'chart.js/auto'
import vegaEmbed from 'vega-embed'

export const addMapCharts = (
    map: any,
    data: any,
    model: IWidget,
    target: IMapWidgetLayer,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    markerBounds: any[],
    layersData: any,
    visualizationDataType: VisualizationDataType,
    targetDatasetData: any
) => {
    console.log('---------- layerVisualizationSettings: ', layerVisualizationSettings)
    console.log('---------- layersData: ', layersData)

    addMapChartsUsingLayer(map, layersData, layerGroup, layerVisualizationSettings, markerBounds, model, spatialAttribute, targetDatasetData, dataColumn)
}

const addMapChartsUsingLayer = (map: any, layersData: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, spatialAttribute: any, targetDatasetData?: any, dataColumn?: string) => {
    let minValue = Number.MIN_SAFE_INTEGER
    let maxValue = Number.MAX_SAFE_INTEGER
    let mappedData: Record<string, number> | null = null

    if (targetDatasetData && dataColumn) {
        if (!layerVisualizationSettings.targetDataset) return

        const valueColumnMinMaxValues = getMinMaxByName(targetDatasetData.stats, incrementColumnName(dataColumn))
        minValue = valueColumnMinMaxValues?.min ?? Number.MIN_SAFE_INTEGER
        maxValue = valueColumnMinMaxValues?.max ?? Number.MAX_SAFE_INTEGER

        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)

        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
    } else {
        if (layersData && layerVisualizationSettings.targetType === 'property' && layerVisualizationSettings.targetProperty) {
            const layerPropertyValues = getNumericPropertyValues(layersData, layerVisualizationSettings.targetProperty)
            minValue = Math.min(...layerPropertyValues) ?? 0
            maxValue = Math.max(...layerPropertyValues) ?? 0
        }
    }

    const id = 'bojan'

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addBaloonMarkerUsingLayersPointClassifedByEqualIntervals(map, feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, minValue, maxValue, null, id)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addBaloonMarkerUsingLayersPointClassifedByEqualIntervals(map, feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, minValue, maxValue, coord, id)
            })
        }
    })
}

const addBaloonMarkerUsingLayersPointClassifedByEqualIntervals = (
    map: any,
    feature: ILayerFeature,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    mappedData: any,
    layerGroup: any,
    spatialAttribute: any,
    widgetModel: IWidget,
    markerBounds: any[],
    minValue: number,
    maxValue: number,
    coord: any[] | null,
    id
) => {
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : feature.properties[layerVisualizationSettings.targetProperty]

    validateNumber(value)

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)

    console.log('---- GENERATED ID: ', id)
    const data = [10, 20, 30, 40]

    const customIcon = L.divIcon({
        html: `<div id='${id}'></div>`,
        iconSize: [50, 50],
        className: 'custom-icon'
    })
    const marker = L.marker([51.505, -0.09], { icon: customIcon }).addTo(map)

    createVegaPieChart(data, id)

    // addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, chart)
    // addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, chart)
}

let chartCache = {} // Salviamo le immagini già create

function createVegaPieChart(data, id) {
    let key = data.join('-') // Chiave per la cache

    const pieSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 100,
        height: 100,
        data: { values: data.map((v, i) => ({ category: `Cat${i + 1}`, value: v })) },
        mark: 'arc',
        encoding: {
            theta: { field: 'value', type: 'quantitative' },
            color: { field: 'category', type: 'nominal', scale: { range: ['red', 'blue', 'green'] } }
        }
    }

    vegaEmbed('#' + id, pieSpec as any, { renderer: 'svg' })
}
