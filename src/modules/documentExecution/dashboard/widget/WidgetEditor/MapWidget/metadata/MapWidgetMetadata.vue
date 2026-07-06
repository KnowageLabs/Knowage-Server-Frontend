<template>
    <div class="q-pa-sm">
        <q-card>
            <q-card-section class="q-py-sm">
                <div class="text-overline text-grey-7">{{ layer?.type.toLowerCase() === 'dataset' ? $t('common.metadata') : $t('common.properties') }}</div>
            </q-card-section>
            <q-separator />

            <template v-if="selectedLayer?.columns">
                <template v-if="spatialAttribute">
                    <q-card-section class="q-py-none" style="background: #f5f5f5">
                        <div class="text-overline text-grey-7">{{ $t('dashboard.widgetEditor.map.metadata.spatialAttribute') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section class="q-py-sm">
                        <MapWidgetMetadataSpatialAttribute :prop-spatial-attribute="spatialAttribute"></MapWidgetMetadataSpatialAttribute>
                    </q-card-section>
                    <q-separator />
                </template>

                <q-card-section class="q-py-none" style="background: #f5f5f5">
                    <div class="row items-center">
                        <div class="text-overline text-grey-7 col">{{ $t('common.fields') }}</div>
                        <div class="row items-center q-gutter-xs">
                            <q-btn flat dense icon="add" color="primary" :label="$t('common.addColumn')" size="sm" @click="($refs.fieldsComp as any).addField()" />
                            <q-btn flat dense icon="add" color="primary" :label="$t('common.addCalculatedField')" size="sm" @click="($refs.fieldsComp as any).createNewCalcField()" />
                        </div>
                    </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-py-sm">
                    <MapWidgetMetadataFields ref="fieldsComp" :propFields="selectedLayer.columns" :selected-layer="layer" :prop-widget="propWidget" :variables="variables"></MapWidgetMetadataFields>
                </q-card-section>
            </template>

            <q-card-section v-if="selectedLayer?.properties" class="q-py-sm">
                <MapWidgetMetadataProperties :properties="selectedLayer.properties"></MapWidgetMetadataProperties>
            </q-card-section>
        </q-card>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IMapWidgetLayer, IMapWidgetLayerProperty, IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { mapActions } from 'pinia'
import { getPropertiesByLayerLabel } from '../../../MapWidget/MapWidgetDataProxy'
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
        variables: { type: Array as PropType<IVariable[]>, required: true },
        dashboardId: { type: String, required: true }
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
            if (!this.layer || this.layer.type === 'dataset') return

            if (this.propertiesCache.has(this.layer.layerId)) {
                this.layer.properties = this.propertiesCache.get(this.layer.layerId)
                return
            }

            this.setLoading(true)
            const properties = await getPropertiesByLayerLabel(this.layer.label, this.dashboardId)
            this.setLoading(false)
            this.propertiesCache.set(this.layer.layerId, properties)
            this.layer.properties = properties
        }
    }
})
</script>
