import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import deepcopy from 'deepcopy'
import { addSelectionsToData } from '../../../DashboardDataProxy'
import { getMapWidgetData } from '../MapWidgetDataProxy'

const { dashboard } = vi.hoisted(() => ({ dashboard: { dataProxyQueue: {} } }))

vi.mock('axios', () => ({ default: { post: vi.fn() } }))
vi.mock('@/App.store.js', () => ({ default: () => ({}) }))
vi.mock('@/App.i18n', () => ({ default: { global: { t: (key: string) => key } } }))
vi.mock('../../../Dashboard.store', () => ({ default: () => dashboard }))
vi.mock('@/idb', () => ({ indexedDB: {} }))
vi.mock('@/helpers/commons/localeHelper', () => ({ luxonFormatDate: vi.fn() }))
vi.mock('../../../helpers/DashboardToastHelper', () => ({ showDashboardWidgetError: vi.fn() }))
vi.mock('../../../helpers/datasetRefresh/DatasetRefreshHelpers', () => ({ clearDatasetInterval: vi.fn() }))
vi.mock('../../TableWidget/TableWidgetDataProxy', () => ({ getTableWidgetData: vi.fn() }))
vi.mock('../../SelectorWidget/SelectorWidgetDataProxy', () => ({ getSelectorWidgetData: vi.fn() }))
vi.mock('../../WebComponent/WebComponentDataProxy', () => ({ getWebComponentWidgetData: vi.fn() }))
vi.mock('../../ChartWidget/Highcharts/HighchartsDataProxy', () => ({ getHighchartsWidgetData: vi.fn() }))
vi.mock('../../DiscoveryWidget/DiscoveryWidgetDataProxy', () => ({ getDiscoveryWidgetData: vi.fn() }))
vi.mock('../../ChartWidget/ChartJS/ChartJSDataProxy', () => ({ getChartJSWidgetData: vi.fn() }))
vi.mock('../../cePivotWidget/cePivotWidgetDataProxy', () => ({ getCePivotData: vi.fn() }))
vi.mock('../../PythonWidget/PythonWidgetDataProxy', () => ({ getPythonData: vi.fn() }))
vi.mock('@/workspaces/PivotWidget/PivotWidgetDataProxy', () => ({ getPivotData: vi.fn() }))

const createWidget = () =>
    ({
        type: 'map',
        columns: [],
        settings: { visualizations: [] },
        layers: [
            {
                type: 'dataset',
                layerId: 'ds_sales',
                label: 'sales',
                columns: [
                    { name: 'COUNTRY_CODE', alias: 'Country', fieldType: 'ATTRIBUTE', properties: { aggregateBy: false }, filter: { enabled: true, operator: 'IN', value: 'IT, FR' } },
                    { name: 'SALES_AMOUNT', alias: 'Revenue', fieldType: 'MEASURE', aggregationSelected: 'SUM', filter: { enabled: true, operator: 'range', value: '10', value2: '100' } },
                    { name: 'DISABLED', fieldType: 'ATTRIBUTE', filter: { enabled: false, operator: '=', value: 'ignored' } },
                    { name: 'REMOVED', fieldType: 'ATTRIBUTE', deleted: true, filter: { enabled: true, operator: '=', value: 'ignored' } },
                    { name: 'GEO', fieldType: 'SPATIAL_ATTRIBUTE', filter: { enabled: true, operator: '=', value: 'ignored' } },
                    { name: 'LEGACY', fieldType: 'ATTRIBUTE' }
                ]
            },
            {
                type: 'dataset',
                layerId: 'ds_population',
                label: 'population',
                columns: [{ name: 'YEAR', alias: 'Year', fieldType: 'ATTRIBUTE', filter: { enabled: true, operator: '=', value: '2026' } }]
            }
        ]
    }) as any

describe('map dataset field filters', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        dashboard.dataProxyQueue = {}
        vi.mocked(axios.post).mockResolvedValue({ data: { rows: [] } })
    })

    it('sends multiple filters only to their dataset, using field names rather than display aliases', async () => {
        const widget = createWidget()
        const savedWidget = deepcopy(widget)
        const datasets = [{ id: 1, dsLabel: 'sales' }, { id: 2, dsLabel: 'population' }] as any

        await getMapWidgetData('dashboard', {} as any, widget, datasets, true, [])

        expect(axios.post).toHaveBeenCalledTimes(2)
        const salesRequest = vi.mocked(axios.post).mock.calls[0][1] as any
        const populationRequest = vi.mocked(axios.post).mock.calls[1][1] as any
        expect(salesRequest.selections).toEqual({
            sales: {
                COUNTRY_CODE: { filterOperator: 'IN', filterVals: ["('IT')", "('FR')"] },
                SALES_AMOUNT: { filterOperator: 'range', filterVals: ["('10')", "('100')"] }
            }
        })
        expect(salesRequest.aggregations.categories.map((column: any) => column.columnName)).not.toContain('COUNTRY_CODE')
        expect(populationRequest.selections).toEqual({ population: { YEAR: { filterOperator: '=', filterVals: ["('2026')"] } } })
        expect(widget).toEqual(savedWidget)
    })

    it.each([false, true])('combines map filters with existing selections (associative: %s)', (associative) => {
        const widget = createWidget()
        const selections = [{ datasetLabel: 'sales', columnName: 'COUNTRY_CODE', value: ['IT'] }] as any
        const associativeSelections = associative ? { sales: { COUNTRY_CODE: ["('IT')"] } } : undefined
        const request = { selections: {} }

        addSelectionsToData(request, widget, 'sales', false, selections, associativeSelections)

        expect(request.selections).toEqual({
            sales: {
                COUNTRY_CODE: ["('IT')", { filterOperator: 'IN', filterVals: ["('IT')", "('FR')"] }],
                SALES_AMOUNT: { filterOperator: 'range', filterVals: ["('10')", "('100')"] }
            }
        })
    })

    it('preserves unfiltered legacy maps and requests without matching dataset columns', () => {
        const widget = createWidget()
        delete widget.layers[0].columns
        const request = { selections: {} }

        addSelectionsToData(request, widget, 'sales', true, [], undefined)
        expect(request.selections).toEqual({})
        addSelectionsToData(request, { type: 'map' } as any, 'sales', true, [], undefined)
        expect(request.selections).toEqual({})
    })
})
