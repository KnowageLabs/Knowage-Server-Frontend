import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HighchartsAxisGridSettings from '../HighchartsAxisGridSettings.vue'

const WidgetEditorColorPickerStub = {
    name: 'WidgetEditorColorPicker',
    template: '<div />',
    props: ['initialValue', 'label']
}

const createWidgetModel = (chartType = 'line') => ({
    settings: {
        chartModel: {
            model: {
                chart: { type: chartType },
                xAxis: [{ gridLineColor: '', minorGridLineColor: '' }],
                yAxis: [{ gridLineColor: '', minorGridLineColor: '' }]
            }
        }
    }
})

const mountComponent = (widgetModel: any, props: { type: string; axis: string }) =>
    shallowMount(HighchartsAxisGridSettings, {
        props: { widgetModel, ...props },
        global: {
            stubs: {
                InputNumber: true,
                Dropdown: true,
                Button: true,
                WidgetEditorColorPicker: WidgetEditorColorPickerStub
            }
        }
    })

describe('HighchartsAxisGridSettings', () => {
    it('does not write a default major grid color into the model when the panel loads', () => {
        const widgetModel = createWidgetModel()
        const wrapper = mountComponent(widgetModel, { type: 'major', axis: 'x' })

        expect(widgetModel.settings.chartModel.model.xAxis[0].gridLineColor).toBe('')
        expect(wrapper.findComponent(WidgetEditorColorPickerStub).props('initialValue')).toBe('#000000')
    })

    it('updates the selected axis only after an explicit color change', () => {
        const widgetModel = createWidgetModel()
        const wrapper = mountComponent(widgetModel, { type: 'major', axis: 'x' })

        wrapper.vm.onSelectionColorChanged('rgba(1, 2, 3, 1)')

        expect(widgetModel.settings.chartModel.model.xAxis[0].gridLineColor).toBe('rgba(1, 2, 3, 1)')
        expect(widgetModel.settings.chartModel.model.yAxis[0].gridLineColor).toBe('')
    })

    it('keeps the bar chart axis mapping when editing y-axis grid settings', () => {
        const widgetModel = createWidgetModel('bar')
        const wrapper = mountComponent(widgetModel, { type: 'major', axis: 'y' })

        wrapper.vm.onSelectionColorChanged('rgba(9, 9, 9, 1)')

        expect(widgetModel.settings.chartModel.model.xAxis[0].gridLineColor).toBe('rgba(9, 9, 9, 1)')
        expect(widgetModel.settings.chartModel.model.yAxis[0].gridLineColor).toBe('')
    })
})
