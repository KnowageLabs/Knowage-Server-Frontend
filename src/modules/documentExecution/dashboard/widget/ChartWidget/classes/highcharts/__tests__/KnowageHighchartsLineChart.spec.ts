import { describe, expect, it } from 'vitest'
import { KnowageHighchartsLineChart } from '../KnowageHighchartsLineChart'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { getDefaultSerieLabelSettings } from '../../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

describe('KnowageHighchartsLineChart grouped measure aliases', () => {
    it('uses each widget measure alias when grouping is enabled, disabled and enabled again', () => {
        const createWidget = (columnName: string, alias: string): IWidget => {
            const columns = [
                { id: 'month', columnName: 'MESE', fieldType: 'ATTRIBUTE' },
                { id: 'year', columnName: 'ANNO', fieldType: 'ATTRIBUTE' },
                { id: columnName, columnName, fieldType: 'MEASURE' }
            ] as IWidgetColumn[]
            return {
                columns,
                settings: {
                    configuration: { grouping: { enabled: false, secondSeries: { enabled: false }, secondDimension: { enabled: true, serie: columnName } } },
                    interactions: {},
                    series: { aliases: [{ column: columns[2], alias }] }
                }
            } as IWidget
        }
        const requestsWidget = createWidget('NUMERO_RICHIESTE', 'Richieste')
        const servicesWidget = createWidget('NUMERO_PRESTAZIONI', 'Prestazioni')
        const createData = (columnName: string, value: number) => ({
            metaData: {
                fields: [
                    { header: 'MESE', dataIndex: 'column_1', type: 'string' },
                    { header: 'ANNO', dataIndex: 'column_2', type: 'number' },
                    { header: columnName, dataIndex: 'column_3', type: 'number' }
                ]
            },
            rows: [
                { column_1: '01', column_2: '2026', column_3: value },
                { column_1: '01', column_2: '2025', column_3: value + 1 }
            ]
        })
        const requestsChart = new KnowageHighchartsLineChart(null)
        const servicesChart = new KnowageHighchartsLineChart(null)
        const servicesData = createData('NUMERO_PRESTAZIONI', 20)

        requestsChart.setData(createData('NUMERO_RICHIESTE', 10), requestsWidget, [])
        servicesChart.setData(servicesData, servicesWidget, [])

        expect(requestsChart.getModel().series.map((series) => series.name)).toEqual(['Richieste - 2026', 'Richieste - 2025'])
        expect(servicesChart.getModel().series.map((series) => series.name)).toEqual(['Prestazioni - 2026', 'Prestazioni - 2025'])
        expect(servicesChart.getModel().series[0]).toMatchObject({ custom: { groupingValue: '2026' }, data: [{ name: '01', y: 20 }] })

        servicesChart.updateSerieAccessibilitySettings('2026', { enabled: true, description: 'Current year', exposeAsGroupOnly: false, keyboardNavigation: { enabled: true } })
        expect(servicesChart.getModel().series[0].accessibility).toMatchObject({ description: 'Current year' })

        servicesWidget.settings.series.seriesSettings = [
            { names: ['all'], showName: false, label: getDefaultSerieLabelSettings() },
            { names: ['2026'], showName: true, label: { ...getDefaultSerieLabelSettings(), enabled: true } }
        ]
        servicesChart.updateSeriesLabelSettings(servicesWidget)
        expect(servicesChart.getModel().series[0].data[0].dataLabels?.enabled).toBe(true)
        expect(servicesChart.getModel().series[1].data[0].dataLabels).toBeUndefined()

        servicesWidget.settings.configuration.grouping.secondDimension.enabled = false
        servicesChart.setData(servicesData, servicesWidget, [])
        expect(servicesChart.getModel().series[0]).toMatchObject({ name: 'Prestazioni', data: [{ name: '01', y: 20 }, { name: '01', y: 21 }] })

        servicesWidget.settings.configuration.grouping.secondDimension.enabled = true
        servicesChart.setData(servicesData, servicesWidget, [])
        expect(servicesChart.getModel().series.map((series) => series.name)).toEqual(['Prestazioni - 2026', 'Prestazioni - 2025'])
    })
})
