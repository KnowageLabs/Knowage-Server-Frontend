<template>
    <div class="p-grid p-jc-start p-ai-center p-p-4">
        <form v-if="selectionConfiguration" class="p-fluid p-formgrid p-grid p-col-12 p-m-1">
            <div class="p-col-12 p-d-flex p-flex-column">
                <div v-for="(selectionConfig, index) in selectionConfiguration.selections" :key="index" class="row items-center q-mb-sm">
                    <q-select filled dense class="col-6" v-model="selectionConfig.vizualizationType" :options="getFilteredVisualizationTypeOptions(index)" emit-value map-options options-dense option-label="layerName" :label="$t('dashboard.widgetEditor.visualizationType.title')"></q-select>
                    <q-select filled dense class="col-5 q-ml-sm" v-model="selectionConfig.column" :options="availableColumns(selectionConfig.vizualizationType)" emit-value map-options option-value="name" option-label="name" options-dense :label="$t('common.column')"></q-select>

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

export default defineComponent({
    name: 'map-widget-selections-configuration',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            selectionConfiguration: null as IMapWidgetSelectionConfiguration | null,
            visualizationTypeOptions: [] as IMapWidgetVisualizationType[]
        }
    },
    computed: {},
    watch: {
        widgetModel: {
            handler(newVal) {
                if (newVal?.settings?.visualizations) {
                    this.loadSelectionConfiguration()
                }
            },
            deep: true,
            immediate: true
        }
    },
    created() {
        this.loadSelectionConfiguration()
    },
    methods: {
        loadSelectionConfiguration() {
            this.selectionConfiguration = this.widgetModel?.settings?.interactions?.selection ?? null
            if (this.selectionConfiguration?.selections?.length === 0) this.selectionConfiguration?.selections.push({ vizualizationType: null, column: '' })
            console.log('----- LOADED widgetModel: ', this.widgetModel)
            console.log('----- LOADED selectionConfiguration: ', this.selectionConfiguration)
            this.loadVisualizationTypeOptions()
        },
        loadVisualizationTypeOptions() {
            this.visualizationTypeOptions = []
            if (!this.widgetModel?.settings?.visualizations) return
            this.widgetModel.settings.visualizations.forEach((visualization: IMapWidgetVisualizationType) => {
                const mapLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => layer.layerId === visualization.target)
                if (mapLayer && mapLayer.type === 'dataset') this.visualizationTypeOptions.push(visualization)
            })
            console.log('----- LOADED visualizationTypeOptions: ', this.visualizationTypeOptions)
        },
        availableColumns(vizualizationType: IMapWidgetVisualizationType | null) {
            if (!vizualizationType) return null
            const mapLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => layer.layerId === vizualizationType.target)
            return mapLayer && mapLayer.type === 'dataset' ? mapLayer.columns : []
        },
        addSelectionConfiguration() {
            if (this.selectionConfiguration) this.selectionConfiguration.selections.push({ vizualizationType: null, column: '' })
        },
        removeSelectionConfiguration(index: number) {
            if (this.selectionConfiguration) this.selectionConfiguration.selections.splice(index, 1)
        },
        getFilteredVisualizationTypeOptions(currentIndex: number) {
            if (!this.selectionConfiguration) return this.visualizationTypeOptions

            const selectedLayerIds = this.selectionConfiguration.selections
                .map((selectionConfig: IMapWidgetSelection, index: number) => {
                    return index !== currentIndex ? selectionConfig.vizualizationType?.target : null
                })
                .filter((id): id is string => !!id)

            return this.visualizationTypeOptions.filter((vizualizationType: IMapWidgetVisualizationType) => !selectedLayerIds.includes(vizualizationType.target))
        }
    }
})
</script>
