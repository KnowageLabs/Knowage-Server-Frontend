<template>
    <q-dialog :model-value="visible" persistent @hide="closeDialog">
        <q-card style="min-width: 600px; width: 60%; max-width: 1200px">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('dashboard.widgetEditor.map.metadata.addField') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section class="q-pa-none">
                <q-table v-model:selected="selectedFields" :rows="availableFields" :columns="tableColumns" :filter="filterText" row-key="name" selection="multiple" dense flat class="kn-table">
                    <template #top>
                        <q-input v-model="filterText" outlined dense :placeholder="$t('common.search')" class="full-width" data-test="search-input">
                            <template #prepend><q-icon name="search" /></template>
                        </q-input>
                    </template>
                    <template #no-data>
                        <span class="text-grey">{{ $t('common.info.noDataFound') }}</span>
                    </template>
                </q-table>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat :label="$t('common.cancel')" data-test="close-button" @click="closeDialog" />
                <q-btn color="primary" :label="$t('common.add')" data-test="new-button" @click="addSelectedFields" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'map-widget-metadata-new-field-dialog',
    components: {},
    props: { visible: { required: true, type: Boolean }, propFields: { required: true, type: Array as PropType<IWidgetMapLayerColumn[]> } },
    emits: ['close', 'addSelectedFields'],
    data() {
        return {
            availableFields: [] as IWidgetMapLayerColumn[],
            selectedFields: [] as IWidgetMapLayerColumn[],
            filterText: ''
        }
    },
    computed: {
        tableColumns(): any[] {
            return [
                { name: 'name', label: this.$t('common.name'), field: 'name', sortable: true, align: 'left' },
                { name: 'alias', label: this.$t('common.alias'), field: 'alias', sortable: true, align: 'left' },
                { name: 'type', label: this.$t('common.type'), field: 'type', sortable: true, align: 'left' }
            ]
        }
    },
    watch: {
        propFields() {
            this.loadAvailableFields()
        }
    },
    created() {
        this.loadAvailableFields()
    },
    methods: {
        loadAvailableFields() {
            this.availableFields = this.propFields ? this.propFields.filter((field: IWidgetMapLayerColumn) => field.deleted) : []
        },
        addSelectedFields() {
            this.$emit('addSelectedFields', deepcopy(this.selectedFields))
            this.selectedFields = []
        },
        closeDialog() {
            this.selectedFields = []
            this.$emit('close')
        }
    }
})
</script>
