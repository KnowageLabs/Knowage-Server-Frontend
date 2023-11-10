<template>
    <div v-if="funnelPlotOptions" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-6 p-fluid">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.highcharts.funnel.neckWidth') }}</label>
            <div class="p-d-flex p-flex-row p-ai-center">
                <InputText v-model="funnelPlotOptions.neckWidth" class="kn-material-input p-inputtext-sm" />
                <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.funnel.neckWidthHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
            </div>
        </div>
        <div class="p-col-6 p-fluid">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.highcharts.funnel.neckHeight') }}</label>
            <div class="p-d-flex p-flex-row p-ai-center">
                <InputText v-model="funnelPlotOptions.neckHeight" class="kn-material-input p-inputtext-sm" />
                <i v-tooltip.left="$t('dashboard.widgetEditor.highcharts.funnel.neckHeightHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
    name: 'highcharts-funnel-neck-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            funnelPlotOptions: null as any
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            if (this.widgetModel.settings?.chartModel?.model?.plotOptions?.series) this.funnelPlotOptions = this.widgetModel.settings.chartModel.model.plotOptions.series
        }
    }
})
</script>
