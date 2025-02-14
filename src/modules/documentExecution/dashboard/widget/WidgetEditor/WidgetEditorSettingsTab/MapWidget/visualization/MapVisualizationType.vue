<template>
    <div v-for="(visType, visTypeIndex) in visualizationTypeModel" :key="visTypeIndex" class="p-d-flex p-flex-column p-m-3 widget-editor-card p-p-3">
        <div class="row items-center q-mb-sm">
            <q-select filled dense class="col" v-model="visType.target" :options="availableLayersOptions" emit-value map-options option-value="layerId" option-label="name" options-dense :label="$t('common.layer')" @update:modelValue="onTargetChange($event, visType)"></q-select>
            <q-select
                v-if="visType && getTargetLayerType(visType) === 'layer'"
                filled
                dense
                class="col q-ml-sm"
                v-model="visType.targetType"
                :options="['column', 'property']"
                emit-value
                map-options
                option-value="name"
                option-label="name"
                options-dense
                label="Data Link"
                @update:modelValue="onDataLinkChange($event, visType)"
            ></q-select>
            <q-select
                v-if="getTargetLayerType(visType) === 'layer' && visType.targetType === 'column'"
                filled
                dense
                class="col q-ml-sm"
                v-model="visType.targetDataset"
                :options="availableDatasets"
                emit-value
                map-options
                option-value="name"
                option-label="name"
                options-dense
                :label="$t('common.dataset')"
            ></q-select>
            <q-select
                v-if="getTargetLayerType(visType) === 'dataset' || (visType.targetType === 'column' && visType.targetDataset)"
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
            ></q-select>
            <q-select
                v-if="visType && getTargetLayerType(visType) === 'layer'"
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
                :label="$t('common.property')"
            ></q-select>

            <Button v-if="visTypeIndex === 0" icon="fas fa-plus-circle fa-1x" class="p-button-text p-button-plain p-js-center p-ml-2" @click="addVisualizationType" />
            <Button v-if="visTypeIndex !== 0" icon="pi pi-trash kn-cursor-pointer" class="p-button-text p-button-plain p-js-center p-ml-2" @click="removeVisualizationType(visTypeIndex)" />
        </div>

        <div class="p-grid gap-1 p-m-0" style="column-gap: 0.5em; row-gap: 0.5em">
            <div v-for="(visTypeConfig, visTypeConfigIndex) in descriptor.visTypes" :key="visTypeConfigIndex" v-tooltip.bottom="$t(visTypeConfig.tooltip)" class="visTypeCards" :class="{ selected: visType.type === visTypeConfig.name }" @click="selectVisTypeConfig(visTypeIndex, visTypeConfig.name)">
                <img class="kn-width-full kn-height-full" :src="getImageSource(visTypeConfig.name)" />
            </div>
        </div>

        <hr class="kn-width-full p-my-2" />

        <VisTypeConfig :vis-type-prop="visType" />
    </div>
</template>

<script lang="ts">
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { defineComponent, PropType } from 'vue'
import { mapActions } from 'pinia'
import appStore from '@/App.store'
import descriptor from './MapVisualizationTypeDescriptor.json'
import VisTypeConfig from './MapVisualizationTypeConfigurations.vue'
import * as mapWidgetDefaultValues from '../../../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'
import { getPropertiesByLayerId } from '../../../../MapWidget/MapWidgetDataProxy'

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
            propertiesCache: new Map<string, IMapWidgetLayerProperty[]>()
        }
    },
    computed: {
        availableDatasets() {
            if (!this.widgetModel?.layers) return []
            return this.widgetModel.layers.filter((layer: IMapWidgetLayer) => layer.type === 'dataset')
        }
    },
    watch: {
        widgetModel() {
            this.loadVisTypeModel()
        }
    },
    mounted() {
        this.loadVisTypeModel()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        availableMeasures(dsName: string) {
            const targetDataset = this.availableDatasets.find((layer: IMapWidgetLayer) => dsName === layer.name || dsName === layer.layerId)
            return targetDataset ? targetDataset.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE') : []
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

            const targetLayer = this.widgetModel.layers.find((layer) => visualization.target === layer.layerId)
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
        },
        async onTargetChange(id: string, visualization: IMapWidgetVisualizationType) {
            const target = this.widgetModel.layers.find((layer: IMapWidgetLayer) => id === layer.layerId)
            if (!target || target.type !== 'layer' || this.propertiesCache.has(visualization.target)) return
            await this.loadAvailablePropertiesInVisualizationTypeForLayer(target, visualization)
        },
        onDataLinkChange(dataLinkType: 'column' | 'property', visualization: IMapWidgetVisualizationType) {
            if (dataLinkType === 'property') delete visualization.targetDataset
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
        },
        addVisualizationType() {
            this.visualizationTypeModel.push(this.createDefaultVisualizationType())
        },
        removeVisualizationType(index: number) {
            if (index === 0) this.visualizationTypeModel[0] = this.createDefaultVisualizationType()
            else this.visualizationTypeModel.splice(index, 1)
        },
        createDefaultVisualizationType() {
            return {
                target: '',
                type: 'markers',
                markerConf: mapWidgetDefaultValues.getDefaultVisualizationMarkerConfiguration(),
                balloonConf: mapWidgetDefaultValues.getDefaultVisualizationBalloonsConfiguration(),
                pieConf: mapWidgetDefaultValues.getDefaultVisualizationPieConfiguration(),
                clusterConf: mapWidgetDefaultValues.getDefaultVisualizationClusterConfiguration(),
                heatmapConf: mapWidgetDefaultValues.getDefaultVisualizationHeatmapConfiguration(),
                analysisConf: mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
            }
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
</style>
