<template>
    <q-dialog :model-value="visible" persistent>
        <q-card style="width: 65%; max-width: 900px">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('dashboard.widgetEditor.addDynamicColumns') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section>
                <q-banner v-if="guideVisible" class="q-mb-sm bg-blue-1 text-blue-9" rounded dense>
                    <template #avatar>
                        <q-icon name="info" color="blue-7" />
                    </template>
                    <div class="text-subtitle2 q-mb-xs">{{ $t('dashboard.widgetEditor.dynamicColumnsGuideTitle') }}</div>
                    <div>{{ $t('dashboard.widgetEditor.dynamicColumnsGuideBody') }}</div>
                    <div class="q-mt-xs">
                        <span class="text-weight-bold">colName</span> — {{ $t('dashboard.widgetEditor.dynamicColumnsGuideColName') }}<br />
                        <span class="text-weight-bold">orderNum</span> — {{ $t('dashboard.widgetEditor.dynamicColumnsGuideOrderNum') }}
                    </div>
                    <template #action>
                        <q-btn flat dense round icon="close" size="sm" color="blue-7" @click="guideVisible = false" />
                    </template>
                </q-banner>
                <q-input filled dense v-model="searchWord" class="q-my-sm" type="text" :placeholder="$t('common.search')" @update:model-value="filterDatasets">
                    <template #append>
                        <q-icon name="search" />
                    </template>
                </q-input>
                <q-banner v-if="validationError" class="q-ma-sm bg-negative text-white" rounded dense>
                    {{ $t('dashboard.widgetEditor.dynamicColumnsDatasetNotCompatible') }}
                </q-banner>
                <q-table :rows="filteredDatasets" :columns="tableColumns" flat dense selection="single" v-model:selected="selectedDatasets" :row-key="(row) => row.id.dsId" :pagination="{ rowsPerPage: 10 }" @update:selected="onDatasetSelected" />
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat color="secondary" :label="$t('common.cancel')" @click="$emit('close')" />
                <q-btn color="primary" :label="$t('common.add')" :disable="selectedDatasets.length === 0 || validationError" @click="onConfirm" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IDatasetColumn } from '../../../../Dashboard'
import { AxiosResponse } from 'axios'
import mainStore from '../../../../../../../App.store'

export default defineComponent({
    name: 'widget-editor-dynamic-columns-dialog',
    props: {
        visible: { type: Boolean, required: true },
        mainDatasetColumns: { type: Array as PropType<IDatasetColumn[]>, required: true }
    },
    emits: ['close', 'confirm'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            allDatasets: [] as IDataset[],
            filteredDatasets: [] as IDataset[],
            selectedDatasets: [] as IDataset[],
            searchWord: '',
            validationError: false,
            guideVisible: true,
            tableColumns: [] as any[]
        }
    },
    async created() {
        this.tableColumns = [
            { name: 'label', label: this.$t('common.label'), field: 'label', sortable: true, align: 'left' },
            { name: 'name', label: this.$t('common.name'), field: 'name', sortable: true, align: 'left' },
            { name: 'type', label: this.$t('common.type'), field: 'type', sortable: true, align: 'left' }
        ]
        await this.loadAllDatasets()
    },
    methods: {
        async loadAllDatasets() {
            this.store.setLoading(true)
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/?asPagedList=true&seeTechnical=true`)
                .then((response: AxiosResponse<any>) => {
                    this.allDatasets = response.data?.item ?? []
                    this.filteredDatasets = [...this.allDatasets]
                })
                .catch(() => {})
            this.store.setLoading(false)
        },
        filterDatasets() {
            const word = this.searchWord.trim().toLowerCase()
            if (!word) {
                this.filteredDatasets = [...this.allDatasets]
            } else {
                this.filteredDatasets = this.allDatasets.filter((ds) => ds.label?.toLowerCase().includes(word) || ds.name?.toLowerCase().includes(word) || ds.type?.toLowerCase().includes(word))
            }
        },
        onDatasetSelected(selected: IDataset[]) {
            this.validationError = false
            if (!selected.length) return
            const dataset = selected[0]
            const fieldsMeta = dataset.metadata?.fieldsMeta ?? []
            const hasColName = fieldsMeta.some((f) => f.name === 'colName' || f.alias === 'colName')
            const hasOrderNum = fieldsMeta.some((f) => f.name === 'orderNum' || f.alias === 'orderNum')
            if (!hasColName || !hasOrderNum) {
                this.validationError = true
            }
        },
        onConfirm() {
            if (!this.selectedDatasets.length || this.validationError) return
            this.$emit('confirm', this.selectedDatasets[0])
        }
    }
})
</script>
