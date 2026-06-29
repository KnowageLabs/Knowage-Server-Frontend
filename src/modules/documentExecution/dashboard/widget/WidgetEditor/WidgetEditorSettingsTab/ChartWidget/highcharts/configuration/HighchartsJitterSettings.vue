<template>
    <div v-if="jitterSettings" class="q-px-md q-pb-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
                <q-input v-model.number="jitterSettings.x" type="number" :label="$t('dashboard.widgetEditor.highcharts.jitter.xAxisJitter')" outlined dense />
            </div>
            <div class="col-6">
                <q-input v-model.number="jitterSettings.y" type="number" :label="$t('dashboard.widgetEditor.highcharts.jitter.yAxisJitter')" outlined dense />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
export default defineComponent({
    name: 'highcharts-jitter-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            jitterSettings: null as { x: number; y: number } | null
        }
    },
    created() {
        this.loadJitterSettings()
    },
    methods: {
        loadJitterSettings() {
            this.jitterSettings = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model.plotOptions.scatter.jitter : null
        }
    }
})
</script>
