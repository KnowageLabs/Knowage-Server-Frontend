import { describe, expect, it } from 'vitest'
import RegistryCellEditor from './RegistryCellEditor.vue'

describe('RegistryCellEditor', () => {
    it('normalizes dropdown options to label/value pairs and removes duplicates', () => {
        const normalized = RegistryCellEditor.methods.normalizeDropdownOptions([
            { column_1: 'ALPHA' },
            { column_1: 'ALPHA' },
            { column_1: 'BETA' },
            { column_1: 0 }
        ])

        expect(normalized).toEqual([
            { label: 'ALPHA', value: 'ALPHA' },
            { label: 'BETA', value: 'BETA' },
            { label: '0', value: 0 }
        ])
    })

    it('returns normalized All options when the dependent set is empty', () => {
        const options = RegistryCellEditor.methods.getOptions.call(
            {
                columnOptions: {
                    status: {
                        All: [{ column_1: 'ALPHA' }, { column_1: 'ALPHA' }, { column_1: 'BETA' }]
                    }
                },
                normalizeDropdownOptions: RegistryCellEditor.methods.normalizeDropdownOptions
            },
            { field: 'status', dependences: 'type' },
            {}
        )

        expect(options).toEqual([
            { label: 'ALPHA', value: 'ALPHA' },
            { label: 'BETA', value: 'BETA' }
        ])
    })
})
