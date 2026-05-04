import { IWidget } from '../../Dashboard'
import { IMapDialogSettings, IMapTooltipSettings, IMapTooltipSettingsVisualizations, IMapWidgetLegend, IMapWidgetVisualizationType } from '../../interfaces/mapWidget/DashboardMapWidget'

export const getMapInfoColumnName = (column: any): string => {
    if (typeof column === 'string') return column
    return column?.name ?? column?.property ?? column?.header ?? ''
}

export const normalizeMapInfoSettingColumns = (visualization: IMapTooltipSettingsVisualizations | null | undefined) => {
    if (!visualization) return visualization
    visualization.columns = (visualization.columns ?? []).map((column: any) => getMapInfoColumnName(column)).filter((column: string) => !!column)
    return visualization
}

export const normalizeMapInfoSettings = (settings: IMapDialogSettings | IMapTooltipSettings | null | undefined) => {
    settings?.visualizations?.forEach((visualization) => normalizeMapInfoSettingColumns(visualization))
    return settings
}

export const getMapVisualizationMeasureLabel = (visualizationType: IMapWidgetVisualizationType | null | undefined): string => {
    if (!visualizationType) return ''

    const legacyTargetDatasetMeasure = getMapInfoColumnName((visualizationType as any).targetDatasetMeasure)
    const targetMeasure = getMapInfoColumnName(visualizationType.targetMeasure)
    const targetDatasetMeasure = (visualizationType.targetDatasetMeasures ?? []).map((measure: any) => getMapInfoColumnName(measure)).find((measure: string) => !!measure) ?? ''
    const chartMeasure = (visualizationType.chartMeasures ?? []).map((measure: any) => getMapInfoColumnName(measure)).find((measure: string) => !!measure) ?? ''
    const targetProperty = getMapInfoColumnName(visualizationType.targetProperty)

    return legacyTargetDatasetMeasure || targetMeasure || targetDatasetMeasure || chartMeasure || targetProperty
}

const resolveMapLegendVisualization = (widgetModel: IWidget, visualizationType: IMapWidgetVisualizationType | null | undefined) => {
    if (!visualizationType) return null
    const visualizations = widgetModel?.settings?.visualizations ?? []

    return (
        visualizations.find((visualization: IMapWidgetVisualizationType) => {
            if (visualizationType.id && visualization.id === visualizationType.id) return true
            if (visualizationType.label && visualization.label === visualizationType.label) return true
            return !!(visualizationType.target && visualizationType.type && visualization.target === visualizationType.target && visualization.type === visualizationType.type)
        }) ?? null
    )
}

export const normalizeMapLegendSettings = (widgetModel: IWidget, legendSettings: IMapWidgetLegend | null | undefined) => {
    if (!legendSettings) return legendSettings

    const currentVisualizations = (widgetModel?.settings?.visualizations ?? []).filter((visualization: IMapWidgetVisualizationType) => visualization.type !== 'geography')
    const existingVisualizationTypes = legendSettings.visualizationTypes ?? []

    legendSettings.visualizationTypes = currentVisualizations.map((visualization: IMapWidgetVisualizationType) => {
        const existingVisualizationSettings =
            existingVisualizationTypes.find((visualizationTypeSettings) => {
                const resolvedVisualization = resolveMapLegendVisualization(widgetModel, visualizationTypeSettings.visualizationType ?? null)
                return resolvedVisualization?.id === visualization.id
            }) ?? null

        return {
            text: existingVisualizationSettings?.text ?? '',
            visualizationType: visualization
        }
    })

    return legendSettings
}
