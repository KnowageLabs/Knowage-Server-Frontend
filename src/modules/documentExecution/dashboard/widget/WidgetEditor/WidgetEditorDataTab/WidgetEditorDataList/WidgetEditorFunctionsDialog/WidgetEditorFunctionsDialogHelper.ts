import { iFunction } from '@/modules/managers/functionsCatalog/FunctionsCatalog'
import { AxiosResponse } from 'axios'

import mockedData from './mockedData.json'
import { IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'

export const loadFunctionsData = async ($http: any): Promise<iFunction[]> => {
    const url = `${import.meta.env.VITE_KNOWAGE_API_CONTEXT}/api/1.0/functioncatalog/completelist`

    try {
        // const response: AxiosResponse<any> = await $http.get(url)
        // TODO - Remove mock
        // return response.data as iFunction[];
        return mockedData.data as iFunction[]
    } catch (error) {
        return []
    }
}

export const createNewFunctionColumn = () => {
    const functionsColumn = {
        id: crypto.randomUUID(),
        columnName: '',
        alias: '',
        fieldType: 'MEASURE',
        catalogFunctionId: null,
        catalogFunctionConfig: {
            inputColumns: [],
            inputVariables: [],
            outputColumns: [],
            environment: null
        },
        funct: 'NONE',
        orderColumn: '',
        orderType: ''
    } as IWidgetFunctionColumn

    return functionsColumn
}
