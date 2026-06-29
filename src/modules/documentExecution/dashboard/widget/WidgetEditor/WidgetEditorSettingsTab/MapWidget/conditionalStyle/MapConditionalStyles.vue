<template>
    <div v-if="conditionalStylesModel">
        <q-banner v-if="areNonConsistentConditionalStylesPresent" class="q-ma-sm bg-warning text-white" rounded dense>{{ $t('dashboard.widgetEditor.map.conditionalStylesNonConsistentWarning') }}</q-banner>
        <div class="q-px-md q-pb-sm">
            <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === 0 }" @drop.stop="onDropAtIndex($event, 0)" @dragover.prevent @dragenter.prevent="activeDropzone = 0" @dragleave.prevent="activeDropzone = -1"></div>
            <div v-for="(conditionalStyle, index) in conditionalStylesModel.conditions" :key="index">
                <div class="condition-row row no-wrap" :draggable="!conditionalStylesDisabled" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                    <div class="kn-drag-handle row items-center justify-center">
                        <q-icon name="drag_indicator" size="xs" />
                    </div>
                    <div class="col q-pa-sm">
                        <div class="row q-col-gutter-sm q-mb-sm">
                            <div class="col-6">
                                <q-select outlined dense v-model="conditionalStyle.label" :options="visualizationTypeOptions" option-value="label" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.visualizationType.title')" :disable="conditionalStylesDisabled" @update:model-value="onVisualizationChange(conditionalStyle)" />
                            </div>
                            <div class="col-6">
                                <q-select outlined dense v-model="conditionalStyle.targetColumn" :options="getColumnOptionsFromLayer(conditionalStyle)" option-label="name" option-value="name" emit-value map-options :label="$t('common.column')" :disable="conditionalStylesDisabled">
                                    <template #append>
                                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                            <q-tooltip>{{ $t('dashboard.widgetEditor.map.conditionalStylesColumnHint') }}</q-tooltip>
                                        </q-icon>
                                    </template>
                                </q-select>
                            </div>
                        </div>
                        <div class="row q-col-gutter-sm q-mb-sm items-end">
                            <div class="col-3">
                                <q-select outlined dense v-model="conditionalStyle.condition.operator" :options="descriptor.columnConditionOptions" option-label="label" option-value="value" emit-value map-options :label="$t('common.operator')" :disable="conditionalStylesDisabled" />
                            </div>
                            <div class="col-3">
                                <q-select outlined dense v-model="conditionalStyle.condition.type" :options="descriptor.conditionCompareValueTypes" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.conditions.compareValueType')" :disable="conditionalStylesDisabled" @update:model-value="onCompareValueTypeChanged(conditionalStyle)">
                                    <template #selected-item="slotProps">
                                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.conditionCompareValueTypes, $t) }}</span>
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
                            <div v-if="conditionalStyle.condition.type === 'static'" class="col">
                                <q-input outlined dense v-model="conditionalStyle.condition.value" :label="$t('common.value')" :disable="conditionalStylesDisabled" />
                            </div>
                            <div v-else-if="conditionalStyle.condition.type === 'parameter'" class="col">
                                <q-select outlined dense v-model="conditionalStyle.condition.parameter" :options="drivers" option-label="name" option-value="urlName" emit-value map-options :label="$t('common.value')" :disable="conditionalStylesDisabled" @update:model-value="onDriverChanged(conditionalStyle)" />
                            </div>
                            <div v-else-if="conditionalStyle.condition.type === 'variable'" class="col">
                                <q-select outlined dense v-model="conditionalStyle.condition.variable" :options="variables" option-label="name" option-value="name" emit-value map-options :label="$t('common.value')" :disable="conditionalStylesDisabled" @update:model-value="onVariableChanged(conditionalStyle)" />
                            </div>
                            <div v-if="conditionalStyle.condition.type === 'variable' && conditionalStyle.condition.variablePivotDatasetOptions" class="col">
                                <q-select outlined dense v-model="conditionalStyle.condition.variableKey" :options="conditionalStyle.condition.variablePivotDatasetOptions ? Object.keys(conditionalStyle.condition.variablePivotDatasetOptions) : []" :label="$t('common.key')" :disable="conditionalStylesDisabled" @update:model-value="onVariableKeyChanged(conditionalStyle)" />
                            </div>
                            <div class="col-12">
                                <WidgetEditorStyleToolbar :options="descriptor.conditionsToolbarStyleOptions" :prop-model="conditionalStyle.properties" :disabled="conditionalStylesDisabled" @change="onStyleToolbarChange($event, conditionalStyle)"></WidgetEditorStyleToolbar>
                            </div>
                        </div>
                    </div>
                    <div class="kn-action-handle row items-center justify-center">
                        <q-btn v-if="index === 0" flat round dense icon="add" size="sm" :disable="conditionalStylesDisabled" @click="addConditionalStyle()" />
                        <q-btn v-else flat round dense icon="delete" size="sm" :disable="conditionalStylesDisabled" @click.stop="removeConditionalStyle(index)" />
                    </div>
                </div>
                <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === index + 1 }" @drop.stop="onDropAtIndex($event, index + 1)" @dragover.prevent @dragenter.prevent="activeDropzone = index + 1" @dragleave.prevent="activeDropzone = -1"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel, IVariable, IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetConditionalStyle, IMapWidgetConditionalStyles, IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { getSelectedVariable } from '@/modules/documentExecution/dashboard/generalSettings/VariablesHelper'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import descriptor from './MapConditionalStylesDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import appStore from '@/App.store'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'

export default defineComponent({
    name: 'map-conditional-styles',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, variables: { type: Array as PropType<IVariable[]>, required: true }, dashboardId: { type: String, required: true } },
    data() {
        return {
            descriptor,
            conditionalStylesModel: null as IMapWidgetConditionalStyles | null,
            parameterValuesMap: {},
            variableValuesMap: {},
            isDragging: false,
            activeDropzone: -1,
            drivers: [] as IDashboardDriver[],
            propertiesCache: new Map<string, { name: string; alias: string }[]>(),
            visualizationTypeOptions: [] as any[],
            areNonConsistentConditionalStylesPresent: false,
            getTranslatedLabel
        }
    },
    computed: {
        conditionalStylesDisabled() {
            return !this.conditionalStylesModel || !this.conditionalStylesModel.enabled
        },
        conflictsOnConditionalStyles() {
            if (!this.conditionalStylesModel) return false
            return this.checkForNonConsistentConditionalStyles()
        }
    },
    watch: {
        conditionalStylesDisabled() {
            this.onConditionalStylesEnabledChange()
        },
        conflictsOnConditionalStyles() {
            this.areNonConsistentConditionalStylesPresent = this.checkForNonConsistentConditionalStyles()
        }
    },
    async created() {
        this.loadDrivers()
        this.loadParameterValuesMap()
        this.loadVariableValuesMap()
        this.loadConditionalStyles()
        this.loadVisualizations()
        await this.loadPropertiesForConditionalStyles()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        loadDrivers() {
            this.drivers = this.getDashboardDrivers(this.dashboardId)
        },
        loadConditionalStyles() {
            if (this.widgetModel?.settings?.conditionalStyles) {
                this.conditionalStylesModel = this.widgetModel.settings.conditionalStyles
                this.conditionalStylesModel?.conditions.forEach((conditionalStyle: IMapWidgetConditionalStyle) => {
                    if (conditionalStyle.condition.type === 'variable' && conditionalStyle.condition.variableKey) this.setVisibilityConditionPivotedValues(conditionalStyle)
                })
            }
        },
        async loadPropertiesForConditionalStyles() {
            if (!this.conditionalStylesModel?.conditions) return
            if (this.visualizationTypeOptions.length > 0) this.visualizationTypeOptions.forEach((viz) => this.loadAvailableProperties(viz))
        },
        async loadAvailableProperties(visualization: IMapWidgetVisualizationType | null) {
            if (!visualization || !visualization.target) return
            // try to fetch properties for layer visualizations (no-op for datasets)
            const targetLayer = resolveLayerByTarget(this.widgetModel, visualization.target) as IMapWidgetLayer | null
            if (!targetLayer || targetLayer.type !== 'layer') return
            if ((this as any).propertiesCache?.has(visualization.target)) {
                visualization.properties = (this as any).propertiesCache.get(visualization.target)
                return
            }
            ;(this as any).setLoading?.(true)
            const rawProperties = await getPropertiesByLayerLabel(targetLayer.label, this.dashboardId)
            ;(this as any).setLoading?.(false)
            const properties = (rawProperties || []).map((p: any) => ({ property: String(p.property ?? p.name ?? p), name: String(p.property ?? p.name ?? p) }) as any)
            ;(this as any).propertiesCache?.set(targetLayer.layerId, properties)
            visualization.properties = properties
        },

        loadVisualizations() {
            this.visualizationTypeOptions = []
            if (!this.widgetModel?.settings?.visualizations) return
            this.widgetModel.settings.visualizations.forEach((visualization: any) => {
                this.visualizationTypeOptions.push(visualization)
            })
        },
        setVisibilityConditionPivotedValues(conditionalStyle: IMapWidgetConditionalStyle) {
            const index = this.variables.findIndex((variable: IVariable) => variable.name === conditionalStyle.condition.variable)
            if (index !== -1) conditionalStyle.condition.variablePivotDatasetOptions = this.variables[index].pivotedValues
        },
        loadParameterValuesMap() {
            if (!this.drivers) return
            this.drivers.forEach((driver: any) => (this.parameterValuesMap[driver.urlName] = driver.value))
        },
        loadVariableValuesMap() {
            if (!this.variables) return
            this.variables.forEach((variables: any) => (this.variableValuesMap[variables.name] = variables.value))
        },
        onConditionalStylesEnabledChange() {
            if (!this.conditionalStylesModel) return
            if (this.conditionalStylesModel.enabled && this.conditionalStylesModel.conditions.length === 0) {
                this.conditionalStylesModel.conditions.push(mapWidgetDefaultValues.getDefaultConditionalStyle())
            }
        },
        onCompareValueTypeChanged(conditionalStyle: IMapWidgetConditionalStyle) {
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
        },
        onDriverChanged(conditionalStyle: IMapWidgetConditionalStyle) {
            const temp = conditionalStyle.condition.parameter
            if (temp) conditionalStyle.condition.value = this.parameterValuesMap[temp]
        },
        onVariableChanged(conditionalStyle: IMapWidgetConditionalStyle) {
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
        },
        onVariableKeyChanged(conditionalStyle: IMapWidgetConditionalStyle) {
            conditionalStyle.condition.value = conditionalStyle.condition.variableKey ? conditionalStyle.condition.variablePivotDatasetOptions[conditionalStyle.condition.variableKey] : ''
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, conditionalStyle: IMapWidgetConditionalStyle) {
            conditionalStyle.properties['background-color'] = model['background-color'] ?? 'rgb(137, 158, 175)'
            conditionalStyle.properties['icon'] = model['icon'] ?? ''
            conditionalStyle.properties['border-color'] = model['border-color'] ?? 'rgba(0, 0, 0, 1)'
        },
        addConditionalStyle() {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.conditionalStylesModel.conditions.push(mapWidgetDefaultValues.getDefaultConditionalStyle())
        },
        removeConditionalStyle(index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.conditionalStylesModel.conditions.splice(index, 1)
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
            this.isDragging = false
            this.activeDropzone = -1
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            const sourceIndex = JSON.parse(event.dataTransfer.getData('text/plain'))
            if (sourceIndex === targetDropzoneIndex || sourceIndex === targetDropzoneIndex - 1) return
            const [removed] = this.conditionalStylesModel.conditions.splice(sourceIndex, 1)
            const insertAt = targetDropzoneIndex > sourceIndex ? targetDropzoneIndex - 1 : targetDropzoneIndex
            this.conditionalStylesModel.conditions.splice(insertAt, 0, removed)
        },
        getColumnOptionsFromLayer(conditionalStyle: IMapWidgetConditionalStyle) {
            if (!conditionalStyle) return []
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === conditionalStyle.label)
            const layer = viz?.target ? (resolveLayerByTarget(this.widgetModel, viz.target) as IMapWidgetLayer | null) : null
            const datasetLayer = viz?.targetDataset ? (resolveLayerByTarget(this.widgetModel, viz.targetDataset) as IMapWidgetLayer | null) : null

            if (datasetLayer) {
                let datasetColumns: { name: string; alias: string }[] = []
                if (datasetLayer.type === 'dataset') {
                    datasetColumns = datasetLayer.columns ?? []
                } else {
                    datasetColumns = this.propertiesCache.get(datasetLayer.layerId) ?? []
                }

                let layerColumns: { name: string; alias: string }[] = []
                if (layer) {
                    if (layer.type === 'dataset') {
                        layerColumns = layer.columns ?? []
                    } else {
                        layerColumns = this.propertiesCache.get(layer.layerId) ?? []
                    }
                }

                return [...new Map([...layerColumns, ...datasetColumns].map((item) => [item['name'], item])).values()]
            }
            if (!layer) return []
            if (layer.type === 'dataset') return layer.columns ?? []
            return this.propertiesCache.get(layer.layerId) ?? []
        },
        async onVisualizationChange(conditionalStyle: IMapWidgetConditionalStyle) {
            conditionalStyle.targetColumn = ''
            const target = this.widgetModel.layers.find((layer: IMapWidgetLayer) => conditionalStyle.targetLayer === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(conditionalStyle.targetLayer)) return
            await this.loadAvailablePropertiesInConditionalStylesSettingsForLayer(target)
        },
        async loadAvailablePropertiesInConditionalStylesSettingsForLayer(targetLayer: IMapWidgetLayer) {
            this.setLoading(true)
            const properties = await getPropertiesByLayerLabel(targetLayer.label, this.dashboardId)
            const formattedProperties = this.getPropertiesFormattedForDropdownOptions(properties)
            this.propertiesCache.set(targetLayer.layerId, formattedProperties)
            this.setLoading(false)
        },
        getPropertiesFormattedForDropdownOptions(properties: IMapWidgetLayerProperty[]) {
            return properties.map((property: IMapWidgetLayerProperty) => {
                return { name: property.property, alias: property.property }
            })
        },
        checkForNonConsistentConditionalStyles() {
            if (!this.conditionalStylesModel) return false
            const layersSet = [] as string[]
            this.conditionalStylesModel.conditions.forEach((conditionalStyle: IMapWidgetConditionalStyle) => {
                const layerColumnKey = `${conditionalStyle.label}-${conditionalStyle.targetColumn}`
                layersSet.push(layerColumnKey)
            })

            return layersSet.length !== new Set(layersSet).size
        }
    }
})
</script>

<style lang="scss" scoped>
.condition-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 2px;
}
</style>
