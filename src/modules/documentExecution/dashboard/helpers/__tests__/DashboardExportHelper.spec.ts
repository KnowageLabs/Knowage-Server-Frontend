import { describe, expect, it } from 'vitest'
import { createDashboardSpreadsheetExportBody, createDatasetExportBody, createWidgetExportBody, getDashboardExportFileNameTemplate, getDashboardExportVariables, getDashboardXlsxStyleEnabled } from '../DashboardExportHelper'

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
                exportFileName: 'dashboard $P{year} $V{region}',
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

describe('getDashboardExportFileNameTemplate', () => {
    it('returns the configured shared export filename template', () => {
        expect(getDashboardExportFileNameTemplate(createDashboard())).toBe('dashboard $P{year} $V{region}')
    })
})

describe('getDashboardExportVariables', () => {
    it('returns the current dashboard variables', () => {
        expect(getDashboardExportVariables(createDashboard())).toEqual([{ name: 'region', type: 'static', value: 'EMEA' }])
    })
})

describe('createDatasetExportBody', () => {
    it('combines static text, document drivers and runtime variables', () => {
        const body = createDatasetExportBody({}, 'Sales $P{year} $V{region}', createDashboard(), [{ name: 'region', value: 'APAC' } as any])

        expect(body.fileName).toBe('Sales 2024 APAC')
    })

    it('uses the latest driver and variable values for each export', () => {
        const dashboard = createDashboard()
        expect(createDatasetExportBody({}, '$P{year}-$V{region}', dashboard).fileName).toBe('2024-EMEA')

        dashboard.drivers[0].value = '2026'
        dashboard.configuration.variables[0].value = 'APAC'
        expect(createDatasetExportBody({}, '$P{year}-$V{region}', dashboard).fileName).toBe('2026-APAC')
    })

    it('resolves multivalue drivers, descriptions, zero and pivoted variables', () => {
        const dashboard = createDashboard()
        dashboard.drivers[0].value = ['2025', '2026']
        dashboard.drivers[0].description = 'Selected years'
        dashboard.configuration.variables = [{ name: 'totals', value: 0, pivotedValues: { sales: 42 } }]

        expect(createDatasetExportBody({}, '$P{year} $P{year_description} $V{totals} $V{totals.sales}', dashboard).fileName).toBe('2025,2026 Selected years 0 42')
    })

    it.each([undefined, null, '', '  ', '$P{missing}$V{missing}'])('preserves default naming for an empty resolved template %s', (template) => {
        expect(createDatasetExportBody({}, template, undefined)).not.toHaveProperty('fileName')
    })

    it('supports a static name without an execution context', () => {
        expect(createDatasetExportBody({}, '  Sales export  ', undefined).fileName).toBe('Sales export')
    })

    it('normalizes preview parameters and driver lists without modifying preview state', () => {
        const previewData = { pars: [{ name: 'country', value: 'IT' }], drivers: [{ urlName: 'country', parameterValue: [{ value: 'IT', description: 'Italy' }] }], start: 0 }
        const original = JSON.parse(JSON.stringify(previewData))

        const body = createDatasetExportBody(previewData, 'Sales', createDashboard())
        expect(body.parameters).toEqual(previewData.pars)
        expect(body.drivers).toEqual({ country: [{ value: 'IT', description: 'Italy' }] })
        expect(body).not.toHaveProperty('pars')
        body.parameters[0].value = 'US'
        expect(previewData).toEqual(original)
    })
})

describe('createDashboardSpreadsheetExportBody', () => {
    it('removes currentView, adds the top-level xlsxStyleEnabled flag and normalizes locale', () => {
        const body = createDashboardSpreadsheetExportBody(createDashboard(), 'eng')

        expect(body.currentView).toBeUndefined()
        expect(body.locale).toBe('en-US')
        expect(body.xlsxStyleEnabled).toBe(true)
        expect(body.configuration.menuWidgets.exportFileName).toBe('dashboard $P{year} $V{region}')
        expect(body.configuration.menuWidgets.xlsxStyleEnabled).toBe(true)
    })
})

describe('createWidgetExportBody', () => {
    it('adds xlsxStyleEnabled to spreadsheet exports', () => {
        const body = createWidgetExportBody('spreadsheet', createWidget(), createDashboard(), 'bi-user', 'eng')

        expect(body.parameters).toEqual([{ name: 'country', value: 'IT' }])
        expect(body.datasetDrivers).toHaveLength(1)
        expect(body.variables).toEqual([{ name: 'region', type: 'static', value: 'EMEA' }])
        expect(body.creationUser).toBe('bi-user')
        expect(body.locale).toBe('en-US')
        expect(body.xlsxStyleEnabled).toBe(true)
    })

    it('uses the runtime variables supplied by the widget', () => {
        const runtimeVariables = [{ name: 'Ruolo', type: 'profile', value: 'dte_admin' }]
        const dashboard = createDashboard({
            configuration: {
                ...createDashboard().configuration,
                variables: [{ name: 'Ruolo', type: 'profile', value: 'US' }]
            }
        })

        const body = createWidgetExportBody('pdf', createWidget(), dashboard, 'bi-user', 'en-US', undefined, runtimeVariables)

        expect(body.variables).toEqual(runtimeVariables)
    })

    it.each(['spreadsheet', 'pdf'])('exports all drilldown levels for %s highcharts widgets with drilldown enabled', (type) => {
        const body = createWidgetExportBody(type, createWidget({ type: 'highcharts', settings: { interactions: { drilldown: { enabled: true } } } }), createDashboard(), 'bi-user', 'eng')

        expect(body.exportAllDrilldownLevels).toBe(true)
    })

    it('adds likeSelections when the widget export includes an active search', () => {
        const body = createWidgetExportBody('pdf', createWidget(), createDashboard(), 'bi-user', 'en-US', { searchText: 'it', searchColumns: ['COUNTRY', 'REGION'] })

        expect(body.likeSelections).toEqual({ Sales: { 'COUNTRY,REGION': 'it' } })
    })

    it('does not add xlsxStyleEnabled to non-spreadsheet exports', () => {
        const body = createWidgetExportBody('pdf', createWidget(), createDashboard(), 'bi-user', 'en-US')

        expect(body.xlsxStyleEnabled).toBeUndefined()
    })
})
