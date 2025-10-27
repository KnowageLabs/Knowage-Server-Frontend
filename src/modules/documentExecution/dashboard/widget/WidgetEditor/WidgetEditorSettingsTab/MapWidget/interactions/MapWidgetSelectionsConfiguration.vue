<template>
    <div class="p-grid p-jc-start p-ai-center p-p-4">
        <form v-if="selectionConfiguration" class="p-fluid p-formgrid p-grid p-col-12 p-m-1">
            <div class="p-col-12 p-d-flex p-flex-column">
                <div v-for="(selectionConfig, index) in selectionConfiguration.selections" :key="index" class="row items-center q-mb-sm">
                    <q-select filled dense class="col-6" v-model="selectionConfig.vizualizationType" :options="getFilteredVisualizationTypeOptions(index)" emit-value map-options options-dense option-label="label" :label="$t('dashboard.widgetEditor.visualizationType.title')" :disable="selectionsDisabled" @update:modelValue="onVizualizationTypeChange(selectionConfig)"></q-select>
                    <q-select filled dense class="col-5 q-ml-sm" v-model="selectionConfig.column" :options="availableAttributeColumns(selectionConfig.vizualizationType)" emit-value map-options option-label="name" options-dense :label="$t('common.column')" :disable="selectionsDisabled"></q-select>

                    <Button v-if="index === 0" icon="fas fa-plus-circle fa-1x" class="p-button-text p-button-plain p-js-center p-ml-2" @click="addSelectionConfiguration" />
                    <Button v-if="index !== 0" icon="pi pi-trash kn-cursor-pointer" class="p-button-text p-button-plain p-js-center p-ml-2" @click="removeSelectionConfiguration(index)" />
                </div>
            </div>
        </form>
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
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, visible: { type: Boolean } },
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
            if (this.selectionConfiguration?.selections?.length === 0) this.selectionConfiguration?.selections.push({ vizualizationType: null, column: '', prefix: null, suffix: null, precision: null })
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
            if (this.selectionConfiguration) this.selectionConfiguration.selections.push({ vizualizationType: null, column: '', prefix: null, suffix: null, precision: null })
        },
        removeSelectionConfiguration(index: number) {
            if (this.selectionsDisabled) return
            if (this.selectionConfiguration) this.selectionConfiguration.selections.splice(index, 1)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.selectionConfiguration) return this.visualizationTypeOptions

            const selectedLabels = this.selectionConfiguration.selections
                .map((visualizationConfig: any, index: number) => {
                    return index !== currentIndex ? visualizationConfig.label ?? null : null
                })
                .filter((t): t is string => !!t)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => {
                const labelKey = vizualizationType.label ?? ''
                return !selectedLabels.includes(labelKey)
            })
        },
        onVizualizationTypeChange(selectionConfig: IMapWidgetSelection) {
            selectionConfig.column = ''
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
            const rawProperties = await getPropertiesByLayerLabel(targetLayer.label)
            ;(this as any).setLoading?.(false)
            const properties = (rawProperties || []).map((p: any) => ({ property: String(p.property ?? p.name ?? p), name: String(p.property ?? p.name ?? p) } as any))
            ;(this as any).propertiesCache?.set(targetLayer.layerId, properties)
            visualization.properties = properties
        }
    }
})
</script>
