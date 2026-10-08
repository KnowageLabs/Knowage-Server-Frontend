<template>
    <div v-if="column">
        <div v-if="widgetModel.type !== 'selector'" class="row q-col-gutter-sm">
            <q-select class="col-4" v-model="column.fieldType" :options="descriptor.columnTypeOptions" emit-value outlined dense hide-bottom-space options-dense :label="$t('common.type')" option-value="value" option-label="label" :disable="column.formula !== undefined" @update:model-value="columnTypeChanged">
                <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section>
                            <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
            <q-select class="col-4" v-model="column.orderColumn" :options="selectedDatasetColumns" emit-value clearable outlined dense hide-bottom-space options-dense :label="$t('dashboard.widgetEditor.sortingColumn')" option-value="name" option-label="name" @update:model-value="selectedColumnUpdated">
                <template #selected-item="scope">
                    {{ selectedDatasetColumns.find((tempColumn: IDatasetColumn) => tempColumn.name === scope.opt)?.alias ?? '' }}
                </template>
            </q-select>

            <q-select v-if="column.fieldType === 'ATTRIBUTE' && widgetType === 'discovery' && column.aggregation !== 'COUNT'" class="col-12" v-model="column.aggregationColumn" :options="widgetMeasureColumns" emit-value clearable outlined dense hide-bottom-space options-dense :label="$t('dashboard.widgetEditor.drillSortingColumn')" option-value="columnName" option-label="columnName" @update:model-value="selectedColumnUpdated" />
        </div>

        <WidgetEditorFilterForm v-if="column.filter" :prop-column="column"></WidgetEditorFilterForm>
    </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'
import { IDatasetColumn, IWidget, IWidgetColumn, IWidgetColumnFilter } from '../../../../Dashboard'
import { emitter } from '../../../../DashboardHelpers'
import descriptor from './TableWidgetDataDescriptor.json'
import commonDescriptor from '../common/WidgetCommonDescriptor.json'
import WidgetEditorFilterForm from '../common/WidgetEditorFilterForm.vue'

export default defineComponent({
    name: 'table-widget-column-form',
    components: { WidgetEditorFilterForm },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedColumn: { type: Object as PropType<IWidgetColumn | null>, required: true } },
    data() {
        return {
            descriptor,
            commonDescriptor,
            column: null as IWidgetColumn | null,
            selectedDatasetColumns: inject('selectedDatasetColumns', []) as unknown as IDatasetColumn[]
        }
    },
    computed: {
        widgetType() {
            return this.widgetModel.type
        },
        sortingColumnOptions() {
            return this.widgetModel.columns
        },
        widgetMeasureColumns() {
            return this.widgetModel.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE')
        }
    },
    watch: {
        selectedColumn() {
            this.loadSelectedColumn()
        }
    },
    created() {
        this.loadSelectedColumn()
    },
    methods: {
        loadSelectedColumn() {
            this.column = this.selectedColumn
            if (this.column && !this.column.filter) this.column.filter = { enabled: false, operator: '', value: '' } as IWidgetColumnFilter
        },
        selectedColumnUpdated() {
            emitter.emit('selectedColumnUpdated', this.column)
        },
        columnTypeChanged() {
            if (!this.column) return

            this.column.aggregation = this.widgetType === 'discovery' ? 'COUNT' : 'NONE'
            if (this.column.filter) {
                this.column.filter.operator = ''
                this.column.filter.value = ''
            }
            this.selectedColumnUpdated()
        },
        getColumnFilterOptions() {
            return this.column?.fieldType === 'ATTRIBUTE' ? this.commonDescriptor.attributeColumnFilterOperators : this.commonDescriptor.measureColumnFilterOperators
        },
        onFilterOperatorChange() {
            if (!this.column || !this.column.filter) return
            if (!['=', '<', '>', '<=', '>=', '!=', 'IN', 'like', 'range'].includes(this.column.filter.operator)) this.column.filter.value = ''
            if (this.column.filter.operator !== 'range') delete this.column.filter.value2
            this.selectedColumnUpdated()
        },
        onColumnAliasRenamed() {
            emitter.emit('columnAliasRenamed', this.column)
            this.selectedColumnUpdated()
        },
        onDiscoveryWidgetColumnAggregationChanged() {
            if (this.column && this.column.aggregation === 'COUNT') this.column.aggregationColumn = ''
            this.selectedColumnUpdated()
        }
    }
})
</script>

<style lang="scss" scoped>
#filter-operator-dropdown {
    min-width: 300px;
    max-width: 400px;
}
</style>
