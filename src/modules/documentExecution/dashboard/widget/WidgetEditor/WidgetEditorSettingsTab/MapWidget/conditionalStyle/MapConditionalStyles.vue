<template>
    <div v-if="conditionalStylesModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div v-for="(conditionalStyle, index) in conditionalStylesModel.conditions" :key="index" class="dynamic-form-item p-grid p-col-12 p-ai-center p-pt-2">
            <div class="dynamic-form-item p-grid p-col-12 p-ai-center">
                <div v-show="dropzoneTopVisible[index]" class="p-col-12" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
                <div class="p-col-12 form-list-item-dropzone p-m-1" :class="{ 'form-list-item-dropzone-active': dropzoneTopVisible[index] }" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent="displayDropzone('top', index)" @dragleave.prevent="hideDropzone('top', index)"></div>

                <div class="p-col-12 p-grid p-p-0" :draggable="!conditionalStylesDisabled" @dragstart.stop="onDragStart($event, index)">
                    <div class="p-col-1 p-d-flex p-flex-column p-jc-center p-ai-center">
                        <i class="pi pi-th-large kn-cursor-pointer" :class="[conditionalStylesDisabled ? 'icon-disabled' : '']"></i>
                    </div>
                    <div class="p-col-10 p-d-flex p-flex-column">
                        <div class="p-d-flex p-flex-row">
                            <div class="p-d-flex p-flex-column kn-flex p-p-2">
                                <label class="kn-material-input-label">{{ $t('common.layer') }}</label>
                                <Dropdown v-model="conditionalStyle.targetLayer" class="kn-material-input" :options="widgetModel.layers" option-value="layerId" option-label="name" :disabled="conditionalStylesDisabled" @change="onLayerChange(conditionalStyle)"></Dropdown>
                            </div>
                            <div class="p-d-flex p-flex-column kn-flex p-p-2">
                                <label class="kn-material-input-label">{{ $t('common.column') }}</label>
                                <Dropdown v-model="conditionalStyle.targetColumn" class="kn-material-input" :options="getColumnOptionsFromLayer(conditionalStyle)" option-label="alias" option-value="name" :disabled="conditionalStylesDisabled"></Dropdown>
                                <small>{{ $t('dashboard.widgetEditor.map.conditionalStylesColumnHint') }}</small>
                            </div>
                        </div>
                        <div class="p-d-flex p-flex-row p-ai-center">
                            <div class="p-d-flex p-flex-column p-p-2 operator-dropdown-container kn-flex">
                                <label class="kn-material-input-label">{{ $t('common.operator') }}</label>
                                <Dropdown v-model="conditionalStyle.condition.operator" class="kn-material-input" :options="descriptor.columnConditionOptions" option-label="label" option-value="value" :disabled="conditionalStylesDisabled"></Dropdown>
                            </div>
                            <div class="p-d-flex p-flex-column p-p-2 kn-flex">
                                <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.conditions.compareValueType') }}</label>
                                <Dropdown v-model="conditionalStyle.condition.type" class="kn-material-input" :options="descriptor.conditionCompareValueTypes" option-value="value" :disabled="conditionalStylesDisabled" @change="onCompareValueTypeChanged(conditionalStyle)">
                                    <template #value="slotProps">
                                        <div>
                                            <span>{{ getTranslatedLabel(slotProps.value, descriptor.conditionCompareValueTypes, $t) }}</span>
                                        </div>
                                    </template>
                                    <template #option="slotProps">
                                        <div>
                                            <span>{{ $t(slotProps.option.label) }}</span>
                                        </div>
                                    </template>
                                </Dropdown>
                            </div>
                            <div v-if="conditionalStyle.condition.type === 'static'" class="p-d-flex p-flex-column kn-flex p-pl-1">
                                <label class="kn-material-input-label">{{ $t('common.value') }}</label>
                                <InputText v-model="conditionalStyle.condition.value" class="kn-material-input" :disabled="conditionalStylesDisabled" />
                            </div>
                            <div v-else-if="conditionalStyle.condition.type === 'parameter'" class="p-d-flex p-flex-column kn-flex p-pl-1">
                                <label class="kn-material-input-label">{{ $t('common.value') }}</label>
                                <Dropdown v-model="conditionalStyle.condition.parameter" class="kn-material-input" :options="drivers" option-label="name" option-value="urlName" :disabled="conditionalStylesDisabled" @change="onDriverChanged(conditionalStyle)"></Dropdown>
                            </div>
                            <div v-else-if="conditionalStyle.condition.type === 'variable'" class="p-d-flex p-flex-column kn-flex p-pl-1">
                                <label class="kn-material-input-label">{{ $t('common.value') }}</label>
                                <Dropdown v-model="conditionalStyle.condition.variable" class="kn-material-input" :options="variables" option-label="name" option-value="name" :disabled="conditionalStylesDisabled" @change="onVariableChanged(conditionalStyle)"></Dropdown>
                            </div>
                            <div v-if="conditionalStyle.condition.type === 'variable' && conditionalStyle.condition.variablePivotDatasetOptions" class="p-d-flex p-flex-column kn-flex">
                                <label class="kn-material-input-label p-mr-2">{{ $t('common.key') }}</label>
                                <Dropdown v-model="conditionalStyle.condition.variableKey" class="kn-material-input" :options="conditionalStyle.condition.variablePivotDatasetOptions ? Object.keys(conditionalStyle.condition.variablePivotDatasetOptions) : []" :disabled="conditionalStylesDisabled" @change="onVariableKeyChanged(conditionalStyle)"></Dropdown>
                            </div>
                            <div class="icon-style-container p-pl-2 p-mt-4">
                                <WidgetEditorStyleToolbar :options="descriptor.conditionsToolbarStyleOptions" :prop-model="conditionalStyle.properties" :disabled="conditionalStylesDisabled" @change="onStyleToolbarChange($event, conditionalStyle)"></WidgetEditorStyleToolbar>
                            </div>
                        </div>
                    </div>

                    <div class="p-col-1 p-grid p-jc-center p-ai-center">
                        <i :class="[index === 0 ? 'pi pi-plus-circle' : 'pi pi-trash', conditionalStylesDisabled ? 'icon-disabled' : '']" class="kn-cursor-pointer p-ml-2" @click="index === 0 ? addConditionalStyle() : removeConditionalStyle(index)"></i>
                    </div>
                </div>

                <div class="p-col-12 form-list-item-dropzone p-m-1" :class="{ 'form-list-item-dropzone-active': dropzoneBottomVisible[index] }" @drop.stop="onDropComplete($event, 'after', index)" @dragover.prevent @dragenter.prevent="displayDropzone('bottom', index)" @dragleave.prevent="hideDropzone('bottom', index)"></div>
                <div v-show="dropzoneBottomVisible[index]" class="p-col-12" @drop.stop="onDropComplete($event, 'after', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel, IVariable, IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetConditionalStyle, IMapWidgetConditionalStyles, IMapWidgetLayer, IMapWidgetLayerProperty } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { getSelectedVariable } from '@/modules/documentExecution/dashboard/generalSettings/VariablesHelper'
import { mapActions } from 'pinia'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import descriptor from './MapConditionalStylesDescriptor.json'
import Dropdown from 'primevue/dropdown'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import appStore from '@/App.store'

export default defineComponent({
    name: 'map-conditional-styles',
    components: { Dropdown, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, variables: { type: Array as PropType<IVariable[]>, required: true }, dashboardId: { type: String, required: true } },
    data() {
        return {
            descriptor,
            conditionalStylesModel: null as IMapWidgetConditionalStyles | null,
            parameterValuesMap: {},
            variableValuesMap: {},
            dropzoneTopVisible: {},
            dropzoneBottomVisible: {},
            drivers: [] as IDashboardDriver[],
            propertiesCache: new Map<string, { name: string; alias: string }[]>(),
            getTranslatedLabel
        }
    },
    computed: {
        conditionalStylesDisabled() {
            return !this.conditionalStylesModel || !this.conditionalStylesModel.enabled
        }
    },
    watch: {
        conditionalStylesDisabled() {
            this.onConditionalStylesEnabledChange()
        }
    },
    async created() {
        this.loadDrivers()
        this.loadParameterValuesMap()
        this.loadVariableValuesMap()
        this.loadConditionalStyles()
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
            await Promise.all(this.conditionalStylesModel.conditions.map((conditionalStyle: IMapWidgetConditionalStyle) => this.loadAvailableProperties(conditionalStyle)))
        },
        async loadAvailableProperties(conditionalStyle: IMapWidgetConditionalStyle | null) {
            if (!conditionalStyle) return

            const targetLayer = this.widgetModel.layers.find((tempLayer: IMapWidgetLayer) => tempLayer.layerId === conditionalStyle.targetLayer)
            if (targetLayer?.type === 'layer') await this.loadAvailablePropertiesInConditionalStylesSettingsForLayer(targetLayer)
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
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropComplete(event: any, position: 'before' | 'after', index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            this.hideDropzone('bottom', index)
            this.hideDropzone('top', index)
            const eventData = JSON.parse(event.dataTransfer.getData('text/plain'))
            this.onRowsMove(eventData, index, position)
        },
        onRowsMove(sourceRowIndex: number, targetRowIndex: number, position: string) {
            if (sourceRowIndex === targetRowIndex) return
            if (this.conditionalStylesModel) {
                const newIndex = sourceRowIndex > targetRowIndex && position === 'after' ? targetRowIndex + 1 : targetRowIndex
                this.conditionalStylesModel.conditions.splice(newIndex, 0, this.conditionalStylesModel.conditions.splice(sourceRowIndex, 1)[0])
            }
        },
        displayDropzone(position: string, index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            position === 'top' ? (this.dropzoneTopVisible[index] = true) : (this.dropzoneBottomVisible[index] = true)
        },
        hideDropzone(position: string, index: number) {
            if (!this.conditionalStylesModel || this.conditionalStylesDisabled) return
            position === 'top' ? (this.dropzoneTopVisible[index] = false) : (this.dropzoneBottomVisible[index] = false)
        },
        getColumnOptionsFromLayer(conditionalStyle: IMapWidgetConditionalStyle) {
            const layer = this.widgetModel.layers.find((layer: any) => layer.layerId === conditionalStyle.targetLayer)
            if (!layer) return []
            else if (layer.type === 'dataset') return layer.columns
            else return this.propertiesCache.get(layer.layerId) ?? []
        },
        async onLayerChange(conditionalStyle: IMapWidgetConditionalStyle) {
            conditionalStyle.targetColumn = ''
            const target = this.widgetModel.layers.find((layer: IMapWidgetLayer) => conditionalStyle.targetLayer === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(conditionalStyle.targetLayer)) return
            await this.loadAvailablePropertiesInConditionalStylesSettingsForLayer(target)
        },
        async loadAvailablePropertiesInConditionalStylesSettingsForLayer(targetLayer: IMapWidgetLayer) {
            this.setLoading(true)
            const properties = await getPropertiesByLayerLabel(targetLayer.label)
            const formattedProperties = this.getPropertiesFormattedForDropdownOptions(properties)
            this.propertiesCache.set(targetLayer.layerId, formattedProperties)
            this.setLoading(false)
        },
        getPropertiesFormattedForDropdownOptions(properties: IMapWidgetLayerProperty[]) {
            return properties.map((property: IMapWidgetLayerProperty) => {
                return { name: property.property, alias: property.property }
            })
        }
    }
})
</script>

<style lang="scss" scoped>
.operator-dropdown-container {
    min-width: 50px;
    max-width: 100px;
}

.form-list-item-dropzone {
    height: 20px;
    width: 100%;
    background-color: white;
    opacity: 0;
    visibility: visible;
    transition: opacity 0.2s, visibility 0.2s;
}

.form-list-item-dropzone-active {
    opacity: 1;
    visibility: visible;
    background-color: #aec1d3;
}

.icon-style-container {
    min-width: 150px;
    max-width: 150px;
}
</style>
