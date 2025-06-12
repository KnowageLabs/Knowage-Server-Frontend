<template>
    <div class="p-grid p-jc-start p-ai-center p-p-4">
        <form v-if="crossNavigationConfiguration" class="p-fluid p-formgrid p-grid p-col-12 p-m-1">
            <div class="p-col-12 p-d-flex p-flex-column">
                <div class="p-d-flex p-flex-column kn-flex p-mx-2 p-mb-4">
                    <label class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.interactions.crossNavigationName') }}</label>
                    <Dropdown v-model="crossNavigationConfiguration.name" class="kn-material-input" :options="crossNavigationOptions" :disabled="crossNavigationDisabled"> </Dropdown>
                </div>
            </div>

            <div v-for="(crossNavigationConfig, index) in crossNavigationConfiguration.crossNavigationVizualizationTypes" :key="index" class="row items-center q-mb-sm">
                <q-select
                    filled
                    dense
                    class="col-6"
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
                <q-select filled dense class="col-5 q-ml-sm" v-model="crossNavigationConfig.column" :options="availableColumns(crossNavigationConfig.vizualizationType)" emit-value map-options option-value="name" option-label="name" options-dense :label="$t('common.column')" :disable="crossNavigationDisabled"></q-select>

                <Button v-if="index === 0" icon="fas fa-plus-circle fa-1x" class="p-button-text p-button-plain p-js-center p-ml-2" @click="addCrossNavigationConfiguration" />
                <Button v-if="index !== 0" icon="pi pi-trash kn-cursor-pointer" class="p-button-text p-button-plain p-js-center p-ml-2" @click="removeCrossNavigationConfiguration(index)" />

                <div v-if="crossNavigationConfig.parameters" class="p-col-12 p-d-flex p-flex-row p-ai-center p-p-2">
                    <WidgetOutputParametersList class="kn-flex p-mr-2" :widget-model="widgetModel" :prop-parameters="parameterList" :selected-datasets-columns-map="selectedDatasetsColumnsMap" :disabled="crossNavigationDisabled" @change="onParametersChanged($event, crossNavigationConfig)"></WidgetOutputParametersList>
                </div>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn, IWidgetInteractionParameter } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetVisualizationType, IMapWidgetLayer, IMapWidgetCrossNavigation, IMapWidgetCrossNavigationVisualizationTypeConfig } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import Dropdown from 'primevue/dropdown'
import WidgetOutputParametersList from '../../common/interactions/crossNavigation/WidgetOutputParametersList.vue'

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
            parameterList: [] as IWidgetInteractionParameter[],
            selectedDatasetsColumnsMap: {}
        }
    },
    computed: {
        crossNavigationDisabled() {
            return !this.crossNavigationConfiguration || !this.crossNavigationConfiguration.enabled
        }
    },
    watch: {
        widgetModel: {
            handler(newVal) {
                if (newVal?.settings?.visualizations) {
                    this.loadCrossNavigationConfiguration()
                }
            },
            deep: true,
            immediate: true
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
        setEventListeners() {
            emitter.on('mapFieldsUpdated', this.loadCrossNavigationConfiguration)
        },
        removeEventListeners() {
            emitter.off('mapFieldsUpdated', this.loadCrossNavigationConfiguration)
        },
        loadCrossNavigationOptions() {
            const temp = this.store.getCrossNavigations(this.dashboardId)
            if (temp) this.crossNavigationOptions = temp.map((crossNavigation: any) => crossNavigation.crossName)
            console.log('---------- LOADED CROSS NAVIGATION OPTIONS: ', this.crossNavigationOptions)
        },
        loadOutputParameters() {
            this.outputParameters = this.store.getOutputParameters(this.dashboardId) ?? []
            console.log('---------- LOADED outputParameters: ', this.crossNavigationOptions)
        },
        loadParameterList() {
            if (!this.crossNavigationConfiguration) return

            this.crossNavigationConfiguration.crossNavigationVizualizationTypes.forEach((crossNavigationVisTypeConfig: IMapWidgetCrossNavigationVisualizationTypeConfig) => {
                this.parameterList = []
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
                    this.parameterList.push(temp)
                }
            })
        },
        loadCrossNavigationConfiguration() {
            this.crossNavigationConfiguration = this.widgetModel?.settings?.interactions?.crossNavigation ?? null
            if (this.crossNavigationConfiguration?.crossNavigationVizualizationTypes?.length === 0) this.crossNavigationConfiguration?.crossNavigationVizualizationTypes.push({ vizualizationType: null, column: null, parameters: [] })
            console.log('----- LOADED widgetModel: ', this.widgetModel)
            console.log('----- LOADED crossNavigationConfiguration: ', this.crossNavigationConfiguration)
            this.loadVisualizationTypeOptions()
            this.loadCrossNavigationOptions()
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
            console.log('----- LOADED visualizationTypeOptions: ', this.visualizationTypeOptions)
        },
        availableColumns(vizualizationType: IMapWidgetVisualizationType | null) {
            if (!vizualizationType) return null
            const mapLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => layer.layerId === vizualizationType.target)
            return mapLayer && mapLayer.type === 'dataset' ? mapLayer.columns.filter((column: IWidgetColumn) => column.fieldType === 'ATTRIBUTE') : []
        },
        addCrossNavigationConfiguration() {
            if (this.crossNavigationDisabled) return
            if (this.crossNavigationConfiguration) this.crossNavigationConfiguration.crossNavigationVizualizationTypes.push({ vizualizationType: null, column: null, parameters: [] })
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
        onVizualizationTypeChange(crossNavigationConfig: IMapWidgetCrossNavigationVisualizationTypeConfig) {
            crossNavigationConfig.column = ''
        },
        onParametersChanged(parameters: IWidgetInteractionParameter[], crossNavigationVisTypeConfig: IMapWidgetCrossNavigationVisualizationTypeConfig | null) {
            if (crossNavigationVisTypeConfig) crossNavigationVisTypeConfig.parameters = parameters
        }
    }
})
</script>
