import moment from 'moment'

// Moved unchanged from views/dataView/WorkspaceDataView.vue (formatDrivers, formatParameterDataOptions,
// getFormattedDrivers): the export request must stay byte for byte the same.

export function formatParameterDataOptions(parameter: any, data: any) {
    const valueColumn = parameter.metadata.valueColumn
    const descriptionColumn = parameter.metadata.descriptionColumn
    const valueIndex = Object.keys(parameter.metadata.colsMap).find((key: string) => parameter.metadata.colsMap[key] === valueColumn)
    const descriptionIndex = Object.keys(parameter.metadata.colsMap).find((key: string) => parameter.metadata.colsMap[key] === descriptionColumn)
    return { value: valueIndex ? data[valueIndex] : '', description: descriptionIndex ? data[descriptionIndex] : '' }
}

export function formatDrivers(filtersData: any) {
    filtersData?.filterStatus?.forEach((el: any) => {
        el.parameterValue = el.multivalue ? [] : [{ value: '', description: '' }]
        if (el.driverDefaultValue?.length > 0) {
            let valueIndex = '_col0'
            let descriptionIndex = 'col1'
            if (el.metadata?.colsMap) {
                valueIndex = Object.keys(el.metadata?.colsMap).find((key: string) => el.metadata.colsMap[key] === el.metadata.valueColumn) as any
                descriptionIndex = Object.keys(el.metadata?.colsMap).find((key: string) => el.metadata.colsMap[key] === el.metadata.descriptionColumn) as any
            }
            el.parameterValue = el.driverDefaultValue.map((defaultValue: any) => {
                return { value: defaultValue.value ?? defaultValue[valueIndex], description: defaultValue.desc ?? defaultValue[descriptionIndex] }
            })
            if (el.type === 'DATE' && !el.selectionType && el.valueSelection === 'man_in' && el.showOnPanel === 'true') {
                el.parameterValue[0].value = moment(el.parameterValue[0].description?.split('#')[0]).toDate() as any
            }
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
        }
        if (!el.parameterValue) {
            el.parameterValue = [{ value: '', description: '' }]
        }
        if (el.parameterValue[0] && !el.parameterValue[0].description) {
            el.parameterValue[0].description = el.parameterDescription ? el.parameterDescription[0] : ''
        }
    })
}

export function getFormattedDrivers(parameters: any) {
    const formattedParameters = {} as any
    Object.keys(parameters.filterStatus).forEach((key: any) => {
        const parameter = parameters.filterStatus[key]
        if (!parameter.multivalue) {
            formattedParameters[parameter.urlName] = []
            formattedParameters[parameter.urlName].push({ value: parameter.parameterValue[0].value, description: parameter.parameterValue[0].description ?? parameter.parameterValue[0].value })
        } else {
            formattedParameters[parameter.urlName] = []
            formattedParameters[parameter.urlName].push({ value: parameter.parameterValue?.map((el: any) => el.value), description: parameter.parameterDescription ?? parameter.parameterValue[0].value })
        }
    })
    return formattedParameters
}

// ---------- The dataset menu rules of today (spec 8.2), with B10 fixed ----------

export const canLoadData = (dataset: any): boolean => !!dataset?.actions?.some((action: any) => action.name === 'loaddata')
// B10: the old checks compared the wrong fields and were always false
export const datasetHasDrivers = (dataset: any): boolean => (dataset?.drivers?.length ?? 0) > 0
export const datasetHasParams = (dataset: any): boolean => (dataset?.pars?.length ?? 0) > 0
// in order to export to XLSX, dataset must implement an iterator (BE side)
export const datasetIsIterable = (dataset: any): boolean => !['Federated'].includes(dataset?.dsTypeCd)
export const isOpenInQbeVisible = (dataset: any): boolean => dataset?.pars?.length == 0 && ((dataset.isPersisted && dataset.dsTypeCd == 'File') || dataset.dsTypeCd == 'Query' || dataset.dsTypeCd == 'Flat')
export const canExportDataset = (dataset: any): boolean => canLoadData(dataset) && !datasetHasDrivers(dataset) && !datasetHasParams(dataset) && dataset?.dsTypeCd != 'File'
