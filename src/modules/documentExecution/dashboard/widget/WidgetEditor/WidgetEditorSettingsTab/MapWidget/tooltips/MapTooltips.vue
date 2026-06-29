<template>
    <div v-if="tooltip">
        <div class="q-px-md q-pb-xs">
            <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === 0 }" @drop.stop="onDropAtIndex($event, 0)" @dragover.prevent @dragenter.prevent="activeDropzone = 0" @dragleave.prevent="activeDropzone = -1"></div>
            <div v-for="(tool, index) in tooltip.visualizations" :key="index">
                <div class="tooltip-viz-row row no-wrap q-mb-sm">
                    <div class="kn-drag-handle row items-center justify-center" :draggable="!tooltipsDisabled" @dragstart.stop="onDragStart($event, index)" @dragend="isDragging = false">
                        <q-icon name="drag_indicator" size="xs" />
                    </div>
                    <div class="col">
                        <div class="q-pa-sm">
                            <div class="row q-col-gutter-sm">
                                <div class="col-6">
                                    <q-select outlined dense :model-value="tool.label" :disable="tooltipsDisabled" :options="getFilteredVisualizationTypeOptions(index)" option-label="label" option-value="label" emit-value map-options :label="$t('dashboard.widgetEditor.visualizationType.title')" @update:model-value="(val) => onVisualizationSelected(val, tool)" />
                                </div>
                                <div class="col-6">
                                    <q-select outlined dense :model-value="getSelectedColumnNames(tool)" :disable="tooltipsDisabled" :options="getColumnOptionsFromLayer(tool)" option-label="alias" option-value="name" emit-value map-options multiple :label="$t('common.columns')" @update:model-value="(val) => onColumnsChanged(val, tool)" />
                                </div>
                            </div>
                        </div>
                        <div v-for="column in getSelectedColumns(tool)" :key="column.name" class="tooltip-col-row row q-ma-sm">
                            <div class="kn-action-handle kn-action-handle-disabled" style="width: 5px"></div>
                            <div class="col q-px-sm q-py-xs">
                                <div class="text-weight-bold text-subtitle2 q-mb-xs">{{ getAvailableColumnAlias(column, tool) }}</div>
                                <div class="row q-col-gutter-sm items-center">
                                    <div class="col">
                                        <q-input outlined dense v-model="column.alias" :label="$t('common.alias')" :disable="tooltipsDisabled" />
                                    </div>
                                    <div class="col">
                                        <q-input outlined dense v-model="column.prefix" :label="$t('dashboard.widgetEditor.prefix')" :disable="tooltipsDisabled" />
                                    </div>
                                    <div class="col">
                                        <q-input outlined dense v-model="column.suffix" :label="$t('dashboard.widgetEditor.suffix')" :disable="tooltipsDisabled" />
                                    </div>
                                    <div class="col">
                                        <q-input outlined dense type="number" v-model.number="column.precision" :label="$t('dashboard.widgetEditor.precision')" :disable="tooltipsDisabled" />
                                    </div>
                                </div>
                            </div>
                            <div class="kn-action-handle kn-action-handle-disabled" style="width: 5px"></div>
                        </div>
                    </div>
                    <div class="kn-action-handle row items-center justify-center">
                        <q-btn v-if="index === 0" flat round dense icon="add" size="sm" :disable="tooltipsDisabled" @click="addTooltip()" />
                        <q-btn v-else flat round dense icon="delete" size="sm" :disable="tooltipsDisabled" @click.stop="removeTooltip(index)" />
                    </div>
                </div>
                <div class="kn-dropzone" :class="{ 'kn-dropzone-visible': isDragging, 'kn-dropzone-active': activeDropzone === index + 1 }" @drop.stop="onDropAtIndex($event, index + 1)" @dragover.prevent @dragenter.prevent="activeDropzone = index + 1" @dragleave.prevent="activeDropzone = -1"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapInfoColumnSettings, IMapTooltipSettings, IMapTooltipSettingsVisualizations, IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import defaultsDescriptor from '../../../helpers/mapWidget/MapWidgetDefaultValuesDescriptor.json'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'
import { createMapInfoColumnSettings, getMapInfoColumnName, normalizeMapInfoSettings } from '../../../../MapWidget/MapWidgetInfoSettingsHelper'

export default defineComponent({
    name: 'map-tooltips',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, dashboardId: { type: [String, Number], required: true } },
    data() {
        return {
            defaultsDescriptor,
            tooltip: null as IMapTooltipSettings | null,
            isDragging: false,
            activeDropzone: -1,
            propertiesCache: new Map<string, { name: string; alias: string }[]>(),
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[]
        }
    },
    computed: {
        tooltipsDisabled() {
            return !this.widgetModel || !this.widgetModel.settings.tooltips.enabled
        }
    },
    watch: {
        async widgetModel() {
            this.loadTooltips()
            await this.loadPropertiesForTooltips()
        }
    },
    async mounted() {
        this.loadTooltips()
        await this.loadPropertiesForTooltips()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadTooltips() {
            if (this.widgetModel?.settings?.tooltips) this.tooltip = normalizeMapInfoSettings(this.widgetModel.settings.tooltips)
            this.loadVisualizations()
        },
        async loadPropertiesForTooltips() {
            if (!this.tooltip?.visualizations) return
            await Promise.all(this.tooltip.visualizations.map((visualization: IMapTooltipSettingsVisualizations) => this.loadAvailableProperties(visualization)))
        },
        async loadAvailableProperties(visualization: IMapTooltipSettingsVisualizations | null) {
            if (!visualization) return
            const label = visualization?.label ?? visualization
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === label) ?? visualization
            const target = viz?.target
            if (!target) return
            const targetLayer = resolveLayerByTarget(this.widgetModel, target) as IMapWidgetLayer | null
            if (targetLayer) await this.loadAvailablePropertiesInTooltipSettingsForLayer(targetLayer)
        },
        addTooltip() {
            const defaultVisualization = mapWidgetDefaultValues.getDefaultMapTooltips().visualizations[0]
            const entry = {
                name: (defaultVisualization as any).name ?? (defaultVisualization as any).label ?? '',
                label: defaultVisualization.label ?? '',
                columns: [],
                prefix: defaultVisualization.prefix ?? '',
                suffix: defaultVisualization.suffix ?? '',
                precision: defaultVisualization.precision ?? 0
            }
            this.tooltip?.visualizations.push(entry)
        },
        removeTooltip(index: number) {
            if (!this.tooltip || !this.tooltip.visualizations) return

            this.tooltip.visualizations.splice(index, 1)
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
            const [removed] = this.tooltip!.visualizations.splice(sourceIndex, 1)
            const insertAt = targetDropzoneIndex > sourceIndex ? targetDropzoneIndex - 1 : targetDropzoneIndex
            this.tooltip!.visualizations.splice(insertAt, 0, removed)
        },
        getColumnOptionsFromLayer(tooltip: IMapTooltipSettingsVisualizations) {
            if (!tooltip) return []
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === tooltip.label)
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
        async onLayerChange(tooltip: any) {
            tooltip.columns = Array.isArray(tooltip.columns) ? tooltip.columns : []
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === tooltip.label)
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
        getSelectedColumnNames(tooltip: { columns?: IMapInfoColumnSettings[] } | null | undefined) {
            return (tooltip?.columns ?? []).map((column: IMapInfoColumnSettings) => getMapInfoColumnName(column)).filter((columnName: string) => !!columnName)
        },
        getSelectedColumns(tooltip: { columns?: IMapInfoColumnSettings[] } | null | undefined) {
            return tooltip?.columns ?? []
        },
        getAvailableColumnAlias(column: IMapInfoColumnSettings, tooltip: any) {
            const columnName = getMapInfoColumnName(column)
            return this.getColumnOptionsFromLayer(tooltip).find((option: { name: string; alias: string }) => option.name === columnName)?.alias ?? columnName
        },
        onColumnsChanged(selectedColumns: string[] | null, tooltip: any) {
            const existingColumns = new Map(
                (tooltip?.columns ?? []).map((column: IMapInfoColumnSettings) => {
                    return [getMapInfoColumnName(column), column]
                })
            )

            tooltip.columns = (selectedColumns ?? []).map((columnName: string) => {
                return existingColumns.get(columnName) ?? createMapInfoColumnSettings(columnName)
            })
        },
        loadVisualizations() {
            this.visualizationTypeOptions = []
            if (!this.widgetModel?.settings?.visualizations) return
            this.widgetModel.settings.visualizations.forEach((visualization: IMapWidgetVisualizationType) => {
                this.visualizationTypeOptions.push(visualization)
            })
        },
        onVisualizationSelected(value: string | null, tooltipProperty: any) {
            if (!tooltipProperty) return
            tooltipProperty.label = value ?? ''
            tooltipProperty.columns = []
            this.onLayerChange(tooltipProperty)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.tooltip) return this.visualizationTypeOptions

            const selectedLabels = this.tooltip.visualizations
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
.tooltip-viz-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 2px;
}

.tooltip-col-row {
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
