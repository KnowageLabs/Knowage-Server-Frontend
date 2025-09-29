<template>
    <div v-if="widgetModel" class="p-d-flex p-flex-column p-mx-3">
        <FieldTable v-for="(field, index) in widgetModel.fields" :key="index" class="p-mb-3" :field-type="index" :widget-model="widgetModel" :items="field" :settings="descriptor[index]" :error="getErrorForFieldType(index)" @row-reorder="onFieldsReorder" @item-added="onFieldAdded" @item-selected="setSelectedField" @item-updated="onFieldItemUpdate" @item-deleted="onFieldDelete" />
    </div>
</template>

<script lang="ts">
import descriptor from './PivotTableDataContainerDescriptor.json'
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import { removeColumnFromPivotTableWidgetModel } from '../../helpers/pivotTableWidget/PivotTableFunctions'
import FieldTable from './PivotTableFieldsTable.vue'

export default defineComponent({
    name: 'pivot-table-data-container',
    components: { FieldTable },
    props: { propWidgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> } },
    data() {
        return {
            descriptor,
            widgetModel: {} as IWidget,
            columnFields: [] as IWidgetColumn[],
            rowFields: [] as IWidgetColumn[],
            dataFields: [] as IWidgetColumn[],
            filterFields: [] as IWidgetColumn[],
            selectedField: null as IWidgetColumn | null
        }
    },
    computed: {
        widgetType() {
            return this.widgetModel.type
        }
    },
    watch: {
        propWidgetModel() {
            this.loadWidgetModel()
        },
        selectedDataset() {
            this.selectedField = null
        }
    },
    async created() {
        this.loadWidgetModel()
        this.loadColumnTableItems()
    },
    methods: {
        loadWidgetModel() {
            this.widgetModel = this.propWidgetModel
        },
        loadColumnTableItems() {
            this.columnFields = this.widgetModel.fields?.columns ?? []
            this.rowFields = this.widgetModel.fields?.rows ?? []
            this.dataFields = this.widgetModel.fields?.data ?? []
            this.filterFields = this.widgetModel.fields?.filters ?? []
        },
        onFieldsReorder(payload: { fields: IWidgetColumn[]; fieldType: string }) {
            if (this.widgetModel.fields) {
                this.widgetModel.fields[payload.fieldType] = payload.fields
                emitter.emit('columnsReordered', this.widgetModel.columns)
            }
        },
        onFieldAdded(payload: { column: IWidgetColumn; rows: IWidgetColumn[]; fieldType: string }) {
            if (this.widgetModel.fields) {
                this.widgetModel.fields[payload.fieldType] = payload.rows
                emitter.emit('columnAdded', payload.column)
            }
        },
        onFieldItemUpdate(field: IWidgetColumn) {
            if (this.selectedField?.id === field.id) this.setSelectedField(field)
        },
        setSelectedField(column: IWidgetColumn) {
            this.selectedField = { ...column }
        },
        onFieldDelete(column: IWidgetColumn) {
            if (column.id === this.selectedField?.id) this.selectedField = null
            this.removeColumnFromModel(column)
            emitter.emit('columnRemoved', column)
        },
        removeColumnFromModel(column: IWidgetColumn) {
            removeColumnFromPivotTableWidgetModel(this.widgetModel, column)
        },
        isTableInvalid(tableFields, fieldType) {
            const invalid = tableFields.length === 0
            if (!this.widgetModel.invalid) this.widgetModel.invalid = {}
            this.widgetModel.invalid[fieldType] = invalid
            return invalid
        },
        getErrorForFieldType(fieldType) {
            switch (fieldType) {
                case 'columns':
                    return this.isTableInvalid(this.widgetModel.fields?.columns, 'columns')
                case 'rows':
                    return this.isTableInvalid(this.widgetModel.fields?.rows, 'rows')
                case 'data':
                    return this.isTableInvalid(this.widgetModel.fields?.data, 'data')
                case 'filters':
                    return false
                default:
                    return false
            }
        }
    }
})
</script>
