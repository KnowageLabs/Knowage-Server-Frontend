<template>
    <div v-if="mapSettings">
        <div class="q-px-md q-pb-sm">
            <div class="row q-col-gutter-sm q-mb-sm">
                <div class="col-12">
                    <q-select v-model="mapSettings.baseLayer" :options="baseLayerOptions" emit-value map-options option-value="value" option-label="label" :label="$t('dashboard.widgetEditor.map.baseLayer.selectBackgroundLayer')" outlined dense />
                </div>
            </div>
            <div class="row q-col-gutter-sm q-mb-sm items-center">
                <div class="col-4">
                    <q-input type="number" v-model="mapSettings.zoom" max="20" min="1" :label="$t('dashboard.widgetEditor.map.baseLayer.zoom')" :disable="mapSettings.autoCentering" outlined dense />
                </div>
                <div class="">
                    <q-toggle v-model="mapSettings.autoCentering" :label="$t('dashboard.widgetEditor.map.baseLayer.autoCentering')" dense />
                </div>
                <div class="">
                    <q-toggle v-model="mapSettings.showScale" :label="$t('dashboard.widgetEditor.map.baseLayer.showScale')" dense />
                </div>
            </div>
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
