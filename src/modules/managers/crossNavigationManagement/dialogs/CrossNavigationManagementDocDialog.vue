<template>
    <q-dialog :model-value="dialogVisible" persistent>
        <q-card style="width: 70vw; max-width: 95vw">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('managers.crossNavigationManagement.selectDocument') }}</q-toolbar-title>
                <q-btn flat round dense icon="close" @click="closeDialog" />
            </q-toolbar>

            <q-card-section class="q-pb-none">
                <q-input v-model="filterText" :placeholder="$t('common.search')" dense outlined clearable data-test="search-input">
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </q-card-section>

            <q-card-section style="max-height: 60vh; overflow: auto">
                <q-table :rows="documents.item || []" :columns="tableColumns" :filter="filterText" row-key="DOCUMENT_ID" dense flat bordered :loading="loading" :rows-per-page-options="[15, 20, 50]" @row-click="handleRowClick">
                    <template #no-data>{{ $t('common.info.noDataFound') }}</template>
                </q-table>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'

export default defineComponent({
    name: 'doc-dialog',
    props: {
        dialogVisible: { type: Boolean, default: false },
        selectedDoc: { type: [Number, Object], required: false }
    },
    emits: ['close', 'apply'],
    data() {
        return {
            loading: false,
            filterText: '' as string,
            documents: [] as any,
            tableColumns: [
                { name: 'DOCUMENT_LABEL', label: this.$t('common.label'), field: 'DOCUMENT_LABEL', align: 'left' as const, sortable: true },
                { name: 'DOCUMENT_NAME', label: this.$t('common.name'), field: 'DOCUMENT_NAME', align: 'left' as const, sortable: true },
                { name: 'DOCUMENT_DESCR', label: this.$t('common.description'), field: 'DOCUMENT_DESCR', align: 'left' as const, sortable: true }
            ]
        }
    },
    watch: {
        async dialogVisible(val: boolean) {
            if (val) {
                await this.loadAllDoc()
            }
        }
    },
    methods: {
        closeDialog() {
            this.$emit('close')
        },
        async loadAllDoc() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents/listDocument')
                .then((response: AxiosResponse<any>) => (this.documents = response.data))
                .finally(() => (this.loading = false))
        },
        handleRowClick(_evt: Event, row: any) {
            this.$emit('apply', row)
        }
    }
})
</script>
