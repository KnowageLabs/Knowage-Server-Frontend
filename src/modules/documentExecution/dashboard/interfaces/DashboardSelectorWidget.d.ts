import { IWidgetResponsive, IWidgetTitle, IWidgetPaddingStyle, IWidgetBordersStyle, IWidgetShadowsStyle, IWidgetBackgroundStyle, IWidgetExports } from '../Dashboard'

export interface ISelectorWidgetSettings {
    isDateType: boolean
    sortingOrder: string
    updatable: boolean
    clickable: boolean
    configuration: ISelectorWidgetConfiguration
    style: ISelectorWidgetStyle
    responsive: IWidgetResponsive
}

export interface ISelectorWidgetConfiguration {
    selectorType: ISelectorWidgetSelectorType
    defaultValues: ISelectorWidgetDefaultValues
    valuesManagement: ISelectorWidgetValuesManagement
    exports: IWidgetExports
}

export interface ISelectorWidgetSelectorType {
    modality: 'singleValue' | 'multiValue' | 'dropdown' | 'multiDropdown' | 'date' | 'dateRange' | 'slider'
    alignment: 'vertical' | 'horizontal' | 'grid'
    columnSize: string
}

export interface ISelectorWidgetDefaultValues {
    enabled: boolean
    valueType?: '' | 'STATIC' | 'FIRST' | 'LAST'
    value?: string
    startDate?: Date | null
    endDate?: Date | null
}

export interface ISelectorWidgetValuesManagement {
    hideDisabled: boolean
    enableAll: boolean
}

export interface ISelectorWidgetStyle {
    themeId: number | null
    title: IWidgetTitle
    label: ISelectorWidgetLabelStyle
    radio: ISelectorWidgetRadioStyle
    checkbox: ISelectorWidgetCheckboxStyle
    dropdown: ISelectorWidgetDropdownStyle
    multiDropdown: ISelectorWidgetMultiDropdownStyle
    date: ISelectorWidgetDateStyle
    dateRange: ISelectorWidgetDateRangeStyle
    slider: ISelectorWidgetSliderStyle
    padding: IWidgetPaddingStyle
    borders: IWidgetBordersStyle
    shadows: IWidgetShadowsStyle
    background: IWidgetBackgroundStyle
}

export interface ISelectorWidgetLabelStyle {
    enabled: boolean
    wrapText: boolean
    properties: {
        'font-weight': string
        'font-style': string
        'font-size': string
        'font-family': string
        'justify-content': string
        color: string
        'background-color': string
    }
}

export interface ISelectorWidgetRadioStyle {
    size: string
    layout: 'column' | 'row' | 'grid'
    gridColumns?: string
    padding: string
    margin: string
    color: string
    keepColor?: boolean
    icon?: string
    checkedIcon?: string
    label?: ISelectorWidgetRadioLabelStyle
}

export interface ISelectorWidgetRadioLabelStyle {
    'font-weight': string
    'font-style': string
    'font-size': string
    'font-family': string
    color: string
    'background-color': string
}

export interface ISelectorWidgetCheckboxStyle {
    size: string
    layout: 'column' | 'row' | 'grid'
    gridColumns?: string
    padding: string
    margin: string
    color: string
    keepColor?: boolean
    icon?: string
    checkedIcon?: string
    label?: ISelectorWidgetCheckboxLabelStyle
}

export interface ISelectorWidgetCheckboxLabelStyle {
    'font-weight': string
    'font-style': string
    'font-size': string
    'font-family': string
    color: string
    'background-color': string
}

export interface ISelectorWidgetDropdownStyle {
    dense?: boolean
    denseOptions?: boolean
    icon?: string
    shape?: 'standard' | 'rounded' | 'rounded-left' | 'rounded-right' | 'rounded-top' | 'rounded-bottom' | 'squared' | 'borderless'
    type?: 'filled' | 'outlined'
    color?: string
    bgColor?: string
    darkMode?: boolean
}

export interface ISelectorWidgetMultiDropdownStyle {
    dense?: boolean
    denseOptions?: boolean
    icon?: string
    shape?: 'standard' | 'rounded' | 'rounded-left' | 'rounded-right' | 'rounded-top' | 'rounded-bottom' | 'squared' | 'borderless'
    type?: 'filled' | 'outlined'
    color?: string
    bgColor?: string
    darkMode?: boolean
    maxValues?: number
    counter?: boolean
    hint?: string
    chips?: boolean
}

export interface ISelectorWidgetDateStyle {
    dense?: boolean
    color?: string
    bgColor?: string
    darkMode?: boolean
}

export interface ISelectorWidgetDateRangeStyle {
    dense?: boolean
    color?: string
    bgColor?: string
    darkMode?: boolean
}

export interface ISelectorWidgetSliderStyle {
    layout?: 'vertical' | 'horizontal'
    dense?: boolean
    darkMode?: boolean
    color?: string
    thumbColor?: string
    labelColor?: string
    markerFontSize?: string
    switchMarkerLabelsSide?: boolean
    trackSize?: string
}
