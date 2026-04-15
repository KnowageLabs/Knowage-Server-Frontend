<template>
    <div v-if="widget" class="p-m-3">
        <WidgetEditorColumnTable :widget-model="widget" :items="columnTableItems" :settings="descriptor.columnTableSettings" @rowReorder="onColumnsReorder" @itemAdded="onColumnAdded" @itemUpdated="onColumnItemUpdate" @itemDeleted="onColumnDelete" />
        <div v-if="descriptionPairs.length > 0" class="q-px-sm q-pt-sm q-pb-xs q-gutter-xs row">
            <q-badge v-for="pair in descriptionPairs" :key="pair.valueColumnName" color="accent" outline class="q-pa-xs"> {{ getColumnAlias(pair.valueColumnName) }} &#8594; {{ getColumnAlias(pair.descriptionColumnName) }} </q-badge>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import descriptor from '../common/WidgetCommonDescriptor.json'
import WidgetEditorColumnTable from '../common/WidgetEditorColumnTable.vue'

export default defineComponent({
    name: 'selector-widget-data-container',
    components: { WidgetEditorColumnTable },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> } },
    data() {
        return {
            descriptor,
            widget: {} as IWidget,
            columnTableItems: [] as IWidgetColumn[]
        }
    },
    computed: {
        descriptionPairs(): { valueColumnName: string; descriptionColumnName: string }[] {
            return this.widget?.settings?.configuration?.descriptionColumnConfigs ?? []
        }
    },

    async created() {
        this.widget = this.widgetModel
        this.$watch('widget.columns', () => this.loadColumnTableItems())
        this.loadColumnTableItems()
    },
    methods: {
        loadColumnTableItems() {
            this.columnTableItems = this.widget.columns ?? []
        },
        onColumnsReorder(columns: IWidgetColumn[]) {
            this.widget.columns = columns
            emitter.emit('columnsReordered', this.widget.columns)
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        onColumnAdded(payload: { column: IWidgetColumn; rows: IWidgetColumn[] }) {
            this.widget.columns = payload.rows
            this.widget.settings.isDateType = payload.column.type.toLowerCase().includes('date') || payload.column.type.toLowerCase().includes('timestamp')
            emitter.emit('columnAdded', payload.column)
            emitter.emit('refreshSelector', this.widget.id)
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        onColumnItemUpdate(column: IWidgetColumn) {
            const index = this.widget.columns.findIndex((c: IWidgetColumn) => c.id === column.id)
            if (index !== -1) {
                this.widget.columns[index] = { ...column }
                emitter.emit('collumnUpdated', { column: this.widget.columns[index], columnIndex: index })
            }
            emitter.emit('refreshSelector', this.widget.id)
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        getColumnAlias(columnName: string): string {
            return this.widget.columns?.find((c: IWidgetColumn) => c.columnName === columnName)?.alias ?? columnName
        },
        onColumnDelete(column: IWidgetColumn) {
            this.widget.columns = this.widget.columns.filter((c: IWidgetColumn) => c.id !== column.id)
            if (this.widget.settings?.configuration?.descriptionColumnConfigs) {
                this.widget.settings.configuration.descriptionColumnConfigs = this.widget.settings.configuration.descriptionColumnConfigs.filter((cfg: any) => cfg.valueColumnName !== column.columnName && cfg.descriptionColumnName !== column.columnName)
            }
            emitter.emit('columnRemoved', column)
            emitter.emit('refreshSelector', this.widget.id)
            if (this.widget.columns.length === 0) emitter.emit('clearWidgetData', this.widget.id)
            else emitter.emit('refreshWidgetWithData', this.widget.id)
        }
    }
})
</script>
