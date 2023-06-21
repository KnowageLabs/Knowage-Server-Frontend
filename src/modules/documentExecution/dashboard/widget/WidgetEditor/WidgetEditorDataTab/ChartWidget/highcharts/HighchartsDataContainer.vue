<template>
    <div v-if="widgetModel">
        <ChartWidgetChartTypeDropdown :widget-model="widgetModel" @selectedChartTypeChanged="$emit('selectedChartTypeChanged', $event)"></ChartWidgetChartTypeDropdown>
        <HighchartsBubbleDataContainer v-if="['bubble'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsBubbleDataContainer>
        <HighchartsSankeyDataContainer v-else-if="['dependencywheel'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsSankeyDataContainer>
        <HighchartsCommonDataContainer v-else :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsCommonDataContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import HighchartsCommonDataContainer from './HighchartsCommonDataContainer.vue'
import HighchartsBubbleDataContainer from './HighchartsBubbleDataContainer.vue'
import HighchartsSankeyDataContainer from './HighchartsSankeyDataContainer.vue'
import ChartWidgetChartTypeDropdown from '../common/ChartWidgetChartTypeDropdown.vue'

export default defineComponent({
    name: 'highcharts-widget-data-container',
    components: { ChartWidgetChartTypeDropdown, HighchartsBubbleDataContainer, HighchartsCommonDataContainer, HighchartsSankeyDataContainer },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> } },
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
