import { iParameter } from '@/components/UI/KnParameterSidebar/KnParameterSidebar'
import { loadNavigationParamsInitialValue } from './DocumentExecutionAngularCrossNavigationHelper'
import { AxiosResponse } from 'axios'
import { loadNavigationInitialValuesFromDashboard } from './DocumentExecutionCrossNavigationHelper'
import { getValidDate } from './DocumentExecutionHelpers'
import { IDashboardView } from '../dashboard/Dashboard'
import { IURLDriver } from './DocumentExecution'
import store from '@/App.store.js'
import i18n from '@/App.i18n'

const { t } = i18n.global
const mainStore = store()

export const loadFilters = async (
    initialLoading: boolean,
    filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean },
    document: any,
    breadcrumbs: any[],
    userRole: string | null,
    parameterValuesMap: any,
    tabKey: string,
    sessionEnabled: boolean,
    $http: any,
    dateFormat: string,
    route: any,
    vueComponenet: any
) => {
    if (parameterValuesMap && parameterValuesMap[document.label + '-' + tabKey] && initialLoading) return loadFiltersFromParametersMap(parameterValuesMap, document, tabKey, filtersData, breadcrumbs)
    if (sessionEnabled && !document.navigationParams) {
        const filtersFromSession = loadFiltersFromSession(document, filtersData, breadcrumbs)
        if (filtersFromSession.filterStatus) return filtersFromSession
    }

    if (route.query.crossNavigationParameters) {
        document.formattedCrossNavigationParameters = JSON.parse(route.query.crossNavigationParameters)
        document.navigationFromDashboard = true
    }

    filtersData = await getFilters(document, userRole, $http)
    formatDrivers(filtersData, dateFormat)

    if (document.navigationParams || document.formattedCrossNavigationParameters) {
        if (document.navigationFromDashboard) loadNavigationInitialValuesFromDashboard(document, filtersData, dateFormat)
        else {
            vueComponenet.filtersData = filtersData
            loadNavigationParamsInitialValue(vueComponenet)
        }
    } else if (route.query.params) {
        const driversFromUrl = JSON.parse(atob(route.query.params))
        filtersData = getFormattedDriversFromURL(driversFromUrl, filtersData)
    }
    setFiltersForBreadcrumbItem(breadcrumbs, filtersData, document)

    return filtersData
}

const getFormattedDriversFromURL = (driversFromUrl: IURLDriver[], filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean }) => {
    driversFromUrl.forEach((driver: IURLDriver) => {
        const index = filtersData.filterStatus.findIndex((parameter: iParameter) => driver.urlName === parameter.urlName)
        if (index !== -1) {
            filtersData.filterStatus[index].parameterValue = driver.value
            addDefaultEmptyParameterValuesIfNoValuesPresent(filtersData.filterStatus[index])
        }
    })
    updateFiltersDataIsReadyForExecution(filtersData)
    return filtersData
}

const updateFiltersDataIsReadyForExecution = (filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean }) => {
    filtersData.isReadyForExecution = true
    for (let i = 0; i < filtersData.filterStatus.length; i++) {
        const tempParameter = filtersData.filterStatus[i]
        const isMultivalueDriverMissingValue = tempParameter.multivalue && tempParameter.parameterValue.length === 0
        const isSinglevalueDriverMissingValue = !tempParameter.multivalue && (!tempParameter.parameterValue[0] || !tempParameter.parameterValue[0].value)
        if (tempParameter.mandatory && (isMultivalueDriverMissingValue || isSinglevalueDriverMissingValue)) {
            filtersData.isReadyForExecution = false
            break
        }
    }
}

const loadFiltersFromParametersMap = (parameterValuesMap: any, document: any, tabKey: string, filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean }, breadcrumbs: any) => {
    filtersData = parameterValuesMap[document.label + '-' + tabKey]
    setFiltersForBreadcrumbItem(breadcrumbs, filtersData, document)
    return filtersData
}

const loadFiltersFromSession = (document: any, filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean }, breadcrumbs: any[]) => {
    const tempFilters = sessionStorage.getItem(document.label)
    if (tempFilters) {
        filtersData = JSON.parse(tempFilters) as {
            filterStatus: iParameter[]
            isReadyForExecution: boolean
        }
        filtersData.filterStatus?.forEach((filter: any) => {
            if (filter.type === 'DATE' && filter.parameterValue[0].value) {
                filter.parameterValue[0].value = new Date(filter.parameterValue[0].value)
            }
        })
        setFiltersForBreadcrumbItem(breadcrumbs, filtersData, document)
    }
    return filtersData
}

const getFilters = async (document: any, userRole: string | null, $http: any) => {
    let filtersData = {} as { filterStatus: iParameter[]; isReadyForExecution: boolean }
    await $http
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentexecution/filters`, {
            label: document.label,
            role: userRole,
            parameters: document.navigationParams ?? {}
        })
        .then((response: AxiosResponse<any>) => {
            filtersData = response.data
        })
        .catch((error: any) => {
            if (error.response?.status === 500) {
                mainStore.setError({
                    title: t('common.error.generic'),
                    msg: t('documentExecution.main.userRoleError')
                })
            }
        })
    return filtersData
}

const formatDrivers = (filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean } | null, dateFormat: string) => {
    filtersData?.filterStatus?.forEach((el: iParameter) => {
        if (el.type === 'DATE') formatDateDriver(el, dateFormat)
        else el.parameterValue = !el.multivalue || (el.valueSelection === 'man_in' && !el.selectionType) ? [{ value: '', description: '' }] : []

        if (el.driverDefaultValue?.length > 0) {
            let valueIndex = '_col0'
            let descriptionIndex = 'col1'
            if (el.metadata?.colsMap) {
                valueIndex = Object.keys(el.metadata?.colsMap).find((key: string) => el.metadata.colsMap[key] === el.metadata.valueColumn) as any
                descriptionIndex = Object.keys(el.metadata?.colsMap).find((key: string) => el.metadata.colsMap[key] === el.metadata.descriptionColumn) as any
            }

            el.parameterValue = el.driverDefaultValue.map((defaultValue: any) => {
                return {
                    value: defaultValue.value ?? defaultValue[valueIndex],
                    description: defaultValue.desc ?? defaultValue[descriptionIndex]
                }
            })

            formatDateDriver(el, dateFormat)
        }

        if (el.data) {
            el.data = el.data.map((data: any) => {
                return formatParameterDataOptions(el, data)
            })

            if (el.data.length === 1) {
                el.parameterValue = [...el.data]
            }
        }
        if ((el.selectionType === 'COMBOBOX' || el.selectionType === 'LIST') && el.multivalue && el.mandatory && el.data.length === 1) {
            el.showOnPanel = 'false'
            el.visible = false
        }

        addDefaultEmptyParameterValuesIfNoValuesPresent(el)
    })
}

const addDefaultEmptyParameterValuesIfNoValuesPresent = (el: iParameter) => {
    if (!el.parameterValue || (!el.parameterValue[0] && !el.multivalue)) el.parameterValue = [{ value: '', description: '' }]
    if (el.parameterValue[0] && !el.parameterValue[0].description) el.parameterValue[0].description = el.parameterDescription ? el.parameterDescription[0] : ''
}

const formatDateDriver = (el: any, dateFormat: string) => {
    if (!el.parameterValue || !el.parameterValue[0]) {
        el.parameterValue = [{ value: null, description: '' }]
        return
    }

    if (el.type === 'DATE' && !el.selectionType && el.valueSelection === 'man_in' && el.showOnPanel === 'true' && el.visible) {
        el.parameterValue[0].value = getValidDate('' + el.parameterValue[0].value, dateFormat)
        if (el.driverMaxValue) {
            const validDate = getValidDate('' + el.driverMaxValue, dateFormat)
            el.driverMaxDateValue = validDate === '' ? null : validDate
        }
    }
}

const setFiltersForBreadcrumbItem = (breadcrumbs: any[], filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean }, document: any) => {
    const index = breadcrumbs.findIndex((el: any) => el.label === document.name)
    if (index !== -1) breadcrumbs[index].filtersData = filtersData
}

const formatParameterDataOptions = (parameter: iParameter, data: any) => {
    if (!parameter.metadata) return { value: data['_col0'] ? data['_col0'] : '', description: data['_col1'] ? data['_col1'] : data['_col0'] }
    const valueColumn = parameter.metadata.valueColumn
    const descriptionColumn = parameter.metadata.descriptionColumn
    const valueIndex = Object.keys(parameter.metadata.colsMap).find((key: string) => parameter.metadata.colsMap[key] === valueColumn)
    const descriptionIndex = Object.keys(parameter.metadata.colsMap).find((key: string) => parameter.metadata.colsMap[key] === descriptionColumn)

    return {
        value: valueIndex ? data[valueIndex] : '',
        description: descriptionIndex ? data[descriptionIndex] : ''
    }
}

export const formatDriversUsingDashboardView = (filtersData: { filterStatus: iParameter[]; isReadyForExecution: boolean }, dashboardView: IDashboardView) => {
    if (!dashboardView.drivers || !dashboardView.drivers.filterStatus) return
    filtersData.filterStatus.forEach((driver: iParameter) => {
        const driverFromView = dashboardView.drivers.filterStatus.find((tempDriver: iParameter) => tempDriver.urlName === driver.urlName)
        if (driverFromView) {
            driver.parameterValue = driverFromView.type === 'DATE' ? formatDateDriverFromView(driverFromView.parameterValue) : driverFromView.parameterValue
            if (driverFromView.data) driver.data = driverFromView.data
        }
    })
    updateFiltersDataIsReadyForExecution(filtersData)
}

const formatDateDriverFromView = (parameterValue: any) => {
    if (!Array.isArray(parameterValue) || !parameterValue[0]) return []
    const date = new Date(parameterValue[0].value)
    if (isNaN(date.getTime())) return []
    parameterValue[0].value = date
    return parameterValue
}
