import { describe, expect, it } from 'vitest'
import { KnowageHighcharts } from '../KnowageHighcharts'

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
