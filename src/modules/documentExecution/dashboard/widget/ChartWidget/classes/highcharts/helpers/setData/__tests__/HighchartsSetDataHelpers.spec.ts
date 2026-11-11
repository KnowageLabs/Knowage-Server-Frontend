import { describe, expect, it } from 'vitest'
import Highcharts from 'highcharts/esm/highcharts.js'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { setGroupedByCategoriesData, setRegularData } from '../HighchartsSetDataHelpers'
import { KnowageHighchartsBarChart } from '../../../KnowageHighchartsBarChart'
import { KnowageHighchartsLineChart } from '../../../KnowageHighchartsLineChart'

type IDataColumn = {
    column: IWidgetColumn
    metadata: {
        dataIndex: string
        type: string
    }
}

const createWidgetColumn = (columnName: string, fieldType: 'ATTRIBUTE' | 'MEASURE'): IWidgetColumn => ({
    id: columnName,
    columnName,
    alias: columnName,
    type: fieldType === 'MEASURE' ? 'number' : 'string',
    fieldType,
    multiValue: false,
    aggregation: fieldType === 'MEASURE' ? 'SUM' : 'NONE',
    filter: {
        enabled: false,
        operator: '',
        value: ''
    }
})

const createWidgetModel = (): IWidget => {
    const regionColumn = createWidgetColumn('region', 'ATTRIBUTE')
    const countryColumn = createWidgetColumn('country', 'ATTRIBUTE')
    const cityColumn = createWidgetColumn('city', 'ATTRIBUTE')
    const salesColumn = createWidgetColumn('sales', 'MEASURE')

    return {
        dataset: null,
        type: 'highcharts',
        columns: [regionColumn, countryColumn, cityColumn, salesColumn],
        settings: {
            series: {
                aliases: []
            }
        }
    }
}

const createModel = () => ({
    series: [],
    xAxis: [{}]
})

const createMeasureColumn = (widgetModel: IWidget): IDataColumn => ({
    column: widgetModel.columns[3],
    metadata: {
        dataIndex: 'column_2',
        type: 'number'
    }
})

const createAttributeColumn = (widgetModel: IWidget, index: number): IDataColumn => ({
    column: widgetModel.columns[index],
    metadata: {
        dataIndex: 'column_1',
        type: 'string'
    }
})

const createCategoryColorWidget = () => {
    const widget = createWidgetModel()
    widget.columns[1] = createWidgetColumn('family', 'ATTRIBUTE')
    widget.settings.series.conditionalStyles = {
        enabled: true,
        conditions: [
            { target: 'family', condition: { operator: '==', value: 'Food' }, properties: { color: '#00aa00' } },
            { target: 'family', condition: { operator: '==', value: 'Drink' }, properties: { color: '#0000ff' } }
        ]
    }
    return widget
}

const categoryRows = [
    { column_1: 'North', column_2: 'Food', column_3: 100 },
    { column_1: 'South', column_2: 'Food', column_3: 80 },
    { column_1: 'North', column_2: 'Drink', column_3: 120 },
    { column_1: 'South', column_2: 'Other', column_3: 60 }
]

const createCategoryColorModel = (widget: IWidget, rows = categoryRows, variables: any[] = []) => {
    const model = createModel()
    setGroupedByCategoriesData(
        model,
        { rows },
        [
            { column: widget.columns[0], metadata: { dataIndex: 'column_1', type: 'string' } },
            { column: widget.columns[1], metadata: { dataIndex: 'column_2', type: 'string' } }
        ],
        [{ column: widget.columns[3], metadata: { dataIndex: 'column_3', type: 'number' } }],
        'sales',
        widget,
        variables
    )
    return model
}

describe('category colors', () => {
    it('uses the category color for both rendered bars and legend symbols', () => {
        const model = createCategoryColorModel(createCategoryColorWidget())
        const container = document.createElement('div')
        document.body.appendChild(container)
        const chart = Highcharts.chart(container, {
            chart: { type: 'column', animation: false, width: 500, height: 300 },
            accessibility: { enabled: false },
            colors: ['#999999', '#888888', '#777777'],
            plotOptions: { series: { animation: false } },
            series: model.series
        })

        try {
            expect(chart.series.map((series) => series.legendItem?.label?.element.textContent)).toEqual(['Food', 'Drink', 'Other'])
            expect(chart.series.map((series) => series.color)).toEqual(['#00aa00', '#0000ff', '#999999'])
            chart.series.forEach((series) => {
                expect(series.legendItem?.symbol?.attr('fill')).toBe(series.color)
                series.points.filter((point) => !point.isNull).forEach((point) => expect(point.color).toBe(series.color))
            })
        } finally {
            chart.destroy()
            container.remove()
        }
    })

    it.each([
        { rows: [...categoryRows].reverse() },
        { rows: categoryRows.filter((row) => row.column_2 !== 'Food') }
    ])('keeps the value-to-color association after sorting or filtering', ({ rows }) => {
        const widget = createCategoryColorWidget()
        widget.settings.series.aliases = [{ column: widget.columns[3], alias: 'Units sold' }]
        const model = createCategoryColorModel(widget, rows)

        model.series.forEach((series) => {
            const expectedColor = { Food: '#00aa00', Drink: '#0000ff' }[series.custom.groupingValue]
            expect(series.name).toBe(series.custom.groupingValue)
            expect(series.color).toBe(expectedColor)
            series.data.filter((point) => point.y !== null).forEach((point) => expect(point.color).toBe(expectedColor))
        })
    })

    it('falls back to the palette when category rules are disabled', () => {
        const widget = createCategoryColorWidget()
        widget.settings.series.conditionalStyles.enabled = false
        const model = createCategoryColorModel(widget)

        expect(model.series.every((series) => series.color === undefined && series.data.every((point) => point.color === undefined))).toBe(true)
    })

    it('does not use measure-based conditions as category legend colors', () => {
        const widget = createCategoryColorWidget()
        widget.settings.series.conditionalStyles.conditions = [{ target: 'sales', condition: { operator: '>', value: '90' }, properties: { color: '#ff0000' } }]
        const model = createCategoryColorModel(widget)

        expect(model.series.every((series) => series.color === undefined)).toBe(true)
        expect(model.series[0].data[0].color).toBe('#ff0000')
        expect(model.series[0].data[1].color).toBeUndefined()
    })

    it('does not use X-axis category conditions as grouping-series legend colors', () => {
        const widget = createCategoryColorWidget()
        widget.settings.series.conditionalStyles.conditions = [{ target: 'region', condition: { operator: '==', value: 'North' }, properties: { color: '#ff0000' } }]
        const model = createCategoryColorModel(widget)

        expect(model.series.every((series) => series.color === undefined)).toBe(true)
        expect(model.series[0].data[0].color).toBe('#ff0000')
        expect(model.series[0].data[1].color).toBeUndefined()
    })

    it('resolves variables in category rules for both points and legend', () => {
        const widget = createCategoryColorWidget()
        widget.settings.series.conditionalStyles.conditions[0].condition.value = '$V{family}'
        const model = createCategoryColorModel(widget, categoryRows, [{ name: 'family', type: 'string', value: 'Food' }])

        expect(model.series[0].color).toBe('#00aa00')
        expect(model.series[0].data[0].color).toBe('#00aa00')
    })

    it.each(['bar', 'line'] as const)('colors category series in %s charts grouped by a second measure', (type) => {
        const widget = createCategoryColorWidget()
        widget.columns = [widget.columns[1], createWidgetColumn('year', 'MEASURE'), widget.columns[3]]
        widget.settings.configuration = { grouping: { enabled: false, secondSeries: { enabled: true } } }
        widget.settings.interactions = { drilldown: { enabled: false } }
        const chart = type === 'bar' ? new KnowageHighchartsBarChart(null, 'bar', false) : new KnowageHighchartsLineChart(null)
        const series = chart.setData(
            {
                metaData: { fields: widget.columns.map((column) => ({ header: column.columnName, dataIndex: column.columnName, type: column.type })) },
                rows: [
                    { family: 'Food', year: 2025, sales: 100 },
                    { family: 'Drink', year: 2025, sales: 80 },
                    { family: 'Food', year: 2026, sales: 120 }
                ]
            },
            widget,
            []
        )

        expect(series.map((serie) => ({ name: serie.name, color: serie.color }))).toEqual([
            { name: 'Food', color: '#00aa00' },
            { name: 'Drink', color: '#0000ff' }
        ])
        expect(series[0].data.map((point) => point.y)).toEqual([100, 120])
    })
})

describe('setRegularData drilldown state', () => {
    it('keeps intermediate drilldown points navigable when the current response exposes only the active attribute', () => {
        const widgetModel = createWidgetModel()
        const model = createModel()

        setRegularData(
            model,
            widgetModel,
            { rows: [{ column_1: 'Italy', column_2: 100 }] },
            [createAttributeColumn(widgetModel, 1)],
            [createMeasureColumn(widgetModel)],
            true,
            '',
            [],
            1
        )

        expect(model.series[0].data[0].drilldown).toBe(true)
    })

    it('does not mark points as drillable on the terminal drilldown level', () => {
        const widgetModel = createWidgetModel()
        const model = createModel()

        setRegularData(
            model,
            widgetModel,
            { rows: [{ column_1: 'Milan', column_2: 100 }] },
            [createAttributeColumn(widgetModel, 2)],
            [createMeasureColumn(widgetModel)],
            true,
            '',
            [],
            2
        )

        expect(model.series[0].data[0].drilldown).toBe(false)
    })
})

describe('setGroupedByCategoriesData', () => {
    it('preserves the incoming order for numeric-looking secondary categories', () => {
        const widgetModel = createWidgetModel()
        const model = createModel()

        setGroupedByCategoriesData(
            model,
            {
                rows: [
                    { column_1: 'North', column_2: '2026', column_3: 100 },
                    { column_1: 'South', column_2: '2026', column_3: 80 },
                    { column_1: 'North', column_2: '2025', column_3: 120 },
                    { column_1: 'South', column_2: '2025', column_3: 60 }
                ]
            },
            [
                { column: widgetModel.columns[0], metadata: { dataIndex: 'column_1', type: 'string' } },
                { column: widgetModel.columns[1], metadata: { dataIndex: 'column_2', type: 'string' } }
            ],
            [{ column: widgetModel.columns[3], metadata: { dataIndex: 'column_3', type: 'number' } }],
            'sales',
            widgetModel,
            []
        )

        expect(model.series.map((series: { name: string }) => series.name)).toEqual(['2026', '2025'])
    })
})
