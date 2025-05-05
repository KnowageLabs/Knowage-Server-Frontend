<template>
    <div v-if="spatialAttribute">
        <h5 class="q-mx-md q-my-xs">{{ $t('dashboard.widgetEditor.map.metadata.spatialAttribute') }}</h5>

        <div class="row q-gutter-sm q-mx-xs q-mb-sm">
            <q-input dense class="col" filled v-model="spatialAttribute.alias" :label="$t('common.column')" :disable="true" />
            <q-select
                dense
                class="col"
                filled
                v-model="spatialAttribute.properties.coordType"
                :options="descriptor.coordTypes"
                option-value="value"
                :option-label="(option) => (option.label ? $t(option.label) : '')"
                emit-value
                map-options
                :label="$t('dashboard.widgetEditor.map.metadata.coordType')"
                @update:modelValue="onSpatialAttributeCoordTypeChanged($event)"
            />
            <q-select
                v-if="spatialAttribute.properties.coordType === 'string'"
                dense
                class="col"
                filled
                v-model="spatialAttribute.properties.coordFormat"
                :options="descriptor.coordFormats"
                option-value="value"
                :option-label="(option) => (option.label ? $t(option.label) : '')"
                emit-value
                map-options
                :label="$t('dashboard.widgetEditor.map.metadata.coordFormat')"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IWidgetMapLayerColumn } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import descriptor from './MapWidgetMetadataDescriptor.json'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'map-widget-metadata-spatial-attribute',
    components: { Dropdown },
    props: { propSpatialAttribute: { type: Object as PropType<IWidgetMapLayerColumn | null>, required: true } },
    data() {
        return {
            descriptor,
            spatialAttribute: null as IWidgetMapLayerColumn | null
        }
    },
    watch: {
        propSpatialAttribute() {
            this.loadSpatialAttribute()
        }
    },
    created() {
        this.loadSpatialAttribute()
    },
    methods: {
        loadSpatialAttribute() {
            this.spatialAttribute = this.propSpatialAttribute
        },
        onSpatialAttributeCoordTypeChanged(coordType: string) {
            if (!this.spatialAttribute) return
            if (coordType === 'string' && !this.spatialAttribute.properties.coordFormat) this.spatialAttribute.properties.coordFormat = 'lon lat'
        }
    }
})
</script>
