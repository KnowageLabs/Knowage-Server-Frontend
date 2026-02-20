<template>
    <q-dialog v-model="dialogVisible" persistent maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card class="layers-selection-card">
            <!-- Header -->
            <q-card-section class="dialog-header">
                <div class="header-content">
                    <h2>{{ $t('dashboard.datasetEditor.selectDatasets') }}</h2>
                    <p class="subtitle">{{ $t('dashboard.widgetEditor.map.selectLayersOrDatasets') }}</p>
                </div>
                <q-btn flat round dense icon="close" @click="closeDialog" />
            </q-card-section>

            <q-separator />

            <!-- Search and Filters -->
            <q-card-section class="search-section">
                <q-input
                    v-model="searchWord"
                    outlined
                    dense
                    :placeholder="$t('common.search')"
                    class="search-input"
                    @update:model-value="searchDatasets"
                >
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                    <template #append v-if="searchWord">
                        <q-icon name="clear" class="cursor-pointer" @click="searchWord = ''; searchDatasets()" />
                    </template>
                </q-input>

                <div class="filter-chips">
                    <q-chip
                        :selected="filterType === 'all'"
                        @click="filterType = 'all'"
                        clickable
                        color="primary"
                        text-color="white"
                    >
                        {{ $t('common.all') }}
                    </q-chip>
                    <q-chip
                        :selected="filterType === 'layer'"
                        @click="filterType = 'layer'"
                        clickable
                        color="primary"
                        text-color="white"
                    >
                        <q-icon name="map" size="xs" class="q-mr-xs" />
                        {{ $t('common.layers') }}
                    </q-chip>
                    <q-chip
                        :selected="filterType === 'dataset'"
                        @click="filterType = 'dataset'"
                        clickable
                        color="primary"
                        text-color="white"
                    >
                        <q-icon name="storage" size="xs" class="q-mr-xs" />
                        {{ $t('common.datasets') }}
                    </q-chip>
                </div>
            </q-card-section>

            <!-- Table -->
            <q-card-section class="table-section">
                <q-table
                    v-model:selected="selectedDatasets"
                    :rows="displayedDatasets"
                    :columns="tableColumns"
                    row-key="layerId"
                    selection="multiple"
                    :loading="loading"
                    :rows-per-page-options="[10, 25, 50]"
                    :pagination="{ rowsPerPage: 10 }"
                    flat
                    class="layers-table"
                >
                    <template #body-cell-type="props">
                        <q-td :props="props">
                            <q-chip
                                :icon="props.row.type === 'layer' ? 'map' : 'storage'"
                                :color="props.row.type === 'layer' ? 'blue-6' : 'green-6'"
                                text-color="white"
                                size="sm"
                            >
                                {{ props.row.type === 'layer' ? $t('common.layer') : $t('common.dataset') }}
                            </q-chip>
                        </q-td>
                    </template>

                    <template #no-data>
                        <div class="no-data-message">
                            <q-icon name="info" size="lg" color="grey-5" />
                            <p>{{ $t('dashboard.widgetEditor.map.noLayerAvailable') }}</p>
                        </div>
                    </template>

                    <template #loading>
                        <q-inner-loading showing color="primary" />
                    </template>
                </q-table>
            </q-card-section>

            <!-- Footer -->
            <q-separator />
            <q-card-actions class="dialog-footer">
                <q-btn flat :label="$t('common.close')" @click="closeDialog" />
                <q-space />
                <q-btn
                    unelevated
                    color="primary"
                    :label="$t('common.add')"
                    :disable="selectedDatasets.length === 0"
                    @click="addSelectedDatasets"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import dataDialogDescriptor from './MapWidgetLayersTabDescriptor.json'
import { IDataset } from '../../../Dashboard'

export default defineComponent({
    name: 'map-layers-selection-dialog',
    props: {
        visible: { required: true, type: Boolean },
        availableDatasetsProp: { required: true, type: Array as PropType<IDataset[]> },
        selectedDatasetsProp: { required: true, type: Array as any }
    },
    emits: ['close', 'addSelectedDatasets'],
    data() {
        return {
            allLayers: [] as any[],
            dataDialogDescriptor,
            datasets: [] as any[],
            filteredDatasets: [] as any[],
            selectedDatasets: [] as any[],
            searchWord: '',
            filterType: 'all' as 'all' | 'layer' | 'dataset',
            loading: false,
            dialogVisible: false
        }
    },
    computed: {
        tableColumns() {
            return [
                {
                    name: 'name',
                    label: this.$t('common.name'),
                    field: 'name',
                    align: 'left' as const,
                    sortable: true
                },
                {
                    name: 'type',
                    label: this.$t('common.type'),
                    field: 'type',
                    align: 'left' as const,
                    sortable: true
                },
                {
                    name: 'description',
                    label: this.$t('common.description'),
                    field: 'description',
                    align: 'left' as const,
                    sortable: true
                }
            ]
        },
        displayedDatasets() {
            let data = this.filteredDatasets

            // Filter by type
            if (this.filterType !== 'all') {
                data = data.filter((item: any) => item.type === this.filterType)
            }

            return data
        }
    },
    watch: {
        visible(newVal) {
            this.dialogVisible = newVal
        },
        availableDatasetsProp() {
            this.setDatasetList()
        }
    },
    async created() {
        this.dialogVisible = this.visible
        await this.setDatasetList()
    },
    methods: {
        async setDatasetList() {
            this.loading = true
            try {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers`)
                    .then((response: AxiosResponse<any>) => {
                        this.allLayers = response.data.root.map((i: any) => {
                            return {
                                layerId: 'l_' + i.layerId,
                                name: i.name,
                                description: i.descr,
                                label: i.label,
                                type: 'layer',
                                id: i.layerId,
                                layerType: i.type,
                                properties: i.properties
                            }
                        })
                    })

                this.datasets = this.filterOutSelectedDatasets(
                    this.selectedDatasetsProp,
                    this.availableDatasetsProp
                ).map((i: any) => {
                    return {
                        layerId: 'ds_' + i.id.dsId,
                        name: i.name,
                        label: i.label,
                        description: i.description,
                        columns: i.metadata.fieldsMeta,
                        type: 'dataset',
                        id: i.id.dsId
                    }
                })

                this.filteredDatasets = [...this.datasets, ...this.allLayers]
            } finally {
                this.loading = false
            }
        },
        filterOutSelectedDatasets(selectedDatasets: any[], allDatasets: any[]) {
            return allDatasets.filter((responseDataset: any) => {
                return !selectedDatasets?.find((selectedDataset: any) => {
                    return responseDataset.id.dsId === selectedDataset.dsId
                })
            })
        },
        searchDatasets() {
            const searchLower = this.searchWord.toLowerCase()
            if (!searchLower) {
                this.filteredDatasets = [...this.datasets, ...this.allLayers]
                return
            }

            const allData = [...this.datasets, ...this.allLayers]
            this.filteredDatasets = allData.filter((item: any) =>
                item.name?.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower) ||
                item.label?.toLowerCase().includes(searchLower)
            )
        },
        addSelectedDatasets() {
            this.$emit('addSelectedDatasets', this.selectedDatasets)
            this.closeDialog()
        },
        closeDialog() {
            this.selectedDatasets = []
            this.$emit('close')
        }
    }
})
</script>

<style lang="scss" scoped>
.layers-selection-card {
    background: #ffffff;
    color: #212529;
    display: flex;
    flex-direction: column;
    height: 100%;
    margin-left: 56px; // Offset per sidebar Knowage
}

.dialog-header {
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;

    .header-content {
        h2 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #212529;
        }

        .subtitle {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        }
    }

    :deep(.q-btn) {
        color: #6c757d;

        &:hover {
            color: #212529;
            background: #e9ecef;
        }
    }
}

.search-section {
    padding: 20px 32px;
    background: #ffffff;

    .search-input {
        margin-bottom: 16px;

        :deep(.q-field__control) {
            background: #f8f9fa;
            border-radius: 8px;

            &::before {
                border-color: #e9ecef;
            }

            &:hover::before {
                border-color: #ced4da;
            }
        }

        :deep(input) {
            color: #212529;

            &::placeholder {
                color: #adb5bd;
            }
        }

        :deep(.q-icon) {
            color: #6c757d;
        }
    }

    .filter-chips {
        display: flex;
        gap: 8px;

        :deep(.q-chip) {
            cursor: pointer;

            &:not(.q-chip--selected) {
                background: #f8f9fa;
                color: #6c757d;
                border: 1px solid #e9ecef;
            }
        }
    }
}

.table-section {
    flex: 1;
    padding: 0 32px 20px;
    background: #f8f9fa;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .layers-table {
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 8px;

        :deep(.q-table__middle) {
            max-height: calc(100vh - 400px);
            overflow-y: auto;
        }

        :deep(.q-table__top),
        :deep(.q-table__bottom),
        :deep(thead tr),
        :deep(tbody td) {
            background: #ffffff;
            color: #212529;
        }

        :deep(thead th) {
            background: #f8f9fa;
            color: #6c757d;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e9ecef;
        }

        :deep(tbody tr) {
            border-bottom: 1px solid #f8f9fa;

            &:hover {
                background: #f8f9fa;
            }
        }

        :deep(.q-checkbox__bg) {
            border-color: #ced4da;
        }

        :deep(.q-checkbox--truthy .q-checkbox__bg) {
            background: #3b82f6;
            border-color: #3b82f6;
        }
    }

    .no-data-message {
        text-align: center;
        padding: 48px 24px;
        color: #6c757d;

        p {
            margin-top: 16px;
            font-size: 14px;
        }
    }
}

.dialog-footer {
    padding: 16px 32px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;

    .q-btn {
        text-transform: none;
        font-weight: 500;
        padding: 8px 24px;
    }
}
</style>
