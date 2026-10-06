import { ITextWidgetStyle as IGenericStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardTextWidget'
import { IDashboardThemeConfig, IDashboardThemeSharedSection } from './DashboardThememanagement'
import deepcopy from 'deepcopy'
import deepEqual from 'deep-equal'
import { ITableWidgetStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDiscoveryWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardDiscoveryWidget'
import { ISelectorWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { ISelectionWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectionsWidget'
import * as widgetCommonDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as tableWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/tableWidget/TableWidgetDefaultValues'
import * as selectorWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/selectorWidget/SelectorWidgetDefaultValues'
import * as selectionsWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/selectionsWidget/SelectionsWidgetDefaultValues'
import * as pivotWidgetDefaultValues from '@/modules/documentExecution/dashboard/widget/WidgetEditor/helpers/pivotTableWidget/PivotTableDefaultValues'
import { IPivotTableStyle } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import ChartColorSettingsDescriptor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/ChartWidget/common/ChartColorSettingsDescriptor.json'

export const getDefaultDashboardThemeConfig = () => {
    const defaultDashboardThemeConfig = {} as IDashboardThemeConfig
    const widgets = ['text', 'image', 'chart', 'html', 'map', 'customChart', 'python', 'r', 'table', 'pivot', 'discovery', 'activeSelections', 'selector', 'spacer']

    widgets.forEach((widget) => (defaultDashboardThemeConfig[widget] = createGenericWidgetStyle()))

    addUniqueTableWidgetStyles(defaultDashboardThemeConfig.table.style)
    addUniquePivotWidgetStyles(defaultDashboardThemeConfig.pivot.style)
    addUniqueDiscoveryWidgetStyles(defaultDashboardThemeConfig.discovery.style)
    addUniqueActiveSelectionsWidgetStyles(defaultDashboardThemeConfig.activeSelections.style)
    addUniqueSelectorWidgetStyles(defaultDashboardThemeConfig.selector.style)
    addUniqueChartWidgetStyles(defaultDashboardThemeConfig.chart.style)

    return defaultDashboardThemeConfig
}

const createGenericWidgetStyle = () => {
    return {
        style: {
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        } as IGenericStyle
    }
}

const addUniqueTableWidgetStyles = (config: ITableWidgetStyle) => {
    config.columns = tableWidgetDefaultValues.getDefaultColumnStyles()
    config.columnGroups = tableWidgetDefaultValues.getDefaultColumnStyles()
    config.headers = tableWidgetDefaultValues.getDefaultHeadersStyle()
    config.rows = tableWidgetDefaultValues.getDefaultRowsStyle()
    config.summary = tableWidgetDefaultValues.getDefualtSummryStyle()
    config.paginator = tableWidgetDefaultValues.getDefaultPaginatorStyle()
}

const addUniquePivotWidgetStyles = (config: IPivotTableStyle) => {
    config.fieldHeaders = pivotWidgetDefaultValues.getDefaultColumnStyles()
    config.fields = pivotWidgetDefaultValues.getDefaultColumnStyles()
    config.totals = pivotWidgetDefaultValues.getDefaultTotals()
    config.subTotals = pivotWidgetDefaultValues.getDefaultTotals()
}

const addUniqueDiscoveryWidgetStyles = (config: IDiscoveryWidgetStyle) => {
    config.columns = tableWidgetDefaultValues.getDefaultColumnStyles()
    config.headers = tableWidgetDefaultValues.getDefaultHeadersStyle()
    config.rows = tableWidgetDefaultValues.getDefaultRowsStyle()
}

const addUniqueActiveSelectionsWidgetStyles = (config: ISelectionWidgetStyle) => {
    config.chips = selectionsWidgetDefaultValues.getDefaultChipsStyle()
    config.rows = selectionsWidgetDefaultValues.getDefaultRowsStyle()
}

const addUniqueSelectorWidgetStyles = (config: ISelectorWidgetStyle) => {
    config.label = selectorWidgetDefaultValues.getDefaultLabelStyle()
    config.flex = selectorWidgetDefaultValues.getDefaultFlexStyle()
    config.radio = selectorWidgetDefaultValues.getDefaultRadioStyle()
    config.checkbox = selectorWidgetDefaultValues.getDefaultCheckboxStyle()
    config.dropdown = selectorWidgetDefaultValues.getDefaultDropdownStyle()
    config.multiDropdown = selectorWidgetDefaultValues.getDefaultMultiDropdownStyle()
    config.date = selectorWidgetDefaultValues.getDefaultDateStyle()
    config.dateRange = selectorWidgetDefaultValues.getDefaultDateRangeStyle()
    config.slider = selectorWidgetDefaultValues.getDefaultSliderStyle()
    config.range = selectorWidgetDefaultValues.getDefaultRangeStyle()
    config.buttonToggle = selectorWidgetDefaultValues.getDefaultButtonToggleStyle()
    config.tree = selectorWidgetDefaultValues.getDefaultTreeStyle()
    config.multiTree = selectorWidgetDefaultValues.getDefaultMultiTreeStyle()
}

const addUniqueChartWidgetStyles = (config: any) => {
    config.colors = ChartColorSettingsDescriptor.defaultColors as string[]
}

export const themeBackwardsCompatibility = (theme: IDashboardThemeConfig) => {
    if (theme.chart?.style) {
        const chartStyle = theme.chart.style as any
        if (!chartStyle.colors) addUniqueChartWidgetStyles(chartStyle)
    }

    if (theme.selector?.style) {
        const selectorStyle = theme.selector.style as ISelectorWidgetStyle
        if (!selectorStyle.radio) selectorStyle.radio = selectorWidgetDefaultValues.getDefaultRadioStyle()
        if (!selectorStyle.checkbox) selectorStyle.checkbox = selectorWidgetDefaultValues.getDefaultCheckboxStyle()
        if (!selectorStyle.dropdown) selectorStyle.dropdown = selectorWidgetDefaultValues.getDefaultDropdownStyle()
        if (!selectorStyle.multiDropdown) selectorStyle.multiDropdown = selectorWidgetDefaultValues.getDefaultMultiDropdownStyle()
        if (!selectorStyle.date) selectorStyle.date = selectorWidgetDefaultValues.getDefaultDateStyle()
        if (!selectorStyle.dateRange) selectorStyle.dateRange = selectorWidgetDefaultValues.getDefaultDateRangeStyle()
        if (!selectorStyle.slider) selectorStyle.slider = selectorWidgetDefaultValues.getDefaultSliderStyle()
        if (!selectorStyle.range) selectorStyle.range = selectorWidgetDefaultValues.getDefaultRangeStyle()
        if (!selectorStyle.buttonToggle) selectorStyle.buttonToggle = selectorWidgetDefaultValues.getDefaultButtonToggleStyle()
        if (!selectorStyle.tree) selectorStyle.tree = selectorWidgetDefaultValues.getDefaultTreeStyle()
        else {
            const treeDefaults = selectorWidgetDefaultValues.getDefaultTreeStyle()
            selectorStyle.tree.popupMode = selectorStyle.tree.popupMode ?? treeDefaults.popupMode ?? false
        }
        if (!selectorStyle.multiTree) selectorStyle.multiTree = selectorWidgetDefaultValues.getDefaultMultiTreeStyle()
        if (!selectorStyle.flex) selectorStyle.flex = selectorWidgetDefaultValues.getDefaultFlexStyle()
    }
}

// The widget types the theme editor shows. `spacer` and `r` stay in the saved config untouched: no widget uses their style.
export const EDITOR_WIDGET_TYPES = ['text', 'image', 'html', 'activeSelections', 'chart', 'selector', 'customChart', 'table', 'python', 'discovery', 'map', 'pivot'] as const
export type IEditorWidgetType = (typeof EDITOR_WIDGET_TYPES)[number]

export const SHARED_STYLE_SECTIONS: IDashboardThemeSharedSection[] = ['title', 'borders', 'padding', 'shadows', 'background']

// The title text is not a theme value: applyStylesToWidget keeps the widget's own text.
const comparableSection = (section: IDashboardThemeSharedSection, value: any) => {
    if (section !== 'title' || !value) return value
    const { text, ...rest } = value
    return rest
}

export const isSameSectionStyle = (section: IDashboardThemeSharedSection, first: any, second: any) => deepEqual(comparableSection(section, first), comparableSection(section, second), { strict: true })

// Adds the types a theme may miss, then the shared layer and the inherit flags. Themes saved before the shared layer
// get the most common value of each section as the shared value, and inherit it only where they already match it.
export const prepareThemeForEditor = (config: IDashboardThemeConfig) => {
    const defaults = getDefaultDashboardThemeConfig()
    EDITOR_WIDGET_TYPES.forEach((type) => {
        if (!config[type]?.style) config[type] = deepcopy(defaults[type])
    })
    themeBackwardsCompatibility(config)

    if (!config.shared?.style) {
        const shared = {} as any
        SHARED_STYLE_SECTIONS.forEach((section) => (shared[section] = deepcopy(getMostCommonSectionStyle(config, section))))
        config.shared = { style: shared }
    }

    EDITOR_WIDGET_TYPES.forEach((type) => {
        const inherit = config[type].inherit ?? {}
        SHARED_STYLE_SECTIONS.forEach((section) => {
            if (inherit[section] === undefined) inherit[section] = isSameSectionStyle(section, config[type].style[section], config.shared?.style[section])
        })
        config[type].inherit = inherit
    })
}

const getMostCommonSectionStyle = (config: IDashboardThemeConfig, section: IDashboardThemeSharedSection) => {
    const candidates = [] as { value: any; count: number }[]
    EDITOR_WIDGET_TYPES.forEach((type) => {
        const value = config[type].style[section]
        if (!value) return
        const candidate = candidates.find((existing) => isSameSectionStyle(section, existing.value, value))
        if (candidate) candidate.count++
        else candidates.push({ value, count: 1 })
    })
    candidates.sort((first, second) => second.count - first.count)
    return candidates[0]?.value ?? (createGenericWidgetStyle().style as any)[section]
}

// Copies the shared style into every type that inherits it, so the saved per-type style stays fully resolved.
export const resolveThemeInheritance = (config: IDashboardThemeConfig, sections: IDashboardThemeSharedSection[] = SHARED_STYLE_SECTIONS) => {
    if (!config.shared?.style) return
    EDITOR_WIDGET_TYPES.forEach((type) => {
        sections.forEach((section) => {
            if (!config[type]?.inherit?.[section]) return
            if (isSameSectionStyle(section, config[type].style[section], config.shared?.style[section])) return
            config[type].style[section] = deepcopy(config.shared?.style[section])
        })
    })
}

export const getTypesNotInheriting = (config: IDashboardThemeConfig, section: IDashboardThemeSharedSection) => EDITOR_WIDGET_TYPES.filter((type) => config[type]?.inherit?.[section] === false)

// Makes every widget type inherit the given shared sections again. Their own values for these sections are replaced.
export const inheritSharedInAllTypes = (config: IDashboardThemeConfig, sections: IDashboardThemeSharedSection[] = SHARED_STYLE_SECTIONS) => {
    EDITOR_WIDGET_TYPES.forEach((type) => {
        const typeConfig = config[type]
        if (!typeConfig) return
        typeConfig.inherit = { ...(typeConfig.inherit ?? {}) }
        sections.forEach((section) => {
            if (typeConfig.inherit) typeConfig.inherit[section] = true
        })
    })
    resolveThemeInheritance(config, sections)
}
