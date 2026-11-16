import { describe, expect, it, vi } from 'vitest'
import { fitTreemapDataLabels } from '../HighchartsTreemapHelpers'

const createSeries = (width: number, height: number, fontSize = '13px') => ({
    type: 'treemap',
    options: { dataLabels: { padding: 5, style: { fontSize } } },
    chart: { renderer: { fontMetrics: vi.fn((size: number) => ({ h: size + 3 })) } },
    points: [
        {
            node: { isLeaf: true },
            shapeArgs: { width, height },
            dlOptions: { enabled: true, headers: false, style: {} } as any
        }
    ]
})

describe('treemap label layout', () => {
    it('uses only one line in a short tile and two when there is enough room', () => {
        const series = createSeries(120, 30)
        fitTreemapDataLabels(series)
        expect(series.points[0].dlOptions.style).toMatchObject({ width: '110px', lineClamp: 1 })
        expect(series.points[0].dlOptions.enabled).toBe(true)

        series.points[0].shapeArgs.height = 100
        fitTreemapDataLabels(series)
        expect(series.points[0].dlOptions.style).toMatchObject({ lineClamp: 2, whiteSpace: 'normal', textOverflow: 'ellipsis' })
    })

    it.each([[35, 100], [100, 20]])('hides labels in tiles too small to read (%s x %s)', (width, height) => {
        const series = createSeries(width, height)
        fitTreemapDataLabels(series)
        expect(series.points[0].dlOptions.enabled).toBe(false)

        series.points[0].shapeArgs = { width: 120, height: 80 }
        series.points[0].dlOptions = { enabled: true, style: {} }
        fitTreemapDataLabels(series)
        expect(series.points[0].dlOptions.enabled).toBe(true)
    })

    it('keeps headers on one line and measures the configured font size', () => {
        const series = createSeries(200, 80, '24px')
        series.points[0].node.isLeaf = false
        series.points[0].dlOptions.headers = true
        fitTreemapDataLabels(series)
        expect(series.points[0].dlOptions.style).toMatchObject({ fontSize: '24px', whiteSpace: 'nowrap', lineClamp: 1 })
        expect(series.chart.renderer.fontMetrics).toHaveBeenLastCalledWith(24)

        series.points[0].shapeArgs.height = 30
        fitTreemapDataLabels(series)
        expect(series.points[0].dlOptions.enabled).toBe(false)
    })

    it('does not re-enable disabled labels or alter other chart types', () => {
        const series = createSeries(200, 80)
        series.points[0].dlOptions.enabled = false
        fitTreemapDataLabels(series)
        expect(series.points[0].dlOptions.enabled).toBe(false)

        series.type = 'column'
        series.points[0].dlOptions = { enabled: true, style: {} }
        fitTreemapDataLabels(series)
        expect(series.points[0].dlOptions).toEqual({ enabled: true, style: {} })
    })
})
