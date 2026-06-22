import { IMapWidgetVisualizationTypeBalloons, IMapWidgetVisualizationTypeChoropleth, IMapWidgetVisualizationTypeCluster } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import * as mapWidgetDefaultValues from './MapWidgetDefaultValues'

type TLegacyChoroplethConfiguration = Partial<IMapWidgetVisualizationTypeChoropleth> & {
    fromColor?: string
    toColor?: string
    borderWidth?: number
}

type TLegacyBalloonsConfiguration = Partial<IMapWidgetVisualizationTypeBalloons> & {
    fromColor?: string
}

type TLegacyClusterConfiguration = Partial<IMapWidgetVisualizationTypeCluster> & {
    clusterRadius?: number
}

const DEFAULT_CLUSTER_BACKGROUND_COLOR = 'rgba(59, 130, 246, 1)'
const DEFAULT_CLUSTER_FONT_COLOR = '#ffffff'
const DEFAULT_CLUSTER_FONT_SIZE = '12px'

const getPopulatedStyleValue = (value?: string | null) => {
    return value && value.trim().length > 0 ? value : null
}

export const normalizeMapWidgetChoroplethConfiguration = (configuration?: TLegacyChoroplethConfiguration | null): IMapWidgetVisualizationTypeChoropleth => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    const style = configuration?.style ?? {}

    return {
        ...defaultValues,
        ...configuration,
        method: configuration?.method ?? defaultValues.method,
        classes: configuration?.classes ?? defaultValues.classes,
        borderColor: configuration?.borderColor ?? style.borderColor ?? defaultValues.borderColor,
        minSize: configuration?.minSize ?? defaultValues.minSize,
        maxSize: configuration?.maxSize ?? defaultValues.maxSize,
        style: {
            ...defaultValues.style,
            ...style,
            color: style.color ?? configuration?.fromColor ?? defaultValues.style.color,
            toColor: style.toColor ?? configuration?.toColor ?? defaultValues.style.toColor,
            borderColor: style.borderColor ?? configuration?.borderColor ?? defaultValues.style.borderColor,
            borderWidth: style.borderWidth ?? configuration?.borderWidth ?? defaultValues.style.borderWidth
        },
        properties: {
            thresholds: configuration?.properties?.thresholds ?? defaultValues.properties?.thresholds ?? []
        }
    }
}

export const normalizeMapWidgetBalloonsConfiguration = (configuration?: TLegacyBalloonsConfiguration | null): IMapWidgetVisualizationTypeBalloons => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationBalloonsConfiguration()
    const style = configuration?.style ?? {}

    return {
        ...defaultValues,
        ...configuration,
        minSize: configuration?.minSize ?? defaultValues.minSize,
        maxSize: configuration?.maxSize ?? defaultValues.maxSize,
        method: configuration?.method ?? defaultValues.method,
        classes: configuration?.classes ?? defaultValues.classes,
        type: configuration?.type ?? defaultValues.type,
        style: {
            ...defaultValues.style,
            ...style,
            color: style.color ?? configuration?.fromColor ?? defaultValues.style.color
        },
        properties: {
            thresholds: configuration?.properties?.thresholds ?? defaultValues.properties?.thresholds ?? []
        }
    }
}

export const normalizeMapWidgetClusterConfiguration = (configuration?: TLegacyClusterConfiguration | null): IMapWidgetVisualizationTypeCluster => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationClusterConfiguration()
    const style = configuration?.style ?? {}

    const explicitBackgroundColor = getPopulatedStyleValue(style['background-color'])
    const legacySingleColor = explicitBackgroundColor ? null : getPopulatedStyleValue(style.color)
    const normalizedBackgroundColor = explicitBackgroundColor ?? legacySingleColor ?? getPopulatedStyleValue(defaultValues.style['background-color']) ?? DEFAULT_CLUSTER_BACKGROUND_COLOR
    const normalizedFontColor = explicitBackgroundColor ? getPopulatedStyleValue(style.color) ?? getPopulatedStyleValue(defaultValues.style.color) ?? DEFAULT_CLUSTER_FONT_COLOR : getPopulatedStyleValue(defaultValues.style.color) ?? DEFAULT_CLUSTER_FONT_COLOR

    return {
        ...defaultValues,
        ...configuration,
        maxClusterRadius: configuration?.maxClusterRadius ?? configuration?.clusterRadius ?? defaultValues.maxClusterRadius,
        radiusSize: configuration?.radiusSize ?? defaultValues.radiusSize,
        style: {
            ...defaultValues.style,
            ...style,
            'font-size': getPopulatedStyleValue(style['font-size']) ?? getPopulatedStyleValue(defaultValues.style['font-size']) ?? DEFAULT_CLUSTER_FONT_SIZE,
            'background-color': normalizedBackgroundColor,
            color: normalizedFontColor
        }
    }
}
