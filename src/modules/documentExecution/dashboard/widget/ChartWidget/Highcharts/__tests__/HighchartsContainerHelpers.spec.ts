import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyAdvancedSettingsToModelForRender } from '../HighchartsContainerHelpers'

const { showDashboardWidgetError } = vi.hoisted(() => ({
    showDashboardWidgetError: vi.fn()
}))

vi.mock('@/modules/documentExecution/dashboard/helpers/DashboardToastHelper', () => ({
    showDashboardWidgetError
}))

const createModel = () => ({
    xAxis: [{ labels: { style: {} } }, { labels: { style: {} } }],
    yAxis: [{ labels: { style: {} } }, { labels: { style: {} } }]
})

describe('applyAdvancedSettingsToModelForRender', () => {
    beforeEach(() => {
        showDashboardWidgetError.mockReset()
    })

    it('maps unindexed X-axis paths to the first axis and preserves string values', () => {
        const model = createModel()

        applyAdvancedSettingsToModelForRender(model, [
            { propertyPath: 'xAxis.labels.style.width', propertyValue: '25px' },
            { propertyPath: 'xAxis.labels.style.textOverflow', propertyValue: 'ellipsis' },
            { propertyPath: 'xAxis.labels.style.whiteSpace', propertyValue: 'nowrap' }
        ])

        expect(model.xAxis[0].labels.style).toEqual({
            width: '25px',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        })
        expect((model.xAxis as any).labels).toBeUndefined()
    })

    it('applies indexed paths to the requested X and Y axes', () => {
        const model = createModel()

        applyAdvancedSettingsToModelForRender(model, [
            { propertyPath: 'xAxis[1].labels.style.textOverflow', propertyValue: 'ellipsis' },
            { propertyPath: 'yAxis[1].labels.style.width', propertyValue: '25px' }
        ])

        expect(model.xAxis[1].labels.style.textOverflow).toBe('ellipsis')
        expect(model.yAxis[1].labels.style.width).toBe('25px')
        expect(model.xAxis[0].labels.style.textOverflow).toBeUndefined()
        expect(model.yAxis[0].labels.style.width).toBeUndefined()
    })

    it('maps unindexed Y-axis paths to the first axis', () => {
        const model = createModel()

        applyAdvancedSettingsToModelForRender(model, [{ propertyPath: 'yAxis.labels.style.textOverflow', propertyValue: 'ellipsis' }])

        expect(model.yAxis[0].labels.style.textOverflow).toBe('ellipsis')
        expect((model.yAxis as any).labels).toBeUndefined()
    })

    it('reports invalid and out-of-bounds paths without creating ineffective properties', () => {
        const model = createModel()

        applyAdvancedSettingsToModelForRender(model, [
            { propertyPath: 'xAxis[2].labels.style.width', propertyValue: '25px' },
            { propertyPath: 'yAxis.labels.missing.value', propertyValue: 'invalid' }
        ])

        expect(showDashboardWidgetError).toHaveBeenCalledTimes(2)
        expect(showDashboardWidgetError).toHaveBeenCalledWith(undefined, expect.stringContaining('xAxis[2].labels.style.width'))
        expect(showDashboardWidgetError).toHaveBeenCalledWith(undefined, expect.stringContaining('yAxis.labels.missing.value'))
        expect(model.xAxis).toHaveLength(2)
        expect(model.yAxis[0].labels).not.toHaveProperty('missing')
    })
})
