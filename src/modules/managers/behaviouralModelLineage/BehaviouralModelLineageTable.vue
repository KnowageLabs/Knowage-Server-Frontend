<template>
    <div class="bml-qtable">
        <q-card flat bordered class="kn-flex">
            <q-toolbar class="bg-grey-1">
                <q-icon :name="headerIcon" size="18px" color="grey-9" class="q-mr-sm" />
                <div class="bml-title ellipsis">
                    {{ headerTitle }}
                </div>
                <q-spinner v-if="loading" size="18px" color="grey-8" class="q-ml-sm" />
                <q-space />
                <q-input v-model="filter" dense outlined clearable debounce="250" :placeholder="$t('common.search')" style="width: 180px">
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </q-toolbar>

            <q-separator />

            <div class="bml-table-wrap">
                <q-inner-loading :showing="!!loading">
                    <q-spinner size="36px" color="primary" />
                </q-inner-loading>

                <!-- When ANY table is still loading, we must prevent clicks on rows entirely -->
                <div v-if="selectionLocked" class="bml-click-blocker" aria-hidden="true" />

                <q-table :key="renderKey" class="kn-table" :rows="tableData" :columns="columns" :row-key="rowKey" dense flat :filter="filter" :pagination="pagination" :rows-per-page-options="[10, 25, 50, 100]" separator="horizontal" row-class="bml-row" :row-class-fn="rowClass" @row-click="onRowClick">
                    <template #body-cell-label="props">
                        <q-td :props="props" :class="{ 'bml-td--selected': isRowSelected(props.row) }">
                            <q-chip dense square class="q-ma-none bml-chip" :class="{ 'bml-chip--selected': isRowSelected(props.row) }" :title="props.row.label">
                                <span class="ellipsis">{{ props.row.label }}</span>
                            </q-chip>
                        </q-td>
                    </template>

                    <template #no-data>
                        <div class="full-width row flex-center q-pa-md text-grey-7">
                            {{ $t('common.info.noDataFound') }}
                        </div>
                    </template>
                </q-table>
            </div>
        </q-card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { QCard, QChip, QIcon, QInnerLoading, QInput, QSeparator, QSpace, QSpinner, QTable, QTd, QToolbar } from 'quasar'

export default defineComponent({
    name: 'behavioural-model-lineage-table',
    components: {
        QCard,
        QToolbar,
        QSpace,
        QInput,
        QIcon,
        QSeparator,
        QInnerLoading,
        QSpinner,
        QTable,
        QTd,
        QChip
    },
    props: {
        tableData: { type: Array as any, required: true },
        headerTitle: { type: String, required: false, default: '' },
        dataType: { type: String, required: false, default: '' },
        loading: { type: Boolean, required: false, default: false },
        selectionLocked: { type: Boolean, required: false, default: false }
    },
    emits: ['rowSelected', 'rowUnselected'],
    data() {
        return {
            filter: '',
            selectedKey: null as string | null,
            renderKey: 0,
            pagination: { rowsPerPage: 25 } as any,
            // Datasets expose the unique key as row.id.dsId; other entities usually have a flat `id`.
            rowKey: (row: any) => String(row?.id?.dsId ?? row?.id ?? row?.dsId ?? row?.label ?? row?.name ?? ''),
            columns: [
                {
                    name: 'label',
                    label: '',
                    field: 'label',
                    align: 'left',
                    sortable: true
                }
            ] as any[]
        }
    },
    computed: {
        headerIcon(): string {
            switch (this.dataType) {
                case 'documents':
                    return 'description'
                case 'datasets':
                    return 'table_view'
                case 'analyticalDrivers':
                    return 'tune'
                case 'lovs':
                    return 'list_alt'
                default:
                    return 'chevron_right'
            }
        }
    },
    watch: {
        tableData() {
            // Force QTable to re-evaluate row classes after rows refresh.
            this.renderKey++
            if (this.selectedKey === null) return
            const hasSelected = Array.isArray(this.tableData) && this.tableData.some((r: any) => (this.rowKey as any)(r) === this.selectedKey)
            if (!hasSelected) this.selectedKey = null
        }
    },
    methods: {
        isRowSelected(row: any) {
            const key = (this.rowKey as any)(row)
            return this.selectedKey !== null && key === this.selectedKey
        },
        rowClass(row: any) {
            const key = (this.rowKey as any)(row)
            const selected = this.selectedKey !== null && key === this.selectedKey ? 'bml-row--selected' : ''
            const locked = this.selectionLocked ? 'bml-row--locked' : ''
            return [selected, locked].filter(Boolean).join(' ')
        },
        onRowClick(_evt: any, row: any) {
            if (this.selectionLocked) return
            const key = (this.rowKey as any)(row) as string

            // toggle selection
            if (this.selectedKey !== null && key === this.selectedKey) {
                this.selectedKey = null
                this.$emit('rowUnselected', {}, this.dataType)
                return
            }

            this.selectedKey = key
            this.$emit('rowSelected', { data: row }, this.dataType)
        }
    }
})
</script>

<style lang="scss">
.bml-qtable {
    width: 100%;
}

.bml-qtable .bml-title {
    color: rgba(0, 0, 0, 0.85);
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.2px;
    text-transform: uppercase;
}

.bml-qtable .q-table__middle {
    min-height: 260px;
}

.bml-qtable .q-table tbody tr:hover {
    background: rgba(0, 0, 0, 0.03);
}

.bml-qtable .q-table tbody tr.bml-row.bml-row--selected,
.bml-qtable .q-table tbody tr.bml-row.bml-row--selected:hover,
.bml-qtable .q-table tbody tr.bml-row.bml-row--selected:active {
    background: rgba(25, 118, 210, 0.16);
    box-shadow: inset 3px 0 0 rgba(25, 118, 210, 0.9);
}

.bml-qtable .q-table tbody tr.bml-row.bml-row--selected td {
    font-weight: 600;
}

.bml-qtable .q-table .bml-chip {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.9);
}

.bml-qtable .q-table .bml-chip.bml-chip--selected {
    background: rgba(25, 118, 210, 0.22);
    color: rgba(0, 0, 0, 0.92);
}

.bml-qtable .q-table td.bml-td--selected {
    box-shadow: inset 3px 0 0 rgba(25, 118, 210, 0.9);
}

.bml-qtable .q-table tbody tr.bml-row--locked {
    cursor: not-allowed;
}

.bml-qtable .bml-table-wrap {
    position: relative;
    flex: 1;
}

.bml-qtable .bml-click-blocker {
    position: absolute;
    inset: 0;
    z-index: 5;
    cursor: wait;
    background: transparent;
}

.bml-qtable .ellipsis {
    max-width: 100%;
}
</style>
