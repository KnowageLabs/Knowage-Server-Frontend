<template>
    {{ parameters }}
    <div v-for="(parameter, index) in parameters" :key="index" class="param-row row no-wrap q-mb-sm">
        <!-- Handle: enable toggle -->
        <div class="kn-action-handle row items-center justify-center" :class="disabled ? 'kn-action-handle-disabled' : ''" style="width: 22px">
            <q-checkbox v-model="parameter.enabled" size="sm" :disable="disabled" dense @update:model-value="parametersChanged" />
        </div>
        <!-- Main content -->
        <div class="col q-pa-sm" :class="{ 'widget-editor-disabled': !parameter.enabled || disabled }">
            <div class="row q-col-gutter-sm items-center">
                <div class="col-3">
                    <q-input v-model="parameter.name" :label="$t('common.parameter')" outlined dense readonly />
                </div>
                <div class="col-3">
                    <q-select v-model="parameter.type" :options="outputParameterTypeOptions" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="!parameter.enabled || disabled" @update:model-value="onParameterTypeChanged(parameter)">
                        <template #selected-item="slotProps">
                            <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.outputParameterTypeOptions, $t) }}</span>
                        </template>
                        <template #option="slotProps">
                            <q-item v-bind="slotProps.itemProps">
                                <q-item-section>
                                    <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </template>
                    </q-select>
                </div>

                <!-- Static: value input -->
                <div v-if="parameter.type === 'static'" class="col-6">
                    <q-input v-model="parameter.value" :label="$t('common.value')" outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged" />
                </div>

                <!-- Dynamic: column selector -->
                <template v-else-if="parameter.type === 'dynamic' && ['table', 'highcharts', 'chartJS', 'static-pivot-table', 'discovery', 'map', 'ce-pivot-table'].includes(widgetType)">
                    <div v-if="['table', 'discovery', 'static-pivot-table', 'ce-pivot-table'].includes(widgetType)" class="col-6">
                        <q-select v-model="parameter.column" :options="['table', 'discovery'].includes(widgetType) ? widgetModel.columns : pivotTableFields" :label="$t('common.column')" option-label="alias" option-value="columnName" emit-value map-options outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged" />
                    </div>
                    <div v-else-if="widgetType === 'map'" class="col-3">
                        <q-select v-model="parameter.column" :options="mapDynamicOptions" :label="$t('common.column')" :option-value="getTargetLayerType(crossNavigationConfig ?? previewConfig) === 'layer' ? 'property' : 'name'" :option-label="getTargetLayerType(crossNavigationConfig ?? previewConfig) === 'layer' ? 'property' : 'name'" emit-value map-options outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged" />
                    </div>
                    <div v-else class="col-3">
                        <q-select v-model="parameter.column" :options="chartColumnOptions" :label="$t('common.column')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged">
                            <template #selected-item="slotProps">
                                <span>{{ getTranslatedLabel(slotProps.opt.value, chartColumnOptions, $t) }}</span>
                            </template>
                            <template #option="slotProps">
                                <q-item v-bind="slotProps.itemProps">
                                    <q-item-section>
                                        <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-select>
                    </div>
                </template>

                <!-- Selection: dataset + column, side by side -->
                <template v-else-if="parameter.type === 'selection'">
                    <div class="col-3">
                        <q-select v-model="parameter.dataset" :options="selectedDatasetNames" :label="$t('common.dataset')" outlined dense :disable="!parameter.enabled || disabled" @update:model-value="onDatasetChanged(parameter)" />
                    </div>
                    <div class="col-3">
                        <q-select v-model="parameter.column" :options="getSelectionDatasetColumnOptions(parameter)" :label="$t('common.column')" outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged" />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidgetInteractionParameter, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../WidgetInteractionsDescriptor.json'
import { IMapWidgetCrossNavigationVisualizationTypeConfig, IMapWidgetLayer, IMapWidgetPreviewVisualizationTypeConfig } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'

export default defineComponent({
    name: 'table-widget-output-parameters-list',
    components: {},
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
                    break
                case 'dynamic':
                    parameter.value = 'Static'
                    parameter.column = ''
                    delete parameter.dataset
                    break
                case 'selection':
                    parameter.value = 'Static'
                    parameter.column = ''
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

<style scoped>
.param-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
