<template>
    <div v-if="visibilityConditionsModel" class="q-px-md q-pb-md">
        <!-- Add button -->
        <div class="row items-center justify-between">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.visibilityConditions.addCondition') }}</span>
            <q-btn flat round dense color="primary" icon="add" :disable="visibilityConditionsDisabled" @click="addVisibilityCondition" />
        </div>

        <!-- Dropzone before first item -->
        <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === 0 }" @drop.stop="onDropAtIndex($event, 0)" @dragover.prevent @dragenter.prevent="activeDropzone = 0" @dragleave.prevent="activeDropzone = -1"></div>

        <div v-for="(visibilityCondition, index) in visibilityConditionsModel.conditions" :key="index">
            <!-- Condition card -->
            <div class="column-type-row row no-wrap" :draggable="!visibilityConditionsDisabled" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                <!-- Drag handle (full-height, shown on hover) -->
                <div class="kn-drag-handle row items-center justify-center" :class="visibilityConditionsDisabled ? 'kn-drag-handle-disabled' : ''">
                    <q-icon name="drag_indicator" size="xs" />
                </div>
                <!-- Card content -->
                <div class="col q-pa-sm">
                    <!-- Row 1: condition type | columns -->
                    <div class="row items-center q-gutter-x-xs q-mb-sm">
                        <div class="col">
                            <q-select v-model="visibilityCondition.condition.type" :options="translatedConditionOptions" option-value="value" option-label="label" emit-value map-options :label="$t('common.condition')" outlined dense :disable="visibilityConditionsDisabled" @update:model-value="onVisibilityConditionTypeChanged(visibilityCondition)" />
                        </div>
                        <div class="col">
                            <q-select v-model="visibilityCondition.target" :options="widgetModel.columns" option-label="alias" option-value="id" emit-value map-options multiple :label="$t('common.columns')" outlined dense :disable="visibilityConditionsDisabled" @update:model-value="visibilityConditionsChanged" />
                        </div>
                    </div>

                    <!-- Row 2: variable fields -->
                    <div v-if="visibilityCondition.condition.type === 'variable'" class="row q-col-gutter-sm q-mb-sm">
                        <div class="col-3">
                            <q-select v-model="visibilityCondition.condition.variable" :options="variables" option-value="name" option-label="name" emit-value map-options :label="$t('common.variable')" outlined dense :disable="visibilityConditionsDisabled" @update:model-value="onVariabeSelected(visibilityCondition)" />
                        </div>
                        <div v-if="visibilityCondition.condition.variablePivotDatasetOptions" class="col-3">
                            <q-select v-model="visibilityCondition.condition.variableKey" :options="Object.keys(visibilityCondition.condition.variablePivotDatasetOptions)" :label="$t('common.key')" outlined dense :disable="visibilityConditionsDisabled" @update:model-value="onVariableKeyChanged(visibilityCondition)" />
                        </div>
                        <div class="col-3">
                            <q-select v-model="visibilityCondition.condition.operator" :options="descriptor.visibilityConditionOperators" option-value="value" option-label="label" emit-value map-options :label="$t('common.operator')" outlined dense :disable="visibilityConditionsDisabled" @update:model-value="visibilityConditionsChanged" />
                        </div>
                        <div class="col-3">
                            <q-input v-model="visibilityCondition.condition.value" :label="$t('common.value')" outlined dense :disable="visibilityConditionsDisabled" @change="visibilityConditionsChanged" />
                        </div>
                    </div>

                    <!-- Row 3: hide toggles -->
                    <div class="row q-gutter-x-md">
                        <q-toggle v-model="visibilityCondition.hide" :label="$t('dashboard.widgetEditor.visibilityConditions.hideColumn')" dense :disable="visibilityConditionsDisabled" @update:model-value="visibilityConditionsChanged" />
                        <q-toggle v-model="visibilityCondition.hideFromSummary" :label="$t('dashboard.widgetEditor.visibilityConditions.hideFromSummary')" dense :disable="visibilityConditionsDisabled" @update:model-value="visibilityConditionsChanged" />
                        <q-toggle v-model="visibilityCondition.hidePdf" :label="$t('dashboard.widgetEditor.visibilityConditions.hideOnPdf')" dense :disable="visibilityConditionsDisabled" @update:model-value="visibilityConditionsChanged" />
                    </div>
                </div>
                <!-- Delete handle (full-height, shown on hover) -->
                <div class="kn-action-handle row items-center justify-center" :class="visibilityConditionsDisabled ? 'kn-action-handle-disabled' : ''">
                    <q-btn flat round dense icon="delete" size="sm" :disable="visibilityConditionsDisabled" @click.stop="removeVisibilityCondition(index)" />
                </div>
            </div>

            <!-- Dropzone after this item -->
            <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === index + 1 }" @drop.stop="onDropAtIndex($event, index + 1)" @dragover.prevent @dragenter.prevent="activeDropzone = index + 1" @dragleave.prevent="activeDropzone = -1"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn, ITableWidgetVisibilityCondition, ITableWidgetVisibilityConditions, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { getDefaultVisibilityCondition } from '../../../helpers/tableWidget/TableWidgetDefaultValues'
import descriptor from '../TableWidgetSettingsDescriptor.json'
import { getSelectedVariable } from '@/modules/documentExecution/dashboard/generalSettings/VariablesHelper'

export default defineComponent({
    name: 'table-widget-visibility-condition',
    components: {},
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    data() {
        return {
            descriptor,
            visibilityConditionsModel: null as ITableWidgetVisibilityConditions | null,
            widgetColumnsAliasMap: {} as any,
            variableMap: {} as any,
            isDragging: false,
            activeDropzone: -1
        }
    },
    computed: {
        visibilityConditionsDisabled() {
            return !this.visibilityConditionsModel || !this.visibilityConditionsModel.enabled
        },
        translatedConditionOptions(): { value: string; label: string }[] {
            return descriptor.visibilityConditionsOptions.map((opt: any) => ({ value: opt.value, label: this.$t(opt.label) }))
        }
    },
    watch: {
        visibilityConditionsDisabled() {
            this.onVisibilityConditionsEnabledChange()
        }
    },
    created() {
        this.setEventListeners()
        this.loadVisibilityConditions()
        this.variablesMap()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromVisibilityConditions', this.onColumnRemovedFromVisibilityConditions)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromVisibilityConditions', this.onColumnRemovedFromVisibilityConditions)
        },
        onColumnRemovedFromVisibilityConditions() {
            this.onColumnRemoved()
        },
        loadVisibilityConditions() {
            if (this.widgetModel.settings?.visualization?.visibilityConditions) {
                this.visibilityConditionsModel = this.widgetModel.settings.visualization.visibilityConditions
                this.visibilityConditionsModel?.conditions.forEach((visibilityCondition: ITableWidgetVisibilityCondition) => {
                    if (visibilityCondition.condition.type === 'variable' && visibilityCondition.condition.variableKey) this.setVisibilityConditionPivotedValues(visibilityCondition)
                })
            }
        },
        setVisibilityConditionPivotedValues(visibilityCondition: ITableWidgetVisibilityCondition) {
            const index = this.variables.findIndex((variable: IVariable) => variable.name === visibilityCondition.condition.variable)
            if (index !== -1) visibilityCondition.condition.variablePivotDatasetOptions = this.variables[index].pivotedValues
        },
        loadWidgetColumnMaps() {
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                if (column.id) this.widgetColumnsAliasMap[column.id] = column.alias
            })
        },
        variablesMap() {
            this.variables?.forEach((variable: any) => (this.variableMap[variable.name] = variable.value))
        },
        visibilityConditionsChanged() {
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onVisibilityConditionsEnabledChange() {
            if (!this.visibilityConditionsModel) return
            if (this.visibilityConditionsModel.enabled && this.visibilityConditionsModel.conditions.length === 0) {
                this.visibilityConditionsModel.conditions = [getDefaultVisibilityCondition()]
            }

            this.visibilityConditionsChanged()
        },
        onVisibilityConditionTypeChanged(visibilityCondition: ITableWidgetVisibilityCondition) {
            if (visibilityCondition.condition.type === 'always') {
                const fields = ['variable', 'variableValue', 'operator', 'value', 'variablePivotDatasetOptions']
                fields.forEach((field: string) => delete visibilityCondition.condition[field])
            }
            this.visibilityConditionsChanged()
        },
        onVariabeSelected(visibilityCondition: ITableWidgetVisibilityCondition) {
            if (visibilityCondition.condition.variable) {
                const variable = getSelectedVariable(visibilityCondition.condition.variable, this.variables)
                if (variable && variable.dataset && !variable.column) {
                    visibilityCondition.condition.variablePivotDatasetOptions = variable.pivotedValues ?? {}
                    visibilityCondition.condition.variableValue = ''
                } else {
                    visibilityCondition.condition.variableValue = this.variableMap[visibilityCondition.condition.variable] ?? ''
                    delete visibilityCondition.condition.variablePivotDatasetOptions
                }
                delete visibilityCondition.condition.variableKey
            }
            this.visibilityConditionsChanged()
        },
        onVariableKeyChanged(visibilityCondition: ITableWidgetVisibilityCondition) {
            visibilityCondition.condition.variableValue = visibilityCondition.condition.variableKey ? visibilityCondition.condition.variablePivotDatasetOptions[visibilityCondition.condition.variableKey] : ''
            this.visibilityConditionsChanged()
        },
        addVisibilityCondition() {
            if (!this.visibilityConditionsModel || this.visibilityConditionsDisabled) return
            this.visibilityConditionsModel.conditions.push({
                target: [],
                hide: false,
                hidePdf: false,
                hideFromSummary: false,
                condition: { type: 'Always' }
            })
        },
        removeVisibilityCondition(index: number) {
            if (!this.visibilityConditionsModel || this.visibilityConditionsDisabled) return
            this.visibilityConditionsModel.conditions.splice(index, 1)
            this.visibilityConditionsChanged()
        },
        onColumnRemoved() {
            this.loadVisibilityConditions()
            this.visibilityConditionsChanged()
        },
        onDragStart(event: any, index: number) {
            if (!this.visibilityConditionsModel || this.visibilityConditionsDisabled) return
            this.isDragging = true
            this.activeDropzone = -1
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropAtIndex(event: any, targetDropzoneIndex: number) {
            if (!this.visibilityConditionsModel || this.visibilityConditionsDisabled) return
            this.isDragging = false
            this.activeDropzone = -1
            const sourceIndex = JSON.parse(event.dataTransfer.getData('text/plain'))
            if (sourceIndex === targetDropzoneIndex || sourceIndex === targetDropzoneIndex - 1) return
            const items = this.visibilityConditionsModel.conditions
            const [removed] = items.splice(sourceIndex, 1)
            const insertAt = targetDropzoneIndex > sourceIndex ? targetDropzoneIndex - 1 : targetDropzoneIndex
            items.splice(insertAt, 0, removed)
            this.visibilityConditionsChanged()
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
