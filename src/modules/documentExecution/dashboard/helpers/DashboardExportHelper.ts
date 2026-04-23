import deepcopy from 'deepcopy'
import { IDashboard, IDashboardDatasetDriver, IDashboardDriver, ISelection, IVariable, IWidget } from '../Dashboard'

type IDashboardExportState = Pick<IDashboard, 'configuration'> & {
    currentView?: unknown
    selections?: ISelection[]
    drivers?: IDashboardDriver[]
}

type IWidgetExportBody = IWidget & {
    parameters: any[]
    selections: ISelection[]
    drivers: IDashboardDriver[]
    variables: IVariable[]
    creationUser: string | undefined
    locale: string
    datasetDrivers?: IDashboardDatasetDriver[]
    xlsxStyleEnabled?: boolean
}

export const getDashboardXlsxStyleEnabled = (dashboard: Pick<IDashboard, 'configuration'> | null | undefined) => {
    return dashboard?.configuration?.menuWidgets?.xlsxStyleEnabled ?? false
}

export const createDashboardSpreadsheetExportBody = (dashboard: IDashboardExportState) => {
    const body = deepcopy(dashboard) as IDashboardExportState & { xlsxStyleEnabled?: boolean }
    delete body.currentView
    body.xlsxStyleEnabled = getDashboardXlsxStyleEnabled(dashboard)
    return body
}

export const createWidgetExportBody = (type: string, widget: IWidget, dashboard: IDashboardExportState, creationUser: string | undefined, locale: string) => {
    const dataset = dashboard.configuration.datasets.find((dashboardDataset) => dashboardDataset.id === widget.dataset)
    const body = {
        ...deepcopy(widget),
        parameters: dataset?.parameters ?? [],
        selections: dashboard.selections ?? [],
        drivers: dashboard.drivers ?? [],
        variables: dashboard.configuration.variables ?? [],
        creationUser,
        locale
    } as IWidgetExportBody

    if (dataset?.drivers) body.datasetDrivers = dataset.drivers
    if (type === 'spreadsheet') body.xlsxStyleEnabled = getDashboardXlsxStyleEnabled(dashboard)

    return body
}
