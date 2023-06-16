import { Icon, FeatureGroup, Layer, Path, Util, Marker } from 'leaflet'
import embed from 'vega-embed'

export const LeafleatBaseFeatureGroup = FeatureGroup.extend({})

export const LeafleatPerSpatialAttributeFeatureGroup = LeafleatBaseFeatureGroup.extend({
    options: {
        pane: 'markerPane',
        layerManager: null
    },
    _featureAggregatedBySpatialAttribute: null,
    initialize: function (layers, options) {
        // Util.setOptions(this, options)
        FeatureGroup.prototype.initialize.call(this, layers, options)

        this._featureAggregatedBySpatialAttribute = new Map()

        // TODO : layers???
    },
    addLayer: function (layer: Layer) {
        const newLayerLatLng = layer.getLatLng()

        if (!this._featureAggregatedBySpatialAttribute.has(newLayerLatLng)) {
            const aggregationFeature = new Marker(newLayerLatLng, {
                pane: this.options.pane,
                icon: new VegaLiteIcon({})
            })

            this._featureAggregatedBySpatialAttribute.set(newLayerLatLng, {
                latLng: newLayerLatLng,
                aggregate: [layer],
                feature: aggregationFeature
            })

            FeatureGroup.prototype.addLayer.call(this, aggregationFeature)
        } else {
            this._featureAggregatedBySpatialAttribute.get(newLayerLatLng).aggregate.push(layer)
        }

        return this.fire('layeradd', { layer: layer })
    }
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
    // _layerAdd: function (e) {
    //     LeafleatBaseFeatureGroup.prototype._layerAdd.call(this, e)
    //     this._render()
    // },
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

export const VegaLiteIcon = Icon.extend({
    options: {
        /** @var {L.Point} */
        iconSize: [24, 24],
        /** @var {L.Point} */
        iconAnchor: [12, 12],
        /** @var {Function} */
        drawIcon: null,
        /** @var {string} */
        className: 'leaflet-canvas-icon'
    },

    createIcon: function (oldIcon) {
        return this._createVegaIcon(oldIcon)
    },

    createShadow: function (oldIcon) {
        return oldIcon
    },

    _createTestIcon: function (oldIcon) {
        if (!oldIcon || oldIcon.tagName != 'CANVAS') {
            oldIcon = document.createElement('CANVAS')
            oldIcon.style.backgroundColor = 'lightblue'
        }

        // WARNING : Changing size after draw clear the canvas
        oldIcon.width = 24 // size.x
        oldIcon.height = 24 // size.y

        const ctx = oldIcon.getContext('2d')

        ctx.fillStyle = 'red'
        ctx.fillRect(0, 0, 24, 24)
        ctx.fillStyle = 'lightgreen'
        ctx.fillRect(0, 0, 12, 12)

        this._setIconStyles(oldIcon, 'icon')

        return oldIcon
    },

    _createVegaIcon: function (oldIcon) {
        // const size = L.point(this.options.iconSize)

        if (!oldIcon || oldIcon.tagName != 'DIV') {
            oldIcon = document.createElement('DIV')
            // oldIcon.style.backgroundColor = 'lightblue'

            // Overwrite position of .vega-embed
            // TODO : is it right?
            oldIcon.style.position = 'absolute'
        }

        embed(
            oldIcon,
            {
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
                    values: [
                        { category: 1, value: 4 },
                        { category: 2, value: 6 },
                        { category: 3, value: 10 },
                        { category: 4, value: 3 },
                        { category: 5, value: 7 },
                        { category: 6, value: 8 }
                    ]
                },
                mark: 'arc',
                encoding: {
                    theta: { field: 'value', type: 'quantitative' },
                    color: { field: 'category', type: 'nominal' },
                    radius: { aggregate: 'sum' },
                    radius2: { value: 18 }
                }
            },
            { renderer: 'canvas', actions: false }
        )

        return oldIcon
    }
})
