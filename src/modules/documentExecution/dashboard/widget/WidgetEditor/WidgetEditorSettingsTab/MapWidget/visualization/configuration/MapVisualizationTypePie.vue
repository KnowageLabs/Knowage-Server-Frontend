<template>
    <div v-if="visualizationType?.pieConf" class="p-formgrid p-grid p-mt-2">
        <div class="p-field p-float-label p-col-12 p-lg-6 p-fluid">
            <Dropdown v-model="visualizationType.pieConf.type" class="kn-material-input" :options="descriptor.pieTypeOptions" option-value="value">
                <template #value="slotProps">
                    <div>
                        <span>{{ getTranslatedLabel(slotProps.value, descriptor.pieTypeOptions, $t) }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div>
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </template>
            </Dropdown>
            <label class="kn-material-input-label">{{ $t('common.type') }}</label>
        </div>

        <div class="p-field p-float-label p-col-12 p-lg-6 p-fluid">
            <Dropdown v-model="visualizationType.pieConf.categorizeBy" class="kn-material-input" :options="layerProperties ?? availableCategories(visualizationType.target)" option-label="property" option-value="property"></Dropdown>
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.map.categorizeBy') }}</label>
        </div>

        <MapVisualizatonChartsColorPicker :prop-visualization-type="visualizationType.pieConf"></MapVisualizatonChartsColorPicker>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetVisualizationType, IMapWidgetVisualizationTypePie } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../MapVisualizationTypeDescriptor.json'
import Dropdown from 'primevue/dropdown'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'
import Slider from 'primevue/slider'
import MapVisualizatonChartsColorPicker from './MapVisualizatonChartsColorPicker.vue'
import { IDatasetColumn, IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'map-visualization-type-pie',
    components: { Dropdown, WidgetEditorColorPicker, Slider, MapVisualizatonChartsColorPicker },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        visTypeProp: { type: Object as PropType<IMapWidgetVisualizationType>, required: true },
        layerProperties: { type: Array as PropType<IMapWidgetLayerProperty[]> },
        datasetColumns: { type: Array as PropType<IDatasetColumn[]> }
    },
    emits: [],
    data() {
        return {
            descriptor,
            visualizationType: null as IMapWidgetVisualizationType | null,
            categories: [] as { columnName: string; alias: string }[],
            getTranslatedLabel
        }
    },
    computed: {
        availableDatasets() {
            if (!this.widgetModel?.layers) return []
            return this.widgetModel.layers.filter((layer: IMapWidgetLayer) => layer.type === 'dataset')
        }
    },
    watch: {
        propPieConfiguration() {
            this.loadPieConfiguration()
        }
    },
    created() {
        this.loadPieConfiguration()
    },
    methods: {
        loadPieConfiguration() {
            this.visualizationType = this.visTypeProp
        },
        availableCategories(dsName: string) {
            const targetDataset = this.availableDatasets.find((layer: IMapWidgetLayer) => dsName === layer.name || dsName === layer.layerId)
            return targetDataset ? targetDataset.columns.filter((column: IWidgetColumn) => column.fieldType !== 'MEASURE') : []
        }
    }
})
</script>
