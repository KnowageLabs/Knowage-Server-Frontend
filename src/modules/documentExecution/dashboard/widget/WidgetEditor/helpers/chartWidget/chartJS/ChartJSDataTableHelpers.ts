import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'

export const addChartJSColumnToTable = (tempColumn: IWidgetColumn, rows: IWidgetColumn[], attributesOnly: boolean, measuresOnly: boolean, widgetModel: IWidget) => {
    let mode = ''
    const chartType = widgetModel.settings.chartModel.model.chart.type
    if (attributesOnly) mode = 'attributesOnly'
    else if (measuresOnly) mode = 'measuresOnly'
    switch (chartType) {
        case 'pie':
            addChartJSPieChartColumnToTable(tempColumn, rows, mode)
            break
        case 'bar':
        case 'line':
            addChartJSBarChartColumnToTable(tempColumn, rows, mode)
            break
    }
}

const addChartJSPieChartColumnToTable = (tempColumn: IWidgetColumn, rows: IWidgetColumn[], mode: string) => {
    if (mode === 'attributesOnly' && rows.length <= 1) {
        if (tempColumn.fieldType === 'MEASURE') {
            tempColumn.fieldType = 'ATTRIBUTE'
            tempColumn.aggregation = ''
        }
        rows[0] = tempColumn
    } else if (mode === 'measuresOnly' && rows.length <= 1) {
        if (tempColumn.fieldType === 'ATTRIBUTE') {
            tempColumn.fieldType = 'MEASURE'
            tempColumn.aggregation = 'SUM'
        }
        rows[0] = tempColumn
    }
}

const addChartJSBarChartColumnToTable = (tempColumn: IWidgetColumn, rows: IWidgetColumn[], mode: string) => {
    if (mode === 'attributesOnly') {
        if (tempColumn.fieldType === 'MEASURE') {
            tempColumn.fieldType = 'ATTRIBUTE'
            tempColumn.aggregation = ''
        }
        rows.push(tempColumn)
    } else if (mode === 'measuresOnly') {
        if (tempColumn.fieldType === 'ATTRIBUTE') {
            tempColumn.fieldType = 'MEASURE'
            tempColumn.aggregation = 'SUM'
        }
        rows.push(tempColumn)
    }
}
