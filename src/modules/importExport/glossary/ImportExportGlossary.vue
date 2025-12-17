<template>
    <div class="import-export-glossary">
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
            <q-table class="sticky-header-table" ref="glossaryTable" v-model:selected="selectedItems[FUNCTIONALITY]" :rows="filteredGlossary" :columns="columns" row-key="id" selection="multiple" :visible-columns="visibleColumns" virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]" flat dense />
        </q-card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import importExportDescriptor from '../ImportExportDescriptor.json'
import type { IGlossaryItem, ISelectedItems } from '../ImportExportTypes'
import { importExportEmitter } from '../ImportExportEmitter'

export default defineComponent({
    name: 'import-export-glossary',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    data() {
        return {
            glossary: [] as IGlossaryItem[],
            searchFilter: '',
            dateFilter: null as string | null,
            FUNCTIONALITY: 'glossary' as const,
            importExportDescriptor,
            visibleColumns: ['name'],
            pagination: {
                rowsPerPage: 0
            }
        }
    },
    computed: {
        columns(): any[] {
            return this.importExportDescriptor.export.glossary.column.map((col: any) => ({
                ...col,
                label: this.$t(col.label)
            }))
        },
        filteredGlossary(): IGlossaryItem[] {
            if (!this.searchFilter) return this.glossary

            const searchLower = this.searchFilter.toLowerCase()
            return this.glossary.filter((item) => {
                const nameMatch = item.name?.toLowerCase().includes(searchLower)
                const idMatch = item.id?.toString().includes(searchLower)
                return nameMatch || idMatch
            })
        }
    },
    created() {
        this.loadAllGlossary()
        importExportEmitter.on('glossaryImported', this.loadAllGlossary)
    },
    beforeUnmount() {
        importExportEmitter.off('glossaryImported', this.loadAllGlossary)
    },
    methods: {
        loadAllGlossary(): void {
            this.$emit('update:loading', true)
            const params: any = {}
            if (this.dateFilter) {
                params.dateFilter = new Date(this.dateFilter).toString()
            }
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/glossary/listGlossary', { params })
                .then((response: AxiosResponse<any>) => {
                    this.glossary = (response.data || []).map((item: any) => ({ id: item.GLOSSARY_ID, name: item.GLOSSARY_NM }))

                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        this.selectedItems[this.FUNCTIONALITY] = this.selectedItems[this.FUNCTIONALITY].filter((element: any) => {
                            return this.glossary.some((el) => el.id === element.id)
                        })
                    }
                })
                .catch((error) => console.error('[ImportExportGlossary] loadAllGlossary error', error))
                .finally(() => {
                    this.$emit('update:loading', false)
                })
        },
        onDateFilterChange(): void {
            this.loadAllGlossary()
        }
    }
})
</script>

<style lang="scss" scoped>
.import-export-glossary {
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
