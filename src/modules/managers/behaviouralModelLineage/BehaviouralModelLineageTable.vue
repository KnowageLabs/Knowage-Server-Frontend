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

            <q-inner-loading :showing="!!loading">
                <q-spinner size="36px" color="primary" />
            </q-inner-loading>

            <q-table class="kn-table" :rows="tableData" :columns="columns" :row-key="rowKey" dense flat :filter="filter" :pagination="pagination" :rows-per-page-options="[10, 25, 50, 100]" separator="horizontal" selection="single" v-model:selected="selected" @selection="onSelection">
                <template #body-cell-label="props">
                    <q-td :props="props">
                        <q-chip dense square color="grey-2" text-color="grey-9" class="q-ma-none" :title="props.row.label">
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
        loading: { type: Boolean, required: false, default: false }
    },
    emits: ['rowSelected', 'rowUnselected'],
    data() {
        return {
            filter: '',
            selected: [] as any[],
            pagination: { rowsPerPage: 25 } as any,
            // Datasets expose the unique key as row.id.dsId; other entities usually have a flat `id`.
            rowKey: (row: any) => row?.id?.dsId ?? row?.id ?? row?.dsId ?? row?.label ?? row?.name,
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
            this.selected = []
        }
    },
    methods: {
        onSelection(details: any) {
            if (details?.added) {
                const row = (details.rows && details.rows[0]) || (this.selected && this.selected[0])
                if (row) this.$emit('rowSelected', { data: row }, this.dataType)
                return
            }
            this.$emit('rowUnselected', {}, this.dataType)
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

.bml-qtable .ellipsis {
    max-width: 100%;
}
</style>
},
