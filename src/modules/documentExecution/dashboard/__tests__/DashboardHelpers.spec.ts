import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { IDashboard, IDashboardSheet, IWidget, IWidgetSheetItem } from '../Dashboard'

// ─── Mocks ────────────────────────────────────────────────────────────────────
// DashboardHelpers.ts calls `mainStore(pinia)` at the module level.
// vi.mock is hoisted, so we must use vi.hoisted() for variables used inside factories.

const { mockStore } = vi.hoisted(() => {
    const mockStore = {
        isEnterprise: false,
        user: { enterprise: false, functionalities: [], userId: 'testUser' },
        setLoading: () => {}
    }
    return { mockStore }
})

vi.mock('@/App.store', () => ({
    default: vi.fn(() => mockStore)
}))

vi.mock('@/pinia', () => ({ default: {} }))

vi.mock('@/App.i18n', () => ({
    default: { global: { t: (key: string) => key } }
}))

// Heavy external imports that we don't need for unit tests
vi.mock('../../../managers/dashboardThemeManagement/DashboardThemeHelper', () => ({
    getDefaultDashboardThemeConfig: vi.fn(() => ({ palette: [] }))
}))

vi.mock('../widget/WidgetEditor/helpers/tableWidget/TableWidgetFunctions', () => ({
    formatDashboardTableWidgetAfterLoading: vi.fn()
}))

vi.mock('../widget/WidgetEditor/helpers/discoveryWidget/DiscoveryWidgetFunctions', () => ({
    formatDashboardDiscoveryWidgetAfterLoading: vi.fn()
}))

vi.mock('../widget/MapWidget/MapWidgetFormattingHelper', () => ({
    formatMapWidgetAfterDashboardLoading: vi.fn()
}))

vi.mock('../widget/WidgetEditor/helpers/selectionsWidget/SelectionsWidgetFunctions', () => ({
    addMissingFilterProperties: vi.fn()
}))

vi.mock('../generalSettings/themes/ThemesHelper', () => ({
    updateWidgetThemeAndApplyStyle: vi.fn()
}))

vi.mock('../generalSettings/VariablesHelper', () => ({
    setVariableValueFromDataset: vi.fn()
}))

vi.mock('../widget/WidgetEditor/helpers/chartWidget/chartJS/ChartJSHelpers', () => ({
    formatChartJSWidget: vi.fn()
}))
vi.mock('../widget/WidgetEditor/helpers/chartWidget/highcharts/HighchartsHelpers', () => ({
    formatHighchartsWidget: vi.fn()
}))
vi.mock('../widget/WidgetEditor/helpers/chartWidget/highcharts/HighchartsBackendSaveHelper', () => ({
    formatHighchartsWidgetForSave: vi.fn()
}))
vi.mock('../widget/WidgetEditor/helpers/chartWidget/chartJS/ChartJSBackendSaveHelper', () => ({
    formatChartJSForSave: vi.fn()
}))
vi.mock('../widget/WidgetEditor/helpers/tableWidget/TableWidgetBackendSaveHelper', () => ({
    formatTableWidgetForSave: vi.fn((w: IWidget) => w)
}))

// ─── Import after mocks ────────────────────────────────────────────────────────
import { createNewDashboardModel, addNewWidgetToSheets, deleteWidgetHelper, addWidgetMenuConfig, addWidgetHelpConfig, getFormattedOutputParameters, applyDashboardViewToModel, addMissingMenuWidgetsConfiguration, SHEET_WIDGET_SIZES } from '../DashboardHelpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEmptySheet = (id = 'sheet1'): IDashboardSheet => ({
    id,
    index: 0,
    label: 'Sheet 1',
    widgets: { xxs: [], xs: [], sm: [], md: [], lg: [] }
})

const makeWidget = (overrides: Partial<IWidget> = {}): IWidget => ({
    id: crypto.randomUUID(),
    type: 'table',
    new: true,
    dataset: null,
    columns: [],
    settings: {
        responsive: { lg: true, md: true, sm: true, xs: true, xxs: true },
        configuration: { widgetMenu: { enabled: true } },
        style: {},
        help: null
    } as any,
    ...overrides
})

const makeDashboard = (overrides: Partial<IDashboard> = {}): IDashboard => ({
    sheets: [makeEmptySheet()],
    widgets: [],
    configuration: {
        id: '',
        name: '',
        label: '',
        description: '',
        cssToRender: '',
        associations: [],
        datasets: [],
        variables: [],
        selections: [],
        theme: {},
        background: { imageBackgroundSize: '', imageBackgroundUrl: '', sheetsBackgroundColor: '', showGrid: true },
        menuWidgets: { showExcelExport: true, showScreenshot: true, showSelectionButton: true, enableWidgetMenu: true, enableChartChange: true, enableCaching: true, enableCustomHeader: false }
    },
    version: '8.2.0',
    ...overrides
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createNewDashboardModel', () => {
    it('produces a valid UUID for configuration.id', () => {
        mockStore.isEnterprise = false
        const model = createNewDashboardModel()
        expect(model.configuration.id).toBeTruthy()
        expect(model.configuration.id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('does NOT set configuration.theme when isEnterprise is false', () => {
        mockStore.isEnterprise = false
        const model = createNewDashboardModel()
        // theme may exist as empty object from descriptor, but should have no id key set by the function
        const themeSetByFunction = model.configuration.theme && 'id' in model.configuration.theme
        expect(themeSetByFunction).toBe(false)
    })

    it('sets configuration.theme when isEnterprise is true', () => {
        mockStore.isEnterprise = true
        const model = createNewDashboardModel()
        expect(model.configuration.theme).toBeDefined()
        expect(model.configuration.theme.id).toBeNull()
        expect(model.configuration.theme.config).toBeDefined()
        mockStore.isEnterprise = false // reset
    })

    it('returns separate model instances on each call', () => {
        const m1 = createNewDashboardModel()
        const m2 = createNewDashboardModel()
        expect(m1.configuration.id).not.toBe(m2.configuration.id)
    })
})

describe('addNewWidgetToSheets', () => {
    it('does nothing if widget has no responsive settings', () => {
        const dashboard = makeDashboard()
        const widget = makeWidget({ settings: { configuration: {} } as any })
        addNewWidgetToSheets(dashboard, 0, widget)
        expect(dashboard.sheets[0].widgets.lg).toHaveLength(0)
    })

    it('adds widget sheet items for each responsive size enabled', () => {
        const dashboard = makeDashboard()
        const widget = makeWidget()
        addNewWidgetToSheets(dashboard, 0, widget)
        // All 5 sizes should have the widget
        for (const size of SHEET_WIDGET_SIZES) {
            expect(dashboard.sheets[0].widgets[size]).toHaveLength(1)
            expect(dashboard.sheets[0].widgets[size][0].id).toBe(widget.id)
        }
    })

    it('only adds widget to sizes where responsive is true', () => {
        const dashboard = makeDashboard()
        const widget = makeWidget({
            settings: {
                responsive: { lg: true, md: false, sm: false, xs: false, xxs: false },
                configuration: { widgetMenu: { enabled: true } },
                style: {}
            } as any
        })
        addNewWidgetToSheets(dashboard, 0, widget)
        expect(dashboard.sheets[0].widgets.lg).toHaveLength(1)
        expect(dashboard.sheets[0].widgets.md).toHaveLength(0)
        expect(dashboard.sheets[0].widgets.sm).toHaveLength(0)
    })
})

describe('deleteWidgetHelper', () => {
    it('does nothing when dashboardId is not in dashboards map', () => {
        const widget = makeWidget()
        const dashboards = {}
        // Should not throw
        expect(() => deleteWidgetHelper('missing', widget, dashboards)).not.toThrow()
    })

    it('removes the widget from the widgets array', () => {
        const widget = makeWidget()
        const dashboard = makeDashboard({ widgets: [widget] })
        const dashboards = { dash1: dashboard }
        deleteWidgetHelper('dash1', widget, dashboards)
        expect(dashboards.dash1.widgets).toHaveLength(0)
    })

    it('removes the widget from all sheet sizes', () => {
        const widget = makeWidget()
        const sheet = makeEmptySheet()
        const sheetItem: IWidgetSheetItem = { id: widget.id!, h: 10, i: 'i1', w: 25, x: 0, y: 0, moved: false }
        SHEET_WIDGET_SIZES.forEach((size) => sheet.widgets[size].push({ ...sheetItem }))
        const dashboard = makeDashboard({ widgets: [widget], sheets: [sheet] })
        const dashboards = { dash1: dashboard }
        deleteWidgetHelper('dash1', widget, dashboards)
        for (const size of SHEET_WIDGET_SIZES) {
            expect(dashboards.dash1.sheets[0].widgets[size]).toHaveLength(0)
        }
    })

    it('does not remove other widgets from the list', () => {
        const w1 = makeWidget()
        const w2 = makeWidget()
        const dashboard = makeDashboard({ widgets: [w1, w2] })
        const dashboards = { dash1: dashboard }
        deleteWidgetHelper('dash1', w1, dashboards)
        expect(dashboards.dash1.widgets).toHaveLength(1)
        expect(dashboards.dash1.widgets[0].id).toBe(w2.id)
    })
})

describe('addWidgetMenuConfig', () => {
    it('adds configuration.widgetMenu when configuration is missing', () => {
        const widget = { settings: {} } as any
        addWidgetMenuConfig(widget)
        expect(widget.settings.configuration).toBeDefined()
        expect(widget.settings.configuration.widgetMenu.enabled).toBe(true)
    })

    it('adds widgetMenu when configuration exists but widgetMenu is missing', () => {
        const widget = { settings: { configuration: { rows: {} } } } as any
        addWidgetMenuConfig(widget)
        expect(widget.settings.configuration.widgetMenu.enabled).toBe(true)
    })

    it('does not overwrite an existing widgetMenu', () => {
        const widget = { settings: { configuration: { widgetMenu: { enabled: false } } } } as any
        addWidgetMenuConfig(widget)
        // The function only sets it if absent, so enabled stays false
        expect(widget.settings.configuration.widgetMenu.enabled).toBe(false)
    })
})

describe('addWidgetHelpConfig', () => {
    it('adds settings.help when it is missing', () => {
        const widget = { settings: {} } as any
        addWidgetHelpConfig(widget)
        expect(widget.settings.help).toBeDefined()
    })

    it('does not overwrite an existing help config', () => {
        const existingHelp = { enabled: true, text: 'custom' }
        const widget = { settings: { help: existingHelp } } as any
        addWidgetHelpConfig(widget)
        expect(widget.settings.help).toBe(existingHelp)
    })
})

describe('getFormattedOutputParameters', () => {
    it('returns empty array for null/undefined input', () => {
        expect(getFormattedOutputParameters(null as any)).toEqual([])
        expect(getFormattedOutputParameters(undefined as any)).toEqual([])
    })

    it('maps each output parameter to { enabled, name, type }', () => {
        const params = [
            { name: 'param1', type: { valueCd: 'STRING' } },
            { name: 'param2', type: { valueCd: 'NUMBER' } }
        ] as any[]
        const result = getFormattedOutputParameters(params)
        expect(result).toHaveLength(2)
        expect(result[0].enabled).toBe(true)
        expect(result[0].name).toBe('param1')
        expect(result[0].type).toEqual({ valueCd: 'STRING' })
    })

    it('always sets enabled: true regardless of source', () => {
        const params = [{ name: 'x', type: { valueCd: 'BOOLEAN' } }] as any[]
        const result = getFormattedOutputParameters(params)
        expect(result[0].enabled).toBe(true)
    })
})

describe('applyDashboardViewToModel', () => {
    it('does nothing when view is null', () => {
        const dashboard = makeDashboard()
        const originalSelections = [...(dashboard.configuration.selections ?? [])]
        applyDashboardViewToModel(dashboard, null)
        expect(dashboard.configuration.selections).toEqual(originalSelections)
    })

    it('applies view selections to dashboard configuration', () => {
        const dashboard = makeDashboard()
        const view = {
            settings: {
                selections: [{ datasetId: 1, datasetLabel: 'ds', columnName: 'col', value: ['A'], aggregated: false, timestamp: 0 }]
            }
        } as any
        applyDashboardViewToModel(dashboard, view)
        expect(dashboard.configuration.selections).toBe(view.settings.selections)
    })

    it('applies state to matching widgets', () => {
        const widget = makeWidget({ id: 'w1' })
        const dashboard = makeDashboard({ widgets: [widget] })
        const view = {
            settings: {
                states: { w1: { state: { page: 2 }, search: 'test' } }
            }
        } as any
        applyDashboardViewToModel(dashboard, view)
        expect(dashboard.widgets[0].state).toEqual({ page: 2 })
        expect(dashboard.widgets[0].search).toBe('test')
    })
})

describe('addMissingMenuWidgetsConfiguration', () => {
    it('adds menuWidgets config when it is completely missing', () => {
        const dashboard = makeDashboard()
        delete (dashboard.configuration as any).menuWidgets
        addMissingMenuWidgetsConfiguration(dashboard)
        expect(dashboard.configuration.menuWidgets).toBeDefined()
        expect(dashboard.configuration.menuWidgets.showExcelExport).toBe(true)
        expect(dashboard.configuration.menuWidgets.enableWidgetMenu).toBe(true)
    })

    it('fills in showSelectionButton when undefined', () => {
        const dashboard = makeDashboard()
        delete (dashboard.configuration.menuWidgets as any).showSelectionButton
        addMissingMenuWidgetsConfiguration(dashboard)
        expect(dashboard.configuration.menuWidgets.showSelectionButton).toBe(true)
    })

    it('fills in enableCaching when undefined', () => {
        const dashboard = makeDashboard()
        delete (dashboard.configuration.menuWidgets as any).enableCaching
        addMissingMenuWidgetsConfiguration(dashboard)
        expect(dashboard.configuration.menuWidgets.enableCaching).toBe(true)
    })

    it('fills in enableCustomHeader when undefined', () => {
        const dashboard = makeDashboard()
        delete (dashboard.configuration.menuWidgets as any).enableCustomHeader
        addMissingMenuWidgetsConfiguration(dashboard)
        expect(dashboard.configuration.menuWidgets.enableCustomHeader).toBe(false)
    })

    it('does not overwrite existing truthy values', () => {
        const dashboard = makeDashboard()
        dashboard.configuration.menuWidgets.showExcelExport = false
        addMissingMenuWidgetsConfiguration(dashboard)
        expect(dashboard.configuration.menuWidgets.showExcelExport).toBe(false)
    })
})
