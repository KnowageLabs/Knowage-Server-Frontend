<template>
    <div class="p-grid p-jc-start p-ai-center p-p-4">
        <form v-if="crossNavigationConfiguration" class="p-fluid p-formgrid p-grid p-col-12 p-m-1">
            <div v-for="(crossNavigationConfig, index) in crossNavigationConfiguration.crossNavigationVizualizationTypes" :key="index" class="p-col-12 p-fluid p-formgrid p-grid">
                <div class="p-col-12 p-fluid p-formgrid p-grid p-ai-center">
                    <q-select
                        filled
                        dense
                        class="p-sm-12 p-md-4"
                        v-model="crossNavigationConfig.vizualizationType"
                        :options="getFilteredVisualizationTypeOptions(index)"
                        emit-value
                        map-options
                        options-dense
                        option-label="layerName"
                        :label="$t('dashboard.widgetEditor.visualizationType.title')"
                        :disable="crossNavigationDisabled"
                        @update:modelValue="onVizualizationTypeChange(crossNavigationConfig)"
                    ></q-select>
                    <div class="p-col-4 p-d-flex p-flex-column">
                        <div class="p-d-flex p-flex-column kn-flex p-mx-2 p-mb-4">
                            <label class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.interactions.crossNavigationName') }}</label>
                            <Dropdown v-model="crossNavigationConfig.name" class="kn-material-input" :options="crossNavigationOptions" :disabled="crossNavigationDisabled"> </Dropdown>
                        </div>
                    </div>
                    <q-select
                        filled
                        dense
                        class="p-col-3"
                        v-model="crossNavigationConfig.column"
                        :options="availableColumns(crossNavigationConfig.vizualizationType)"
                        emit-value
                        map-options
                        :option-value="getTargetLayerType(crossNavigationConfig) === 'layer' ? 'property' : 'name'"
                        :option-label="getTargetLayerType(crossNavigationConfig) === 'layer' ? 'property' : 'name'"
                        options-dense
                        :label="$t('common.column')"
                        :disable="crossNavigationDisabled"
                    ></q-select>

                    <Button v-if="index === 0" icon="fas fa-plus-circle fa-1x" class="p-button-text p-button-plain p-js-center p-ml-2" @click="addCrossNavigationConfiguration" />
                    <Button v-if="index !== 0" icon="pi pi-trash kn-cursor-pointer" class="p-button-text p-button-plain p-js-center p-ml-2" @click="removeCrossNavigationConfiguration(index)" />
                </div>
                <div v-if="crossNavigationConfig.vizualizationType?.id && parameterList[crossNavigationConfig.vizualizationType.id]" class="p-col-12 p-d-flex p-flex-row p-ai-center p-p-2">
                    <WidgetOutputParametersList
                        class="kn-flex p-mr-2"
                        :widget-model="widgetModel"
                        :prop-parameters="parameterList[crossNavigationConfig.vizualizationType.id]"
                        :selected-datasets-columns-map="selectedDatasetsColumnsMap"
                        :mapDynamicOptions="availableColumns(crossNavigationConfig.vizualizationType)"
                        :crossNavigationConfig="crossNavigationConfig"
                        :disabled="crossNavigationDisabled"
                        @change="onParametersChanged($event, crossNavigationConfig)"
                    ></WidgetOutputParametersList>
                </div>
            </div>
        </form>
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
import Dropdown from 'primevue/dropdown'
import WidgetOutputParametersList from '../../common/interactions/crossNavigation/WidgetOutputParametersList.vue'
import deepcopy from 'deepcopy'
import { getPropertiesByLayerId } from '../../../../MapWidget/MapWidgetDataProxy'

export default defineComponent({
    name: 'map-widget-cross-navigation-configuration',
    components: { Dropdown, WidgetOutputParametersList },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, datasets: { type: Array as PropType<any[]> }, selectedDatasets: { type: Array as PropType<any[]> }, dashboardId: { type: String, required: true } },
    setup() {
        const store = dashboardStore()
        return { store }
    },
    data() {
        return {
            crossNavigationConfiguration: null as IMapWidgetCrossNavigation | null,
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[],
            crossNavigationOptions: [] as string[],
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
    created() {
        this.setEventListeners()
        this.loadCrossNavigationOptions()
        this.loadCrossNavigationConfiguration()
        this.loadOutputParameters()
        this.loadParameterList()
        this.loadSelectedDatasetColumnNames()
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
        loadCrossNavigationOptions() {
            const temp = this.store.getCrossNavigations(this.dashboardId)
            if (temp) this.crossNavigationOptions = temp.map((crossNavigation: any) => crossNavigation.crossName)
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
            if (this.crossNavigationConfiguration?.crossNavigationVizualizationTypes?.length === 0) this.crossNavigationConfiguration?.crossNavigationVizualizationTypes.push({ vizualizationType: null, column: null, name: '', parameters: [] })
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
                const mapLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => layer.layerId === visualization.target)
                if (mapLayer) this.visualizationTypeOptions.push(visualization)
            })
        },
        availableColumns(vizualizationType: IMapWidgetVisualizationType | null) {
            if (!vizualizationType) return null

            const targetDataset = this.availableDatasets.find((layer: IMapWidgetLayer) => layer.layerId === vizualizationType.target)
            if (targetDataset) return targetDataset.columns ?? []

            const targetLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => layer.layerId === vizualizationType.target)
            if (targetLayer && this.propertiesCache.has(targetLayer.layerId)) return this.propertiesCache.get(targetLayer.layerId)

            return []
        },
        async loadPropertiesForVisualizationTypes() {
            if (!this.crossNavigationConfiguration) return
            const promises = this.crossNavigationConfiguration.crossNavigationVizualizationTypes.filter((config: IMapWidgetCrossNavigationVisualizationTypeConfig) => config.vizualizationType).map((config: IMapWidgetCrossNavigationVisualizationTypeConfig) => this.loadAvailableProperties(config.vizualizationType))
            await Promise.all(promises)
        },
        async loadAvailableProperties(visualization: IMapWidgetVisualizationType | null) {
            if (!visualization || !visualization.target) return

            if (this.propertiesCache.has(visualization.target)) {
                visualization.properties = this.propertiesCache.get(visualization.target)
                return
            }

            const targetLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => visualization.target === layer.layerId)
            if (targetLayer?.type === 'layer') {
                this.setLoading(true)
                const properties = await getPropertiesByLayerId(targetLayer.id)
                this.setLoading(false)
                this.propertiesCache.set(targetLayer.layerId, properties)
                visualization.properties = properties
            }
        },
        async loadAvailablePropertiesInCrossNavigationForLayer(targetLayer: IMapWidgetLayer, visualization: IMapWidgetVisualizationType) {
            this.setLoading(true)
            const properties = await getPropertiesByLayerId(targetLayer.id)
            this.setLoading(false)
            this.propertiesCache.set(targetLayer.layerId, properties)
            visualization.properties = properties

            return visualization.properties
        },
        addCrossNavigationConfiguration() {
            if (this.crossNavigationDisabled) return
            if (this.crossNavigationConfiguration) this.crossNavigationConfiguration.crossNavigationVizualizationTypes.push({ vizualizationType: null, column: null, name: '', parameters: [] })
            this.loadParameterList()
        },
        removeCrossNavigationConfiguration(index: number) {
            if (this.crossNavigationDisabled) return
            if (this.crossNavigationConfiguration) this.crossNavigationConfiguration.crossNavigationVizualizationTypes.splice(index, 1)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.crossNavigationConfiguration) return this.visualizationTypeOptions

            const selectedLayerIds = this.crossNavigationConfiguration.crossNavigationVizualizationTypes
                .map((crossNavigationConfig: IMapWidgetCrossNavigationVisualizationTypeConfig, index: number) => {
                    return index !== currentIndex ? crossNavigationConfig.vizualizationType?.target : null
                })
                .filter((id): id is string => !!id)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => !selectedLayerIds.includes(vizualizationType.target))
        },
        async onVizualizationTypeChange(crossNavigationConfig: IMapWidgetCrossNavigationVisualizationTypeConfig) {
            crossNavigationConfig.column = ''
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
