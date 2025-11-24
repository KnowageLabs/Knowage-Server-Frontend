import { IWidgetInteractions, IWidgetResponsive, IWidgetTitle, IWidgetBordersStyle, IWidgetBackgroundStyle, IWidgetPaddingStyle, IWidgetShadowsStyle, IWidgetExports, IDataset, IIcon, ITableWidgetLink } from './../../Dashboard.d'

export interface IMapWidgetSettings {
    configuration: IMapWidgetConfiguration
    visualizations: IMapWidgetVisualizationType[]
    conditionalStyles: IMapWidgetConditionalStyles
    legend: IMapWidgetLegend
    dialog: IMapDialogSettings
    tooltips: IMapTooltipSettings
    interactions: IMapWidgetInteractions
    style: IMapWidgetStyle
    responsive: IWidgetResponsive
}

export interface IMapWidgetInteractions {
    version: number
    selection: IMapWidgetSelectionConfiguration
    crossNavigation: IMapWidgetCrossNavigation
    preview: IMapWidgetPreview
    link: IMapWidgetLinkConfiguration
}

export interface IMapWidgetSelectionConfiguration {
    enabled: boolean
    selections: IMapWidgetSelection[]
}

export interface IMapWidgetSelection {
    vizualizationType: IMapWidgetVisualizationType | null
    column: IMapNormalisedInteractionColumn | null
    prefix: string | null
    suffix: string | null
    precision: number | null
}

export interface IMapNormalisedInteractionColumn {
    name: string
    alias: string
    type: string
}
export interface IMapWidgetCrossNavigation {
    enabled: boolean
    crossNavigationVizualizationTypes: IMapWidgetCrossNavigationVisualizationTypeConfig[]
}

export interface IMapWidgetCrossNavigationVisualizationTypeConfig {
    name: string
    vizualizationType: IMapWidgetVisualizationType | null
    column: IMapNormalisedInteractionColumn
    parameters: IWidgetInteractionParameter[]
}

export interface IMapWidgetLinkConfiguration {
    enabled: boolean
    linkVizualizationTypes: IMapWidgetLinkVisualizationTypeConfig[]
}

export interface IMapWidgetLinkVisualizationTypeConfig {
    vizualizationType: IMapWidgetVisualizationType | null
    column: IMapNormalisedInteractionColumn | null
    links: IMapWidgetLink[]
}
export interface IMapWidgetLink {
    type: string
    icon?: string
    baseurl: string
    column?: string
    action: string
    parameters: IWidgetInteractionParameter[]
}

export interface IMapWidgetPreview {
    enabled: boolean
    previewVizualizationTypes: IMapWidgetPreviewVisualizationTypeConfig[]
}

export interface IMapWidgetPreviewVisualizationTypeConfig {
    name: string
    vizualizationType: IMapWidgetVisualizationType | null
    dataset: number | null
    column: IMapNormalisedInteractionColumn | null
    parameters: IWidgetInteractionParameter[]
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
    label: string
    target: string
    targetType?: string
    targetDataset?: string
    targetDatasetForeignKeyColumn?: string
    targetMeasure?: any
    targetProperty?: any
    chartMeasures?: string[]
    targetDatasetMeasures?: string[]
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
        borderColor?: string
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
    label: string
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
        'border-color': string
        icon: string
    }
}

export interface IMapWidgetLegend {
    enabled: boolean
    position: string
    title: string
    visualizationTypes: IMapWidgetVisualizationTypeLegendSettings[]
    positionX?: number
    positionY?: number
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
    visualizations: IMapTooltipSettingsVisualizations[]
}

export interface IMapTooltipSettings {
    enabled: boolean
    visualizations: IMapTooltipSettingsVisualizations[]
}

export interface IMapTooltipSettingsVisualizations {
    label: string
    prefix: string
    suffix: string
    precision: number
    columns: any[]
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
    label: string
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
    id?: string
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
    isCalculatedField?: boolean
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
