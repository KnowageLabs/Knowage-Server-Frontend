<template>
    <div v-for="(parameter, index) in parameters" :key="index" class="param-row row no-wrap q-mb-sm">
        <div class="kn-action-handle row items-center justify-center" :class="disabled ? 'kn-action-handle-disabled' : ''" style="width: 22px">
            <q-checkbox v-model="parameter.enabled" :disable="disabled" size="sm" dense @update:model-value="parametersChanged" />
        </div>
        <!-- Parameter content -->
        <div class="col q-pa-sm" :class="{ 'widget-editor-disabled': !parameter.enabled || disabled }">
            <div class="row q-col-gutter-sm">
                <!-- Name + Type: same row -->
                <div class="col-6">
                    <q-input v-model="parameter.name" :label="$t('common.parameter')" outlined dense readonly />
                </div>
                <div class="col-6">
                    <q-select v-model="parameter.type" :options="descriptor.previewParameterTypeOptions" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="!parameter.enabled || disabled" @update:model-value="onParameterTypeChanged(parameter)">
                        <template #selected-item="slotProps">
                            <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.previewParameterTypeOptions, $t) }}</span>
                        </template>
                        <template #option="slotProps">
                            <q-item v-bind="slotProps.itemProps">
                                <q-item-section
                                    ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                                >
                            </q-item>
                        </template>
                    </q-select>
                </div>

                <!-- Static: value -->
                <div v-if="parameter.type === 'static'" class="col-12">
                    <q-input v-model="parameter.value" :label="$t('common.value')" outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged" />
                </div>

                <!-- Driver -->
                <div v-else-if="parameter.type === 'driver'" class="col-12">
                    <q-select v-model="parameter.driver" :options="drivers" :label="$t('common.driver')" option-label="name" option-value="name" emit-value map-options outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged" />
                </div>

                <!-- Dynamic: column -->
                <template v-else-if="parameter.type === 'dynamic' && ['table', 'discovery', 'highcharts', 'chartJS', 'html', 'customchart'].includes(widgetType)">
                    <div v-if="['table', 'discovery', 'static-pivot-table', 'ce-pivot-table'].includes(widgetType)" class="col-12">
                        <q-select v-model="parameter.column" :options="widgetModel.columns" :label="$t('common.column')" option-label="alias" option-value="columnName" emit-value map-options outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged" />
                    </div>
                    <div v-else class="col-12">
                        <q-select v-model="parameter.column" :options="chartColumnOptions" :label="$t('common.column')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged">
                            <template #selected-item="slotProps">
                                <span>{{ getTranslatedLabel(slotProps.opt.value, chartColumnOptions, $t) }}</span>
                            </template>
                            <template #option="slotProps">
                                <q-item v-bind="slotProps.itemProps">
                                    <q-item-section
                                        ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                                    >
                                </q-item>
                            </template>
                        </q-select>
                    </div>
                </template>

                <!-- Selection: dataset + column -->
                <template v-else-if="parameter.type === 'selection'">
                    <div class="col-6">
                        <q-select v-model="parameter.dataset" :options="selectedDatasetNames" :label="$t('common.dataset')" outlined dense :disable="!parameter.enabled || disabled" @update:model-value="onDatasetChanged(parameter)" />
                    </div>
                    <div class="col-6">
                        <q-select v-model="parameter.column" :options="getSelectionDatasetColumnOptions(parameter)" :label="$t('common.column')" outlined dense :disable="!parameter.enabled || disabled" @update:model-value="parametersChanged" />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidgetInteractionParameter, IWidget, IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import descriptor from '../WidgetInteractionsDescriptor.json'

export default defineComponent({
    name: 'table-widget-preview-parameters-list',
    components: {},
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        propParameters: { type: Array as PropType<IWidgetInteractionParameter[]>, required: true },
        selectedDatasetsColumnsMap: { type: Object },
        dashboardId: { type: String, required: true },
        disabled: { type: Boolean }
    },
    emits: ['change'],
    data() {
        return {
            descriptor,
            parameters: [] as IWidgetInteractionParameter[],
            selectedDatasetNames: [] as string[],
            drivers: [] as IDashboardDriver[],
            getTranslatedLabel
        }
    },
    computed: {
        widgetType() {
            return this.widgetModel.type
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
        this.loadDrivers()
        this.loadParameters()
        this.loadSelectedDatasetNames()
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadDrivers() {
            this.drivers = this.getDashboardDrivers(this.dashboardId)
        },
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
            parameter.value = ''
            switch (parameter.type) {
                case 'static':
                    delete parameter.column
                    delete parameter.dataset
                    delete parameter.driver
                    break
                case 'dynamic':
                    parameter.column = ''
                    delete parameter.dataset
                    delete parameter.driver
                    break
                case 'selection':
                    parameter.column = ''
                    delete parameter.driver
                    break
                case 'driver':
                    parameter.column = ''
                    delete parameter.column
                    delete parameter.dataset
            }
            this.parametersChanged()
        },
        onDatasetChanged(parameter: IWidgetInteractionParameter) {
            parameter.column = ''
            this.parametersChanged()
        },
        getSelectionDatasetColumnOptions(parameter: IWidgetInteractionParameter) {
            return parameter.dataset && this.selectedDatasetsColumnsMap ? this.selectedDatasetsColumnsMap[parameter.dataset] : []
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
