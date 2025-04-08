import { IWidget } from '../../../Dashboard'
import { IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'

export const formatMapForSave = (widget: IWidget) => {
    formatMapVisualizationTypes(widget)
}

const formatMapVisualizationTypes = (widget: IWidget) => {
    const visualizationTypes = widget.settings?.visualizations
    if (!visualizationTypes || visualizationTypes.length === 0) return
    visualizationTypes.forEach((visualizationType: IMapWidgetVisualizationType) => delete visualizationType.filter)
}
