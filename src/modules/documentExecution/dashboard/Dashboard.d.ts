import { iInputColumn, iInputVariable, iOutputColumn } from '@/modules/managers/functionsCatalog/FunctionsCatalog'
import { IDrillOrderItem, IHighchartsDrilldown } from './interfaces/highcharts/DashboardHighchartsWidget'
import { IPivotFields } from './interfaces/pivotTable/DashboardPivotTableWidget'

export interface IDashboard {
    sheets: IDashboardSheet[]
    widgets: IWidget[]
    configuration: IDashboardConfiguration
    version: string
    allDatasetsLoaded?: boolean
    drivers?: IDashboardDatasetDriver[]
}

export interface IDashboardSheet {
    id: string
    index: number
    label: string
    widgets: { xxs: IWidgetSheetItem[]; xs: IWidgetSheetItem[]; sm: IWidgetSheetItem[]; md: IWidgetSheetItem[]; lg: IWidgetSheetItem[] }
}

export interface IWidgetSheetItem {
    id: string
    h: number
    i: string
    w: number
    x: number
    y: number
    moved: boolean
}

export interface IDashboardConfiguration {
    id: string
    name: string
    label: string
    description: string
    cssToRender: string
    associations: IAssociation[]
    datasets: IDashboardDataset[]
    variables: IVariable[]
    selections: ISelection[]
    theme: any
    background: IBackground
    menuWidgets: IMenuAndWidgets
    customHeader?: IWidget | null
}

export interface IDatasetParameter {
    name: string
    type: 'static' | 'dynamic'
    value: string
}

export interface ISheet {
    label: string
    icon?: string
    widgets: Array<object>
    id?: string
}

export interface IWidget {
    id?: string
    dataset: number | null
    type: string
    columns: IWidgetColumn[]
    settings: any
    new?: boolean
    fields?: IPivotFields
    layers?: any
    state?: any
    search?: any
    invalid?: any
    locked?: boolean
}

export interface ITableWidgetSettings {
    sortingColumn?: string
    sortingOrder?: string
    updatable: boolean
    clickable: boolean
    conditionalStyles: ITableWidgetConditionalStyles
    configuration: ITableWidgetConfiguration
    interactions: IWidgetInteractions
    pagination: ITableWidgetPagination
    style: ITableWidgetStyle
    tooltips: ITableWidgetTooltipStyle[]
    visualization: ITableWidgetVisualization
    responsive: IWidgetResponsive
}

export interface ITableWidgetConditionalStyles {
    enabled: boolean
    conditions: ITableWidgetConditionalStyle[]
}

export interface ITableWidgetConditionalStyle {
    target: string
    applyToWholeRow?: boolean
    condition: {
        type: string
        variable?: string
        parameter?: string
        variableKey?: string
        variablePivotDatasetOptions?: any
        operator: string
        value: string
        formula?: string
    }
    properties: {
        'text-align': string
        'justify-content': string
        'font-family': string
        'font-size': string
        'font-style': string
        'font-weight': string
        color: string
        'background-color': string
        icon: string
    }
}
export interface ITableWidgetConfiguration {
    columnGroups: ITableWidgetColumnGroups
    exports: IWidgetExports
    headers: ITableWidgetHeaders
    rows: ITableWidgetRows
    summaryRows: ITableWidgetSummaryRows
    customMessages: ITableWidgetCustomMessages
}

export interface ITableWidgetColumnGroups {
    enabled: boolean
    groups: ITableWidgetColumnGroup[]
}

export interface ITableWidgetColumnGroup {
    id: string
    label: string
    columns: string[]
}

export interface IWidgetExports {
    pdf?: {
        enabled: boolean
        custom: {
            height: number
            width: number
            enabled: boolean
        }
        a4landscape: boolean
        a4portrait: boolean
    }
    showExcelExport: boolean
    showScreenshot?: boolean
}

export interface ITableWidgetHeaders {
    enabled: boolean
    enabledMultiline: boolean
    custom: {
        enabled: boolean
        rules: ITableWidgetHeadersRule[]
    }
}

export interface ITableWidgetHeadersRule {
    target: string[]
    action: string
    compareType?: string
    variable?: string
    variableKey?: string
    variablePivotDatasetOptions?: any
    value?: string
    parameter?: string
}

export interface ITableWidgetRows {
    indexColumn: boolean
    rowSpan: {
        enabled: boolean
        column: string
    }
}

export interface ITableWidgetSummaryRows {
    enabled: boolean
    list: ITableWidgetSummaryRow[]
    style: { pinnedOnly: boolean }
}

export interface ITableWidgetCustomMessages {
    hideNoRowsMessage: boolean
    noRowsMessage: string
}

export interface ITableWidgetSummaryRow {
    label: string
    aggregation: string
}

export interface IWidgetInteractions {
    crossNavigation: IWidgetCrossNavigation
    link?: IWidgetLinks
    preview?: IWidgetPreview
    selection?: IWidgetSelection
    drilldown?: IHighchartsDrilldown
    iframe?: IFrameInteractionSettings
}

export interface IWidgetCrossNavigation {
    enabled: boolean
    type: string
    column: string
    icon?: string
    label?: string
    name: string
    parameters: IWidgetInteractionParameter[]
    multiselection?: {
        enabled: boolean
        properties: {
            'background-color': string
            color: string
        }
    }
}

export interface IWidgetLinks {
    enabled: boolean
    multiselection?: {
        enabled: boolean
        properties: {
            'background-color': string
            color: string
        }
    }
    links: ITableWidgetLink[]
}

export interface ITableWidgetLink {
    type: string
    icon?: string
    baseurl: string
    column?: string
    action: string
    parameters: IWidgetInteractionParameter[]
}

export interface IWidgetInteractionParameter {
    enabled: boolean
    name: string
    type: string
    dataType: string
    value?: string
    column?: string
    driver?: string
    dataset?: string
    json?: string
    useAsResource?: boolean
}

export interface IWidgetPreview {
    enabled: boolean
    type: string
    parameters: IWidgetInteractionParameter[]
    dataset: number
    column?: string
    directDownload: boolean
    icon?: string
    multiselection?: {
        enabled: boolean
        properties: {
            'background-color': string
            color: string
        }
    }
}

export interface IWidgetSelection {
    enabled: boolean
    type?: string
    column?: string
    icon?: string
    modalColumn?: string
    multiselection?: {
        enabled: boolean
        properties: {
            'background-color': string
            color: string
        }
    }
}

export interface IFrameInteractionSettings {
    enabled: boolean
    type: string
    column: string
    icon?: string
    label?: string
    json: string
}

export interface ITableWidgetPagination {
    enabled: boolean
    properties: {
        offset: number
        itemsNumber: number
        totalItems: number
    }
}

export interface ITableWidgetStyle {
    themeId: number | null
    columns: ITableWidgetColumnStyles
    columnGroups: ITableWidgetColumnStyles
    headers: ITableWidgetHeadersStyle
    rows: IWidgetRowsStyle
    summary: ITableWidgetSummaryStyle
    paginator: ITableWidgetPaginatorStyle
    title: IWidgetTitle
    background: IWidgetBackgroundStyle
    borders: IWidgetBordersStyle
    padding: IWidgetPaddingStyle
    shadows: IWidgetShadowsStyle
}

export interface IWidgetBordersStyle {
    enabled: boolean
    properties: {
        'border-bottom-left-radius': string
        'border-bottom-right-radius': string
        'border-style': string
        'border-top-left-radius': string
        'border-top-right-radius': string
        'border-width': string
        'border-color': string
    }
}

export interface ITableWidgetColumnStyles {
    enabled: boolean
    styles: ITableWidgetColumnStyle[]
}

export interface ITableWidgetColumnStyle {
    target: string | string[]
    properties: {
        'align-items': string
        width: string | number
        'background-color': string
        color: string
        'justify-content': string
        'font-size': string
        'font-family': string
        'font-style': string
        'font-weight': string
    }
}

export interface ITableWidgetHeadersStyle {
    height: number
    properties: {
        'background-color': string
        color: string
        'justify-content': string
        'font-size': string
        'font-family': string
        'font-style': string
        'font-weight': string
    }
}

export interface IWidgetPaddingStyle {
    enabled: boolean
    properties: {
        'padding-top': string
        'padding-left': string
        'padding-bottom': string
        'padding-right': string
        unlinked: boolean
    }
}

export interface IWidgetRowsStyle {
    height: number
    alternatedRows: {
        enabled: boolean
        evenBackgroundColor: string
        oddBackgroundColor: string
    }
}

export interface IWidgetShadowsStyle {
    enabled: boolean
    properties: {
        'box-shadow': string
        color: string
    }
}

export interface ITableWidgetSummaryStyle {
    'font-family': string
    'font-style': string
    'font-size': string
    'font-weight': string
    color: string
    'background-color': string
    'justify-content': string
}

export interface ITableWidgetPaginatorStyle {
    color: string
    'background-color': string
    'justify-content': string
}

export interface ITableWidgetTooltipStyle {
    target: string | string[]
    enabled: boolean
    prefix: string
    suffix: string
    precision: number
    header: {
        enabled: boolean
        text: string
    }
}

export interface ITableWidgetVisualization {
    visualizationTypes: ITableWidgetVisualizationTypes
    visibilityConditions: ITableWidgetVisibilityConditions
}

export interface ITableWidgetVisualizationTypes {
    enabled: boolean
    types: ITableWidgetVisualizationType[]
}

export interface ITableWidgetVisualizationType {
    target: string | string[]
    type: string
    dateFormat?: string
    precision?: number
    prefix?: string
    suffix?: string
    pinned?: string
    maximumCharacters?: number
    min?: number
    max?: number
    alignment?: string
    color?: string
    'background-color'?: string
}

export interface ITableWidgetVisibilityConditions {
    enabled: boolean
    conditions: ITableWidgetVisibilityCondition[]
}

export interface ITableWidgetVisibilityCondition {
    target: string[]
    hide: boolean
    hidePdf: boolean
    hideFromSummary: boolean
    condition: {
        type: string
        variable?: string
        variableValue?: string
        variableKey?: string
        operator?: string
        value?: string
        variablePivotDatasetOptions?: any
    }
}

export interface IWidgetResponsive {
    fullGrid: boolean
    xxs: boolean
    xs: boolean
    sm: boolean
    md: boolean
    lg: boolean
}

export interface IWidgetColumn {
    id?: string
    columnName: string
    alias: string
    type: string
    fieldType: string
    multiValue: boolean
    aggregation: string
    aggregationColumn?: string | null
    filter: IWidgetColumnFilter
    formula?: string
    formulaEditor?: string
    drillOrder?: IDrillOrderItem
    orderColumn?: string
    orderType?: string
    sort?: string
    serieType?: string
    axis?: string
    scatterAttributeAsMeasure?: boolean
}

export interface IWidgetColumnFilter {
    enabled: boolean
    operator: string
    value: string
    value2?: string
}

export interface IDashboardDataset {
    id: number
    label: string
    cache: boolean
    dsLabel?: string
    parameters?: any[]
    drivers?: IDashboardDatasetDriver[]
    indexes?: any[]
    frequency?: number
}

export interface IDashboardDatasetDriver {
    urlName: string
    parameterValue: { value: string | number | Date; description: string }[]
    type: string
    defaultValue: { value: string; description: string }[] | null
    label: string
    driverLabel: string
    multivalue: boolean
    typeCode: string
    selectionType: string
    options?: { value: string; description: string }[]
    displayDate?: string
    allowInternalNodeSelection?: boolean
    dataDependencies?: any
    dataDependsOnParameters?: IDashboardDatasetDriver[]
    dataDependentParameters?: IDashboardDatasetDriver[]
    value?: any
}

export interface IWidgetPickerType {
    description: string
    name: string
    type: string
    functionality?: string
    enterpriseOnly?: boolean
}

export interface IDatasetOptions {
    aggregations: {
        measures: any[]
        categories: IDatasetOptionCategory[]
        dataset: string
    }
    parameters: any
    selections: any
    indexes: any[]
}

export interface IDatasetOptionCategory {
    id: string
    alias: string
    columnName: string
    orderType: string
    funct: string
}

export interface IDatasetColumn {
    dataset?: number
    name: string
    alias: string
    type: string
    properties: any
    fieldType: string
    multiValue: boolean
    precision: number
    scale: number
    personal: boolean
    decrypt: boolean
    subjectId: boolean
}

export interface IDataset {
    id: {
        dsId: number
        versionNum: number
        organization: string
    }
    name: string
    description: string
    label: string
    active: boolean
    type: string
    configuration: any
    pivotColumnName: string
    pivotRowName: string
    pivotColumnValue: string
    numRows: boolean
    persisted: boolean
    persistedHDFS: boolean
    persistTableName: string
    owner: string
    userIn: any
    userUp: any
    userDe: any
    sbiVersionIn: any
    sbiVersionUp: any
    sbiVersionDe: any
    metaVersion: any
    timeIn: any
    timeUp: any
    timeDe: any
    scope: any
    federation: any
    tags: any[]
    scopeId: number
    transformerId: number
    metadata: {
        fieldsMeta: any[]
        properties: any
    }
    categoryId: number
    parameters: IDatasetParameters[]
    isRealtime: boolean
    isCachingSupported: boolean
    isIterable: boolean
    isNearRealtimeSupported: boolean
    cache?: boolean
    indexes?: any[]
    drivers?: any[]
}

interface IDatasetParameters {
    name: string
    type: string
    defaultValue: string
    multiValue: boolean
}

interface IAssociation {
    id: string
    fields: IAssociationField[]
    validation?: {
        isValid: boolean
        msg: string
    }
}

interface IBackground {
    sheetsBackgroundColor: string
    imageBackgroundUrl: string
    imageBackgroundSize: string
    showGrid: boolean
}

interface IMenuAndWidgets {
    showExcelExport: boolean
    showScreenshot: boolean
    showSelectionButton: boolean
    enableChartChange: boolean
    enableCaching: boolean
    enableCustomHeader: boolean
    enableWidgetMenu: boolean
}

interface IAssociationField {
    column: string
    dataset: number
}

interface IDashboardDatasetParameter {
    multivalue: boolean
    name: string
    type: string
    value: string
}

export interface IIcon {
    category: string
    className: string
    fontFamily: string
    fontWeight: number
    id: number
    label: string
    unicode: string
    visible: boolean
}

export interface IWidgetStyleToolbarModel {
    'font-weight'?: string
    'font-style'?: string
    'font-size'?: string
    'font-family'?: string
    'justify-content'?: string
    'text-align'?: string
    'border-color'?: string
    'padding-left'?: string
    'padding-right'?: string
    color?: string
    'background-color'?: string
    icon?: string
    textOutline?: string
}

export interface IVariable {
    name: string
    type: string
    value: string
    dataset?: number
    column?: string
    attribute?: string
    driver?: string
    pivotedValues?: any
    executionTime?: string | null
    executionDate?: string | null
    dateTimeFormat?: string | null
    locale?: string
    activeSelectionDataset?: number | null
    activeSelectionColumn?: string | null
}

export interface IWidgetTitle {
    enabled: boolean
    text: string
    height: number
    properties: {
        'font-weight': string
        'font-style': string
        'font-size': string
        'font-family': string
        'justify-content': string
        color: string
        'background-color': string
        'padding-left'?: string
        'padding-right'?: string
    }
}

export interface IWidgetBackgroundStyle {
    enabled: boolean
    properties: {
        'background-color': string
    }
}

export interface ISelection {
    datasetId: number
    datasetLabel: string
    columnName: string
    value: (string | number)[]
    aggregated: boolean
    timestamp: number
    locked?: boolean
}

export interface IDashboardDriver {
    name: string
    type: string
    multivalue: boolean
    value: string
    urlName: string
    driverLabel: string
}

export interface IGalleryItem {
    id: string
    author: string
    name: string
    label: string
    description: string
    type: string
    tags: string[]
    image: string
    organization: string
    usageCounter: number
    code: IGalleryitemCode
}

interface IGalleryitemCode {
    html: string
    javascript: string
    python: string
    css: string
}

export interface IChartType {
    label: string
    value: string
    disabled: boolean
    eeOnly?: boolean
}

export interface IDashboardCrossNavigation {
    crossBreadcrumb: string
    crossId: number
    crossName: string
    crossText: string
    crossType: number
    document: any
    documentId: number
    navigationParams: any
    popupOptions: any
}

export interface IDashboardOutputParameter {
    biObjectId: number
    formatCode: string | null
    formatValue: string | null
    id: number
    isUserDefined: boolean
    name: string
    type: IDashboardOutputParameterType
}

interface IDashboardOutputParameterType {
    domainCode: string
    domainName: string
    translatedValueDescription: string
    translatedValueName: string
    valueCd: string
    valueDescription: string
    valueId: number
    valueName: string
}

export interface IMenuItem {
    label: string
    icon: string
    command: Function
    visible: boolean
}

export interface IDashboardView {
    id?: string
    label: string
    name: string
    description: string
    drivers: any
    settings: any
    biObjectId: number
    parentId: string
    visibility: string
    type?: string
    biObjectTypeCode?: string
    new?: boolean
}

export interface IWidgetSearch {
    searchText: string
    searchColumns: string[]
}

export interface IHighchartsCommonConditionalStyles {
    enabled: boolean
    conditions: IHighchartsCommonConditionalStyle[]
}

export interface IHighchartsCommonConditionalStyle {
    target: string
    condition: {
        type: string
        variable?: string
        parameter?: string
        variableKey?: string
        variablePivotDatasetOptions?: any
        operator: string
        value: string
        formula?: string
    }
    properties: {
        color: string
    }
}

export interface IWidgetHelpSettings {
    enabled: boolean
    type: 'free-text' | 'link'
    text: string
    url: string
    visualizationType: 'pop-up' | 'tooltip'
    icon: string
    iconPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    popupWidth: string
    popupHeight: string
}

export interface IWidgetFunctionColumn {
    id?: string
    columnName: string
    alias: string
    fieldType: string
    catalogFunctionId: string | null
    catalogFunctionConfig: IWidgetFunctionColumnConfig
    funct: string
    orderColumn: string
    type: string
    multiValue: boolean
    aggregation: string
    filter: IWidgetColumnFilter | null
    formula?: string
    formulaEditor?: string
    drillOrder?: IDrillOrderItem
    orderType?: string
    sort?: string
    serieType?: string
    axis?: string
    originalFunctionColumnName?: string
}

export interface IWidgetFunctionColumnConfig {
    inputColumns: iInputColumn[]
    inputVariables: iInputVariable[]
    outputColumns: iOutputColumn[]
    environment: string | null
}
export interface SelectorDataMap {
    [widgetId: string]: SelectorDataContainer
}

export interface SelectorDataContainer {
    widgetData: WidgetData
    selectorOptions: SelectorOption[]
    initialData: WidgetData
}

export interface WidgetData {
    metaData: MetaData
    results: number
    rows: Row[]
    stats: Stats
    initialCall: boolean
}

export interface MetaData {
    totalProperty: string
    root: string
    id: string
    fields: (string | FieldDefinition)[]
    cacheDate: string
}

export interface FieldDefinition {
    name: string
    header: string
    dataIndex: string
    type: string
    multiValue: boolean
}

export interface Row {
    id: number
    [columnKey: string]: any
}

export interface SelectorOption {
    id: number
    [columnKey: string]: any
    disabled: boolean
}

export interface Stats {
    [columnIndex: string]: ColumnStats
}

export interface ColumnStats {
    name: string
    max: string
    min: string
    distinct: string[]
    cardinality: number
}
