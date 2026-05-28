import { describe, expect, it } from 'vitest'
import { createMapInfoColumnSettings, getMapDatasetInfoColumnNames, getMapInfoColumnLabel, getMapInfoColumnName, getMapVisualizationMeasureLabel, normalizeMapInfoSettings, normalizeMapLegendSettings } from '../MapWidgetInfoSettingsHelper'

describe('MapWidgetInfoSettingsHelper', () => {
    it('extracts column names from strings and option objects', () => {
        expect(getMapInfoColumnName('REG_NAME')).toBe('REG_NAME')
        expect(getMapInfoColumnName({ name: 'ELETTORI', alias: 'Elettori' })).toBe('ELETTORI')
        expect(getMapInfoColumnName({ property: 'NAME_1' })).toBe('NAME_1')
    })

    it('normalizes dialog and tooltip columns to per-column formatting settings', () => {
        const settings = {
            prefix: 'EUR ',
            suffix: '%',
            precision: 3,
            visualizations: [
                {
                    label: 'Regions',
                    prefix: '$',
                    suffix: ' pcs',
                    precision: 1,
                    columns: ['REG_NAME', { name: 'ELETTORI', alias: 'Elettori' }, { property: 'NAME_1', prefix: '#', suffix: '', precision: 0 }]
                }
            ]
        } as any

        normalizeMapInfoSettings(settings)

        expect(settings.visualizations[0].columns).toEqual([
            { name: 'REG_NAME', alias: '', prefix: '$', suffix: ' pcs', precision: 1 },
            { name: 'ELETTORI', alias: '', prefix: '$', suffix: ' pcs', precision: 1 },
            { name: 'NAME_1', alias: '', prefix: '#', suffix: '', precision: 0 }
        ])
    })

    it('creates standalone info column settings with default formatting', () => {
        expect(createMapInfoColumnSettings('REG_NAME')).toEqual({ name: 'REG_NAME', alias: '', prefix: '', suffix: '', precision: 2 })
        expect(createMapInfoColumnSettings({ name: 'ELETTORI', prefix: 'EUR ', suffix: '%', precision: '3', alias: 'Voters' })).toEqual({ name: 'ELETTORI', alias: 'Voters', prefix: 'EUR ', suffix: '%', precision: 3 })
    })

    it('uses the configured alias for display labels and ignores legacy column option aliases', () => {
        expect(createMapInfoColumnSettings({ name: 'ELETTORI', alias: 'Elettori' })).toEqual({ name: 'ELETTORI', alias: '', prefix: '', suffix: '', precision: 2 })
        expect(getMapInfoColumnLabel({ name: 'ELETTORI', alias: 'Voters', prefix: '', suffix: '', precision: 2 })).toBe('Voters')
        expect(getMapInfoColumnLabel({ name: 'ELETTORI', alias: '   ', prefix: '', suffix: '', precision: 2 })).toBe('ELETTORI')
    })

    it('collects dataset info columns configured in dialog and tooltips for matching visualizations', () => {
        const datasetLayer = {
            layerId: 'ds_votes',
            columns: [{ name: 'REG_NAME' }, { name: 'PROVINCIA' }, { name: 'ELETTORI' }]
        } as any

        const widgetModel = {
            settings: {
                visualizations: [{ label: 'Regions', targetDataset: 'ds_votes' }, { label: 'Markers', target: 'ds_votes' }],
                dialog: {
                    visualizations: [{ label: 'Regions', columns: ['PROVINCIA', 'NAME_1'] }]
                },
                tooltips: {
                    visualizations: [{ label: 'Markers', columns: [{ name: 'ELETTORI' }, { name: 'REG_NAME' }] }]
                }
            }
        } as any

        expect(getMapDatasetInfoColumnNames(widgetModel, datasetLayer)).toEqual(['PROVINCIA', 'ELETTORI', 'REG_NAME'])
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

    it('does not replace legend visualization settings when they are already aligned', () => {
        const visualization = { id: 'viz-1', label: 'Regions', type: 'choropleth', target: 'layer-1' }
        const visualizationTypes = [{ text: 'Legend text', visualizationType: visualization }]
        const widgetModel = {
            settings: {
                visualizations: [visualization]
            }
        } as any
        const legendSettings = {
            visualizationTypes
        } as any

        normalizeMapLegendSettings(widgetModel, legendSettings)

        expect(legendSettings.visualizationTypes).toBe(visualizationTypes)
    })
})
