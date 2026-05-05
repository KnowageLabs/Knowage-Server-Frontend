<template>
    <div v-if="headersModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm" :class="{ 'widget-editor-disabled': headersDisabled }">
            <div class="col-12">
                <q-toggle v-model="headersModel.enabledMultiline" :label="$t('dashboard.widgetEditor.headers.enableMultiline')" @update:model-value="headersConfigurationChanged" dense />
            </div>
            <div class="col-12"><q-separator /></div>
            <div class="col-12">
                <q-toggle v-model="headersModel.custom.enabled" :label="$t('dashboard.widgetEditor.headers.enableCustomHeaders')" @update:model-value="onCustomHeadersEnabledChange" dense />
            </div>
            <div v-for="(rule, index) in headersModel.custom.rules" :key="index" class="col-12 row q-col-gutter-sm items-center">
                <div class="col">
                    <WidgetEditorColumnsMultiselect :value="rule.target" :available-target-options="availableTargetOptions" :widget-columns-alias-map="widgetColumnsAliasMap" option-label="alias" option-value="id" :disabled="headersCustomDisabled" @change="onColumnsSelected($event, rule)" />
                </div>
                <div class="col-auto">
                    <q-select v-model="rule.action" :options="translatedActionOptions" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.headers.action')" outlined dense :disable="headersCustomDisabled" style="min-width: 140px" @update:model-value="onHeadersRuleActionChanged(rule)" />
                </div>
                <template v-if="rule.action === 'setLabel'">
                    <div class="col-auto">
                        <q-select v-model="rule.compareType" :options="translatedCompareValueTypes" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.compareValueType')" outlined dense :disable="headersCustomDisabled" style="min-width: 120px" @update:model-value="onCompareValueTypeChanged(rule)" />
                    </div>
                    <div class="col-auto">
                        <q-input v-if="rule.compareType === 'static'" v-model="rule.value" :label="$t('common.value')" outlined dense :disable="headersCustomDisabled" style="min-width: 120px" @change="headersConfigurationChanged" />
                        <q-select v-else-if="rule.compareType === 'variable'" v-model="rule.variable" :options="variables" option-value="name" option-label="name" emit-value map-options :label="$t('common.variable')" outlined dense :disable="headersCustomDisabled" style="min-width: 120px" @update:model-value="onVariableChanged(rule)" />
                        <q-select v-else-if="rule.compareType === 'parameter'" v-model="rule.parameter" :options="drivers" option-value="name" option-label="name" emit-value map-options :label="$t('common.parameter')" outlined dense :disable="headersCustomDisabled" style="min-width: 120px" @update:model-value="onDriverChanged(rule)" />
                    </div>
                    <div v-if="rule.compareType === 'variable' && rule.variablePivotDatasetOptions" class="col-auto">
                        <q-select v-model="rule.variableKey" :options="Object.keys(rule.variablePivotDatasetOptions)" :label="$t('common.key')" outlined dense :disable="headersCustomDisabled" style="min-width: 120px" @update:model-value="onVariableKeyChanged(rule)" />
                    </div>
                </template>
                <div class="col-auto">
                    <q-btn flat round dense :icon="index === 0 ? 'add_circle_outline' : 'delete'" size="sm" :disable="headersCustomDisabled" @click="index === 0 ? addHeadersRule() : removeHeadersRule(index)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetHeaders, ITableWidgetHeadersRule, IWidgetColumn, IVariable, IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { getSelectedVariable } from '@/modules/documentExecution/dashboard/generalSettings/VariablesHelper'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import WidgetEditorColumnsMultiselect from '../../common/WidgetEditorColumnsMultiselect.vue'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'table-widget-headers',
    components: { WidgetEditorColumnsMultiselect },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dashboardId: { type: String, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    data() {
        return {
            descriptor,
            headersModel: null as ITableWidgetHeaders | null,
            availableTargetOptions: [] as (IWidgetColumn | { id: string; alias: string })[],
            widgetColumnsAliasMap: {} as any,
            parameterValuesMap: {},
            variableValuesMap: {},
            drivers: [] as IDashboardDriver[],
            getTranslatedLabel
        }
    },
    computed: {
        headersDisabled() {
            return !this.headersModel || !this.headersModel.enabled
        },
        headersCustomDisabled() {
            return !this.headersModel || !this.headersModel.custom.enabled
        },
        translatedActionOptions(): { value: string; label: string }[] {
            return this.descriptor.customHeadersActionOptions.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        },
        translatedCompareValueTypes(): { value: string; label: string }[] {
            return this.descriptor.headersCompareValueType.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        }
    },
    created() {
        this.setEventListeners()
        this.loadDrivers()
        this.loadTargetOptions()
        this.loadHeadersModel()
        this.loadWidgetColumnAliasMap()
        this.loadParameterValuesMap()
        this.loadVariableValuesMap()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        setEventListeners() {
            emitter.on('headersColumnRemoved', this.onHeadersColumnRemoved)
            emitter.on('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.on('columnAdded', this.onColumnAdded)
        },
        removeEventListeners() {
            emitter.off('headersColumnRemoved', this.onHeadersColumnRemoved)
            emitter.off('columnAliasRenamed', this.onColumnAliasRenamed)
            emitter.off('columnAdded', this.onColumnAdded)
        },
        loadDrivers() {
            this.drivers = this.getDashboardDrivers(this.dashboardId)
        },
        onHeadersColumnRemoved() {
            this.onColumnRemoved()
        },
        onColumnAliasRenamed(column: any) {
            this.updateColumnAliases(column)
        },
        onColumnAdded(column: any) {
            this.addColumnAsOption(column)
        },
        loadTargetOptions() {
            this.availableTargetOptions = [...this.widgetModel.columns]
        },
        loadHeadersModel() {
            if (this.widgetModel?.settings?.configuration) {
                this.headersModel = this.widgetModel.settings.configuration.headers
                this.headersModel?.custom.rules.forEach((headerRule: ITableWidgetHeadersRule) => {
                    if (headerRule.compareType === 'variable' && headerRule.variableKey) this.setVisibilityConditionPivotedValues(headerRule)
                })
            }
            this.removeColumnsFromTargetOptions()
        },
        setVisibilityConditionPivotedValues(headerRule: ITableWidgetHeadersRule) {
            const index = this.variables.findIndex((variable: IVariable) => variable.name === headerRule.variable)
            if (index !== -1) headerRule.variablePivotDatasetOptions = this.variables[index].pivotedValues
        },
        removeColumnsFromTargetOptions() {
            if (!this.headersModel) return
            for (let i = 0; i < this.headersModel.custom.rules.length; i++) {
                for (let j = 0; j < this.headersModel.custom.rules[i].target.length; j++) {
                    this.removeColumnFromAvailableTargetOptions({
                        id: this.headersModel.custom.rules[i].target[j],
                        alias: this.widgetColumnsAliasMap[this.headersModel.custom.rules[i].target[j]]
                    })
                }
            }
        },
        removeColumnFromAvailableTargetOptions(tempColumn: IWidgetColumn | { id: string; alias: string }) {
            const index = this.availableTargetOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === tempColumn.id)
            if (index !== -1) this.availableTargetOptions.splice(index, 1)
        },
        loadWidgetColumnAliasMap() {
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                if (column.id) this.widgetColumnsAliasMap[column.id] = column.alias
            })
        },
        loadParameterValuesMap() {
            if (!this.drivers) return
            this.drivers.forEach((driver: any) => (this.parameterValuesMap[driver.name] = driver.value))
        },
        loadVariableValuesMap() {
            if (!this.variables) return
            this.variables.forEach((variables: any) => (this.variableValuesMap[variables.name] = variables.value))
        },
        onDriverChanged(rule: ITableWidgetHeadersRule) {
            const temp = rule.parameter
            if (temp) rule.value = this.parameterValuesMap[temp]
            this.headersConfigurationChanged()
        },
        onVariableChanged(rule: ITableWidgetHeadersRule) {
            const temp = rule.variable
            if (temp) {
                const variable = getSelectedVariable(temp, this.variables)
                if (variable && variable.dataset && !variable.column) {
                    rule.variablePivotDatasetOptions = variable.pivotedValues ?? {}
                    rule.value = ''
                } else {
                    rule.value = this.variableValuesMap[temp]
                    delete rule.variablePivotDatasetOptions
                }
                delete rule.variableKey
            }
            this.headersConfigurationChanged()
        },
        onVariableKeyChanged(rule: ITableWidgetHeadersRule) {
            rule.value = rule.variableKey ? rule.variablePivotDatasetOptions[rule.variableKey] : ''
            this.headersConfigurationChanged()
        },
        headersConfigurationChanged() {
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onHeadersRuleActionChanged(rule: ITableWidgetHeadersRule) {
            if (rule.action === 'hide') {
                delete rule.value
            }
            this.headersConfigurationChanged()
        },
        onCustomHeadersEnabledChange() {
            if (!this.headersModel) return
            if (this.headersModel.custom.enabled && this.headersModel.custom.rules.length === 0) {
                this.headersModel.custom.rules.push({ target: [], action: '' })
            }
            this.headersConfigurationChanged()
        },
        onCompareValueTypeChanged(rule: ITableWidgetHeadersRule) {
            rule.value = ''
            let fields = [] as string[]
            switch (rule.compareType) {
                case 'static':
                    fields = ['parameter', 'variable', 'variableKey', 'variablePivotDatasetOptions']
                    break
                case 'parameter':
                    fields = ['variable', 'variableKey', 'variablePivotDatasetOptions']
                    break
                case 'variable':
                    fields = ['parameter']
            }
            fields.forEach((field: string) => delete rule[field])
            this.headersConfigurationChanged()
        },
        onColumnsSelected(event: any, rule: ITableWidgetHeadersRule) {
            const intersection = rule.target.filter((el: string) => !event.value.includes(el))
            rule.target = event.value
            intersection.length > 0 ? this.onColumnsRemovedFromMultiselect(intersection) : this.onColumnsAddedFromMultiselect(rule)
            this.headersConfigurationChanged()
        },
        onColumnsRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) =>
                this.availableTargetOptions.push({
                    id: el,
                    alias: this.widgetColumnsAliasMap[el]
                })
            )
        },
        onColumnsAddedFromMultiselect(rule: ITableWidgetHeadersRule) {
            rule.target.forEach((target: string) => {
                const index = this.availableTargetOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === target)
                if (index !== -1) this.availableTargetOptions.splice(index, 1)
            })
        },
        addHeadersRule() {
            if (!this.headersModel || this.headersCustomDisabled) return
            this.headersModel.custom.rules.push({ target: [], action: '' })
            this.headersConfigurationChanged()
        },
        removeHeadersRule(index: number) {
            if (!this.headersModel || this.headersCustomDisabled) return
            this.headersModel.custom.rules[index].target.forEach((target: string) =>
                this.availableTargetOptions.push({
                    id: target,
                    alias: this.widgetColumnsAliasMap[target]
                })
            )
            this.headersModel.custom.rules.splice(index, 1)
            this.headersConfigurationChanged()
        },
        onColumnRemoved() {
            this.loadHeadersModel()
            this.loadTargetOptions()
            this.headersConfigurationChanged()
        },
        updateColumnAliases(column: IWidgetColumn) {
            if (!this.headersModel) return
            if (column.id && this.widgetColumnsAliasMap[column.id]) this.widgetColumnsAliasMap[column.id] = column.alias

            const index = this.availableTargetOptions.findIndex((targetOption: IWidgetColumn | { id: string; alias: string }) => targetOption.id === column.id)
            if (index !== -1) this.availableTargetOptions[index].alias = column.alias
            this.headersConfigurationChanged()
        },
        addColumnAsOption(column: IWidgetColumn) {
            this.availableTargetOptions.push(column)
            if (column.id) this.widgetColumnsAliasMap[column.id] = column.alias
        }
    }
})
</script>

<style scoped>
.widget-editor-disabled {
    opacity: 0.5;
    pointer-events: none;
}
</style>
