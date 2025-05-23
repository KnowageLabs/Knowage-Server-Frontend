<template>
    <Dialog class="kn-dialog--toolbar--primary datasetListDialogClass" :visible="visibility" :header="$t('workspace.advancedData.chooseDataset')" :closable="false" modal :breakpoints="{ '960px': '75vw', '640px': '100vw' }">
        <DataTable
            id="datasets-datatable"
            :value="filteredDatasets"
            :selection="selectedDataset"
            selection-mode="single"
            :paginator="true"
            :rows="KnDatasetListDescriptor.rows"
            :loading="loading"
            class="p-datatable-sm kn-table kn-page-content"
            data-key="id"
            :responsive-layout="KnDatasetListDescriptor.responsiveLayout"
            :breakpoint="KnDatasetListDescriptor.breakpoint"
            @rowClick="handleClick($event.data)"
        >
            <template #loading>
                {{ $t('common.info.dataLoading') }}
            </template>
            <template #empty>
                <div id="noDatasetsFound">
                    {{ $t('workspace.advancedData.noDatasetFound') }}
                </div>
            </template>
            <template #header>
                <div class="table-header p-d-flex">
                    <span class="p-input-icon-left p-mr-3 p-col-12">
                        <i class="pi pi-search" />
                        <InputText v-model="searchWord" class="kn-material-input" type="text" :placeholder="$t('common.search')" data-test="search-input" @input="searchDatasets" />
                    </span>
                </div>
            </template>
            <Column v-for="col of KnDatasetListDescriptor.columns" :key="col.field" class="kn-truncated" :style="col.style" :header="$t(col.header)" :sort-field="col.field" :sortable="col.field !== 'icon'">
                <template #body="slotProps">
                    <span v-if="col.field !== 'icon'" v-tooltip.top="slotProps.data[col.field]"> {{ slotProps.data[col.field] }}</span>
                    <span v-else>
                        <div style="height: 1.57rem"></div>
                    </span>
                </template>
            </Column>
        </DataTable>
        <template #footer>
            <Button class="kn-button kn-button--secondary" :label="$t('common.cancel')" @click="cancel" />
            <Button class="kn-button kn-button--primary" :disabled="!isDatasetSelected" @click="apply">{{ $t('common.open') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iDataset } from './KnDatasetList'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import KnDatasetListDescriptor from './KnDatasetListDescriptor.json'
import { mapActions } from 'pinia'

import mainStore from '@/App.store'

export default defineComponent({
    name: 'datasets-catalog-datatable',
    components: { Column, DataTable, Dialog },
    props: {
        items: [] as PropType<Array<iDataset>>,
        visibility: Boolean
    },
    emits: ['selected', 'save', 'cancel'],
    data() {
        return {
            KnDatasetListDescriptor,
            datasets: [] as iDataset[],
            filteredDatasets: [] as iDataset[],
            selectedDataset: {},
            searchWord: '',
            loading: false,
            isDatasetSelected: false
        }
    },
    computed: {
        isEmpty() {
            return Object.keys(this.selectedDataset).length == 0
        }
    },
    updated() {
        if (this.items) this.datasets = this.items
        this.filteredDatasets = [...this.datasets]
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError']),
        apply(): void {
            this.$emit('save', this.selectedDataset)
            this.clearForm()
        },
        cancel(): void {
            this.$emit('cancel', this.selectedDataset)
            this.clearForm()
        },
        clearForm(): void {
            this.selectedDataset = {}
            this.isDatasetSelected = false
        },
        searchDatasets() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.filteredDatasets = [...this.datasets] as any[]
                } else {
                    this.filteredDatasets = this.datasets.filter((tempDataset: any) => {
                        return tempDataset.label.toLowerCase().includes(this.searchWord.toLowerCase()) || tempDataset.name.toLowerCase().includes(this.searchWord.toLowerCase()) || tempDataset.dsTypeCd.toLowerCase().includes(this.searchWord.toLowerCase())
                    })
                }
            }, 250)
        },
        handleClick(data) {
            this.$emit('selected', data)
            this.isDatasetSelected = true
        }
    }
})
</script>

<style lang="scss">
.datasetListDialogClass {
    min-width: 600px;
    width: 60%;
    max-width: 1200px;
}

#noDatasetsFound {
    margin: 0 auto;
    border: 1px solid rgba(204, 204, 204, 0.6);
    padding: 0.5rem;
    background-color: #e6e6e6;
    text-align: center;
    text-transform: uppercase;
    font-size: 0.8rem;
    width: 80%;
}

#datasets-datatable .p-datatable-wrapper {
    height: auto;
}
</style>
