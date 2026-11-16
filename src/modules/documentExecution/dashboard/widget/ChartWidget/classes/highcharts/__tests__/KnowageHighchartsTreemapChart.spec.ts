import { describe, expect, it } from 'vitest'
import { KnowageHighchartsTreemapChart } from '../KnowageHighchartsTreemapChart'

describe('KnowageHighchartsTreemapChart', () => {
    it('keeps drilldown disabled when reopening a saved chart', () => {
        const savedModel = new KnowageHighchartsTreemapChart(null).model
        savedModel.plotOptions.series.allowTraversingTree = false
        const chart = new KnowageHighchartsTreemapChart(savedModel)
        const serie = chart.createSerieElement({ column: { columnName: 'Sales' } }, false)

        expect(serie.allowTraversingTree).toBe(false)
        expect(serie.allowDrillToNode).toBe(false)
    })

    it('allows disabling and re-enabling native drilldown', () => {
        const chart = new KnowageHighchartsTreemapChart(null)
        chart.model.plotOptions.series.allowTraversingTree = false
        expect(chart.createSerieElement({ column: { columnName: 'Sales' } }, false).allowTraversingTree).toBe(false)

        chart.model.plotOptions.series.allowTraversingTree = true
        const serie = chart.createSerieElement({ column: { columnName: 'Sales' } }, false)
        expect(serie.allowTraversingTree).toBe(true)
        expect(serie.allowDrillToNode).toBe(true)
    })

    it('preserves native drilldown for existing charts without the setting', () => {
        const savedModel = new KnowageHighchartsTreemapChart(null).model
        delete savedModel.plotOptions.series.allowTraversingTree
        const chart = new KnowageHighchartsTreemapChart(savedModel)

        expect(chart.createSerieElement({ column: { columnName: 'Sales' } }, false).allowTraversingTree).toBe(true)
    })

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

    it('keeps configured fonts while distinguishing group headers from tile labels', () => {
        const chart = new KnowageHighchartsTreemapChart(null)
        const serie = chart.createSerieElement({ column: { columnName: 'Sales' } }, false)
        serie.data = [
            { id: 'group', name: 'Group' },
            { id: 'leaf', parent: 'group', name: 'A long category name', value: 10 }
        ]
        chart.model.series = [serie]
        chart.updateSeriesLabelSettings({
            settings: {
                series: {
                    seriesSettings: [{ label: { enabled: true, style: { fontSize: '18px', fontFamily: 'Arial', fontWeight: '' } } }]
                }
            }
        } as any)

        expect(serie.data[0].dataLabels).toMatchObject({
            align: 'left',
            style: { fontSize: '18px', fontFamily: 'Arial', fontWeight: 'bold', whiteSpace: 'nowrap', lineClamp: 1 }
        })
        expect(serie.data[1].dataLabels).toMatchObject({
            align: 'center',
            style: { fontSize: '18px', fontFamily: 'Arial', fontWeight: 'normal', whiteSpace: 'normal', lineClamp: 2 }
        })
    })
})
