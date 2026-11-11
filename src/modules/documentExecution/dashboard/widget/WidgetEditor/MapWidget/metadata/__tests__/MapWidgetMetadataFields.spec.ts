import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import MapWidgetMetadataFields from '../MapWidgetMetadataFields.vue'
import WidgetEditorFilterForm from '../../../WidgetEditorDataTab/common/WidgetEditorFilterForm.vue'

vi.mock('@/modules/documentExecution/dashboard/DashboardHelpers', () => ({ emitter: { emit: vi.fn() } }))
vi.mock('@/components/UI/KnBlockly/KnBlockly.vue', () => ({ default: { template: '<div />' } }))

const mountFields = (layer: any) =>
    shallowMount(MapWidgetMetadataFields, {
        props: { propFields: layer.columns, selectedLayer: layer, propWidget: {} as any, variables: [] },
        global: {
            mocks: { $t: (key: string) => key },
            stubs: {
                'q-input': true,
                'q-select': true,
                'q-toggle': true,
                'q-btn': true,
                'q-tooltip': true,
                'q-slide-transition': { template: '<div><slot /></div>' }
            }
        }
    })

describe('map dataset field filter configuration', () => {
    it('expands enabled filters and preserves their settings when toggled off and back on', async () => {
        const layer = {
            type: 'dataset',
            columns: [
                { name: 'COUNTRY', fieldType: 'ATTRIBUTE', filter: { enabled: true, operator: 'IN', value: 'IT, FR' } },
                { name: 'SALES', fieldType: 'MEASURE' },
                { name: 'GEO', fieldType: 'SPATIAL_ATTRIBUTE' },
                { name: 'REMOVED', fieldType: 'ATTRIBUTE', deleted: true }
            ]
        } as any
        const wrapper = mountFields(layer)

        try {
            const forms = wrapper.findAllComponents(WidgetEditorFilterForm)
            expect(forms).toHaveLength(1)
            expect(forms[0].props('propColumn')?.filter).toEqual({ enabled: true, operator: 'IN', value: 'IT, FR' })
            expect(forms[0].props('showHeader')).toBe(false)
            const toggles = wrapper.findAllComponents('[data-test="field-filter-toggle"]')
            expect(toggles).toHaveLength(2)
            toggles[1].vm.$emit('update:modelValue', true)
            await wrapper.vm.$nextTick()
            const measureForm = wrapper.findAllComponents(WidgetEditorFilterForm)[1]
            const measure = measureForm.props('propColumn')!
            measure.filter = { enabled: true, operator: '>=', value: '100' }
            vi.mocked(emitter.emit).mockClear()
            measureForm.vm.$emit('filterChanged', measure)

            expect(layer.columns[1].filter).toEqual({ enabled: true, operator: '>=', value: '100' })
            expect(emitter.emit).toHaveBeenCalledWith('mapFieldsUpdated')
            toggles[1].vm.$emit('update:modelValue', false)
            await wrapper.vm.$nextTick()
            expect(wrapper.findAllComponents(WidgetEditorFilterForm)).toHaveLength(1)
            expect(layer.columns[1].filter).toEqual({ enabled: false, operator: '>=', value: '100' })
            toggles[1].vm.$emit('update:modelValue', true)
            await wrapper.vm.$nextTick()
            expect(wrapper.findAllComponents(WidgetEditorFilterForm)[1].props('propColumn')?.filter).toEqual({ enabled: true, operator: '>=', value: '100' })
        } finally {
            wrapper.unmount()
        }
    })

    it('does not expose dataset field filters for catalog layers', () => {
        const layer = { type: 'layer', columns: [{ name: 'NAME', fieldType: 'ATTRIBUTE' }] }
        const wrapper = mountFields(layer)

        try {
            expect(wrapper.findComponent(WidgetEditorFilterForm).exists()).toBe(false)
        } finally {
            wrapper.unmount()
        }
    })
})
