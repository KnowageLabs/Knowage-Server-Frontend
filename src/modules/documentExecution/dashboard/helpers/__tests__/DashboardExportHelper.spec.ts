import { describe, expect, it } from 'vitest'
import { createDashboardSpreadsheetExportBody, createWidgetExportBody, getDashboardXlsxStyleEnabled } from '../DashboardExportHelper'

const createDashboard = (overrides = {}) =>
    ({
        configuration: {
            datasets: [
                {
                    id: 1,
                    label: 'Sales',
                    cache: false,
                    parameters: [{ name: 'country', value: 'IT' }],
                    drivers: [{ driverLabel: 'Country', label: 'Country', multivalue: false, parameterValue: [{ description: 'Italy', value: 'IT' }], type: 'STRING', typeCode: 'STRING', urlName: 'country', visible: true, defaultValue: null }]
                }
            ],
            variables: [{ name: 'region', type: 'static', value: 'EMEA' }],
            menuWidgets: {
                showExcelExport: true,
                xlsxStyleEnabled: true,
                showScreenshot: true,
                showSelectionButton: true,
                enableWidgetMenu: true,
                enableChartChange: true,
                enableCaching: true,
                enableCustomHeader: false
            }
        },
        selections: [{ datasetId: 1, datasetLabel: 'Sales', columnName: 'COUNTRY', value: ['IT'], aggregated: false, timestamp: 0 }],
        drivers: [{ driverLabel: 'Year', multivalue: false, name: 'year', type: 'STRING', urlName: 'year', value: '2024', visible: true }],
        currentView: { id: 'view-1' },
        ...overrides
    }) as any

const createWidget = (overrides = {}) =>
    ({
        id: 'widget-1',
        dataset: 1,
        type: 'table',
        columns: [],
        settings: {},
        ...overrides
    }) as any

describe('getDashboardXlsxStyleEnabled', () => {
    it('returns false when the dashboard setting is missing', () => {
        expect(getDashboardXlsxStyleEnabled({ configuration: { menuWidgets: {} } } as any)).toBe(false)
    })

    it('returns the configured dashboard value', () => {
        expect(getDashboardXlsxStyleEnabled(createDashboard())).toBe(true)
    })
})

describe('createDashboardSpreadsheetExportBody', () => {
    it('removes currentView and adds the top-level xlsxStyleEnabled flag', () => {
        const body = createDashboardSpreadsheetExportBody(createDashboard())

        expect(body.currentView).toBeUndefined()
        expect(body.xlsxStyleEnabled).toBe(true)
        expect(body.configuration.menuWidgets.xlsxStyleEnabled).toBe(true)
    })
})

describe('createWidgetExportBody', () => {
    it('adds xlsxStyleEnabled to spreadsheet exports', () => {
        const body = createWidgetExportBody('spreadsheet', createWidget(), createDashboard(), 'bi-user', 'en-US')

        expect(body.parameters).toEqual([{ name: 'country', value: 'IT' }])
        expect(body.datasetDrivers).toHaveLength(1)
        expect(body.variables).toEqual([{ name: 'region', type: 'static', value: 'EMEA' }])
        expect(body.creationUser).toBe('bi-user')
        expect(body.locale).toBe('en-US')
        expect(body.xlsxStyleEnabled).toBe(true)
    })

    it('does not add xlsxStyleEnabled to non-spreadsheet exports', () => {
        const body = createWidgetExportBody('pdf', createWidget(), createDashboard(), 'bi-user', 'en-US')

        expect(body.xlsxStyleEnabled).toBeUndefined()
    })
})
