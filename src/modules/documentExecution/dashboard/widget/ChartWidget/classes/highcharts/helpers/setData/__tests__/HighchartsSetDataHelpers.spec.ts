import { describe, expect, it } from 'vitest'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { setGroupedByCategoriesData } from '../HighchartsSetDataHelpers'

describe('setGroupedByCategoriesData measure names', () => {
    it.each([undefined, 'Sales alias'])('uses the measure name or alias (%s) and preserves grouping order, sorting and null values', (alias) => {
        const columns = [
            { id: 'region', columnName: 'region', fieldType: 'ATTRIBUTE' },
            { id: 'year', columnName: 'year', fieldType: 'ATTRIBUTE' },
            { id: 'sales', columnName: 'sales', fieldType: 'MEASURE', orderType: 'DESC' }
        ] as IWidgetColumn[]
        const widget = { columns, settings: { series: { aliases: alias ? [{ column: columns[2], alias }] : [] } } } as IWidget
        const model = { series: [] as any[], xAxis: [{ categories: ['old'] }] }

        setGroupedByCategoriesData(
            model,
            {
                rows: [
                    { column_1: 'North', column_2: '2026', column_3: null },
                    { column_1: 'South', column_2: '2026', column_3: '80' },
                    { column_1: 'North', column_2: '2025', column_3: '20' }
                ]
            },
            [
                { column: columns[0], metadata: { dataIndex: 'column_1', type: 'string' } },
                { column: columns[1], metadata: { dataIndex: 'column_2', type: 'string' } }
            ],
            [{ column: columns[2], metadata: { dataIndex: 'column_3', type: 'number' } }],
            'sales',
            widget,
            []
        )

        expect(model.series.map((series) => series.name)).toEqual([`${alias ?? 'sales'} - 2026`, `${alias ?? 'sales'} - 2025`])
        expect(model.series.map((series) => series.custom.groupingValue)).toEqual(['2026', '2025'])
        expect(model.series[0].data).toEqual([{ name: 'South', y: 80 }, { name: 'North', y: null }])
        expect(model.series[1].data).toEqual([{ name: 'North', y: 20 }, { name: 'South', y: null }])
        expect(model.xAxis[0]).not.toHaveProperty('categories')
    })
})
