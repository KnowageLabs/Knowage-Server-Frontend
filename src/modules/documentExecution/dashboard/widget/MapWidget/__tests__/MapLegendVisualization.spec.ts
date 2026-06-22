import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MapLegendVisualization from '../legend/MapLegendVisualization.vue'

describe('MapLegendVisualization', () => {
    it('refreshes legend values when legend data changes for the same visualization', async () => {
        const legendVisualization = {
            visualizationType: {
                id: 'viz-1',
                type: 'choropleth'
            },
            text: ''
        } as any

        const wrapper = shallowMount(MapLegendVisualization, {
            props: {
                propMapWidgetLegendVisualization: legendVisualization,
                legendData: {
                    'viz-1': {
                        min: 10,
                        max: 20
                    }
                }
            }
        })

        expect((wrapper.vm as any).layerLegendData).toEqual({ min: 10, max: 20 })

        await wrapper.setProps({
            legendData: {
                'viz-1': {
                    min: 100,
                    max: 200
                }
            }
        })

        expect((wrapper.vm as any).layerLegendData).toEqual({ min: 100, max: 200 })
    })

    it('clears stale legend values when the current visualization has no legend data', async () => {
        const wrapper = shallowMount(MapLegendVisualization, {
            props: {
                propMapWidgetLegendVisualization: {
                    visualizationType: {
                        id: 'viz-1',
                        type: 'choropleth'
                    },
                    text: ''
                } as any,
                legendData: {
                    'viz-1': {
                        min: 10,
                        max: 20
                    }
                }
            }
        })

        await wrapper.setProps({ legendData: {} })

        expect((wrapper.vm as any).layerLegendData).toBeNull()
    })
})
