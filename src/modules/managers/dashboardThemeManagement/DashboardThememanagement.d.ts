import { ITableWidgetStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDiscoveryWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardDiscoveryWidget'
import { ISelectorWidgetStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { ITextWidgetStyle as IGenericStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardTextWidget'

export interface IDashboardTheme {
    id?: string
    themeName: string
    config: IDashboardThemeConfig
}

export interface IDashboardThemeConfig {
    text: { style: IGenericStyle }
    image: { style: IGenericStyle }
    chart: { style: IGenericStyle }
    html: { style: IGenericStyle }
    map: { style: IGenericStyle }
    customChart: { style: IGenericStyle }
    python: { style: IGenericStyle }
    r: { style: IGenericStyle }
    table: { style: ITableWidgetStyle }
    pivot: { style: any } //TODO: Pitati sta raditi za enterprise i basic pivot....
    discovery: { style: IDiscoveryWidgetStyle }
    activeSelections: { style: any } //TODO: Nmg da nadjem interface za active selections
    selector: { style: ISelectorWidgetStyle }
}
