import { describe, expect, it } from 'vitest'
import { normalizeMapWidgetBalloonsConfiguration, normalizeMapWidgetChoroplethConfiguration } from '../MapWidgetVisualizationConfigurationHelper'

describe('MapWidgetVisualizationConfigurationHelper', () => {
    it('normalizes choropleth colors and classes from the saved style configuration', () => {
        const configuration = normalizeMapWidgetChoroplethConfiguration({
            method: 'CLASSIFY_BY_QUANTILS',
            classes: 7,
            style: {
                color: 'rgba(0, 128, 0, 1)',
                toColor: 'rgba(255, 0, 0, 1)',
                borderColor: 'rgba(1, 2, 3, 1)',
                borderWidth: 4
            }
        })

        expect(configuration.method).toBe('CLASSIFY_BY_QUANTILS')
        expect(configuration.classes).toBe(7)
        expect(configuration.style.color).toBe('rgba(0, 128, 0, 1)')
        expect(configuration.style.toColor).toBe('rgba(255, 0, 0, 1)')
        expect(configuration.style.borderColor).toBe('rgba(1, 2, 3, 1)')
        expect(configuration.style.borderWidth).toBe(4)
    })

    it('supports legacy choropleth fields without falling back to defaults', () => {
        const configuration = normalizeMapWidgetChoroplethConfiguration({
            method: 'CLASSIFY_BY_RANGES',
            classes: 4,
            fromColor: 'rgba(10, 20, 30, 1)',
            toColor: 'rgba(40, 50, 60, 1)',
            borderColor: 'rgba(70, 80, 90, 1)',
            borderWidth: 3
        })

        expect(configuration.method).toBe('CLASSIFY_BY_RANGES')
        expect(configuration.classes).toBe(4)
        expect(configuration.style.color).toBe('rgba(10, 20, 30, 1)')
        expect(configuration.style.toColor).toBe('rgba(40, 50, 60, 1)')
        expect(configuration.style.borderColor).toBe('rgba(70, 80, 90, 1)')
        expect(configuration.style.borderWidth).toBe(3)
    })

    it('supports legacy balloons color without losing saved method and classes', () => {
        const configuration = normalizeMapWidgetBalloonsConfiguration({
            method: 'CLASSIFY_BY_QUANTILS',
            classes: 6,
            fromColor: 'rgba(5, 10, 15, 1)'
        })

        expect(configuration.method).toBe('CLASSIFY_BY_QUANTILS')
        expect(configuration.classes).toBe(6)
        expect(configuration.style.color).toBe('rgba(5, 10, 15, 1)')
    })
})
