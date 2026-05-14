<template>
    <q-table
        id="preview-datatable"
        v-model:pagination="tablePagination"
        :rows="rows"
        :columns="qColumns"
        :rows-per-page-options="[15]"
        :hide-pagination="(lazyParams.size ?? 0) <= 15"
        :pagination-label="getPaginationLabel"
        :row-key="getRowKey"
        class="kn-table kn-flex dataset-preview-table"
        flat
        dense
        binary-state-sort
        separator="horizontal"
        @request="onRequest"
    >
        <template #header-cell="props">
            <q-th :props="props" class="kn-truncated" :style="datasetPreviewTableDescriptor.columnStyle">
                <div class="dataset-preview-header">
                    <div class="dataset-preview-header__text" :class="{ 'dataset-preview-header__text--interactive': previewType !== 'dataset' }" @click="previewType !== 'dataset' && onSortClick(props.col.field)">
                        <p class="q-ma-none">{{ props.col.label }}</p>
                        <small class="dataset-preview-header__type">
                            <q-icon :name="getTypeIcon(props.col.type)" size="14px" />
                            <span>{{ props.col.type }}</span>
                        </small>
                    </div>
                    <div v-if="previewType !== 'dataset'" class="dataset-preview-header__actions">
                        <q-btn flat round dense size="sm" :icon="getSortIcon(props.col.field)" :color="tablePagination.sortBy === props.col.field ? 'primary' : 'grey-7'" @click.stop="onSortClick(props.col.field)" />
                        <q-btn flat round dense size="sm" icon="filter_alt" :color="searchInput[props.col.field] ? 'pink-8' : 'grey-7'">
                            <q-menu v-model="searchVisible[props.col.field]" anchor="bottom right" self="top right">
                                <div class="q-pa-sm dataset-preview-filter-menu">
                                    <q-input v-model="searchInput[props.col.field]" outlined dense clearable debounce="1000" :placeholder="$t('common.search')" @update:model-value="onFilter(props.col)">
                                        <template #prepend>
                                            <q-icon name="search" />
                                        </template>
                                    </q-input>
                                </div>
                            </q-menu>
                        </q-btn>
                    </div>
                </div>
            </q-th>
        </template>

        <template #body-cell="props">
            <q-td :props="props">
                <span class="dataset-preview-cell ellipsis" :title="getCellValue(props.row, props.col.field)">
                    {{ getCellValue(props.row, props.col.field) }}
                </span>
            </q-td>
        </template>

        <template #no-data>
            <div id="noFunctionsFound" class="full-width row flex-center q-pa-md">
                {{ $t('common.info.noDataFound') }}
            </div>
        </template>
    </q-table>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { QBtn, QIcon, QInput, QMenu, QTable, QTd, QTh } from 'quasar'
import datasetPreviewTableDescriptor from './DatasetPreviewTableDescriptor.json'

interface IPreviewColumn {
    header: string
    field: string
    type?: string
    label?: string
}

interface IPreviewPagination {
    start: number
    limit: number
    size?: number
}

interface ITablePagination {
    page: number
    rowsPerPage: number
    rowsNumber?: number
    sortBy: string | null
    descending: boolean
}

export default defineComponent({
    name: 'function-catalog-preview-table',
    components: { QTable, QTh, QTd, QBtn, QMenu, QInput, QIcon },
    props: {
        previewColumns: { type: Array as PropType<IPreviewColumn[]>, default: () => [] },
        previewRows: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
        pagination: { type: Object as PropType<IPreviewPagination>, default: () => ({ start: 0, limit: 15, size: 0 }) },
        previewType: { type: String, default: '' }
    },
    emits: ['pageChanged', 'sort', 'filter'],
    data() {
        return {
            datasetPreviewTableDescriptor,
            columns: [] as IPreviewColumn[],
            rows: [] as Record<string, unknown>[],
            lazyParams: { start: 0, limit: 15, size: 0 } as IPreviewPagination,
            searchInput: {} as Record<string, string>,
            searchVisible: {} as Record<string, boolean>,
            customFilters: [] as { column: string; value: string }[],
            tablePagination: { page: 1, rowsPerPage: 15, rowsNumber: 0, sortBy: null, descending: false } as ITablePagination,
            syncingPagination: true
        }
    },
    computed: {
        qColumns(): any[] {
            return this.columns.map((column: IPreviewColumn) => ({
                name: column.field,
                field: column.field,
                label: column.header,
                type: column.type,
                align: 'left',
                sortable: false,
                style: datasetPreviewTableDescriptor.columnStyle,
                headerStyle: datasetPreviewTableDescriptor.columnStyle
            }))
        }
    },
    watch: {
        previewColumns() {
            this.loadColumns()
        },
        previewRows() {
            this.loadRows()
        },
        pagination: {
            handler() {
                this.loadPagination()
            },
            deep: true
        }
    },
    created() {
        this.loadColumns()
        this.loadRows()
        this.loadPagination()
    },
    methods: {
        loadColumns() {
            this.columns = []
            this.previewColumns?.forEach((el: IPreviewColumn) => {
                this.columns.push(el)
                if (!(el.field in this.searchInput)) {
                    this.searchInput[el.field] = ''
                }
                if (!(el.field in this.searchVisible)) {
                    this.searchVisible[el.field] = false
                }
            })
        },
        loadRows() {
            this.rows = this.previewRows as Record<string, unknown>[]
        },
        loadPagination() {
            const pagination = this.pagination as IPreviewPagination
            const rowsPerPage = pagination?.limit || 15
            const start = pagination?.start || 0
            this.lazyParams = pagination
            this.syncingPagination = true
            this.tablePagination = {
                ...this.tablePagination,
                page: Math.floor(start / rowsPerPage) + 1,
                rowsPerPage,
                rowsNumber: pagination?.size || 0
            }
            setTimeout(() => {
                this.syncingPagination = false
            })
        },
        onRequest(event: { pagination: ITablePagination }) {
            const previousPagination = { ...this.tablePagination }
            const nextPagination = {
                ...this.tablePagination,
                ...event.pagination,
                rowsNumber: this.lazyParams.size || 0
            }

            this.tablePagination = nextPagination

            if (this.syncingPagination) {
                return
            }

            const pageChanged = previousPagination.page !== nextPagination.page || previousPagination.rowsPerPage !== nextPagination.rowsPerPage

            if (pageChanged) {
                const paginationStart = (nextPagination.page - 1) * nextPagination.rowsPerPage
                this.$emit('pageChanged', {
                    paginationStart,
                    paginationLimit: nextPagination.rowsPerPage,
                    paginationEnd: paginationStart + nextPagination.rowsPerPage,
                    size: this.lazyParams.size
                })
            }
        },
        onSortClick(field: string) {
            let descending = false

            if (this.tablePagination.sortBy === field) {
                descending = !this.tablePagination.descending
            }

            this.tablePagination = {
                ...this.tablePagination,
                sortBy: field,
                descending
            }

            this.emitSort(field, descending)
        },
        emitSort(sortField: string | null, descending: boolean) {
            if (!sortField) return

            let column = ''
            const index = this.columns.findIndex((el: IPreviewColumn) => el.field === sortField)
            if (index !== -1) {
                column = this.columns[index].header
            }

            this.$emit('sort', { column, order: descending ? 'desc' : 'asc' })
        },
        getSortIcon(field: string) {
            if (this.tablePagination.sortBy !== field) {
                return 'unfold_more'
            }

            return this.tablePagination.descending ? 'south' : 'north'
        },
        getTypeIcon(type?: string) {
            const normalizedType = type?.toLowerCase() ?? ''

            if (normalizedType.includes('date') || normalizedType.includes('time')) {
                return 'event'
            }

            if (normalizedType.includes('bool')) {
                return 'toggle_on'
            }

            if (
                normalizedType.includes('int') ||
                normalizedType.includes('number') ||
                normalizedType.includes('decimal') ||
                normalizedType.includes('double') ||
                normalizedType.includes('float') ||
                normalizedType.includes('long') ||
                normalizedType.includes('short')
            ) {
                return 'tag'
            }

            if (normalizedType.includes('binary') || normalizedType.includes('blob')) {
                return 'attachment'
            }

            return 'abc'
        },
        onFilter(column: IPreviewColumn) {
            const filter = { column: column.label ?? column.header, value: this.searchInput[column.field] }
            const index = this.customFilters.findIndex((el: { column: string; value: string }) => el.column === filter.column)

            if (index !== -1) {
                if (!filter.value) {
                    this.customFilters.splice(index, 1)
                } else {
                    this.customFilters[index] = filter
                }
            } else if (filter.value) {
                this.customFilters.push(filter)
            }

            this.$emit('filter', [...this.customFilters])
        },
        getCellValue(row: Record<string, unknown>, field: string) {
            const value = row?.[field]
            return value === null || value === undefined ? '' : String(value)
        },
        getRowKey(row: Record<string, unknown>) {
            return this.columns.map((column: IPreviewColumn) => String(row?.[column.field] ?? '')).join('|')
        },
        getPaginationLabel(firstRowIndex: number, endRowIndex: number, totalRows: number) {
            return this.$t('common.table.footer.paginated', { first: firstRowIndex, last: endRowIndex, totalRecords: totalRows })
        }
    }
})
</script>

<style lang="scss">
#preview-datatable {
    height: 100%;
}

#preview-datatable :deep(.q-table__middle) {
    height: auto;
}

#preview-datatable :deep(.q-table thead tr th) {
    padding: 4px 8px;
}

#preview-datatable :deep(.q-table tbody tr) {
    height: 22px;
}

#preview-datatable :deep(.q-table tbody tr td) {
    padding: 1px 6px;
    height: 22px;
    vertical-align: middle;
}

.dataset-preview-header {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    font-size: 0.9rem;
}

.dataset-preview-header__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    cursor: default;

    &.dataset-preview-header__text--interactive {
        cursor: pointer;
    }

    small {
        display: inline-flex;
        align-items: center;
        color: var(--kn-color-default);
        border-top: 1px solid var(--kn-color-borders);
        font-size: 0.75rem;
    }
}



.dataset-preview-header__type {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}

.dataset-preview-header__actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
}

.dataset-preview-filter-menu {
    min-width: 220px;
}

.dataset-preview-cell {
    display: inline-block;
    max-width: 100%;
    font-size: 0.72rem;
    line-height: 1.1;
    vertical-align: middle;
}
</style>
