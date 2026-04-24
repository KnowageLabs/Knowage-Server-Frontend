import { describe, expect, it } from 'vitest'
import { KnowageHighchartsBarChart } from '../KnowageHighchartsBarChart'
import { normalizeYAxisLabelsAlignment } from '../../../Highcharts/HighchartsModelFormattingHelpers'

describe('KnowageHighchartsBarChart backward compatibility', () => {
    it.each(['area', 'bar', 'column'] as const)('removes the legacy -12 x-axis offset when rehydrating saved %s models', (type) => {
        const savedModel = new KnowageHighchartsBarChart(null, type, false).getModel()
        savedModel.xAxis[0].labels.x = -12

        const rehydratedModel = new KnowageHighchartsBarChart(savedModel, type, false).getModel()

        expect(rehydratedModel.xAxis[0].labels.x).toBeUndefined()
    })

    it('lets saved bar charts pick up the current left-alignment normalization once the legacy offset is removed', () => {
        const savedModel = new KnowageHighchartsBarChart(null, 'bar', false).getModel()
        savedModel.xAxis[0].labels.align = 'left'
        savedModel.xAxis[0].labels.x = -12

        const rehydratedModel = new KnowageHighchartsBarChart(savedModel, 'bar', false).getModel()
        normalizeYAxisLabelsAlignment(rehydratedModel)

        expect(rehydratedModel.xAxis[0].labels.x).toBe(-80)
        expect((rehydratedModel.chart as any).marginLeft).toBe(80)
    })

    it('preserves custom negative offsets that do not match the legacy default', () => {
        const savedModel = new KnowageHighchartsBarChart(null, 'bar', false).getModel()
        savedModel.xAxis[0].labels.align = 'left'
        savedModel.xAxis[0].labels.x = -20

        const rehydratedModel = new KnowageHighchartsBarChart(savedModel, 'bar', false).getModel()
        normalizeYAxisLabelsAlignment(rehydratedModel)

        expect(rehydratedModel.xAxis[0].labels.x).toBe(-20)
    })
})
