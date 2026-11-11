import { beforeEach, describe, expect, it, vi } from 'vitest'
import WidgetController from '../WidgetController.vue'
import SelectorWidgetContainer from '../SelectorWidget/SelectorWidgetContainer.vue'
import { getWidgetData } from '../../DashboardDataProxy'
import { getSelectorWidgetData } from '../SelectorWidget/SelectorWidgetDataProxy'

vi.mock('@/App.store', () => ({ default: () => ({}) }))
vi.mock('../../Dashboard.store', () => ({ default: () => ({}) }))
vi.mock('../../DashboardDataProxy', () => ({ getWidgetData: vi.fn() }))
vi.mock('../../DashboardHelpers', () => ({ emitter: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canEditDashboard: vi.fn(), DATASET_EXPORT_FORMATS: [] }))
vi.mock('../../helpers/DashboardToastHelper', () => ({ showDashboardActionToast: vi.fn(), showDashboardWidgetError: vi.fn() }))
vi.mock('../SelectorWidget/SelectorWidgetDataProxy', () => ({ getSelectorWidgetData: vi.fn() }))
vi.mock('../SelectorWidget/SelectorWidget.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../WidgetRenderer.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../WidgetButtonBar.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../commonComponents/QuickWidgetDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../commonComponents/ChangeWidgetDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../WidgetSearchDialog/WidgetSearchDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../SheetPickerDialog/SheetPickerDialog.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../../dataset/DatasetEditorDataTab/DatasetEditorPreview.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../interactionsHelpers/DatasetAssociationsHelper', () => ({ datasetIsUsedInAssociations: vi.fn() }))
vi.mock('../interactionsHelpers/InteractionHelper', () => ({ loadAssociativeSelections: vi.fn() }))
vi.mock('../interactionsHelpers/PreviewHelper', () => ({ formatParameterForPreview: vi.fn() }))
vi.mock('../WidgetControllerHelpers', () => ({ quickWidgetCreateChartFromTable: vi.fn(), quickWidgetCreateTableFromChart: vi.fn() }))
vi.mock('../../helpers/DashboardExportHelper', () => ({ createWidgetExportBody: vi.fn() }))
vi.mock('../PivotWidget/PivotWidgetExportHelper', () => ({ enrichPivotWidgetWithSortState: vi.fn() }))
vi.mock('@/helpers/commons/fileHelper', () => ({ downloadDirectFromResponse: vi.fn() }))
vi.mock('dom-to-image-more', () => ({ default: {} }))

const deferred = () => {
    let resolve!: (value: any) => void
    const promise = new Promise<any>((resolvePromise) => (resolve = resolvePromise))
    return { promise, resolve }
}

const createController = () => {
    const controller = {
        dashboardId: 'dashboard',
        widgetModel: { id: 'table', type: 'table', dataset: 1 },
        model: { configuration: { datasets: [] } },
        dashboards: { dashboard: { configuration: {} } },
        selectorWidgetsInitialData: {},
        updateFromSelections: true,
        activeSelections: [],
        search: { searchText: '', searchColumns: [] },
        $http: {},
        widgetDataRequestId: 0,
        widgetLoading: false,
        loading: false,
        widgetData: null,
        getSelections: vi.fn(() => []),
        getSelectionsFromStore: vi.fn(),
        getAssociativeSelectionsFromStoreIfDatasetIsBeingUsedInAssociation: vi.fn(() => null),
        widgetUsesSelections: (selections: any[]) => selections.some((selection) => selection.datasetId === 1),
        setWidgetLoading(loading: boolean) {
            this.loading = loading
        }
    } as any
    for (const name of ['loadInitialData', 'reloadWidgetData', 'loadActiveSelections']) controller[name] = WidgetController.methods![name].bind(controller)
    return controller
}

describe('selection-driven widget concurrency', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it.each(['loadInitialData', 'reloadWidgetData'])('does not let an older %s response replace a newer selection result', async (firstMethod) => {
        const controller = createController()
        const older = deferred()
        const newer = deferred()
        vi.mocked(getWidgetData).mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)

        const first = controller[firstMethod](null)
        const second = controller.reloadWidgetData(null)
        newer.resolve({ rows: ['new'] })
        await second
        older.resolve({ rows: ['old'] })
        await first

        expect(controller.widgetData).toEqual({ rows: ['new'] })
        expect(controller.widgetLoading).toBe(false)
    })

    it('ignores another dashboard and reloads when direct or propagated selections are cleared', async () => {
        const controller = createController()
        controller.activeSelections = [{ datasetId: 1 }]
        controller.getSelectionsFromStore.mockImplementation(() => (controller.activeSelections = []))
        controller.reloadWidgetData = vi.fn()

        await controller.loadActiveSelections({ dashboardId: 'other' })
        expect(controller.getSelectionsFromStore).not.toHaveBeenCalled()

        await controller.loadActiveSelections({ dashboardId: 'dashboard' })
        expect(controller.reloadWidgetData).toHaveBeenCalledOnce()

        await controller.loadActiveSelections({ dashboardId: 'dashboard', associationsCleared: true })
        expect(controller.reloadWidgetData).toHaveBeenCalledTimes(2)
    })

    it('applies Play only to its target selector and preserves selections outside its columns', async () => {
        const otherDataset = { datasetId: 2, columnName: 'REGION', value: ['IT'] }
        const otherColumn = { datasetId: 1, columnName: 'FG_TMR', value: ['0'] }
        const oldMonth = { datasetId: 1, columnName: 'MESE_DESC', value: ['Gennaio'] }
        const newMonth = { datasetId: 1, columnName: 'MESE_DESC', value: ['Febbraio'] }
        const controller = {
            dashboardId: 'dashboard',
            propWidget: { id: 'months', dataset: 1, columns: [{ columnName: 'MESE_DESC' }] },
            dashboards: { dashboard: { selections: [otherDataset, otherColumn, oldMonth] } },
            localSelections: { MESE_DESC: newMonth, FG_TMR: { ...otherColumn, value: ['1'] } },
            setSelections: vi.fn(),
            $http: {}
        } as any
        const onPlay = SelectorWidgetContainer.methods!.onPlayClicked.bind(controller)

        await onPlay({ widgetId: 'another-selector', dashboardId: 'dashboard' })
        await onPlay({ widgetId: 'months', dashboardId: 'other' })
        expect(controller.setSelections).not.toHaveBeenCalled()

        await onPlay({ widgetId: 'months', dashboardId: 'dashboard' })
        expect(controller.setSelections).toHaveBeenLastCalledWith('dashboard', [otherDataset, otherColumn, newMonth], controller.$http)

        controller.localSelections = {}
        await onPlay({ widgetId: 'months', dashboardId: 'dashboard' })
        expect(controller.setSelections).toHaveBeenLastCalledWith('dashboard', [otherDataset, otherColumn], controller.$http)
    })

    it('discards obsolete local selector results, including those superseded by parent data', async () => {
        const controller = {
            dashboardId: 'dashboard',
            propWidget: { dataset: 1 },
            dashboards: { dashboard: { configuration: { datasets: [] } } },
            localSelections: {},
            localWidgetData: null,
            unlockedColumnName: null,
            dataRequestId: 0,
            loading: false,
            $http: {}
        } as any
        const older = deferred()
        const newer = deferred()
        const obsolete = deferred()
        vi.mocked(getSelectorWidgetData).mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise).mockReturnValueOnce(obsolete.promise)
        const refresh = SelectorWidgetContainer.methods!.refreshLocalWidgetData.bind(controller)

        const first = refresh()
        const second = refresh()
        older.resolve({ rows: ['old'] })
        await first
        expect(controller.localWidgetData).toBeNull()
        expect(controller.loading).toBe(true)

        newer.resolve({ rows: ['new'] })
        await second
        expect(controller.localWidgetData).toEqual({ rows: ['new'] })
        expect(controller.loading).toBe(false)

        const pending = refresh()
        controller.dataToShow = { rows: ['parent'] }
        const onParentData = SelectorWidgetContainer.watch!.dataToShow as (this: any) => void
        onParentData.call(controller)
        obsolete.resolve({ rows: ['obsolete'] })
        await pending
        expect(controller.localWidgetData).toEqual({ rows: ['parent'] })
        expect(controller.loading).toBe(false)
    })
})
