import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RegistryGridCellEditor from '../RegistryGridCellEditor.vue'

const QSelectStub = defineComponent({
    name: 'QSelect',
    props: {
        modelValue: { type: null, default: null },
        options: { type: Array, default: () => [] },
        optionValue: { type: String, default: '' },
        optionLabel: { type: String, default: '' },
        emitValue: { type: Boolean, default: false },
        mapOptions: { type: Boolean, default: false },
        useInput: { type: Boolean, default: false },
        fillInput: { type: Boolean, default: false }
    },
    emits: ['update:model-value', 'filter', 'popup-show'],
    template: '<div data-test="registry-grid-cell-editor-select" />'
})

function createWrapper(comboColumnOptions: any, row = {}, value = 'ALPHA') {
    return mount(RegistryGridCellEditor, {
        props: {
            col: { field: 'status', editorType: 'COMBO', columnInfo: { type: 'string' } },
            row,
            value,
            comboColumnOptions
        },
        global: {
            stubs: {
                teleport: true,
                'q-select': QSelectStub,
                'q-btn': true
            }
        }
    })
}

describe('RegistryGridCellEditor', () => {
    it('normalizes combo options and removes duplicate values before passing them to q-select', async () => {
        const wrapper = createWrapper({
            status: {
                All: [{ column_1: 'ALPHA' }, { column_1: 'ALPHA' }, { column_1: 'BETA' }, { column_1: 0 }]
            }
        })

        await wrapper.vm.$nextTick()

        const select = wrapper.getComponent(QSelectStub)
        expect(select.props('optionValue')).toBe('value')
        expect(select.props('optionLabel')).toBe('label')
        expect(select.props('fillInput')).toBe(false)
        expect(select.props('options')).toEqual([
            { label: 'ALPHA', value: 'ALPHA' },
            { label: 'BETA', value: 'BETA' },
            { label: '0', value: 0 }
        ])
    })

    it('filters options by label and keeps the selected value visible', async () => {
        const wrapper = createWrapper({
            status: {
                All: [{ column_1: 'ALPHA' }, { column_1: 'BETA' }, { column_1: 'GAMMA' }]
            }
        })

        await wrapper.vm.$nextTick()

        wrapper.getComponent(QSelectStub).vm.$emit('filter', 'ga', (callback: () => void) => callback())
        await wrapper.vm.$nextTick()

        expect(wrapper.getComponent(QSelectStub).props('options')).toEqual([
            { label: 'ALPHA', value: 'ALPHA' },
            { label: 'GAMMA', value: 'GAMMA' }
        ])
    })
})
