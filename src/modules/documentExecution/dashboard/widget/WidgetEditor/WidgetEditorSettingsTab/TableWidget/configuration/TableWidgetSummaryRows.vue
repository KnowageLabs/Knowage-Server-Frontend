<template>
    <div v-if="summaryRowsModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12 p-grid">
            <div class="p-col-4 p-text-left p-text-md-left p-pr-4 p-pt-5">
                <label class="kn-material-input-label p-mr-3"> {{ $t('dashboard.widgetEditor.summaryRows.pinnedColumnsOnly') }}</label>
                <Checkbox v-model="summaryRowsModel.style.pinnedOnly" :binary="true" :disabled="summaryRowsDiabled" @change="summaryRowsChanged" />
            </div>
            <div class="p-col-8 p-d-flex p-flex-column">
                <label class="kn-material-input-label"> {{ $t('common.columns') }}</label>
                <WidgetEditorColumnsMultiselect
                    :value="summaryRowsModel.columns"
                    :available-target-options="availableColumnOptions"
                    :widget-columns-alias-map="widgetColumnsAliasMap"
                    option-label="alias"
                    option-value="id"
                    :disabled="summaryRowsModel.style.pinnedOnly || summaryRowsDiabled"
                    @change="onColumnsSelected($event, summaryRowsModel)"
                >
                </WidgetEditorColumnsMultiselect>
            </div>
        </div>

        <div class="p-col-12">
            <div v-for="(summaryRow, index) in summaryRowsModel.list" :key="index" class="p-grid p-ai-center">
                <div class="p-col-12 p-md-4 p-d-flex p-flex-column p-pt-1">
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.label') }}</label>
                    <InputText v-model="summaryRow.label" class="kn-material-input p-inputtext-sm" :disabled="summaryRowsDiabled" @change="summaryRowsChanged" />
                </div>
                <div class="p-col-12 p-md-8 p-grid p-p-2">
                    <div class="p-col-10 p-d-flex p-flex-column">
                        <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.aggregation') }}</label>
                        <Dropdown v-model="summaryRow.aggregation" class="kn-material-input" :options="getAggregationOptions(index)" option-value="value" option-label="label" :disabled="index === 0 || !summaryRowsModel.enabled" @change="summaryRowsChanged"> </Dropdown>
                    </div>
                    <div class="p-col-2 p-d-flex p-flex-column p-jc-center p-ai-center p-pl-3">
                        <i :class="[index === 0 ? 'pi pi-plus-circle' : 'pi pi-trash', summaryRowsDiabled ? 'icon-disabled' : '']" class="kn-cursor-pointer" @click="index === 0 ? addSummaryRow() : removeSummaryRow(index)"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetSummaryRows, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'

export default defineComponent({
    name: 'table-widget-summary-rows',
    components: { Checkbox, Dropdown, WidgetEditorColumnsMultiselect },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            summaryRowsModel: null as ITableWidgetSummaryRows | null,
            availableColumnOptions: [] as IWidgetColumn[],
            widgetColumnsAliasMap: {} as any
        }
    },
    computed: {
        summaryRowsDiabled() {
            return !this.summaryRowsModel || !this.summaryRowsModel.enabled
        }
    },
    watch: {
        summaryRowsDiabled() {
            this.onSummarRowEnabledChange()
        }
    },
    created() {
        this.setEventListeners()
        this.loadColumnOptions()
        this.loadSummaryRowsModel()
        this.loadWidgetColumnMaps()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromSummaryRows', this.onColumnRemovedFromSummaryRows)
            emitter.on('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.on('columnAdded', this.onColumnAdded)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromSummaryRows', this.onColumnRemovedFromSummaryRows)
            emitter.off('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.off('columnAdded', this.onColumnAdded)
        },
        onColumnRemovedFromSummaryRows() {
            this.onColumnRemoved()
        },
        onColumnRemoved() {
            this.loadColumnOptions()
            this.loadSummaryRowsModel()
        },
        onColumnAliasRenamed(column: any) {
            this.updateColumnAliases(column)
        },
        updateColumnAliases(column: IWidgetColumn) {
            if (column.id && this.widgetColumnsAliasMap[column.id]) this.widgetColumnsAliasMap[column.id] = column.alias

            const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn) => targetOption.id === column.id)
            if (index !== -1) this.availableColumnOptions[index].alias = column.alias
            this.summaryRowsChanged()
        },
        onColumnAdded(column: any) {
            this.addColumnAsOption(column)
        },
        addColumnAsOption(column: IWidgetColumn) {
            this.availableColumnOptions.push(column)
            this.loadWidgetColumnMaps()
        },
        loadSummaryRowsModel() {
            if (this.widgetModel?.settings?.configuration) this.summaryRowsModel = this.widgetModel.settings.configuration.summaryRows
        },
        loadColumnOptions() {
            this.availableColumnOptions = [...this.widgetModel.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE')]
        },
        loadWidgetColumnMaps() {
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                if (column.id) {
                    this.widgetColumnsAliasMap[column.id] = column.alias
                }
            })
        },
        summaryRowsChanged() {
            emitter.emit('refreshWidgetWithData', this.widgetModel.id)
        },
        onSummarRowEnabledChange() {
            if (!this.summaryRowsModel) return
            if (this.summaryRowsModel.enabled && this.summaryRowsModel.list.length === 0) {
                this.summaryRowsModel.list.push({ label: '', aggregation: 'Columns Default Aggregation' })
            }
            this.summaryRowsChanged()
        },
        getAggregationOptions(index: number) {
            return index === 0 ? [{ value: 'Columns Default Aggregation', label: 'Columns Default Aggregation' }] : this.descriptor.aggregationOptions
        },
        addSummaryRow() {
            if (!this.summaryRowsModel || this.summaryRowsDiabled) return
            this.summaryRowsModel.list.push({ label: '', aggregation: '' })
            this.summaryRowsChanged()
        },
        removeSummaryRow(index: number) {
            if (!this.summaryRowsModel || this.summaryRowsDiabled) return
            this.summaryRowsModel.list.splice(index, 1)
            this.summaryRowsChanged()
        },
        onColumnsSelected(event: any, summaryRows: ITableWidgetSummaryRows) {
            const intersection = summaryRows.columns.filter((el: string) => !event.value.includes(el))
            summaryRows.columns = event.value

            intersection.length > 0 ? this.onColumnsRemovedFromMultiselect(intersection) : this.onColumnsAddedFromMultiselect(summaryRows)
            this.summaryRowsChanged()
        },
        onColumnsRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) =>
                this.availableColumnOptions.push({
                    id: el,
                    alias: this.widgetColumnsAliasMap[el]
                })
            )
        },
        onColumnsAddedFromMultiselect(summaryRows: ITableWidgetSummaryRows) {
            summaryRows.columns.forEach((target: string) => {
                const index = this.availableColumnOptions.findIndex((targetOption: IWidgetColumn) => targetOption.id === target)
                if (index !== -1) this.availableColumnOptions.splice(index, 1)
            })
        }
    }
})
</script>
