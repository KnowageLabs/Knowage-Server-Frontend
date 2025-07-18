<template>
    <div class="p-grid">
        <div class="p-col-12 p-text-right">
            <Button id="add-parameter-button" class="kn-button kn-button--primary" @click="$emit('addParameter')"> {{ $t('documentExecution.documentDetails.designerDialog.addParameter') }}</Button>
        </div>

        <div v-for="(parameter, index) in parameters" :key="index" class="p-grid p-col-12 p-ai-center p-p-2">
            <div class="p-grid p-ai-center p-col-10">
                <div class="p-sm-12 p-md-3 p-d-flex p-flex-column">
                    <label class="kn-material-input-label">{{ $t('common.parameter') }}</label>
                    <InputText v-model="parameter.name" class="kn-material-input p-inputtext-sm" :disabled="disabled" />
                </div>
                <div class="p-sm-12 p-md-3 kn-flex p-d-flex p-flex-column p-p-2">
                    <label class="kn-material-input-label"> {{ $t('common.type') }}</label>
                    <Dropdown v-model="parameter.type" class="kn-material-input" :options="linkParameterTypeOptions" option-value="value" :disabled="disabled" @change="onParameterTypeChanged(parameter)">
                        <template #value="slotProps">
                            <div>
                                <span>{{ getTranslatedLabel(slotProps.value, descriptor.linkParameterTypeOptions, $t) }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                </div>
                <div v-if="parameter.type === 'static'" class="p-sm-11 p-md-5 p-d-flex p-flex-column">
                    <label class="kn-material-input-label">{{ $t('common.value') }}</label>
                    <InputText v-model="parameter.value" class="kn-material-input p-inputtext-sm" :disabled="disabled" @change="parametersChanged" />
                </div>
                <div v-else-if="parameter.type === 'driver'" class="p-sm-11 p-md-5 p-d-flex p-flex-row p-ai-center">
                    <div class="p-d-flex p-flex-column kn-flex">
                        <label class="kn-material-input-label"> {{ $t('common.driver') }}</label>
                        <Dropdown v-model="parameter.driver" class="kn-material-input" :options="drivers" option-label="name" option-value="urlName" :disabled="disabled" @change="parametersChanged"> </Dropdown>
                    </div>
                </div>
                <div v-else-if="parameter.type === 'dynamic'" class="p-sm-11 p-md-5 p-d-flex p-flex-row p-ai-center">
                    <div v-if="['table', 'discovery'].includes(widgetType)" class="p-d-flex p-flex-column kn-flex">
                        <label class="kn-material-input-label"> {{ $t('common.column') }}</label>
                        <Dropdown v-model="parameter.column" class="kn-material-input" :options="widgetModel.columns" option-label="alias" option-value="alias" :disabled="disabled" @change="parametersChanged"> </Dropdown>
                    </div>
                    <div v-else-if="['highcharts', 'vega'].includes(widgetType)" class="p-d-flex p-flex-column kn-flex">
                        <label class="kn-material-input-label"> {{ $t('common.column') }}</label>
                        <Dropdown v-model="parameter.column" class="kn-material-input" :options="chartColumnOptions" option-value="value" :disabled="disabled" @change="parametersChanged">
                            <template #value="slotProps">
                                <span>{{ getTranslatedLabel(slotProps.value, chartColumnOptions, $t) }}</span>
                            </template>
                            <template #option="slotProps">
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </template>
                        </Dropdown>
                    </div>
                </div>
                <div v-else-if="parameter.type === 'selection'" class="p-grid p-sm-11 p-md-5 p-ai-center">
                    <div class="p-sm-12 p-md-6 p-ai-center">
                        <div class="p-d-flex p-flex-column kn-flex">
                            <label class="kn-material-input-label"> {{ $t('common.dataset') }}</label>
                            <Dropdown v-model="parameter.dataset" class="kn-material-input" :options="selectedDatasetNames" :disabled="disabled" @change="onDatasetChanged(parameter)"> </Dropdown>
                        </div>
                    </div>
                    <div class="p-sm-12 p-md-6 p-ai-center">
                        <div class="p-d-flex p-flex-column kn-flex">
                            <label class="kn-material-input-label"> {{ $t('common.column') }}</label>
                            <Dropdown v-model="parameter.column" class="kn-material-input" :options="getSelectionDatasetColumnOptions(parameter)" :disabled="disabled" @change="parametersChanged"> </Dropdown>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-col-2 p-d-flex p-flex-row p-text-center p-pt-2">
                <div>
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.useAsResource') }}</label>
                    <InputSwitch v-model="parameter.useAsResource" :disabled="!parameter.useAsResource && useAsResourceSelected" @change="onUseAsResourceSelected(parameter)"></InputSwitch>
                </div>
                <i class="pi pi-trash kn-cursor-pointer p-ml-auto" @click="deleteParameter(index)"></i>
            </div>
            <div v-if="parameter.type === 'json' && parameter.json !== undefined" class="p-grid p-col-12 p-ai-center">
                <KnMonaco ref="monacoEditor" v-model="parameter.json" style="height: 500px" :options="{ theme: 'vs-light' }" :language="'json'" :text-to-insert="''" />
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
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'table-widget-link-parameters-list',
    components: { Dropdown, InputSwitch, KnMonaco },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        propParameters: { type: Array as PropType<IWidgetInteractionParameter[]>, required: true },
        selectedDatasetsColumnsMap: { type: Object },
        dashboardId: { type: String, required: true },
        disabled: { type: Boolean }
    },
    emits: ['change', 'addParameter', 'delete'],
    data() {
        return {
            descriptor,
            parameters: [] as IWidgetInteractionParameter[],
            selectedDatasetNames: [] as string[],
            drivers: [] as IDashboardDriver[],
            useAsResourceSelected: false,
            getTranslatedLabel
        }
    },
    computed: {
        widgetType() {
            return this.widgetModel.type
        },
        linkParameterTypeOptions() {
            return ['table', 'discovery', 'highcharts', 'vega'].includes(this.widgetType) ? this.descriptor.linkParameterTypeOptions : this.descriptor.linkParameterTypeOptions.filter((typeOptions: { value: string; label: string }) => typeOptions.value !== 'dynamic')
        },
        chartColumnOptions() {
            if (['vega'].includes(this.widgetType)) {
                return descriptor.vegaChartInteractionDynamicOptions
            } else if (this.widgetModel.settings.chartModel?.model?.chart?.type === 'heatmap') {
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
        this.loadDrivers()
        this.loadSelectedDatasetNames()
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadDrivers() {
            this.drivers = this.getDashboardDrivers(this.dashboardId)
        },
        loadParameters() {
            this.parameters = this.propParameters
            this.setUseAsResourceSelectedFromLoadedParameters()
        },
        setUseAsResourceSelectedFromLoadedParameters() {
            for (let i = 0; i < this.parameters.length; i++) {
                if (this.parameters[i].useAsResource) {
                    this.useAsResourceSelected = true
                    break
                }
            }
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
                    parameter.value = ''
                    this.deleteFields(['column', 'dataset', 'driver', 'json'], parameter)
                    break
                case 'dynamic':
                    parameter.column = ''
                    this.deleteFields(['value', 'dataset', 'driver', 'json'], parameter)
                    break
                case 'selection':
                    parameter.column = ''
                    parameter.dataset = ''
                    this.deleteFields(['value', 'driver', 'json'], parameter)
                    break
                case 'driver':
                    parameter.driver = ''
                    this.deleteFields(['value', 'dataset', 'column', 'json'], parameter)
                    break
                case 'json':
                    parameter.json = ''
                    this.deleteFields(['value', 'column', 'dataset', 'driver'], parameter)
                    break
                case 'jwt':
                    this.deleteFields(['value', 'column', 'dataset', 'driver', 'json'], parameter)
            }
            this.parametersChanged()
        },
        deleteFields(fields: string[], parameter: IWidgetInteractionParameter) {
            fields.forEach((field: string) => delete parameter[field])
        },
        onDatasetChanged(parameter: IWidgetInteractionParameter) {
            parameter.column = ''
            this.parametersChanged()
        },
        getSelectionDatasetColumnOptions(parameter: IWidgetInteractionParameter) {
            return parameter.dataset && this.selectedDatasetsColumnsMap ? this.selectedDatasetsColumnsMap[parameter.dataset] : []
        },
        deleteParameter(index: number) {
            this.$emit('delete', index)
        },
        onUseAsResourceSelected(parameter: IWidgetInteractionParameter) {
            this.useAsResourceSelected = parameter.useAsResource ?? false
        }
    }
})
</script>

<style lang="scss" scoped>
#add-parameter-button {
    max-width: 200px;
}
</style>
