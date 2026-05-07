import { IWidget } from '../../Dashboard'
import { IMapDialogSettings, IMapTooltipSettings, IMapTooltipSettingsVisualizations, IMapWidgetLayer, IMapWidgetLegend, IMapWidgetVisualizationType } from '../../interfaces/mapWidget/DashboardMapWidget'

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

export const getMapDatasetInfoColumnNames = (widgetModel: IWidget, datasetLayer: IMapWidgetLayer | null | undefined): string[] => {
    if (!datasetLayer) return []

    const datasetColumnNames = new Set((datasetLayer.columns ?? []).map((column: any) => column.name))
    const infoColumnNames = new Set<string>()
    const infoSettings = [widgetModel?.settings?.dialog, widgetModel?.settings?.tooltips]

    ;(widgetModel?.settings?.visualizations ?? []).forEach((visualization: IMapWidgetVisualizationType) => {
        const usesDataset = visualization.target === datasetLayer.layerId || visualization.targetDataset === datasetLayer.layerId
        if (!usesDataset || !visualization.label) return

        infoSettings.forEach((settings) => {
            settings?.visualizations
                ?.filter((item) => item.label === visualization.label)
                .forEach((item) =>
                    (item.columns ?? []).forEach((column: any) => {
                        const columnName = getMapInfoColumnName(column)
                        if (columnName && datasetColumnNames.has(columnName)) infoColumnNames.add(columnName)
                    })
                )
        })
    })

    return Array.from(infoColumnNames)
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
    const normalizedVisualizationTypes = currentVisualizations.map((visualization: IMapWidgetVisualizationType) => {
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
    const legendNeedsSync =
        normalizedVisualizationTypes.length !== existingVisualizationTypes.length ||
        normalizedVisualizationTypes.some((normalizedVisualizationType, index) => {
            const existingVisualizationType = existingVisualizationTypes[index]
            return existingVisualizationType?.text !== normalizedVisualizationType.text || existingVisualizationType?.visualizationType !== normalizedVisualizationType.visualizationType
        })

    // Avoid reassigning an equivalent array: the Legend editor deep-watches widgetModel.
    if (legendNeedsSync) legendSettings.visualizationTypes = normalizedVisualizationTypes

    return legendSettings
}
