<template>
    <div v-if="layer" class="widget-editor-card">
        <h3 class="p-ml-3">{{ $t('common.layer') }}</h3>
        <div class="row q-mx-sm q-mb-sm q-gutter-sm">
            <q-input dense class="col" filled v-model="layer.name" :label="$t('common.layer')" :disable="true" />
            <q-input dense class="col" filled v-model="layer.type" :label="$t('common.type')" :disable="true" />
        </div>
    </div>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { ILayer, IMapWidgetLayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { IDataset } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import descriptor from './MapWidgetLayerInfoDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export default defineComponent({
    name: 'map-widget-layer-info',
    components: { Dropdown, InputSwitch, Message },
    props: { selectedLayer: { type: Object as PropType<IMapWidgetLayer | null>, required: true }, layers: { type: Array as PropType<ILayer[]>, required: true } },
    data() {
        return {
            descriptor,
            layer: null as IMapWidgetLayer | null,
            datasets: [] as IDataset[],
            getTranslatedLabel
        }
    },
    computed: {
        datasetColumnsLinkOptions() {
            if (!this.layer || !this.layer.datasetLink) return []
            const index = this.datasets.findIndex((dataset: IDataset) => dataset.id.dsId === this.layer?.datasetLink)
            return index !== -1 ? this.datasets[index].metadata.fieldsMeta : []
        }
    },
    watch: {
        selectedLayer() {
            this.loadLayer()
        }
    },

    created() {
        this.loadLayer()
        this.loadDatasets()
    },
    methods: {
        ...mapActions(dashboardStore, ['getAllDatasets']),
        loadLayer() {
            this.layer = this.selectedLayer
        },
        loadDatasets() {
            this.datasets = this.getAllDatasets()
        }
    }
})
</script>
