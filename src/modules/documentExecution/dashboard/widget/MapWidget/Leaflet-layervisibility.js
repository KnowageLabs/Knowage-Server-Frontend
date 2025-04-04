;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('leaflet')) : typeof define === 'function' && define.amd ? define(['leaflet'], factory) : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self), factory(global.L))
})(this, function (L) {
    'use strict'

    function _interopDefaultLegacy(e) {
        return e && typeof e === 'object' && 'default' in e ? e : { default: e }
    }

    var L__default = /*#__PURE__*/ _interopDefaultLegacy(L)

    function validateFilter(filterFunc) {
        if (typeof filterFunc !== 'undefined' && typeof filterFunc === 'function') {
            return filterFunc
        }
        return function () {
            return true
        }
    }

    function setLayerDisplayStyle(value, context) {
        if (context._el) context._el.style.display = value
        else if (context.getElement()) context.getElement().style.display = value
        return context
    }

    function setLayerGroupVisibility(mode, filter, context) {
        const filterFunc = validateFilter(filter)
        context.eachLayer((layer) => (filterFunc(layer) ? layer[mode]() : null))
    }

    L__default['default'].Layer.include({
        hide() {
            return setLayerDisplayStyle('none', this)
        },
        show() {
            return setLayerDisplayStyle('', this)
        },
        isHidden() {
            return this.getElement().style.display === 'none'
        },
        toggleVisibility() {
            return this.isHidden() ? this.show() : this.hide()
        }
    })

    L__default['default'].LayerGroup.include({
        hide(filter) {
            setLayerGroupVisibility('hide', filter, this)
        },
        show(filter) {
            setLayerGroupVisibility('show', filter, this)
        },
        isHidden() {
            return this.getLayers().every((layer) => layer.isHidden())
        }
    })

    L__default['default'].Marker.include({
        hide() {
            return L__default['default'].Layer.prototype.hide.call(this, null)
        },
        show() {
            return L__default['default'].Layer.prototype.show.call(this, null)
        }
    })
})
