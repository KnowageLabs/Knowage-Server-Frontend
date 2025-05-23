import { IDashboard, IDashboardDriver, IVariable, IWidget } from '../../Dashboard'
import { IMapWidgetConditionalStyle, IMapWidgetVisualizationType, IMapWidgetVisualizationTypeBalloons, IMapWidgetVisualizationTypeMarker, IMapWidgetVisualizationTypePie, IMapWidgetVisualizationTypeCluster, IMapWidgetVisualizationTypeHeatmap, IMapWidgetVisualizationTypeChoropleth, IMapWidgetLayer } from '../../interfaces/mapWidget/DashboardMapWidget'
import * as mapWidgetDefaultValues from '../../widget/WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'

export const getFormattedLayers = (widget: any) => {
    const layers = widget.content.layers
    const formattedLayers = getFormattedLayersAsNewMapWidgetLayer(layers)

    return formattedLayers
}

export const getFormattedSettingsFromLayers = (widget: any, formattedWidget: IWidget, formattedDashboardModel: IDashboard, drivers: IDashboardDriver[]) => {
    const layers = widget.content.layers

    layers?.forEach((layer: any) => {
        layer?.content?.columnSelectedOfDataset?.forEach((column: any) => {
            addLayerColumnTooltipOptions(column, formattedWidget, layer.name)
            addLayerColumnConditionalStyleSettings(column, formattedWidget, layer.layerID, formattedDashboardModel, drivers)
        })
        addLayerVisualizationTypeSettings(layer, formattedWidget)
    })
}

const getFormattedLayersAsNewMapWidgetLayer = (oldLayers: any): IMapWidgetLayer[] => {
    const formattedLayers = [] as IMapWidgetLayer[]

    oldLayers?.forEach((oldLayer: any) => {
        formattedLayers.push(getFormattedLayerAsNewMapWidgetLayer(oldLayer))
    })

    return formattedLayers
}

// TODO - Missing layer type and NEW LAYER ID
const getFormattedLayerAsNewMapWidgetLayer = (oldLayer: any): IMapWidgetLayer => {
    const formattedLayer = {
        type: oldLayer.type,
        id: oldLayer.layerID,
        name: oldLayer.name,
        layerId: oldLayer.layerID,
        layerType: ''
    }

    return formattedLayer
}

const addLayerColumnTooltipOptions = (oldColumn: any, formattedWidget: IWidget, layerName: string) => {
    if (oldColumn?.properties?.showTooltip) {
        formattedWidget.settings.tooltips.layers.push({ name: layerName, columns: [oldColumn.name] })
    }
}

const addLayerColumnConditionalStyleSettings = (oldColumn: any, formattedWidget: IWidget, layerId: string, formattedDashboardModel: IDashboard, drivers: IDashboardDriver[]) => {
    if (oldColumn && oldColumn.fieldType === 'MEASURE' && oldColumn.ranges) {
        oldColumn.ranges.forEach((range: any) => {
            const tempConditionalStyle = createConditionalStyleFromRange(oldColumn, range, layerId)
            addNonstaticConditionalStyles(tempConditionalStyle, range, formattedDashboardModel, drivers)
            formattedWidget.settings.conditionalStyles.enabled = true
            formattedWidget.settings.conditionalStyles.conditions.push(tempConditionalStyle)
        })
    }
}

const createConditionalStyleFromRange = (oldColumn: any, range: any, layerId: string) => {
    return {
        targetLayer: layerId,
        targetColumn: oldColumn.name,
        condition: { type: 'static', operator: range.operator, value: range.value },
        properties: { 'background-color': range['background-color'] ?? '' }
    } as IMapWidgetConditionalStyle
}

const addNonstaticConditionalStyles = (tempConditionalStyle: IMapWidgetConditionalStyle, range: any, formattedDashboardModel: IDashboard, drivers: IDashboardDriver[]) => {
    if (range.compareValueType === 'variable') {
        tempConditionalStyle.condition.type = 'variable'
        tempConditionalStyle.condition.variable = range.value
        updateConditionalStyleFromVariable(tempConditionalStyle, range, formattedDashboardModel)
    } else if (range.compareValueType === 'parameter') {
        tempConditionalStyle.condition.type = 'parameter'
        tempConditionalStyle.condition.parameter = range.value
        tempConditionalStyle.condition.value = getValueFromDriver(range.value, drivers)
    }
}

const updateConditionalStyleFromVariable = (conditionStyle: IMapWidgetConditionalStyle, range: any, formattedDashboardModel: IDashboard) => {
    const modelVariable = formattedDashboardModel.configuration.variables?.find((variable: IVariable) => variable.name === range.value)
    setConditionalStyleValueFromVariable(conditionStyle, modelVariable, range)
}

const setConditionalStyleValueFromVariable = (conditionStyle: IMapWidgetConditionalStyle, modelVariable: IVariable | undefined, rowThreshold: any) => {
    if (!modelVariable) return
    switch (modelVariable.type) {
        case 'static':
        case 'profile':
        case 'driver':
            conditionStyle.condition.value = modelVariable.value
            break
        case 'dataset':
            if (modelVariable.column) {
                conditionStyle.condition.value = modelVariable.value
            } else {
                conditionStyle.condition.variableKey = rowThreshold.compareValueKey
                conditionStyle.condition.variablePivotDatasetOptions = modelVariable.pivotedValues
                conditionStyle.condition.value = conditionStyle.condition.variableKey ? conditionStyle.condition.variablePivotDatasetOptions[conditionStyle.condition.variableKey] : ''
            }
    }
}

const getValueFromDriver = (driverUrl: string, drivers: IDashboardDriver[]) => {
    const index = drivers.findIndex((driver: IDashboardDriver) => driver.urlName === driverUrl)
    return index !== -1 ? drivers[index].value : ''
}

// TODO - What to do with target property/column etc?
const addLayerVisualizationTypeSettings = (oldLayer: any, formattedWidget: IWidget) => {
    const visualizationType = {
        id: crypto.randomUUID(),
        target: getModalColumnAsATarget(oldLayer),
        type: oldLayer.visualizationType,
        markerConf: getFormattedMarkerConf(oldLayer.markerConf),
        balloonConf: getFormattedBallonConf(oldLayer.balloonConf),
        pieConf: getFormattedPieConf(oldLayer.pieConf),
        clusterConf: getFormattedClusterConf(oldLayer.clusterConf),
        heatmapConf: getFormattedHeatmapConf(oldLayer.heatmapConf),
        analysisConf: getFormattedChoroplethConf(oldLayer.analysisConf),
        visible: oldLayer.defaultVisible ?? true
    } as IMapWidgetVisualizationType

    formattedWidget.settings.visualizations.push(visualizationType)
}

const getModalColumnAsATarget = (oldLayer: any) => {
    if (!oldLayer) return ''
    const modalColumn = oldLayer.content?.columnSelectedOfDataset?.find((column: any) => column.properties?.modal)
    return modalColumn ? modalColumn.name : ''
}

const getFormattedMarkerConf = (oldLayerMarkerConf: any): IMapWidgetVisualizationTypeMarker => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationMarkerConfiguration()
    if (!oldLayerMarkerConf) return defaultValues
    const formattedMarkerConfig = {
        type: oldLayerMarkerConf.type ?? 'default',
        style: {
            color: oldLayerMarkerConf.style?.color ?? defaultValues.style.color
        },
        icon: oldLayerMarkerConf.icon ?? defaultValues.icon,
        scale: oldLayerMarkerConf.scale ?? defaultValues.scale,
        url: oldLayerMarkerConf.url ?? defaultValues.url,
        img: oldLayerMarkerConf.img ?? defaultValues.img
    }

    return formattedMarkerConfig
}

const getFormattedBallonConf = (oldLayerBallonConf: any): IMapWidgetVisualizationTypeBalloons => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationBalloonsConfiguration()
    if (!oldLayerBallonConf) return defaultValues
    const formattedBaloonsConfig = {
        minSize: oldLayerBallonConf.minSize,
        maxSize: oldLayerBallonConf.maxSize,
        method: oldLayerBallonConf.method,
        classes: oldLayerBallonConf.classes,
        type: 'default' as 'default',
        style: {
            color: oldLayerBallonConf.fromColor ?? defaultValues.style.color
        },
        properties: {
            thresholds: oldLayerBallonConf.properties?.thresholds ?? []
        }
    }

    return formattedBaloonsConfig
}

const getFormattedPieConf = (oldLayerPieConf: any): IMapWidgetVisualizationTypePie => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationPieConfiguration()
    if (!oldLayerPieConf) return defaultValues
    const formattedPieConfig = { type: ['pie', 'bar'].includes(oldLayerPieConf.type) ? oldLayerPieConf.type : defaultValues.type, colors: defaultValues.colors }

    return formattedPieConfig
}

const getFormattedClusterConf = (oldLayerClusterConf: any): IMapWidgetVisualizationTypeCluster => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationClusterConfiguration()
    if (!oldLayerClusterConf) return defaultValues
    const formattedClusterConfig = {
        enabled: oldLayerClusterConf.enabled,
        radiusSize: oldLayerClusterConf.radiusSize,
        maxClusterRadius: defaultValues.maxClusterRadius,
        style: {
            'font-size': oldLayerClusterConf?.style?.['font-size'] ?? defaultValues.style['font-size'],
            color: oldLayerClusterConf?.style?.color ?? defaultValues.style.color,
            'background-color': oldLayerClusterConf?.style?.['background-color'] ?? defaultValues.style['background-color']
        }
    }

    return formattedClusterConfig
}

const getFormattedHeatmapConf = (oldLayerHeatmapConf: any): IMapWidgetVisualizationTypeHeatmap => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationHeatmapConfiguration()
    if (!oldLayerHeatmapConf) return defaultValues
    const formattedHeatmapConfig = {
        radius: oldLayerHeatmapConf.radius,
        blur: oldLayerHeatmapConf.blur,
        maxZoom: defaultValues.maxZoom
    }

    return formattedHeatmapConfig
}

const getFormattedChoroplethConf = (oldLayerAnalysisConf: any): IMapWidgetVisualizationTypeChoropleth => {
    const defaultValues = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    if (!oldLayerAnalysisConf) return defaultValues
    const formattedChoroplethConfig = {
        method: oldLayerAnalysisConf.method,
        classes: oldLayerAnalysisConf.classes,
        borderColor: oldLayerAnalysisConf.borderColor,
        minSize: oldLayerAnalysisConf.minSize ?? defaultValues.minSize,
        maxSize: oldLayerAnalysisConf.maxSize ?? defaultValues.maxSize,
        style: {
            color: oldLayerAnalysisConf.fromColor ?? defaultValues.style.color,
            toColor: oldLayerAnalysisConf.toColor ?? defaultValues.style.toColor,
            borderWidth: defaultValues.style.borderWidth
        },
        properties: {
            thresholds: oldLayerAnalysisConf.properties?.thresholds ?? []
        }
    }

    return formattedChoroplethConfig
}

export const getFormattedLegendSettingsFromOldLayers = (oldWidget: any, formattedWidget: IWidget) => {
    const oldLegend = oldWidget.style?.legend
    if (!oldLegend) return
    formattedWidget.settings.legend.enabled = true
    formattedWidget.settings.legend.title = oldLegend.title?.text ?? ''
}
