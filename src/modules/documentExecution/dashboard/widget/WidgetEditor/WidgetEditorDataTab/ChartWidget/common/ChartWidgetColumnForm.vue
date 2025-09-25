<template>
    <q-card v-if="column" flat square class="p-p-3" style="background-color: rgb(0, 0, 0, 0.03)">
        <div class="row q-col-gutter-xs p-pb-3">
            <q-input class="col-6" :label="$t('components.knCalculatedField.columnName')" v-model="column.columnName" dense square disable />
            <q-select class="col-6" v-model="column.orderType" :options="commonDescriptor.sortingOrderOptions" emitValue clearable dense square :label="$t('dashboard.widgetEditor.sortingOrder')" option-value="value" @update:model-value="selectedColumnUpdated">
                <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section>
                            <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
            <q-select v-if="showTypeDropdown" class="col-12" v-model="column.serieType" :options="descriptor.serieTypeOptions" emitValue clearable dense square :label="$t('common.type')" option-value="value" @update:model-value="selectedColumnUpdated">
                <template v-slot:selected-item="scope">
                    {{ $t(descriptor.serieTypeOptions.find((option) => option.value === scope.opt)?.label ?? '') }}
                </template>
                <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section>
                            <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
            <q-select v-if="['pie', 'area', 'bar', 'column', 'line', 'radar'].includes(chartType) && column.drillOrder" class="col-6" v-model="column.drillOrder.orderColumnId" :options="sortingColumnOptions" emitValue clearable dense square :label="$t('dashboard.widgetEditor.drillSortingColumn')" option-value="id" option-label="alias" @update:model-value="sortingChanged">
                <template v-slot:selected-item="scope">
                    {{ sortingColumnOptions.find((tempColumn: IWidgetColumn) => tempColumn.id === scope.opt)?.alias ?? '' }}
                </template>
            </q-select>
            <q-select v-if="['pie', 'area', 'bar', 'column', 'line', 'radar'].includes(chartType) && column.drillOrder" class="col-6" v-model="column.drillOrder.orderType" :options="commonDescriptor.sortingOrderOptions" emitValue clearable dense square :label="$t('dashboard.widgetEditor.drillSortingOrder')" option-label="label" option-value="value" @update:model-value="selectedColumnUpdated">
                <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section>
                            <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
        </div>

        <WidgetEditorFilterForm v-if="column.filter" :prop-column="column"></WidgetEditorFilterForm>
    </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn, IWidgetColumnFilter } from '../../../../../Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'
import Dropdown from 'primevue/dropdown'
import WidgetEditorFilterForm from '../../common/WidgetEditorFilterForm.vue'
import descriptor from './ChartWidgetColumnFormDescriptor.json'

export default defineComponent({
    name: 'table-widget-column-form',
    components: { Dropdown, WidgetEditorFilterForm },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedColumn: { type: Object as PropType<IWidgetColumn | null>, required: true }, chartType: { type: String, required: true } },
    data() {
        return {
            descriptor,
            commonDescriptor,
            column: null as IWidgetColumn | null,
            getTranslatedLabel
        }
    },
    computed: {
        sortingColumnOptions() {
            return this.widgetModel.columns
        },
        showTypeDropdown() {
            return ['area', 'bar', 'column', 'line', 'radar'].includes(this.chartType) && this.column?.fieldType === 'MEASURE'
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
            this.column.aggregation = 'NONE'
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
        sortingChanged() {
            if (!this.column || !this.column.drillOrder) return
            const index = this.sortingColumnOptions.findIndex((tempColumn: IWidgetColumn) => tempColumn.id === this.column?.drillOrder?.orderColumnId)
            if (index !== -1) this.column.drillOrder.orderColumn = this.sortingColumnOptions[index].columnName
            this.selectedColumnUpdated()
        },
        translateLabel(label: string) {
            return this.$t(label)
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
