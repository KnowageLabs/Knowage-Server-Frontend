<template>
    <div v-if="dialogSettings" class="p-m-3">
        <WidgetEditorStyleToolbar class="p-my-3" :options="descriptor.toolbarStyleOptions" :prop-model="dialogSettings.style" :disabled="dialogSettingsDisabled" @change="onStyleToolbarChange"></WidgetEditorStyleToolbar>

        <Message class="kn-width-full p-d-flex p-jc-center p-m-0 p-mx-2" severity="info" :closable="false">
            {{ $t('dashboard.widgetEditor.map.dialogHint') }}
        </Message>

        <div v-for="(dialogProperty, index) in dialogSettings.layers" :key="index" class="dynamic-form-item p-grid p-col-12 p-ai-center p-m-0 p-pt-0">
            <div v-show="dropzoneTopVisible[index]" class="p-col-12 form-list-item-dropzone-active" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
            <div class="p-col-12 form-list-item-dropzone" :class="{ 'form-list-item-dropzone-active': dropzoneTopVisible[index] }" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent="displayDropzone('top', index)" @dragleave.prevent="hideDropzone('top', index)"></div>

            <div class="p-col-12 p-d-flex p-flex-column" :draggable="true" @dragstart.stop="onDragStart($event, index)">
                <div class="row items-center q-mb-sm">
                    <i class="pi pi-th-large kn-cursor-pointer"></i>
                    <q-select class="col-6" filled dense :model-value="dialogProperty.name" :disable="dialogSettingsDisabled" :options="getFilteredVisualizationTypeOptions(index)" option-label="label" option-value="target" emit-value map-options options-dense :label="$t('dashboard.widgetEditor.visualizationType.title')" @update:model-value="(val) => onVisualizationSelected(val, dialogProperty)"></q-select>
                    <MultiSelect class="col-5 q-ml-sm" v-model="dialogProperty.columns" :disabled="dialogSettingsDisabled" :options="getColumnOptionsFromLayer(dialogProperty)" option-label="alias" option-value="name" display="chip" />
                </div>
                <div class="q-col-gutter" style="gap: 0.5em; margin-left: auto">
                    <i v-if="index === 0" class="pi pi-plus-circle kn-cursor-pointer" data-test="new-button" @click="addDialog()"></i>
                    <i v-if="index !== 0" class="pi pi-trash kn-cursor-pointer" data-test="delete-button" @click="removeDialog(index)"></i>
                </div>
            </div>

            <div class="p-grid p-col-12 p-mt-2">
                <q-input dense class="p-col-4" filled v-model="dialogProperty.prefix" :label="$t('dashboard.widgetEditor.prefix')" :disable="dialogSettingsDisabled" />
                <q-input dense class="p-col-4" filled v-model="dialogProperty.suffix" :label="$t('dashboard.widgetEditor.suffix')" :disable="dialogSettingsDisabled" />
                <q-input dense class="p-col-4" type="number" filled v-model="dialogProperty.precision" :label="$t('dashboard.widgetEditor.precision')" :disable="dialogSettingsDisabled" />
            </div>

            <div class="p-col-12 form-list-item-dropzone" :class="{ 'form-list-item-dropzone-active': dropzoneBottomVisible[index] }" @drop.stop="onDropComplete($event, 'after', index)" @dragover.prevent @dragenter.prevent="displayDropzone('bottom', index)" @dragleave.prevent="hideDropzone('bottom', index)"></div>
            <div v-show="dropzoneBottomVisible[index]" class="p-col-12 form-list-item-dropzone-active" @drop.stop="onDropComplete($event, 'after', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapDialogSettings, IMapTooltipSettingsLayer, IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetSelection, IMapWidgetSelectionConfiguration, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { IMapDialogSettingsProperty } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import descriptor from './MapDialogSettingsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Message from 'primevue/message'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'

export default defineComponent({
    name: 'map-dialog-settings',
    components: { Dropdown, MultiSelect, Message, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            dialogSettings: null as IMapDialogSettings | null,
            dropzoneTopVisible: {},
            dropzoneBottomVisible: {},
            propertiesCache: new Map<string, { name: string; alias: string }[]>(),
            selectionConfiguration: null as IMapWidgetSelectionConfiguration | null,
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[]
        }
    },
    computed: {
        dialogSettingsDisabled() {
            return !this.widgetModel || !this.widgetModel.settings.dialog.enabled
        }
    },
    async mounted() {
        this.loadDialogSettings()
        await this.loadPropertiesForDialogSettings()
        // preload properties for visualizations targeting layers so they show up in visualization options
        if (this.widgetModel?.settings?.visualizations) {
            for (const viz of this.widgetModel.settings.visualizations) {
                const target = resolveLayerByTarget(this.widgetModel, viz.target)
                if (target && target.type === 'layer') {
                    await this.loadAvailablePropertiesForVisualization(viz)
                }
            }
            this.loadVisualizationTypeOptions()
        }
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadDialogSettings() {
            if (this.widgetModel?.settings?.dialog) this.dialogSettings = this.widgetModel.settings.dialog
            this.loadSelectionConfiguration()
        },
        async loadPropertiesForDialogSettings() {
            if (!this.dialogSettings?.layers) return
            await Promise.all(this.dialogSettings.layers.map((layer: IMapTooltipSettingsLayer) => this.loadAvailableProperties(layer)))
        },
        async loadAvailableProperties(layer: IMapTooltipSettingsLayer | null) {
            if (!layer) return
            // Take into account that `layer.name` may be a visualization target (visualization.target)
            const targetLayer = resolveLayerByTarget(this.widgetModel, layer.name) as IMapWidgetLayer | null
            if (targetLayer?.type === 'layer') await this.loadAvailablePropertiesInTooltipSettingsForLayer(targetLayer)
        },
        addDialog() {
            this.dialogSettings?.layers.push(mapWidgetDefaultValues.getDefaultDialogSettings().layers[0])
        },
        removeDialog(index: number) {
            if (!this.dialogSettings || !this.dialogSettings.layers) return
            if (index === 0) {
                this.dialogSettings.layers[0].name = ''
                this.dialogSettings.layers[0].columns = []
            } else {
                this.dialogSettings.layers.splice(index, 1)
            }
        },
        onDragStart(event: any, index: number) {
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropComplete(event: any, position: 'before' | 'after', index: number) {
            this.hideDropzone('bottom', index)
            this.hideDropzone('top', index)
            const eventData = JSON.parse(event.dataTransfer.getData('text/plain'))
            this.onRowsMove(eventData, index, position)
        },
        onRowsMove(sourceRowIndex: number, targetRowIndex: number, position: string) {
            if (sourceRowIndex === targetRowIndex) return
            const newIndex = sourceRowIndex > targetRowIndex && position === 'after' ? targetRowIndex + 1 : targetRowIndex
            this.dialogSettings?.layers.splice(newIndex, 0, this.dialogSettings.layers.splice(sourceRowIndex, 1)[0])
        },
        displayDropzone(position: string, index: number) {
            position === 'top' ? (this.dropzoneTopVisible[index] = true) : (this.dropzoneBottomVisible[index] = true)
        },
        hideDropzone(position: string, index: number) {
            position === 'top' ? (this.dropzoneTopVisible[index] = false) : (this.dropzoneBottomVisible[index] = false)
        },
        getColumnOptionsFromLayer(dialogProperty: IMapDialogSettingsProperty | null) {
            if (!dialogProperty) return []
            // dialogProperty.name holds a visualization target (layerId/visualization.target)
            const layer = resolveLayerByTarget(this.widgetModel, dialogProperty.name) as IMapWidgetLayer | null
            if (!layer) return []
            if (layer.type === 'dataset') return layer.columns ?? []
            // For layer targets prefer the visualization.properties that may have been preloaded
            return this.propertiesCache.get(layer.layerId) ?? []
        },
        async onLayerChange(dialogProperty: IMapDialogSettingsProperty) {
            dialogProperty.columns = []
            const target = this.widgetModel.layers.find((layer: IMapWidgetLayer) => dialogProperty.name === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(dialogProperty.name)) return
            await this.loadAvailablePropertiesInTooltipSettingsForLayer(target)
        },
        async loadAvailablePropertiesInTooltipSettingsForLayer(targetLayer: IMapWidgetLayer) {
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
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.dialogSettings) return
            const defaultDialogSettings = mapWidgetDefaultValues.getDefaultDialogSettings()
            this.dialogSettings.style['font-family'] = model['font-family'] ?? defaultDialogSettings.style['font-family']
            this.dialogSettings.style['font-style'] = model['font-style'] ?? defaultDialogSettings.style['font-style']
            this.dialogSettings.style['font-size'] = model['font-size'] ?? defaultDialogSettings.style['font-size']
            this.dialogSettings.style['font-weight'] = model['font-weight'] ?? defaultDialogSettings.style['font-weight']
            this.dialogSettings.style['justify-content'] = model['justify-content'] ?? defaultDialogSettings.style['justify-content']
            this.dialogSettings.style.color = model.color ?? defaultDialogSettings.style.color
            this.dialogSettings.style['background-color'] = model['background-color'] ?? defaultDialogSettings.style['background-color']
        },
        loadSelectionConfiguration() {
            // Ensure dialogSettings remains the widget dialog configuration
            if (this.widgetModel?.settings?.dialog) this.dialogSettings = this.widgetModel.settings.dialog

            // Load selections separately; keep existing structure unchanged
            this.selectionConfiguration = this.widgetModel?.settings?.interactions?.selection ?? null
            if (this.selectionConfiguration && this.selectionConfiguration.selections?.length === 0) this.selectionConfiguration.selections.push({ vizualizationType: null, column: '' } as IMapWidgetSelection)
            this.loadVisualizationTypeOptions()
        },
        loadVisualizationTypeOptions() {
            this.visualizationTypeOptions = []
            if (!this.widgetModel?.settings?.visualizations) return
            this.widgetModel.settings.visualizations.forEach((visualization: IMapWidgetVisualizationType) => {
                const mapLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => layer.layerId === visualization.target)
                if (!mapLayer) return
                if (mapLayer.type === 'dataset') {
                    this.visualizationTypeOptions.push(visualization)
                    return
                }
                if (mapLayer.type === 'layer' && visualization.properties && visualization.properties.length > 0) this.visualizationTypeOptions.push(visualization)
            })
        },

        async loadAvailablePropertiesForVisualization(visualization: IMapWidgetVisualizationType | null) {
            if (!visualization || !visualization.target) return
            // if already cached, assign and return
            if (this.propertiesCache.has(visualization.target)) {
                visualization.properties = this.propertiesCache.get(visualization.target) as any
                return
            }
            const targetLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => visualization.target === layer.layerId)
            if (!targetLayer || targetLayer.type !== 'layer') return
            this.setLoading(true)
            const raw = await getPropertiesByLayerLabel(targetLayer.label)
            this.setLoading(false)
            const formatted = raw.map((p: any) => ({ name: String(p.property ?? p.name ?? p), alias: String(p.property ?? p.name ?? p) }))
            this.propertiesCache.set(targetLayer.layerId, formatted)
            visualization.properties = formatted as any
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.dialogSettings) return this.visualizationTypeOptions

            // build a list of already-selected targets (layer ids) for other dialog entries
            const selectedTargets = this.dialogSettings.layers
                .map((layerConfig: any, index: number) => {
                    return index !== currentIndex ? layerConfig.name ?? null : null
                })
                .filter((t): t is string => !!t)

            // filter out visualization options whose target is already selected in dialog layers
            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => !selectedTargets.includes(vizualizationType.target))
        },
        onVizualizationTypeChange(selectionConfig: IMapWidgetSelection) {
            selectionConfig.column = ''
        },
        onVisualizationSelected(value: string | null, dialogProperty: IMapDialogSettingsProperty | null) {
            if (!dialogProperty) return
            // value is the visualization target (layerId). Keep data structure: dialogProperty.name holds layerId
            dialogProperty.name = value ?? ''
            // reset columns when visualization/layer changes
            dialogProperty.columns = []
            // ensure we load properties for this layer if needed
            this.onLayerChange(dialogProperty)
        }
    }
})
</script>

<style lang="scss" scoped>
.form-list-item-dropzone {
    height: 20px;
    width: 100%;
    background-color: white;
}

.form-list-item-dropzone-active {
    height: 10px;
    background-color: #aec1d3;
}
</style>
