import { IWidget } from "@/modules/documentExecution/dashboard/Dashboard"
import { IHighchartsSeriesLabelsSetting } from "@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget"
import * as highchartsDefaultValues from '../../../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import { KnowageHighcharts } from "../../KnowageHighcharts"

export const updateSeriesLabelSettingsWhenAllOptionIsAvailable = (model: any, widgetModel: IWidget) => {
    if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesSettings) return
    setAllSeriesSettings(model, widgetModel)
    setSpecificSeriesSettings(model, widgetModel)
}


const setAllSeriesSettings = (model: any, widgetModel: IWidget) => {
    const allSeriesSettings = widgetModel.settings.series.seriesSettings[0]
    if (allSeriesSettings.label.enabled) {
        model.seriesForRender?.forEach((serie: any) =>
            updateSeriesDataWithSerieSettings(serie, allSeriesSettings))
    } else {
        resetSeriesSettings(model)
    }
}

const resetSeriesSettings = (model: any) => {
    model.seriesForRender?.forEach((serie: any) => serie.dataLabels = { ...highchartsDefaultValues.getDefaultSerieLabelSettings(), position: '' })
}

const setSpecificSeriesSettings = (model: any, widgetModel: IWidget) => {
    for (let i = 1; i < widgetModel.settings.series.seriesSettings.length; i++) {
        const seriesSettings = widgetModel.settings.series.seriesSettings[i] as IHighchartsSeriesLabelsSetting
        if (seriesSettings.label.enabled) seriesSettings.names.forEach((serieName: string) => updateSpecificSeriesLabelSettings(model, serieName, seriesSettings))
    }
}

const updateSpecificSeriesLabelSettings = (model: any, serieName: string, seriesSettings: IHighchartsSeriesLabelsSetting) => {
    if (!model.seriesForRender) return
    const index = model.seriesForRender.findIndex((serie: any) => serie.name === serieName)
    if (index !== undefined && index !== -1) updateSeriesDataWithSerieSettings(model.seriesForRender[index], seriesSettings)
}

const updateSeriesDataWithSerieSettings = (serie: any, seriesSettings: IHighchartsSeriesLabelsSetting) => {
    serie.data.forEach((data: any) => {
        data.dataLabels = {
            backgroundColor: seriesSettings.label.backgroundColor ?? '',
            enabled: true,
            position: '',
            style: {
                fontFamily: seriesSettings.label.style.fontFamily,
                fontSize: seriesSettings.label.style.fontSize,
                fontWeight: seriesSettings.label.style.fontWeight,
                color: seriesSettings.label.style.color ?? ''
            },
            formatter: function () {
                return KnowageHighcharts.prototype.handleFormatter(this, seriesSettings.label)
            }
        }
    })
}