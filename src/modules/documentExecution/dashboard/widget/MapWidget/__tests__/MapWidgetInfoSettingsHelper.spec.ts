import { describe, expect, it } from 'vitest'
import { getMapInfoColumnName, getMapVisualizationMeasureLabel, normalizeMapInfoSettings, normalizeMapLegendSettings } from '../MapWidgetInfoSettingsHelper'

describe('MapWidgetInfoSettingsHelper', () => {
    it('extracts column names from strings and option objects', () => {
        expect(getMapInfoColumnName('REG_NAME')).toBe('REG_NAME')
        expect(getMapInfoColumnName({ name: 'ELETTORI', alias: 'Elettori' })).toBe('ELETTORI')
        expect(getMapInfoColumnName({ property: 'NAME_1' })).toBe('NAME_1')
    })

    it('normalizes dialog and tooltip columns to string names', () => {
        const settings = {
            visualizations: [
                {
                    label: 'Regions',
                    columns: ['REG_NAME', { name: 'ELETTORI', alias: 'Elettori' }, { property: 'NAME_1' }]
                }
            ]
        } as any

        normalizeMapInfoSettings(settings)

        expect(settings.visualizations[0].columns).toEqual(['REG_NAME', 'ELETTORI', 'NAME_1'])
    })

    it('realigns legend visualization references with current widget visualizations', () => {
        const visualization = { id: 'viz-1', label: 'Regions', type: 'choropleth', target: 'layer-1' }
        const widgetModel = {
            settings: {
                visualizations: [visualization]
            }
        } as any
        const legendSettings = {
            visualizationTypes: [
                {
                    visualizationType: { id: 'viz-1', label: 'Old label', type: 'choropleth', target: 'layer-1' },
                    text: 'Legend text'
                }
            ]
        } as any

        normalizeMapLegendSettings(widgetModel, legendSettings)

        expect(legendSettings.visualizationTypes[0].visualizationType).toBe(visualization)
    })

    it('prefers dataset measures over layer join properties in legend labels', () => {
        expect(
            getMapVisualizationMeasureLabel({
                targetProperty: 'NAME_1',
                targetMeasure: 'ELETTORI'
            } as any)
        ).toBe('ELETTORI')

        expect(
            getMapVisualizationMeasureLabel({
                targetProperty: 'NAME_1',
                targetDatasetMeasures: ['VOTANTI']
            } as any)
        ).toBe('VOTANTI')
    })

    it('populates legend settings from current widget visualizations when entries are missing', () => {
        const firstVisualization = { id: 'viz-1', label: 'Regions', type: 'choropleth', target: 'layer-1' }
        const secondVisualization = { id: 'viz-2', label: 'Markers', type: 'markers', target: 'layer-2' }
        const widgetModel = {
            settings: {
                visualizations: [firstVisualization, secondVisualization]
            }
        } as any
        const legendSettings = {
            visualizationTypes: []
        } as any

        normalizeMapLegendSettings(widgetModel, legendSettings)

        expect(legendSettings.visualizationTypes).toEqual([
            { text: '', visualizationType: firstVisualization },
            { text: '', visualizationType: secondVisualization }
        ])
    })
})
