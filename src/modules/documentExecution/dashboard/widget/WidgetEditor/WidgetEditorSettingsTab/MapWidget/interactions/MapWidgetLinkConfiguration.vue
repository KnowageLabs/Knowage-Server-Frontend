<template>
    <div class="p-grid p-jc-start p-ai-center p-p-4">
        <form v-if="linkConfiguration" class="p-fluid p-formgrid p-grid p-col-12 p-m-1">
            <div class="p-col-12 p-fluid p-formgrid p-grid">
                <div v-for="(linkConfig, index) in linkConfiguration.linkVizualizationTypes" :key="index" class="p-col-12 p-fluid p-formgrid p-grid">
                    <div class="p-col-12">
                        {{ linkConfig }}
                    </div>

                    <div class="p-col-12 p-fluid p-formgrid p-grid p-ai-center">
                        <q-select
                            filled
                            dense
                            class="p-sm-12 p-md-4"
                            v-model="linkConfig.vizualizationType"
                            :options="getFilteredVisualizationTypeOptions(index)"
                            emit-value
                            map-options
                            options-dense
                            option-label="layerName"
                            :label="$t('dashboard.widgetEditor.visualizationType.title')"
                            :disable="linksDisabled"
                            @update:modelValue="onVizualizationTypeChange(linkConfig)"
                        ></q-select>
                        <q-select filled dense class="p-sm-12 p-md-4 q-ml-sm" v-model="linkConfig.column" :options="availableColumns(linkConfig.vizualizationType)" emit-value map-options option-value="name" option-label="name" options-dense :label="$t('common.column')" :disable="linksDisabled"></q-select>

                        <Button v-if="index === 0" icon="fas fa-plus-circle fa-1x" class="p-button-text p-button-plain p-js-center p-ml-2" @click="addLinkConfiguration" />
                        <Button v-if="index !== 0" icon="pi pi-trash kn-cursor-pointer" class="p-button-text p-button-plain p-js-center p-ml-2" @click="removeLinkConfiguration(index)" />
                    </div>

                    <div v-for="(link, index) in linkConfig.links" :key="index" class="p-sm-12 p-md-12 p-fluid p-formgrid p-grid p-ai-center">
                        <div class="p-col-5 kn-flex p-d-flex p-flex-column p-pt-2 p-ml-2">
                            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.interactions.basicUrl') }}</label>
                            <InputText v-model="link.baseurl" class="kn-material-input p-inputtext-sm" :disabled="linksDisabled" />
                        </div>

                        <div class="p-col-5 kn-flex p-d-flex p-flex-column p-mx-2">
                            <label class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.interactions.linkType') }}</label>
                            <Dropdown v-model="link.action" class="kn-material-input" :options="widgetInteractionsLinkDescriptor.linkTypes" option-value="value" :disabled="linksDisabled">
                                <template #value="slotProps">
                                    <div>
                                        <span>{{ getTranslatedLabel(slotProps.value, widgetInteractionsLinkDescriptor.linkTypes, $t) }}</span>
                                    </div>
                                </template>
                                <template #option="slotProps">
                                    <div>
                                        <span>{{ $t(slotProps.option.label) }}</span>
                                    </div>
                                </template>
                            </Dropdown>
                        </div>

                        <div class="p-col-2 p-text-left p-mt-3 p-ml-3">
                            <i :class="[index === 0 ? 'pi pi-plus-circle' : 'pi pi-trash']" class="kn-cursor-pointer" @click="index === 0 ? addLink(linkConfig) : removeLink(index, linkConfig)"></i>
                        </div>

                        <div class="p-sm-12 p-md-12 p-mt-4">
                            <WidgetLinkParameterList
                                class="kn-flex p-mr-2"
                                :widget-model="widgetModel"
                                :prop-parameters="link.parameters"
                                :selected-datasets-columns-map="selectedDatasetColumnNameMap"
                                :disabled="linksDisabled"
                                :dashboard-id="dashboardId"
                                @change="onParametersChanged($event, link)"
                                @addParameter="onAddParameter(link)"
                                @delete="onParameterDelete($event, link)"
                            ></WidgetLinkParameterList>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetInteractionParameter } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetVisualizationType, IMapWidgetLayer, IMapWidgetSelection, IMapWidgetLink, IMapWidgetLayerProperty, IMapWidgetLinkVisualizationTypeConfig, IMapWidgetLinkConfiguration } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { getPropertiesByLayerId } from '../../../../MapWidget/MapWidgetDataProxy'
import { mapActions } from 'pinia'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import appStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import Dropdown from 'primevue/dropdown'
import widgetInteractionsLinkDescriptor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/interactions/WidgetInteractionsDescriptor.json'
import WidgetLinkParameterList from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/interactions/link/WidgetLinkParameterList.vue'

export default defineComponent({
    name: 'map-widget-link-configuration',
    components: { Dropdown, WidgetLinkParameterList },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, datasets: { type: Array as PropType<any[]> }, selectedDatasets: { type: Array as PropType<any[]> }, dashboardId: { type: String, required: true } },
    setup() {
        const store = dashboardStore()
        return { store }
    },
    data() {
        return {
            widgetInteractionsLinkDescriptor,
            linkConfiguration: null as IMapWidgetLinkConfiguration | null,
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[],
            selectedDatasetsColumnsMap: {},
            outputParameters: [] as any[],
            parameterList: {} as Record<string, IWidgetInteractionParameter[]>,
            propertiesCache: new Map<string, IMapWidgetLayerProperty[]>(),
            selectedDatasetColumnNameMap: {},
            getTranslatedLabel
        }
    },
    computed: {
        linksDisabled() {
            return !this.linkConfiguration || !this.linkConfiguration.enabled
        },
        availableDatasets() {
            if (!this.widgetModel?.layers) return []
            return this.widgetModel.layers.filter((layer: IMapWidgetLayer) => layer.type === 'dataset')
        }
    },
    watch: {
        widgetModel: {
            handler(newVal) {
                if (newVal?.settings?.visualizations) {
                    this.loadLinkConfiguration()
                }
            },
            deep: true,
            immediate: true
        }
    },
    created() {
        this.setEventListeners()
        this.loadLinkConfiguration()
        this.loadSelectedDatasetColumnNames()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        setEventListeners() {
            emitter.on('mapFieldsUpdated', this.loadLinkConfiguration)
        },
        removeEventListeners() {
            emitter.off('mapFieldsUpdated', this.loadLinkConfiguration)
        },
        async loadLinkConfiguration() {
            this.linkConfiguration = this.widgetModel?.settings?.interactions?.link ?? null
            if (this.linkConfiguration?.linkVizualizationTypes?.length === 0) this.linkConfiguration?.linkVizualizationTypes.push({ vizualizationType: null, column: '', links: [] })
            if (this.linkConfiguration?.linkVizualizationTypes?.length === 1 && this.linkConfiguration.linkVizualizationTypes[0].links.length === 0) this.linkConfiguration.linkVizualizationTypes[0].links.push({ type: '', baseurl: '', action: '', parameters: [] })
            this.loadVisualizationTypeOptions()
            await this.loadPropertiesForVisualizationTypes()
            console.log('-------- widgetModel: ', this.widgetModel)
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
            if (!this.linkConfiguration) return
            const promises = this.linkConfiguration.linkVizualizationTypes.filter((config: IMapWidgetLinkVisualizationTypeConfig) => config.vizualizationType).map((config: IMapWidgetLinkVisualizationTypeConfig) => this.loadAvailableProperties(config.vizualizationType))
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
        addLinkConfiguration() {
            if (this.linksDisabled) return
            if (this.linkConfiguration) this.linkConfiguration.linkVizualizationTypes.push({ vizualizationType: null, column: '', links: [] })
        },
        removeLinkConfiguration(index: number) {
            if (this.linksDisabled) return
            if (this.linkConfiguration) this.linkConfiguration.linkVizualizationTypes.splice(index, 1)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.linkConfiguration) return this.visualizationTypeOptions

            const selectedLayerIds = this.linkConfiguration.linkVizualizationTypes
                .map((selectionConfig: IMapWidgetSelection, index: number) => {
                    return index !== currentIndex ? selectionConfig.vizualizationType?.target : null
                })
                .filter((id): id is string => !!id)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => !selectedLayerIds.includes(vizualizationType.target))
        },
        async onVizualizationTypeChange(linkConfig: IMapWidgetLinkVisualizationTypeConfig) {
            linkConfig.column = ''
            if (!linkConfig.vizualizationType?.target) return
            const target = this.widgetModel.layers.find((layer: IMapWidgetLayer) => linkConfig.vizualizationType?.target === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(linkConfig.vizualizationType.target)) {
                linkConfig.vizualizationType.properties = this.propertiesCache.get(linkConfig.vizualizationType.target)
                return
            }
            await this.loadAvailablePropertiesInLinkConfigurationForLayer(target, linkConfig.vizualizationType)
        },
        async loadAvailablePropertiesInLinkConfigurationForLayer(targetLayer: IMapWidgetLayer, visualization: IMapWidgetVisualizationType) {
            this.setLoading(true)
            const properties = await getPropertiesByLayerId(targetLayer.id)
            this.setLoading(false)
            this.propertiesCache.set(targetLayer.layerId, properties)
            visualization.properties = properties

            return visualization.properties
        },
        loadSelectedDatasetColumnNames() {
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return
            this.selectedDatasets.forEach((dataset: any) => this.loadSelectedDatasetColumnName(dataset))
        },
        loadSelectedDatasetColumnName(dataset: any) {
            this.selectedDatasetColumnNameMap[dataset.name] = []
            for (let i = 0; i < dataset.metadata.fieldsMeta.length; i++) {
                this.selectedDatasetColumnNameMap[dataset.name].push(dataset.metadata.fieldsMeta[i].name)
            }
        },
        addLink(linkConfig: IMapWidgetLinkVisualizationTypeConfig) {
            if (!linkConfig || this.linksDisabled) return
            linkConfig.links.push({ type: '', baseurl: '', action: '', parameters: [] })
        },
        removeLink(index: number, linkConfig: IMapWidgetLinkVisualizationTypeConfig) {
            if (!linkConfig || this.linksDisabled) return
            linkConfig.links.splice(index, 1)
        },
        onParametersChanged(parameters: IWidgetInteractionParameter[], link: IMapWidgetLink) {
            link.parameters = parameters
        },
        onAddParameter(link: IMapWidgetLink) {
            link.parameters.push({ enabled: true, name: '', type: '', dataType: '' })
        },
        onParameterDelete(index: number, link: IMapWidgetLink) {
            link.parameters.splice(index, 1)
        }
    }
})
</script>
