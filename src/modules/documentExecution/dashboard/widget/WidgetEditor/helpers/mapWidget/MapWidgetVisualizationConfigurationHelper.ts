import { IMapWidgetVisualizationTypeBalloons, IMapWidgetVisualizationTypeChoropleth } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import * as mapWidgetDefaultValues from './MapWidgetDefaultValues'

type TLegacyChoroplethConfiguration = Partial<IMapWidgetVisualizationTypeChoropleth> & {
    fromColor?: string
    toColor?: string
    borderWidth?: number
}

type TLegacyBalloonsConfiguration = Partial<IMapWidgetVisualizationTypeBalloons> & {
    fromColor?: string
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
