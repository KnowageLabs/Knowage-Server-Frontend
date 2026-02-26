<template>
    <KnPivotTable :id="id" :columns="filteredColumns" :rows="tempRows" :prop-configuration="propConfiguration" :entity="entity" :pagination="pagination" :combo-column-options="comboColumnOptions" :number-of-rows="registryDescriptor.paginationNumberOfItems" @rowChanged="onRowChanged" @pageChanged="onPageChange" @dropdownOpened="addColumnOptions"></KnPivotTable>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import registryDescriptor from '../RegistryDescriptor.json'
import KnPivotTable from '@/components/UI/KnPivotTable/KnPivotTable.vue'
import { useRegistryColumnOptions } from '../composables/useRegistryColumnOptions'

const props = defineProps<{
    columns?: any[]
    rows?: any[]
    propConfiguration?: any
    entity?: string | null
    id?: string
    propPagination?: any
}>()

const emit = defineEmits<{
    (e: 'rowChanged', row: any): void
    (e: 'pageChanged', event: any): void
    (e: 'resetRows'): void
}>()

const { comboColumnOptions, addColumnOptions } = useRegistryColumnOptions(
    () => props.entity,
    () => props.id,
    (row, field) => row[field]?.data
)

const filteredColumns = ref<any[]>([])
const tempRows = ref<any[]>([])
const pagination = ref<any>({})
const lazy = ref(false)

function getFilteredColumns() {
    filteredColumns.value = props.columns ?? []
}

function loadRows() {
    tempRows.value = props.rows ?? []
    if (tempRows.value.length <= registryDescriptor.paginationLimit) {
        lazy.value = false
        tempRows.value = tempRows.value.slice(0, registryDescriptor.paginationNumberOfItems)
    }
}

function loadPagination() {
    pagination.value = props.propPagination
}

function onRowChanged(row: any) {
    emit('rowChanged', row)
}

function onPageChange(event: any) {
    if (lazy.value) {
        emit('pageChanged', event)
    } else {
        tempRows.value = (props.rows ?? []).slice(event.paginationStart, event.paginationStart + registryDescriptor.paginationNumberOfItems)
        emit('resetRows')
    }
}

watch(() => props.columns, getFilteredColumns)
watch(() => props.rows, loadRows, { deep: true })
watch(() => props.propPagination, loadPagination, { deep: true })

onMounted(() => {
    getFilteredColumns()
    loadRows()
    loadPagination()
})
</script>
