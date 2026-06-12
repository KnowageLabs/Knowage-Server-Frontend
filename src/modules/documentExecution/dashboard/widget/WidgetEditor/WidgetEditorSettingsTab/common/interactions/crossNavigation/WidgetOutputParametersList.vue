<template>
    <div>
        <div v-for="(parameter, index) in parameters" :key="index" class="p-d-flex p-flex-row p-ai-center p-flex-wrap p-col-12 p-p-2" style="gap: 0.5rem">
            <InputSwitch v-model="parameter.enabled" :disabled="disabled" @change="parametersChanged"></InputSwitch>
            <div class="p-d-flex p-flex-column" style="flex: 1 1 120px; min-width: 100px">
                <label class="kn-material-input-label">{{ $t('common.parameter') }}</label>
                <InputText v-model="parameter.name" class="kn-material-input p-inputtext-sm" :disabled="true" />
            </div>
            <div class="p-d-flex p-flex-column" style="flex: 1 1 120px; min-width: 100px">
                <label class="kn-material-input-label">{{ $t('common.type') }}</label>
                <Dropdown v-model="parameter.type" class="kn-material-input" :options="outputParameterTypeOptions" option-value="value" :disabled="disabled" @change="onParameterTypeChanged(parameter)">
                    <template #value="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.value, descriptor.outputParameterTypeOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </template>
                </Dropdown>
            </div>
            <div v-if="parameter.type === 'static'" class="p-d-flex p-flex-column" style="flex: 2 1 200px; min-width: 120px">
                <label class="kn-material-input-label">{{ $t('common.value') }}</label>
                <InputText v-model="parameter.value" class="kn-material-input p-inputtext-sm" :disabled="disabled" @change="parametersChanged" />
            </div>
            <div v-else-if="parameter.type === 'dynamic' && ['table', 'highcharts', 'chartJS', 'static-pivot-table', 'discovery', 'map', 'ce-pivot-table'].includes(widgetType)" class="p-d-flex p-flex-column" style="flex: 2 1 200px; min-width: 120px">
                <label class="kn-material-input-label">{{ $t('common.column') }}</label>
                <Dropdown v-if="['table', 'discovery', 'static-pivot-table', 'ce-pivot-table'].includes(widgetType)" v-model="parameter.column" class="kn-material-input" :options="['table', 'discovery'].includes(widgetType) ? widgetModel.columns : pivotTableFields" option-label="alias" option-value="columnName" :disabled="disabled" @change="parametersChanged"></Dropdown>
                <Dropdown v-else-if="widgetType === 'map'" v-model="parameter.column" class="kn-material-input" :options="mapDynamicOptions" :option-value="getTargetLayerType(crossNavigationConfig ?? previewConfig) === 'layer' ? 'property' : 'name'" :option-label="getTargetLayerType(crossNavigationConfig ?? previewConfig) === 'layer' ? 'property' : 'name'" :disabled="disabled" @change="parametersChanged"></Dropdown>
                <Dropdown v-else v-model="parameter.column" class="kn-material-input" :options="chartColumnOptions" option-value="value" :disabled="disabled" @change="parametersChanged">
                    <template #value="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.value, chartColumnOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </template>
                </Dropdown>
            </div>
            <template v-else-if="parameter.type === 'selection'">
                <div class="p-d-flex p-flex-column" style="flex: 1 1 140px; min-width: 100px">
                    <label class="kn-material-input-label">{{ $t('common.dataset') }}</label>
                    <Dropdown v-model="parameter.dataset" class="kn-material-input" :options="selectedDatasetNames" :disabled="disabled" @change="onDatasetChanged(parameter)"></Dropdown>
                </div>
                <div class="p-d-flex p-flex-column" style="flex: 1 1 140px; min-width: 100px">
                    <label class="kn-material-input-label">{{ $t('common.column') }}</label>
                    <Dropdown v-model="parameter.column" class="kn-material-input" :options="getSelectionDatasetColumnOptions(parameter)" :disabled="disabled" @change="parametersChanged"></Dropdown>
                </div>
                <div class="p-d-flex p-ai-center" style="gap: 0.4rem; padding-top: 1.1rem">
                    <InputSwitch v-model="parameter.propagateAsSelection" :disabled="disabled" @change="parametersChanged"></InputSwitch>
                    <label class="kn-material-input-label" style="white-space: nowrap">{{ $t('dashboard.widgetEditor.interactions.propagateSelections') }}</label>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidgetInteractionParameter, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../WidgetInteractionsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import { IMapWidgetCrossNavigationVisualizationTypeConfig, IMapWidgetLayer, IMapWidgetPreviewVisualizationTypeConfig } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'

export default defineComponent({
    name: 'table-widget-output-parameters-list',
    components: { Dropdown, InputSwitch },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        propParameters: { type: Array as PropType<IWidgetInteractionParameter[]>, required: true },
        selectedDatasetsColumnsMap: { type: Object },
        disabled: { type: Boolean },
        mapDynamicOptions: { type: Object as PropType<any> },
        crossNavigationConfig: { type: Object as PropType<IMapWidgetCrossNavigationVisualizationTypeConfig> },
        previewConfig: { type: Object as PropType<IMapWidgetPreviewVisualizationTypeConfig> }
    },
    emits: ['change'],
    data() {
        return {
            descriptor,
            parameters: [] as IWidgetInteractionParameter[],
            selectedDatasetNames: [] as string[],
            getTranslatedLabel
        }
    },
    computed: {
        widgetType() {
            return this.widgetModel.type
        },
        outputParameterTypeOptions() {
            return this.widgetType !== 'image' ? descriptor.outputParameterTypeOptions : descriptor.outputParameterTypeOptions.filter((option: { value: string; label: string }) => option.value !== 'dynamic')
        },
        pivotTableFields(): any {
            if (this.widgetType !== 'static-pivot-table' && this.widgetType !== 'ce-pivot-table') return []
            const modelFields = this.widgetModel.fields
            const combinedArray = modelFields?.columns.concat(modelFields.rows, modelFields.data, modelFields.filters)
            return combinedArray
        },
        chartColumnOptions() {
            if (['table', 'discovery', 'static-pivot-table'].includes(this.widgetType)) return []
            if (this.widgetModel.settings.chartModel?.model?.chart?.type === 'heatmap') {
                return descriptor.chartInteractionDynamicOptions.concat(descriptor.chartInteractionAdditionalDynamicOptions)
            } else {
                return descriptor.chartInteractionDynamicOptions
            }
        }
    },
    watch: {
        propParameters() {
            this.loadParameters()
        }
    },
    created() {
        this.loadParameters()
        this.loadSelectedDatasetNames()
    },
    methods: {
        loadParameters() {
            this.parameters = this.propParameters
        },
        loadSelectedDatasetNames() {
            if (!this.selectedDatasetsColumnsMap) return
            Object.keys(this.selectedDatasetsColumnsMap).forEach((key: string) => this.selectedDatasetNames.push(key))
        },
        parametersChanged() {
            this.$emit('change', this.parameters)
        },
        onParameterTypeChanged(parameter: IWidgetInteractionParameter) {
            switch (parameter.type) {
                case 'static':
                    parameter.value = ''
                    delete parameter.column
                    delete parameter.dataset
                    delete parameter.propagateAsSelection
                    break
                case 'dynamic':
                    parameter.value = 'Static'
                    parameter.column = ''
                    delete parameter.dataset
                    delete parameter.propagateAsSelection
                    break
                case 'selection':
                    parameter.value = 'Static'
                    parameter.column = ''
                    parameter.propagateAsSelection = false
                    break
            }
            this.parametersChanged()
        },
        getSelectionDatasetColumnOptions(parameter: IWidgetInteractionParameter) {
            return parameter.dataset && this.selectedDatasetsColumnsMap ? this.selectedDatasetsColumnsMap[parameter.dataset] : []
        },
        onDatasetChanged(parameter: IWidgetInteractionParameter) {
            parameter.column = ''
            this.parametersChanged()
        },
        getTargetLayerType(crossNavigationVisTypeConfig: IMapWidgetCrossNavigationVisualizationTypeConfig | IMapWidgetPreviewVisualizationTypeConfig | undefined) {
            if (!crossNavigationVisTypeConfig) return ''
            return this.widgetModel.layers.find((layer: IMapWidgetLayer) => crossNavigationVisTypeConfig.vizualizationType?.target === layer.layerId) ? this.widgetModel.layers.find((layer: IMapWidgetLayer) => crossNavigationVisTypeConfig.vizualizationType?.target === layer.layerId).type : 'dataset'
        }
    }
})
</script>
