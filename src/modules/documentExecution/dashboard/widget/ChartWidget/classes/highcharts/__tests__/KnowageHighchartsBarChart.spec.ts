import { describe, expect, it } from 'vitest'
import { KnowageHighchartsBarChart } from '../KnowageHighchartsBarChart'
import { normalizeYAxisLabelsAlignment } from '../../../Highcharts/HighchartsModelFormattingHelpers'

const createLegacyBarChartTemplate = () => ({
    CHART: {
        type: 'BAR',
        orientation: 'horizontal',
        AXES_LIST: {
            AXIS: [{ style: { align: 'right' } }, { style: { align: 'left' } }]
        },
        VALUES: { SERIE: [] }
    }
})

describe('KnowageHighchartsBarChart backward compatibility', () => {
    it('preserves the standard -12 gap when bar models are rehydrated', () => {
        const savedModel = new KnowageHighchartsBarChart(null, 'bar', false).getModel()
        savedModel.xAxis[0].labels.x = -12

        const rehydratedModel = new KnowageHighchartsBarChart(savedModel, 'bar', false).getModel()

        expect(rehydratedModel.xAxis[0].labels.x).toBe(-12)
    })

    it('restores the standard gap for saved bar models that still have the old zero offset', () => {
        const savedModel = new KnowageHighchartsBarChart(null, 'bar', false).getModel()
        savedModel.xAxis[0].labels.x = 0

        normalizeYAxisLabelsAlignment(savedModel)

        expect(savedModel.xAxis[0].labels.x).toBe(-12)
        expect((savedModel.chart as any).marginLeft).toBeUndefined()
    })

    it('applies a wider computed offset only when bar labels are explicitly left-aligned', () => {
        const savedModel = new KnowageHighchartsBarChart(null, 'bar', false).getModel()
        savedModel.xAxis[0].labels.align = 'left'
        savedModel.xAxis[0].labels.style.fontSize = '10px'
        savedModel.xAxis[0].categories = ['12345678901234567890']
        savedModel.xAxis[0].labels.x = -12

        normalizeYAxisLabelsAlignment(savedModel)

        expect(savedModel.xAxis[0].labels.x).toBe(-122)
        expect((savedModel.chart as any).marginLeft).toBe(122)
    })

    it('preserves custom negative offsets for explicit left alignment', () => {
        const savedModel = new KnowageHighchartsBarChart(null, 'bar', false).getModel()
        savedModel.xAxis[0].labels.align = 'left'
        savedModel.xAxis[0].labels.x = -20

        normalizeYAxisLabelsAlignment(savedModel)

        expect(savedModel.xAxis[0].labels.x).toBe(-20)
    })

    it('applies the same computed left alignment offset to legacy CHART migrations', () => {
        const rehydratedModel = new KnowageHighchartsBarChart(createLegacyBarChartTemplate(), 'bar', false).getModel()
        rehydratedModel.xAxis[0].labels.style.fontSize = '10px'
        rehydratedModel.xAxis[0].categories = ['12345678901234567890']

        normalizeYAxisLabelsAlignment(rehydratedModel)

        expect(rehydratedModel.xAxis[0].labels.align).toBe('left')
        expect(rehydratedModel.xAxis[0].labels.x).toBe(-122)
        expect((rehydratedModel.chart as any).marginLeft).toBe(122)
    })
})
