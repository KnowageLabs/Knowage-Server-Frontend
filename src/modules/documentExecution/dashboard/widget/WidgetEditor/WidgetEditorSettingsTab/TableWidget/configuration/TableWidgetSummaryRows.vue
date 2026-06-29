<template>
    <div v-if="summaryRowsModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div v-for="(summaryRow, index) in summaryRowsModel.list" :key="index" class="col-12 row q-col-gutter-sm items-center">
                <div class="col">
                    <q-input v-model="summaryRow.label" :label="$t('common.label')" outlined dense :disable="summaryRowsDiabled" @change="summaryRowsChanged" />
                </div>
                <div class="col">
                    <q-select v-model="summaryRow.aggregation" :options="getAggregationOptions(index)" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.aggregation')" outlined dense :disable="index === 0 || !summaryRowsModel.enabled" @update:model-value="summaryRowsChanged" />
                </div>
                <div class="col-auto">
                    <q-btn flat round dense :icon="index === 0 ? 'add_circle_outline' : 'delete'" size="sm" :disable="summaryRowsDiabled" @click="index === 0 ? addSummaryRow() : removeSummaryRow(index)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetSummaryRows } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../TableWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'table-widget-summary-rows',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            summaryRowsModel: null as ITableWidgetSummaryRows | null
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
        this.loadSummaryRowsModel()
    },
    methods: {
        loadSummaryRowsModel() {
            if (this.widgetModel?.settings?.configuration) this.summaryRowsModel = this.widgetModel.settings.configuration.summaryRows
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
        }
    }
})
</script>
