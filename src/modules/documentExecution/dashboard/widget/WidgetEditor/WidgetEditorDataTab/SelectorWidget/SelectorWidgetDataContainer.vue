<template>
    <div v-if="widget">
        <div class="p-d-flex p-flex-row p-ai-center p-mt-2">
            <div class="p-d-flex p-flex-column kn-flex-2 p-m-2">
                <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.sortingColumn') }}</label>
                <Dropdown v-model="sortingColumn" class="kn-material-input" :options="selectedDatasetColumns" option-value="name" option-label="alias" show-clear @change="sortingChanged"> </Dropdown>
            </div>
            <div class="p-d-flex p-flex-column kn-flex p-m-2">
                <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.sortingOrder') }}</label>
                <Dropdown v-model="sortingOrder" class="kn-material-input" :options="commonDescriptor.sortingOrderOptions" option-value="value" showClear @change="sortingChanged">
                    <template #value="slotProps">
                        <div>
                            <span>{{ slotProps.value }}</span>
                        </div>
                    </template>
                    <template #option="slotProps">
                        <div>
                            <span>{{ $t(slotProps.option.label) }}</span>
                        </div>
                    </template>
                </Dropdown>
            </div>
        </div>
        <WidgetEditorColumnTable class="p-m-2" :widget-model="widget" :items="columnTableItems" :settings="commonDescriptor.columnTableSettings" @itemAdded="onColumnAdded" @itemUpdated="onColumnItemUpdate" @itemSelected="setSelectedColumn" @itemDeleted="onColumnDelete"></WidgetEditorColumnTable>
        <WidgetEditorFilterForm v-if="selectedColumn" :prop-column="selectedColumn"></WidgetEditorFilterForm>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget, IWidgetColumn, IDatasetColumn } from '@/modules/documentExecution/Dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import descriptor from '../TableWidget/TableWidgetDataDescriptor.json'
import Dropdown from 'primevue/dropdown'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'
import WidgetEditorColumnTable from '../common/WidgetEditorColumnTable.vue'
import WidgetEditorFilterForm from '../common/WidgetEditorFilterForm.vue'

export default defineComponent({
    name: 'selector-widget-data-container',
    components: { Dropdown, WidgetEditorColumnTable, WidgetEditorFilterForm },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> }, selectedDatasetColumns: { type: Array as PropType<IDatasetColumn[]>, required: true } },
    data() {
        return {
            descriptor,
            commonDescriptor,
            widget: {} as IWidget,
            columnTableItems: [] as IWidgetColumn[],
            selectedColumn: null as IWidgetColumn | null,
            sortingColumn: '',
            sortingOrder: '',
            datasetColumns: [] as IDatasetColumn[]
        }
    },
    watch: {
        selectedDataset() {
            this.selectedColumn = null
        }
    },
    async created() {
        this.loadWidget()
        this.loadSortingSettings()
        this.loadSelectedDatasetColumns()
        this.$watch('widget.columns', () => this.loadColumnTableItems())
        this.loadColumnTableItems()
    },
    methods: {
        loadWidget() {
            this.widget = this.widgetModel
        },
        loadColumnTableItems() {
            this.columnTableItems = this.widget.columns ?? []
        },
        loadSortingSettings() {
            if (this.widget?.settings?.sortingColumn) this.sortingColumn = this.widget.settings.sortingColumn
            if (this.widget?.settings?.sortingOrder) this.sortingOrder = this.widget.settings.sortingOrder
        },
        loadSelectedDatasetColumns() {
            this.datasetColumns = this.selectedDatasetColumns
            this.setSelectedColumnAsSortingColumn()
        },
        setSelectedColumnAsSortingColumn() {
            if (this.sortingColumn !== '' || !this.datasetColumns || this.datasetColumns.length === 0 || this.widget?.columns.length === 0) return
            const selectedColumn = this.datasetColumns.find((column: IDatasetColumn) => column.name === this.widget.columns[0]?.columnName)
            this.sortingColumn = selectedColumn ? selectedColumn?.name : ''
        },
        onColumnAdded(payload: { column: IWidgetColumn; rows: IWidgetColumn[] }) {
            // Allow multiple columns for selector widgets
            this.widget.columns.push(payload.column)
            this.widget.settings.isDateType = payload.column.type.toLowerCase().includes('date') || payload.column.type.toLowerCase().includes('timestamp')
            emitter.emit('columnAdded', payload.column)
            emitter.emit('refreshSelector', this.widget.id)
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        onColumnItemUpdate(column: IWidgetColumn) {
            this.widget.columns[0] = { ...column }
            emitter.emit('collumnUpdated', { column: this.widget.columns[0], columnIndex: 0 })
            emitter.emit('refreshSelector', this.widget.id)
            if (this.widget.columns[0].id === this.selectedColumn?.id) this.selectedColumn = { ...this.widget.columns[0] }
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        setSelectedColumn(column: IWidgetColumn) {
            this.selectedColumn = { ...column }
        },
        onColumnDelete(column: IWidgetColumn) {
            this.widget.columns = []
            if (column.id === this.selectedColumn?.id) this.selectedColumn = null
            emitter.emit('columnRemoved', column)
            emitter.emit('refreshSelector', this.widget.id)
            if (this.widget.columns.length == 0) emitter.emit('clearWidgetData', this.widget.id)
            else emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        sortingChanged() {
            if (!this.widget.settings) return
            this.widget.settings.sortingColumn = this.sortingColumn
            this.widget.settings.sortingOrder = this.sortingOrder
            if (this.widget.columns.length > 0) emitter.emit('refreshWidgetWithData', this.widget.id)
            emitter.emit('refreshSelector', this.widget.id)
        }
    }
})
</script>
