<template>
    <div v-if="widgetModel">
        <ChartWidgetChartTypeDropdown :widget-model="widgetModel" @selectedChartTypeChanged="$emit('selectedChartTypeChanged', $event)"></ChartWidgetChartTypeDropdown>
        <HighchartsLimitSettings :widget-model="widgetModel"> </HighchartsLimitSettings>
        <HighchartsBubbleDataContainer v-if="['bubble'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsBubbleDataContainer>
        <HighchartsSankeyDataContainer v-else-if="['dependencywheel', 'sankey', 'streamgraph'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsSankeyDataContainer>
        <HighchartsDumbbellDataContainer v-else-if="['dumbbell'].includes(chartType)" :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsDumbbellDataContainer>
        <HighchartsCommonDataContainer v-else :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></HighchartsCommonDataContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import HighchartsCommonDataContainer from './HighchartsCommonDataContainer.vue'
import HighchartsBubbleDataContainer from './HighchartsBubbleDataContainer.vue'
import HighchartsSankeyDataContainer from './HighchartsSankeyDataContainer.vue'
import HighchartsDumbbellDataContainer from './HighchartsDumbbellDataContainer.vue'
import ChartWidgetChartTypeDropdown from '../common/ChartWidgetChartTypeDropdown.vue'
import HighchartsLimitSettings from './HighchartsLimitSettings.vue'

export default defineComponent({
    name: 'highcharts-widget-data-container',
    components: { ChartWidgetChartTypeDropdown, HighchartsBubbleDataContainer, HighchartsCommonDataContainer, HighchartsSankeyDataContainer, HighchartsLimitSettings, HighchartsDumbbellDataContainer },
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
