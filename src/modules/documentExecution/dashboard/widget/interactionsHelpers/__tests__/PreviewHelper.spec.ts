import { describe, expect, it, vi } from 'vitest'
import { formatParameterForPreview } from '../PreviewHelper'

vi.mock('@/modules/documentExecution/dashboard/Dashboard.store', () => ({
    default: () => ({ getDashboardDrivers: () => [{ name: 'Year', urlName: 'par_year', value: '2027' }] })
}))
vi.mock('../InteractionLinkHelper', () => ({ getChartDynamicParameterValue: vi.fn() }))
vi.mock('../InteractionHelper', () => ({ getActiveSelectionByDatasetAndColumn: vi.fn() }))

describe('preview dataset parameter inheritance', () => {
    it.each([
        undefined,
        [],
        [{ name: 'par_year', enabled: true, type: '' }],
        [{ name: 'par_year', enabled: false, type: 'static', value: '1999' }]
    ])('inherits the configured value when there is no explicit preview override: %j', (parameters) => {
        const parameter = { name: 'par_year', defaultValue: '2020', value: 'stale' }
        formatParameterForPreview({ previewSettings: { parameters } }, parameter, 'table', 'dashboard', { par_year: '2026' })
        expect(parameter.value).toBe('2026')
    })

    it.each([0, '', ['2025', '2026']])('preserves inherited zero, empty and multivalue parameters: %j', (value) => {
        const parameter = { name: 'par_year', defaultValue: '2020' } as any
        formatParameterForPreview({ previewSettings: {} }, parameter, 'table', 'dashboard', { par_year: value })
        expect(parameter.value).toEqual(value)
    })

    it('uses the catalog default when the dashboard has no configured value', () => {
        const parameter = { name: 'par_year', defaultValue: '2020' } as any
        formatParameterForPreview({ previewSettings: {} }, parameter, 'table', 'dashboard')
        expect(parameter.value).toBe('2020')
    })

    it.each([
        [{ type: 'static', value: '1999' }, '1999'],
        [{ type: 'driver', driver: 'Year' }, '2027'],
        [{ type: 'dynamic', column: 'YEAR' }, 2028]
    ])('lets an explicit %j override win over the inherited binding', (override, expected) => {
        const parameter = { name: 'par_year', defaultValue: '2020' } as any
        const event = { previewSettings: { parameters: [{ name: 'par_year', enabled: true, ...override }] }, formattedRow: { YEAR: { value: 2028 } } }
        formatParameterForPreview(event, parameter, 'table', 'dashboard', { par_year: '2026' })
        expect(parameter.value).toBe(expected)
    })

    it('does not throw when a configured driver no longer exists', () => {
        const parameter = { name: 'par_year', defaultValue: '2020' } as any
        const event = { previewSettings: { parameters: [{ name: 'par_year', enabled: true, type: 'driver', driver: 'Removed' }] } }
        expect(() => formatParameterForPreview(event, parameter, 'table', 'dashboard', { par_year: '2026' })).not.toThrow()
        expect(parameter.value).toBe('2026')
    })
})
