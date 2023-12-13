import { IWidget, IWidgetColumn } from "@/modules/documentExecution/dashboard/Dashboard";
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export const addHighchartsColumnToTable = (tempColumn: IWidgetColumn, rows: IWidgetColumn[], chartType: string | undefined, attributesOnly: boolean, measuresOnly: boolean, widgetModel: IWidget) => {
    let mode = ''
    if (attributesOnly) mode = 'attributesOnly'
    else if (measuresOnly) mode = 'measuresOnly'
    switch (chartType) {
        case 'pie':
        case 'gauge':
        case 'activitygauge':
        case 'solidgauge':
        case 'heatmap':
        case 'radar':
        case 'area':
        case 'bar':
        case 'column':
        case 'line':
        case 'scatter':
        case 'bubble':
        case 'sunburst':
        case 'treemap':
        case 'dependencywheel':
        case 'spline':
        case 'pictorial':
        case 'sankey':
        case 'funnel':
        case 'dumbbell':
        case 'streamgraph':
        case 'packedbubble':
        case 'waterfall':
            addHighchartsColumnToTableRows(tempColumn, rows, chartType, mode, widgetModel)
    }
}

const addHighchartsColumnToTableRows = (tempColumn: IWidgetColumn, rows: IWidgetColumn[], chartType: string | undefined, mode: string, widgetModel: IWidget) => {
    if (mode === 'attributesOnly') {
        addAttributeColumnToTableRows(tempColumn, rows)
    } else if (mode === 'measuresOnly') {
        addMeasureColumnToTableRows(tempColumn, rows, chartType, widgetModel)
    }
}


const addAttributeColumnToTableRows = (tempColumn: IWidgetColumn, rows: IWidgetColumn[]) => {
    if (tempColumn.fieldType === 'MEASURE') {
        tempColumn.fieldType = 'ATTRIBUTE'
        tempColumn.aggregation = ''
    }
    tempColumn.drillOrder = {
        "orderColumn": "",
        "orderColumnId": "",
        "orderType": ""
    }
    addColumnToRows(rows, tempColumn)
}

const addMeasureColumnToTableRows = (tempColumn: IWidgetColumn, rows: IWidgetColumn[], chartType: string | undefined, widgetModel: IWidget) => {
    convertColumnToMeasure(tempColumn)
    addColumnToRows(rows, tempColumn)
    widgetModel.settings.chartModel.addSerie(tempColumn, chartType)
    addSerieToWidgetModel(widgetModel, tempColumn, chartType)
    emitter.emit('seriesAdded', tempColumn)
}

const convertColumnToMeasure = (tempColumn: IWidgetColumn) => {
    if (tempColumn.fieldType === 'ATTRIBUTE') {
        tempColumn.fieldType = 'MEASURE'
        tempColumn.aggregation = 'COUNT'
    }
}

const addColumnToRows = (rows: IWidgetColumn[], tempColumn: IWidgetColumn) => {
    const index = rows.findIndex((column: IWidgetColumn) => column.columnName === tempColumn.columnName)
    if (index === -1) rows.push(tempColumn)
}

const addSerieToWidgetModel = (widgetModel: IWidget, column: IWidgetColumn, chartType: string | undefined) => {
    widgetModel.settings.chartModel.removeSerie(column)
    const allSeriesOption = !['pie', 'solidgauge', 'sunburst', 'treemap', 'dependencywheel', 'sankey', 'pictorial', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall'].includes('' + chartType)
    if (!allSeriesOption) {
        addColumnAsFirstOption(column, widgetModel.settings.accesssibility.seriesAccesibilitySettings)
        addColumnAsFirstOption(column, widgetModel.settings.series.seriesSettings)
    }
    console.log('---------- AFTER ADD: ', widgetModel.settings.series.seriesSettings)
    emitter.emit('seriesRemoved', column)
}

const addColumnAsFirstOption = (column: IWidgetColumn, array: any[]) => {
    if (array[0] && array[0]?.names?.length === 0) array[0].names = [column.columnName]

}

export const removeSerieFromWidgetModel = (widgetModel: IWidget, column: IWidgetColumn, chartType: string | undefined) => {
    widgetModel.settings.chartModel.removeSerie(column)
    const allSeriesOption = !['pie', 'solidgauge', 'sunburst', 'treemap', 'dependencywheel', 'sankey', 'pictorial', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall'].includes('' + chartType)
    removeColumnFromSubmodel(column, widgetModel.settings.accesssibility.seriesAccesibilitySettings, allSeriesOption)
    removeColumnFromSubmodel(column, widgetModel.settings.series.seriesSettings, allSeriesOption)
    console.log('---------- AFTER REMOVE: ', widgetModel.settings.series.seriesSettings)
    emitter.emit('seriesRemoved', column)
}

const removeColumnFromSubmodel = (column: IWidgetColumn, array: any[], allSeriesOption: boolean) => {
    console.log('---------- column REMOVE: ', column)
    for (let i = array.length - 1; i >= 0; i--) {
        for (let j = array[i].names.length - 1; j >= 0; j--) {
            const serieName = array[i].names[j]
            if (serieName === column.columnName) {
                array[i].names.splice(j, 1)
            }
            if (allSeriesOption && i !== 0 && array[i].names.length === 0) array.splice(i, 1)
        }
    }
}