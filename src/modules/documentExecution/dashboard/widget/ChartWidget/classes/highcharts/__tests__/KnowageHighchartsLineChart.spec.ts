import { describe, expect, it } from 'vitest'
import { KnowageHighchartsLineChart } from '../KnowageHighchartsLineChart'

const createLegacyLineChartTemplate = (axisOverrides?: { xAxis?: Record<string, any>; yAxis?: Record<string, any> }) => ({
    CHART: {
        type: 'LINE',
        AXES_LIST: {
            AXIS: [{ ...(axisOverrides?.yAxis ?? {}) }, { ...(axisOverrides?.xAxis ?? {}) }]
        },
        VALUES: { SERIE: [] }
    }
})

describe('KnowageHighchartsLineChart backward compatibility', () => {
    it('keeps legacy axis min and max on auto when they are not configured', () => {
        const migratedModel = new KnowageHighchartsLineChart(createLegacyLineChartTemplate()).getModel()

        expect(migratedModel.xAxis[0].min).toBeNull()
        expect(migratedModel.xAxis[0].max).toBeNull()
        expect(migratedModel.yAxis[0].min).toBeNull()
        expect(migratedModel.yAxis[0].max).toBeNull()
    })

    it('maps explicit legacy auto axis values back to auto in the dashboard model', () => {
        const migratedModel = new KnowageHighchartsLineChart(
            createLegacyLineChartTemplate({
                xAxis: { min: 'auto', max: 'auto' },
                yAxis: { min: 'auto', max: 'auto' }
            })
        ).getModel()

        expect(migratedModel.xAxis[0].min).toBeNull()
        expect(migratedModel.xAxis[0].max).toBeNull()
        expect((migratedModel.xAxis[0] as any).legacyAutoMin).toBe(true)
        expect((migratedModel.xAxis[0] as any).legacyAutoMax).toBe(true)
        expect(migratedModel.yAxis[0].min).toBeNull()
        expect(migratedModel.yAxis[0].max).toBeNull()
        expect((migratedModel.yAxis[0] as any).legacyAutoMin).toBe(true)
        expect((migratedModel.yAxis[0] as any).legacyAutoMax).toBe(true)
    })

    it('does not keep legacy auto tick intervals as fixed dashboard intervals', () => {
        const migratedModel = new KnowageHighchartsLineChart(
            createLegacyLineChartTemplate({
                yAxis: {
                    MAJORGRID: { interval: 'auto', style: {} },
                    MINORGRID: { interval: 'auto', style: {} }
                }
            })
        ).getModel()

        expect(migratedModel.yAxis[0].tickInterval).toBeNull()
        expect(migratedModel.yAxis[0].minorTickInterval).toBe('auto')
    })

    it('preserves explicit legacy axis min and max values, including zero', () => {
        const migratedModel = new KnowageHighchartsLineChart(
            createLegacyLineChartTemplate({
                xAxis: { min: 0, max: 11 },
                yAxis: { min: 0, max: 100 }
            })
        ).getModel()

        expect(migratedModel.xAxis[0].min).toBe(0)
        expect(migratedModel.xAxis[0].max).toBe(11)
        expect(migratedModel.yAxis[0].min).toBe(0)
        expect(migratedModel.yAxis[0].max).toBe(100)
    })
})
