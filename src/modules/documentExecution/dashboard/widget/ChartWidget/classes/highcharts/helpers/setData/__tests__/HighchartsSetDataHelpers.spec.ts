import { describe, expect, it } from 'vitest'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { setGroupedByCategoriesData, setRegularData } from '../HighchartsSetDataHelpers'

type IDataColumn = {
    column: IWidgetColumn
    metadata: {
        dataIndex: string
        type: string
    }
}

const createWidgetColumn = (columnName: string, fieldType: 'ATTRIBUTE' | 'MEASURE'): IWidgetColumn => ({
    id: columnName,
    columnName,
    alias: columnName,
    type: fieldType === 'MEASURE' ? 'number' : 'string',
    fieldType,
    multiValue: false,
    aggregation: fieldType === 'MEASURE' ? 'SUM' : 'NONE',
    filter: {
        enabled: false,
        operator: '',
        value: ''
    }
})

const createWidgetModel = (): IWidget => {
    const regionColumn = createWidgetColumn('region', 'ATTRIBUTE')
    const countryColumn = createWidgetColumn('country', 'ATTRIBUTE')
    const cityColumn = createWidgetColumn('city', 'ATTRIBUTE')
    const salesColumn = createWidgetColumn('sales', 'MEASURE')

    return {
        dataset: null,
        type: 'highcharts',
        columns: [regionColumn, countryColumn, cityColumn, salesColumn],
        settings: {
            series: {
                aliases: []
            }
        }
    }
}

const createModel = () => ({
    series: [],
    xAxis: [{}]
})

const createMeasureColumn = (widgetModel: IWidget): IDataColumn => ({
    column: widgetModel.columns[3],
    metadata: {
        dataIndex: 'column_2',
        type: 'number'
    }
})

const createAttributeColumn = (widgetModel: IWidget, index: number): IDataColumn => ({
    column: widgetModel.columns[index],
    metadata: {
        dataIndex: 'column_1',
        type: 'string'
    }
})

describe('setRegularData drilldown state', () => {
    it('keeps intermediate drilldown points navigable when the current response exposes only the active attribute', () => {
        const widgetModel = createWidgetModel()
        const model = createModel()

        setRegularData(
            model,
            widgetModel,
            { rows: [{ column_1: 'Italy', column_2: 100 }] },
            [createAttributeColumn(widgetModel, 1)],
            [createMeasureColumn(widgetModel)],
            true,
            '',
            [],
            1
        )

        expect(model.series[0].data[0].drilldown).toBe(true)
    })

    it('does not mark points as drillable on the terminal drilldown level', () => {
        const widgetModel = createWidgetModel()
        const model = createModel()

        setRegularData(
            model,
            widgetModel,
            { rows: [{ column_1: 'Milan', column_2: 100 }] },
            [createAttributeColumn(widgetModel, 2)],
            [createMeasureColumn(widgetModel)],
            true,
            '',
            [],
            2
        )

        expect(model.series[0].data[0].drilldown).toBe(false)
    })
})

describe('setGroupedByCategoriesData', () => {
    it('preserves the incoming order for numeric-looking secondary categories', () => {
        const widgetModel = createWidgetModel()
        const model = createModel()

        setGroupedByCategoriesData(
            model,
            {
                rows: [
                    { column_1: 'North', column_2: '2026', column_3: 100 },
                    { column_1: 'South', column_2: '2026', column_3: 80 },
                    { column_1: 'North', column_2: '2025', column_3: 120 },
                    { column_1: 'South', column_2: '2025', column_3: 60 }
                ]
            },
            [
                { column: widgetModel.columns[0], metadata: { dataIndex: 'column_1', type: 'string' } },
                { column: widgetModel.columns[1], metadata: { dataIndex: 'column_2', type: 'string' } }
            ],
            [{ column: widgetModel.columns[3], metadata: { dataIndex: 'column_3', type: 'number' } }],
            'sales',
            widgetModel,
            []
        )

        expect(model.series.map((series: { name: string }) => series.name)).toEqual(['2026', '2025'])
    })
})
