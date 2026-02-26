import { ref } from 'vue'
import type { AxiosResponse } from 'axios'
import axios from '@/axios.js'

/**
 * Composable che gestisce il caricamento delle opzioni per le colonne COMBO del registry.
 *
 * @param getEntity   getter reattivo per l'entità corrente (es. () => props.entity)
 * @param getId       getter reattivo per l'execution id   (es. () => props.id)
 * @param getDependenceValue  come estrarre il valore di dipendenza da una riga.
 *                    Default: `(row, field) => row[field]` (grid piatta).
 *                    Per KnPivotTable usare `(row, field) => row[field]?.data`
 *                    perché i valori sono avvolti in `{ data: actualValue }`.
 * @param hooks       callback opzionali per mostrare/nascondere overlay di caricamento
 */
export function useRegistryColumnOptions(getEntity: () => string | null | undefined, getId: () => string | undefined, getDependenceValue: (row: any, field: string) => any = (row, field) => row[field], hooks?: { onBeforeLoad?: () => void; onAfterLoad?: () => void }) {
    const comboColumnOptions = ref<any>({})

    async function loadColumnOptions(column: any, row: any): Promise<void> {
        hooks?.onBeforeLoad?.()

        const entity = getEntity()
        const id = getId()
        const subEntity = column.subEntity ? '::' + column.subEntity + '(' + column.foreignKey + ')' : ''
        const entityId = entity + subEntity + ':' + column.field
        const entityOrder = entity + subEntity + ':' + (column.orderBy ?? column.field)

        const postData = new URLSearchParams({ ENTITY_ID: entityId, QUERY_TYPE: 'standard', ORDER_ENTITY: entityOrder, ORDER_TYPE: 'asc', QUERY_ROOT_ENTITY: 'true' })

        const depValue = column.dependences ? getDependenceValue(row, column.dependences) : undefined
        if (column.dependences && row && depValue) {
            postData.append('DEPENDENCES', entity + subEntity + ':' + column.dependences + '=' + depValue)
        }

        const storageKey = depValue ?? 'All'

        await axios
            .post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=GET_FILTER_VALUES_ACTION&SBI_EXECUTION_ID=${id}`, postData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            .then((response: AxiosResponse<any>) => {
                comboColumnOptions.value[column.field][storageKey] = response.data.rows
            })

        hooks?.onAfterLoad?.()
    }

    async function addColumnOptions(payload: { column: any; row: any }): Promise<void> {
        const { column, row } = payload
        if (!comboColumnOptions.value[column.field]) comboColumnOptions.value[column.field] = []
        const depValue = column.dependences ? getDependenceValue(row, column.dependences) : undefined
        const key = depValue ?? 'All'
        if (!comboColumnOptions.value[column.field][key]) await loadColumnOptions(column, row)
    }

    return { comboColumnOptions, addColumnOptions, loadColumnOptions }
}
