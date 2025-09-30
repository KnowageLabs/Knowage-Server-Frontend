<template>
    <div v-if="widgetModel">
        <q-card class="p-mx-2" flat bordered>
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>{{ $t('dashboard.widgetEditor.toolbars.general') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section>
                <ChartWidgetChartTypeDropdown :widget-model="widgetModel" @selectedChartTypeChanged="$emit('selectedChartTypeChanged', $event)"></ChartWidgetChartTypeDropdown>
            </q-card-section>
        </q-card>
        <VegaCommonDataContainer :prop-widget-model="widgetModel" :selected-dataset="selectedDataset"></VegaCommonDataContainer>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import VegaCommonDataContainer from './VegaCommonDataContainer.vue'
import ChartWidgetChartTypeDropdown from '../common/ChartWidgetChartTypeDropdown.vue'

export default defineComponent({
    name: 'vega-data-container',
    components: { ChartWidgetChartTypeDropdown, VegaCommonDataContainer },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null> } },
    emits: ['selectedChartTypeChanged'],
    data() {
        return {}
    },
    async created() {},
    methods: {}
})
</script>
