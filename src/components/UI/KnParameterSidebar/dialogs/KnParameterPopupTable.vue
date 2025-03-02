<template>
    <DataTable
        v-model:selection="selectedRow"
        v-model:filters="filters"
        :value="rows"
        class="p-datatable-sm kn-table"
        :selection-mode="multivalue ? false : 'single'"
        :global-filter-fields="globalFilterFields"
        :paginator="rows.length > 20"
        :rows="20"
        responsive-layout="stack"
        breakpoint="600px"
        :scrollable="true"
        :scroll-height="knParameterPopupDialogDescriptor.dialog.scrollHeight"
        @row-select="setSelectedRow"
        @row-unselect="setSelectedRow"
        @row-select-all="setSelectedRow"
        @row-unselect-all="setSelectedRow"
    >
        <template #empty>
            <Message class="p-m-2" severity="info" :closable="false" :style="knParameterPopupDialogDescriptor.styles.message">
                {{ $t('common.info.noDataFound') }}
            </Message>
        </template>

        <template #header>
            <div class="table-header p-d-flex p-ai-center">
                <span id="search-container" class="p-input-icon-left p-mr-3">
                    <i class="pi pi-search" />
                    <InputText v-model="filters['global'].value" class="kn-material-input" type="text" :placeholder="$t('common.search')" data-test="search-input" />
                </span>
            </div>
        </template>

        <Column v-if="multivalue" selection-mode="multiple" :style="knParameterPopupDialogDescriptor.styles.checkboxColumn"></Column>
        <Column v-for="col of columns" :key="col.field" class="kn-truncated" :field="col.field" :header="col.header" :sortable="true"> </Column>
    </DataTable>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { filterDefault } from '@/helpers/commons/filterHelper'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import knParameterPopupDialogDescriptor from './KnParameterPopupDialogDescriptor.json'
import Message from 'primevue/message'

export default defineComponent({
    name: 'kn-parameter-popup-dialog',
    components: { Column, DataTable, Message },
    props: { parameterPopUpData: { type: Object }, multivalue: { type: Boolean }, multipleSelectedRows: { type: Array } },
    emits: ['selected'],
    data() {
        return {
            knParameterPopupDialogDescriptor,
            rows: [] as any[],
            columns: [] as { header: string; field: string }[],
            filters: { global: [filterDefault] } as Object,
            globalFilterFields: [] as string[],
            selectedRow: null as any
        }
    },
    watch: {
        parameterPopUpData() {
            this.loadData()
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        loadData() {
            if (!this.parameterPopUpData) return
            this.rows = this.parameterPopUpData.result.data

            this.columns = []

            let keyMap: any[] = []
            let pref: string = ''

            Object.keys(this.parameterPopUpData.result.metadata.colsMap).forEach((col) => {
                const colMatch = col.match(/(?<pref>[a-zA-Z_\-\.]+)(?<key>\d+)/)
                if (colMatch && colMatch.groups) {
                    pref = colMatch.groups.pref // col_
                    keyMap.push(parseInt(colMatch.groups.key)) // 1-2
                }
            })

            keyMap = keyMap.sort().map((k) => pref + k)

            keyMap.forEach((key: string) => {
                if (this.parameterPopUpData?.result.metadata.visibleColumns?.includes(this.parameterPopUpData.result.metadata.colsMap[key])) {
                    this.columns.push({
                        header: this.parameterPopUpData?.result.metadata.colsMap[key],
                        field: key
                    })
                }
            })

            this.columns.forEach((el: any) => this.globalFilterFields.push(el.field))

            this.selectedRow = this.multipleSelectedRows
        },
        setSelectedRow() {
            setTimeout(() => this.$emit('selected', this.selectedRow), 10)
        }
    }
})
</script>
