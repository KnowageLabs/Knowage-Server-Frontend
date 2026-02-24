import { describe, it, expect } from 'vitest'
import type { IWidget, IDashboard } from '../../../Dashboard'
import { getStyleFromColumn, getTooltipFromColumn, getSettingsFromWidgetColumns } from '../TableWidgetColumnSettingsHelper'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Minimal table widget with all sub-settings required by the helper functions.
 */
const makeTableWidget = (): IWidget =>
    ({
        id: 'w1',
        type: 'table',
        dataset: null,
        columns: [],
        settings: {
            configuration: {
                columnGroups: { enabled: false, groups: [] },
                headers: { custom: { enabled: false, rules: [] } },
                rows: { rowSpan: { enabled: false, column: null } }
            },
            visualization: {
                visibilityConditions: { enabled: false, conditions: [] },
                visualizationTypes: { enabled: false, types: [] }
            },
            style: {
                columns: { styles: [] }
            },
            conditionalStyles: { enabled: false, conditions: [] },
            tooltips: []
        }
    }) as any

/**
 * Minimal IDashboard with an optional variable list.
 */
const makeDashboard = (variables: any[] = []): IDashboard =>
    ({
        sheets: [],
        widgets: [],
        version: '8.2.0',
        configuration: {
            id: '',
            name: '',
            label: '',
            description: '',
            cssToRender: '',
            associations: [],
            datasets: [],
            variables,
            selections: [],
            theme: {},
            background: { imageBackgroundSize: '', imageBackgroundUrl: '', sheetsBackgroundColor: '', showGrid: true },
            menuWidgets: {
                showExcelExport: true,
                showScreenshot: true,
                showSelectionButton: true,
                enableWidgetMenu: true,
                enableChartChange: true,
                enableCaching: true,
                enableCustomHeader: false
            }
        }
    }) as any

// ─── getStyleFromColumn ───────────────────────────────────────────────────────

describe('getStyleFromColumn', () => {
    it('does nothing when column has no style', () => {
        const widget = makeTableWidget()
        const column = { name: 'col1', fieldType: 'ATTRIBUTE' }
        const nameIdMap = { col1: 'id-col1' }
        getStyleFromColumn(widget, column, nameIdMap)
        expect(widget.settings.style.columns.styles).toHaveLength(0)
    })

    it('does nothing when style has no recognised CSS fields', () => {
        const widget = makeTableWidget()
        const column = { name: 'col1', fieldType: 'ATTRIBUTE', style: { someUnknownField: 'x' } }
        const nameIdMap = { col1: 'id-col1' }
        getStyleFromColumn(widget, column, nameIdMap)
        expect(widget.settings.style.columns.styles).toHaveLength(0)
    })

    it('adds a style entry when column has background-color', () => {
        const widget = makeTableWidget()
        const column = { name: 'amount', fieldType: 'MEASURE', style: { 'background-color': 'rgb(255, 0, 0)' } }
        const nameIdMap = { amount: 'id-amount' }
        getStyleFromColumn(widget, column, nameIdMap)
        expect(widget.settings.style.columns.styles).toHaveLength(1)
        expect(widget.settings.style.columns.styles[0].target).toEqual(['id-amount'])
        expect(widget.settings.style.columns.styles[0].properties['background-color']).toBe('rgb(255, 0, 0)')
    })

    it('adds a style entry when column has color', () => {
        const widget = makeTableWidget()
        const column = { name: 'city', fieldType: 'ATTRIBUTE', style: { color: 'rgb(0, 0, 255)' } }
        const nameIdMap = { city: 'id-city' }
        getStyleFromColumn(widget, column, nameIdMap)
        expect(widget.settings.style.columns.styles).toHaveLength(1)
        expect(widget.settings.style.columns.styles[0].properties.color).toBe('rgb(0, 0, 255)')
    })

    it('uses default values for missing style fields', () => {
        const widget = makeTableWidget()
        const column = { name: 'rev', fieldType: 'MEASURE', style: { 'font-size': '14px' } }
        const nameIdMap = { rev: 'id-rev' }
        getStyleFromColumn(widget, column, nameIdMap)
        const style = widget.settings.style.columns.styles[0].properties
        expect(style['background-color']).toBe('rgb(255, 255, 255)')
        expect(style.color).toBe('rgb(0, 0, 0)')
        expect(style['align-items']).toBe('center')
    })

    it('accumulates multiple column styles correctly', () => {
        const widget = makeTableWidget()
        const nameIdMap = { a: 'id-a', b: 'id-b' }
        getStyleFromColumn(widget, { name: 'a', fieldType: 'ATTRIBUTE', style: { color: '#000' } }, nameIdMap)
        getStyleFromColumn(widget, { name: 'b', fieldType: 'ATTRIBUTE', style: { color: '#fff' } }, nameIdMap)
        expect(widget.settings.style.columns.styles).toHaveLength(2)
    })
})

// ─── getTooltipFromColumn ─────────────────────────────────────────────────────

describe('getTooltipFromColumn', () => {
    it('does nothing when column has neither hideTooltip nor style.tooltip', () => {
        const widget = makeTableWidget()
        const column = { name: 'col1' }
        getTooltipFromColumn(widget, column)
        expect(widget.settings.tooltips).toHaveLength(0)
    })

    it('adds a tooltip entry when hideTooltip is defined', () => {
        const widget = makeTableWidget()
        const column = { name: 'col1', hideTooltip: true }
        getTooltipFromColumn(widget, column)
        expect(widget.settings.tooltips).toHaveLength(1)
        expect(widget.settings.tooltips[0].enabled).toBe(false) // !hideTooltip
    })

    it('sets enabled = true when hideTooltip is false', () => {
        const widget = makeTableWidget()
        getTooltipFromColumn(widget, { name: 'col1', hideTooltip: false })
        expect(widget.settings.tooltips[0].enabled).toBe(true)
    })

    it('maps prefix, suffix and precision from style.tooltip', () => {
        const widget = makeTableWidget()
        const column = {
            name: 'revenue',
            hideTooltip: false,
            style: { tooltip: { prefix: '$', suffix: 'K', precision: 2 } }
        }
        getTooltipFromColumn(widget, column)
        const tip = widget.settings.tooltips[0]
        expect(tip.prefix).toBe('$')
        expect(tip.suffix).toBe('K')
        expect(tip.precision).toBe(2)
    })

    it('uses default values for missing tooltip fields', () => {
        const widget = makeTableWidget()
        getTooltipFromColumn(widget, { name: 'col', hideTooltip: false, style: { tooltip: {} } })
        const tip = widget.settings.tooltips[0]
        expect(tip.prefix).toBe('')
        expect(tip.suffix).toBe('')
        expect(tip.precision).toBe(0)
    })
})

// ─── getSettingsFromWidgetColumns ─────────────────────────────────────────────

describe('getSettingsFromWidgetColumns', () => {
    it('processes empty column list without errors', () => {
        const widget = makeTableWidget()
        const oldWidget = { content: { columnSelectedOfDataset: [] } }
        const dashboard = makeDashboard()
        expect(() => getSettingsFromWidgetColumns(widget, oldWidget, dashboard, {})).not.toThrow()
    })

    it('adds visibility condition for a hidden column', () => {
        const widget = makeTableWidget()
        const oldWidget = {
            content: {
                columnSelectedOfDataset: [{ name: 'secret', fieldType: 'ATTRIBUTE', style: { hiddenColumn: true } }]
            }
        }
        const dashboard = makeDashboard()
        const nameIdMap = { secret: 'id-secret' }
        getSettingsFromWidgetColumns(widget, oldWidget, dashboard, nameIdMap)
        expect(widget.settings.visualization.visibilityConditions.enabled).toBe(true)
        expect(widget.settings.visualization.visibilityConditions.conditions).toHaveLength(1)
        expect(widget.settings.visualization.visibilityConditions.conditions[0].hide).toBe(true)
    })

    it('adds style for a column with a color property', () => {
        const widget = makeTableWidget()
        const oldWidget = {
            content: {
                columnSelectedOfDataset: [{ name: 'city', fieldType: 'ATTRIBUTE', style: { color: 'rgb(0, 0, 255)' } }]
            }
        }
        const dashboard = makeDashboard()
        const nameIdMap = { city: 'id-city' }
        getSettingsFromWidgetColumns(widget, oldWidget, dashboard, nameIdMap)
        expect(widget.settings.style.columns.styles).toHaveLength(1)
    })

    it('adds conditional style for a column with ranges', () => {
        const widget = makeTableWidget()
        const oldWidget = {
            content: {
                columnSelectedOfDataset: [
                    {
                        name: 'revenue',
                        fieldType: 'MEASURE',
                        ranges: [{ operator: '>', value: '100', color: 'green', 'background-color': '' }]
                    }
                ]
            }
        }
        const dashboard = makeDashboard()
        const nameIdMap = { revenue: 'id-revenue' }
        getSettingsFromWidgetColumns(widget, oldWidget, dashboard, nameIdMap)
        expect(widget.settings.conditionalStyles.enabled).toBe(true)
        expect(widget.settings.conditionalStyles.conditions).toHaveLength(1)
        expect(widget.settings.conditionalStyles.conditions[0].condition.operator).toBe('>')
    })

    it('adds tooltip for column with hideTooltip property', () => {
        const widget = makeTableWidget()
        const oldWidget = {
            content: {
                columnSelectedOfDataset: [{ name: 'note', fieldType: 'ATTRIBUTE', hideTooltip: true }]
            }
        }
        const dashboard = makeDashboard()
        getSettingsFromWidgetColumns(widget, oldWidget, dashboard, { note: 'id-note' })
        expect(widget.settings.tooltips).toHaveLength(1)
    })
})
