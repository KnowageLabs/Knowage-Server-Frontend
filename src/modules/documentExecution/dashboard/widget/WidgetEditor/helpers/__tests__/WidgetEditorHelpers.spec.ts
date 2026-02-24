import { describe, it, expect, vi } from 'vitest'
import type { IWidget } from '../../../Dashboard'

// ─── Mocks ────────────────────────────────────────────────────────────────────
// WidgetEditorHelpers calls `useStore()` at module level. The global setup.ts
// has already called setActivePinia(createPinia()), so no extra mock is needed
// for pinia itself. We only need to ensure heavy chart-library imports don't fail.

vi.mock('../chartWidget/highcharts/HighchartsHelpers', () => ({
    createNewHighchartsSettings: vi.fn(() => ({ type: 'highcharts' })),
    formatHighchartsWidget: vi.fn()
}))
vi.mock('../chartWidget/chartJS/ChartJSHelpers', () => ({
    createNewChartJSSettings: vi.fn(() => ({ type: 'chartJS' })),
    formatChartJSWidget: vi.fn()
}))
vi.mock('../chartWidget/highcharts/HighchartsBackendSaveHelper', () => ({
    formatHighchartsWidgetForSave: vi.fn()
}))
vi.mock('../chartWidget/chartJS/ChartJSBackendSaveHelper', () => ({
    formatChartJSForSave: vi.fn()
}))
vi.mock('../tableWidget/TableWidgetBackendSaveHelper', () => ({
    formatTableWidgetForSave: vi.fn()
}))

// ─── Import after mocks ────────────────────────────────────────────────────────
import { createNewWidget, createNewWidgetColumn, formatWidgetForSave, getRGBColorFromString } from '../WidgetEditorHelpers'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createNewWidgetColumn', () => {
    it('assigns a UUID id to every new column', () => {
        const col = createNewWidgetColumn({ name: 'revenue', alias: 'Revenue', type: 'java.lang.Double', fieldType: 'MEASURE' }, 'table')
        expect(col.id).toBeTruthy()
        expect(col.id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('sets aggregation to SUM for MEASURE columns', () => {
        const col = createNewWidgetColumn({ name: 'sales', alias: 'Sales', type: 'java.lang.Double', fieldType: 'MEASURE' }, 'table')
        expect(col.aggregation).toBe('SUM')
    })

    it('does not set aggregation for ATTRIBUTE columns in non-discovery widgets', () => {
        const col = createNewWidgetColumn({ name: 'city', alias: 'City', type: 'java.lang.String', fieldType: 'ATTRIBUTE' }, 'table')
        expect(col.aggregation).toBeUndefined()
    })

    it('sets aggregation to COUNT for ATTRIBUTE columns in discovery widgets', () => {
        const col = createNewWidgetColumn({ name: 'category', alias: 'Category', type: 'java.lang.String', fieldType: 'ATTRIBUTE' }, 'discovery')
        expect(col.aggregation).toBe('COUNT')
    })

    it('maps columnName, alias, type, and fieldType from eventData', () => {
        const col = createNewWidgetColumn({ name: 'amount', alias: 'Amount', type: 'java.lang.Integer', fieldType: 'MEASURE' }, 'table')
        expect(col.columnName).toBe('amount')
        expect(col.alias).toBe('Amount')
        expect(col.type).toBe('java.lang.Integer')
        expect(col.fieldType).toBe('MEASURE')
    })

    it('initializes filter as empty object', () => {
        const col = createNewWidgetColumn({ name: 'x', alias: 'X', type: 'java.lang.String', fieldType: 'ATTRIBUTE' }, 'table')
        expect(col.filter).toEqual({})
    })
})

describe('formatWidgetForSave', () => {
    it('returns null when widget is null/undefined', () => {
        expect(formatWidgetForSave(null as any)).toBeNull()
        expect(formatWidgetForSave(undefined as any)).toBeNull()
    })

    it('removes "state", "search", and "invalid" properties from the widget', () => {
        const widget = {
            id: 'w1',
            type: 'selector',
            dataset: null,
            columns: [],
            settings: { configuration: {}, style: {} },
            state: { something: true },
            search: 'query',
            invalid: true
        } as any
        const result = formatWidgetForSave(widget)
        expect(result).not.toBeNull()
        expect(result!.state).toBeUndefined()
        expect(result!.search).toBeUndefined()
        expect(result!.invalid).toBeUndefined()
    })

    it('preserves core widget properties', () => {
        const widget = {
            id: 'abc-123',
            type: 'selector',
            dataset: 42,
            columns: [],
            settings: { configuration: {} }
        } as any
        const result = formatWidgetForSave(widget)
        expect(result!.id).toBe('abc-123')
        expect(result!.type).toBe('selector')
        expect(result!.dataset).toBe(42)
    })

    it('does not mutate the original widget object', () => {
        const widget = {
            id: 'orig',
            type: 'text',
            dataset: null,
            columns: [],
            settings: { configuration: {} },
            state: { x: 1 }
        } as any
        formatWidgetForSave(widget)
        expect(widget.state).toBeDefined()
    })
})

describe('getRGBColorFromString', () => {
    it('parses a standard rgba color string', () => {
        const result = getRGBColorFromString('rgba(10, 20, 30, 1)')
        expect(result.r).toBe(10)
        expect(result.g).toBe(20)
        expect(result.b).toBe(30)
        expect(result.a).toBe(1)
    })

    it('uses alpha = 1 when the alpha component is not a number', () => {
        const result = getRGBColorFromString('rgba(255, 0, 128, abc)')
        expect(result.a).toBe(1)
    })

    it('parses fractional alpha values', () => {
        const result = getRGBColorFromString('rgba(0, 0, 0, 0.5)')
        expect(result.a).toBe(0.5)
    })
})

describe('createNewWidget', () => {
    const mockDashboard = {
        configuration: { variables: [], datasets: [], selections: [], theme: {} }
    }

    it('assigns a UUID id to every new widget', () => {
        const widget = createNewWidget('selector', mockDashboard)
        expect(widget.id).toBeTruthy()
        expect(widget.id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('sets the widget type correctly', () => {
        const widget = createNewWidget('table', mockDashboard)
        expect(widget.type).toBe('table')
    })

    it('sets new: true on created widget', () => {
        const widget = createNewWidget('text', mockDashboard)
        expect(widget.new).toBe(true)
    })

    it('sets updateFromSelections = true', () => {
        const widget = createNewWidget('html', mockDashboard)
        expect(widget.settings.configuration.updateFromSelections).toBe(true)
    })

    it('initializes columns as empty array', () => {
        const widget = createNewWidget('table', mockDashboard)
        expect(widget.columns).toEqual([])
    })

    it('initializes fields for pivot table widgets', () => {
        const widget = createNewWidget('static-pivot-table', mockDashboard)
        expect(widget.fields).toBeDefined()
        expect(widget.fields!.columns).toEqual([])
        expect(widget.fields!.rows).toEqual([])
    })

    it('creates widgetMenu configuration', () => {
        const widget = createNewWidget('selector', mockDashboard)
        expect(widget.settings.configuration.widgetMenu).toBeDefined()
        expect(widget.settings.configuration.widgetMenu!.enabled).toBe(true)
    })
})
