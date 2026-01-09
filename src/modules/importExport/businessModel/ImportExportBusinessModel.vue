<template>
    <div class="import-export-business-models">
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
            <q-table v-else class="sticky-header-table" ref="businessModelsTable" v-model:selected="selectedItems[FUNCTIONALITY]" :rows="filteredBusinessModels" :columns="columns" row-key="id" selection="multiple" :visible-columns="visibleColumns" virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]" flat dense>
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
import type { IBusinessModelItem, ISelectedItems } from '../ImportExportTypes'

export default defineComponent({
    name: 'import-export-business-models',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    data() {
        return {
            businessModels: [] as IBusinessModelItem[],
            searchFilter: '',
            dateFilter: null as string | null,
            FUNCTIONALITY: 'businessModels' as const,
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
            return this.importExportDescriptor.export.businessModels.column.map((col: any) => ({
                ...col,
                label: this.$t(col.label)
            }))
        },
        filteredBusinessModels(): IBusinessModelItem[] {
            if (!this.searchFilter) return this.businessModels

            const searchLower = this.searchFilter.toLowerCase()
            return this.businessModels.filter((bm) => {
                const labelMatch = bm.label?.toLowerCase().includes(searchLower)
                const nameMatch = bm.name?.toLowerCase().includes(searchLower)
                const descriptionMatch = bm.description ? bm.description.toLowerCase().includes(searchLower) : false
                return labelMatch || nameMatch || descriptionMatch
            })
        }
    },
    created() {
        this.loadAllBusinessModels()
    },
    methods: {
        loadAllBusinessModels(): void {
            this.loading = true
            this.$emit('update:loading', true)
            const params: any = {}
            if (this.dateFilter) {
                params.dateFilter = new Date(this.dateFilter).toString()
            }
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/catalog/getbusinessmodel', { params })
                .then((response: AxiosResponse<any>) => {
                    this.businessModels = (response.data || []).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        label: item.label,
                        description: item.description || null
                    }))

                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        this.selectedItems[this.FUNCTIONALITY] = this.selectedItems[this.FUNCTIONALITY].filter((element: any) => {
                            return this.businessModels.some((el) => el.id === element.id)
                        })
                    }
                })
                .catch((error) => console.error('[ImportExportBusinessModel] loadAllBusinessModels error', error))
                .finally(() => {
                    this.loading = false
                    this.$emit('update:loading', false)
                })
        },
        onDateFilterChange(): void {
            this.loadAllBusinessModels()
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-business-models {
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
