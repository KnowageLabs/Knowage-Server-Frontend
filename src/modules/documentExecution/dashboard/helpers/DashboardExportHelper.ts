import deepcopy from 'deepcopy'
import { IDashboard, IDashboardDataset, IDashboardDatasetDriver, IDashboardDriver, ISelection, IVariable, IWidget, IWidgetSearch } from '../Dashboard'
import { getTableWidgetLikeSelections } from './tableWidget/TableWidgetSearchHelper'

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
    likeSelections?: Record<string, Record<string, string>>
    xlsxStyleEnabled?: boolean
}

export const getDashboardXlsxStyleEnabled = (dashboard: Pick<IDashboard, 'configuration'> | null | undefined) => {
    return dashboard?.configuration?.menuWidgets?.xlsxStyleEnabled ?? false
}

export const getDashboardExportFileNameTemplate = (dashboard: Pick<IDashboard, 'configuration'> | null | undefined) => {
    return dashboard?.configuration?.menuWidgets?.exportFileName ?? ''
}

export const getDashboardExportVariables = (dashboard: Pick<IDashboard, 'configuration'> | null | undefined) => {
    return dashboard?.configuration?.variables ?? []
}

export const createDashboardSpreadsheetExportBody = (dashboard: IDashboardExportState) => {
    const body = deepcopy(dashboard) as IDashboardExportState & { xlsxStyleEnabled?: boolean }
    delete body.currentView
    body.xlsxStyleEnabled = getDashboardXlsxStyleEnabled(dashboard)
    return body
}

const getDashboardDatasetLabel = (dataset: IDashboardDataset | undefined) => dataset?.dsLabel ?? dataset?.label

export const createWidgetExportBody = (type: string, widget: IWidget, dashboard: IDashboardExportState, creationUser: string | undefined, locale: string, widgetSearch?: IWidgetSearch) => {
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
    const likeSelections =
        widget.type === 'table'
            ? getTableWidgetLikeSelections(
                  widgetSearch ?? (widget.search as IWidgetSearch | undefined),
                  getDashboardDatasetLabel(dataset)
              )
            : null
    if (likeSelections) body.likeSelections = likeSelections

    return body
}
