<template>
    <div class="import-export-catalog-function">
        <q-card class="p-my-2">
            <q-input class="p-col-4" v-model="searchFilter" dense :placeholder="$t('common.search')" type="text">
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
        </q-card>

        <q-card class="p-d-flex p-flex-column kn-flex kn-overflow">
            <q-table class="sticky-header-table" ref="functionsTable" v-model:selected="selectedFunctionItems" :rows="filteredFunctions" :columns="columns" row-key="id" selection="multiple" :visible-columns="visibleColumns" virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]" flat dense>
                <template #no-data>
                    <div class="full-width row flex-center text-accent q-gutter-sm p-py-4" style="height: 85vh">
                        <q-icon size="2em" name="warning" />
                        <span>{{ $t('common.info.noDataFound') }}</span>
                    </div>
                </template>
                <template #body-cell-tags="props">
                    <q-td :props="props">
                        <q-chip v-for="(tag, index) in props.row.tags" :key="index" size="sm" dense color="primary" text-color="white">
                            {{ tag }}
                        </q-chip>
                    </q-td>
                </template>
            </q-table>
        </q-card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import importExportDescriptor from '../ImportExportDescriptor.json'
import { AxiosResponse } from 'axios'
import { ICatalogFunctionTemplate } from '@/modules/importExport/catalogFunction/ICatalogFunctionTemplate'
import type { ISelectedItems } from '../ImportExportTypes'

export default defineComponent({
    name: 'import-export-catalog-function',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    data() {
        return {
            importExportDescriptor: importExportDescriptor,
            selectedFunctionItems: [],
            functions: [] as Array<ICatalogFunctionTemplate>,
            searchFilter: '',
            FUNCTIONALITY: 'catalogFunction',
            visibleColumns: ['name', 'type', 'tags'],
            pagination: {
                rowsPerPage: 0
            }
        }
    },
    computed: {
        columns(): any[] {
            return importExportDescriptor.export.catalogFunction.column.map((col: any) => ({ ...col, label: this.$t(col.label) }))
        },
        filteredFunctions(): ICatalogFunctionTemplate[] {
            if (!this.searchFilter) return this.functions

            const searchLower = this.searchFilter.toLowerCase()
            return this.functions.filter((func) => func.name.toLowerCase().includes(searchLower) || func.type.toLowerCase().includes(searchLower) || (func.tags && func.tags.some((tag) => tag.toLowerCase().includes(searchLower))))
        }
    },
    watch: {
        selectedItems: {
            handler(newVal) {
                const selectedFuncs = newVal?.[this.FUNCTIONALITY] || []
                this.selectedFunctionItems = selectedFuncs
            },
            deep: true
        },
        selectedFunctionItems(newVal) {
            this.$emit('onItemSelected', { items: newVal, functionality: this.FUNCTIONALITY })
        }
    },
    created() {
        this.loadAllFunctions()
    },
    methods: {
        loadAllFunctions(): void {
            this.$emit('update:loading', true)
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/functioncatalog')
                .then((response: AxiosResponse<any>) => {
                    this.functions = response.data

                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        this.selectedFunctionItems = this.selectedItems[this.FUNCTIONALITY].filter((element) => {
                            return this.functions.some((el) => el.id === element.id)
                        })
                    }
                })
                .catch((error) => console.error(error))
                .finally(() => {
                    this.$emit('update:loading', false)
                })
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-catalog-function {
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
