import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import Highcharts from 'highcharts/esm/highcharts.js'
import HighchartsContainer from '../HighchartsContainer.vue'
import { getWidgetData } from '../../../../DashboardDataProxy'
import { updateStoreSelections } from '../../../interactionsHelpers/InteractionHelper'

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

    it.each([false, true])('selects the clicked node attribute with native drilldown %s', async (drilldown) => {
        const controller = createController()
        controller.widgetModel.dataset = 1
        controller.widgetModel.columns = [
            { columnName: 'Sales', fieldType: 'MEASURE' },
            { columnName: 'PRODUCT_FAMILY', fieldType: 'ATTRIBUTE' },
            { columnName: 'PRODUCT_CATEGORY', fieldType: 'ATTRIBUTE' }
        ]
        controller.getDatasetLabel = () => 'Products'
        controller.propActiveSelections = []
        controller.dashboardId = 'dashboard'
        controller.setSelections = vi.fn()
        controller.$http = {}
        controller.setSelection = HighchartsContainer.methods!.setSelection.bind(controller)
        controller.createNewSelection = HighchartsContainer.methods!.createNewSelection.bind(controller)
        const treemap = renderTreemap(controller)
        try {
            if (drilldown) {
                treemap.click()
                await flushPromises()
                await controller.interactionsMenuItems[0].command()
                expect(treemap.series.rootNode).toBe('group')
            }

            const point = treemap.series.points.find((point: any) => point.id === 'a')
            await controller.executeInteractions({ point })

            expect(updateStoreSelections).toHaveBeenLastCalledWith(
                expect.objectContaining({ datasetId: 1, columnName: 'PRODUCT_CATEGORY', value: ['A'] }),
                controller.propActiveSelections,
                controller.dashboardId,
                controller.setSelections,
                controller.$http
            )

            if (drilldown) treemap.series.drillUp()
            treemap.click()
            await flushPromises()
            await controller.interactionsMenuItems[1].command()

            expect(updateStoreSelections).toHaveBeenLastCalledWith(
                expect.objectContaining({ datasetId: 1, columnName: 'PRODUCT_FAMILY', value: ['Group'] }),
                controller.propActiveSelections,
                controller.dashboardId,
                controller.setSelections,
                controller.$http
            )
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

    it('hides unreadable labels before drawing and restores them when tiles grow', () => {
        const treemap = renderTreemap(createController())
        try {
            treemap.series.update({ dataLabels: { enabled: true, style: { fontSize: '13px' } } })
            treemap.series.setData([
                { id: 'group', name: 'Group' },
                { id: 'a', name: 'A very long category label', parent: 'group', value: 1 },
                { id: 'b', name: 'B', parent: 'group', value: 10000 }
            ])
            const smallPoint = treemap.series.points.find((point: any) => point.id === 'a')
            expect(smallPoint.dlOptions.enabled).toBe(false)

            treemap.series.setData([
                { id: 'group', name: 'Group' },
                { id: 'a', name: 'A very long category label', parent: 'group', value: 10000 },
                { id: 'b', name: 'B', parent: 'group', value: 10000 }
            ])
            const largerPoint = treemap.series.points.find((point: any) => point.id === 'a')
            expect(largerPoint.dataLabel.options.enabled).toBe(true)
            expect(largerPoint.dataLabel.options.style).toMatchObject({ whiteSpace: 'normal', textOverflow: 'ellipsis', lineClamp: 2 })
        } finally {
            treemap.destroy()
        }
    })

    it('contrasts treemap labels against their own background when configured', () => {
        const label = { options: { backgroundColor: '#ffffff' }, css: vi.fn() }
        const chart = {
            options: { chart: { type: 'treemap' } },
            renderer: { getContrast: (color: string) => color === '#ffffff' ? '#000000' : '#ffffff' },
            series: [{ points: [{ color: '#000000', dataLabel: label }] }]
        }

        HighchartsContainer.methods!.normalizeTreemapDataLabels(chart)
        expect(label.css).toHaveBeenLastCalledWith({ color: '#000000', textOutline: 'none' })

        label.options.backgroundColor = 'transparent'
        HighchartsContainer.methods!.normalizeTreemapDataLabels(chart)
        expect(label.css).toHaveBeenLastCalledWith({ color: '#ffffff', textOutline: 'none' })
    })
})
