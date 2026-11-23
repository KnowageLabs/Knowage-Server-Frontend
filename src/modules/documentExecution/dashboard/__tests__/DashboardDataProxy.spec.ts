import { beforeEach, describe, expect, it, vi } from 'vitest'
import deepcopy from 'deepcopy'
import { addSelectionsToData, getWidgetData } from '../DashboardDataProxy'
import { setVariableValueFromDataset } from '../generalSettings/VariablesHelper'
import { showDashboardWidgetError } from '../helpers/DashboardToastHelper'
import { luxonFormatDate } from '@/helpers/commons/localeHelper'

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
vi.mock('../helpers/datasetRefresh/DatasetRefreshHelpers', () => ({ setDatasetInterval: vi.fn(), clearDatasetInterval: vi.fn() }))
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

describe('dataset variable execution context', () => {
    const datasets = [{ id: { dsId: 7 }, label: 'DS_CHART' }] as any
    const dashboardDatasets = [
        { id: 8, parameters: [{ name: 'year', value: 'wrong dataset' }] },
        {
            id: 7,
            parameters: [
                { name: 'year', value: '$P{Year}' },
                { name: 'region', value: 'EMEA' },
                { name: 'countries', value: '$P{Countries}' },
                { name: 'date', value: '$P{Date}' }
            ],
            drivers: [{ urlName: 'Country', parameterValue: ['IT', ''] }],
            indexes: [{ fields: [{ store: 'DS_CHART', column: 'UNIT_SALES' }] }]
        }
    ] as any
    const createDrivers = () =>
        [
            { urlName: 'Year', value: '2024', type: 'NUM' },
            { urlName: 'Countries', value: 'IT, FR', type: 'STRING', multivalue: true },
            { urlName: 'Date', value: '01/01/2024', type: 'DATE' }
        ] as any

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(luxonFormatDate).mockReturnValue('2024-01-01')
    })

    it('loads a column variable using configured parameters, current drivers and indexes before the dashboard is stored', async () => {
        const variable = { name: 'previous_year', type: 'dataset', dataset: 7, column: 'UNIT_SALES', value: '' }
        const http = {
            post: vi.fn().mockImplementation((_url, body) => {
                if (body.parameters.year !== '2024' || body.parameters.region !== 'EMEA' || !body.drivers.Country) return Promise.reject(new Error('Missing dataset execution context'))
                return Promise.resolve({ data: { metaData: { fields: ['recNo', { header: 'UNIT_SALES', name: 'column_2' }] }, rows: [{ column_1: 'ignored', column_2: 42 }] } })
            })
        }

        await setVariableValueFromDataset(variable, datasets, http, dashboardDatasets, createDrivers())

        expect(variable.value).toBe(42)
        expect(http.post).toHaveBeenCalledWith(
            expect.stringContaining('/2.0/datasets/DS_CHART/data?'),
            expect.objectContaining({
                parameters: { year: '2024', region: 'EMEA', countries: ['IT', 'FR'], date: '2024-01-01' },
                drivers: { Country: ['IT'] },
                indexes: dashboardDatasets[1].indexes
            }),
            { headers: { 'X-Disable-Errors': 'true' } }
        )
        expect(showDashboardWidgetError).not.toHaveBeenCalled()
    })

    it('keeps whole-dataset variables pivoted while forwarding the execution context', async () => {
        const variable = { name: 'sales', type: 'dataset', dataset: 7, value: '' } as any
        const http = { post: vi.fn().mockResolvedValue({ data: { rows: [{ column_1: '2023', column_2: 10 }, { column_1: '2024', column_2: 20 }] } }) }

        await setVariableValueFromDataset(variable, datasets, http, dashboardDatasets, createDrivers())

        expect(variable.pivotedValues).toEqual({ 2023: 10, 2024: 20 })
        expect(http.post.mock.calls[0][1].parameters.year).toBe('2024')
    })

    it('still loads variables without configured parameters or drivers', async () => {
        const variable = { name: 'previous_year', type: 'dataset', dataset: 7, column: 'UNIT_SALES', value: '' }
        const http = { post: vi.fn().mockResolvedValue({ data: { metaData: { fields: [{ header: 'UNIT_SALES', name: 'column_1' }] }, rows: [{ column_1: 0 }] } }) }

        await setVariableValueFromDataset(variable, datasets, http)

        expect(variable.value).toBe(0)
    })

    it('reports the dataset error without throwing a ReferenceError or interrupting variable loading', async () => {
        const variable = { name: 'previous_year', type: 'dataset', dataset: 7, column: 'UNIT_SALES', value: 'stale' }
        const http = { post: vi.fn().mockRejectedValue(new Error('Dataset unavailable')) }

        await expect(setVariableValueFromDataset(variable, datasets, http, dashboardDatasets, createDrivers())).resolves.toBe('')

        expect(variable.value).toBe('')
        expect(showDashboardWidgetError).toHaveBeenCalledWith(undefined, 'Dataset unavailable', 'DS_CHART')
    })
})
