<template>
    <div v-if="tooltip" class="p-grid p-jc-center p-ai-center p-m-3">
        <Message class="kn-width-full p-d-flex p-jc-center p-m-0 p-mx-2" severity="info" :closable="false">
            {{ $t('dashboard.widgetEditor.map.tooltipHint') }}
        </Message>
        <div v-for="(tool, index) in tooltip.visualizations" :key="index" class="dynamic-form-item p-grid p-col-12 p-ai-center">
            <div v-show="dropzoneTopVisible[index]" class="p-col-12 form-list-item-dropzone-active" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
            <div class="p-col-12 form-list-item-dropzone" :class="{ 'form-list-item-dropzone-active': dropzoneTopVisible[index] }" @drop.stop="onDropComplete($event, 'before', index)" @dragover.prevent @dragenter.prevent="displayDropzone('top', index)" @dragleave.prevent="hideDropzone('top', index)"></div>

            <div class="p-col-12 p-d-flex p-flex-column" :draggable="true" @dragstart.stop="onDragStart($event, index)">
                <div class="row items-center q-mb-sm">
                    <i class="pi pi-th-large kn-cursor-pointer"></i>
                    <q-select class="col-6" filled dense :model-value="tool.label" :disable="tooltipsDisabled" :options="getFilteredVisualizationTypeOptions(index)" option-label="label" option-value="label" emit-value map-options option-dense :label="$t('dashboard.widgetEditor.visualizationType.title')" @update:model-value="(val) => onVisualizationSelected(val, tool)"></q-select>
                    <MultiSelect class="col-5 q-ml-sm" v-model="tool.columns" :disabled="tooltipsDisabled" :options="getColumnOptionsFromLayer(tool)" option-label="alias" display="chip" />
                </div>
                <div class="q-col-gutter" style="gap: 0.5em; margin-left: auto">
                    <i v-if="index === 0" class="pi pi-plus-circle kn-cursor-pointer" data-test="new-button" @click="addTooltip()"></i>
                    <i v-if="index !== 0" class="pi pi-trash kn-cursor-pointer" data-test="delete-button" @click="removeTooltip(index)"></i>
                </div>
            </div>

            <div class="p-grid p-col-12 p-mt-2">
                <q-input dense class="p-col-4" filled v-model="tool.prefix" :label="$t('dashboard.widgetEditor.prefix')" :disable="tooltipsDisabled" />
                <q-input dense class="p-col-4" filled v-model="tool.suffix" :label="$t('dashboard.widgetEditor.suffix')" :disable="tooltipsDisabled" />
                <q-input dense class="p-col-4" type="number" filled v-model="tool.precision" :label="$t('dashboard.widgetEditor.precision')" :disable="tooltipsDisabled" />
            </div>

            <div class="p-col-12 form-list-item-dropzone" :class="{ 'form-list-item-dropzone-active': dropzoneBottomVisible[index] }" @drop.stop="onDropComplete($event, 'after', index)" @dragover.prevent @dragenter.prevent="displayDropzone('bottom', index)" @dragleave.prevent="hideDropzone('bottom', index)"></div>
            <div v-show="dropzoneBottomVisible[index]" class="p-col-12 form-list-item-dropzone-active" @drop.stop="onDropComplete($event, 'after', index)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapTooltipSettings, IMapTooltipSettingsVisualizations, IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Message from 'primevue/message'
import defaultsDescriptor from '../../../helpers/mapWidget/MapWidgetDefaultValuesDescriptor.json'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import * as mapWidgetDefaultValues from '../../../helpers/mapWidget/MapWidgetDefaultValues'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'

export default defineComponent({
    name: 'map-tooltips',
    components: { Dropdown, MultiSelect, Message },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            defaultsDescriptor,
            tooltip: null as IMapTooltipSettings | null,
            dropzoneTopVisible: {},
            dropzoneBottomVisible: {},
            propertiesCache: new Map<string, { name: string; alias: string }[]>(),
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[]
        }
    },
    computed: {
        tooltipsDisabled() {
            return !this.widgetModel || !this.widgetModel.settings.tooltips.enabled
        }
    },
    async mounted() {
        this.loadTooltips()
        await this.loadPropertiesForTooltips()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadTooltips() {
            if (this.widgetModel?.settings?.tooltips) this.tooltip = this.widgetModel.settings.tooltips
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
                columns: Array.isArray(defaultVisualization.columns) ? defaultVisualization.columns.map((c: any) => (typeof c === 'string' ? c : c?.name ?? c?.property ?? String(c))) : [],
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
            this.tooltip?.visualizations.splice(newIndex, 0, this.tooltip.visualizations.splice(sourceRowIndex, 1)[0])
        },
        displayDropzone(position: string, index: number) {
            position === 'top' ? (this.dropzoneTopVisible[index] = true) : (this.dropzoneBottomVisible[index] = true)
        },
        hideDropzone(position: string, index: number) {
            position === 'top' ? (this.dropzoneTopVisible[index] = false) : (this.dropzoneBottomVisible[index] = false)
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
