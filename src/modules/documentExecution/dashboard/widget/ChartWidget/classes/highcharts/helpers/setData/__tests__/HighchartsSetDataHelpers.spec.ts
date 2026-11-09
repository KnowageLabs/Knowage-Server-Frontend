import { describe, expect, it } from 'vitest'
import Highcharts from 'highcharts'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { setGroupedByCategoriesData } from '../HighchartsSetDataHelpers'
import { KnowageHighchartsBarChart } from '../../../KnowageHighchartsBarChart'
import { KnowageHighchartsLineChart } from '../../../KnowageHighchartsLineChart'

const createCategoryColorWidget = () => ({
    columns: [
        { id: 'region', columnName: 'region', fieldType: 'ATTRIBUTE', type: 'string' },
        { id: 'family', columnName: 'family', fieldType: 'ATTRIBUTE', type: 'string' },
        { id: 'sales', columnName: 'sales', fieldType: 'MEASURE', type: 'number' }
    ],
    settings: {
        series: {
            aliases: [],
            conditionalStyles: {
                enabled: true,
                conditions: [
                    { target: 'family', condition: { operator: '==', value: 'Food' }, properties: { color: '#00aa00' } },
                    { target: 'family', condition: { operator: '==', value: 'Drink' }, properties: { color: '#0000ff' } }
                ]
            }
        }
    }
}) as IWidget

const categoryRows = [
    { column_1: 'North', column_2: 'Food', column_3: 100 },
    { column_1: 'South', column_2: 'Food', column_3: 80 },
    { column_1: 'North', column_2: 'Drink', column_3: 120 },
    { column_1: 'South', column_2: 'Other', column_3: 60 }
]

const createCategoryColorModel = (widget: IWidget, rows = categoryRows, variables: any[] = []) => {
    const model = { series: [] as any[], xAxis: [{}] }
    setGroupedByCategoriesData(
        model,
        { rows },
        [
            { column: widget.columns[0], metadata: { dataIndex: 'column_1', type: 'string' } },
            { column: widget.columns[1], metadata: { dataIndex: 'column_2', type: 'string' } }
        ],
        [{ column: widget.columns[2], metadata: { dataIndex: 'column_3', type: 'number' } }],
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
        widget.settings.series.aliases = [{ column: widget.columns[2], alias: 'Units sold' }]
        const model = createCategoryColorModel(widget, rows)

        model.series.forEach((series) => {
            const expectedColor = { Food: '#00aa00', Drink: '#0000ff' }[series.custom.groupingValue]
            expect(series.name).toBe(`Units sold - ${series.custom.groupingValue}`)
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

    it.each([
        { target: 'sales', condition: { operator: '>', value: '90' } },
        { target: 'region', condition: { operator: '==', value: 'North' } }
    ])('does not use conditions on $target as grouping-series legend colors', ({ target, condition }) => {
        const widget = createCategoryColorWidget()
        widget.settings.series.conditionalStyles.conditions = [{ target, condition, properties: { color: '#ff0000' } }]
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
        widget.columns = [widget.columns[1], { id: 'year', columnName: 'year', fieldType: 'MEASURE', type: 'number' } as IWidgetColumn, widget.columns[2]]
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

describe('setGroupedByCategoriesData measure names', () => {
    it.each([undefined, 'Sales alias'])('uses the measure name or alias (%s) and preserves grouping order, sorting and null values', (alias) => {
        const columns = [
            { id: 'region', columnName: 'region', fieldType: 'ATTRIBUTE' },
            { id: 'year', columnName: 'year', fieldType: 'ATTRIBUTE' },
            { id: 'sales', columnName: 'sales', fieldType: 'MEASURE', orderType: 'DESC' }
        ] as IWidgetColumn[]
        const widget = { columns, settings: { series: { aliases: alias ? [{ column: columns[2], alias }] : [] } } } as IWidget
        const model = { series: [] as any[], xAxis: [{ categories: ['old'] }] }

        setGroupedByCategoriesData(
            model,
            {
                rows: [
                    { column_1: 'North', column_2: '2026', column_3: null },
                    { column_1: 'South', column_2: '2026', column_3: '80' },
                    { column_1: 'North', column_2: '2025', column_3: '20' }
                ]
            },
            [
                { column: columns[0], metadata: { dataIndex: 'column_1', type: 'string' } },
                { column: columns[1], metadata: { dataIndex: 'column_2', type: 'string' } }
            ],
            [{ column: columns[2], metadata: { dataIndex: 'column_3', type: 'number' } }],
            'sales',
            widget,
            []
        )

        expect(model.series.map((series) => series.name)).toEqual([`${alias ?? 'sales'} - 2026`, `${alias ?? 'sales'} - 2025`])
        expect(model.series.map((series) => series.custom.groupingValue)).toEqual(['2026', '2025'])
        expect(model.series[0].data).toEqual([{ name: 'South', y: 80 }, { name: 'North', y: null }])
        expect(model.series[1].data).toEqual([{ name: 'North', y: 20 }, { name: 'South', y: null }])
        expect(model.xAxis[0]).not.toHaveProperty('categories')
    })
})
