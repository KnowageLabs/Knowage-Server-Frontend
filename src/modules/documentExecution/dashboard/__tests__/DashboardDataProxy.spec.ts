import { beforeEach, describe, expect, it, vi } from 'vitest'
import deepcopy from 'deepcopy'
import { addSelectionsToData, getWidgetData } from '../DashboardDataProxy'

const { dashboard, widgetData } = vi.hoisted(() => ({
    dashboard: { dataProxyQueue: {} },
    widgetData: { get: vi.fn(), add: vi.fn() }
}))

vi.mock('@/App.store.js', () => ({ default: () => ({}) }))
vi.mock('@/App.i18n', () => ({ default: { global: { t: (key: string) => key } } }))
vi.mock('../Dashboard.store', () => ({ default: () => dashboard }))
vi.mock('@/idb', () => ({ indexedDB: { widgetData } }))
vi.mock('@/helpers/commons/localeHelper', () => ({ luxonFormatDate: vi.fn() }))
vi.mock('../helpers/DashboardToastHelper', () => ({ showDashboardWidgetError: vi.fn() }))
vi.mock('../widget/SelectorWidget/SelectorWidgetDataProxy', () => ({ getSelectorWidgetData: vi.fn() }))
vi.mock('../widget/WebComponent/WebComponentDataProxy', () => ({ getWebComponentWidgetData: vi.fn() }))
vi.mock('../widget/MapWidget/MapWidgetDataProxy', () => ({ getMapWidgetData: vi.fn() }))
vi.mock('../widget/DiscoveryWidget/DiscoveryWidgetDataProxy', () => ({ getDiscoveryWidgetData: vi.fn() }))
vi.mock('../widget/ChartWidget/ChartJS/ChartJSDataProxy', () => ({ getChartJSWidgetData: vi.fn() }))
vi.mock('../widget/cePivotWidget/cePivotWidgetDataProxy', () => ({ getCePivotData: vi.fn() }))
vi.mock('../widget/PythonWidget/PythonWidgetDataProxy', () => ({ getPythonData: vi.fn() }))
vi.mock('@/workspaces/PivotWidget/PivotWidgetDataProxy', () => ({ getPivotData: vi.fn() }))

const createWidget = (type: 'highcharts' | 'table', filterValue?: string) =>
    ({
        id: type,
        type,
        dataset: 1,
        columns: [
            {
                id: 'flag',
                columnName: 'FG_TMR',
                alias: 'Flag TMR',
                fieldType: 'ATTRIBUTE',
                filter: filterValue === undefined ? undefined : { enabled: true, operator: '=', value: filterValue }
            },
            { id: 'amount', columnName: 'AMOUNT', alias: 'Amount', fieldType: 'MEASURE', aggregation: 'SUM' }
        ],
        settings: {
            chartModel: { model: { chart: { type: 'bar' } } },
            configuration: { summaryRows: { enabled: false } },
            pagination: { enabled: false }
        }
    }) as any

describe('dashboard widget filter isolation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        dashboard.dataProxyQueue = {}
        widgetData.get.mockResolvedValue(undefined)
        widgetData.add.mockResolvedValue(1)
    })

    it.each([false, true])('does not leak chart filters into table requests sharing associative selections (caching: %s)', async (enableCaching) => {
        const associativeSelections = { sales: { FG_TMR: ["('0')"] } }
        const originalSelections = deepcopy(associativeSelections)
        const datasets = [{ id: 1, dsLabel: 'sales', cache: enableCaching }] as any
        const configuration = { menuWidgets: { enableCaching } } as any
        const search = { searchText: '', searchColumns: [] }
        const http = { post: vi.fn().mockResolvedValue({ data: { rows: [] } }) }

        await getWidgetData('dashboard', createWidget('highcharts', '1'), datasets, http, false, [], search, configuration, associativeSelections)
        await getWidgetData('dashboard', createWidget('table'), datasets, http, false, [], search, configuration, associativeSelections)

        expect(http.post).toHaveBeenCalledTimes(2)
        const chartRequest = http.post.mock.calls[0][1]
        const tableRequest = http.post.mock.calls[1][1]
        expect(chartRequest.selections).toEqual({
            sales: { FG_TMR: ["('0')", { filterOperator: '=', filterVals: ["('1')"] }] }
        })
        expect(tableRequest.selections).toEqual({ sales: { FG_TMR: ["('0')"] } })
        expect(associativeSelections).toEqual(originalSelections)
    })

    it('keeps different local filters and request arrays independent without copying parameters into selections', () => {
        const associativeSelections = {
            sales: { FG_TMR: ["('0')"], '$P{year}': ["('2026')"] },
            otherDataset: { REGION: ["('IT')"] }
        }
        const originalSelections = deepcopy(associativeSelections)
        const firstRequest = { selections: {} }
        const secondRequest = { selections: {} }
        const repeatedRequest = { selections: {} }

        addSelectionsToData(firstRequest, createWidget('highcharts', '1'), 'sales', false, [], associativeSelections)
        addSelectionsToData(secondRequest, createWidget('highcharts', '2'), 'sales', false, [], associativeSelections)
        addSelectionsToData(repeatedRequest, createWidget('highcharts', '1'), 'sales', false, [], associativeSelections)

        expect(firstRequest.selections).toEqual({
            sales: { FG_TMR: ["('0')", { filterOperator: '=', filterVals: ["('1')"] }] }
        })
        expect(secondRequest.selections).toEqual({
            sales: { FG_TMR: ["('0')", { filterOperator: '=', filterVals: ["('2')"] }] }
        })
        expect(repeatedRequest.selections).toEqual(firstRequest.selections)
        expect(associativeSelections).toEqual(originalSelections)
    })
})
