import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsSeriesLabelsSetting } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import * as highchartsDefaultValues from '../../../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import { KnowageHighcharts } from '../../KnowageHighcharts'

export const updateSeriesLabelSettingsWhenAllOptionIsAvailable = (model: any, widgetModel: IWidget) => {
    if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesSettings) return
    setAllSeriesSettings(model, widgetModel)
    setSpecificSeriesSettings(model, widgetModel)
}

const setAllSeriesSettings = (model: any, widgetModel: IWidget) => {
    const allSeriesSettings = widgetModel.settings.series.seriesSettings[0]
    if (allSeriesSettings.label.enabled) {
        model.series?.forEach((serie: any) => updateSeriesDataWithSerieSettings(model, serie, allSeriesSettings))
    } else {
        resetSeriesSettings(model)
    }
}

const resetSeriesSettings = (model: any) => {
    model.series?.forEach((serie: any) => (serie.dataLabels = { ...highchartsDefaultValues.getDefaultSerieLabelSettings(), position: '' }))
}

const setSpecificSeriesSettings = (model: any, widgetModel: IWidget) => {
    for (let i = 1; i < widgetModel.settings.series.seriesSettings.length; i++) {
        const seriesSettings = widgetModel.settings.series.seriesSettings[i] as IHighchartsSeriesLabelsSetting
        if (seriesSettings.label.enabled)
            seriesSettings.names.forEach((serieName: string) => {
                const possibleAliasToReplace = getColumnAliasToReplace(serieName, widgetModel.settings.series.aliases)
                updateSpecificSeriesLabelSettings(model, possibleAliasToReplace, seriesSettings)
            })
    }
}

const getColumnAliasToReplace = (columnName: string, columnAliases: { column: IWidgetColumn | null; alias: string }[]) => {
    if (!columnAliases || columnAliases.length === 0) return columnName

    columnAliases.forEach((columnAlias) => {
        if (columnAlias.column?.columnName === columnName) columnName = columnAlias.alias
    })

    return columnName
}

const updateSpecificSeriesLabelSettings = (model: any, serieName: string, seriesSettings: IHighchartsSeriesLabelsSetting) => {
    if (!model.series) return
    const index = model.series.findIndex((serie: any) => serie.name === serieName)
    if (index !== undefined && index !== -1) updateSeriesDataWithSerieSettings(model, model.series[index], seriesSettings)
}

const updateSeriesDataWithSerieSettings = (model: any, serie: any, seriesSettings: IHighchartsSeriesLabelsSetting) => {
    serie.data.forEach((data: any) => {
        if (data instanceof Object) {
            data.dataLabels = {
                backgroundColor: seriesSettings.label.backgroundColor ?? '',
                enabled: true,
                position: '',
                style: {
                    fontFamily: seriesSettings.label.style.fontFamily,
                    fontSize: seriesSettings.label.style.fontSize,
                    fontWeight: seriesSettings.label.style.fontWeight,
                    color: seriesSettings.label.style.color ?? '',
                    textOutline: 'none'
                },
                formatter: function () {
                    return KnowageHighcharts.prototype.handleFormatter(this, seriesSettings.label, model.chart.type)
                }
            }
        }
    })
}

export const updateSeriesLabelSettingsWhenOnlySingleSerieIsAvailable = (model: any, widgetModel: IWidget) => {
    if (!widgetModel || !widgetModel.settings.series || !widgetModel.settings.series.seriesSettings || !widgetModel.settings.series.seriesSettings[0]) return
    const seriesLabelSetting = widgetModel.settings.series.seriesSettings[0]
    if (!seriesLabelSetting.label.enabled) return
    model.series.forEach((serie: any) => {
        serie.data?.forEach((data: any) => {
            data.dataLabels = {
                alignTo: 'plotEdges',
                backgroundColor: seriesLabelSetting.label.backgroundColor ?? '',
                distance: 30,
                enabled: true,
                headers: true,
                position: '',
                style: {
                    fontFamily: seriesLabelSetting.label.style.fontFamily,
                    fontSize: seriesLabelSetting.label.style.fontSize,
                    fontWeight: seriesLabelSetting.label.style.fontWeight,
                    color: seriesLabelSetting.label.style.color ?? '',
                    textOutline: 'none'
                },
                formatter: function () {
                    return KnowageHighcharts.prototype.handleFormatter(this, seriesLabelSetting.label, model.chart.type)
                }
            }
            if (model?.chart?.type === 'pictorial') {
                delete data.dataLabels.alignTo
                data.dataLabels.align = 'center'
            }
            if (model?.chart?.type === 'treemap') {
                delete data.dataLabels.alignTo
            }
        })
    })
}

export const getColumnAlias = (column: IWidgetColumn, columnAliases: { column: IWidgetColumn | null; alias: string }[]) => {
    if (!columnAliases || columnAliases.length === 0) return column.columnName

    const columnAluisSettings = columnAliases.find((columnAliasSetting: { column: IWidgetColumn | null; alias: string }) => columnAliasSetting.column?.id === column.id || columnAliasSetting.column?.columnName === column.columnName)
    return columnAluisSettings ? columnAluisSettings.alias : column.columnName
}
