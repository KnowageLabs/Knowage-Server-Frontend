<template>
    <div v-if="column">
        <div class="row q-col-gutter-sm">
            <q-select class="col-6 col-grow" v-model="column.orderColumn" :options="selectedDatasetColumns" emit-value clearable outlined dense hide-bottom-space options-dense :label="$t('dashboard.widgetEditor.sortingColumn')" option-value="name" option-label="name" @update:model-value="selectedColumnUpdated">
                <template #selected-item="scope">
                    {{ selectedDatasetColumns.find((tempColumn: IDatasetColumn) => tempColumn.name === scope.opt)?.alias ?? '' }}
                </template>
            </q-select>
            <q-select v-if="showTypeDropdown" class="col-6" v-model="column.serieType" :options="descriptor.serieTypeOptions" emit-value clearable outlined dense hide-bottom-space options-dense :label="$t('dashboard.widgetEditor.visualizationType.title')" option-value="value" @update:model-value="selectedColumnUpdated">
                <template #selected-item="scope">
                    {{ $t(descriptor.serieTypeOptions.find((option) => option.value === scope.opt)?.label ?? '') }}
                </template>
                <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section>
                            <q-item-label>{{ $t(scope.opt.label) }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
        </div>

        <WidgetEditorFilterForm v-if="column.filter" :prop-column="column"></WidgetEditorFilterForm>
    </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue'
import { IDatasetColumn, IWidget, IWidgetColumn, IWidgetColumnFilter } from '../../../../../Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'
import WidgetEditorFilterForm from '../../common/WidgetEditorFilterForm.vue'
import descriptor from './ChartWidgetColumnFormDescriptor.json'

export default defineComponent({
    name: 'table-widget-column-form',
    components: { WidgetEditorFilterForm },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedColumn: { type: Object as PropType<IWidgetColumn | null>, required: true }, chartType: { type: String, required: true } },
    data() {
        return {
            descriptor,
            commonDescriptor,
            column: null as IWidgetColumn | null,
            getTranslatedLabel,
            selectedDatasetColumns: inject('selectedDatasetColumns', []) as unknown as IDatasetColumn[]
        }
    },
    computed: {
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
