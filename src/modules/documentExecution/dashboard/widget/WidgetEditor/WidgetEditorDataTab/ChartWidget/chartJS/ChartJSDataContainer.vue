<template>
    <div v-if="widgetModel">
        <ChartWidgetChartTypeDropdown :widget-model="widgetModel" @selectedChartTypeChanged="$emit('selectedChartTypeChanged', $event)"></ChartWidgetChartTypeDropdown>
        <ChartJSPieChartDataContainer :widget-model="widgetModel" :selected-dataset="selectedDataset" :selected-dataset-columns="selectedDatasetColumns"></ChartJSPieChartDataContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IDatasetColumn, IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import ChartJSPieChartDataContainer from './ChartJSPieChartDataContainer.vue'
import ChartWidgetChartTypeDropdown from '../common/ChartWidgetChartTypeDropdown.vue'

export default defineComponent({
    name: 'chart-js-widget-data-container',
    components: { ChartWidgetChartTypeDropdown, ChartJSPieChartDataContainer },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedDataset: { type: Object as PropType<IDataset | null> },
        selectedDatasetColumns: { type: Array as PropType<IDatasetColumn[]>, required: true }
    },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {}
    },
    async created() {},
    methods: {}
})
</script>
