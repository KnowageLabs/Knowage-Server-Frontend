import { describe, expect, it } from 'vitest'
import { KnowageHighcharts } from '../KnowageHighcharts'

describe('KnowageHighcharts custom formatters', () => {
    it.each(['formatter', 'pointFormatter', 'labelFormatter'])('makes Highcharts utilities available inside %s without a global namespace', (property) => {
        const chart = new KnowageHighcharts()
        const settings = { formatterText: 'function () { return this.name + ": " + Highcharts.numberFormat(this.y, 0, ",", ".") }' } as any

        expect(chart.updateFormatterSettings(settings, null, property, 'formatterText', 'formatterError', [])).toBe(false)
        expect(settings[property].call({ name: 'Sales', y: 1234.5 })).toBe('Sales: 1.235')
        expect(settings.formatterError).toBe('')
    })

    it('preserves variable substitution and the current tooltip point context', () => {
        const chart = new KnowageHighcharts()
        const settings = { formatterText: 'function () { return "$V{prefix}" + Highcharts.numberFormat(this.y, 0, ",", ".") + " (" + this.percentage.toFixed(2).replace(".", ",") + "%)" }' } as any

        chart.updateFormatterSettings(settings, null, 'formatter', 'formatterText', 'formatterError', [{ name: 'prefix', type: 'string', value: 'Sales: ' }] as any)

        expect(settings.formatter.call({ y: 1234.5, percentage: 25 })).toBe('Sales: 1.235 (25,00%)')
    })
})

describe('KnowageHighcharts drilldown styles', () => {
    it('keeps underline on drillable data labels without forcing a drilldown color', () => {
        const model = new KnowageHighcharts().getModel()

        expect(model.drilldown?.activeDataLabelStyle).toEqual({
            cursor: 'pointer',
            fontWeight: 'normal',
            textDecoration: 'underline'
        })
        expect(model.drilldown?.activeDataLabelStyle).not.toHaveProperty('color')
    })
})
