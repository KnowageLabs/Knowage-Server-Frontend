import deepcopy from 'deepcopy'
import { IDashboard, IDashboardDataset, IDashboardDatasetDriver, IDashboardDriver, ISelection, IVariable, IWidget, IWidgetSearch } from '../Dashboard'
import { getTableWidgetLikeSelections } from './tableWidget/TableWidgetSearchHelper'

type IDashboardExportState = Pick<IDashboard, 'configuration'> & {
    currentView?: unknown
    selections?: ISelection[]
    drivers?: IDashboardDriver[]
    locale?: string
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

const defaultDashboardExportLocale = 'en-US'

const dashboardExportLocaleAliases: Record<string, string> = {
    ar: 'ar-EG',
    'ar-eg': 'ar-EG',
    ara: 'ar-EG',
    bg: 'bg-BG',
    'bg-bg': 'bg-BG',
    bul: 'bg-BG',
    da: 'da-DK',
    'da-dk': 'da-DK',
    dan: 'da-DK',
    de: 'de-DE',
    'de-de': 'de-DE',
    deu: 'de-DE',
    en: 'en-US',
    'en-gb': 'en-GB',
    'en-us': 'en-US',
    eng: 'en-US',
    es: 'es-ES',
    'es-es': 'es-ES',
    spa: 'es-ES',
    fr: 'fr-FR',
    'fr-fr': 'fr-FR',
    fra: 'fr-FR',
    he: 'he-IL',
    'he-il': 'he-IL',
    heb: 'he-IL',
    hu: 'hu-HU',
    'hu-hu': 'hu-HU',
    hun: 'hu-HU',
    it: 'it-IT',
    'it-it': 'it-IT',
    ita: 'it-IT',
    ja: 'ja-JP',
    'ja-jp': 'ja-JP',
    jpn: 'ja-JP',
    ko: 'ko-KR',
    'ko-kr': 'ko-KR',
    kor: 'ko-KR',
    pt: 'pt-BR',
    'pt-br': 'pt-BR',
    por: 'pt-BR',
    ru: 'ru-RU',
    'ru-ru': 'ru-RU',
    rus: 'ru-RU',
    sk: 'sk-SK',
    'sk-sk': 'sk-SK',
    slk: 'sk-SK',
    slo: 'sk-SK',
    tr: 'tr-TR',
    'tr-tr': 'tr-TR',
    tur: 'tr-TR',
    zh: 'zh-Hans-CN',
    'zh-cn': 'zh-Hans-CN',
    'zh-cn-#hans': 'zh-Hans-CN',
    'zh-hans-cn': 'zh-Hans-CN',
    zho: 'zh-Hans-CN'
}

const normalizeDashboardExportLocale = (locale?: string) => {
    if (!locale) return defaultDashboardExportLocale

    const normalizedLocale = locale.replaceAll('_', '-').trim().toLowerCase()
    if (dashboardExportLocaleAliases[normalizedLocale]) return dashboardExportLocaleAliases[normalizedLocale]

    const languageCode = normalizedLocale.split('-')[0]
    return dashboardExportLocaleAliases[languageCode] ?? defaultDashboardExportLocale
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

export const createDashboardSpreadsheetExportBody = (dashboard: IDashboardExportState, locale?: string) => {
    const body = deepcopy(dashboard) as IDashboardExportState & { xlsxStyleEnabled?: boolean; locale?: string }
    delete body.currentView
    body.xlsxStyleEnabled = getDashboardXlsxStyleEnabled(dashboard)
    body.locale = normalizeDashboardExportLocale(locale ?? body.locale)
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
        locale: normalizeDashboardExportLocale(locale)
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
