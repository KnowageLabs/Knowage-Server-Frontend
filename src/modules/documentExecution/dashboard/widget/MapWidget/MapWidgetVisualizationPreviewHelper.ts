import { IMapWidgetVisualizationType, IMapWidgetVisualizationTypeMarker } from '../../interfaces/mapWidget/DashboardMapWidget'

const DEFAULT_MARKER_COLOR = '#0400f5ff'

export const getMapVisualizationIcon = (type: string): string => {
    const icons: Record<string, string> = {
        markers: 'place',
        choropleth: 'map',
        heatmap: 'blur_on',
        clusters: 'group_work',
        charts: 'pie_chart',
        pies: 'pie_chart',
        balloons: 'bubble_chart'
    }

    return icons[type] || 'layers'
}

export const getMapVisualizationColors = (visualization: IMapWidgetVisualizationType): string[] => {
    if (visualization.type === 'choropleth' && visualization.analysisConf?.style) {
        const colors: string[] = []
        const style = visualization.analysisConf.style
        if (style.color) colors.push(style.color)
        if (style.toColor) colors.push(style.toColor)
        if (colors.length > 0) return colors
    }

    if (visualization.type === 'markers' && visualization.markerConf?.style?.color) {
        return [visualization.markerConf.style.color]
    }

    if ((visualization.type === 'charts' || visualization.type === 'pies') && visualization.pieConf?.colors?.length) {
        return visualization.pieConf.colors.slice(0, 5)
    }

    return ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
}

const getMarkerPreviewColor = (markerConfiguration: IMapWidgetVisualizationTypeMarker | undefined) => {
    return markerConfiguration?.style?.color || DEFAULT_MARKER_COLOR
}

export const isMapMarkerImagePreview = (visualization: IMapWidgetVisualizationType): boolean => {
    return visualization.type === 'markers' && ['img', 'url'].includes(visualization.markerConf?.type ?? '') && !!getMapMarkerPreviewImageSource(visualization)
}

export const getMapMarkerPreviewImageSource = (visualization: IMapWidgetVisualizationType): string => {
    if (visualization.type !== 'markers' || !visualization.markerConf) return ''

    switch (visualization.markerConf.type) {
        case 'img':
            return visualization.markerConf.img ?? ''
        case 'url':
            return visualization.markerConf.url ?? ''
        default:
            return ''
    }
}

export const getMapMarkerPreviewIconClass = (visualization: IMapWidgetVisualizationType): string => {
    if (visualization.type !== 'markers' || !visualization.markerConf) return ''

    switch (visualization.markerConf.type) {
        case 'icon':
            return visualization.markerConf.icon?.className ?? 'fa fa-map-marker'
        case 'default':
        default:
            return 'fas fa-circle'
    }
}

export const getMapMarkerPreviewStyle = (visualization: IMapWidgetVisualizationType): Record<string, string> => {
    if (visualization.type !== 'markers' || !visualization.markerConf) return {}
    return { color: getMarkerPreviewColor(visualization.markerConf) }
}
