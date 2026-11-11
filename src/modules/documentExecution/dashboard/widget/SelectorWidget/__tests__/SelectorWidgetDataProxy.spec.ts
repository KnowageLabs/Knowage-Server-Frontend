import { beforeEach, describe, expect, it, vi } from 'vitest'
import deepcopy from 'deepcopy'
import { getSelectorWidgetData } from '../SelectorWidgetDataProxy'

const { dashboard, widgetData } = vi.hoisted(() => ({
    dashboard: { dataProxyQueue: {} },
    widgetData: { get: vi.fn() }
}))

vi.mock('../../../Dashboard.store', () => ({ default: () => dashboard }))
vi.mock('@/idb', () => ({ indexedDB: { widgetData } }))
vi.mock('../../../DashboardDataProxy', () => ({
    addDataToCache: vi.fn(),
    addDriversToData: vi.fn(),
    addParametersToData: vi.fn(),
    addSelectionsToData: vi.fn(),
    showGetDataError: vi.fn()
}))
vi.mock('../../ChartWidget/classes/highcharts/helpers/setData/HighchartsSetDataHelpers', () => ({
    DataType: { DATE_SHORT: 'DD/MM/YYYY', DATE_LONG: 'DD/MM/YYYY HH:mm:ss.SSS', NUMBER: 'NUMBER', STRING: 'STRING' }
}))

const createWidget = (orderType = 'ASC') =>
    ({
        id: 'months',
        type: 'selector',
        dataset: 1,
        columns: [{ id: 'month', alias: 'Month', columnName: 'MESE_DESC', fieldType: 'ATTRIBUTE', orderColumn: 'MESE_ORD', orderType }],
        settings: { configuration: { selectorType: { modality: 'dropdown' }, columnTypeConfigs: [] } }
    }) as any

const createResponse = (rows: Record<string, string | number>[], columns = ['MESE_DESC', 'MESE_ORD']) => ({
    metaData: { fields: [{ name: 'id' }, ...columns.map((header, index) => ({ name: `column_${index + 1}`, header }))] },
    rows
})

const getData = async (widget: any, response: ReturnType<typeof createResponse>, cached = false) => {
    const http = { post: vi.fn().mockResolvedValue({ data: response }) }
    if (cached) widgetData.get.mockResolvedValue({ data: response })
    const data = await getSelectorWidgetData('dashboard', { menuWidgets: { enableCaching: cached } } as any, widget, [{ id: 1, dsLabel: 'BIBICO_TEST_TMR', cache: true }] as any, http, true, [])
    return { data, http }
}

describe('selector external sorting columns', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        dashboard.dataProxyQueue = {}
        widgetData.get.mockResolvedValue(undefined)
    })

    it.each(['ASC', 'DESC'])('selects the external column and preserves distinct options in %s order, including a zero sort value', async (orderType) => {
        const widget = createWidget(orderType)
        const savedWidget = deepcopy(widget)
        const response = createResponse([
            { column_1: 'Gennaio', column_2: 0 },
            { column_1: 'Marzo', column_2: 2 },
            { column_1: 'Febbraio', column_2: 1 },
            { column_1: 'Gennaio', column_2: 3 }
        ])
        const originalRows = deepcopy(response.rows)

        const { data, http } = await getData(widget, response)

        const categories = http.post.mock.calls[0][1].aggregations.categories
        expect(categories.map((column: any) => column.columnName)).toEqual(['MESE_DESC', 'MESE_ORD'])
        expect(categories[0]).toMatchObject({ columnName: 'MESE_DESC', orderColumn: 'MESE_ORD', orderType })
        expect(data.MESE_DESC.rows.map((row: any) => row.column_1)).toEqual(orderType === 'ASC' ? ['Gennaio', 'Febbraio', 'Marzo'] : ['Gennaio', 'Marzo', 'Febbraio'])
        expect(data.MESE_DESC.rows[0].column_2).toBe(orderType === 'ASC' ? 0 : 3)
        expect(response.rows).toEqual(originalRows)
        expect(widget).toEqual(savedWidget)
    })

    it.each([false, true])('preserves description columns and cached rows while sorting by a third column (cached: %s)', async (cached) => {
        const widget = createWidget()
        widget.columns[0].columnName = 'MESE'
        widget.columns[0].descriptionColumn = 'MESE_DESC'
        widget.columns.push({ id: 'description', alias: 'Month description', columnName: 'MESE_DESC', fieldType: 'ATTRIBUTE' })
        const response = createResponse(
            [
                { column_1: 2, column_2: 'Febbraio', column_3: 2 },
                { column_1: 1, column_2: 'Gennaio', column_3: 1 }
            ],
            ['MESE', 'MESE_DESC', 'MESE_ORD']
        )
        const originalRows = deepcopy(response.rows)

        const { data, http } = await getData(widget, response, cached)

        expect(Object.keys(data)).toEqual(['MESE'])
        expect(data.MESE.rows).toEqual([originalRows[1], originalRows[0]])
        expect(response.rows).toEqual(originalRows)
        if (cached) expect(http.post).not.toHaveBeenCalled()
        else expect(http.post.mock.calls[0][1].aggregations.categories.map((column: any) => column.columnName)).toEqual(['MESE', 'MESE_DESC', 'MESE_ORD'])
    })

    it('does not duplicate a sorting column that is already selected', async () => {
        const widget = createWidget()
        widget.columns[0].orderColumn = 'MESE_DESC'
        const response = createResponse([{ column_1: 'Gennaio' }], ['MESE_DESC'])

        const { data, http } = await getData(widget, response)

        expect(http.post.mock.calls[0][1].aggregations.categories.map((column: any) => column.columnName)).toEqual(['MESE_DESC'])
        expect(data.MESE_DESC.rows).toEqual(response.rows)
    })

    it('keeps an empty response available instead of replacing it with undefined', async () => {
        const { data } = await getData(createWidget(), createResponse([]))

        expect(data.MESE_DESC.rows).toEqual([])
    })

    it('applies external sorting to flat tree overrides without collapsing tree paths', async () => {
        const widget = createWidget()
        widget.settings.configuration.selectorType.modality = 'tree'
        widget.settings.configuration.columnTypeConfigs = [{ columns: ['MESE_DESC'], selectorType: 'dropdown' }]
        widget.columns.unshift({ id: 'country', alias: 'Country', columnName: 'COUNTRY', fieldType: 'ATTRIBUTE' }, { id: 'city', alias: 'City', columnName: 'CITY', fieldType: 'ATTRIBUTE' })
        const treeResponse = createResponse(
            [
                { column_1: 'IT', column_2: 'Roma' },
                { column_1: 'IT', column_2: 'Milano' }
            ],
            ['COUNTRY', 'CITY']
        )
        const monthResponse = createResponse([
            { column_1: 'Febbraio', column_2: 2 },
            { column_1: 'Gennaio', column_2: 1 }
        ])
        const http = {
            post: vi.fn(async (_url: string, request: any) => ({ data: request.aggregations.categories[0].columnName === 'COUNTRY' ? treeResponse : monthResponse }))
        }

        const data = await getSelectorWidgetData('dashboard', {} as any, widget, [{ id: 1, dsLabel: 'BIBICO_TEST_TMR' }] as any, http, true, [])

        expect(data.COUNTRY.rows).toEqual(treeResponse.rows)
        expect(data.MESE_DESC.rows.map((row: any) => row.column_1)).toEqual(['Gennaio', 'Febbraio'])
        expect(http.post.mock.calls[1][1].aggregations.categories.map((column: any) => column.columnName)).toEqual(['MESE_DESC', 'MESE_ORD'])
    })
})
