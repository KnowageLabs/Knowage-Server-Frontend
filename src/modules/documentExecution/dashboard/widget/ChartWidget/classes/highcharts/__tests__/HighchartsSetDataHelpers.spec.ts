import { describe, expect, it } from 'vitest'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { setRegularData } from '../helpers/setData/HighchartsSetDataHelpers'

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
    const countryColumn = createWidgetColumn('country', 'ATTRIBUTE')
    const salesColumn = createWidgetColumn('sales', 'MEASURE')

    return {
        dataset: null,
        type: 'highcharts',
        columns: [countryColumn, salesColumn],
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
    column: widgetModel.columns[1],
    metadata: {
        dataIndex: 'column_2',
        type: 'number'
    }
})

const createAttributeColumn = (widgetModel: IWidget): IDataColumn => ({
    column: widgetModel.columns[0],
    metadata: {
        dataIndex: 'column_1',
        type: 'string'
    }
})

describe('HighchartsSetDataHelpers numeric parsing', () => {
    it('keeps locale-formatted measure values numeric so auto axes do not skip the lowest point', () => {
        const widgetModel = createWidgetModel()
        const model = createModel()

        setRegularData(
            model,
            widgetModel,
            { rows: [{ column_1: 'Italy', column_2: '3,000' }, { column_1: 'France', column_2: '6000' }] },
            [createAttributeColumn(widgetModel)],
            [createMeasureColumn(widgetModel)],
            false,
            '',
            []
        )

        expect(model.series[0].data[0].y).toBe(3000)
        expect(model.series[0].data[1].y).toBe(6000)
    })
})
