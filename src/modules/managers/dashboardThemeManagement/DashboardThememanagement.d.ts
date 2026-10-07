import { ITableWidgetStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDiscoveryWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardDiscoveryWidget'
import { ISelectionWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectionsWidget'
import { ISelectorWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { ITextWidgetStyle as IGenericStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardTextWidget'

export interface IDashboardTheme {
    // The backend returns UUID strings.
    id: string | number | null
    themeName: string
    config: IDashboardThemeConfig
    isDefault: boolean
}

export type IDashboardThemeSharedSection = 'title' | 'borders' | 'padding' | 'shadows' | 'background'

// Stored next to `style`, never inside it: the dashboard copies every key of `style` into the widget.
export type IDashboardThemeInheritance = Partial<Record<IDashboardThemeSharedSection, boolean>>

export interface IDashboardThemeTypeConfig<T> {
    style: T
    inherit?: IDashboardThemeInheritance
}

export interface IDashboardThemeConfig {
    shared?: { style: IGenericStyle }
    text: IDashboardThemeTypeConfig<IGenericStyle>
    image: IDashboardThemeTypeConfig<IGenericStyle>
    chart: IDashboardThemeTypeConfig<IGenericStyle>
    html: IDashboardThemeTypeConfig<IGenericStyle>
    map: IDashboardThemeTypeConfig<IGenericStyle>
    customChart: IDashboardThemeTypeConfig<IGenericStyle>
    python: IDashboardThemeTypeConfig<IGenericStyle>
    r: IDashboardThemeTypeConfig<IGenericStyle>
    table: IDashboardThemeTypeConfig<ITableWidgetStyle>
    pivot: IDashboardThemeTypeConfig<any>
    discovery: IDashboardThemeTypeConfig<IDiscoveryWidgetStyle>
    activeSelections: IDashboardThemeTypeConfig<ISelectionWidgetStyle>
    selector: IDashboardThemeTypeConfig<ISelectorWidgetStyle>
}
