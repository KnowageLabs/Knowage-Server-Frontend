import { describe, expect, it, vi } from 'vitest'
import { formatModel } from '../DashboardBackwardCompatibilityHelper'
import { setVariableValueFromDataset } from '../../generalSettings/VariablesHelper'

vi.mock('../mapWidget/MapCompatibilityHelper', () => ({}))
vi.mock('../tableWidget/TableWidgetCompatibilityHelper', () => ({}))
vi.mock('../selectorWidget/SelectorWidgetCompatibilityHelper', () => ({}))
vi.mock('../selectionWidget/SelectionsWidgetCompatibilityHelper', () => ({}))
vi.mock('../htmlWidget/HTMLWidgetCompatibilityHelper', () => ({}))
vi.mock('../textWidget/TextWidgetCompatibilityHelper', () => ({}))
vi.mock('../chartWidget/highcharts/HighchartsWidgetCompatibilityHelper', () => ({}))
vi.mock('../chartWidget/chartJS/ChartJSWidgetCompatibilityHelper', () => ({}))
vi.mock('../imageWidget/ImageWidgetCompatibilityHelper', () => ({}))
vi.mock('../customChart/CustomChartWidgetCompatibilityHelper', () => ({}))
vi.mock('../pivotWidget/PivotTableCompatibilityHelper', () => ({}))
vi.mock('../discoveryWidget/DiscoveryWidgetCompatibilityHelper', () => ({}))
vi.mock('../pythonWidget/PythonWidgetCompatibilityHelper', () => ({}))
vi.mock('../cePivotWidget/cePivotTableCompatibilityHelper', () => ({}))
vi.mock('../../dataset/DatasetEditorDataTab/DatasetEditorDataDetail/DatasetEditorDriverDialog/DatasetEditorDatasetDriverFormatterHelper', () => ({}))
vi.mock('../../DashboardHelpers', () => ({}))
vi.mock('../../generalSettings/VariablesHelper', () => ({ setVariableValueFromDataset: vi.fn() }))

describe('cockpit dataset variable conversion', () => {
    it.each(['UNIT_SALES', undefined])('passes converted dataset configuration and current drivers for column %s', async (column) => {
        const model = {
            sheets: [],
            configuration: {
                style: {},
                datasets: [{ dsId: 7, dsLabel: 'DS_CHART', useCache: true, parameters: { year: '$P{Year}', region: 'EMEA' } }],
                variables: [
                    { name: 'current_year', type: 'driver', driver: 'Year' },
                    { name: 'previous_year', type: 'dataset', dataset: 7, column }
                ]
            }
        }
        const datasets = [{ id: { dsId: 7 }, label: 'DS_CHART' }] as any
        const drivers = [{ urlName: 'Year', value: '2024' }] as any
        const http = { post: vi.fn() }

        const dashboard = await formatModel(model, { id: 1, label: 'TEST_CHART_VAR', name: 'TEST_CHART_VAR' }, datasets, drivers, [], http, {})

        expect(setVariableValueFromDataset).toHaveBeenLastCalledWith(
            dashboard.configuration.variables[1],
            datasets,
            http,
            [
                {
                    id: 7,
                    dsLabel: 'DS_CHART',
                    cache: true,
                    parameters: [
                        { name: 'year', type: 'static', value: '$P{Year}' },
                        { name: 'region', type: 'static', value: 'EMEA' }
                    ]
                }
            ],
            drivers
        )
        expect(dashboard.configuration.variables[0].value).toBe('2024')
    })
})
