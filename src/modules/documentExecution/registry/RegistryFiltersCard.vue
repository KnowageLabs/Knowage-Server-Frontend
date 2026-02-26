<template>
    <q-card v-if="filters.length > 0" class="filtersCard q-ma-sm" flat bordered>
        <q-toolbar class="kn-toolbar kn-toolbar--default">
            <q-toolbar-title>{{ $t('documentExecution.registry.filters') }}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-pa-sm">
            <div class="filter-container">
                <form class="fields-container" @submit="filterRegistry">
                    <template v-for="(filter, index) in filters.filter((fil) => fil.presentation !== 'DRIVER')" :key="index">
                        <RegistryFilterCard :id="id" class="kn-flex" :prop-filter="filter" :entity="entity" :clear-trigger="clearFiltersTrigger" :all-filters="filters" @changed="setFilterValue($event, index, filter)" @valid="setFilterButtonDisabled"> </RegistryFilterCard>
                    </template>
                </form>

                <div class="button-container q-ml-sm">
                    <q-btn class="q-mx-xs" color="primary" unelevated :style="registryDescriptor.styles.filtersButton" @click="clearAllFilters">{{ $t('documentExecution.registry.clearFilters') }}</q-btn>
                    <q-btn class="q-mx-xs" color="primary" unelevated data-test="filter-button" :disable="filterButtonDisabled" :style="registryDescriptor.styles.filtersButton" @click="filterRegistry">{{ $t('documentExecution.registry.filter') }}</q-btn>
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import RegistryFilterCard from './RegistryFilterCard.vue'
import registryDescriptor from './RegistryDescriptor.json'

const props = defineProps<{
    propFilters?: any[]
    entity?: string | null
    id?: string
}>()

const emit = defineEmits<{
    (e: 'filter', filters: any[]): void
}>()

const filters = ref<any[]>([])
const clearFiltersTrigger = ref(false)
const filterButtonDisabled = ref(false)

function loadFilters() {
    filters.value = props.propFilters ? props.propFilters.filter((filter: any) => filter.visible) : []
}

function setFilterDependencies() {
    filters.value.forEach((filter: any) => {
        if (filter.column?.dependences) {
            const index = filters.value.findIndex((parentFilter: any) => parentFilter.field === filter.column.dependences)
            if (index !== -1) filters.value[index].hasDependencies ? filters.value[index].hasDependencies.push(filter) : (filters.value[index].hasDependencies = [filter])
        }
    })
}

function setFilterValue(value: string, index: number, filter: any) {
    const filterIndex = filters.value.findIndex((fil) => fil.field === filter.field)
    filters.value[filterIndex].filterValue = value
    if (filters.value[filterIndex].hasDependencies) clearDependentFilterValues(filters.value[filterIndex])
}

function clearDependentFilterValues(parentFilter: any) {
    if (!parentFilter.hasDependencies) return
    parentFilter.hasDependencies.forEach((dependentFilter: any) => {
        const index = filters.value.findIndex((fil) => fil.field === dependentFilter.field)
        if (index !== -1) {
            filters.value[index].filterValue = ''
            clearDependentFilterValues(filters.value[index])
        }
    })
}

function clearAllFilters() {
    filters.value.forEach((el: any) => (el.filterValue = ''))
    clearFiltersTrigger.value = !clearFiltersTrigger.value
    emit('filter', filters.value)
}

function filterRegistry(e: Event) {
    e.preventDefault()
    emit('filter', filters.value)
}

function setFilterButtonDisabled(valid: boolean) {
    filterButtonDisabled.value = !valid
}

watch(
    () => props.propFilters,
    () => loadFilters()
)

onMounted(() => {
    loadFilters()
    setFilterDependencies()
})
</script>
<style lang="scss">
.filtersCard {
    width: calc(100vw - 72px);
}
.filter-container {
    display: flex;
    width: 100%;
    .fields-container {
        overflow-x: auto;
        overflow-y: hidden;
        display: flex;
        flex: 1;
        max-width: calc(100% - 215px);
        flex-wrap: nowrap;
        .kn-material-input {
            min-width: 200px;
            max-width: 400px;
        }
    }
}
</style>
