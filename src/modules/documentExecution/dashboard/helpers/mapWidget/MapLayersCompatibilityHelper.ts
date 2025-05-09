import { IDashboard, IDashboardDriver, IVariable, IWidget } from '../../Dashboard'
import { IMapWidgetConditionalStyle } from '../../interfaces/mapWidget/DashboardMapWidget'
import * as mapWidgetDefaultValues from '../../widget/WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'

export const getFormattedSettingsFromLayers = (widget: any, formattedWidget: IWidget, formattedDashboardModel: IDashboard, drivers: IDashboardDriver[]) => {
    const layers = widget.content.layers
    layers?.forEach((layer: any) => {
        layer?.content?.columnSelectedOfDataset?.forEach((column: any) => {
            addLayerColumnTooltipOptions(column, formattedWidget, layer.name)
            addLayerColumnConditionalStyleSettings(column, formattedWidget, layer.layerId, formattedDashboardModel, drivers)
        })
        addLayerVisualizationTypeSettings(layer, formattedWidget)
    })
}

const addLayerColumnTooltipOptions = (oldColumn: any, formattedWidget: IWidget, layerName: string) => {
    if (oldColumn?.properties?.showTooltip) {
        formattedWidget.settings.tooltips.layers.push({ name: layerName, columns: [oldColumn.name] })
    }
}

const addLayerVisualizationTypeSettings = (layer: any, formattedWidget: IWidget) => {
    const visualizationType = {
        target: [layer.name],
        type: layer.visualizationType,
        markerConf: layer.markerConf,
        balloonConf: layer.balloonConf,
        pieConf: layer.pieConf,
        clusterConf: layer.clusterConf,
        heatmapConf: layer.heatmapConf,
        analysisConf: layer.analysisConf
    }
    if (!visualizationType.markerConf) visualizationType.markerConf = mapWidgetDefaultValues.getDefaultVisualizationMarkerConfiguration()
    if (!visualizationType.balloonConf) visualizationType.balloonConf = mapWidgetDefaultValues.getDefaultVisualizationBalloonsConfiguration()
    if (!visualizationType.pieConf) visualizationType.pieConf = mapWidgetDefaultValues.getDefaultVisualizationPieConfiguration()
    if (!visualizationType.clusterConf) visualizationType.clusterConf = mapWidgetDefaultValues.getDefaultVisualizationClusterConfiguration()
    if (!visualizationType.heatmapConf) visualizationType.heatmapConf = mapWidgetDefaultValues.getDefaultVisualizationHeatmapConfiguration()
    if (!visualizationType.analysisConf) visualizationType.analysisConf = mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
    formattedWidget.settings.visualizations.push(visualizationType)
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
