import { IWidgetPreview } from "../../Dashboard";
import { IChartInteractionValues } from "../../interfaces/chartJS/DashboardChartJSWidget";

export const executeTablePreview = (formattedRow: any, previewSettings: IWidgetPreview) => {
    console.log("---------- executeTablePreview() - formattedRow: ", formattedRow)
    console.log("---------- executeTablePreview() - previewSettings: ", previewSettings)
}

export const executeChartPreview = (formattedChartValues: IChartInteractionValues, previewSettings: IWidgetPreview) => {
    console.log("---------- executeChartPreview() - formattedChartValues: ", formattedChartValues)
    console.log("---------- executeChartPreview() - previewSettings: ", previewSettings)
}
export const executeHTMLWidgetPreview = (datasetLabel: string, previewSettings: IWidgetPreview) => {
    console.log("---------- executeHTMLWidgetPreview() - datasetLabel: ", datasetLabel)
    console.log("---------- executeHTMLWidgetPreview() - previewSettings: ", previewSettings)
}

export const executeCustomChartPreview = (columnValue: string | number, previewSettings: IWidgetPreview, dashboardId: string) => {
    console.log('---------- executeCustomChartPreview() - columnValue: ', columnValue)
    console.log('---------- executeCustomChartPreview() - previewSettings: ', previewSettings)
    console.log('---------- executeCustomChartPreview() - dashboardId: ', dashboardId)
}
