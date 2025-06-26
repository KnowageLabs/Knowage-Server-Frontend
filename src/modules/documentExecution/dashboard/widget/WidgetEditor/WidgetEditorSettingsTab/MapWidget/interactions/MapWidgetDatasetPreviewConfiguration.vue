<template>
    <div class="p-grid p-jc-center p-ai-center p-p-4">
        <form v-if="previewConfiguration" class="p-fluid p-formgrid p-grid p-col-12 p-m-1">
            <div v-for="(previewConfig, index) in previewConfiguration.previewVizualizationTypes" :key="index" class="p-col-12 p-fluid p-formgrid p-grid">
                <div class="p-col-12 p-fluid p-formgrid p-grid p-ai-center">
                    <q-select filled dense class="p-sm-12 p-md-4" v-model="previewConfig.vizualizationType" :options="getFilteredVisualizationTypeOptions(index)" emit-value map-options options-dense option-label="layerName" :label="$t('dashboard.widgetEditor.visualizationType.title')" :disable="previewDisabled" @update:modelValue="onVizualizationTypeChange(previewConfig)"></q-select>
                    <q-select filled dense class="p-sm-12 p-md-4 p-px-2" v-model="previewConfig.column" :options="availableColumns(previewConfig.vizualizationType)" emit-value map-options option-value="name" option-label="name" options-dense :label="$t('common.column')" :disable="previewDisabled"></q-select>

                    <div class="p-sm-12 p-md-3 p-px-2">
                        <div class="p-d-flex p-flex-column kn-flex">
                            <label class="kn-material-input-label"> {{ $t('common.dataset') }}</label>
                            <Dropdown v-model="previewConfig.dataset" class="kn-material-input" :options="selectedDatasets" option-label="name" option-value="id.dsId" :disabled="previewDisabled" @change="onDatasetChanged(previewConfig)"> </Dropdown>
                        </div>
                    </div>

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
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
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
            selectedDatasetColumnNameMap: {}
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
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
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
                const mapLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => layer.layerId === visualization.target)
                if (mapLayer && mapLayer.type === 'dataset') this.visualizationTypeOptions.push(visualization)
            })
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.previewConfiguration) return this.visualizationTypeOptions

            const selectedLayerIds = this.previewConfiguration.previewVizualizationTypes
                .map((crossNavigationConfig: IMapWidgetPreviewVisualizationTypeConfig, index: number) => {
                    return index !== currentIndex ? crossNavigationConfig.vizualizationType?.target : null
                })
                .filter((id): id is string => !!id)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => !selectedLayerIds.includes(vizualizationType.target))
        },
        async onVizualizationTypeChange(previewConfig: IMapWidgetPreviewVisualizationTypeConfig) {
            previewConfig.column = ''
            if (!previewConfig.vizualizationType?.target) return
            this.loadParameterList()
        },
        onParametersChanged(parameters: IWidgetInteractionParameter[], previewConfig: IMapWidgetPreviewVisualizationTypeConfig) {
            if (previewConfig) previewConfig.parameters = parameters
        },
        availableColumns(vizualizationType: IMapWidgetVisualizationType | null) {
            if (!vizualizationType) return null

            const targetDataset = this.availableDatasets.find((layer: IMapWidgetLayer) => layer.layerId === vizualizationType.target)
            return targetDataset ? targetDataset.columns : []
        },
        onDatasetChanged(previewConfig: IMapWidgetPreviewVisualizationTypeConfig | null) {
            if (!previewConfig) return
            previewConfig.column = ''
            previewConfig.parameters = []
            const index = this.dashboardDatasets.findIndex((dataset: any) => dataset.id === previewConfig?.dataset)
            if (index !== -1)
                previewConfig.parameters = this.dashboardDatasets[index].parameters.map((tempParameter: IDatasetParameter) => {
                    return {
                        enabled: true,
                        name: tempParameter.name,
                        type: '',
                        value: ''
                    }
                })
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
