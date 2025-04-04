<template>
    <Card class="p-m-2">
        <template #header>
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>{{ $t('managers.cacheManagement.addRemoveDataset') }}</q-toolbar-title>

                <q-btn flat round dense icon="clear_all" data-test="reset-button" @click="cleanAllConfirm">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('managers.cacheManagement.cleanAll') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
        </template>
        <template #content>
            <q-table dense flat hide-pagination :rows="datasets" :columns="datasetTableCardDescriptor.columns" row-key="label">
                <template #header-cell="props">
                    <q-th style="text-align: start" v-if="props.col.label">{{ $t(props.col.label) }}</q-th>
                </template>
                <template #body-cell-button="props">
                    <q-btn flat round dense icon="delete" data-test="delete-button" @click="deleteDatasetConfirm(props.row.signature)"></q-btn>
                </template>
            </q-table>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iMeta } from '../../CacheManagement'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import datasetTableCardDescriptor from './DatasetTableCardDescriptor.json'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'dataset-table-card',
    components: {
        Card,
        Column,
        DataTable
    },
    props: {
        datasetMetadataList: {
            type: Array,
            required: true
        },
        loading: {
            type: Boolean
        }
    },
    emits: ['deleted'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            datasetTableCardDescriptor,
            datasets: [] as iMeta[]
        }
    },
    computed: {
        cleanAllDisabled(): boolean {
            return this.datasets.length === 0
        }
    },
    watch: {
        datasetMetadataList() {
            this.loadDatasets()
        }
    },
    created() {
        this.loadDatasets()
    },
    methods: {
        loadDatasets() {
            this.datasets = this.datasetMetadataList as iMeta[]
        },
        cleanAllConfirm() {
            this.$confirm.require({
                message: this.$t('managers.cacheManagement.cleanAllMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.cleanAll()
            })
        },
        async cleanAll() {
            await this.$http.delete(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/cacheee').then(() => this.emitDeleteSuccess())
        },
        deleteDatasetConfirm(signature: string) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteDataset(signature)
            })
        },
        async deleteDataset(signature: string) {
            await this.$http.put(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/cacheee/deleteItems', { namesArray: [signature] }).then(() => this.emitDeleteSuccess())
        },
        emitDeleteSuccess() {
            this.store.setInfo({
                title: this.$t('common.toast.deleteTitle'),
                msg: this.$t('common.toast.deleteSuccess')
            })
            this.$emit('deleted')
        }
    }
})
</script>

<style lang="scss" scoped>
::v-deep(.p-toolbar-group-right) {
    height: 100%;
}
</style>
