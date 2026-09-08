import { describe, expect, it } from 'vitest'
import Highcharts from 'highcharts'
import { addCategoryXAxisLabelTooltips, normalizeCategoryXAxisLabels } from '../HighchartsModelFormattingHelpers'

const createModel = (categories: string[], labels: Record<string, any> = {}) =>
    ({
        chart: { type: 'line' },
        xAxis: [{ type: 'category', categories, labels }],
        yAxis: [],
        tooltip: {}
    }) as any

const getTitle = (element: SVGTextElement) => element.querySelector('title')?.textContent

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
