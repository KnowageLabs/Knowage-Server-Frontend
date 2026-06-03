<template>
    <div class="q-px-md q-pb-xs" style="position: relative">
        <div class="row items-center justify-between q-mb-xs">
            <span class="text-subtitle2">{{ $t('dashboard.generalSettings.createVariable') }}</span>
            <div class="row items-center q-gutter-xs">
                <q-btn flat dense icon="info" size="sm" color="grey-6">
                    <q-tooltip anchor="top middle" self="bottom middle">{{ $t('dashboard.generalSettings.variablesHint') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense color="primary" icon="add" @click="addNewVariable()" />
            </div>
        </div>

        <div v-for="(variable, index) in variables" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-6">
                        <q-input v-model="variable.name" outlined dense :label="$t('common.name')" />
                    </div>
                    <div class="col-6">
                        <q-select v-model="variable.type" outlined dense emit-value map-options :options="descriptor.variableTypes" option-value="value" option-label="label" :label="$t('common.type')" @update:model-value="onVariableTypeChange(variable)">
                            <template #selected-item="slotProps">
                                <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.variableTypes, $t) }}</span>
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

                    <div v-if="variable.type === 'static'" class="col-12">
                        <q-input v-model="variable.value" outlined dense :label="$t('common.value')" />
                    </div>

                    <div v-if="variable.type === 'dataset'" class="col-6">
                        <q-select v-model="variable.dataset" outlined dense emit-value map-options :options="selectedDatasetOptions" option-label="label" option-value="id" :label="$t('common.dataset')" />
                    </div>
                    <div v-if="variable.type === 'dataset'" class="col-6">
                        <q-select v-model="variable.column" outlined dense :options="getSelectionDatasetColumnOptions(variable)" :label="$t('common.column')" :hint="$t('dashboard.generalSettings.variableColumnHint')" hide-bottom-space />
                    </div>

                    <div v-if="variable.type === 'driver'" class="col-12">
                        <q-select v-model="variable.driver" outlined dense emit-value map-options :options="drivers" option-label="name" option-value="urlName" :label="$t('dashboard.widgetEditor.interactions.analyticalDriver')" @update:model-value="setValueFromAnalyticalDriver(variable)" />
                    </div>

                    <div v-if="variable.type === 'profile'" class="col-12">
                        <q-select v-model="variable.attribute" outlined dense emit-value map-options :options="profileAttributes" option-label="name" option-value="name" :label="$t('dashboard.generalSettings.attribute')" @update:model-value="setValueFromProfileAttribute(variable)" />
                    </div>

                    <div v-if="['executionTime', 'executionDate'].includes(variable.type)" class="col-12">
                        <q-select v-model="variable.dateTimeFormat" outlined dense emit-value map-options :options="variable.type === 'executionTime' ? descriptor.variablesTimeFormatOptions : descriptor.variablesDateFormatOptions" option-value="value" option-label="label" :label="$t('dashboard.widgetEditor.format')" @update:model-value="onTimeFormatChanged(variable)">
                            <template #selected-item="slotProps">
                                <span>{{ getTranslatedLabel(slotProps.opt.value, variable.type === 'executionTime' ? descriptor.variablesTimeFormatOptions : descriptor.variablesDateFormatOptions, $t) }}</span>
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

                    <div v-if="variable.type === 'activeSelection'" class="col-6">
                        <q-select v-model="variable.activeSelectionDataset" outlined dense emit-value map-options :options="selectedDatasetOptions" option-label="label" option-value="id" :label="$t('common.dataset')" @update:model-value="onActiveSelectionDatasetChanged(variable)" />
                    </div>
                    <div v-if="variable.type === 'activeSelection'" class="col-6">
                        <q-select v-model="variable.activeSelectionColumn" outlined dense :options="getSelectionDatasetColumnOptions(variable, true)" :label="$t('common.column')" @update:model-value="onActiveSelectionColumnChanged(variable)" />
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn v-tooltip.left="$t('common.delete')" flat round dense icon="delete" size="sm" data-test="delete-button" @click="removeVariable(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IVariable, IDataset, IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import descriptor from './DashboardGeneralSettingsDescriptor.json'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import { setVairableExecutionDateValue, setVairableLocaleValue, setVariableActiveSelectionValue, setVariableExectuionTimeValue } from './VariablesHelper'

export default defineComponent({
    name: 'dashboard-variables',
    components: { KnFabButton },
    props: {
        propVariables: { type: Array as PropType<IVariable[]>, required: true },
        selectedDatasets: { type: Array as PropType<IDataset[]>, required: true },
        selectedDatasetsColumnsMap: { type: Object, required: true },
        profileAttributes: { type: Array as PropType<{ name: string; value: string }[]>, required: true },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            descriptor,
            variables: [] as IVariable[],
            selectedDatasetOptions: [] as { id: number; label: string }[],
            drivers: [] as IDashboardDriver[],
            getTranslatedLabel
        }
    },
    watch: {
        propVariables() {
            this.loadData()
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboardDrivers', 'getDashboardDatasets', 'getAllDatasets']),
        loadData() {
            this.loadVariables()
            this.loadDrivers()
            this.loadSelectedDatasetNames()
        },
        loadDrivers() {
            this.drivers = this.getDashboardDrivers(this.dashboardId)
        },
        loadVariables() {
            this.variables = this.propVariables
        },
        loadSelectedDatasetNames() {
            if (!this.selectedDatasetsColumnsMap) return
            Object.keys(this.selectedDatasetsColumnsMap).forEach((key: string) => this.selectedDatasetOptions.push({ id: +key, label: this.selectedDatasetsColumnsMap[key].name }))
        },
        getSelectionDatasetColumnOptions(variable: IVariable, forActiveSelections?: boolean) {
            const index = forActiveSelections && variable.activeSelectionDataset != null ? variable.activeSelectionDataset : variable.dataset
            if (!index) return []
            return this.selectedDatasetsColumnsMap ? [''].concat(this.selectedDatasetsColumnsMap[index].columns) : []
        },
        onVariableTypeChange(variable: IVariable) {
            variable.value = ''

            switch (variable.type) {
                case 'static':
                    this.deleteVariableFields(['dataset', 'column', 'attribute', 'driver', 'executionTime', 'executionDate', 'locale', 'activeSelectionDataset', 'activeSelectionColumn'], variable)
                    break
                case 'dataset':
                    this.deleteVariableFields(['dataset', 'column', 'executionTime', 'executionDate', 'locale', 'activeSelectionDataset', 'activeSelectionColumn'], variable)
                    break
                case 'driver':
                    this.deleteVariableFields(['dataset', 'column', 'attribute', 'executionTime', 'executionDate', 'locale', 'activeSelectionDataset', 'activeSelectionColumn'], variable)
                    break
                case 'profile':
                    this.deleteVariableFields(['dataset', 'column', 'driver', 'executionTime', 'executionDate', 'locale', 'activeSelectionDataset', 'activeSelectionColumn'], variable)
                    break
                case 'executionTime':
                    this.deleteVariableFields(['dataset', 'column', 'attribute', 'driver', 'locale', 'activeSelectionDataset', 'activeSelectionColumn'], variable)
                    variable.dateTimeFormat = 'LTS'
                    setVariableExectuionTimeValue(variable, this.dashboardId)
                    break
                case 'executionDate':
                    this.deleteVariableFields(['dataset', 'column', 'attribute', 'driver', 'locale', 'activeSelectionDataset', 'activeSelectionColumn'], variable)
                    variable.dateTimeFormat = 'LL'
                    setVairableExecutionDateValue(variable, this.dashboardId)
                    break
                case 'locale':
                    this.deleteVariableFields(['dataset', 'column', 'attribute', 'driver', 'locale', 'activeSelectionDataset', 'activeSelectionColumn'], variable)
                    setVairableLocaleValue(variable)
                    break
                case 'activeSelection':
                    this.deleteVariableFields(['dataset', 'column', 'driver', 'executionTime', 'executionDate', 'locale'], variable)
            }
        },
        deleteVariableFields(fields: string[], variable: IVariable) {
            fields.forEach((field: string) => delete variable[field])
        },
        setValueFromAnalyticalDriver(variable: IVariable) {
            const index = this.drivers.findIndex((driver: any) => driver.urlName === variable.driver)
            variable.value = index !== -1 ? this.drivers[index].value : ''
        },
        setValueFromProfileAttribute(variable: IVariable) {
            const index = this.profileAttributes.findIndex((profileAttribute: { name: string; value: string }) => profileAttribute.name === variable.attribute)
            variable.value = index !== -1 ? this.profileAttributes[index].value : ''
        },
        addNewVariable() {
            this.variables.push({ name: '', type: '', value: '' })
        },
        removeVariable(index: number) {
            this.variables.splice(index, 1)
        },
        onTimeFormatChanged(variable: IVariable) {
            variable.type === 'executionTime' ? setVariableExectuionTimeValue(variable, this.dashboardId) : setVairableExecutionDateValue(variable, this.dashboardId)
        },
        onActiveSelectionDatasetChanged(variable: IVariable) {
            variable.value = ''
            variable.activeSelectionColumn = null
        },
        onActiveSelectionColumnChanged(variable: IVariable) {
            setVariableActiveSelectionValue(variable, this.dashboardId)
        }
    }
})
</script>

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
