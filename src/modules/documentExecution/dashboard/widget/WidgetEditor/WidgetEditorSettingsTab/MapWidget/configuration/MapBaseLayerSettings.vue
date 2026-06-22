<template>
    <div v-if="mapSettings">
        <div class="row q-mx-md q-pb-lg items-center q-col-gutter-md">
            <q-select class="col-12" v-model="mapSettings.baseLayer" :options="baseLayerOptions" emit-value map-options option-value="value" option-label="label" :label="$t('dashboard.widgetEditor.map.baseLayer.selectBackgroundLayer')" />
            <q-input class="col-12 col-md-4" type="number" v-model="mapSettings.zoom" max="20" min="1" :label="$t('dashboard.widgetEditor.map.baseLayer.zoom')" :disable="mapSettings.autoCentering" />
            <q-toggle class="col-12 col-md-4" v-model="mapSettings.showScale" :label="$t('dashboard.widgetEditor.map.baseLayer.showScale')" />
            <q-toggle class="col-12 col-md-4" v-model="mapSettings.autoCentering" :label="$t('dashboard.widgetEditor.map.baseLayer.autoCentering')" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetMapSettings } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { DEFAULT_MAP_BASE_LAYER, getMapBaseLayerOptions } from '@/modules/documentExecution/dashboard/widget/MapWidget/MapBaseLayerHelper'

export default defineComponent({
    name: 'map-base-layer-settings',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            mapSettings: null as IMapWidgetMapSettings | null
        }
    },
    created() {
        this.loadBaseLayerSettings()
    },
    computed: {
        baseLayerOptions() {
            return getMapBaseLayerOptions().map((option) => ({ value: option.value, label: this.$t(option.labelKey) }))
        }
    },
    methods: {
        loadBaseLayerSettings() {
            if (this.widgetModel?.settings?.configuration?.map) {
                this.mapSettings = this.widgetModel.settings.configuration.map
                if (!this.mapSettings.baseLayer) this.mapSettings.baseLayer = DEFAULT_MAP_BASE_LAYER
            }
        }
    }
})
</script>
