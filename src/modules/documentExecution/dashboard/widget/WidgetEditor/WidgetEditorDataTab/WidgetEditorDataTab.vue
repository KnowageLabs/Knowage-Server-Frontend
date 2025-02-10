<template>
    <WidgetEditorDataList :widget-model="widget" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" @datasetSelected="setSelectDataset" @selectedDatasetColumnsChanged="onSelectedDatasetColumnsChanged"></WidgetEditorDataList>
    <ChartGallery v-if="chartPickerVisible" :widget-model="widget" @selectedChartTypeChanged="onChartTypeChanged" />
    <div v-else-if="widget" class="p-d-flex kn-flex kn-overflow">
        <WidgetEditorHint v-if="!selectedDataset"></WidgetEditorHint>
        <WidgetEditorCommonDataContainer v-else-if="['table', 'html', 'text', 'discovery', 'customchart', 'python', 'r'].includes(widget.type)" class="kn-flex model-div kn-overflow p-mx-2 p-my-3" :prop-widget-model="widget" :selected-dataset="selectedDataset"></WidgetEditorCommonDataContainer>
        <SelectorWidgetDataContainer v-else-if="widget.type === 'selector'" class="kn-flex model-div kn-overflow p-mx-2 p-my-3" :widget-model="propWidget" :selected-dataset="selectedDataset" :selected-dataset-columns="selectedDatasetColumns"></SelectorWidgetDataContainer>
        <HighchartsDataContainer
            v-else-if="widget.type === 'highcharts' && isEnterprise"
            class="kn-flex model-div kn-overflow p-mx-2 p-my-3"
            :widget-model="propWidget"
            :selected-dataset="selectedDataset"
            :selected-dataset-columns="selectedDatasetColumns"
            @selectedChartTypeChanged="onChartTypeChanged"
        ></HighchartsDataContainer>
        <ChartJSDataContainer v-else-if="widget.type === 'chartJS'" class="kn-flex model-div kn-overflow p-mx-2 p-my-3" :widget-model="propWidget" :selected-dataset="selectedDataset" @selectedChartTypeChanged="onChartTypeChanged"></ChartJSDataContainer>
        <VegaDataContainer v-else-if="widget.type === 'vega'" class="kn-flex model-div kn-overflow p-mx-2 p-my-3" :widget-model="propWidget" :selected-dataset="selectedDataset" @selectedChartTypeChanged="onChartTypeChanged"></VegaDataContainer>
        <PivotTableDataContainer v-else-if="widget.type === 'static-pivot-table'" class="kn-flex model-div kn-overflow p-mx-2 p-my-3" :prop-widget-model="propWidget" :selected-dataset="selectedDataset"></PivotTableDataContainer>
        <PivotTableDataContainer v-else-if="widget.type === 'ce-pivot-table'" class="kn-flex model-div kn-overflow p-mx-2 p-my-3" :prop-widget-model="propWidget" :selected-dataset="selectedDataset"></PivotTableDataContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IVariable, IDatasetColumn } from '../../../Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { mapState } from 'pinia'
import { IHighchartsWidgetSettings } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { IChartJSWidgetSettings } from '../../../interfaces/chartJS/DashboardChartJSWidget'
import { IVegaChartsSettings } from '../../../interfaces/vega/VegaChartsWidget'
import { changeChartType } from './WidgetEditorDataTabHelpers'
import mainStore from '@/App.store'
import WidgetEditorDataList from './WidgetEditorDataList/WidgetEditorDataList.vue'
import WidgetEditorHint from '../WidgetEditorHint.vue'
import WidgetEditorCommonDataContainer from './common/WidgetEditorCommonDataContainer.vue'
import SelectorWidgetDataContainer from './SelectorWidget/SelectorWidgetDataContainer.vue'
import HighchartsDataContainer from './ChartWidget/highcharts/HighchartsDataContainer.vue'
import PivotTableDataContainer from './PivotTable/PivotTableDataContainer.vue'
import ChartJSDataContainer from './ChartWidget/chartJS/ChartJSDataContainer.vue'
import ChartGallery from '../WidgetEditorDataTab/ChartWidget/common/ChartWidgetGallery.vue'
import VegaDataContainer from './ChartWidget/vega/VegaDataContainer.vue'

export default defineComponent({
    name: 'widget-editor-data-tab',
    components: { WidgetEditorDataList, WidgetEditorHint, SelectorWidgetDataContainer, HighchartsDataContainer, WidgetEditorCommonDataContainer, ChartJSDataContainer, ChartGallery, PivotTableDataContainer, VegaDataContainer },
    props: { propWidget: { type: Object as PropType<IWidget>, required: true }, datasets: { type: Array as PropType<IDataset[]> }, selectedDatasets: { type: Array as PropType<IDataset[]> }, variables: { type: Array as PropType<IVariable[]>, required: true } },
    emits: ['datasetSelected'],
    data() {
        return {
            selectedDataset: null as IDataset | null,
            widget: {} as IWidget,
            selectedDatasetColumns: [] as IDatasetColumn[]
        }
    },
    computed: {
        ...mapState(mainStore, {
            isEnterprise: 'isEnterprise'
        }),
        chartPickerVisible() {
            let visible = false
            if (!this.widget || !['highcharts', 'chartJS', 'vega'].includes(this.widget.type)) return false
            const model = (this.widget.settings as IHighchartsWidgetSettings | IChartJSWidgetSettings | IVegaChartsSettings).chartModel?.model
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
        setSelectDataset(dataset: IDataset) {
            this.$emit('datasetSelected', dataset)
            if (this.selectedDataset && dataset.id !== this.selectedDataset.id && this.widget?.settings?.sortingColumn) this.widget.settings.sortingColumn = ''
            this.selectedDataset = dataset as IDataset
        },
        onChartTypeChanged(chartType: string) {
            if (!this.widget) return
            changeChartType(chartType, this.widget, this.isEnterprise)
        },
        onSelectedDatasetColumnsChanged(datasetColumns: IDatasetColumn[]) {
            this.selectedDatasetColumns = datasetColumns
        }
    }
})
</script>
