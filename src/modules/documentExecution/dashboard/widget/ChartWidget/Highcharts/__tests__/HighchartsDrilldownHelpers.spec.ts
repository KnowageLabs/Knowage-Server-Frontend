import { describe, expect, it } from 'vitest'
import { getDrilldownDataLabelColor, isDataLabelInsideGraphic } from '../HighchartsDrilldownHelpers'

const getContrast = (backgroundColor: string) => `contrast:${backgroundColor}`

describe('HighchartsDrilldownHelpers', () => {
    it('preserves an explicit configured data label color', () => {
        const color = getDrilldownDataLabelColor({
            chartBackgroundColor: '#ffffff',
            configuredColor: '#111111',
            getContrast,
            point: {
                contrastColor: '#ffffff',
                dataLabel: { options: { inside: true } }
            }
        })

        expect(color).toBe('#111111')
    })

    it('uses the label background color as the contrast source when configured', () => {
        const color = getDrilldownDataLabelColor({
            chartBackgroundColor: '#ffffff',
            configuredColor: 'contrast',
            configuredDataLabels: { backgroundColor: '#ffcc00' },
            getContrast,
            point: {}
        })

        expect(color).toBe('contrast:#ffcc00')
    })

    it('uses the runtime Highcharts contrast color when the data label is inside the bar', () => {
        const color = getDrilldownDataLabelColor({
            chartBackgroundColor: '#ffffff',
            configuredColor: 'contrast',
            getContrast,
            point: {
                contrastColor: '#fefefe',
                dataLabel: { options: { inside: true } }
            }
        })

        expect(color).toBe('#fefefe')
    })

    it('falls back to the chart background contrast when the data label stays outside the bar', () => {
        const color = getDrilldownDataLabelColor({
            chartBackgroundColor: '#ffffff',
            configuredColor: 'contrast',
            getContrast,
            point: {
                color: '#003366',
                contrastColor: '#fefefe',
                dataLabel: { options: { inside: false } }
            }
        })

        expect(color).toBe('contrast:#ffffff')
    })

    it('uses geometric overlap as a fallback when Highcharts does not expose the inside flag', () => {
        const point = {
            color: '#003366',
            dataLabel: {
                getBBox: () => ({ x: 40, y: 2, width: 50, height: 16 })
            },
            graphic: {
                getBBox: () => ({ x: 0, y: 0, width: 100, height: 20 })
            }
        }

        expect(isDataLabelInsideGraphic(point)).toBe(true)
        expect(
            getDrilldownDataLabelColor({
                chartBackgroundColor: '#ffffff',
                configuredColor: 'contrast',
                getContrast,
                point
            })
        ).toBe('contrast:#003366')
    })
})
