<template>
    <div v-if="funnelPlotOptions" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <q-input v-model="funnelPlotOptions.neckWidth" :label="$t('dashboard.widgetEditor.highcharts.funnel.neckWidth')" outlined dense>
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.funnel.neckWidthHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="funnelPlotOptions.neckHeight" :label="$t('dashboard.widgetEditor.highcharts.funnel.neckHeight')" outlined dense>
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.funnel.neckHeightHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
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
