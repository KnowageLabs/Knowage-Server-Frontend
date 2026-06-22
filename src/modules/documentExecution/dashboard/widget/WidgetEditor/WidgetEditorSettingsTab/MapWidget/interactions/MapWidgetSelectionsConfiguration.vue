<template>
    <div class="q-px-md q-pb-sm">
        <div v-if="selectionConfiguration">
            <div v-for="(selectionConfig, index) in selectionConfiguration.selections" :key="index" class="selection-row row no-wrap q-mb-sm">
                <div class="kn-action-handle kn-action-handle-disabled"></div>
                <div class="col q-pa-sm">
                    <div class="row q-col-gutter-sm">
                        <div class="col-6">
                            <q-select outlined dense v-model="selectionConfig.vizualizationType" :options="getFilteredVisualizationTypeOptions(index)" emit-value map-options option-label="label" :label="$t('dashboard.widgetEditor.visualizationType.title')" :disable="selectionsDisabled" @update:model-value="onVizualizationTypeChange(selectionConfig)" />
                        </div>
                        <div class="col-6">
                            <q-select outlined dense v-model="selectionConfig.column" :options="availableAttributeColumns(selectionConfig.vizualizationType)" emit-value map-options option-label="name" :label="$t('common.column')" :disable="selectionsDisabled" />
                        </div>
                    </div>
                </div>
                <div class="kn-action-handle row items-center justify-center">
                    <q-btn v-if="index === 0" flat round dense icon="add" size="sm" :disable="selectionsDisabled" @click="addSelectionConfiguration()" />
                    <q-btn v-else flat round dense icon="delete" size="sm" :disable="selectionsDisabled" @click.stop="removeSelectionConfiguration(index)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetSelectionConfiguration, IMapWidgetVisualizationType, IMapWidgetLayer, IMapWidgetSelection } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import { mapActions } from 'pinia'
import appStore from '@/App.store'

export default defineComponent({
    name: 'map-widget-selections-configuration',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, visible: { type: Boolean }, dashboardId: { type: [String, Number], required: true } },
    data() {
        return {
            selectionConfiguration: null as IMapWidgetSelectionConfiguration | null,
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[],
            propertiesCache: new Map<string, { name: string; alias: string }[]>()
        }
    },

    computed: {
        selectionsDisabled() {
            return !this.selectionConfiguration || !this.selectionConfiguration.enabled
        }
    },
    watch: {
        visible() {
            this.loadSelectionConfiguration()
        }
    },
    created() {
        this.setEventListeners()
        this.loadSelectionConfiguration()
        if (this.visualizationTypeOptions.length > 0) this.visualizationTypeOptions.forEach((viz) => this.loadAvailableProperties(viz))
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        setEventListeners() {
            emitter.on('mapFieldsUpdated', this.loadSelectionConfiguration)
        },
        removeEventListeners() {
            emitter.off('mapFieldsUpdated', this.loadSelectionConfiguration)
        },
        loadSelectionConfiguration() {
            this.selectionConfiguration = this.widgetModel?.settings?.interactions?.selection ?? null
            if (this.selectionConfiguration?.selections?.length === 0) this.selectionConfiguration?.selections.push({ vizualizationType: null, column: { name: '', alias: '', type: '' }, prefix: null, suffix: null, precision: null })
            this.loadVisualizationTypeOptions()
        },
        loadVisualizationTypeOptions() {
            this.visualizationTypeOptions = []
            if (!this.widgetModel?.settings?.visualizations) return
            this.widgetModel.settings.visualizations.forEach((visualization: IMapWidgetVisualizationType) => {
                const mapLayer = resolveLayerByTarget(this.widgetModel, visualization.target)
                if (!mapLayer) return
                if (mapLayer.type === 'dataset') {
                    this.visualizationTypeOptions.push(visualization)
                    return
                }

                if (mapLayer.type === 'layer' && visualization.properties && visualization.properties.length > 0) {
                    this.visualizationTypeOptions.push(visualization)
                }
            })
        },
        availableAttributeColumns(vizualizationType: IMapWidgetVisualizationType | null) {
            if (!vizualizationType) return []
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === vizualizationType.label)
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
        addSelectionConfiguration() {
            if (this.selectionsDisabled) return
            if (this.selectionConfiguration) this.selectionConfiguration.selections.push({ vizualizationType: null, column: { name: '', alias: '', type: '' }, prefix: null, suffix: null, precision: null })
        },
        removeSelectionConfiguration(index: number) {
            if (this.selectionsDisabled) return
            if (this.selectionConfiguration) this.selectionConfiguration.selections.splice(index, 1)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.selectionConfiguration) return this.visualizationTypeOptions

            const selectedLabels = this.selectionConfiguration.selections
                .map((visualizationConfig: any, index: number) => {
                    return index !== currentIndex ? (visualizationConfig.label ?? null) : null
                })
                .filter((t): t is string => !!t)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => {
                const labelKey = vizualizationType.label ?? ''
                return !selectedLabels.includes(labelKey)
            })
        },
        onVizualizationTypeChange(selectionConfig: IMapWidgetSelection) {
            selectionConfig.column = { name: '', alias: '', type: '' }
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
        }
    }
})
</script>

<style lang="scss" scoped>
.selection-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
