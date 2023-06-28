import { Class, Icon, FeatureGroup, Layer, Path, Util, Marker } from 'leaflet'
import embed from 'vega-embed'
import { FEATURE_PROPERTY_ROOT, FEATURE_PROPERTY_SPATIAL_ATTRIBUTE_VALUE, FEATURE_PROPERTY_MEASURE_VALUE, FEATURE_PROPERTY_CATEGORY_VALUE, FEATURE_PROPERTY_MEASURE_STATS, FEATURE_PROPERTY_CATEGORY_STATS } from './MapConstants'

Class.include({
    getKnSpatialValue: function () {
        return this[FEATURE_PROPERTY_ROOT][FEATURE_PROPERTY_SPATIAL_ATTRIBUTE_VALUE]
    },
    getKnMeasureValue: function () {
        return this[FEATURE_PROPERTY_ROOT][FEATURE_PROPERTY_MEASURE_VALUE]
    },
    getKnMeasureStats: function () {
        return this[FEATURE_PROPERTY_ROOT][FEATURE_PROPERTY_MEASURE_STATS]
    },
    getKnCategoryValue: function () {
        return this[FEATURE_PROPERTY_ROOT][FEATURE_PROPERTY_CATEGORY_VALUE]
    },
    getKnCategoryStats: function () {
        return this[FEATURE_PROPERTY_ROOT][FEATURE_PROPERTY_CATEGORY_STATS]
    }
})

export const LeafleatBaseFeatureGroup = FeatureGroup.extend({
    options: {
        layerContainer: null
    },

    addFeature: function (feature) {
        this.addLayer(feature)
        return this
    }

    // showDataStore: function (layerManager, datastore) {
    //     const rows = datastore.rows
    //
    //     for (const row of rows) {
    //         try {
    //             this.showRow(row)
    //         } catch (e) {
    //             console.log('Error showing following record: ' + row, e)
    //             throw new Error('Error showing following record: ' + row)
    //         }
    //     }
    // },
    // showDataStoreRow: function (layerManager, row) {
    //     const layerContainer = this.options.layerContainer
    //     const spatialAttributeValue = layerContainer.getSpatialAttributeValueFromRow(row)
    //     const measureValue = layerContainer.getMeasureValueFromRow(row)
    //     const measuresStats = layerContainer.getMeasureStatsFromDatastore()
    //     const categoryValue = null
    //     const categoryStats = null
    //     const featureStyle = layerContainer.getVisualizationManager().getStyle(row)
    //
    //     const feature = layerContainer.featureGenerator.generate(spatialAttributeValue, measureValue, measuresStats, categoryValue, categoryStats, featureStyle)
    //
    //     this.mapManager.addFeatureToProprietaryLayer(feature, this.proprietaryLayer)
    // }
})

export const MarkerFeatureGroup = LeafleatBaseFeatureGroup.extend({})

export const LeafletPieFeatureGroup = LeafleatBaseFeatureGroup.extend({
    options: {
        pane: 'markerPane',
        layerManager: null
    },
    _featureAggregatedBySpatialAttribute: null,
    _categoryName: null,
    _categoryColumnName: null,
    initialize: function (layers, options) {
        Util.setOptions(this, options)
        FeatureGroup.prototype.initialize.call(this, layers, options)

        this._featureAggregatedBySpatialAttribute = new Map()

        const layerContainer = this.options.layerContainer
        const visualizationManager = layerContainer.getVisualizationManager()

        this._categoryName = visualizationManager.getCategoryColumnName()
        this._categoryColumnName = layerContainer.getAttributeByName(this._categoryName)

        debugger

        // TODO : layers???
    },
    addLayer: function (layer) {
        const newLayerLatLng = layer.getLatLng()
        const newLayerLatLngString = newLayerLatLng.toString()

        if (!this._featureAggregatedBySpatialAttribute.has(newLayerLatLngString)) {
            const icon = new VegaLiteIcon({
                layerContainer: this.options.layerContainer,
                parentLayer: this
            })

            const aggregationFeature = new Marker(newLayerLatLng, {
                pane: this.options.pane,
                icon: icon
            })

            this._featureAggregatedBySpatialAttribute.set(newLayerLatLngString, {
                latLng: newLayerLatLng,
                aggregate: [layer],
                feature: aggregationFeature
            })

            FeatureGroup.prototype.addLayer.call(this, aggregationFeature)
        } else {
            this._featureAggregatedBySpatialAttribute.get(newLayerLatLngString).aggregate.push(layer)
        }

        const curr = this._featureAggregatedBySpatialAttribute.get(newLayerLatLngString)
        const aggregation = curr.aggregate
        const icon = curr.feature.getIcon()

        icon.updateFeatures(aggregation)

        return this.fire('layeradd', { layer: layer })
    },
    // clearLayers: function () {
    //     this._featureAggregatedBySpatialAttribute.forEach((k, v) => {
    //         if (v.feature) {
    //             this._map.removeLayer(v.feature)
    //             v.feature = null
    //         }
    //     })
    //     this._featureAggregatedBySpatialAttribute.clear()
    //     return this
    // },
    // setStyle: function (style: Path) {
    //     // Style is computed internally
    //     return this
    // },
    // addTo: function (map) {
    //     LeafleatBaseFeatureGroup.prototype.addTo.call(this, map)
    //     this._render()
    //     return this
    // },
    _layerAdd: function (e) {
        LeafleatBaseFeatureGroup.prototype._layerAdd.call(this, e)
    }
    // _render: function () {
    //     if (this._map) {
    //         this._featureAggregatedBySpatialAttribute.forEach((v, k) => {
    //             if (v.feature) {
    //                 v.feature.remove()
    //             }
    //
    //             v.feature = new Marker(v.latLng, { pane: this.options.pane }).addTo(this._map)
    //         })
    //     }
    // }
})

export const VegaLiteIcon = Class.extend({
    options: {
        layerContainer: null,
        parentLayer: null
    },
    _vegaOpts: {
        renderer: 'canvas',
        actions: false
    },
    _icon: null,
    _features: [],

    initialize: function (options) {
        Util.setOptions(this, options)
    },

    createIcon: function (oldIcon) {
        return this._createVegaIcon(oldIcon)
    },

    createShadow: function (oldIcon) {
        return oldIcon
    },

    _createVegaIcon: function (oldIcon) {
        // const size = L.point(this.options.iconSize)

        if (!oldIcon || oldIcon.tagName != 'DIV') {
            this._icon = oldIcon = document.createElement('DIV')
            // oldIcon.style.backgroundColor = 'lightblue'

            // Overwrite position of .vega-embed
            // TODO : is it right?
            this._icon.style.position = 'absolute'
        }

        this._launchVega()

        return this._icon
    },

    _launchVega: function () {
        embed(this._icon, this._getVegaSpec(), this._vegaOpts)
    },

    _getVegaSpec: function () {
        const ret = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A simple pie chart with embedded data.',
            background: 'rgba(255,0,0,0)',
            width: 12,
            height: 12,
            config: {
                legend: {
                    disable: true
                }
            },
            data: {
                values: []
            },
            layer: [
                {
                    mark: {
                        type: 'arc',
                        tooltip: true
                    },
                    encoding: {
                        theta: { field: 'value', type: 'quantitative', stack: true },
                        color: { field: 'category', type: 'nominal' },
                        outerRadius: { value: 30 }, // { aggregate: 'sum' },
                        radius2: { value: 20 }, // { aggregate: 'sum' },
                        text: { field: 'category', type: 'nominal' }
                    }
                }
                // {
                //     mark: {
                //         type: 'text',
                //         radius: 70
                //     },
                //     encoding: {
                //         text: {
                //             field: 'category',
                //             type: 'nominal'
                //         }
                //     }
                // }
            ]
        }

        const values = ret.data.values

        let i = 0
        const category = ['a', 'b', 'c', 'd']
        for (const feature of this._features) {
            values.push({ category: category[i % 4], value: feature.getKnMeasureValue() })
            i++
        }
        console.log(ret)

        return ret
    },

    updateFeatures: function (features) {
        this._features = [].concat(features)
    }
})
