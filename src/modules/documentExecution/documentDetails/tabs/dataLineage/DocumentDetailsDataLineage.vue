<template>
    <q-scroll-area class="dd-scroll dd-tab-detail-scroll">
        <div class="dd-lineage-container">
            <q-card flat bordered>
                <q-card-section class="q-py-sm">
                    <div class="dd-section-label">{{ $t('managers.datasetManagement.availableTables') }}</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none">
                    <q-select class="q-mx-md q-my-md" outlined dense v-model="dataSource" :options="metaSourceResource" option-label="name" :label="$t('documentExecution.documentDetails.dataLineage.selectSource')" @update:model-value="getTablesBySourceID" />
                    <q-separator v-if="dataSource && tablesList.length > 0 && !loading" class="q-mb-sm"></q-separator>
                    <q-banner v-if="metaSourceResource.length === 0" class="bg-info text-black q-ma-md" dense rounded>
                        {{ $t('documentExecution.documentDetails.dataLineage.noDatasources') }}
                    </q-banner>
                    <q-banner v-if="dataSource && tablesList.length === 0 && metaSourceResource.length !== 0 && !loading" class="bg-info text-black q-ma-md" dense rounded>
                        {{ $t('documentExecution.documentDetails.dataLineage.noTables') }}
                    </q-banner>

                    <q-linear-progress v-if="loading" indeterminate class="q-mb-sm" data-test="progress-bar" />

                    <q-table v-if="dataSource && tablesList.length > 0 && !loading" v-model:selected="selectedTables" :rows="tablesList" :columns="tableColumns" :filter="filterText" :rows-per-page-options="[10, 25, 50, 0]" :pagination="{ rowsPerPage: 10 }" row-key="tableId" selection="multiple" dense flat @update:selected="onSelectionChange">
                        <template #top>
                            <q-input v-model="filterText" outlined dense :placeholder="$t('common.search')" class="full-width q-pa-none q-ma-none" data-test="search-input">
                                <template #prepend><q-icon name="search" /></template>
                            </q-input>
                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </div>
    </q-scroll-area>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iDocument, iMetaSource, iTableSmall } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { AxiosResponse } from 'axios'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'data-lineage',
    props: { selectedDocument: { type: Object as PropType<iDocument>, required: true }, metaSourceResource: { type: Array as PropType<iMetaSource[]>, required: true }, savedTables: { type: Array as PropType<iTableSmall[]>, required: true } },
    emits: [],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            dataSource: null as iMetaSource | null,
            tablesList: [] as iTableSmall[],
            selectedTables: [] as iTableSmall[],
            loading: false,
            filterText: '',
            tableColumns: [{ name: 'name', label: this.$t('managers.datasetManagement.flatTableName'), field: 'name', sortable: true, align: 'left' as const }]
        }
    },
    methods: {
        async getTablesBySourceID() {
            if (!this.dataSource) return
            this.loading = true
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/metaSourceResource/${this.dataSource.sourceId}/metatables`)
                .then((response: AxiosResponse<any>) => {
                    this.tablesList = response.data as iTableSmall[]
                    this.selectedTables = []
                    this.setCheckedTables()
                })
                .finally(() => (this.loading = false))
        },
        setCheckedTables() {
            this.selectedTables = this.tablesList.filter((t) => this.savedTables.some((s) => s.tableId === t.tableId))
        },
        onSelectionChange(newSelection: readonly iTableSmall[]) {
            const added = newSelection.filter((t) => !this.selectedTables.find((s) => s.tableId === t.tableId))
            const removed = this.selectedTables.filter((t) => !newSelection.find((s) => s.tableId === t.tableId))
            added.forEach((t) => this.persistTable(t))
            removed.forEach((t) => this.deleteTable(t))
            this.selectedTables = [...newSelection]
        },
        persistTable(table: iTableSmall) {
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/metaDocumetRelationResource/${this.selectedDocument.id}`, table, {
                    headers: { 'X-Disable-Errors': 'true' }
                })
                .then(() => this.store.setInfo({ title: this.$t('common.save'), msg: this.$t('documentExecution.documentDetails.dataLineage.persistOk') }))
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.dataLineage.persistError') }))
        },
        deleteTable(table: iTableSmall) {
            this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/metaDocumetRelationResource/${this.selectedDocument.id}/${table.tableId}`, {
                    headers: { 'X-Disable-Errors': 'true' }
                })
                .then(() => this.store.setInfo({ title: this.$t('common.save'), msg: this.$t('documentExecution.documentDetails.dataLineage.deleteOk') }))
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.dataLineage.deleteError') }))
        }
    }
})
</script>

<style lang="scss" scoped>
.dd-lineage-container {
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    padding: 16px;
}
</style>
