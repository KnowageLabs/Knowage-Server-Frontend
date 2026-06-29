<template>
    <div v-if="dialogSettings">
        <div class="q-px-md q-pt-sm">
            <WidgetEditorStyleToolbar :options="descriptor.toolbarStyleOptions" :prop-model="dialogSettings.style" :disabled="dialogSettingsDisabled" @change="onStyleToolbarChange"></WidgetEditorStyleToolbar>
        </div>
        <div class="q-px-md q-pb-xs">
            <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === 0 }" @drop.stop="onDropAtIndex($event, 0)" @dragover.prevent @dragenter.prevent="activeDropzone = 0" @dragleave.prevent="activeDropzone = -1"></div>
            <div v-for="(dialogProperty, index) in dialogSettings.visualizations" :key="index">
                <div class="dialog-viz-row row no-wrap q-mb-sm">
                    <div class="kn-drag-handle row items-center justify-center" :draggable="!dialogSettingsDisabled" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                        <q-icon name="drag_indicator" size="xs" />
                    </div>
                    <div class="col">
                        <div class="q-pa-sm">
                            <div class="row q-col-gutter-sm">
                                <div class="col-6">
                                    <q-select outlined dense :model-value="dialogProperty.label" :disable="dialogSettingsDisabled" :options="getFilteredVisualizationTypeOptions(index)" option-label="label" option-value="label" emit-value map-options :label="$t('dashboard.widgetEditor.visualizationType.title')" @update:model-value="(val) => onVisualizationSelected(val, dialogProperty)" />
                                </div>
                                <div class="col-6">
                                    <q-select outlined dense :model-value="getSelectedColumnNames(dialogProperty)" :disable="dialogSettingsDisabled" :options="getColumnOptionsFromLayer(dialogProperty)" option-label="alias" option-value="name" emit-value map-options multiple :label="$t('common.columns')" @update:model-value="(val) => onColumnsChanged(val, dialogProperty)" />
                                </div>
                            </div>
                        </div>
                        <div v-for="column in getSelectedColumns(dialogProperty)" :key="column.name" class="dialog-col-row row q-ma-sm">
                            <div class="kn-action-handle kn-action-handle-disabled" style="width: 5px"></div>
                            <div class="col q-px-sm q-py-xs">
                                <div class="text-weight-bold text-subtitle2 q-mb-xs">{{ getAvailableColumnAlias(column, dialogProperty) }}</div>
                                <div class="row q-col-gutter-sm items-center">
                                    <div class="col">
                                        <q-input outlined dense v-model="column.alias" :label="$t('common.alias')" :disable="dialogSettingsDisabled" />
                                    </div>
                                    <div class="col">
                                        <q-input outlined dense v-model="column.prefix" :label="$t('dashboard.widgetEditor.prefix')" :disable="dialogSettingsDisabled" />
                                    </div>
                                    <div class="col">
                                        <q-input outlined dense v-model="column.suffix" :label="$t('dashboard.widgetEditor.suffix')" :disable="dialogSettingsDisabled" />
                                    </div>
                                    <div class="col">
                                        <q-input outlined dense type="number" v-model.number="column.precision" :label="$t('dashboard.widgetEditor.precision')" :disable="dialogSettingsDisabled" />
                                    </div>
                                </div>
                            </div>
                            <div class="kn-action-handle kn-action-handle-disabled" style="width: 5px"></div>
                        </div>
                    </div>
                    <div class="kn-action-handle row items-center justify-center">
                        <q-btn v-if="index === 0" flat round dense icon="add" size="sm" :disable="dialogSettingsDisabled" @click="addDialog()" />
                        <q-btn flat round dense icon="delete" size="sm" :disable="dialogSettingsDisabled" @click.stop="removeDialog(index)" />
                    </div>
                </div>
                <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === index + 1 }" @drop.stop="onDropAtIndex($event, index + 1)" @dragover.prevent @dragenter.prevent="activeDropzone = index + 1" @dragleave.prevent="activeDropzone = -1"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapDialogSettings, IMapInfoColumnSettings, IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import descriptor from './MapDialogSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'
import { createMapInfoColumnSettings, getMapInfoColumnName, normalizeMapInfoSettings } from '../../../../MapWidget/MapWidgetInfoSettingsHelper'

export default defineComponent({
    name: 'map-dialog-settings',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, dashboardId: { type: [String, Number], required: true } },
    data() {
        return {
            descriptor,
            dialogSettings: null as IMapDialogSettings | null,
            isDragging: false,
            activeDropzone: -1,
            propertiesCache: new Map<string, { name: string; alias: string }[]>(),
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[]
        }
    },
    computed: {
        dialogSettingsDisabled() {
            return !this.widgetModel || !this.widgetModel.settings.dialog.enabled
        }
    },
    watch: {
        async widgetModel() {
            this.loadDialogSettings()
            await this.loadPropertiesForDialogSettings()
        }
    },
    async mounted() {
        this.loadDialogSettings()
        await this.loadPropertiesForDialogSettings()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadDialogSettings() {
            if (this.widgetModel?.settings?.dialog) this.dialogSettings = normalizeMapInfoSettings(this.widgetModel.settings.dialog)
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
                columns: [],
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
            this.isDragging = true
            this.activeDropzone = -1
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropAtIndex(event: any, targetDropzoneIndex: number) {
            this.isDragging = false
            this.activeDropzone = -1
            const sourceIndex = JSON.parse(event.dataTransfer.getData('text/plain'))
            if (sourceIndex === targetDropzoneIndex || sourceIndex === targetDropzoneIndex - 1) return
            const [removed] = this.dialogSettings!.visualizations.splice(sourceIndex, 1)
            const insertAt = targetDropzoneIndex > sourceIndex ? targetDropzoneIndex - 1 : targetDropzoneIndex
            this.dialogSettings!.visualizations.splice(insertAt, 0, removed)
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
            if (targetLayer.type !== 'layer') {
                this.setLoading(false)
                return
            }
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
        getSelectedColumnNames(dialogProperty: { columns?: IMapInfoColumnSettings[] } | null | undefined) {
            return (dialogProperty?.columns ?? []).map((column: IMapInfoColumnSettings) => getMapInfoColumnName(column)).filter((columnName: string) => !!columnName)
        },
        getSelectedColumns(dialogProperty: { columns?: IMapInfoColumnSettings[] } | null | undefined) {
            return dialogProperty?.columns ?? []
        },
        getAvailableColumnAlias(column: IMapInfoColumnSettings, dialogProperty: any) {
            const columnName = getMapInfoColumnName(column)
            return this.getColumnOptionsFromLayer(dialogProperty).find((option: { name: string; alias: string }) => option.name === columnName)?.alias ?? columnName
        },
        onColumnsChanged(selectedColumns: string[] | null, dialogProperty: any) {
            const existingColumns = new Map(
                (dialogProperty?.columns ?? []).map((column: IMapInfoColumnSettings) => {
                    return [getMapInfoColumnName(column), column]
                })
            )

            dialogProperty.columns = (selectedColumns ?? []).map((columnName: string) => {
                return existingColumns.get(columnName) ?? createMapInfoColumnSettings(columnName)
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
                    return index !== currentIndex ? (visualizationConfig.label ?? null) : null
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
.dialog-viz-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 2px;
}

.dialog-col-row {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
}

.map-info-column-row {
    padding: 0.5rem 0;
    border-top: 1px solid #e5e7eb;
}

.map-info-column-label {
    font-weight: 600;
    overflow-wrap: anywhere;
}
</style>
