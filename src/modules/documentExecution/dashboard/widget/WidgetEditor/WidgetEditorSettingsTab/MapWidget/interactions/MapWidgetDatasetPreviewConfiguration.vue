<template>
    <div class="p-grid p-jc-center p-ai-center p-p-4">
        <form v-if="previewConfiguration" class="p-fluid p-formgrid p-grid p-col-12 p-m-1">
            <div v-for="(previewConfig, index) in previewConfiguration.previewVizualizationTypes" :key="index" class="p-col-12 p-fluid p-formgrid p-grid">
                <div class="p-col-12 p-fluid p-formgrid p-grid p-ai-center">
                    <q-select filled dense class="p-sm-12 p-md-4" v-model="previewConfig.vizualizationType" :options="getFilteredVisualizationTypeOptions(index)" emit-value map-options options-dense option-label="label" :label="$t('dashboard.widgetEditor.visualizationType.title')" :disable="previewDisabled" @update:modelValue="onVizualizationTypeChange(previewConfig)"></q-select>
                    <div class="p-sm-12 p-md-3 p-px-2">
                        <div class="p-d-flex p-flex-column kn-flex">
                            <label class="kn-material-input-label"> {{ $t('common.dataset') }}</label>
                            <Dropdown v-model="previewConfig.dataset" class="kn-material-input" :options="selectedDatasets" option-label="name" option-value="id.dsId" :disabled="previewDisabled" @change="onDatasetChanged(previewConfig)"> </Dropdown>
                        </div>
                    </div>
                    <q-select filled dense class="p-sm-12 p-md-4 p-px-2" v-model="previewConfig.column" :options="availableColumns(previewConfig.vizualizationType)" emit-value map-options option-label="name" options-dense :label="$t('common.column')" :disable="previewDisabled"></q-select>

                    <Button v-if="index === 0" icon="fas fa-plus-circle fa-1x" class="p-md-2 p-button-text p-button-plain p-js-center p-ml-2" @click="addPreviewConfiguration" />
                    <Button v-if="index !== 0" icon="pi pi-trash kn-cursor-pointer" class="p-md-2 p-button-text p-button-plain p-js-center p-ml-2" @click="removePreviewConfiguration(index)" />
                </div>

                <div v-if="previewConfig.vizualizationType?.id" class="p-col-12 p-d-flex p-flex-row p-ai-center p-p-2">
                    <WidgetOutputParametersList class="kn-flex p-mr-2" :widget-model="widgetModel" :prop-parameters="previewConfig.parameters" :selected-datasets-columns-map="selectedDatasetColumnNameMap" :mapDynamicOptions="availableColumns(previewConfig.vizualizationType)" :preview-config="previewConfig" :dashboard-id="dashboardId" :disabled="previewDisabled" @change="onParametersChanged($event, previewConfig)"></WidgetOutputParametersList>
                </div>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetInteractionParameter, IDataset, IDatasetParameter } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLayer, IMapWidgetPreview, IMapWidgetPreviewVisualizationTypeConfig, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import normalizeSelectOptions from '../helpers/MapWidgetOptionsHelper'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import { IMapWidgetLayerProperty } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import WidgetOutputParametersList from '../../common/interactions/crossNavigation/WidgetOutputParametersList.vue'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'map-widget-dataset-preview-configuration',
    components: {
        Checkbox,
        Dropdown,
        WidgetOutputParametersList
    },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true },
        visible: { type: Boolean }
    },
    setup() {
        const store = dashboardStore()
        return { store }
    },
    data() {
        return {
            previewConfiguration: null as IMapWidgetPreview | null,
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[],
            crossNavigationOptions: [] as string[],
            outputParameters: [] as any[],
            parameterList: {} as Record<string, IWidgetInteractionParameter[]>,
            dashboardDatasets: [] as any[],
            selectedDatasetColumnIdMap: {},
            selectedDatasetColumnNameMap: {},
            propertiesCache: new Map<string, IMapWidgetLayerProperty[]>()
        }
    },
    computed: {
        previewDisabled() {
            return !this.previewConfiguration || !this.previewConfiguration.enabled
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
        // preload properties for layer visualizations so they appear in options immediately
        if (this.widgetModel?.settings?.visualizations) {
            this.widgetModel.settings.visualizations.forEach(async (viz: IMapWidgetVisualizationType) => {
                const target = resolveLayerByTarget(this.widgetModel, viz.target)
                if (target && target.type === 'layer') await this.loadAvailableProperties(viz)
            })
            this.loadVisualizationTypeOptions()
        }
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        setEventListeners() {
            emitter.on('mapFieldsUpdated', this.loadPreviewModel)
        },
        removeEventListeners() {
            emitter.off('mapFieldsUpdated', this.loadPreviewModel)
        },
        initialLoad() {
            this.loadPreviewModel()
            this.loadDatasetsFromModel()
            this.loadOutputParameters()
            this.loadParameterList()
            this.loadSelectedDatasetColumnNames()
        },
        loadPreviewModel() {
            if (this.widgetModel?.settings?.interactions?.preview) this.previewConfiguration = this.widgetModel.settings.interactions.preview
            if (this.previewConfiguration?.previewVizualizationTypes?.length === 0) this.previewConfiguration?.previewVizualizationTypes.push({ vizualizationType: null, dataset: null, column: null, name: '', parameters: [] })
            this.loadVisualizationTypeOptions()
        },
        loadCrossNavigationOptions() {
            const temp = this.store.getCrossNavigations(this.dashboardId)
            if (temp) this.crossNavigationOptions = temp.map((crossNavigation: any) => crossNavigation.crossName)
        },
        loadDatasetsFromModel() {
            const dashboardModel = this.store.getDashboard(this.dashboardId)
            this.dashboardDatasets = dashboardModel?.configuration.datasets
        },
        loadOutputParameters() {
            this.outputParameters = this.store.getOutputParameters(this.dashboardId) ?? []
        },
        loadParameterList() {
            if (!this.previewConfiguration) return

            this.previewConfiguration.previewVizualizationTypes.forEach((previewVisTypeConfig: IMapWidgetPreviewVisualizationTypeConfig) => {
                if (!previewVisTypeConfig.vizualizationType?.id || this.parameterList[previewVisTypeConfig.vizualizationType.id]) return
                this.parameterList[previewVisTypeConfig.vizualizationType.id] = []
                for (let i = 0; i < this.outputParameters.length; i++) {
                    const outputParameter = this.outputParameters[i]
                    const temp = { enabled: false, name: outputParameter.name, type: '' } as IWidgetInteractionParameter
                    const index = previewVisTypeConfig.parameters.findIndex((parameter: IWidgetInteractionParameter) => parameter.name === outputParameter.name)
                    if (index !== -1) {
                        const modelParameter = previewVisTypeConfig?.parameters[index]
                        temp.enabled = modelParameter.enabled
                        temp.type = modelParameter.type
                        temp.value = modelParameter.value
                        temp.dataType = modelParameter.dataType
                        if (modelParameter.column) temp.column = modelParameter.column
                        if (modelParameter.dataset) temp.dataset = modelParameter.dataset
                    }
                    this.parameterList[previewVisTypeConfig.vizualizationType.id].push(deepcopy(temp))
                }
            })
        },
        loadSelectedDatasetColumnNames() {
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return
            this.selectedDatasets.forEach((dataset: IDataset) => this.loadCrossSelectedDatasetColumnName(dataset))
        },
        loadCrossSelectedDatasetColumnName(dataset: IDataset) {
            this.selectedDatasetColumnNameMap[dataset.name] = []
            this.selectedDatasetColumnIdMap[dataset.id.dsId] = []
            for (let i = 0; i < dataset.metadata.fieldsMeta.length; i++) {
                this.selectedDatasetColumnIdMap[dataset.id.dsId].push(dataset.metadata.fieldsMeta[i].name)
                this.selectedDatasetColumnNameMap[dataset.name].push(dataset.metadata.fieldsMeta[i].name)
            }
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
                if (mapLayer.type === 'layer' && visualization.properties && visualization.properties.length > 0) this.visualizationTypeOptions.push(visualization)
            })
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.previewConfiguration) return this.visualizationTypeOptions

            const selectedLabels = this.previewConfiguration.previewVizualizationTypes
                .map((visualizationConfig: any, index: number) => {
                    return index !== currentIndex ? visualizationConfig.label ?? null : null
                })
                .filter((t): t is string => !!t)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => {
                const labelKey = vizualizationType.label ?? ''
                return !selectedLabels.includes(labelKey)
            })
        },
        async onVizualizationTypeChange(previewConfig: IMapWidgetPreviewVisualizationTypeConfig) {
            previewConfig.column = ''
            if (!previewConfig.vizualizationType?.target) return
            // if visualization targets a dataset, ensure dataset list is available
            const target = resolveLayerByTarget(this.widgetModel, previewConfig.vizualizationType.target)
            if (target && target.type === 'dataset') {
                // select a default dataset if none is chosen
                if (!previewConfig.dataset && this.dashboardDatasets && this.dashboardDatasets.length > 0) {
                    previewConfig.dataset = this.dashboardDatasets[0].id
                }
                // populate parameters from the selected dataset
                if (previewConfig.dataset) this.onDatasetChanged(previewConfig)
            } else if (target && target.type === 'layer') {
                // for layer targets, ensure properties are loaded and normalized
                if (!previewConfig.vizualizationType.properties || previewConfig.vizualizationType.properties.length === 0) {
                    await this.loadAvailableProperties(previewConfig.vizualizationType)
                }
            }
            this.loadParameterList()
        },

        async loadAvailableProperties(visualization: IMapWidgetVisualizationType | null) {
            if (!visualization || !visualization.target) return

            if (this.propertiesCache.has(visualization.target)) {
                visualization.properties = this.propertiesCache.get(visualization.target)
                return
            }

            const targetLayer = resolveLayerByTarget(this.widgetModel, visualization.target) as IMapWidgetLayer | null
            if (targetLayer?.type === 'layer') {
                this.setLoading(true)
                const rawProperties = await getPropertiesByLayerLabel(targetLayer.label)
                this.setLoading(false)
                const properties: IMapWidgetLayerProperty[] = (rawProperties || []).map((p: any) => ({ property: String(p.property ?? p.name ?? p), name: String(p.property ?? p.name ?? p) } as any))
                this.propertiesCache.set(targetLayer.layerId, properties)
                visualization.properties = properties
            }
        },
        onParametersChanged(parameters: IWidgetInteractionParameter[], previewConfig: IMapWidgetPreviewVisualizationTypeConfig) {
            if (previewConfig) previewConfig.parameters = parameters
        },
        availableColumns(vizualizationType: IMapWidgetVisualizationType | null): any[] {
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
        onDatasetChanged(previewConfig: IMapWidgetPreviewVisualizationTypeConfig | null) {
            if (!previewConfig) return
            previewConfig.column = ''
            previewConfig.parameters = []
            const index = this.dashboardDatasets.findIndex((dataset: any) => dataset.id === previewConfig?.dataset)
            if (index !== -1) {
                previewConfig.parameters = this.dashboardDatasets[index].parameters.map((tempParameter: IDatasetParameter) => {
                    return {
                        enabled: true,
                        name: tempParameter.name,
                        type: '',
                        value: ''
                    }
                })
                // also set previewConfig.column if columns are available in the dataset
                const dsColumns = this.dashboardDatasets[index].parameters?.filter((p: any) => p.name) ?? []
                if (dsColumns.length > 0 && !previewConfig.column) previewConfig.column = dsColumns[0].name
            }
        },
        addPreviewConfiguration() {
            if (this.previewDisabled) return
            if (this.previewConfiguration) this.previewConfiguration.previewVizualizationTypes.push({ vizualizationType: null, dataset: null, column: null, name: '', parameters: [] })
            this.loadParameterList()
        },
        removePreviewConfiguration(index: number) {
            if (this.previewDisabled) return
            if (this.previewConfiguration) this.previewConfiguration.previewVizualizationTypes.splice(index, 1)
        }
    }
})
</script>
