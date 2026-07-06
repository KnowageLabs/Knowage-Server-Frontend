<template>
    <div v-if="layer" class="q-pa-sm">
        <q-card>
            <q-card-section class="q-py-sm">
                <div class="text-overline text-grey-7">{{ $t('common.layer') }}</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
                <div class="row q-col-gutter-sm">
                    <div class="col">
                        <q-input dense outlined :disable="true" v-model="layer.name" :label="$t('common.layer')" hide-bottom-space />
                    </div>
                    <div class="col">
                        <q-input dense outlined :disable="true" v-model="layer.type" :label="$t('common.type')" hide-bottom-space />
                    </div>
                </div>
            </q-card-section>
        </q-card>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { ILayer, IMapWidgetLayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import descriptor from './MapWidgetLayerInfoDescriptor.json'

export default defineComponent({
    name: 'map-widget-layer-info',
    components: {},
    props: { selectedLayer: { type: Object as PropType<IMapWidgetLayer | null>, required: true }, layers: { type: Array as PropType<ILayer[]>, required: true } },
    data() {
        return {
            descriptor,
            layer: null as IMapWidgetLayer | null
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
        }
    }
})
</script>
