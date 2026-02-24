import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { ISelection, IDataset, IDashboardDriver } from '../Dashboard'

// ─── Mocks ────────────────────────────────────────────────────────────────────
// vi.mock is hoisted above variable declarations, so we must use vi.hoisted()
// for any variables referenced inside the mock factories.

const { mockAddNewWidgetToSheets, mockDeleteWidgetHelper, mockUpdateWidgetHelper, mockCloneWidgetInSheet, mockMoveWidgetToSheet, mockLoadHtmlGallery, mockLoadPythonGallery, mockLoadCustomChartGallery } = vi.hoisted(() => ({
    mockAddNewWidgetToSheets: vi.fn(),
    mockDeleteWidgetHelper: vi.fn(),
    mockUpdateWidgetHelper: vi.fn(),
    mockCloneWidgetInSheet: vi.fn(),
    mockMoveWidgetToSheet: vi.fn(),
    mockLoadHtmlGallery: vi.fn(async () => [{ id: 'h1' }]),
    mockLoadPythonGallery: vi.fn(async () => [{ id: 'p1' }]),
    mockLoadCustomChartGallery: vi.fn(async () => [{ id: 'c1' }])
}))

vi.mock('../DashboardHelpers', () => ({
    SHEET_WIDGET_SIZES: ['xxs', 'xs', 'sm', 'md', 'lg'],
    addNewWidgetToSheets: mockAddNewWidgetToSheets,
    deleteWidgetHelper: mockDeleteWidgetHelper,
    updateWidgetHelper: mockUpdateWidgetHelper,
    cloneWidgetInSheet: mockCloneWidgetInSheet,
    moveWidgetToSheet: mockMoveWidgetToSheet,
    loadHtmlGallery: mockLoadHtmlGallery,
    loadPythonGallery: mockLoadPythonGallery,
    loadCustomChartGallery: mockLoadCustomChartGallery,
    emitter: { emit: vi.fn() }
}))

vi.mock('../widget/interactionsHelpers/DatasetAssociationsHelper', () => ({
    selectionsUseDatasetWithAssociation: vi.fn(() => false)
}))

vi.mock('../widget/interactionsHelpers/InteractionHelper', () => ({
    loadAssociativeSelections: vi.fn(async () => {})
}))

vi.mock('../widget/WidgetEditor/helpers/WidgetEditorHelpers', () => ({
    recreateKnowageChartModel: vi.fn()
}))

// ─── Import after mocks ────────────────────────────────────────────────────────
import useDashboardStore from '../Dashboard.store'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeSelection = (datasetId: number, columnName: string, value: string[] = ['val'], locked = false): ISelection => ({
    datasetId,
    datasetLabel: 'ds',
    columnName,
    value,
    aggregated: false,
    timestamp: 0,
    locked
})

const makeWidget = (id = 'w1') => ({
    id,
    type: 'table' as const,
    new: true,
    dataset: null,
    columns: [],
    settings: {
        responsive: { lg: true, md: true, sm: true, xs: true, xxs: true },
        configuration: { widgetMenu: { enabled: true } },
        style: {}
    } as any
})

const makeDataset = (dsId: number, label: string): IDataset =>
    ({
        id: { dsId } as any,
        label,
        dsTypeCd: 'FILE',
        parameters: [],
        indexes: []
    }) as any

const makeDashboard = (id = 'dash1') => ({
    id,
    sheets: [],
    widgets: [] as any[],
    version: '8.2.0',
    configuration: {
        id,
        name: '',
        label: '',
        description: '',
        cssToRender: '',
        associations: [],
        datasets: [{ id: 1 }, { id: 2 }] as any[],
        variables: [],
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
    },
    selections: [] as ISelection[],
    crossNavigations: [] as any[],
    outputParameters: [] as any[],
    drivers: [] as IDashboardDriver[],
    associations: {} as any
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('dashboardStore — dashboard management', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
        vi.clearAllMocks()
    })

    it('setDashboard stores and getDashboard retrieves it', () => {
        const dashboard = makeDashboard()
        store.setDashboard('dash1', dashboard)
        expect(store.getDashboard('dash1')).toMatchObject({ id: 'dash1' })
    })

    it('getDashboard returns undefined for unknown id', () => {
        expect(store.getDashboard('missing')).toBeUndefined()
    })

    it('removeDashboard deletes the entry', () => {
        store.setDashboard('dash1', makeDashboard())
        store.removeDashboard({ id: 'dash1' })
        expect(store.getDashboard('dash1')).toBeUndefined()
    })

    it('getDashboardsList returns all stored dashboards', () => {
        store.setDashboard('d1', makeDashboard('d1'))
        store.setDashboard('d2', makeDashboard('d2'))
        const list = store.getDashboardsList()
        expect(Object.keys(list)).toHaveLength(2)
        expect(list['d1']).toBeDefined()
        expect(list['d2']).toBeDefined()
    })

    it('getDashboardFromLabel finds by document.label', () => {
        const dashboard = { ...makeDashboard('d1'), document: { label: 'MyReport' } }
        store.setDashboard('d1', dashboard)
        const found = store.getDashboardFromLabel('MyReport')
        expect(found).toMatchObject({ document: { label: 'MyReport' } })
    })

    it('getDashboardFromLabel returns undefined when no match', () => {
        store.setDashboard('d1', { ...makeDashboard('d1'), document: { label: 'Other' } })
        expect(store.getDashboardFromLabel('NotFound')).toBeUndefined()
    })

    it('setDashboardDocument and getDashboardDocument work correctly', () => {
        store.setDashboard('dash1', makeDashboard())
        const doc = { label: 'test', name: 'Test' }
        store.setDashboardDocument('dash1', doc)
        expect(store.getDashboardDocument('dash1')).toEqual(doc)
    })
})

describe('dashboardStore — sheet and navigation', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
    })

    it('selectedSheetIndex starts at 0', () => {
        expect(store.selectedSheetIndex).toBe(0)
    })

    it('setSelectedSheetIndex updates the index', () => {
        store.setSelectedSheetIndex(3)
        expect(store.selectedSheetIndex).toBe(3)
    })

    it('getDashboardSelectedDatasets returns configuration.datasets', () => {
        store.setDashboard('dash1', makeDashboard())
        const datasets = store.getDashboardSelectedDatasets('dash1')
        expect(datasets).toHaveLength(2)
    })

    it('getDashboardSelectedDatasets returns [] for missing dashboard', () => {
        expect(store.getDashboardSelectedDatasets('missing')).toEqual([])
    })
})

describe('dashboardStore — cross navigations and output parameters', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
        store.setDashboard('dash1', makeDashboard())
    })

    it('getCrossNavigations returns empty array initially', () => {
        expect(store.getCrossNavigations('dash1')).toEqual([])
    })

    it('setCrossNavigations / getCrossNavigations round-trip', () => {
        const navs = [{ id: 'cn1' }]
        store.setCrossNavigations('dash1', navs)
        expect(store.getCrossNavigations('dash1')).toEqual(navs)
    })

    it('setCrossNavigations does nothing for unknown dashboard', () => {
        expect(() => store.setCrossNavigations('missing', [{ id: 'cn1' }])).not.toThrow()
    })

    it('getOutputParameters returns empty array initially', () => {
        expect(store.getOutputParameters('dash1')).toEqual([])
    })

    it('setOutputParameters / getOutputParameters round-trip', () => {
        const params = [{ name: 'p1', type: 'String' }]
        store.setOutputParameters('dash1', params)
        expect(store.getOutputParameters('dash1')).toEqual(params)
    })

    it('setOutputParameters does nothing for unknown dashboard', () => {
        expect(() => store.setOutputParameters('missing', [])).not.toThrow()
    })
})

describe('dashboardStore — selections', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
        store.setDashboard('dash1', makeDashboard())
    })

    it('getSelections returns empty array initially', () => {
        expect(store.getSelections('dash1')).toEqual([])
    })

    it('removeSelection removes an unlocked selection by datasetId + columnName', () => {
        const sel = makeSelection(1, 'city')
        store.setDashboard('dash1', { ...makeDashboard(), selections: [sel] })
        store.removeSelection({ datasetId: 1, columnName: 'city' }, 'dash1', null as any)
        expect(store.getSelections('dash1')).toHaveLength(0)
    })

    it('removeSelection keeps a locked selection (forceDelete = false)', () => {
        const sel = makeSelection(1, 'city', ['A'], true)
        store.setDashboard('dash1', { ...makeDashboard(), selections: [sel] })
        store.removeSelection({ datasetId: 1, columnName: 'city' }, 'dash1', null as any, false)
        expect(store.getSelections('dash1')).toHaveLength(1)
    })

    it('removeSelection removes a locked selection when forceDelete = true', () => {
        const sel = makeSelection(1, 'city', ['A'], true)
        store.setDashboard('dash1', { ...makeDashboard(), selections: [sel] })
        store.removeSelection({ datasetId: 1, columnName: 'city' }, 'dash1', null as any, true)
        expect(store.getSelections('dash1')).toHaveLength(0)
    })

    it('removeSelection does nothing when selection is not found', () => {
        store.setDashboard('dash1', { ...makeDashboard(), selections: [makeSelection(1, 'city')] })
        store.removeSelection({ datasetId: 99, columnName: 'unknown' }, 'dash1', null as any)
        expect(store.getSelections('dash1')).toHaveLength(1)
    })

    it('removeSelections removes multiple unlocked selections', () => {
        const s1 = makeSelection(1, 'city')
        const s2 = makeSelection(2, 'region')
        store.setDashboard('dash1', { ...makeDashboard(), selections: [s1, s2] })
        store.removeSelections([s1, s2], 'dash1', null as any)
        expect(store.getSelections('dash1')).toHaveLength(0)
    })

    it('removeSelections skips locked selections', () => {
        const unlocked = makeSelection(1, 'city')
        const locked = makeSelection(2, 'region', ['A'], true)
        store.setDashboard('dash1', { ...makeDashboard(), selections: [unlocked, locked] })
        store.removeSelections([unlocked, locked], 'dash1', null as any)
        expect(store.getSelections('dash1')).toHaveLength(1)
        expect(store.getSelections('dash1')[0].columnName).toBe('region')
    })

    it('removeSelections does nothing when list is empty', () => {
        store.setDashboard('dash1', { ...makeDashboard(), selections: [makeSelection(1, 'col')] })
        store.removeSelections([], 'dash1', null as any)
        expect(store.getSelections('dash1')).toHaveLength(1)
    })
})

describe('dashboardStore — datasets', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
    })

    it('setAllDatasets adds new datasets', () => {
        store.setAllDatasets([makeDataset(1, 'Sales'), makeDataset(2, 'Orders')])
        expect(store.allDatasets).toHaveLength(2)
    })

    it('setAllDatasets deduplicates by dsId', () => {
        store.setAllDatasets([makeDataset(1, 'Sales')])
        store.setAllDatasets([makeDataset(1, 'Sales duplicate')])
        expect(store.allDatasets).toHaveLength(1)
        expect(store.allDatasets[0].label).toBe('Sales')
    })

    it('setAllDatasets accumulates datasets with different dsIds', () => {
        store.setAllDatasets([makeDataset(1, 'A')])
        store.setAllDatasets([makeDataset(2, 'B'), makeDataset(3, 'C')])
        expect(store.allDatasets).toHaveLength(3)
    })

    it('getAllDatasets returns the accumulated list', () => {
        store.setAllDatasets([makeDataset(5, 'Five')])
        expect(store.getAllDatasets()).toHaveLength(1)
    })

    it('getDatasetLabel returns label for known dsId', () => {
        store.setAllDatasets([makeDataset(10, 'Revenue')])
        expect(store.getDatasetLabel(10)).toBe('Revenue')
    })

    it('getDatasetLabel returns empty string for unknown dsId', () => {
        expect(store.getDatasetLabel(999)).toBe('')
    })
})

describe('dashboardStore — drivers and profile attributes', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
        store.setDashboard('dash1', makeDashboard())
    })

    it('getDashboardDrivers returns empty array initially', () => {
        expect(store.getDashboardDrivers('dash1')).toEqual([])
    })

    it('setDashboardDrivers / getDashboardDrivers round-trip', () => {
        const drivers: IDashboardDriver[] = [{ urlName: 'drv1', value: 'v1', name: 'D1', type: 'STRING', multivalue: false, driverLabel: 'Driver 1' }]
        store.setDashboardDrivers('dash1', drivers)
        expect(store.getDashboardDrivers('dash1')).toEqual(drivers)
    })

    it('setDashboardDrivers does nothing for unknown dashboard', () => {
        expect(() => store.setDashboardDrivers('missing', [])).not.toThrow()
    })

    it('getProfileAttributes returns [] initially', () => {
        expect(store.getProfileAttributes()).toEqual([])
    })

    it('setProfileAttributes / getProfileAttributes round-trip', () => {
        const attrs = [{ name: 'tenant', value: 'acme' }]
        store.setProfileAttributes(attrs)
        expect(store.getProfileAttributes()).toEqual(attrs)
    })
})

describe('dashboardStore — themes and views', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
        store.setDashboard('dash1', makeDashboard())
    })

    it('getAllThemes returns [] initially', () => {
        expect(store.getAllThemes()).toEqual([])
    })

    it('setAllThemes / getAllThemes round-trip', () => {
        const themes = [{ id: 1, name: 'Dark' } as any]
        store.setAllThemes(themes)
        expect(store.getAllThemes()).toEqual(themes)
    })

    it('setAssociations / getAssociations round-trip', () => {
        const assoc = { group1: ['ds1', 'ds2'] }
        store.setAssociations('dash1', assoc)
        expect(store.getAssociations('dash1')).toEqual(assoc)
    })

    it('setAssociations does nothing for unknown dashboard', () => {
        expect(() => store.setAssociations('missing', {})).not.toThrow()
    })

    it('getCurrentDashboardView returns undefined initially', () => {
        expect(store.getCurrentDashboardView('dash1')).toBeUndefined()
    })

    it('setCurrentDashboardView / getCurrentDashboardView round-trip', () => {
        const view = { id: 'v1', settings: { selections: [] } } as any
        store.setCurrentDashboardView('dash1', view)
        expect(store.getCurrentDashboardView('dash1')).toEqual(view)
    })
})

describe('dashboardStore — execution time', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
        store.setDashboard('dash1', makeDashboard())
    })

    it('getExecutionTime returns null initially', () => {
        expect(store.getExecutionTime('dash1')).toBeFalsy()
    })

    it('setExecutionTime / getExecutionTime round-trip', () => {
        const now = new Date()
        store.setExecutionTime('dash1', now)
        expect(store.getExecutionTime('dash1')).toEqual(now)
    })

    it('getExecutionTime returns null for unknown dashboard', () => {
        expect(store.getExecutionTime('missing')).toBeNull()
    })
})

describe('dashboardStore — internationalization', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
    })

    it('getInternationalization returns {} initially', () => {
        expect(store.getInternationalization()).toEqual({})
    })

    it('setInternationalization / getInternationalization round-trip', () => {
        const i18n = { en: { hello: 'Hello' }, it: { hello: 'Ciao' } }
        store.setInternationalization(i18n)
        expect(store.getInternationalization()).toEqual(i18n)
    })
})

describe('dashboardStore — highcharts scatter', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
    })

    it('isHighchartsScatterAttributePresent is false initially', () => {
        expect(store.isHighchartsScatterAttributePresent).toBe(false)
    })

    it('setHighchartsScatterAttributePresent / getHighchartsScatterAttributePresent round-trip', () => {
        store.setHighchartsScatterAttributePresent(true)
        expect(store.getHighchartsScatterAttributePresent()).toBe(true)
    })

    it('setting to false works correctly', () => {
        store.setHighchartsScatterAttributePresent(true)
        store.setHighchartsScatterAttributePresent(false)
        expect(store.getHighchartsScatterAttributePresent()).toBe(false)
    })
})

describe('dashboardStore — widget actions (with mocked helpers)', () => {
    let store: ReturnType<typeof useDashboardStore>

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
        vi.clearAllMocks()
        store.setDashboard('dash1', makeDashboard())
    })

    it('createNewWidget pushes widget to dashboard.widgets and calls addNewWidgetToSheets', () => {
        const widget = makeWidget()
        store.createNewWidget('dash1', widget)
        expect(store.dashboards['dash1'].widgets).toHaveLength(1)
        expect(store.dashboards['dash1'].widgets[0].id).toBe(widget.id)
        expect(mockAddNewWidgetToSheets).toHaveBeenCalledOnce()
        expect(mockAddNewWidgetToSheets).toHaveBeenCalledWith(store.dashboards['dash1'], 0, widget, null)
    })

    it('createNewWidget passes originalWidget when provided', () => {
        const widget = makeWidget('w1')
        const original = makeWidget('w0')
        store.createNewWidget('dash1', widget, original)
        expect(mockAddNewWidgetToSheets).toHaveBeenCalledWith(store.dashboards['dash1'], 0, widget, original)
    })

    it('deleteWidget delegates to deleteWidgetHelper', () => {
        const widget = makeWidget()
        store.deleteWidget('dash1', widget)
        expect(mockDeleteWidgetHelper).toHaveBeenCalledOnce()
        expect(mockDeleteWidgetHelper).toHaveBeenCalledWith('dash1', widget, store.dashboards)
    })

    it('updateWidget delegates to updateWidgetHelper', () => {
        const widget = makeWidget()
        store.updateWidget('dash1', widget)
        expect(mockUpdateWidgetHelper).toHaveBeenCalledOnce()
        expect(mockUpdateWidgetHelper).toHaveBeenCalledWith('dash1', widget, store.dashboards, 0)
    })

    it('cloneWidget delegates to cloneWidgetInSheet', () => {
        const widget = makeWidget()
        const sheet = { id: 's1', index: 0, label: 'S', widgets: { lg: [], md: [], sm: [], xs: [], xxs: [] } }
        store.cloneWidget('dash1', widget, sheet as any)
        expect(mockCloneWidgetInSheet).toHaveBeenCalledOnce()
        expect(mockCloneWidgetInSheet).toHaveBeenCalledWith(widget, store.dashboards['dash1'], sheet)
    })

    it('cloneWidget does nothing when dashboard does not exist', () => {
        const widget = makeWidget()
        store.cloneWidget('missing', widget, {} as any)
        expect(mockCloneWidgetInSheet).not.toHaveBeenCalled()
    })

    it('moveWidget does nothing when dashboard does not exist', () => {
        store.moveWidget('missing', makeWidget(), {} as any, null as any)
        expect(mockMoveWidgetToSheet).not.toHaveBeenCalled()
    })

    it('moveWidget calls moveWidgetToSheet when dashboard exists', () => {
        const widget = makeWidget()
        const targetSheet = { id: 'target', index: 1, label: 'T', widgets: { lg: [], md: [], sm: [], xs: [], xxs: [] } }
        const currentSheet = {
            id: 'current',
            index: 0,
            label: 'C',
            widgets: {
                lg: [{ id: widget.id, h: 10, i: 'i1', w: 25, x: 0, y: 0, moved: false }],
                md: [],
                sm: [],
                xs: [],
                xxs: []
            }
        }
        store.moveWidget('dash1', widget, targetSheet as any, currentSheet as any)
        expect(mockMoveWidgetToSheet).toHaveBeenCalledOnce()
    })
})

describe('dashboardStore — async gallery actions', () => {
    let store: ReturnType<typeof useDashboardStore>
    const $http = {}

    beforeEach(() => {
        setActivePinia(createPinia())
        store = useDashboardStore()
        vi.clearAllMocks()
        store.setDashboard('dash1', makeDashboard())
    })

    it('getHTMLGaleryItems returns [] for unknown dashboard', async () => {
        const items = await store.getHTMLGaleryItems('missing', $http)
        expect(items).toEqual([])
    })

    it('getHTMLGaleryItems loads and caches HTML gallery items', async () => {
        const items = await store.getHTMLGaleryItems('dash1', $http)
        expect(items).toHaveLength(1)
        expect(items[0].id).toBe('h1')
        expect(mockLoadHtmlGallery).toHaveBeenCalledOnce()
    })

    it('getHTMLGaleryItems uses cache on second call', async () => {
        await store.getHTMLGaleryItems('dash1', $http)
        await store.getHTMLGaleryItems('dash1', $http)
        expect(mockLoadHtmlGallery).toHaveBeenCalledOnce()
    })

    it('getPythonGaleryItems loads python gallery items', async () => {
        const items = await store.getPythonGaleryItems('dash1', $http)
        expect(items).toHaveLength(1)
        expect(items[0].id).toBe('p1')
    })

    it('getCustomChartGaleryItems loads custom chart gallery items', async () => {
        const items = await store.getCustomChartGaleryItems('dash1', $http)
        expect(items).toHaveLength(1)
        expect(items[0].id).toBe('c1')
    })

    it('setHTMLGaleryItems sets gallery items directly', () => {
        const items = [{ id: 'manual' } as any]
        store.setHTMLGaleryItems('dash1', items)
        expect(store.dashboards['dash1'].htmlGallery).toEqual(items)
    })
})
