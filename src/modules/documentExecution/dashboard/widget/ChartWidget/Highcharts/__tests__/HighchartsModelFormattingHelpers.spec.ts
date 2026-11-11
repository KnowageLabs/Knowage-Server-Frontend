import { describe, expect, it } from 'vitest'
import Highcharts from 'highcharts/esm/highcharts.js'
import 'highcharts/esm/modules/sankey.js'
import 'highcharts/esm/modules/dependency-wheel.js'
import 'highcharts/esm/modules/drilldown.js'
import deepcopy from 'deepcopy'
import { KnowageHighcharts } from '../../classes/highcharts/KnowageHighcharts'
import { KnowageHighchartsLineChart } from '../../classes/highcharts/KnowageHighchartsLineChart'
import { addCategoryXAxisLabelTooltips, formatSankeyChart, formatVariables, normalizeCategoryXAxisLabels, normalizeLegendItemColors, updateAxisLabelFormatters, updateHighchartsLocale, updateHighchartsSeriesAliases } from '../HighchartsModelFormattingHelpers'

const createModel = (categories: string[], labels: Record<string, any> = {}) =>
    ({
        chart: { type: 'line' },
        xAxis: [{ type: 'category', categories, labels }],
        yAxis: [],
        tooltip: {}
    }) as any

const getTitle = (element: SVGTextElement) => element.querySelector('title')?.textContent
const formatterText = 'function () { return "formatted " + this.value }'

const updateFormatters = (model: any, variables: any[] = []) => {
    const highchartsModel = new KnowageHighcharts()
    return updateAxisLabelFormatters(model, highchartsModel.updateFormatterSettings.bind(highchartsModel), variables)
}

describe('variable-backed series aliases', () => {
    it('renders a configured alias and updates its legend without replacing series or saved expressions', () => {
        const measure = { id: 'sales', columnName: 'Sales', fieldType: 'MEASURE' }
        const widget = {
            columns: [{ id: 'quarter', columnName: 'Quarter', fieldType: 'ATTRIBUTE' }, measure],
            settings: { configuration: {}, interactions: {}, series: { aliases: [{ column: measure, alias: 'Revenue ($V{currency})' }] } }
        } as any
        const chartModel = new KnowageHighchartsLineChart(null)
        chartModel.setData(
            {
                metaData: { fields: [{ header: 'Quarter', dataIndex: 'quarter' }, { header: 'Sales', dataIndex: 'sales' }] },
                rows: [{ quarter: 'Q1', sales: 100 }]
            },
            widget,
            []
        )
        const variables = [{ name: 'currency', value: 'EUR' }] as any
        const model = deepcopy(chartModel.getModel())
        formatVariables(model, variables)
        const container = document.createElement('div')
        document.body.appendChild(container)
        const chart = Highcharts.chart(container, {
            ...model,
            chart: { type: 'line', animation: false, width: 500, height: 300 },
            accessibility: { enabled: false }
        } as any)

        try {
            const series = chart.series[0]
            const point = series.points[0]
            expect(series.legendItem?.label?.element.textContent).toBe('Revenue (EUR)')
            point.select(true, false)
            series.setVisible(false, false)

            variables[0].value = 'USD'
            updateHighchartsSeriesAliases(chart, variables)

            expect(chart.series[0]).toBe(series)
            expect(series.points[0]).toBe(point)
            expect(point.selected).toBe(true)
            expect(series.visible).toBe(false)
            expect(series.legendItem?.label?.element.textContent).toBe('Revenue (USD)')
            expect(series.options.custom?.seriesNameTemplate).toBe('Revenue ($V{currency})')
            expect(point.name).toBe('Q1')
            expect(chartModel.getModel().series[0].name).toBe('Revenue ($V{currency})')
            expect(widget.settings.series.aliases[0].alias).toBe('Revenue ($V{currency})')
        } finally {
            chart.destroy()
            container.remove()
        }
    })

    it('supports multiple placeholders and zero values without changing category labels or grouping metadata', () => {
        const model = {
            xAxis: [],
            yAxis: [],
            series: [
                { name: '$V{caption}: $V{year}', custom: { groupingValue: 'Food' }, data: [{ name: '$V{caption}', y: 1 }] },
                { name: 'Static alias', data: [] }
            ]
        } as any

        formatVariables(model, [{ name: 'caption', value: 'Revenue' }, { name: 'year', value: 0 }] as any)
        expect(model.series[0]).toMatchObject({
            name: 'Revenue: 0',
            custom: { groupingValue: 'Food', seriesNameTemplate: '$V{caption}: $V{year}' },
            data: [{ name: '$V{caption}', y: 1 }]
        })
        expect(model.series[1].name).toBe('Static alias')

        formatVariables(model, [{ name: 'caption', value: 'Sales' }, { name: 'year', value: 2026 }] as any)
        expect(model.series[0].name).toBe('Sales: 2026')
    })

    it('resolves the latest variable value after returning from drilldown', () => {
        const model = {
            chart: { type: 'column', animation: false, width: 500, height: 300 },
            xAxis: [{}],
            yAxis: [{}],
            accessibility: { enabled: false },
            series: [{ name: '$V{caption}', type: 'column', data: [{ name: 'Q1', y: 100, drilldown: 'quarter' }] }],
            drilldown: { animation: false }
        } as any
        const variables = [{ name: 'caption', value: 'Revenue' }] as any
        formatVariables(model, variables)
        const container = document.createElement('div')
        document.body.appendChild(container)
        const chart = Highcharts.chart(container, model)

        try {
            expect(chart.series[0].options.custom?.seriesNameTemplate).toBe('$V{caption}')
            chart.addSeriesAsDrilldown(chart.series[0].points[0], { type: 'column', name: 'Q1', data: [50, 50] })
            variables[0].value = 'Sales'
            updateHighchartsSeriesAliases(chart, variables)
            expect(chart.series[0].name).toBe('Q1')

            chart.drillUp()
            updateHighchartsSeriesAliases(chart, variables)
            expect(chart.series[0].name).toBe('Sales')
            expect(chart.series[0].points[0].name).toBe('Q1')
        } finally {
            chart.destroy()
            container.remove()
        }
    })
})

describe('live chart locale formatting', () => {
    it('updates rendered labels, axes and tooltips without replacing the chart data or visibility state', () => {
        const previousLang = { ...Highcharts.getOptions().lang }
        const container = document.createElement('div')
        document.body.appendChild(container)
        const chart = Highcharts.chart(container, {
            chart: { type: 'column', animation: false, width: 500, height: 300 },
            accessibility: { enabled: false },
            yAxis: { min: 0, max: 2000, tickInterval: 1000, labels: { format: '{value:,.2f}' } },
            tooltip: { valueDecimals: 2 },
            plotOptions: { series: { animation: false, dataLabels: { enabled: true, format: '{point.y:,.2f}' } } },
            series: [
                { type: 'column', data: [1234.5] },
                { type: 'column', visible: false, data: [1500] }
            ]
        })

        try {
            const series = chart.series[0]
            const point = series.points[0]
            chart.yAxis[0].setExtremes(0, 2000, false)

            for (const [locale, expected, axisLabel] of [
                ['en-US', '1,234.50', '1,000.00'],
                ['it-IT', '1.234,50', '1.000,00'],
                ['en-US', '1,234.50', '1,000.00']
            ]) {
                updateHighchartsLocale(chart, locale)
                expect(chart.series[0]).toBe(series)
                expect(series.points[0]).toBe(point)
                expect(chart.series[1].visible).toBe(false)
                expect(chart.yAxis[0].getExtremes()).toMatchObject({ userMin: 0, userMax: 2000 })
                expect(container.querySelector('.highcharts-data-label text')?.textContent).toBe(expected)
                expect(container.querySelector('.highcharts-yaxis-labels')?.textContent).toContain(axisLabel)
                expect(Highcharts.numberFormat(1234.5, 2)).toBe(expected)
                chart.tooltip.refresh(point)
                expect(chart.tooltip.getLabel().element.textContent).toContain(expected)
            }
        } finally {
            chart.destroy()
            container.remove()
            Highcharts.setOptions({ lang: previousLang })
        }
    })

    it('keeps the active drilldown series and breadcrumb history when changing locale', () => {
        const previousLang = { ...Highcharts.getOptions().lang }
        const container = document.createElement('div')
        document.body.appendChild(container)
        const chart = Highcharts.chart(container, {
            chart: { type: 'column', animation: false, width: 500, height: 300 },
            accessibility: { enabled: false },
            series: [{ type: 'column', data: [{ name: 'Quarter', y: 1234.5, drilldown: 'quarter' }] }],
            drilldown: { animation: false }
        })

        try {
            chart.addSeriesAsDrilldown(chart.series[0].points[0], { type: 'column', name: 'Family', data: [1234.5] })
            const series = chart.series[0]

            updateHighchartsLocale(chart, 'it-IT')
            expect(chart.series[0]).toBe(series)
            expect(chart.series[0].name).toBe('Family')
            expect(chart.numberFormatter(1234.5, 2)).toBe('1.234,50')

            chart.drillUp()
            expect(chart.series[0].points[0].name).toBe('Quarter')
            expect(chart.numberFormatter(1234.5, 2)).toBe('1.234,50')
        } finally {
            chart.destroy()
            container.remove()
            Highcharts.setOptions({ lang: previousLang })
        }
    })
})

describe('Sankey point legends', () => {
    it.each([
        { type: 'sankey', inverted: false },
        { type: 'sankey', inverted: true },
        { type: 'dependencywheel', inverted: false }
    ])('renders $type with inverted=$inverted and keeps its point legend after updating data', ({ type, inverted }) => {
        let beforeRenderChart: Highcharts.Chart | undefined
        const model = {
            chart: {
                type,
                inverted,
                animation: false,
                width: 500,
                height: 300,
                events: {
                    beforeRender: function (this: Highcharts.Chart) {
                        beforeRenderChart = this
                    }
                }
            },
            accessibility: { enabled: false },
            plotOptions: { series: { animation: false, showInLegend: true, legendType: 'point' } },
            series: [{ data: [{ from: 'A', to: 'B', weight: 10, name: 'A -> B' }] }]
        } as any
        formatSankeyChart(model)
        const container = document.createElement('div')
        document.body.appendChild(container)
        let chart: Highcharts.Chart | undefined

        try {
            chart = Highcharts.chart(container, model)
            expect(beforeRenderChart).toBe(chart)
            const point = chart.series[0].points[0] as Highcharts.Point & { legendItem?: Highcharts.LegendItemObject }
            expect(point.graphic).toBeDefined()
            expect(chart.legend.allItems.map((item) => item.name)).toEqual(['A -> B'])
            expect(point.legendItem?.symbol?.attr('fill')).toBe(point.color)

            chart.series[0].setData([{ from: 'B', to: 'C', weight: 5, name: 'B -> C' }] as any)

            expect(chart.series[0].points[0].graphic).toBeDefined()
            expect(chart.legend.allItems.map((item) => item.name)).toEqual(['B -> C'])
        } finally {
            chart?.destroy()
            container.remove()
        }
    })
})

describe('legend hover colors', () => {
    it.each([
        { backgroundColor: '#ffffff', color: 'contrast' },
        { backgroundColor: '#222222', color: 'contrast' },
        { backgroundColor: '#ffffff', color: '#123456' }
    ])('keeps legend text readable on hover with $backgroundColor background and $color text', ({ backgroundColor, color }) => {
        const model = {
            chart: { backgroundColor, animation: false, width: 500, height: 300 },
            accessibility: { enabled: false },
            legend: { itemStyle: { color } },
            series: [{ name: '2026', data: [1, 2] }]
        } as any
        normalizeLegendItemColors(model)
        const container = document.createElement('div')
        document.body.appendChild(container)
        const chart = Highcharts.chart(container, model)

        try {
            const legendItem = chart.series[0].legendItem!
            const label = legendItem.label!.element
            const normalColor = label.getAttribute('fill')

            legendItem.group!.element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
            expect(label.textContent).toBe('2026')
            expect(label.getAttribute('fill')).toBe(normalColor)

            legendItem.group!.element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
            expect(label.getAttribute('fill')).toBe(normalColor)
        } finally {
            chart.destroy()
            container.remove()
        }
    })

    it('preserves custom hover styling and fills only a missing hover color', () => {
        const model = { legend: { itemStyle: { color: '#123456' }, itemHoverStyle: { textDecoration: 'underline' } } } as any
        normalizeLegendItemColors(model)
        expect(model.legend.itemHoverStyle).toEqual({ color: '#123456', textDecoration: 'underline' })

        model.legend.itemHoverStyle.color = '#ff0000'
        normalizeLegendItemColors(model)
        expect(model.legend.itemHoverStyle).toEqual({ color: '#ff0000', textDecoration: 'underline' })
    })
})

describe('categorical X-axis labels', () => {
    it('leaves short labels unchanged while applying one-line ellipsis settings', () => {
        const categories = ['January', 'February', 'March']
        const model = createModel(categories, { style: { fontSize: '12px', fontWeight: 'bold' } })

        normalizeCategoryXAxisLabels(model)

        expect(model.xAxis[0].categories).toEqual(categories)
        expect(model.xAxis[0].labels).toMatchObject({
            autoRotation: [],
            overflow: 'justify',
            style: { fontSize: '12px', fontWeight: 'bold', textOverflow: 'ellipsis' }
        })
    })

    describe('axis formatters', () => {
        it.each(['line', 'column', 'bar'])('compiles valid X-axis formatters for %s charts', (type) => {
            const model = {
                chart: { type },
                xAxis: [{ labels: { formatterText } }],
                yAxis: []
            } as any

            expect(updateFormatters(model)).toBe(false)
            expect(model.xAxis[0].labels.formatter.call({ value: 'X' })).toBe('formatted X')
        })

        it('keeps the existing heatmap X-axis formatter behavior', () => {
            const model = {
                chart: { type: 'heatmap' },
                xAxis: [{ labels: { formatterText } }],
                yAxis: []
            } as any

            expect(updateFormatters(model)).toBe(false)
            expect(model.xAxis[0].labels.formatter.call({ value: 'heatmap' })).toBe('formatted heatmap')
        })

        it('compiles Y-axis formatters on every configured X and Y axis', () => {
            const model = {
                chart: { type: 'line' },
                xAxis: [{ labels: { formatterText } }, { labels: { formatterText } }],
                yAxis: [{ labels: { formatterText } }, { labels: { formatterText } }]
            } as any

            expect(updateFormatters(model)).toBe(false)
            expect([...model.xAxis, ...model.yAxis].every((axis) => typeof axis.labels.formatter === 'function')).toBe(true)
        })

        it('propagates invalid axis formatter errors without skipping other axes', () => {
            const model = {
                chart: { type: 'line' },
                xAxis: [{ labels: { formatterText: 'function () {' } }],
                yAxis: [{ labels: { formatterText } }]
            } as any

            expect(updateFormatters(model)).toBe(true)
            expect(model.xAxis[0].labels.formatterError).toBeTruthy()
            expect(model.yAxis[0].labels.formatter.call({ value: 'Y' })).toBe('formatted Y')
        })

        it('gives format precedence over a valid formatter while preserving its editor text', () => {
            const model = {
                chart: { type: 'line' },
                xAxis: [{ labels: { format: 'Value: {value}', formatterText } }],
                yAxis: []
            } as any

            expect(updateFormatters(model)).toBe(false)
            expect(model.xAxis[0].labels.formatter).toBeUndefined()
            expect(model.xAxis[0].labels.formatterText).toBe(formatterText)
        })

        it('preserves variable placeholder replacement in axis formatter text', () => {
            const model = {
                chart: { type: 'line' },
                xAxis: [{ labels: { formatterText: 'function () { return "$V{axisPrefix}" + this.value }' } }],
                yAxis: []
            } as any

            expect(updateFormatters(model, [{ name: 'axisPrefix', type: 'string', value: 'Prefix: ' }])).toBe(false)
            expect(model.xAxis[0].labels.formatter.call({ value: 'X' })).toBe('Prefix: X')
        })
    })

    it('uses the same ellipsis configuration for 34, 40, and 45 character labels', () => {
        const categories = ['1234567890123456789012345678901234', '1234567890123456789012345678901234567890', '123456789012345678901234567890123456789012345']
        const model = createModel(categories)

        normalizeCategoryXAxisLabels(model)

        expect(model.xAxis[0].categories).toEqual(categories)
        expect(model.xAxis[0].labels.style.textOverflow).toBe('ellipsis')
        expect(model.xAxis[0].labels.autoRotation).toEqual([])
    })

    it('does not depend on word boundaries for labels with spaces or without spaces', () => {
        const categories = ['many short words that previously wrapped across multiple lines', 'averylongcategorylabelwithoutanyspacesorwordboundaries']
        const model = createModel(categories)

        normalizeCategoryXAxisLabels(model)

        expect(model.xAxis[0].categories).toEqual(categories)
        expect(model.xAxis[0].labels.style.textOverflow).toBe('ellipsis')
    })

    it('preserves an explicitly configured rotation', () => {
        const model = createModel(['A long category'], { rotation: -30, style: { color: '#123456' } })

        normalizeCategoryXAxisLabels(model)

        expect(model.xAxis[0].labels.rotation).toBe(-30)
        expect(model.xAxis[0].labels.autoRotation).toBeUndefined()
        expect(model.xAxis[0].labels.style).toEqual({ color: '#123456', textOverflow: 'ellipsis' })
    })

    it('adds full-label tooltips to the first and last category labels without duplicating them after resize', () => {
        const firstLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        const lastLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        const drilldownLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        const chart = {
            xAxis: [
                {
                    horiz: true,
                    options: { type: 'category' },
                    categories: ['First category with a very long label', 'Last category with a very long label'],
                    ticks: {
                        0: { pos: 0, label: { element: firstLabel } },
                        1: { pos: 1, label: { element: lastLabel } }
                    }
                },
                {
                    horiz: true,
                    options: { type: 'category' },
                    ticks: {
                        0: { pos: 0, label: { element: drilldownLabel, textStr: 'Drilldown category with a very long label' } }
                    }
                }
            ]
        } as any

        addCategoryXAxisLabelTooltips(chart)
        addCategoryXAxisLabelTooltips(chart)

        expect(getTitle(firstLabel)).toBe('First category with a very long label')
        expect(getTitle(lastLabel)).toBe('Last category with a very long label')
        expect(firstLabel.querySelectorAll('title')).toHaveLength(1)
        expect(lastLabel.querySelectorAll('title')).toHaveLength(1)
        expect(getTitle(drilldownLabel)).toBe('Drilldown category with a very long label')
    })

    it('keeps the ellipsis configuration and full-label tooltip after Highcharts resizes', () => {
        const categories = ['A category label long enough to require truncation', 'Another category label long enough to require truncation']
        const model = createModel(categories)
        const container = document.createElement('div')
        document.body.appendChild(container)

        normalizeCategoryXAxisLabels(model)

        const chart = Highcharts.chart(
            container,
            {
                chart: {
                    animation: false,
                    height: 240,
                    width: 360,
                    events: {
                        render() {
                            addCategoryXAxisLabelTooltips(this)
                        }
                    }
                },
                title: { text: '' },
                accessibility: { enabled: false },
                xAxis: model.xAxis,
                yAxis: [{ title: { text: '' } }],
                series: [{ type: 'line', data: [1, 2] }]
            } as any
        )

        chart.setSize(180, 240, false)

        expect(chart.xAxis[0].options.labels.style.width).toBeUndefined()
        expect(chart.xAxis[0].options.labels.style.textOverflow).toBe('ellipsis')
        expect(chart.xAxis[0].options.labels.overflow).toBe('justify')
        expect(getTitle(chart.xAxis[0].ticks[0].label.element)).toBe(categories[0])

        chart.destroy()
        container.remove()
    })
})

describe('axis plot bands and lines', () => {
    it('preserves numeric plot band boundaries after formatting variables', () => {
        const model = {
            chart: { type: 'column' },
            xAxis: [],
            yAxis: [{ plotBands: [{ from: 0, to: 5000 }], plotLines: [{ value: 2500 }] }]
        } as any

        formatVariables(model, [])

        expect(model.yAxis[0].plotBands[0]).toMatchObject({ from: 0, to: 5000 })
        expect(typeof model.yAxis[0].plotBands[0].from).toBe('number')
        expect(typeof model.yAxis[0].plotBands[0].to).toBe('number')
        expect(model.yAxis[0].plotLines[0].value).toBe(2500)
    })

    it('converts variable-derived plot band boundaries to numbers', () => {
        const model = {
            chart: { type: 'column' },
            xAxis: [],
            yAxis: [{ plotBands: [{ from: '$V{lowerBound}', to: '$V{upperBound}' }] }]
        } as any

        formatVariables(model, [
            { name: 'lowerBound', value: '0' },
            { name: 'upperBound', value: '5000' }
        ] as any)

        expect(model.yAxis[0].plotBands[0]).toMatchObject({ from: 0, to: 5000 })
    })
})
