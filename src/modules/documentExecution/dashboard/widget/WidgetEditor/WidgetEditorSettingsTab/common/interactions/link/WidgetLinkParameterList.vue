<template>
    <q-expansion-item dense hide-expand-icon :default-opened="expansionOpened">
        <template #header>
            <q-item-section>
                <span class="text-subtitle2">{{ $t('documentExecution.documentDetails.designerDialog.parameters') }}</span>
            </q-item-section>
            <q-item-section side>
                <q-btn flat dense color="primary" icon="add" size="sm" :label="$t('documentExecution.documentDetails.designerDialog.addParameter')" :disable="disabled" @click.stop="$emit('addParameter')" />
            </q-item-section>
        </template>

        <div v-for="(parameter, index) in parameters" :key="index" class="param-row row no-wrap q-mb-sm q-mt-sm">
            <div class="kn-action-handle row items-center justify-center" :class="disabled ? 'kn-action-handle-disabled' : ''" style="width: 22px">
                <q-checkbox v-model="parameter.useAsResource" v-tooltip.top="$t('dashboard.widgetEditor.useAsResource')" size="sm" :disable="disabled || (!parameter.useAsResource && useAsResourceSelected)" dense @update:model-value="onUseAsResourceSelected(parameter)" />
            </div>

            <!-- Parameter content -->
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm">
                    <!-- Name + Type: same row -->
                    <div class="col-4">
                        <q-input v-model="parameter.name" :label="$t('common.parameter')" outlined dense :disable="disabled" @update:model-value="parametersChanged" />
                    </div>
                    <div class="col-4">
                        <q-select v-model="parameter.type" :options="linkParameterTypeOptions" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="disabled" @update:model-value="onParameterTypeChanged(parameter)">
                            <template #selected-item="slotProps">
                                <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.linkParameterTypeOptions, $t) }}</span>
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
                    <div v-if="parameter.type === 'static'" class="col-4">
                        <q-input v-model="parameter.value" :label="$t('common.value')" outlined dense :disable="disabled" @update:model-value="parametersChanged" />
                    </div>

                    <!-- Driver -->
                    <div v-else-if="parameter.type === 'driver'" class="col-4">
                        <q-select v-model="parameter.driver" :options="drivers" :label="$t('common.driver')" option-label="name" option-value="urlName" emit-value map-options outlined dense :disable="disabled" @update:model-value="parametersChanged" />
                    </div>

                    <!-- Dynamic: column -->
                    <template v-else-if="parameter.type === 'dynamic'">
                        <div v-if="['table', 'discovery'].includes(widgetType)" class="col-4">
                            <q-select v-model="parameter.column" :options="widgetModel.columns" :label="$t('common.column')" option-label="alias" option-value="alias" emit-value map-options outlined dense :disable="disabled" @update:model-value="parametersChanged" />
                        </div>
                        <div v-else-if="widgetType === 'highcharts'" class="col-4">
                            <q-select v-model="parameter.column" :options="chartColumnOptions" :label="$t('common.column')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="disabled" @update:model-value="parametersChanged">
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
                        <div class="col-4">
                            <q-select v-model="parameter.dataset" :options="selectedDatasetNames" :label="$t('common.dataset')" outlined dense :disable="disabled" @update:model-value="onDatasetChanged(parameter)" />
                        </div>
                        <div class="col-12">
                            <q-select v-model="parameter.column" :options="getSelectionDatasetColumnOptions(parameter)" :label="$t('common.column')" outlined dense :disable="disabled" @update:model-value="parametersChanged" />
                        </div>
                    </template>

                    <!-- JSON: Monaco editor -->
                    <div v-if="parameter.type === 'json' && parameter.json !== undefined" class="col-12">
                        <KnMonaco ref="monacoEditor" v-model="parameter.json" style="height: 300px" :options="{ theme: 'vs-light' }" :language="'json'" :text-to-insert="''" />
                    </div>
                </div>
            </div>

            <!-- Handle: useAsResource toggle + delete -->
            <div class="kn-action-handle row items-center justify-center" :class="disabled ? 'kn-action-handle-disabled' : ''">
                <q-btn flat round dense icon="delete" size="sm" :disable="disabled" @click="deleteParameter(index)" />
            </div>
        </div>
    </q-expansion-item>
</template>

<script lang="ts">
import { IWidgetInteractionParameter, IWidget, IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import descriptor from '../WidgetInteractionsDescriptor.json'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'table-widget-link-parameters-list',
    components: { KnMonaco },
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
            return ['table', 'discovery', 'highcharts'].includes(this.widgetType) ? this.descriptor.linkParameterTypeOptions : this.descriptor.linkParameterTypeOptions.filter((typeOptions: { value: string; label: string }) => typeOptions.value !== 'dynamic')
        },
        chartColumnOptions() {
            if (this.widgetModel.settings.chartModel?.model?.chart?.type === 'heatmap') {
                return descriptor.chartInteractionDynamicOptions.concat(descriptor.chartInteractionAdditionalDynamicOptions)
            } else {
                return descriptor.chartInteractionDynamicOptions
            }
        },
        expansionOpened() {
            return this.parameters.length < 4
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

<style scoped>
.param-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
