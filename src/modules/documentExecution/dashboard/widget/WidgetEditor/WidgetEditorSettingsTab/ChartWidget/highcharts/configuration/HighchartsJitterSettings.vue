<template>
    <div v-if="jitterSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12 p-md-6 p-d-flex p-flex-column">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.jitter.xAxisJitter') }}</label>
            <InputNumber v-model="jitterSettings.x" class="kn-material-input p-inputtext-sm" />
        </div>
        <div class="p-col-12 p-md-6 p-d-flex p-flex-column">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.jitter.yAxisJitter') }}</label>
            <InputNumber v-model="jitterSettings.y" class="kn-material-input p-inputtext-sm" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import InputNumber from 'primevue/inputnumber'

export default defineComponent({
    name: 'highcharts-jitter-settings',
    components: { InputNumber },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            jitterSettings: null as { x: number; y: number } | null
        }
    },
    created() {
        this.loadAnnotations()
    },
    methods: {
        loadAnnotations() {
            this.jitterSettings = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model.plotOptions.scatter.jitter : null
        }
    }
})
</script>
