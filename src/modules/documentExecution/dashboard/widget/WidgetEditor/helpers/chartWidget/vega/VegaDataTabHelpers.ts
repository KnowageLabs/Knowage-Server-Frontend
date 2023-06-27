import { IWidgetColumn } from "@/modules/documentExecution/dashboard/Dashboard";

export const addVegaColumnToTable = (tempColumn: IWidgetColumn, rows: IWidgetColumn[], chartType: string | undefined, attributesOnly: boolean, measuresOnly: boolean) => {
    let mode = ''
    if (attributesOnly) mode = 'attributesOnly'
    else if (measuresOnly) mode = 'measuresOnly'
    switch (chartType) {
        case 'wordcloud':
            addWordcloudColumnToTable(tempColumn, rows, chartType, mode)
    }
}

const addWordcloudColumnToTable = (tempColumn: IWidgetColumn, rows: IWidgetColumn[], chartType: string | undefined, mode: string) => {
    if (mode === 'attributesOnly') {
        if (tempColumn.fieldType === 'MEASURE') {
            tempColumn.fieldType = 'ATTRIBUTE'
            tempColumn.aggregation = ''
        }
        addColumnToRows(rows, tempColumn)
    } else if (mode === 'measuresOnly') {
        if (tempColumn.fieldType === 'ATTRIBUTE') {
            tempColumn.fieldType = 'MEASURE'
            tempColumn.aggregation = 'SUM'
        }
        addColumnToRows(rows, tempColumn)
    }
}

const addColumnToRows = (rows: IWidgetColumn[], tempColumn: IWidgetColumn) => {
    const index = rows.findIndex((column: IWidgetColumn) => column.columnName === tempColumn.columnName)
    if (index === -1) rows.push(tempColumn)
}