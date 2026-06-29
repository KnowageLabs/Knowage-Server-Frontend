<template>
    <q-scroll-area class="dd-scroll dd-tab-detail-scroll">
        <div class="dd-subreports-container">
            <q-card flat bordered>
                <q-card-section class="q-py-sm">
                    <div class="dd-section-label">{{ $t('documentExecution.documentDetails.subreports.tableName') }}</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-none">
                    <q-banner class="bg-info text-black q-mx-md q-mt-md q-mb-sm" dense rounded>
                        {{ $t('documentExecution.documentDetails.subreports.info') }}
                    </q-banner>

                    <q-linear-progress v-if="loading" indeterminate class="q-mb-sm" data-test="progress-bar" />

                    <q-table v-if="!loading" v-model:selected="selectedSubreports" :rows="allDocumentDetailsProp" :columns="tableColumns" :filter="filterText" :rows-per-page-options="[10, 25, 50, 0]" :pagination="{ rowsPerPage: 10 }" row-key="id" selection="multiple" dense flat data-test="subreports-table" @update:selected="onSelectionChange">
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
import { iDocument } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { AxiosResponse } from 'axios'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'document-details-subreports',
    props: { selectedDocument: { type: Object as PropType<iDocument>, required: true }, allDocumentDetailsProp: { type: Array as any, required: true } },
    emits: [],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            savedSubreports: [] as any[],
            selectedSubreports: [] as any[],
            loading: false,
            filterText: '',
            tableColumns: [
                { name: 'label', label: this.$t('common.label'), field: 'label', sortable: true, align: 'left' as const },
                { name: 'name', label: this.$t('common.name'), field: 'name', sortable: true, align: 'left' as const },
                { name: 'description', label: this.$t('common.description'), field: 'description', sortable: true, align: 'left' as const }
            ]
        }
    },
    watch: {
        async allDocumentDetailsProp() {
            await this.getSelectedSubreports()
        }
    },
    async created() {
        await this.getSelectedSubreports()
    },
    methods: {
        async getSelectedSubreports() {
            if (!this.selectedDocument?.id) return
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/subreports`)
                .then((response: AxiosResponse<any>) => {
                    this.savedSubreports = response.data
                    this.setCheckedSubreports()
                })
                .finally(() => (this.loading = false))
        },
        setCheckedSubreports() {
            this.selectedSubreports = this.allDocumentDetailsProp.filter((doc: any) => this.savedSubreports.some((s: any) => s.sub_rpt_id === doc.id))
        },
        onSelectionChange(newSelection: readonly any[]) {
            const added = newSelection.filter((t) => !this.selectedSubreports.find((s) => s.id === t.id))
            const removed = this.selectedSubreports.filter((t) => !newSelection.find((s) => s.id === t.id))
            added.forEach((t) => this.persistSubreport(t))
            removed.forEach((t) => this.deleteSubreport(t))
            this.selectedSubreports = [...newSelection]
        },
        persistSubreport(doc: any) {
            const postData = { ...doc }
            delete postData.dataSetLabel
            delete postData.creationDate
            postData.refreshSeconds = parseInt(postData.refreshSeconds)
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/subreports`, postData, {
                    headers: { 'X-Disable-Errors': 'true' }
                })
                .then(() => this.store.setInfo({ title: this.$t('common.save'), msg: this.$t('documentExecution.documentDetails.subreports.persistOk') }))
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.subreports.persistError') }))
        },
        deleteSubreport(doc: any) {
            this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/subreports/${doc.id}`, {
                    headers: { 'X-Disable-Errors': 'true' }
                })
                .then(() => this.store.setInfo({ title: this.$t('common.save'), msg: this.$t('documentExecution.documentDetails.subreports.deleteOk') }))
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.subreports.deleteError') }))
        }
    }
})
</script>

<style lang="scss" scoped>
.dd-subreports-container {
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    padding: 16px;
}
</style>
