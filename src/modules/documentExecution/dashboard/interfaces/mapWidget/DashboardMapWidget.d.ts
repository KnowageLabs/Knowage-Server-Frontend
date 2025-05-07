import { IWidgetInteractions, IWidgetResponsive, IWidgetTitle, IWidgetBordersStyle, IWidgetBackgroundStyle, IWidgetPaddingStyle, IWidgetShadowsStyle, IWidgetExports, IDataset, IIcon } from './../../Dashboard.d'

export interface IMapWidgetSettings {
    updatable: boolean
    clickable: boolean
    configuration: IMapWidgetConfiguration
    visualizations: IMapWidgetVisualizationType[]
    conditionalStyles: IMapWidgetConditionalStyles
    legend: IMapWidgetLegend
    dialog: IMapDialogSettings
    tooltip: IMapTooltipSettings
    interactions: IWidgetInteractions
    style: IMapWidgetStyle
    responsive: IWidgetResponsive
}

export interface IMapWidgetConfiguration {
    map: IMapWidgetMapSettings
    controlPanel: IMapWidgetControlPanel
    exports: IWidgetExports
}

export interface IMapWidgetMapSettings {
    zoom: number | null
    showScale: boolean
    autoCentering: boolean
}

export interface IMapWidgetControlPanel {
    alwaysShow: boolean
    dimension: string
}

export interface IMapWidgetVisualizationType {
    id?: string
    target: string
    targetType?: string
    targetDataset?: string
    targetMeasure?: any
    targetProperty?: any
    chartMeasures?: string[]
    visible: boolean
    type: string
    markerConf?: IMapWidgetVisualizationTypeMarker
    balloonConf?: IMapWidgetVisualizationTypeBalloons
    pieConf?: IMapWidgetVisualizationTypePie
    clusterConf?: IMapWidgetVisualizationTypeCluster
    heatmapConf?: IMapWidgetVisualizationTypeHeatmap
    analysisConf?: IMapWidgetVisualizationTypeChoropleth
    properties?: IMapWidgetLayerProperty[]
    filter?: IMapWidgetLayerFilter
    layerName?: string
}

export interface IMapWidgetVisualizationTypeMarker {
    type: string
    style: {
        color?: string
    }
    size?: number
    icon?: IIcon
    scale?: number
    url?: string
    img?: string
}

export interface IMapWidgetVisualizationTypeBalloons {
    minSize: number
    maxSize: number
    method: string
    classes: number
    size?: number
    type: 'default'
    style: {
        color?: string
    }
    properties?: {
        thresholds: IMapWidgetVisualizationThreshold[]
    }
}

export interface IMapWidgetVisualizationThreshold {
    color: string
    from: number
    to: number
}

export interface IMapWidgetVisualizationTypePie {
    type: string
    colors: string[]
}

export interface IMapWidgetVisualizationTypeCluster {
    enabled: boolean
    radiusSize: number
    maxClusterRadius: number
    style: {
        'font-size'?: string
        color?: string
        'background-color'?: string
    }
}

export interface IMapWidgetVisualizationTypeHeatmap {
    radius: number
    blur: number
    maxZoom: number
}

export interface IMapWidgetVisualizationTypeChoropleth {
    method: string
    classes: number
    borderColor: string
    minSize: number
    maxSize: number
    style: {
        color?: string
        toColor?: string
        borderWidth?: number
    }
    properties?: {
        thresholds: IMapWidgetVisualizationThreshold[]
    }
}

export interface IMapWidgetConditionalStyles {
    enabled: boolean
    conditions: IMapWidgetConditionalStyle[]
}

export interface IMapWidgetConditionalStyle {
    targetLayer: string
    targetColumn: string
    condition: {
        type: string
        variable?: string
        parameter?: string
        variableKey?: string
        variablePivotDatasetOptions?: any
        operator: string
        value: string
    }
    properties: {
        'background-color': string
        icon: string
    }
}

export interface IMapWidgetLegend {
    enabled: boolean
    position: string
    title: string
    visualizationTypes: IMapWidgetVisualizationTypeLegendSettings[]
}

export interface IMapWidgetVisualizationTypeLegendSettings {
    visualizationType: IMapWidgetVisualizationType | null
    text: string
}

export interface IMapWidgetLegendTitle {
    text: string
}

export interface IMapWidgetLegendText {
    text: string
}

export interface IMapDialogSettings {
    enabled: boolean
    style: {
        'justify-content': string
        'font-family': string
        'font-size': string
        'font-style': string
        'font-weight': string
        color: string
        'background-color': string
    }
    layers: IMapDialogSettingsProperty[]
}

export interface IMapDialogSettingsProperty {
    name: string
    columns: string[]
}

export interface IMapTooltipSettings {
    enabled: boolean
    layers: IMapTooltipSettingsLayer[]
}

export interface IMapTooltipSettingsLayer {
    name: string
    columns: string[]
}

export interface IMapWidgetStyle {
    themeId: number | null
    title: IWidgetTitle
    borders: IWidgetBordersStyle
    background: IWidgetBackgroundStyle
    padding: IWidgetPaddingStyle
    shadows: IWidgetShadowsStyle
}

export interface ILayer {
    layerId: number
    name: string
    descr: string
    type: string
    label: string
    baseLayer: false
    layerDef: string
    pathFile: string
    layerLabel: string
    layerName: string
    layerIdentify: string
    layerURL: any
    layerOptions: any
    layerParams: any
    layerOrder: number
    category_id: any
    category: any
    roles: any
    properties: string[]
    filebody: any
}

export interface IMapWidgetLayer {
    type: string
    id: number
    name: string
    columns?: IWidgetMapLayerColumn[]
    order?: number
    layerId: string
    layerType: string
    datasetLink?: number
    datasetColumnLink?: number
    catalogLayerPropertyLink?: number
    properties?: IMapWidgetLayerProperty[]
}

export interface IMapWidgetLayerFilter {
    enabled?: boolean
    column?: string | null
    operator?: string
    value?: string
    reloaded?: false
}

export interface IMapWidgetLayerProperty {
    property: string
}

export interface IWidgetMapLayerColumn {
    name: string
    alias: string
    type: string
    properties: {
        aggregateBy: boolean
        coordType: string
        coordFormat: string
        showTooltip: boolean
        modal: boolean
        showMap?: boolean
        showFilter?: boolean
    }
    fieldType: string
    multiValue: boolean
    precision: number
    scale: number
    personal: boolean
    decrypt: boolean
    subjectId: boolean
    aliasToShow: string
    aggregationSelected?: string
    deleted?: boolean
    formula?: string
}

export interface ILayerFeature {
    type: string
    geometry: {
        type: string
        coordinates: [number, number]
    }
    properties: {
        [key: string]: string | number
    }
}
