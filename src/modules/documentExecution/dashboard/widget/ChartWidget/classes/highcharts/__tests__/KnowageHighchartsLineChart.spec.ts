import { describe, expect, it } from 'vitest'
import { KnowageHighchartsLineChart } from '../KnowageHighchartsLineChart'
import { applyLegacyCockpitAutoAxisExtremes } from '../../../Highcharts/HighchartsModelFormattingHelpers'

const createLegacyLineChartTemplate = () => ({
    CHART: {
        type: 'LINE',
        AXES_LIST: {
            AXIS: [{ min: 'auto', max: 'auto' }, { min: 'auto', max: 'auto' }]
        },
        VALUES: { SERIE: [] }
    }
})

describe('KnowageHighchartsLineChart backward compatibility', () => {
    it('reproduces cockpit auto y-axis padding for legacy auto extremes', () => {
        const migratedModel = new KnowageHighchartsLineChart(createLegacyLineChartTemplate()).getModel()
        migratedModel.series = [{ data: [{ y: 6493.8602 }, { y: 9438.144 }] }] as any

        applyLegacyCockpitAutoAxisExtremes(migratedModel)

        expect(migratedModel.yAxis[0].min).toBeCloseTo(3246.9301)
        expect(migratedModel.yAxis[0].max).toBeCloseTo(10381.9584)
    })
})
