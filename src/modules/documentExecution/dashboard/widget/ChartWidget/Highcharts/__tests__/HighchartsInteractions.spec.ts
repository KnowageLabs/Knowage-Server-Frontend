import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import Highcharts from 'highcharts/esm/highcharts.js'
import HighchartsContainer from '../HighchartsContainer.vue'
import { getWidgetData } from '../../../../DashboardDataProxy'

vi.mock('@/App.store', () => ({ default: () => ({ setError: vi.fn() }) }))
vi.mock('@/App.i18n', () => ({ default: { global: { t: (key: string) => key } } }))
vi.mock('../../../../Dashboard.store', () => ({ default: () => ({}) }))
vi.mock('../../../../DashboardDataProxy', () => ({ getWidgetData: vi.fn() }))
vi.mock('@/modules/documentExecution/dashboard/DashboardHelpers', () => ({ emitter: { on: vi.fn(), off: vi.fn(), emit: vi.fn() } }))
vi.mock('../../../interactionsHelpers/InteractionHelper', () => ({ updateStoreSelections: vi.fn(), executeChartCrossNavigation: vi.fn() }))
vi.mock('../../../interactionsHelpers/InteractionLinkHelper', () => ({ openNewLinkChartWidget: vi.fn() }))

const createController = (editorMode = false, selection = true) => {
    const controller = {
        editorMode,
        chartModel: { chart: { type: 'treemap' }, plotOptions: { series: {} } },
        widgetModel: { settings: { interactions: { selection: { enabled: selection }, drilldown: { enabled: false } } } },
        drillLevel: 0,
        interactionMenuVisible: false,
        interactionsMenuItems: [],
        menuPosition: { x: 0, y: 0 },
        $t: (key: string) => key,
        normalizeTreemapDataLabels: vi.fn(),
        alignWaterfallConnectors: vi.fn(),
        getNumberOfAttributeColumnsFromWidgetModel: () => 2,
        setSelection: vi.fn(),
        onDrillUp: vi.fn(),
        onCheckboxClicked: vi.fn()
    } as any
    const methods = HighchartsContainer.methods!
    for (const name of ['setSeriesEvents', 'configureTreemapInteractions', 'getTreemapDrilldownPoint', 'getActiveChartInteractions', 'createChartInteractionsMenuItems', 'executeSingleChartInteraction', 'executeDrilldown', 'executeInteractions', 'isSunburstRoot']) {
        controller[name] = methods[name].bind(controller)
    }
    controller.setSeriesEvents()
    return controller
}

const renderTreemap = (controller: any, allowTraversingTree = true) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const chart = Highcharts.chart(container, {
        chart: { ...controller.chartModel.chart, animation: false, width: 500, height: 300 },
        plotOptions: controller.chartModel.plotOptions,
        accessibility: { enabled: false },
        series: [
            {
                type: 'treemap',
                allowTraversingTree,
                allowDrillToNode: false,
                animation: false,
                dataLabels: { enabled: false },
                data: [
                    { id: 'group', name: 'Group' },
                    { id: 'a', name: 'A', parent: 'group', value: 1 },
                    { id: 'b', name: 'B', parent: 'group', value: 2 },
                    { id: 'other', name: 'Other' },
                    { id: 'c', name: 'C', parent: 'other', value: 3 }
                ]
            }
        ]
    } as any)
    const series = chart.series[0] as any
    const point = series.points.find((point: any) => point.id === 'group')
    return {
        series,
        point,
        click() {
            Highcharts.fireEvent(series, 'click', { point, clientX: 30, clientY: 40 })
        },
        destroy() {
            chart.destroy()
            container.remove()
        }
    }
}

describe('treemap interaction choice', () => {
    beforeEach(() => vi.clearAllMocks())

    it('opens the chooser before traversing and runs only the selected interaction', async () => {
        const controller = createController()
        const treemap = renderTreemap(controller)
        try {
            treemap.click()
            await flushPromises()

            expect(controller.interactionMenuVisible).toBe(true)
            expect(controller.menuPosition).toEqual({ x: 30, y: 40 })
            expect(controller.interactionsMenuItems.map((item: any) => item.label)).toEqual(['dashboard.widgetInteractions.drilldown', 'dashboard.widgetInteractions.selection'])
            expect(treemap.series.rootNode).toBe('')
            expect(controller.setSelection).not.toHaveBeenCalled()

            await controller.interactionsMenuItems[1].command()
            expect(controller.setSelection).toHaveBeenCalledOnce()
            expect(treemap.series.rootNode).toBe('')

            await controller.interactionsMenuItems[0].command()
            expect(treemap.series.rootNode).toBe('group')
            expect(getWidgetData).not.toHaveBeenCalled()
            treemap.series.drillUp()
            expect(treemap.series.rootNode).toBe('')
        } finally {
            treemap.destroy()
        }
    })

    it('traverses directly once when drilldown is the only interaction', async () => {
        const controller = createController(false, false)
        const treemap = renderTreemap(controller)
        const setRootNode = vi.spyOn(treemap.series, 'setRootNode')
        try {
            treemap.click()
            await flushPromises()

            expect(treemap.series.rootNode).toBe('group')
            expect(setRootNode).toHaveBeenCalledOnce()
            expect(controller.interactionMenuVisible).toBe(false)
            expect(getWidgetData).not.toHaveBeenCalled()
        } finally {
            treemap.destroy()
        }
    })

    it('selects directly when native drilldown is disabled', async () => {
        const controller = createController()
        const treemap = renderTreemap(controller, false)
        try {
            treemap.click()
            await flushPromises()

            expect(controller.setSelection).toHaveBeenCalledOnce()
            expect(controller.interactionMenuVisible).toBe(false)
            expect(treemap.series.rootNode).toBe('')
        } finally {
            treemap.destroy()
        }
    })

    it('preserves automatic native traversal in the widget editor', async () => {
        const controller = createController(true)
        const treemap = renderTreemap(controller)
        try {
            treemap.click()
            await flushPromises()

            expect(treemap.series.rootNode).toBe('group')
            expect(controller.interactionMenuVisible).toBe(false)
            expect(controller.setSelection).not.toHaveBeenCalled()
        } finally {
            treemap.destroy()
        }
    })

    it('keeps dataset drilldown detection for other chart types', () => {
        const controller = createController()
        controller.chartModel.chart.type = 'column'
        controller.widgetModel.settings.interactions.drilldown.enabled = true

        expect(controller.getActiveChartInteractions({ point: {} })).toEqual(['drilldown', 'selection'])
    })
})
