<template>
    <q-dialog :model-value="visible" persistent>
        <q-card style="width: 60%; max-width: 800px">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('dashboard.datasetEditor.selectDatasets') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section>
                <q-input filled dense v-model="searchWord" class="q-my-sm" type="text" :placeholder="$t('common.search')" data-test="search-input" @update:model-value="searchDatasets">
                    <template v-slot:append>
                        <q-icon name="search" />
                    </template>
                </q-input>
                <q-table :rows="filteredDatasets" :columns="columns" flat dense selection="multiple" v-model:selected="selectedDatasets" :row-key="(row) => row.id.dsId" :pagination="{ rowsPerPage: 10 }" class="dataset-table">
                    <template #body-cell-type="props">
                        <q-td :props="props">
                            {{ dataDialogDescriptor.datasetTypes[props.row.type] }}
                            <q-tooltip :delay="500">
                                {{ props.row.type }}
                            </q-tooltip>
                        </q-td>
                    </template>
                    <template #body-cell-params="props">
                        <q-td :props="props">
                            <i v-if="props.row.parameters?.length > 0 || props.row.drivers?.length > 0" class="fas fa-check p-button-link" />
                        </q-td>
                    </template>
                </q-table>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn color="secondary" :label="$t('common.close')" @click="$emit('close')"></q-btn>
                <q-btn color="primary" :label="$t('common.add')" @click="addSelectedDatasets"></q-btn>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import dataDialogDescriptor from './DatasetEditorDataDialogDescriptor.json'
import { IDataset } from '../../../Dashboard'

export default defineComponent({
    name: 'datasets-catalog-datatable',
    props: { selectedDatasetsProp: { required: true, type: Array as any }, availableDatasetsProp: { required: true, type: Array as PropType<IDataset[]> } },
    emits: ['close', 'addSelectedDatasets'],
    data() {
        return {
            dataDialogDescriptor,
            datasets: [] as any[],
            filteredDatasets: [] as IDataset[],
            selectedDatasets: [] as any,
            searchWord: '',
            loading: false,
            columns: [] as any[],
            visible: true
        }
    },
    watch: {
        availableDatasetsProp() {
            this.setDatasetList()
        }
    },
    async created() {
        await this.setDatasetList()
    },
    updated() {
        this.filteredDatasets = [...this.datasets]
    },
    methods: {
        async setDatasetList() {
            this.datasets = this.filterOutSelectedDatasets(this.selectedDatasetsProp, this.availableDatasetsProp)
            this.filteredDatasets = [...this.datasets]
            this.columns = [
                { name: 'label', label: this.$t('common.label'), field: 'label', sortable: true, align: 'left' },
                { name: 'name', label: this.$t('common.name'), field: 'name', sortable: true, align: 'left' },
                { name: 'description', label: this.$t('common.description'), field: 'description', align: 'left', style: { 'max-width': '300px' }, classes: 'ellipsis' },
                { name: 'type', label: this.$t('common.type'), field: 'type', sortable: true, align: 'left' },
                { name: 'params', label: this.$t('workspace.myData.parametrical'), field: 'params', align: 'center' }
            ]
        },
        filterOutSelectedDatasets(selectedDatasets, allDatasets) {
            return allDatasets.filter((responseDataset) => {
                return !selectedDatasets.find((selectedDataset) => {
                    return responseDataset.id.dsId === selectedDataset.id.dsId
                })
            })
        },
        searchDatasets() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.filteredDatasets = [...this.datasets] as any[]
                } else {
                    this.filteredDatasets = this.datasets.filter((tempDataset: any) => {
                        return tempDataset.label.toLowerCase().includes(this.searchWord.toLowerCase()) || tempDataset.name.toLowerCase().includes(this.searchWord.toLowerCase()) || tempDataset.type.toLowerCase().includes(this.searchWord.toLowerCase()) || this.datasetTagFound(tempDataset)
                    })
                }
            }, 250)
        },
        datasetTagFound(dataset: any) {
            let tagFound = false
            for (let i = 0; i < dataset.tags.length; i++) {
                const tempTag = dataset.tags[i]
                if (tempTag.name.toLowerCase().includes(this.searchWord.toLowerCase())) {
                    tagFound = true
                    break
                }
            }
            return tagFound
        },
        addSelectedDatasets() {
            this.$emit('addSelectedDatasets', this.selectedDatasets)
        }
    }
})
</script>

<style lang="scss" scoped>
body.q-body--force-scrollbar-x {
    overflow-x: hidden;
}

.dataset-table {
    &:deep(.q-table) {
        tbody td {
            font-size: 0.8rem;
        }
    }
}
</style>
