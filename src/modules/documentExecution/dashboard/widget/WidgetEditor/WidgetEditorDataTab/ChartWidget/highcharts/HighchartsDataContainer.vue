<template>
    <div v-if="widgetModel">
        <ChartWidgetChartTypeDropdown :widget-model="widgetModel" @selectedChartTypeChanged="$emit('selectedChartTypeChanged', $event)"></ChartWidgetChartTypeDropdown>
        <HighchartsLimitSettings :widget-model="widgetModel"> </HighchartsLimitSettings>
        <HighchartsSortingSettings v-if="['pie', 'area', 'bar', 'column', 'line'].includes(chartType)" :widget-model="widgetModel" :selected-dataset-columns="selectedDatasetColumns">></HighchartsSortingSettings>
        <HighchartsBubbleDataContainer v-if="['bubble'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsBubbleDataContainer>
        <HighchartsSankeyDataContainer v-else-if="['dependencywheel', 'sankey', 'streamgraph', 'packedbubble'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsSankeyDataContainer>
        <HighchartsDumbbellDataContainer v-else-if="['dumbbell'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsDumbbellDataContainer>
        <HighchartsScatterDataContainer v-else-if="['scatter'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset" :selected-dataset-columns="selectedDatasetColumns"></HighchartsScatterDataContainer>
        <HighchartsCommonDataContainer v-else :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsCommonDataContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IDatasetColumn, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import HighchartsCommonDataContainer from './HighchartsCommonDataContainer.vue'
import HighchartsBubbleDataContainer from './HighchartsBubbleDataContainer.vue'
import HighchartsSankeyDataContainer from './HighchartsSankeyDataContainer.vue'
import HighchartsDumbbellDataContainer from './HighchartsDumbbellDataContainer.vue'
import HighchartsScatterDataContainer from './HighchartsScatterDataContainer.vue'
import ChartWidgetChartTypeDropdown from '../common/ChartWidgetChartTypeDropdown.vue'
import HighchartsLimitSettings from './HighchartsLimitSettings.vue'
import HighchartsSortingSettings from './HighchartsSortingSettings.vue'

export default defineComponent({
    name: 'highcharts-widget-data-container',
    components: { ChartWidgetChartTypeDropdown, HighchartsBubbleDataContainer, HighchartsCommonDataContainer, HighchartsSankeyDataContainer, HighchartsLimitSettings, HighchartsDumbbellDataContainer, HighchartsScatterDataContainer, HighchartsSortingSettings },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> }, selectedDatasetColumns: { type: Array as PropType<IDatasetColumn[]>, required: true } },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {}
    },
    computed: {
        chartType() {
            return this.widgetModel?.settings.chartModel?.model?.chart.type
        }
    },
    async created() {},
    methods: {}
})
</script>
