<template>
    <div class="import-export-kpi">
        <q-card class="p-my-2 p-d-flex">
            <q-input class="p-col-4" v-model="searchFilter" dense :placeholder="$t('common.search')" type="text">
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </q-card>

        <q-card class="p-d-flex p-flex-column kn-flex kn-overflow">
            <q-table class="sticky-header-table" ref="kpiTable" v-model:selected="selectedItems[FUNCTIONALITY]" :rows="filteredKpis" :columns="columns" row-key="id" selection="multiple" :visible-columns="visibleColumns" virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]" flat dense />
        </q-card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import importExportDescriptor from '../ImportExportDescriptor.json'
import type { IKpiItem, ISelectedItems } from '../ImportExportTypes'

export default defineComponent({
    name: 'import-export-kpi',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    data() {
        return {
            kpis: [] as IKpiItem[],
            searchFilter: '',
            FUNCTIONALITY: 'kpis' as const,
            importExportDescriptor,
            visibleColumns: ['name', 'author'],
            pagination: {
                rowsPerPage: 0
            }
        }
    },
    computed: {
        columns(): any[] {
            return this.importExportDescriptor.export.kpis.column.map((col: any) => ({
                ...col,
                label: this.$t(col.label)
            }))
        },
        filteredKpis(): IKpiItem[] {
            if (!this.searchFilter) return this.kpis

            const searchLower = this.searchFilter.toLowerCase()
            return this.kpis.filter((kpi) => {
                const nameMatch = kpi.name?.toLowerCase().includes(searchLower)
                const authorMatch = kpi.author?.toLowerCase().includes(searchLower)
                return nameMatch || authorMatch
            })
        }
    },
    created() {
        this.loadAllKpis()
    },
    methods: {
        loadAllKpis(): void {
            this.$emit('update:loading', true)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/kpi/listKpi')
                .then((response: AxiosResponse<any>) => {
                    this.kpis = response.data

                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        this.selectedItems[this.FUNCTIONALITY] = this.selectedItems[this.FUNCTIONALITY].filter((element: any) => {
                            return this.kpis.some((el) => el.id === element.id)
                        })
                    }
                })
                .catch((error) => console.error('[ImportExportKpi] loadAllKpis error', error))
                .finally(() => {
                    this.$emit('update:loading', false)
                })
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-kpi {
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
