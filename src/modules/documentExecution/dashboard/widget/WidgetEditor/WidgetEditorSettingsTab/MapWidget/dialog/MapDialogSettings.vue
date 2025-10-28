<template>
    <div v-if="dialogSettings" class="p-m-3">
        <WidgetEditorStyleToolbar class="p-my-3" :options="descriptor.toolbarStyleOptions" :prop-model="dialogSettings.style" :disabled="dialogSettingsDisabled" @change="onStyleToolbarChange"></WidgetEditorStyleToolbar>

        <Message class="kn-width-full p-d-flex p-jc-center p-m-0 p-mx-2" severity="info" :closable="false">
            {{ $t('dashboard.widgetEditor.map.dialogHint') }}
        </Message>

        <div v-for="(dialogProperty, index) in dialogSettings.visualizations" :key="index" class="dynamic-form-item p-grid p-col-12 p-ai-center p-m-0 p-pt-0">
            <div v-show="dropzoneTopVisible[index]" class="p-col-12 form-list-item-dropzone-active" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
            <div class="p-col-12 form-list-item-dropzone" :class="{ 'form-list-item-dropzone-active': dropzoneTopVisible[index] }" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent="displayDropzone('top', index)" @dragleave.prevent="hideDropzone('top', index)"></div>

            <div class="p-col-12 p-d-flex p-flex-column" :draggable="true" @dragstart.stop="onDragStart($event, index)">
                <div class="row items-center q-mb-sm">
                    <i class="pi pi-th-large kn-cursor-pointer"></i>
                    <q-select class="col-6" filled dense :model-value="dialogProperty.label" :disable="dialogSettingsDisabled" :options="getFilteredVisualizationTypeOptions(index)" option-label="label" option-value="label" emit-value map-options options-dense :label="$t('dashboard.widgetEditor.visualizationType.title')" @update:model-value="(val) => onVisualizationSelected(val, dialogProperty)"></q-select>
                    <MultiSelect class="col-5 q-ml-sm" v-model="dialogProperty.columns" :disabled="dialogSettingsDisabled" :options="getColumnOptionsFromLayer(dialogProperty)" option-label="alias" display="chip" />
                </div>
                <div class="q-col-gutter" style="gap: 0.5em; margin-left: auto">
                    <i v-if="index === 0" class="pi pi-plus-circle kn-cursor-pointer" data-test="new-button" @click="addDialog()"></i>
                    <i class="pi pi-trash kn-cursor-pointer" data-test="delete-button" @click="removeDialog(index)"></i>
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
import { IMapDialogSettings, IMapTooltipSettings, IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetSelectionConfiguration, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
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
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadDialogSettings() {
            if (this.widgetModel?.settings?.dialog) this.dialogSettings = this.widgetModel.settings.dialog
            this.loadVisualizations()
        },
        async loadPropertiesForDialogSettings() {
            if (!this.dialogSettings?.visualizations) return
            await Promise.all(this.dialogSettings.visualizations.map((visualization: any) => this.loadAvailableProperties(visualization)))
        },
        async loadAvailableProperties(visualization: any | null) {
            if (!visualization) return
            const label = visualization?.label ?? visualization
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === label) ?? visualization
            const target = viz?.target
            if (!target) return
            const targetLayer = resolveLayerByTarget(this.widgetModel, target) as IMapWidgetLayer | null
            if (targetLayer) await this.loadAvailablePropertiesInTooltipSettingsForLayer(targetLayer)
        },
        addDialog() {
            const defaultVisualization = mapWidgetDefaultValues.getDefaultDialogSettings().visualizations[0]
            const entry = {
                name: (defaultVisualization as any).name ?? (defaultVisualization as any).label ?? '',
                label: defaultVisualization.label ?? '',
                columns: Array.isArray(defaultVisualization.columns) ? defaultVisualization.columns.map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.property ?? String(c))) : [],
                prefix: defaultVisualization.prefix ?? '',
                suffix: defaultVisualization.suffix ?? '',
                precision: defaultVisualization.precision ?? 0
            }
            this.dialogSettings?.visualizations.push(entry)
        },
        removeDialog(index: number) {
            if (!this.dialogSettings || !this.dialogSettings.visualizations) return
            if (index === 0) {
                this.dialogSettings.visualizations[0].label = ''
                this.dialogSettings.visualizations[0].columns = []
            } else {
                this.dialogSettings.visualizations.splice(index, 1)
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
            this.dialogSettings?.visualizations.splice(newIndex, 0, this.dialogSettings.visualizations.splice(sourceRowIndex, 1)[0])
        },
        displayDropzone(position: string, index: number) {
            position === 'top' ? (this.dropzoneTopVisible[index] = true) : (this.dropzoneBottomVisible[index] = true)
        },
        hideDropzone(position: string, index: number) {
            position === 'top' ? (this.dropzoneTopVisible[index] = false) : (this.dropzoneBottomVisible[index] = false)
        },
        getColumnOptionsFromLayer(dialogProperty: any) {
            if (!dialogProperty) return []
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === dialogProperty.label)
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
        async onLayerChange(dialogProperty: any) {
            dialogProperty.columns = Array.isArray(dialogProperty.columns) ? dialogProperty.columns : []
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === dialogProperty.label)
            const target = viz?.target ? this.widgetModel.layers.find((layer: IMapWidgetLayer) => viz.target === layer.layerId) : null
            if (!target || target.type !== 'layer' || this.propertiesCache.has(viz?.target)) return
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
        loadVisualizations() {
            this.visualizationTypeOptions = []
            if (!this.widgetModel?.settings?.visualizations) return
            this.widgetModel.settings.visualizations.forEach((visualization: IMapWidgetVisualizationType) => {
                this.visualizationTypeOptions.push(visualization)
            })
        },
        onVisualizationSelected(value: string | null, dialogProperty: any) {
            if (!dialogProperty) return
            dialogProperty.label = value ?? ''
            dialogProperty.columns = []
            this.onLayerChange(dialogProperty)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.dialogSettings) return this.visualizationTypeOptions

            const selectedLabels = this.dialogSettings.visualizations
                .map((visualizationConfig: any, index: number) => {
                    return index !== currentIndex ? visualizationConfig.label ?? null : null
                })
                .filter((t): t is string => !!t)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => {
                const labelKey = vizualizationType.label ?? ''
                return !selectedLabels.includes(labelKey)
            })
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
