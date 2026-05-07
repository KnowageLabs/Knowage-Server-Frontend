import { describe, expect, it } from 'vitest'
import { getMapDataFieldDataIndex, getMapDataFieldName } from '../MapDataFieldHelper'

describe('MapDataFieldHelper', () => {
    const data = {
        metaData: {
            fields: [
                { name: 'STATE_ABBR', header: 'State Abbreviation', dataIndex: 'column_1' },
                { name: 'sales', header: 'Sales', dataIndex: 'column_2' }
            ]
        }
    }

    it('resolves map data fields from the field name used by legacy widgets', () => {
        expect(getMapDataFieldName('sales', data)).toBe('sales')
        expect(getMapDataFieldDataIndex('sales', data)).toBe('column_2')
    })

    it('resolves map data fields from the display header used by newer widgets', () => {
        expect(getMapDataFieldName('Sales', data)).toBe('sales')
        expect(getMapDataFieldDataIndex('Sales', data)).toBe('column_2')
    })

    it('resolves map data fields when the internal dataIndex is already stored', () => {
        expect(getMapDataFieldName('column_2', data)).toBe('sales')
        expect(getMapDataFieldDataIndex('column_2', data)).toBe('column_2')
    })
})
