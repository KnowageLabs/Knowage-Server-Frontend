<template>
    <div v-if="conditionalStylesModel" class="q-px-md">
        <!-- Add button -->
        <div class="items-center justify-between row">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.conditions.addCondition') }}</span>
            <q-btn flat round dense color="primary" icon="add" :disable="conditionalStylesDisabled" @click="addConditionalStyle" />
        </div>

        <!-- Dropzone before first item -->
        <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === 0 }" @drop.stop="onDropAtIndex($event, 0)" @dragover.prevent @dragenter.prevent="activeDropzone = 0" @dragleave.prevent="activeDropzone = -1"></div>

        <div v-for="(conditionalStyle, index) in conditionalStylesModel.conditions" :key="index">
            <div class="condition-row row no-wrap" :draggable="!conditionalStylesDisabled" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                <!-- Drag handle -->
                <div class="kn-drag-handle row items-center justify-center" :class="{ 'kn-drag-handle-disabled': conditionalStylesDisabled }">
                    <q-icon name="drag_indicator" size="xs" />
                </div>

                <!-- Card content -->
                <div class="col q-pa-sm">
                    <!-- Single row: all condition fields -->
                    <div class="row items-center no-wrap q-col-gutter-sm q-mb-sm">
                        <!-- Target column -->
                        <div class="col-4">
                            <q-select v-model="conditionalStyle.target" :options="widgetModel.columns" option-label="alias" option-value="id" emit-value map-options :label="$t('common.column')" outlined dense :disable="conditionalStylesDisabled" @update:model-value="conditionalStylesChanged" />
                        </div>
                        <!-- Formula toggle -->
                        <div class="col-auto">
                            <q-btn flat round dense :disable="conditionalStylesDisabled" @click="onFormulaIconClicked(conditionalStyle)">
                                <i class="fa fa-code" :class="conditionalStyle.condition.formula || conditionalStyle.condition.formula === '' ? 'text-primary' : 'text-grey-6'"></i>
                                <q-tooltip>{{ $t('dashboard.widgetEditor.conditions.useAdvancedFormula') }}</q-tooltip>
                            </q-btn>
                        </div>
                        <!-- Formula input (replaces condition fields when active) -->
                        <template v-if="conditionalStyle.condition.formula || conditionalStyle.condition.formula === ''">
                            <div class="col-grow">
                                <q-input v-model="conditionalStyle.condition.formula" :label="$t('common.formula')" :placeholder="$t('dashboard.widgetEditor.conditions.formulaHint')" outlined dense :disable="conditionalStylesDisabled" @change="conditionalStylesChanged" />
                            </div>
                        </template>
                        <!-- Standard condition fields -->
                        <template v-else>
                            <div class="col-2">
                                <q-select v-model="conditionalStyle.condition.operator" :options="descriptor.columnConditionOptions" option-label="label" option-value="value" emit-value map-options :label="$t('common.operator')" outlined dense :disable="conditionalStylesDisabled" @update:model-value="conditionalStylesChanged" />
                            </div>
                            <div class="col-3">
                                <q-select v-model="conditionalStyle.condition.type" :options="translatedCompareValueTypes" option-label="label" option-value="value" emit-value map-options :label="$t('dashboard.widgetEditor.conditions.compareValueType')" outlined dense :disable="conditionalStylesDisabled" @update:model-value="onCompareValueTypeChanged(conditionalStyle)" />
                            </div>
                            <div v-if="conditionalStyle.condition.type === 'static'" class="col">
                                <q-input v-model="conditionalStyle.condition.value" :label="$t('common.value')" outlined dense :disable="conditionalStylesDisabled" @change="conditionalStylesChanged" />
                            </div>
                            <div v-else-if="conditionalStyle.condition.type === 'parameter'" class="col">
                                <q-select v-model="conditionalStyle.condition.parameter" :options="drivers" option-label="name" option-value="name" emit-value map-options :label="$t('common.value')" outlined dense :disable="conditionalStylesDisabled" @update:model-value="onDriverChanged(conditionalStyle)" />
                            </div>
                            <template v-else-if="conditionalStyle.condition.type === 'variable'">
                                <div class="col">
                                    <q-select v-model="conditionalStyle.condition.variable" :options="variables" option-label="name" option-value="name" emit-value map-options :label="$t('common.value')" outlined dense :disable="conditionalStylesDisabled" @update:model-value="onVariableChanged(conditionalStyle)" />
                                </div>
                                <div v-if="conditionalStyle.condition.variablePivotDatasetOptions" class="col">
                                    <q-select v-model="conditionalStyle.condition.variableKey" :options="Object.keys(conditionalStyle.condition.variablePivotDatasetOptions)" :label="$t('common.key')" outlined dense :disable="conditionalStylesDisabled" @update:model-value="onVariableKeyChanged(conditionalStyle)" />
                                </div>
                            </template>
                        </template>
                    </div>

                    <!-- Style toolbar -->
                    <WidgetEditorStyleToolbar :options="descriptor.conditionsToolbarStyleOptions" :prop-model="conditionalStyle.properties" :disabled="conditionalStylesDisabled" @change="onStyleToolbarChange($event, conditionalStyle)" />
                    <!-- Apply to whole row toggle -->
                    <div class="col-auto q-mt-sm">
                        <q-toggle v-model="conditionalStyle.applyToWholeRow" :label="$t('dashboard.widgetEditor.conditions.applyToWholeRow')" dense :disable="conditionalStylesDisabled" @update:model-value="conditionalStylesChanged" />
                    </div>
                </div>

                <!-- Delete handle -->
                <div class="kn-action-handle row items-center justify-center" :class="{ 'kn-action-handle-disabled': conditionalStylesDisabled }">
                    <q-btn flat round dense icon="delete" size="sm" :disable="conditionalStylesDisabled" @click.stop="removeConditionalStyle(index)" />
                </div>
            </div>

            <!-- Dropzone after item -->
            <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === index + 1 }" @drop.stop="onDropAtIndex($event, index + 1)" @dragover.prevent @dragenter.prevent="activeDropzone = index + 1" @dragleave.prevent="activeDropzone = -1"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetConditionalStyle, IWidgetStyleToolbarModel, ITableWidgetConditionalStyles, IVariable, IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { getDefaultConditionalStyle } from '../../../helpers/tableWidget/TableWidgetDefaultValues'
import { getSelectedVariable } from '@/modules/documentExecution/dashboard/generalSettings/VariablesHelper'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'table-widget-conditions',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, variables: { type: Array as PropType<IVariable[]>, required: true }, dashboardId: { type: String, required: true } },
    data() {
        return {
            descriptor,
            conditionalStylesModel: null as ITableWidgetConditionalStyles | null,
            parameterValuesMap: {},
            variableValuesMap: {},
            isDragging: false,
            activeDropzone: -1,
            drivers: [] as IDashboardDriver[]
        }
    },
    computed: {
        conditionalStylesDisabled() {
            return !this.conditionalStylesModel || !this.conditionalStylesModel.enabled
        },
        translatedCompareValueTypes(): { value: string; label: string }[] {
            return descriptor.conditionCompareValueTypes.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        }
    },
    watch: {
        conditionalStylesDisabled() {
            this.onConditionalStylesEnabledChange()
        }
    },
    created() {
        this.setEventListeners()
        this.loadDrivers()
        this.loadParameterValuesMap()
        this.loadVariableValuesMap()
        this.loadConditionalStyles()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        setEventListeners() {
            emitter.on('columnRemovedFromConditionalStyles', this.onColumnRemovedFromConditionalStyles)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromConditionalStyles', this.onColumnRemovedFromConditionalStyles)
        },

        loadDrivers() {
            this.drivers = this.getDashboardDrivers(this.dashboardId)
        },
        onColumnRemovedFromConditionalStyles() {
            this.onColumnRemoved()
        },
        loadConditionalStyles() {
            if (this.widgetModel?.settings?.conditionalStyles) {
                this.conditionalStylesModel = this.widgetModel.settings.conditionalStyles
                this.conditionalStylesModel?.conditions.forEach((conditionalStyle: ITableWidgetConditionalStyle) => {
                    if (conditionalStyle.condition.type === 'variable' && conditionalStyle.condition.variableKey) this.setVisibilityConditionPivotedValues(conditionalStyle)
                })
            }
        },
        setVisibilityConditionPivotedValues(conditionalStyle: ITableWidgetConditionalStyle) {
            const index = this.variables.findIndex((variable: IVariable) => variable.name === conditionalStyle.condition.variable)
            if (index !== -1) conditionalStyle.condition.variablePivotDatasetOptions = this.variables[index].pivotedValues
        },
        loadParameterValuesMap() {
            if (!this.drivers) return
            this.drivers.forEach((driver: any) => (this.parameterValuesMap[driver.name] = driver.value))
        },
        loadVariableValuesMap() {
            if (!this.variables) return
            this.variables.forEach((variables: any) => (this.variableValuesMap[variables.name] = variables.value))
        },
        conditionalStylesChanged() {
            emitter.emit('conditionalStylesChanged', this.conditionalStylesModel)
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onConditionalStylesEnabledChange() {
            if (!this.conditionalStylesModel) return
            if (this.conditionalStylesModel.enabled && this.conditionalStylesModel.conditions.length === 0) {
                this.conditionalStylesModel.conditions.push(getDefaultConditionalStyle())
            }
            this.conditionalStylesChanged()
        },
        onCompareValueTypeChanged(conditionalStyle: ITableWidgetConditionalStyle) {
            conditionalStyle.condition.value = ''
            let fields = [] as string[]
            switch (conditionalStyle.condition.type) {
                case 'static':
                    fields = ['parameter', 'variable', 'variableKey', 'variablePivotDatasetOptions']
                    break
                case 'parameter':
                    fields = ['variable', 'variableKey', 'variablePivotDatasetOptions']
                    break
                case 'variable':
                    fields = ['parameter']
            }
            fields.forEach((field: string) => delete conditionalStyle.condition[field])
            this.conditionalStylesChanged()
        },
        onDriverChanged(conditionalStyle: ITableWidgetConditionalStyle) {
            const temp = conditionalStyle.condition.parameter
            if (temp) conditionalStyle.condition.value = this.parameterValuesMap[temp]
            this.conditionalStylesChanged()
        },
        onVariableChanged(conditionalStyle: ITableWidgetConditionalStyle) {
            const temp = conditionalStyle.condition.variable
            if (temp) {
                const variable = getSelectedVariable(temp, this.variables)
                if (variable && variable.dataset && !variable.column) {
                    conditionalStyle.condition.variablePivotDatasetOptions = variable.pivotedValues ?? {}
                    conditionalStyle.condition.value = ''
                } else {
                    conditionalStyle.condition.value = this.variableValuesMap[temp]
                    delete conditionalStyle.condition.variablePivotDatasetOptions
                }
                delete conditionalStyle.condition.variableKey
            }
            this.conditionalStylesChanged()
        },
        onVariableKeyChanged(conditionalStyle: ITableWidgetConditionalStyle) {
            conditionalStyle.condition.value = conditionalStyle.condition.variableKey ? conditionalStyle.condition.variablePivotDatasetOptions[conditionalStyle.condition.variableKey] : ''
            this.conditionalStylesChanged()
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, conditionalStyle: ITableWidgetConditionalStyle) {
            conditionalStyle.properties = {
                'background-color': model['background-color'] ?? 'rgb(137, 158, 175)',
                color: model.color ?? 'rgb(255, 255, 255)',
                'justify-content': model['justify-content'] ?? 'center',
                'text-align': model['text-align'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-family': model['font-family'] ?? '',
                'font-style': model['font-style'] ?? 'normal',
                'font-weight': model['font-weight'] ?? '',
                icon: model.icon ?? ''
            }
            this.conditionalStylesChanged()
        },
        addConditionalStyle() {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.conditionalStylesModel.conditions.push({
                target: '',
                applyToWholeRow: false,
                condition: { type: '', operator: '', value: '' },
                properties: {
                    'justify-content': '',
                    'text-align': '',
                    'font-family': '',
                    'font-size': '',
                    'font-style': '',
                    'font-weight': '',
                    color: '',
                    'background-color': '',
                    icon: ''
                }
            })
        },
        removeConditionalStyle(index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.conditionalStylesModel.conditions.splice(index, 1)
            this.conditionalStylesChanged()
        },
        onDragStart(event: any, index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.isDragging = true
            this.activeDropzone = -1
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropAtIndex(event: any, targetDropzoneIndex: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.isDragging = false
            this.activeDropzone = -1
            const sourceIndex = JSON.parse(event.dataTransfer.getData('text/plain'))
            if (sourceIndex === targetDropzoneIndex || sourceIndex === targetDropzoneIndex - 1) return
            const items = this.conditionalStylesModel.conditions
            const [removed] = items.splice(sourceIndex, 1)
            const insertAt = targetDropzoneIndex > sourceIndex ? targetDropzoneIndex - 1 : targetDropzoneIndex
            items.splice(insertAt, 0, removed)
            this.conditionalStylesChanged()
        },
        onColumnRemoved() {
            this.loadConditionalStyles()
        },
        onFormulaIconClicked(conditionalStyle: ITableWidgetConditionalStyle) {
            if (this.conditionalStylesDisabled) return
            if (conditionalStyle.condition.formula || conditionalStyle.condition.formula === '') delete conditionalStyle.condition.formula
            else conditionalStyle.condition.formula = ''
        }
    }
})
</script>

<style lang="scss" scoped>
.condition-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
