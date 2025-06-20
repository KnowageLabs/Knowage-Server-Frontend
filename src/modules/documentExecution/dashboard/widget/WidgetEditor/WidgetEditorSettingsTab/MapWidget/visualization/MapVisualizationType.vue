<template>
    <div v-for="(visType, visTypeIndex) in visualizationTypeModel" :key="visTypeIndex" class="p-d-flex p-flex-column p-m-3 widget-editor-card">
        <div class="dynamic-form-item p-grid p-col-12 p-ai-center">
            <div v-show="dropzoneTopVisible[visTypeIndex]" class="p-col-12 p-px-3" @drop.stop="onDropComplete($event, 'before', visTypeIndex)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
            <div class="p-col-12 form-list-item-dropzone p-m-1" :class="{ 'form-list-item-dropzone-active': dropzoneTopVisible[visTypeIndex] }" @drop.stop="onDropComplete($event, 'before', visTypeIndex)" @dragover.prevent @dragenter.prevent="displayDropzone('top', visTypeIndex)" @dragleave.prevent="hideDropzone('top', visTypeIndex)"></div>

            <div class="p-col-12 p-grid p-p-0" @dragstart.stop="onDragStart($event, visTypeIndex)">
                <div class="p-col-1 p-d-flex p-flex-column p-jc-center p-ai-center">
                    <i class="pi pi-th-large kn-cursor-pointer"></i>
                </div>
                <div class="p-col-11 p-d-flex p-flex-column">
                    <div class="row items-center q-mb-sm">
                        <q-select filled dense class="col" v-model="visType.target" :options="availableLayersOptions" emit-value map-options option-value="layerId" option-label="name" options-dense :label="$t('common.layer')" @update:modelValue="onTargetChange($event, visType)"></q-select>

                        <q-select v-if="visType && getTargetLayerType(visType) === 'layer' && visType.type !== 'geography'" filled dense class="col q-ml-sm" v-model="visType.targetType" :options="['column', 'property']" emit-value map-options option-value="name" option-label="name" options-dense label="Data Link" @update:modelValue="onDataLinkChange($event, visType)"></q-select>

                        <q-select v-if="getTargetLayerType(visType) === 'layer' && visType.targetType === 'column' && visType.type !== 'geography'" filled dense class="col q-ml-sm" v-model="visType.targetDataset" :options="availableDatasets" emit-value map-options option-value="name" option-label="name" options-dense :label="$t('common.dataset')" @update:modelValue="updateMapWidgetLegendWithSepecificModel(visType)"></q-select>

                        <q-select
                            v-if="visType.type !== 'geography' && visType.type !== 'pies' && (getTargetLayerType(visType) === 'dataset' || (visType.targetType === 'column' && visType.targetDataset))"
                            filled
                            dense
                            class="col q-ml-sm"
                            v-model="visType.targetMeasure"
                            :options="availableMeasures(visType.targetDataset || visType.target)"
                            emit-value
                            map-options
                            option-value="name"
                            option-label="name"
                            options-dense
                            :label="$t('common.measure')"
                            @update:modelValue="updateMapWidgetLegendWithSepecificModel(visType)"
                        ></q-select>
                        <q-select
                            v-if="visType.type === 'pies' && visType.targetType === 'column' && visType.targetDataset"
                            filled
                            dense
                            multiple
                            class="col q-ml-sm"
                            v-model="visType.targetDatasetMeasures"
                            :options="availableMeasures(visType.targetDataset || visType.target)"
                            emit-value
                            map-options
                            option-value="name"
                            option-label="name"
                            options-dense
                            :label="$t('dashboard.widgetEditor.map.targetDatasetMeasures')"
                            @update:modelValue="updateMapWidgetLegendWithSepecificModel(visType)"
                        ></q-select>

                        <q-select
                            v-if="visType.type !== 'geography' && visType.targetType === 'column' && visType.targetDataset"
                            filled
                            dense
                            class="col q-ml-sm"
                            v-model="visType.targetDatasetForeignKeyColumn"
                            :options="availableTargetDatasetColumns(visType.targetDataset || visType.target)"
                            emit-value
                            map-options
                            option-value="name"
                            option-label="name"
                            options-dense
                            :label="$t('dashboard.widgetEditor.map.targetDatasetColumn')"
                            @update:modelValue="updateMapWidgetLegendWithSepecificModel(visType)"
                        ></q-select>

                        <q-select
                            v-if="getTargetLayerType(visType) === 'layer' && ((visType.targetType === 'column' && visType.targetDataset) || !['geography', 'pies'].includes(visType.type))"
                            filled
                            dense
                            class="col q-ml-sm"
                            v-model="visType.targetProperty"
                            :options="visType.properties || []"
                            emit-value
                            map-options
                            option-value="property"
                            option-label="property"
                            options-dense
                            :label="$t('common.properties')"
                            @update:modelValue="updateMapWidgetLegendWithSepecificModel(visType)"
                        ></q-select>

                        <q-select
                            v-if="visType && visType.type === 'pies' && visType.targetType !== 'column'"
                            filled
                            dense
                            multiple
                            class="col q-ml-sm"
                            v-model="visType.chartMeasures"
                            :options="availableChartMeasures(visType.targetDataset || visType.target)"
                            emit-value
                            map-options
                            :option-value="getTargetLayerType(visType) === 'layer' && visType.targetType !== 'column' ? 'property' : 'name'"
                            :option-label="getTargetLayerType(visType) === 'layer' && visType.targetType !== 'column' ? 'property' : 'name'"
                            options-dense
                            :label="$t('common.measures')"
                            @update:modelValue="updateMapWidgetLegendWithSepecificModel(visType)"
                        ></q-select>

                        <span class="p-d-flex p-flex-row p-ai-center p-pl-2">
                            {{ $t('common.show') }}
                            <q-toggle v-model="visType.visible" color="primary" />
                        </span>
                        <Button v-if="visTypeIndex === 0" icon="fas fa-plus-circle fa-1x" class="p-button-text p-button-plain p-js-center p-ml-2" @click="addVisualizationType" />
                        <Button v-if="visTypeIndex !== 0" icon="pi pi-trash kn-cursor-pointer" class="p-button-text p-button-plain p-js-center p-ml-2" @click="removeVisualizationType(visTypeIndex)" />
                    </div>

                    <div class="p-grid gap-1 p-m-0" style="column-gap: 0.5em; row-gap: 0.5em">
                        <div v-for="(visTypeConfig, visTypeConfigIndex) in descriptor.visTypes" :key="visTypeConfigIndex" v-tooltip.bottom="$t(visTypeConfig.tooltip)" class="visTypeCards" :class="{ selected: visType.type === visTypeConfig.name }" @click="selectVisTypeConfig(visTypeIndex, visTypeConfig.name)">
                            <img class="kn-width-full kn-height-full" :src="getImageSource(visTypeConfig.name)" />
                        </div>
                    </div>

                    <hr class="kn-width-full p-my-2" />

                    <VisTypeConfig :widget-model="widgetModel" :vis-type-prop="visType" @marker-configuration-updated="onMarkerConfigurationUpdated(visType)" />
                </div>
            </div>

            <div class="p-col-12 form-list-item-dropzone p-m-1" :class="dropzoneBottomVisible[visTypeIndex] ? 'form-list-item-dropzone-active' : ''" @drop.stop="onDropComplete($event, 'after', visTypeIndex)" @dragover.prevent @dragenter.prevent="displayDropzone('bottom', visTypeIndex)" @dragleave.prevent="hideDropzone('bottom', visTypeIndex)"></div>
            <div v-show="dropzoneBottomVisible[visTypeIndex]" class="p-col-12" @drop.stop="onDropComplete($event, 'after', visTypeIndex)" @dragover.prevent @dragenter.prevent @dragleave.prevent></div>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetLegend, IMapWidgetVisualizationType, IMapWidgetVisualizationTypeLegendSettings } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { defineComponent, PropType } from 'vue'
import { mapActions } from 'pinia'
import { getPropertiesByLayerId } from '../../../../MapWidget/MapWidgetDataProxy'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import appStore from '@/App.store'
import descriptor from './MapVisualizationTypeDescriptor.json'
import VisTypeConfig from './MapVisualizationTypeConfigurations.vue'
import * as mapWidgetDefaultValues from '../../../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'
import { removeVisualizationTypeFromModel } from './MapVisualizationTypeHelpers'

export default defineComponent({
    name: 'map-visualization-type',
    components: { VisTypeConfig },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: [],
    data() {
        return {
            descriptor,
            visualizationTypeModel: [] as IMapWidgetVisualizationType[],
            availableLayersOptions: [] as {
                layerId: string | null
                name: string
            }[],
            widgetLayersNameMap: {} as any,
            propertiesCache: new Map<string, IMapWidgetLayerProperty[]>(),
            dropzoneTopVisible: {},
            dropzoneBottomVisible: {}
        }
    },
    computed: {
        availableDatasets() {
            if (!this.widgetModel?.layers) return []
            return this.widgetModel.layers.filter((layer: IMapWidgetLayer) => layer.type === 'dataset')
        }
    },
    watch: {
        widgetModel: {
            handler(newVal) {
                if (newVal?.settings?.visualizations) {
                    this.loadVisTypeModel()
                }
            },
            deep: true,
            immediate: true
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadVisTypeModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        setEventListeners() {
            emitter.on('mapFieldsUpdated', this.loadVisTypeModel)
        },
        removeEventListeners() {
            emitter.off('mapFieldsUpdated', this.loadVisTypeModel)
        },
        availableMeasures(dsName: string) {
            const targetDataset = this.availableDatasets.find((layer: IMapWidgetLayer) => dsName === layer.name || dsName === layer.layerId)
            return targetDataset ? targetDataset.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE') : []
        },
        availableTargetDatasetColumns(dsName: string) {
            const targetDataset = this.availableDatasets.find((layer: IMapWidgetLayer) => dsName === layer.name || dsName === layer.layerId)
            return targetDataset ? [...targetDataset.columns] : []
        },
        async loadPropertiesForVisualizationTypes() {
            await Promise.all(this.visualizationTypeModel.map((visTypeModel) => this.loadAvailableProperties(visTypeModel)))
        },
        async loadAvailableProperties(visualization: IMapWidgetVisualizationType) {
            if (!visualization.target) return

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
        async loadAvailablePropertiesInVisualizationTypeForLayer(targetLayer: IMapWidgetLayer, visualization: IMapWidgetVisualizationType) {
            this.setLoading(true)
            const properties = await getPropertiesByLayerId(targetLayer.id)
            this.setLoading(false)
            this.propertiesCache.set(targetLayer.layerId, properties)
            visualization.properties = properties

            return visualization.properties
        },
        availableChartMeasures(id: string) {
            const targetDataset = this.availableDatasets.find((layer: IMapWidgetLayer) => id === layer.name || id === layer.layerId)
            if (targetDataset) return targetDataset.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE')

            const targetLayer = this.widgetModel.layers.find((layer: IMapWidgetLayer) => id === layer.layerId)
            if (targetLayer && this.propertiesCache.has(targetLayer.layerId)) return this.propertiesCache.get(targetLayer.layerId)

            return []
        },
        async onTargetChange(id: string, visualization: IMapWidgetVisualizationType) {
            ;['targetDataset', 'targetMeasure', 'targetProperty', 'targetType'].forEach((property: string) => delete visualization[property])
            visualization.filter = mapWidgetDefaultValues.getDefaultVisualizationMapFilter()

            if (visualization.chartMeasures && visualization.chartMeasures.length > 0) visualization.chartMeasures = []

            const target = this.widgetModel.layers.find((layer: IMapWidgetLayer) => id === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(visualization.target)) {
                visualization.properties = this.propertiesCache.get(visualization.target)
                return
            }
            await this.loadAvailablePropertiesInVisualizationTypeForLayer(target, visualization)
            this.updateMapWidgetLegendWithSepecificModel(visualization)
            emitter.emit('vizualizationTypesUpdated')
        },
        onDataLinkChange(dataLinkType: 'column' | 'property', visualization: IMapWidgetVisualizationType) {
            visualization.targetProperty = null
            visualization.targetDatasetForeignKeyColumn = undefined
            if (dataLinkType === 'property') delete visualization.targetDataset
            this.updateMapWidgetLegendWithSepecificModel(visualization)
        },
        getTargetLayerType(visualization: IMapWidgetVisualizationType) {
            return this.widgetModel.layers.find((layer: IMapWidgetLayer) => visualization.target === layer.layerId) ? this.widgetModel.layers.find((layer: IMapWidgetLayer) => visualization.target === layer.layerId).type : 'dataset'
        },
        async loadVisTypeModel() {
            if (this.widgetModel.settings?.visualizations) this.visualizationTypeModel = this.widgetModel.settings?.visualizations as IMapWidgetVisualizationType[]
            this.loadLayersOptions()
            this.loadWidgetLayersMaps()
            this.removelayersFromAvailableOptions()
            await this.loadPropertiesForVisualizationTypes()
            this.updateVisualizationTypesId()
            if (this.widgetModel.settings.visualizations.length === 0) this.widgetModel.settings.visualizations.push(mapWidgetDefaultValues.getDefaultVisualizationSettings()[0])
            this.updateMapWidgetLegendWithExistingVisualizationModels()
        },
        updateVisualizationTypesId() {
            this.visualizationTypeModel?.forEach((visualizationType: IMapWidgetVisualizationType) => {
                if (!visualizationType?.id) visualizationType.id = crypto.randomUUID()
            })
        },
        updateMapWidgetLegendWithExistingVisualizationModels() {
            this.visualizationTypeModel?.forEach((visualizationType: IMapWidgetVisualizationType) => {
                const mapLegend = this.widgetModel?.settings?.legend as IMapWidgetLegend | undefined
                if (mapLegend?.visualizationTypes.some((visualizationTypeLegendSettings: IMapWidgetVisualizationTypeLegendSettings) => visualizationTypeLegendSettings.visualizationType?.id === visualizationType.id)) return
                this.addVisualizationTypeLegendOption(visualizationType)
            })
        },
        updateMapWidgetLegendWithSepecificModel(visualizationType: IMapWidgetVisualizationType) {
            const mapLegend = this.widgetModel?.settings?.legend as IMapWidgetLegend | undefined
            if (!mapLegend) return
            const index = mapLegend.visualizationTypes.findIndex((visualizationTypeLegendSettings: IMapWidgetVisualizationTypeLegendSettings) => visualizationTypeLegendSettings.visualizationType?.id === visualizationType.id)
            if (index !== -1) {
                const defaultVisualizationTypeLegendSettings = mapWidgetDefaultValues.getDefaultVisualizationTypeLegendSettings()
                mapLegend.visualizationTypes[index] = { ...defaultVisualizationTypeLegendSettings, visualizationType: visualizationType }
            }
        },
        loadLayersOptions() {
            this.availableLayersOptions = this.widgetModel.layers
                ? this.widgetModel.layers.map((layer: IMapWidgetLayer) => {
                      return { layerId: layer.layerId, name: layer.name }
                  })
                : []
        },
        loadWidgetLayersMaps() {
            this.widgetModel.layers.forEach((layer: IMapWidgetLayer) => {
                this.widgetLayersNameMap[layer.layerId] = layer.name
            })
        },
        removelayersFromAvailableOptions() {
            for (let i = 0; i < this.widgetModel.settings.visualizations.length; i++) {
                for (let j = 0; j < this.widgetModel.settings.visualizations[i].target.length; j++) {
                    this.removeLayerFromAvailableOptions(this.widgetModel.settings.visualizations[i].target[j])
                }
            }
        },
        removeLayerFromAvailableOptions(layerId: string) {
            const index = this.availableLayersOptions.findIndex((tempLayer: { layerId: string | null; name: string }) => tempLayer.layerId === layerId)
            if (index !== -1) this.availableLayersOptions.splice(index, 1)
        },
        getImageSource(visType: string) {
            return `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/mapVisTypes/${visType}.svg`
        },
        selectVisTypeConfig(visTypeIndex, visTypeConfigName) {
            this.visualizationTypeModel[visTypeIndex].type = visTypeConfigName
            this.updateMapWidgetLegendWithSepecificModel(this.visualizationTypeModel[visTypeIndex])
        },
        addVisualizationType() {
            const visualizationType = this.createDefaultVisualizationType()
            this.visualizationTypeModel.push(visualizationType)
            this.addVisualizationTypeLegendOption(visualizationType)
            emitter.emit('vizualizationTypesUpdated')
        },
        addVisualizationTypeLegendOption(visualizationType: IMapWidgetVisualizationType) {
            const mapLegend = this.widgetModel?.settings?.legend as IMapWidgetLegend | undefined
            if (!mapLegend) return
            const defaultVisualizationTypeLegendSettings = mapWidgetDefaultValues.getDefaultVisualizationTypeLegendSettings()
            mapLegend.visualizationTypes.push({ ...defaultVisualizationTypeLegendSettings, visualizationType: visualizationType })
        },
        removeVisualizationType(index: number) {
            removeVisualizationTypeFromModel(this.visualizationTypeModel[index], this.widgetModel)

            if (index === 0) this.visualizationTypeModel[0] = this.createDefaultVisualizationType()
            else this.visualizationTypeModel.splice(index, 1)
            emitter.emit('vizualizationTypesUpdated')
        },

        createDefaultVisualizationType() {
            return mapWidgetDefaultValues.getDefaultVisualizationSettings()[0]
        },
        onDragStart(event: any, index: number) {
            if (!this.visualizationTypeModel) return
            event.dataTransfer.setData('text/plain', JSON.stringify(index))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        onDropComplete(event: any, position: 'before' | 'after', index: number) {
            if (!this.visualizationTypeModel) return
            this.hideDropzone('bottom', index)
            this.hideDropzone('top', index)
            const eventData = JSON.parse(event.dataTransfer.getData('text/plain'))
            this.onRowsMove(eventData, index, position)
        },
        displayDropzone(position: string, index: number) {
            if (!this.visualizationTypeModel) return
            position === 'top' ? (this.dropzoneTopVisible[index] = true) : (this.dropzoneBottomVisible[index] = true)
        },
        hideDropzone(position: string, index: number) {
            if (!this.visualizationTypeModel) return
            position === 'top' ? (this.dropzoneTopVisible[index] = false) : (this.dropzoneBottomVisible[index] = false)
        },
        onRowsMove(sourceRowIndex: number, targetRowIndex: number, position: string) {
            if (sourceRowIndex === targetRowIndex) return
            if (this.visualizationTypeModel) {
                const newIndex = sourceRowIndex > targetRowIndex && position === 'after' ? targetRowIndex + 1 : targetRowIndex
                this.visualizationTypeModel.splice(newIndex, 0, this.visualizationTypeModel.splice(sourceRowIndex, 1)[0])
            }
        },
        onMarkerConfigurationUpdated(visualizationType: IMapWidgetVisualizationType) {
            this.updateMapWidgetLegendWithSepecificModel(visualizationType)
        }
    }
})
</script>

<style lang="scss" scoped>
.visTypeCards {
    cursor: pointer;
    border: 1px solid #cccccc;
    height: 80px;
    width: 140px;
    &.selected {
        background-color: #bbd6ed;
    }
    &:hover {
        background-color: color.adjust(#bbd6ed, $lightness: -15%);
    }
    &:hover,
    &.selected {
        .visTypeIcon {
            background-color: #deecf8;
        }
    }
}

.form-list-item-dropzone {
    height: 20px;
    width: 100%;
    background-color: white;
    opacity: 0;
    visibility: visible;
    transition: opacity 0.2s, visibility 0.2s;
}

.form-list-item-dropzone-active {
    opacity: 1;
    visibility: visible;
    background-color: #aec1d3;
}
</style>
