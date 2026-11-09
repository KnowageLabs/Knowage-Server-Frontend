import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import HighchartsWidgetSettingsAccordionHeader from '../HighchartsWidgetSettingsAccordionHeader.vue'
import treemapDescriptor from '../descriptors/HighchartsTreemapSettingsDescriptor.json'

const { emit } = vi.hoisted(() => ({ emit: vi.fn() }))

vi.mock('@/modules/documentExecution/dashboard/DashboardHelpers', () => ({
    emitter: { on: vi.fn(), off: vi.fn(), emit }
}))

const QToggleStub = {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<button @click="$emit(\'update:modelValue\', !modelValue)">{{ modelValue }}</button>'
}

const mountHeader = async (series: Record<string, any>) => {
    const drilldownSetting = treemapDescriptor.settings.Interactions.find((setting) => setting.title === 'dashboard.widgetEditor.drilldown.title')!
    const widgetModel = {
        id: 'treemap-widget',
        settings: {
            chartModel: { model: { chart: { type: 'treemap' }, plotOptions: { series } } },
            interactions: { drilldown: { enabled: false } }
        }
    }

    const wrapper = shallowMount(HighchartsWidgetSettingsAccordionHeader, {
        props: { widgetModel: widgetModel as any, title: drilldownSetting.title, type: drilldownSetting.type },
        global: {
            mocks: { $t: (key: string) => key },
            stubs: { QItemSection: { template: '<div><slot /></div>' }, QToggle: QToggleStub }
        }
    })
    await nextTick()
    return wrapper
}

describe('treemap drilldown setting', () => {
    it('toggles native traversal and refreshes the chart without enabling dataset drilldown', async () => {
        const series = { allowTraversingTree: true }
        const wrapper = await mountHeader(series)
        const toggle = wrapper.findComponent(QToggleStub)
        emit.mockClear()

        await toggle.trigger('click')

        expect(series.allowTraversingTree).toBe(false)
        expect(wrapper.props('widgetModel').settings.interactions.drilldown.enabled).toBe(false)
        expect(emit).toHaveBeenCalledWith('refreshChart', { id: 'treemap-widget' })

        await toggle.trigger('click')
        expect(series.allowTraversingTree).toBe(true)
        wrapper.unmount()
    })

    it('shows existing charts as enabled and preserves an explicitly disabled setting', async () => {
        const legacyWrapper = await mountHeader({})
        expect(legacyWrapper.findComponent(QToggleStub).props('modelValue')).toBe(true)
        legacyWrapper.unmount()

        const disabledWrapper = await mountHeader({ allowTraversingTree: false })
        expect(disabledWrapper.findComponent(QToggleStub).props('modelValue')).toBe(false)
        disabledWrapper.unmount()
    })

    it('keeps the standard drilldown toggle bound to dataset interactions', async () => {
        const series = { allowTraversingTree: false }
        const wrapper = await mountHeader(series)
        await wrapper.setProps({ type: 'Drilldown' })

        await wrapper.findComponent(QToggleStub).trigger('click')

        expect(wrapper.props('widgetModel').settings.interactions.drilldown.enabled).toBe(true)
        expect(series.allowTraversingTree).toBe(false)
        wrapper.unmount()
    })
})
