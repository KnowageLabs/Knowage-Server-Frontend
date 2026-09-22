import { describe, expect, it } from 'vitest'
import { KnowageHighchartsTreemapChart } from '../KnowageHighchartsTreemapChart'

describe('KnowageHighchartsTreemapChart', () => {
    it('renders first-level groups as labeled headers', () => {
        const chart = new KnowageHighchartsTreemapChart(null)
        const serie = chart.createSerieElement({ column: { columnName: 'Sales' } }, false)
        const groupLevel = serie.levels.find((level) => level.level === 1)

        expect(serie.levels.filter((level) => level.level === 1)).toHaveLength(1)
        expect(groupLevel?.dataLabels).toMatchObject({
            enabled: true,
            headers: true,
            format: '{point.name}',
            style: {
                color: 'contrast',
                textOutline: 'none'
            }
        })
        expect(serie.dataLabels).toMatchObject({
            format: '{point.name}',
            style: {
                color: 'contrast',
                textOutline: 'none'
            }
        })
    })
})
