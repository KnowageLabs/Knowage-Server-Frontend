<template>
    <div v-if="widgetModel">
        <q-card class="q-ma-md" flat bordered>
            <q-card-section class="q-py-sm">
                <div class="kn-editor-card-label">{{ $t('dashboard.widgetEditor.toolbars.general') }}</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
                <ChartWidgetChartTypeDropdown :widget-model="widgetModel" @selectedChartTypeChanged="$emit('selectedChartTypeChanged', $event)"></ChartWidgetChartTypeDropdown>
            </q-card-section>
        </q-card>
        <ChartJSPieChartDataContainer :widget-model="widgetModel" :selected-dataset="selectedDataset"></ChartJSPieChartDataContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IDatasetColumn, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import ChartJSPieChartDataContainer from './ChartJSPieChartDataContainer.vue'
import ChartWidgetChartTypeDropdown from '../common/ChartWidgetChartTypeDropdown.vue'

export default defineComponent({
    name: 'chart-js-widget-data-container',
    components: { ChartWidgetChartTypeDropdown, ChartJSPieChartDataContainer },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        selectedDataset: { type: Object as PropType<IDataset | null> }
    },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {}
    },
    async created() {},
    methods: {}
})
</script>
