<template>
    <div v-if="model?.yAxis && model.yAxis[0]" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <q-input v-model.number="model.yAxis[0].min" type="number" :label="$t('common.min')" outlined dense @blur="modelChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5 q-mr-xs">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.scale.minHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model.number="model.yAxis[0].max" type="number" :label="$t('common.max')" outlined dense @blur="modelChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5 q-mr-xs">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.scale.maxHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'

export default defineComponent({
    name: 'hihgcharts-gauge-scale-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            model: null as IHighchartsChartModel | null
        }
    },
    computed: {},
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
        },
        modelChanged() {
            setTimeout(() => emitter.emit('refreshChart', this.widgetModel.id), 250)
        },
        onInputChanged(type: 'min' | 'max') {
            if (!this.model) return
            type === 'min' ? (this.model.yAxis[0].min = null) : (this.model.yAxis[0].max = null)
            setTimeout(() => this.modelChanged(), 250)
        }
    }
})
</script>
