import { describe, expect, it } from 'vitest'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { setRegularData } from '../HighchartsSetDataHelpers'

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
