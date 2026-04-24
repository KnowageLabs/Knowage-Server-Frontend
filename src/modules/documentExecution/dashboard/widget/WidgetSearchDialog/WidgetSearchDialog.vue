<template>
    <q-dialog :model-value="visible" persistent>
        <q-card :style="descriptor.dialogStyle">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('dashboard.widgetEditor.searchInTableWidget') }}</q-toolbar-title>
                <q-btn flat round dense icon="help_outline">
                    <q-tooltip anchor="top middle" :delay="100">{{ $t('dashboard.widgetEditor.searchInTableWidgetHint') }}</q-tooltip>
                </q-btn>
            </q-toolbar>

            <q-card-section v-if="widget" class="q-px-md q-pb-md kn-width-full">
                <div class="row q-col-gutter-sm">
                    <div class="col-6">
                        <q-select v-model="searchColumns" :options="columnOptions" :label="$t('common.columns')" option-label="alias" option-value="columnName" emit-value map-options multiple dense outlined class="kn-width-full">
                            <template v-slot:before-options>
                                <q-item clickable @click="toggleAll">
                                    <q-item-section side>
                                        <q-checkbox :model-value="allSelected" :indeterminate="someSelected && !allSelected" dense @update:model-value="toggleAll" />
                                    </q-item-section>
                                </q-item>
                                <q-separator />
                            </template>
                            <template v-slot:option="scope">
                                <q-item v-bind="scope.itemProps">
                                    <q-item-section side>
                                        <q-checkbox :model-value="scope.selected" dense @update:model-value="scope.toggleOption(scope.opt)" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ scope.opt.alias }}</q-item-label>
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-select>
                    </div>
                    <div class="col-6">
                        <q-input v-model="searchText" :label="$t('common.search')" dense outlined class="kn-width-full" data-test="search-input" />
                    </div>
                </div>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right">
                <q-btn unelevated data-test="close-button" @click="closeDialog">{{ $t('common.close') }}</q-btn>
                <q-btn unelevated color="primary" @click="search">{{ $t('common.search') }}</q-btn>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '../../Dashboard'
import descriptor from './WidgetSearchDialogDescriptor.json'

export default defineComponent({
    name: 'widget-search-dialog',
    components: {},
    props: { visible: { required: true, type: Boolean }, widget: { type: Object as PropType<IWidget>, required: true }, propSearch: { type: Object as PropType<{ searchText: string; searchColumns: string[] }>, required: true } },
    emits: ['close', 'search'],
    data() {
        return {
            descriptor,
            searchText: '',
            searchColumns: [] as string[]
        }
    },
    computed: {
        columnOptions() {
            if (!this.widget || !this.widget.columns) return []
            return this.widget.columns.filter((column: IWidgetColumn) => column.fieldType === 'ATTRIBUTE' && column.type.includes('String'))
        },
        searchButtonDisabled() {
            return this.searchColumns.length === 0
        },
        allSelected() {
            return this.columnOptions.length > 0 && this.searchColumns.length === this.columnOptions.length
        },
        someSelected() {
            return this.searchColumns.length > 0
        }
    },
    watch: {
        visible() {
            this.loadSearchValues()
        },
        propSearch() {
            this.loadSearchValues()
        }
    },
    created() {
        this.loadSearchValues()
    },
    methods: {
        loadSearchValues() {
            if (!this.propSearch) return
            this.searchText = this.propSearch.searchText
            this.searchColumns = [...this.propSearch.searchColumns]
        },
        toggleAll() {
            if (this.allSelected) this.searchColumns = []
            else this.searchColumns = this.columnOptions.map((col: IWidgetColumn) => col.columnName)
        },
        closeDialog() {
            this.$emit('close')
        },
        search() {
            this.$emit('search', { searchText: this.searchText, searchColumns: [...this.searchColumns] })
        }
    }
})
</script>
