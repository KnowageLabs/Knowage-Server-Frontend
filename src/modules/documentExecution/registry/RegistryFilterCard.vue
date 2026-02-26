<template>
    <div v-if="filter.static && filter.visible">
        <q-input v-model="filter.filterValue" class="q-mx-sm" filled dense disable :label="filter.title" />
    </div>
    <div v-else-if="!filter.static" class="q-mx-sm">
        <q-input v-if="filter.presentation === 'MANUAL'" v-model="v$.filter.filterValue.$model" filled dense :label="filter.title" :error="v$.filter.filterValue.$invalid && v$.filter.filterValue.$dirty" :error-message="filterValueErrorMessage" @update:model-value="filterChanged" />
        <q-select v-else-if="filter.presentation === 'COMBO'" v-model="v$.filter.filterValue.$model" filled dense use-input input-debounce="0" emit-value map-options :options="filteredOptions" option-value="value" option-label="label" :label="filter.title" :error="v$.filter.filterValue.$invalid && v$.filter.filterValue.$dirty" :error-message="filterValueErrorMessage" @update:model-value="filterChanged" @filter="filterOptions">
            <template #option="scope">
                <q-item v-bind="scope.itemProps">
                    <q-item-section>
                        <q-item-label :title="scope.opt.column_1">{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                </q-item>
            </template>
        </q-select>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, computed } from 'vue'
import type { AxiosResponse } from 'axios'
import axios from '@/axios.js'
import { useVuelidate } from '@vuelidate/core'
import { createValidations } from '@/helpers/commons/validationHelper'
import validationDescriptor from './RegistryFilterCardValidationDescriptor.json'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    propFilter?: any
    filterOptions?: any[]
    entity?: string | null
    clearTrigger?: boolean
    id?: string
    allFilters?: any[]
}>()

const emit = defineEmits<{
    (e: 'changed', value: any): void
    (e: 'valid', valid: boolean): void
}>()

const filter = ref<any>({})
const options = ref<any[]>([])
const vuelidateState = reactive({ filter })
const vRules = { filter: createValidations('filter', validationDescriptor.validations.configuration) }
const v$ = useVuelidate(vRules, vuelidateState)

const filteredOptions = ref<any[]>([])

const filterValueErrorMessage = computed(() => {
    const errors = v$.value.filter.filterValue.$errors
    if (!errors.length) return ''
    return t(`common.validation.${errors[0].$validator}`)
})

function loadFilter() {
    filter.value = { ...props.propFilter }
}

async function loadFilterOptions() {
    const subEntity = filter.value.column.subEntity ? '::' + filter.value.column.subEntity + '(' + filter.value.column.foreignKey + ')' : ''
    const entityId = props.entity + subEntity + ':' + filter.value.field
    const entityOrder = props.entity + subEntity + ':' + (filter.value.column.orderBy ?? filter.value.field)
    const postData = new URLSearchParams({ ENTITY_ID: entityId, QUERY_TYPE: 'standard', ORDER_ENTITY: entityOrder, ORDER_TYPE: 'asc', QUERY_ROOT_ENTITY: 'true' })

    if (filter.value.column?.dependences && props.allFilters) {
        const parentFilter = props.allFilters.find((f: any) => f.field === filter.value.column.dependences)
        if (parentFilter && parentFilter.filterValue) {
            postData.append('DEPENDENCES', props.entity + subEntity + ':' + filter.value.column.dependences + '=' + parentFilter.filterValue)
        }
    }

    await axios.post(`${import.meta.env.VITE_KNOWAGEQBE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=GET_FILTER_VALUES_ACTION&SBI_EXECUTION_ID=${props.id}`, postData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then((response: AxiosResponse<any>) => {
        options.value = response.data.rows.map((row: any) => ({ value: row.column_1, label: row.column_1 === 0 ? '0' : row.column_1 }))
    })
}

async function filterOptions(val: string, update: (fn: () => void) => void) {
    if (val === '') {
        await loadFilterOptions()
    }
    update(() => {
        const needle = val.toLowerCase()
        filteredOptions.value = needle
            ? options.value.filter((opt) =>
                  String(opt.label ?? '')
                      .toLowerCase()
                      .includes(needle)
              )
            : options.value
    })
}

function filterChanged() {
    emit('changed', filter.value.filterValue)
    emit('valid', !v$.value.filter.filterValue?.$invalid)
}

watch(
    () => props.propFilter,
    () => loadFilter(),
    { deep: true }
)
watch(
    () => props.propFilter?.filterValue,
    (newVal) => {
        if (filter.value.filterValue !== newVal) {
            filter.value.filterValue = newVal
            if (!newVal) options.value = []
        }
    }
)
watch(
    () => props.clearTrigger,
    () => {
        filter.value.filterValue = ''
        options.value = []
    }
)

loadFilter()
</script>
