<template>
    <div v-if="widget" class="widget-editor-card p-p-2">
        <div class="p-d-flex p-flex-row p-ai-center p-mt-2">
            <div class="p-d-flex p-flex-column kn-flex-2 p-m-2">
                <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.sortingColumn') }}</label>
                <Dropdown v-model="sortingColumn" class="kn-material-input" :options="selectedDatasetColumns" option-label="name" show-clear @change="sortingChanged"> </Dropdown>
            </div>
            <div class="p-d-flex p-flex-column kn-flex p-m-2">
                <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.sortingOrder') }}</label>
                <Dropdown v-model="sortingOrder" class="kn-material-input" :options="commonDescriptor.sortingOrderOptions" option-value="value" show-clear @change="sortingChanged">
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
            <div v-if="sortingColumn?.fieldType === 'MEASURE'" class="p-d-flex p-flex-column kn-flex p-m-2">
                <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.aggregation') }}</label>
                <Dropdown v-model="sortingColumnAggregation" class="kn-material-input" :options="aggregationOptions" option-value="value" option-label="label" @change="sortingChanged"> </Dropdown>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDatasetColumn, IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import Dropdown from 'primevue/dropdown'
import descriptor from '../../TableWidget/TableWidgetDataDescriptor.json'
import commonDescriptor from '../../common/WidgetCommonDescriptor.json'

export default defineComponent({
    name: 'highcharts-sorting-settings',
    components: { Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDatasetColumns: { type: Array as PropType<IDatasetColumn[]>, required: true } },
    data() {
        return {
            descriptor,
            commonDescriptor,
            widget: {} as IWidget,
            sortingColumn: null as IDatasetColumn | null,
            sortingOrder: '',
            sortingColumnAggregation: ''
        }
    },
    created() {
        this.loadWidget()
        this.setEventListeners()
        this.loadSortingSettings()
    },
    unmounted() {
        this.removeEventListeners()
    },
    computed: {
        aggregationOptions() {
            if (!this.sortingColumn || this.sortingColumn.fieldType === 'MEASURE') return commonDescriptor.columnAggregationOptions.filter((option: { label: string; value: string }) => option.value !== 'NONE')
        }
    },
    methods: {
        loadWidget() {
            this.widget = this.widgetModel
        },
        setEventListeners() {
            emitter.on('columnRemoved', this.onColumnRemoved)
        },
        removeEventListeners() {
            emitter.off('columnRemoved', this.onColumnRemoved)
        },
        onColumnRemoved(column: any) {
            this.updateSortingColumn(column)
        },
        loadSortingSettings() {
            if (!this.widget || !this.widget.settings) return
            if (this.widget.settings.sortingColumn) this.sortingColumn = this.widget.settings.sortingColumn
            if (this.widget.settings.sortingOrder) this.sortingOrder = this.widget.settings.sortingOrder
            if (this.widget.settings.sortingColumnAggregation) this.sortingColumnAggregation = this.widget.settings.sortingColumnAggregation
        },
        sortingChanged() {
            if (!this.widget.settings) return
            this.widget.settings.sortingColumn = this.sortingColumn
            this.widget.settings.sortingOrder = this.sortingOrder
            this.widget.settings.sortingColumnAggregation = this.sortingColumnAggregation
            emitter.emit('refreshWidgetWithData', this.widget.id)
        },
        updateSortingColumn(column: IWidgetColumn) {
            if (column.columnName === this.sortingColumn?.name) {
                this.sortingColumn = null
                this.sortingOrder = ''
                this.sortingColumnAggregation = ''
            }
        }
    }
})
</script>
