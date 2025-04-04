<template>
    <div class="widget-editor-card p-p-2">
        <h4 class="q-mx-sm q-my-sm">{{ layer?.type.toLowerCase() === 'dataset' ? $t('common.metadata') : $t('common.properties') }}</h4>
        <MapWidgetMetadataSpatialAttribute v-if="selectedLayer?.columns" :prop-spatial-attribute="spatialAttribute"></MapWidgetMetadataSpatialAttribute>
        <hr />
        <MapWidgetMetadataFields v-if="selectedLayer?.columns" :propFields="selectedLayer.columns"></MapWidgetMetadataFields>
        <MapWidgetMetadataProperties v-if="selectedLayer?.properties" :properties="selectedLayer.properties"></MapWidgetMetadataProperties>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IMapWidgetLayer, IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import MapWidgetMetadataSpatialAttribute from './MapWidgetMetadataSpatialAttribute.vue'
import MapWidgetMetadataFields from './MapWidgetMetadataFields.vue'
import MapWidgetMetadataProperties from './MapWidgetMetadataProperties.vue'

export default defineComponent({
    name: 'map-widget-metadata',
    components: { MapWidgetMetadataSpatialAttribute, MapWidgetMetadataFields, MapWidgetMetadataProperties },
    props: {
        selectedLayer: { type: Object as PropType<IMapWidgetLayer | null>, required: true }
    },
    data() {
        return {
            layer: null as IMapWidgetLayer | null,
            spatialAttribute: null as IWidgetMapLayerColumn | null,
            fields: [] as any[]
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
        loadLayer() {
            this.layer = this.selectedLayer
            this.loadSpatialAttribute()
        },
        loadSpatialAttribute() {
            if (!this.layer || !this.layer.columns) return
            const index = this.layer.columns.findIndex((column: IWidgetMapLayerColumn) => column.fieldType === 'SPATIAL_ATTRIBUTE')
            if (index !== -1) this.spatialAttribute = this.layer.columns[index]
        }
    }
})
</script>
