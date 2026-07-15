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
                    <div>{{ $t('dashboard.widgetEditor.dynamicColumnsGuideStep1') }}</div>
                    <div class="q-mt-xs">{{ $t('dashboard.widgetEditor.dynamicColumnsGuideStep2') }}</div>
                    <template #action>
                        <q-btn flat dense round icon="close" size="sm" color="blue-7" @click="guideVisible = false" />
                    </template>
                </q-banner>
                <q-input filled dense v-model="searchWord" class="q-my-sm" type="text" :placeholder="$t('common.search')" @update:model-value="filterDatasets">
                    <template #append>
                        <q-icon name="search" />
                    </template>
                </q-input>
                <q-table :rows="filteredDatasets" :columns="tableColumns" flat dense selection="single" v-model:selected="selectedDatasets" :row-key="(row) => row.id.dsId" :pagination="{ rowsPerPage: 10 }" @update:selected="onDatasetSelected" />
                <div v-if="selectedDatasets.length > 0" class="row q-col-gutter-sm q-mt-sm">
                    <div class="col-6">
                        <q-select v-model="colNameField" :options="sourceDatasetColumns" option-value="name" option-label="alias" emit-value map-options outlined dense :label="$t('dashboard.widgetEditor.dynamicColNameField')" />
                    </div>
                    <div class="col-6">
                        <q-select v-model="orderNumField" :options="orderNumFieldOptions" option-value="value" option-label="label" emit-value map-options outlined dense :label="$t('dashboard.widgetEditor.dynamicOrderNumField')" />
                    </div>
                </div>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat color="secondary" :label="$t('common.cancel')" @click="$emit('close')" />
                <q-btn color="primary" :label="$t('common.add')" :disable="!canConfirm" @click="onConfirm" />
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
            selectedDatasets: [] as any[],
            sourceDatasetColumns: [] as IDatasetColumn[],
            searchWord: '',
            guideVisible: true,
            colNameField: '' as string,
            orderNumField: null as string | null,
            tableColumns: [] as any[]
        }
    },
    computed: {
        canConfirm(): boolean {
            return this.selectedDatasets.length > 0 && !!this.colNameField
        },
        orderNumFieldOptions(): { value: string | null; label: string }[] {
            return [{ value: null, label: this.$t('dashboard.widgetEditor.dynamicOrderNumNone') }, ...this.sourceDatasetColumns.map((c) => ({ value: c.name, label: c.alias || c.name }))]
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
        onDatasetSelected(selected: readonly any[]) {
            this.colNameField = ''
            this.orderNumField = null
            if (!selected.length) {
                this.sourceDatasetColumns = []
                return
            }
            this.sourceDatasetColumns = (selected[0] as IDataset).metadata?.fieldsMeta ?? []
        },
        onConfirm() {
            if (!this.canConfirm) return
            this.$emit('confirm', { dataset: this.selectedDatasets[0], colNameField: this.colNameField, orderNumField: this.orderNumField })
        }
    }
})
</script>
