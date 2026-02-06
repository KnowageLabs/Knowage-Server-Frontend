<template>
    <ChartGallery v-if="chartPickerVisible" :widget-model="widget" @selectedChartTypeChanged="onChartTypeChanged" />
    <div v-else-if="widget" class="p-d-flex kn-flex">
        <WidgetEditorHint v-if="!selectedDataset"></WidgetEditorHint>
        <WidgetEditorCommonDataContainer v-else-if="['table', 'html', 'text', 'discovery', 'customchart', 'python', 'r'].includes(widget.type)" class="kn-flex" :prop-widget-model="widget" :selected-dataset="selectedDataset"></WidgetEditorCommonDataContainer>
        <SelectorWidgetDataContainer v-else-if="widget.type === 'selector'" class="kn-flex" :widget-model="propWidget" :selected-dataset="selectedDataset" :selected-dataset-columns="selectedDatasetColumns"></SelectorWidgetDataContainer>
        <HighchartsDataContainer v-else-if="widget.type === 'highcharts' && isEnterprise" class="kn-flex" :widget-model="propWidget" :selected-dataset="selectedDataset" :listDragActive="listDragActive" @selectedChartTypeChanged="onChartTypeChanged"></HighchartsDataContainer>
        <ChartJSDataContainer v-else-if="widget.type === 'chartJS'" class="kn-flex" :widget-model="propWidget" :selected-dataset="selectedDataset" @selectedChartTypeChanged="onChartTypeChanged"></ChartJSDataContainer>
        <PivotTableDataContainer v-else-if="widget.type === 'static-pivot-table'" class="kn-flex" :prop-widget-model="propWidget" :selected-dataset="selectedDataset"></PivotTableDataContainer>
        <PivotTableDataContainer v-else-if="widget.type === 'ce-pivot-table'" class="kn-flex" :prop-widget-model="propWidget" :selected-dataset="selectedDataset"></PivotTableDataContainer>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable, IDatasetColumn } from '../../../Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { mapState } from 'pinia'
import { IHighchartsWidgetSettings } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { IChartJSWidgetSettings } from '../../../interfaces/chartJS/DashboardChartJSWidget'
import { changeChartType } from './WidgetEditorDataTabHelpers'
import mainStore from '@/App.store'
import WidgetEditorHint from '../WidgetEditorHint.vue'
import WidgetEditorCommonDataContainer from './common/WidgetEditorCommonDataContainer.vue'
import SelectorWidgetDataContainer from './SelectorWidget/SelectorWidgetDataContainer.vue'
import HighchartsDataContainer from './ChartWidget/highcharts/HighchartsDataContainer.vue'
import PivotTableDataContainer from './PivotTable/PivotTableDataContainer.vue'
import ChartJSDataContainer from './ChartWidget/chartJS/ChartJSDataContainer.vue'
import ChartGallery from '../WidgetEditorDataTab/ChartWidget/common/ChartWidgetGallery.vue'

export default defineComponent({
    name: 'widget-editor-data-tab',
    components: { WidgetEditorHint, SelectorWidgetDataContainer, HighchartsDataContainer, WidgetEditorCommonDataContainer, ChartJSDataContainer, ChartGallery, PivotTableDataContainer },
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        selectedDataset: { type: Object as PropType<IDataset | null>, default: null },
        selectedDatasetColumns: { type: Array as PropType<IDatasetColumn[]>, default: () => [] },
        listDragActive: { type: Boolean, default: false }
    },
    emits: [],
    data() {
        return {
            widget: {} as IWidget
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        chartPickerVisible() {
            let visible = false
            if (!this.widget || !['highcharts', 'chartJS'].includes(this.widget.type)) return false
            const model = (this.widget.settings as IHighchartsWidgetSettings | IChartJSWidgetSettings).chartModel?.model
            visible = !model?.chart?.type
            emitter.emit('chartPickerVisible', visible)
            return visible
        }
    },
    created() {
        this.loadWidget()
    },
    methods: {
        loadWidget() {
            this.widget = this.propWidget
        },
        onChartTypeChanged(chartType: string) {
            if (!this.widget) return
            changeChartType(chartType, this.widget, this.isEnterprise)
        }
    }
})
</script>
