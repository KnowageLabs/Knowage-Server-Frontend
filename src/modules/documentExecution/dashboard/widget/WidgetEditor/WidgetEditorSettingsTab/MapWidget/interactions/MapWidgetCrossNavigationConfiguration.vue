<template>
    <div class="q-px-md q-pb-sm">
        <div v-if="crossNavigationConfiguration">
            <div v-for="(crossNavigationConfig, index) in crossNavigationConfiguration.crossNavigationVizualizationTypes" :key="index" class="cross-nav-row row no-wrap q-mb-sm">
                <div class="kn-action-handle kn-action-handle-disabled"></div>
                <div class="col q-pa-sm">
                    <div class="row q-col-gutter-sm">
                        <div class="col-4">
                            <q-select outlined dense v-model="crossNavigationConfig.vizualizationType" :options="getFilteredVisualizationTypeOptions(index)" emit-value map-options option-label="label" :label="$t('dashboard.widgetEditor.visualizationType.title')" :disable="crossNavigationDisabled" @update:model-value="onVizualizationTypeChange(crossNavigationConfig)" />
                        </div>
                        <div class="col-4">
                            <q-select outlined dense v-model="crossNavigationConfig.id" :options="crossNavigationOptions" emit-value map-options option-label="name" option-value="id" :label="$t('dashboard.widgetEditor.interactions.crossNavigationName')" :disable="crossNavigationDisabled" @update:model-value="onCrossNavigationSelected(crossNavigationConfig, $event)" />
                        </div>
                        <div class="col-4">
                            <q-select outlined dense v-model="crossNavigationConfig.column" :options="availableColumns(crossNavigationConfig.vizualizationType)" emit-value map-options :option-label="getTargetLayerType(crossNavigationConfig) === 'layer' ? 'property' : 'name'" :label="$t('common.column')" :disable="crossNavigationDisabled" />
                        </div>
                    </div>
                    <div v-if="crossNavigationConfig.vizualizationType?.id && parameterList[crossNavigationConfig.vizualizationType.id]">
                        <WidgetOutputParametersList :widget-model="widgetModel" :prop-parameters="parameterList[crossNavigationConfig.vizualizationType.id]" :selected-datasets-columns-map="selectedDatasetsColumnsMap" :mapDynamicOptions="availableColumns(crossNavigationConfig.vizualizationType)" :crossNavigationConfig="crossNavigationConfig" :disabled="crossNavigationDisabled" @change="onParametersChanged($event, crossNavigationConfig)" />
                    </div>
                </div>
                <div class="kn-action-handle row items-center justify-center">
                    <q-btn v-if="index === 0" flat round dense icon="add" size="sm" :disable="crossNavigationDisabled" @click="addCrossNavigationConfiguration()" />
                    <q-btn v-else flat round dense icon="delete" size="sm" :disable="crossNavigationDisabled" @click.stop="removeCrossNavigationConfiguration(index)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetInteractionParameter } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetVisualizationType, IMapWidgetLayer, IMapWidgetCrossNavigation, IMapWidgetCrossNavigationVisualizationTypeConfig, IMapWidgetLayerProperty } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import WidgetOutputParametersList from '../../common/interactions/crossNavigation/WidgetOutputParametersList.vue'
import deepcopy from 'deepcopy'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'

export default defineComponent({
    name: 'map-widget-cross-navigation-configuration',
    components: { WidgetOutputParametersList },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, datasets: { type: Array as PropType<any[]> }, selectedDatasets: { type: Array as PropType<any[]> }, dashboardId: { type: String, required: true }, visible: { type: Boolean } },
    setup() {
        const store = dashboardStore()
        return { store }
    },
    data() {
        return {
            crossNavigationConfiguration: null as IMapWidgetCrossNavigation | null,
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[],
            crossNavigationOptions: [] as { id: number; name: string }[],
            outputParameters: [] as any[],
            parameterList: {} as Record<string, IWidgetInteractionParameter[]>,
            selectedDatasetsColumnsMap: {},
            propertiesCache: new Map<string, IMapWidgetLayerProperty[]>()
        }
    },
    computed: {
        crossNavigationDisabled() {
            return !this.crossNavigationConfiguration || !this.crossNavigationConfiguration.enabled
        },
        availableDatasets() {
            if (!this.widgetModel?.layers) return []
            return this.widgetModel.layers.filter((layer: IMapWidgetLayer) => layer.type === 'dataset')
        }
    },
    watch: {
        visible() {
            this.initialLoad()
        }
    },
    created() {
        this.setEventListeners()
        this.initialLoad()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        setEventListeners() {
            emitter.on('mapFieldsUpdated', this.loadCrossNavigationConfiguration)
        },
        removeEventListeners() {
            emitter.off('mapFieldsUpdated', this.loadCrossNavigationConfiguration)
        },
        initialLoad() {
            this.loadCrossNavigationOptions()
            this.loadCrossNavigationConfiguration()
            this.loadOutputParameters()
            this.loadParameterList()
            this.loadSelectedDatasetColumnNames()
        },
        loadCrossNavigationOptions() {
            const temp = this.store.getCrossNavigations(this.dashboardId)
            if (temp) {
                this.crossNavigationOptions = temp.map((crossNavigation: any) => ({ id: crossNavigation.crossId, name: crossNavigation.crossName }))
                if (this.crossNavigationConfiguration) {
                    this.crossNavigationConfiguration.crossNavigationVizualizationTypes.forEach((config: IMapWidgetCrossNavigationVisualizationTypeConfig) => {
                        if (config.name && !config.id) {
                            // backward-compat: old models only stored name, no id — fill the id from the server list
                            const match = this.crossNavigationOptions.find((opt: any) => opt.name === config.name)
                            if (match) config.id = match.id
                        } else if (config.id) {
                            // refresh the name in case the cross-navigation was renamed on the server
                            const match = this.crossNavigationOptions.find((opt: any) => opt.id === config.id)
                            if (match) config.name = match.name
                        }
                    })
                }
            }
        },
        loadOutputParameters() {
            this.outputParameters = this.store.getOutputParameters(this.dashboardId) ?? []
        },
        loadParameterList() {
            if (!this.crossNavigationConfiguration) return

            this.crossNavigationConfiguration.crossNavigationVizualizationTypes.forEach((crossNavigationVisTypeConfig: IMapWidgetCrossNavigationVisualizationTypeConfig, index: number) => {
                if (!crossNavigationVisTypeConfig.vizualizationType?.id || this.parameterList[crossNavigationVisTypeConfig.vizualizationType.id]) return
                this.parameterList[crossNavigationVisTypeConfig.vizualizationType.id] = []
                for (let i = 0; i < this.outputParameters.length; i++) {
                    const outputParameter = this.outputParameters[i]
                    const temp = { enabled: false, name: outputParameter.name, type: '' } as IWidgetInteractionParameter
                    const index = crossNavigationVisTypeConfig.parameters.findIndex((parameter: IWidgetInteractionParameter) => parameter.name === outputParameter.name)
                    if (index !== -1) {
                        const modelParameter = crossNavigationVisTypeConfig?.parameters[index]
                        temp.enabled = modelParameter.enabled
                        temp.type = modelParameter.type
                        temp.value = modelParameter.value
                        temp.dataType = modelParameter.dataType
                        if (modelParameter.column) temp.column = modelParameter.column
                        if (modelParameter.dataset) temp.dataset = modelParameter.dataset
                    }
                    this.parameterList[crossNavigationVisTypeConfig.vizualizationType.id].push(deepcopy(temp))
                }
            })
        },
        async loadCrossNavigationConfiguration() {
            this.crossNavigationConfiguration = this.widgetModel?.settings?.interactions?.crossNavigation ?? null
            if (this.crossNavigationConfiguration?.crossNavigationVizualizationTypes?.length === 0) this.crossNavigationConfiguration?.crossNavigationVizualizationTypes.push({ vizualizationType: null, column: { name: '', alias: '', type: '' }, name: '', parameters: [] })
            this.loadVisualizationTypeOptions()
            this.loadCrossNavigationOptions()
            await this.loadPropertiesForVisualizationTypes()
        },
        loadSelectedDatasetColumnNames() {
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return

            this.selectedDatasets.forEach((dataset: any) => this.loadCrossSelectedDatasetColumnName(dataset))
        },
        loadCrossSelectedDatasetColumnName(dataset: any) {
            this.selectedDatasetsColumnsMap[dataset.name] = []
            for (let i = 0; i < dataset.metadata.fieldsMeta.length; i++) {
                this.selectedDatasetsColumnsMap[dataset.name].push(dataset.metadata.fieldsMeta[i].name)
            }
        },
        loadVisualizationTypeOptions() {
            this.visualizationTypeOptions = []
            if (!this.widgetModel?.settings?.visualizations) return
            this.widgetModel.settings.visualizations.forEach((visualization: IMapWidgetVisualizationType) => {
                const mapLayer = resolveLayerByTarget(this.widgetModel, visualization.target)
                if (mapLayer) this.visualizationTypeOptions.push(visualization)
            })
        },
        availableColumns(vizualizationType: IMapWidgetVisualizationType | null) {
            if (!vizualizationType) return []
            const viz = this.widgetModel?.settings?.visualizations?.find((v: any) => v.label === vizualizationType.label)
            const layer = viz?.target ? (resolveLayerByTarget(this.widgetModel, viz.target) as IMapWidgetLayer | null) : null
            const datasetLayer = viz?.targetDataset ? (resolveLayerByTarget(this.widgetModel, viz.targetDataset) as IMapWidgetLayer | null) : null

            if (datasetLayer) {
                // normalize both dataset columns and cached layer properties to IMapWidgetLayerProperty[]
                let datasetColumns: IMapWidgetLayerProperty[] = []
                if (datasetLayer.type === 'dataset') {
                    datasetColumns = (datasetLayer.columns ?? []).map((c: any) => ({ property: c.name, name: c.name, alias: c.alias ?? c.name }))
                } else {
                    datasetColumns = this.propertiesCache.get(datasetLayer.layerId) ?? []
                }

                let layerColumns: IMapWidgetLayerProperty[] = []
                if (layer) {
                    if (layer.type === 'dataset') {
                        layerColumns = (layer.columns ?? []).map((c: any) => ({ property: c.name, name: c.name, alias: c.alias ?? c.name }))
                    } else {
                        layerColumns = this.propertiesCache.get(layer.layerId) ?? []
                    }
                }

                return [...new Map([...layerColumns, ...datasetColumns].map((item) => [item['name'], item])).values()]
            }
            if (!layer) return []
            if (layer.type === 'dataset') return (layer.columns ?? []).map((c: any) => ({ property: c.name, name: c.name, alias: c.alias ?? c.name }))
            return this.propertiesCache.get(layer.layerId) ?? []
        },
        async loadPropertiesForVisualizationTypes() {
            if (!this.crossNavigationConfiguration) return
            const promises = this.crossNavigationConfiguration.crossNavigationVizualizationTypes.filter((config: IMapWidgetCrossNavigationVisualizationTypeConfig) => config.vizualizationType).map((config: IMapWidgetCrossNavigationVisualizationTypeConfig) => this.loadAvailableProperties(config.vizualizationType))
            await Promise.all(promises)
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
            const properties = (rawProperties || []).map((p: any) => ({ property: String(p.property ?? p.name ?? p), name: String(p.name ?? p.property ?? p), alias: String(p.alias ?? p.name ?? p.property ?? p) }) as IMapWidgetLayerProperty)
            ;(this as any).propertiesCache?.set(targetLayer.layerId, properties)
            visualization.properties = properties
        },
        async loadAvailablePropertiesInCrossNavigationForLayer(targetLayer: IMapWidgetLayer, visualization: IMapWidgetVisualizationType) {
            this.setLoading(true)
            const raw = await getPropertiesByLayerLabel(targetLayer.label, this.dashboardId)
            this.setLoading(false)
            const properties = (raw || []).map((p: any) => ({ property: String(p.property ?? p.name ?? p), name: String(p.name ?? p.property ?? p), alias: String(p.alias ?? p.name ?? p.property ?? p) }) as IMapWidgetLayerProperty)
            this.propertiesCache.set(targetLayer.layerId, properties)
            visualization.properties = properties

            return visualization.properties
        },
        addCrossNavigationConfiguration() {
            if (this.crossNavigationDisabled) return
            if (this.crossNavigationConfiguration) this.crossNavigationConfiguration.crossNavigationVizualizationTypes.push({ vizualizationType: null, column: { name: '', alias: '', type: '' }, name: '', parameters: [] })
            this.loadParameterList()
        },
        onCrossNavigationSelected(config: IMapWidgetCrossNavigationVisualizationTypeConfig, selectedId: number) {
            const match = this.crossNavigationOptions.find((opt: any) => opt.id === selectedId)
            if (match) {
                config.id = match.id
                config.name = match.name
            }
        },
        removeCrossNavigationConfiguration(index: number) {
            if (this.crossNavigationDisabled) return
            if (this.crossNavigationConfiguration) this.crossNavigationConfiguration.crossNavigationVizualizationTypes.splice(index, 1)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.crossNavigationConfiguration) return this.visualizationTypeOptions

            const selectedLabels = this.crossNavigationConfiguration.crossNavigationVizualizationTypes
                .map((crossNavigationConfig: IMapWidgetCrossNavigationVisualizationTypeConfig, index: number) => {
                    return index !== currentIndex ? (crossNavigationConfig.vizualizationType?.label ?? null) : null
                })
                .filter((t): t is string => !!t)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => {
                const labelKey = vizualizationType.label ?? ''
                return !selectedLabels.includes(labelKey)
            })
        },
        async onVizualizationTypeChange(crossNavigationConfig: IMapWidgetCrossNavigationVisualizationTypeConfig) {
            crossNavigationConfig.column = { name: '', alias: '', type: '' }
            this.loadParameterList()
            if (!crossNavigationConfig.vizualizationType?.target) return
            const target = this.widgetModel.layers.find((layer: IMapWidgetLayer) => crossNavigationConfig.vizualizationType?.target === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(crossNavigationConfig.vizualizationType.target)) {
                crossNavigationConfig.vizualizationType.properties = this.propertiesCache.get(crossNavigationConfig.vizualizationType.target)
                return
            }
            await this.loadAvailablePropertiesInCrossNavigationForLayer(target, crossNavigationConfig.vizualizationType)
        },
        onParametersChanged(parameters: IWidgetInteractionParameter[], crossNavigationVisTypeConfig: IMapWidgetCrossNavigationVisualizationTypeConfig | null) {
            if (crossNavigationVisTypeConfig) crossNavigationVisTypeConfig.parameters = parameters
        },
        getTargetLayerType(crossNavigationVisTypeConfig: IMapWidgetCrossNavigationVisualizationTypeConfig) {
            return this.widgetModel.layers.find((layer: IMapWidgetLayer) => crossNavigationVisTypeConfig.vizualizationType?.target === layer.layerId) ? this.widgetModel.layers.find((layer: IMapWidgetLayer) => crossNavigationVisTypeConfig.vizualizationType?.target === layer.layerId).type : 'dataset'
        }
    }
})
</script>

<style lang="scss" scoped>
.cross-nav-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
