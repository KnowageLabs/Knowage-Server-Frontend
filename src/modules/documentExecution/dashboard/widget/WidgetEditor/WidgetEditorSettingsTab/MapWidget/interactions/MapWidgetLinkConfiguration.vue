<template>
    <div class="q-px-md q-pb-sm">
        <div v-if="linkConfiguration">
            <div v-for="(linkConfig, vizIndex) in linkConfiguration.linkVizualizationTypes" :key="vizIndex">
                <div class="link-viz-row row no-wrap q-mb-sm">
                    <div class="kn-action-handle kn-action-handle-disabled"></div>
                    <div class="col q-pa-sm">
                        <div class="row q-col-gutter-sm q-mb-sm">
                            <div class="col-6">
                                <q-select outlined dense v-model="linkConfig.vizualizationType" :options="getFilteredVisualizationTypeOptions(vizIndex)" emit-value map-options option-label="label" :label="$t('dashboard.widgetEditor.visualizationType.title')" :disable="linksDisabled" @update:model-value="onVizualizationTypeChange(linkConfig)" />
                            </div>
                            <div class="col-6">
                                <q-select outlined dense v-model="linkConfig.column" :options="availableColumns(linkConfig.vizualizationType)" emit-value map-options option-label="name" :label="$t('common.column')" :disable="linksDisabled">
                                    <template #append>
                                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                            <q-tooltip>{{ $t('dashboard.widgetEditor.interactions.columnInteractionHint') }}</q-tooltip>
                                        </q-icon>
                                    </template>
                                </q-select>
                            </div>
                        </div>
                        <div v-for="(link, linkIndex) in linkConfig.links" :key="linkIndex" class="link-item-row row no-wrap q-mb-xs">
                            <div class="kn-action-handle kn-action-handle-disabled"></div>
                            <div class="col q-pa-xs">
                                <div class="row q-col-gutter-sm q-mb-xs">
                                    <div class="col-6">
                                        <q-input outlined dense v-model="link.baseurl" :label="$t('dashboard.widgetEditor.interactions.basicUrl')" :disable="linksDisabled" />
                                    </div>
                                    <div class="col-6">
                                        <q-select outlined dense v-model="link.action" :options="widgetInteractionsLinkDescriptor.linkTypes" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.interactions.linkType')" :disable="linksDisabled">
                                            <template #selected-item="slotProps"
                                                ><span>{{ getTranslatedLabel(slotProps.opt.value, widgetInteractionsLinkDescriptor.linkTypes, $t) }}</span></template
                                            >
                                            <template #option="slotProps"
                                                ><q-item v-bind="slotProps.itemProps"
                                                    ><q-item-section
                                                        ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                                                    ></q-item
                                                ></template
                                            >
                                        </q-select>
                                    </div>
                                </div>
                                <WidgetLinkParameterList :widget-model="widgetModel" :prop-parameters="link.parameters" :selected-datasets-columns-map="selectedDatasetColumnNameMap" :disabled="linksDisabled" :dashboard-id="dashboardId" @change="onParametersChanged($event, link)" @addParameter="onAddParameter(link)" @delete="onParameterDelete($event, link)" />
                            </div>
                            <div class="kn-action-handle row items-center justify-center">
                                <q-btn v-if="linkIndex === 0" flat round dense icon="add" size="sm" :disable="linksDisabled" @click="addLink(linkConfig)" />
                                <q-btn v-else flat round dense icon="delete" size="sm" :disable="linksDisabled" @click.stop="removeLink(linkIndex, linkConfig)" />
                            </div>
                        </div>
                    </div>
                    <div class="kn-action-handle row items-center justify-center">
                        <q-btn v-if="vizIndex === 0" flat round dense icon="add" size="sm" :disable="linksDisabled" @click="addLinkConfiguration()" />
                        <q-btn v-else flat round dense icon="delete" size="sm" :disable="linksDisabled" @click.stop="removeLinkConfiguration(vizIndex)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetInteractionParameter } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetVisualizationType, IMapWidgetLayer, IMapWidgetSelection, IMapWidgetLink, IMapWidgetLayerProperty, IMapWidgetLinkVisualizationTypeConfig, IMapWidgetLinkConfiguration } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { getPropertiesByLayerLabel } from '../../../../MapWidget/MapWidgetDataProxy'
import { resolveLayerByTarget } from '../../../../MapWidget/LeafletHelper'
import { mapActions } from 'pinia'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import normalizeSelectOptions from '../helpers/MapWidgetOptionsHelper'
import appStore from '@/App.store'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import widgetInteractionsLinkDescriptor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/interactions/WidgetInteractionsDescriptor.json'
import WidgetLinkParameterList from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditorSettingsTab/common/interactions/link/WidgetLinkParameterList.vue'

export default defineComponent({
    name: 'map-widget-link-configuration',
    components: { WidgetLinkParameterList },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, datasets: { type: Array as PropType<any[]> }, selectedDatasets: { type: Array as PropType<any[]> }, dashboardId: { type: String, required: true }, visible: { type: Boolean } },
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
            emitter.on('mapFieldsUpdated', this.loadLinkConfiguration)
            emitter.on('vizualizationTypesUpdated', this.onVizualizationTypesUpdated)
        },
        removeEventListeners() {
            emitter.off('mapFieldsUpdated', this.loadLinkConfiguration)
            emitter.off('vizualizationTypesUpdated', this.onVizualizationTypesUpdated)
        },
        initialLoad() {
            this.loadLinkConfiguration()
            this.loadSelectedDatasetColumnNames()
        },
        async onVizualizationTypesUpdated() {
            this.loadVisualizationTypeOptions()
            await this.loadPropertiesForVisualizationTypes()
        },
        async loadLinkConfiguration() {
            this.linkConfiguration = this.widgetModel?.settings?.interactions?.link ?? null
            if (this.linkConfiguration?.linkVizualizationTypes?.length === 0) this.linkConfiguration?.linkVizualizationTypes.push({ vizualizationType: null, column: { name: '', alias: '', type: '' }, links: [] })
            if (this.linkConfiguration?.linkVizualizationTypes?.length === 1 && this.linkConfiguration.linkVizualizationTypes[0].links.length === 0) this.linkConfiguration.linkVizualizationTypes[0].links.push({ type: '', baseurl: '', action: '', parameters: [] })
            this.loadVisualizationTypeOptions()
            await this.loadPropertiesForVisualizationTypes()
        },
        loadVisualizationTypeOptions() {
            this.visualizationTypeOptions = []
            if (!this.widgetModel?.settings?.visualizations) return
            // include visualizations whose target resolves to a layer or dataset
            this.widgetModel.settings.visualizations.forEach((visualization: IMapWidgetVisualizationType) => {
                const mapLayer = resolveLayerByTarget(this.widgetModel, visualization.target)
                if (!mapLayer) return
                // include dataset visualizations
                if (mapLayer.type === 'dataset') {
                    this.visualizationTypeOptions.push(visualization)
                    return
                }
                // include layer visualizations only if properties are already available
                if (mapLayer.type === 'layer' && visualization.properties && visualization.properties.length > 0) {
                    this.visualizationTypeOptions.push(visualization)
                }
            })
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

            const targetLayer = resolveLayerByTarget(this.widgetModel, visualization.target) as IMapWidgetLayer | null
            if (targetLayer?.type === 'layer') {
                this.setLoading(true)
                const rawProperties = await getPropertiesByLayerLabel(targetLayer.label, this.dashboardId)
                this.setLoading(false)
                // normalize properties into IMapWidgetLayerProperty shape ({ property: string, name: string, alias?: string })
                const properties: IMapWidgetLayerProperty[] = (rawProperties || []).map((p: any) => ({ property: String(p.property ?? p.name ?? p), name: String(p.name ?? p.property ?? p), alias: String(p.alias ?? p.name ?? p.property ?? p) }) as IMapWidgetLayerProperty)
                this.propertiesCache.set(targetLayer.layerId, properties)
                visualization.properties = properties
            }
        },
        addLinkConfiguration() {
            if (this.linksDisabled) return
            if (this.linkConfiguration) this.linkConfiguration.linkVizualizationTypes.push({ vizualizationType: null, column: { name: '', alias: '', type: '' }, links: [] })
        },
        removeLinkConfiguration(index: number) {
            if (this.linksDisabled) return
            if (this.linkConfiguration) this.linkConfiguration.linkVizualizationTypes.splice(index, 1)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.linkConfiguration) return this.visualizationTypeOptions

            const selectedLabels = this.linkConfiguration.linkVizualizationTypes
                .map((visualizationConfig: any, index: number) => {
                    return index !== currentIndex ? (visualizationConfig.label ?? null) : null
                })
                .filter((t): t is string => !!t)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => {
                const labelKey = vizualizationType.label ?? ''
                return !selectedLabels.includes(labelKey)
            })
        },
        async onVizualizationTypeChange(linkConfig: IMapWidgetLinkVisualizationTypeConfig) {
            linkConfig.column = { name: '', alias: '', type: '' }
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
            const raw = await getPropertiesByLayerLabel(targetLayer.label, this.dashboardId)
            this.setLoading(false)
            const properties = (raw || []).map((p: any) => ({ property: String(p.property ?? p.name ?? p), name: String(p.name ?? p.property ?? p), alias: String(p.alias ?? p.name ?? p.property ?? p) }) as IMapWidgetLayerProperty)
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

<style lang="scss" scoped>
.link-viz-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.link-item-row {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
