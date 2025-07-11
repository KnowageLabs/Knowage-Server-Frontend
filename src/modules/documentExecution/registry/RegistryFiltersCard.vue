<template>
    <Card v-if="filters.length > 0" class="filtersCard p-m-2">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--default">
                <template #start>
                    {{ $t('documentExecution.registry.filters') }}
                </template>
            </Toolbar>
        </template>
        <template #content>
            <div class="filter-container">
                <form class="p-fluid p-formgrid p-grid fields-container" @submit="filterRegistry">
                    <template v-for="(filter, index) in filters.filter((fil) => fil.presentation !== 'DRIVER')" :key="index">
                        <RegistryFilterCard :id="id" class="kn-flex" :prop-filter="filter" :entity="entity" :clear-trigger="clearFiltersTrigger" @changed="setFilterValue($event, index)" @valid="setFilterButtonDisabled"> </RegistryFilterCard>
                    </template>
                </form>

                <div class="button-container p-ml-2" :style="registryDescriptor.styles.buttonsContainer">
                    <Button class="p-button kn-button--primary p-mx-1" :style="registryDescriptor.styles.filtersButton" @click="clearAllFilters">{{ $t('documentExecution.registry.clearFilters') }}</Button>
                    <Button class="p-button kn-button--primary p-mx-1" :style="registryDescriptor.styles.filtersButton" data-test="filter-button" :disabled="filterButtonDisabled" @click="filterRegistry">{{ $t('documentExecution.registry.filter') }} </Button>
                </div>
            </div>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Card from 'primevue/card'
import RegistryFilterCard from './RegistryFilterCard.vue'
import registryDescriptor from './RegistryDescriptor.json'

export default defineComponent({
    name: 'registry-filters-card',
    components: { Card, RegistryFilterCard },
    props: {
        propFilters: { type: Array },
        entity: { type: Object as PropType<string | null> },
        id: { type: String }
    },
    emits: ['filter'],
    data() {
        return {
            registryDescriptor,
            filters: [] as any[],
            clearFiltersTrigger: false,
            filterButtonDisabled: false
        }
    },
    watch: {
        propFilters() {
            this.loadFilters()
        }
    },
    async created() {
        this.loadFilters()
    },
    methods: {
        loadFilters() {
            this.filters = this.propFilters ? this.propFilters.filter((filter: any) => filter.visible) : []
        },
        setFilterValue(value: string, index: number) {
            this.filters[index].filterValue = value
        },
        clearAllFilters() {
            this.filters.forEach((el: any) => (el.filterValue = ''))
            this.clearFiltersTrigger = !this.clearFiltersTrigger
            this.$emit('filter', this.filters)
        },
        filterRegistry(e) {
            e.preventDefault()
            this.$emit('filter', this.filters)
        },
        setFilterButtonDisabled(valid) {
            this.filterButtonDisabled = !valid
        }
    }
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
