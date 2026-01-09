<template>
    <div class="import-export-datasets">
        <q-card class="p-my-2 p-d-flex">
            <q-input class="p-col-4" v-model="searchFilter" dense :placeholder="$t('common.search')" type="text">
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
            <q-input class="p-col-2" v-model="dateFilter" dense type="date" :label="$t('common.date')" @update:model-value="onDateFilterChange">
                <template #prepend>
                    <q-icon name="event" />
                </template>
            </q-input>
        </q-card>

        <q-card class="p-d-flex p-flex-column kn-flex kn-overflow">
            <div v-if="loading" class="p-d-flex p-jc-center p-ai-center" style="height: 100%">
                <q-spinner size="50px" color="primary" />
            </div>
            <q-table v-else class="sticky-header-table" ref="datasetsTable" v-model:selected="selectedItems[FUNCTIONALITY]" :rows="filteredDatasets" :columns="columns" row-key="id" selection="multiple" :visible-columns="visibleColumns" virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]" flat dense>
                <template #no-data>
                    <div class="full-width row flex-center text-accent q-gutter-sm p-py-4" style="height: 85vh">
                        <q-icon size="2em" name="warning" />
                        <span>{{ $t('common.info.noDataFound') }}</span>
                    </div>
                </template>
            </q-table>
        </q-card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import importExportDescriptor from '../ImportExportDescriptor.json'
import type { IDatasetItem, ISelectedItems } from '../ImportExportTypes'

export default defineComponent({
    name: 'import-export-datasets',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    data() {
        return {
            datasets: [] as IDatasetItem[],
            searchFilter: '',
            dateFilter: null as string | null,
            FUNCTIONALITY: 'datasets' as const,
            importExportDescriptor,
            visibleColumns: ['label', 'name'],
            pagination: {
                rowsPerPage: 0
            },
            loading: false
        }
    },
    computed: {
        columns(): any[] {
            return this.importExportDescriptor.export.datasets.column.map((col: any) => ({
                ...col,
                label: this.$t(col.label)
            }))
        },
        filteredDatasets(): IDatasetItem[] {
            if (!this.searchFilter) return this.datasets

            const searchLower = this.searchFilter.toLowerCase()
            return this.datasets.filter((dataset) => {
                const labelMatch = dataset.label?.toLowerCase().includes(searchLower)
                const nameMatch = dataset.name?.toLowerCase().includes(searchLower)
                const descriptionMatch = dataset.description ? dataset.description.toLowerCase().includes(searchLower) : false
                return labelMatch || nameMatch || descriptionMatch
            })
        }
    },
    created() {
        this.loadAllDatasets()
    },
    methods: {
        loadAllDatasets(): void {
            this.loading = true
            this.$emit('update:loading', true)
            const params: any = {}
            if (this.dateFilter) {
                params.dateFilter = new Date(this.dateFilter).toString()
            }
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/catalog/getdataset', { params })
                .then((response: AxiosResponse<any>) => {
                    this.datasets = (response.data || []).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        label: item.label,
                        description: item.description || null
                    }))

                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        this.selectedItems[this.FUNCTIONALITY] = this.selectedItems[this.FUNCTIONALITY].filter((element: any) => {
                            return this.datasets.some((el) => el.id === element.id)
                        })
                    }
                })
                .catch((error) => console.error('[ImportExportDataset] loadAllDatasets error', error))
                .finally(() => {
                    this.loading = false
                    this.$emit('update:loading', false)
                })
        },
        onDateFilterChange(): void {
            this.loadAllDatasets()
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-datasets {
    display: flex;
    flex-direction: column;
    height: 95vh;
}

.sticky-header-table {
    height: 100%;
    :deep(thead tr th) {
        position: sticky;
        z-index: 1;
        background-color: #ffffff;
        top: 0;
    }

    /* prevent scrolling behind sticky top row on focus */
    :deep(tbody) {
        scroll-margin-top: 48px;
    }
}
</style>
