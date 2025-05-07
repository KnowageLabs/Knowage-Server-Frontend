<template>
    <div class="widget-editor-card p-p-2">
        <h4 class="q-mx-sm q-my-sm">{{ layer?.type.toLowerCase() === 'dataset' ? $t('common.metadata') : $t('common.properties') }}</h4>
        <MapWidgetMetadataSpatialAttribute v-if="selectedLayer?.columns" :prop-spatial-attribute="spatialAttribute"></MapWidgetMetadataSpatialAttribute>
        <hr />
        <MapWidgetMetadataFields v-if="selectedLayer?.columns" :propFields="selectedLayer.columns" :selected-layer="layer" :prop-widget="propWidget" :variables="variables"></MapWidgetMetadataFields>
        <MapWidgetMetadataProperties v-if="selectedLayer?.properties" :properties="selectedLayer.properties"></MapWidgetMetadataProperties>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IMapWidgetLayer, IMapWidgetLayerProperty, IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { mapActions } from 'pinia'
import { getPropertiesByLayerId } from '../../../MapWidget/MapWidgetDataProxy'
import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import appStore from '@/App.store'
import MapWidgetMetadataSpatialAttribute from './MapWidgetMetadataSpatialAttribute.vue'
import MapWidgetMetadataFields from './MapWidgetMetadataFields.vue'
import MapWidgetMetadataProperties from './MapWidgetMetadataProperties.vue'

export default defineComponent({
    name: 'map-widget-metadata',
    components: { MapWidgetMetadataSpatialAttribute, MapWidgetMetadataFields, MapWidgetMetadataProperties },
    props: {
        selectedLayer: { type: Object as PropType<IMapWidgetLayer | null>, required: true },
        propWidget: { type: Object as PropType<IWidget>, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    data() {
        return {
            layer: null as IMapWidgetLayer | null,
            spatialAttribute: null as IWidgetMapLayerColumn | null,
            propertiesCache: new Map<string, IMapWidgetLayerProperty[]>()
        }
    },
    watch: {
        selectedLayer() {
            this.loadLayer()
        }
    },
    created() {
        this.loadLayer()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        async loadLayer() {
            this.layer = this.selectedLayer
            this.loadSpatialAttribute()
            await this.loadAvailableProperties()
        },
        loadSpatialAttribute() {
            if (!this.layer || !this.layer.columns) return
            const index = this.layer.columns.findIndex((column: IWidgetMapLayerColumn) => column.fieldType === 'SPATIAL_ATTRIBUTE')
            if (index !== -1) {
                this.spatialAttribute = this.layer.columns[index]
                this.setDefaultSpatialAttributeOptions()
            }
        },
        setDefaultSpatialAttributeOptions() {
            if (!this.spatialAttribute) return
            if (!this.spatialAttribute.properties.coordType) {
                this.spatialAttribute.properties.coordType = 'string'
                this.spatialAttribute.properties.coordFormat = 'lon lat'
            }
        },
        async loadAvailableProperties() {
            if (!this.layer) return

            if (this.propertiesCache.has(this.layer.layerId)) {
                this.layer.properties = this.propertiesCache.get(this.layer.layerId)
                return
            }

            this.setLoading(true)
            const properties = await getPropertiesByLayerId(+this.layer.id)
            this.setLoading(false)
            this.propertiesCache.set(this.layer.layerId, properties)
            this.layer.properties = properties
        }
    }
})
</script>
