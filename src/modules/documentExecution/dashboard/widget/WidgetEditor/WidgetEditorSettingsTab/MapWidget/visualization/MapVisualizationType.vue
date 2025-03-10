<template>
    <div v-for="(visType, visTypeIndex) in visualizationTypeModel" :key="visTypeIndex" class="p-d-flex p-flex-column p-m-3 widget-editor-card p-p-3">
        <div class="p-d-flex kn-flex p-ai-center p-mb-2">
            <span class="p-float-label kn-flex">
                <WidgetEditorLayersMultiselect :value="visType.target" class="kn-material-input kn-width-full" :available-target-options="availableLayersOptions" :widget-layers-name-map="widgetLayersNameMap" option-label="name" option-value="name" @change="onLayersSelected($event, visType)" />
                <label class="kn-material-input-label"> {{ $t('common.layers') }} </label>
            </span>
            <Button v-if="visTypeIndex == 0" icon="fas fa-plus-circle fa-1x" class="p-button-text p-button-plain p-js-center p-ml-2" data-test="new-button" @click="addVisualizationType" />
            <Button icon="pi pi-trash kn-cursor-pointer" class="p-button-text p-button-plain p-js-center p-ml-2" data-test="delete-button" @click="removeVisualizationType(visTypeIndex)" />
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
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationType } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { defineComponent, PropType } from 'vue'
import descriptor from './MapVisualizationTypeDescriptor.json'
import VisTypeConfig from './MapVisualizationTypeConfigurations.vue'
import WidgetEditorLayersMultiselect from '../common/WidgetEditorLayersMultiselect.vue'
import * as mapWidgetDefaultValues from '../../../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'

export default defineComponent({
    name: 'map-visualization-type',
    components: { VisTypeConfig, WidgetEditorLayersMultiselect },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    emits: [],
    data() {
        return {
            descriptor,
            visualizationTypeModel: [] as IMapWidgetVisualizationType[],
            availableLayersOptions: [] as { id: number | null; name: string }[],
            widgetLayersNameMap: {} as any
        }
    },
    watch: {
        widgetModel() {
            this.loadVisTypeModel()
        }
    },
    created() {
        this.loadVisTypeModel()
    },
    mounted() {
        this.loadVisTypeModel()
    },
    methods: {
        loadVisTypeModel() {
            if (this.widgetModel.settings?.visualization?.types) this.visualizationTypeModel = this.widgetModel.settings?.visualization?.types as IMapWidgetVisualizationType[]
            this.loadLayersOptions()
            this.loadWidgetLayersMaps()
            this.removelayersFromAvailableOptions()
        },
        loadLayersOptions() {
            this.availableLayersOptions = this.widgetModel.layers
                ? this.widgetModel.layers.map((layer: IMapWidgetLayer) => {
                      return { id: layer.dsId, name: layer.name }
                  })
                : []
        },
        loadWidgetLayersMaps() {
            this.widgetModel.layers.forEach((layer: IMapWidgetLayer) => {
                if (layer.dsId) this.widgetLayersNameMap[layer.name] = layer.dsId
            })
        },
        removelayersFromAvailableOptions() {
            for (let i = 0; i < this.widgetModel.settings.visualization.types.length; i++) {
                for (let j = 0; j < this.widgetModel.settings.visualization.types[i].target.length; j++) {
                    this.removeLayerFromAvailableOptions({ id: this.widgetModel.settings.visualization.types[i].target[j], name: this.widgetModel.settings.visualization.types[i].target[j] })
                }
            }
        },
        removeLayerFromAvailableOptions(layer: { id: number; name: string }) {
            const index = this.availableLayersOptions.findIndex((tempLayer: { id: number | null; name: string }) => tempLayer.name === layer.name)
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
                target: [],
                type: 'markers',
                markerConf: mapWidgetDefaultValues.getDefaultVisualizationMarkerConfiguration(),
                balloonConf: mapWidgetDefaultValues.getDefaultVisualizationBalloonsConfiguration(),
                pieConf: mapWidgetDefaultValues.getDefaultVisualizationPieConfiguration(),
                clusterConf: mapWidgetDefaultValues.getDefaultVisualizationClusterConfiguration(),
                heatmapConf: mapWidgetDefaultValues.getDefaultVisualizationHeatmapConfiguration(),
                analysisConf: mapWidgetDefaultValues.getDefaultVisualizationChoroplethConfiguration()
            }
        },
        onLayersSelected(event: any, visualizationType: IMapWidgetVisualizationType) {
            const intersection = visualizationType.target.filter((el: string) => !event.value.includes(el))
            visualizationType.target = event.value
            intersection.length > 0 ? this.onLayersRemovedFromMultiselect(intersection) : this.onLayersAddedFromMultiselect(visualizationType)
        },
        onLayersRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((el: string) => {
                const options = { id: this.widgetLayersNameMap[el], name: el }
                this.availableLayersOptions.push(options)
            })
        },
        onLayersAddedFromMultiselect(visualizationType: IMapWidgetVisualizationType) {
            visualizationType.target.forEach((target: string) => {
                const index = this.availableLayersOptions.findIndex((targetOption: { id: number | null; name: string }) => targetOption.name === target)
                if (index !== -1) this.availableLayersOptions.splice(index, 1)
            })
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
