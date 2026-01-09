<template>
    <div class="import-export-drivers">
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
            <q-table v-else class="sticky-header-table" ref="driversTable" v-model:selected="selectedItems[FUNCTIONALITY]" :rows="filteredDrivers" :columns="columns" row-key="id" selection="multiple" :visible-columns="visibleColumns" virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]" flat dense>
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
import importExportDescriptor from '../ImportExportDescriptor.json'
import { AxiosResponse } from 'axios'
import type { IAnalyticalDriverItem, ISelectedItems } from '../ImportExportTypes'
import { importExportEmitter } from '../ImportExportEmitter'

export default defineComponent({
    name: 'import-export-drivers',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    data() {
        return {
            drivers: [] as IAnalyticalDriverItem[],
            searchFilter: '',
            dateFilter: null as string | null,
            FUNCTIONALITY: 'analyticalDrivers',
            importExportDescriptor: importExportDescriptor,
            visibleColumns: ['label', 'name', 'description'],
            pagination: {
                rowsPerPage: 0
            },
            loading: false
        }
    },
    computed: {
        columns(): any[] {
            return this.importExportDescriptor.export.analyticalDrivers.column.map((col: any) => ({
                ...col,
                label: this.$t(col.label)
            }))
        },
        filteredDrivers(): IAnalyticalDriverItem[] {
            if (!this.searchFilter) return this.drivers

            const searchLower = this.searchFilter.toLowerCase()
            return this.drivers.filter((driver) => {
                const labelMatch = driver.label?.toLowerCase().includes(searchLower)
                const nameMatch = driver.name?.toLowerCase().includes(searchLower)
                const descriptionMatch = driver.description ? driver.description.toLowerCase().includes(searchLower) : false
                return labelMatch || nameMatch || descriptionMatch
            })
        }
    },

    created() {
        this.loadAllDrivers()
        importExportEmitter.on('driversImported', this.loadAllDrivers)
    },
    beforeUnmount() {
        importExportEmitter.off('driversImported', this.loadAllDrivers)
    },
    methods: {
        loadAllDrivers(): void {
            this.loading = true
            this.$emit('update:loading', true)
            const params: any = {}
            if (this.dateFilter) {
                params.dateFilter = new Date(this.dateFilter).toString()
            }
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/analyticaldrivers/getanalyticaldrivers', { params })
                .then((response: AxiosResponse<any>) => {
                    this.drivers = response.data

                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        this.selectedItems[this.FUNCTIONALITY] = this.selectedItems[this.FUNCTIONALITY].filter((element: any) => {
                            return this.drivers.some((el) => el.id === element.id)
                        })
                    }
                })
                .catch((error) => console.error('[ImportExportDrivers] loadAllDrivers error', error))
                .finally(() => {
                    this.loading = false
                    this.$emit('update:loading', false)
                })
        },
        onDateFilterChange(): void {
            this.loadAllDrivers()
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-drivers {
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
