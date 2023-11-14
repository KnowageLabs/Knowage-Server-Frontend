import { IWidget, IWidgetColumn } from "../Dashboard"
import { createNewWidget } from "./WidgetEditor/helpers/WidgetEditorHelpers"
import { KnowageHighchartsBarChart } from "./ChartWidget/classes/highcharts/KnowageHighchartsBarChart"
import { KnowageHighchartsPieChart } from "./ChartWidget/classes/highcharts/KnowageHighchartsPieChart"
import { KnowageHighchartsLineChart } from "./ChartWidget/classes/highcharts/KnowageHighchartsLineChart"
import deepcopy from "deepcopy"
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

const dashStore = dashboardStore()

export const quickWidgetCreateChartFromTable = (chartType: string, currentWidget: IWidget, dashboardId: string) => {
    const newWidget = createNewWidget('highcharts')
    newWidget.dataset = currentWidget.dataset
    const attributeColumn = currentWidget.columns.find((column: IWidgetColumn) => column.fieldType === 'ATTRIBUTE')
    const measureColumn = currentWidget.columns.find((column: IWidgetColumn) => column.fieldType === 'MEASURE')
    if (!attributeColumn || !measureColumn) return
    newWidget.columns = [deepcopy(attributeColumn), deepcopy(measureColumn)]
    copyGenericWidgetStyle(newWidget, currentWidget)
    newWidget.new = false
    switch (chartType) {
        case 'bar':
            newWidget.settings.chartModel = new KnowageHighchartsBarChart(null, 'bar', false)
            break
        case 'pie':
            newWidget.settings.chartModel = new KnowageHighchartsPieChart(null)
            break
        case 'line':
            newWidget.settings.chartModel = new KnowageHighchartsLineChart(null)
    }
    dashStore.createNewWidget(dashboardId, newWidget)
    console.log('----------- newWidget: ', newWidget)
}

export const quickWidgetCreateTableFromChart = (currentWidget: IWidget, dashboardId: string) => {
    console.log('------ createTableFromChart: ', currentWidget)
    const newWidget = createNewWidget('table')
    newWidget.dataset = currentWidget.dataset
    newWidget.columns = deepcopy(currentWidget.columns)
    newWidget.new = false
    copyGenericWidgetStyle(newWidget, currentWidget)
    dashStore.createNewWidget(dashboardId, newWidget)
    console.log('----------- newWidget: ', newWidget)
}

const copyGenericWidgetStyle = (newWidget: IWidget, currentWidget: IWidget,) => {
    newWidget.settings.style.themeName = currentWidget.settings.style.themeName
    newWidget.settings.style.title = currentWidget.settings.style.title
    newWidget.settings.style.background = currentWidget.settings.style.background
    newWidget.settings.style.borders = currentWidget.settings.style.borders
    newWidget.settings.style.padding = currentWidget.settings.style.padding
    newWidget.settings.style.shadows = currentWidget.settings.style.shadows
}