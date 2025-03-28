<template>
    <Card class="p-mb-3">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--secondary p-p-0 p-m-0 p-col-12">
                <template #start>{{ $t('common.dataset') }}</template>
                <template #end>
                    <Button v-if="documentData.selectedDataset.length === 0" class="p-button-link" :label="$t('workspace.gis.dnl.addDataset')" @click="showDatasetDialog" />
                    <Button v-else class="p-button-link" :label="$t('workspace.gis.dnl.changeDataset')" @click="showDatasetDialog" />
                </template>
            </Toolbar>
        </template>
        <template #content>
            <DataTable class="p-datatable-sm kn-table georef-step1-table" :value="documentData.selectedDataset" data-key="id" responsive-layout="scroll" breakpoint="600px">
                <template #empty>
                    {{ $t('workspace.gis.dnl.emptyInfo') }}
                </template>
                <Column v-for="col of columns" :key="col.field" :field="col.field" :header="$t(col.header)">
                    <template #body="{ data }">
                        <span v-tooltip.top="data[col.field]" class="kn-truncated">{{ data[col.field] }}</span>
                    </template>
                </Column>
                <Column :style="styleDescriptor.style.trashColumn" @rowClick="false">
                    <template #body="">
                        <Button icon="pi pi-trash" class="p-button-link" @click="deleteSelectedDataset" />
                    </template>
                </Column>
            </DataTable>
        </template>
    </Card>

    <Dialog v-if="datasetDialogVisible" class="p-fluid kn-dialog--toolbar--primary" :style="styleDescriptor.style.dialogSize" :visible="datasetDialogVisible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>{{ $t('workspace.gis.dnl.datasetList') }}</template>
            </Toolbar>
        </template>
        <DataTable
            v-model:selection="selectedDataset"
            v-model:filters="filters"
            class="p-datatable-sm kn-table kn-width-full"
            :value="availableDatasets"
            data-key="id"
            selection-mode="single"
            :scrollable="true"
            scroll-height="40vh"
            :global-filter-fields="globalFilterFields"
            :loading="loading"
            responsive-layout="scroll"
        >
            <template #header>
                <div class="table-header p-d-flex p-ai-center">
                    <span id="search-container" class="p-input-icon-left p-mr-3">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value" class="kn-material-input" :placeholder="$t('common.search')" data-test="search-input" />
                    </span>
                </div>
            </template>
            <template #empty>
                {{ $t('workspace.gis.dnl.dialogEmptyInfo') }}
            </template>
            <Column v-for="col of columns" :key="col.field" :field="col.field" :header="$t(col.header)">
                <template #body="{ data }">
                    <span v-tooltip.top="data[col.field]" class="kn-truncated">{{ data[col.field] }}</span>
                </template>
            </Column>
        </DataTable>
        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--secondary" data-test="close-button" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
                <Button class="kn-button kn-button--primary" data-test="save-button" @click="saveDatasetSelection"> {{ $t('common.save') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { filterDefault } from '@/helpers/commons/filterHelper'
import descriptor from './GisDocumentDesignerDataset&LayerDescriptor.json'
import styleDescriptor from '@/modules/workspace/gisDocumentDesigner/GisDocumentDesignerDescriptor.json'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'

import deepcopy from 'deepcopy'

export default defineComponent({
    components: {
        DataTable,
        Column,
        Dialog
    },
    props: { documentDataProp: { type: Object as any, required: false }, isDatasetChosen: Object },
    emits: ['datasetDeleted', 'datasetChanged'],
    data() {
        return {
            descriptor,
            styleDescriptor,
            columns: descriptor.datasetColumns,
            globalFilterFields: descriptor.datasetFilterFields,
            filters: { global: [filterDefault] } as Object,
            loading: false,
            datasetDialogVisible: false,
            availableDatasets: [] as any,
            selectedDataset: {} as any,
            documentData: {} as any
        }
    },
    computed: {},
    created() {
        this.documentData = this.documentDataProp
    },
    methods: {
        showDatasetDialog() {
            this.$confirm.require({
                header: this.$t('common.toast.warning'),
                message: this.$t('workspace.gis.dnl.changeDsMessage'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.openDatasetDialog()
                }
            })
        },
        openDatasetDialog() {
            this.selectedDataset = deepcopy(this.documentData.selectedDataset[0])
            this.datasetDialogVisible = true
            this.getAllDatasets()
        },
        async getAllDatasets() {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/mydatanoparams`).then((response: AxiosResponse<any>) => (this.availableDatasets = response.data.root))
            this.loading = false
        },
        closeDialog() {
            this.filters['global'].value = null
            this.datasetDialogVisible = false
        },
        deleteSelectedDataset() {
            this.documentData.selectedDataset = []
            this.documentData.datasetLabel = ''
            this.$emit('datasetDeleted')
        },
        saveDatasetSelection() {
            this.documentData.selectedDataset[0] = deepcopy(this.selectedDataset)
            this.$emit('datasetChanged', this.selectedDataset)
            this.datasetDialogVisible = false
        }
    }
})
</script>
