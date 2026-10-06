import { Component } from 'vue'
import pivotDescriptor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/PivotTableWidget/PivotTableSettingsDescriptor.json'
import WidgetTitleStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetTitleStyle.vue'
import WidgetBordersStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetBordersStyle.vue'
import WidgetPaddingStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetPaddingStyle.vue'
import WidgetShadowsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetShadowsStyle.vue'
import WidgetBackgroundColorStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetBackgroundColorStyle.vue'
import WidgetRowsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/style/WidgetRowsStyle.vue'
import TableWidgetHeaders from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/TableWidget/style/TableWidgetHeaders.vue'
import TableWidgetColumnStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/TableWidget/style/TableWidgetColumnStyle.vue'
import TableWidgetSummaryStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/TableWidget/style/TableWidgetSummaryStyle.vue'
import TableWidgetPaginator from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/TableWidget/style/TableWidgetPaginator.vue'
import SelectorWidgetLabelStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetLabelStyle.vue'
import SelectorWidgetFlexStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetFlexStyle.vue'
import SelectorWidgetRadioStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetRadioStyle.vue'
import SelectorWidgetCheckboxStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetCheckboxStyle.vue'
import SelectorWidgetDropdownStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetDropdownStyle.vue'
import SelectorWidgetMultiDropdownStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetMultiDropdownStyle.vue'
import SelectorWidgetDateStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetDateStyle.vue'
import SelectorWidgetDateRangeStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetDateRangeStyle.vue'
import SelectorWidgetSliderStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetSliderStyle.vue'
import SelectorWidgetRangeStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetRangeStyle.vue'
import SelectorWidgetButtonToggleStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetButtonToggleStyle.vue'
import SelectorWidgetTreeStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetTreeStyle.vue'
import SelectorWidgetMultiTreeStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectorWidget/style/SelectorWidgetMultiTreeStyle.vue'
import SelectionsWidgetChipsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/SelectionsWidget/style/SelectionsWidgetChipsStyle.vue'
import PivotTableTotalsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/PivotTableWidget/style/PivotTableTotalsStyle.vue'
import PivotTableFieldsStyle from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/PivotTableWidget/style/PivotTableFieldsStyle.vue'
import ChartColorSettings from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/ChartWidget/common/ChartColorSettings.vue'
import { PREVIEW_DASHBOARD_ID } from '../canvas/DashboardThemeMockWidgets'

const TITLE_TOOLBAR_OPTIONS = [{ type: 'font-weight' }, { type: 'font-style' }, { type: 'font-size' }, { type: 'text-align' }, { type: 'font-family' }, { type: 'color' }, { type: 'background-color' }]

export interface IThemeSection {
    component: Component
    // Props each form needs besides `widgetModel` and `themeStyle`.
    props?: Record<string, unknown>
    // The form has an "Enabled" toggle (marked with kn-theme-enabled-toggle). The panel shows it in the section header instead.
    enabledInHeader?: boolean
}

// Every style section the theme editor can show, mapped to the form the widget editor already uses.
// A theme section with no entry here is not shown (for example the pivot crossTabHeaders).
export const THEME_SECTIONS: Record<string, IThemeSection> = {
    title: { component: WidgetTitleStyle, props: { toolbarStyleSettings: TITLE_TOOLBAR_OPTIONS, dashboardId: PREVIEW_DASHBOARD_ID }, enabledInHeader: true },
    borders: { component: WidgetBordersStyle, enabledInHeader: true },
    padding: { component: WidgetPaddingStyle, enabledInHeader: true },
    shadows: { component: WidgetShadowsStyle, enabledInHeader: true },
    background: { component: WidgetBackgroundColorStyle, enabledInHeader: true },
    headers: { component: TableWidgetHeaders },
    columns: { component: TableWidgetColumnStyle, enabledInHeader: true },
    columnGroups: { component: TableWidgetColumnStyle, props: { mode: 'columnGroups' }, enabledInHeader: true },
    rows: { component: WidgetRowsStyle },
    summary: { component: TableWidgetSummaryStyle },
    paginator: { component: TableWidgetPaginator },
    label: { component: SelectorWidgetLabelStyle, enabledInHeader: true },
    flex: { component: SelectorWidgetFlexStyle },
    radio: { component: SelectorWidgetRadioStyle },
    checkbox: { component: SelectorWidgetCheckboxStyle },
    dropdown: { component: SelectorWidgetDropdownStyle },
    multiDropdown: { component: SelectorWidgetMultiDropdownStyle },
    date: { component: SelectorWidgetDateStyle },
    dateRange: { component: SelectorWidgetDateRangeStyle },
    slider: { component: SelectorWidgetSliderStyle },
    range: { component: SelectorWidgetRangeStyle },
    buttonToggle: { component: SelectorWidgetButtonToggleStyle },
    tree: { component: SelectorWidgetTreeStyle },
    multiTree: { component: SelectorWidgetMultiTreeStyle },
    chips: { component: SelectionsWidgetChipsStyle },
    fieldHeaders: { component: PivotTableFieldsStyle, props: { fieldType: 'fieldHeaders' } },
    fields: { component: PivotTableFieldsStyle, props: { fieldType: 'fields' } },
    totals: { component: PivotTableTotalsStyle, props: { toolbarStyleSettings: pivotDescriptor.columnHeadersToolbarStyleOptions, totalType: 'totals' }, enabledInHeader: true },
    subTotals: { component: PivotTableTotalsStyle, props: { toolbarStyleSettings: pivotDescriptor.columnHeadersToolbarStyleOptions, totalType: 'subTotals' }, enabledInHeader: true },
    colors: { component: ChartColorSettings }
}
