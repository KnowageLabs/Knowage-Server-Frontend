import { IWidget, IWidgetColumn } from "@/modules/documentExecution/dashboard/Dashboard"
import moment from "moment"

export const getAllColumnsOfSpecificTypeFromDataResponse = (data: any, widgetModel: IWidget, type: 'ATTRIBUTE' | 'MEASURE') => {
    if (!data || !widgetModel.columns) return []
    const formattedColumns = [] as { column: IWidgetColumn, metadata: any }[]
    widgetModel.columns.forEach((column: IWidgetColumn) => {
        if (column.fieldType === type) {
            const metadata = data.metaData.fields.find((field: any) => field.header?.startsWith(column.columnName))
            if (metadata) formattedColumns.push({ column: column, metadata: metadata })
        }
    })
    return formattedColumns
}

export const getFormattedDateCategoryValue = (dateString: string, dateFormat: string, type: 'date' | 'timestamp') => {
    if (!dateFormat) return dateString
    const date = moment(dateString, type === 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm:ss.SSS')
    return date.isValid() ? date.format(dateFormat) : dateString
}
