<template>
    <div v-if="mapSettings">
        <div class="row q-mx-md q-pb-lg items-center">
            <q-input class="col" type="number" v-model="mapSettings.zoom" max="20" min="1" :label="$t('dashboard.widgetEditor.map.baseLayer.zoom')" :disable="mapSettings.autoCentering" />
            <q-toggle class="col" v-model="mapSettings.showScale" :label="$t('dashboard.widgetEditor.map.baseLayer.showScale')" />
            <q-toggle class="col" v-model="mapSettings.autoCentering" :label="$t('dashboard.widgetEditor.map.baseLayer.autoCentering')" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetMapSettings } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'

export default defineComponent({
    name: 'map-base-layer-settings',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            mapSettings: null as IMapWidgetMapSettings | null,
            getTranslatedLabel
        }
    },
    created() {
        this.loadBaseLayerSettings()
    },
    methods: {
        loadBaseLayerSettings() {
            if (this.widgetModel?.settings?.configuration?.map) this.mapSettings = this.widgetModel.settings.configuration.map
        }
    }
})
</script>
