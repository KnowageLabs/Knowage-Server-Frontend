<template>
    <div v-if="model?.chart?.options3d" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6 col-md-3">
                <q-input v-model.number="model.chart.options3d.alpha" type="number" :label="$t('dashboard.widgetEditor.configurationOf3D.alphaAngle')" outlined dense :disable="configurationDisabled" :hint="$t('dashboard.widgetEditor.configurationOf3D.alphaAngleHint')" @blur="modelChanged" />
            </div>
            <div class="col-6 col-md-3">
                <q-input v-model.number="model.chart.options3d.beta" type="number" :label="$t('dashboard.widgetEditor.configurationOf3D.betaAngle')" outlined dense :disable="configurationDisabled" :hint="$t('dashboard.widgetEditor.configurationOf3D.betaAngleHint')" @blur="modelChanged" />
            </div>
            <div v-if="model.chart.type !== 'pie'" class="col-6 col-md-3">
                <q-input v-model.number="model.chart.options3d.viewDistance" type="number" :label="$t('dashboard.widgetEditor.configurationOf3D.viewDistance')" outlined dense :disable="configurationDisabled" :hint="$t('dashboard.widgetEditor.configurationOf3D.viewDistanceHintShort')" @blur="modelChanged" />
            </div>
            <div v-if="model.chart.options3d.depth" class="col-6 col-md-3">
                <q-input v-model.number="model.chart.options3d.depth" type="number" :label="$t('dashboard.widgetEditor.configurationOf3D.totalDepth')" outlined dense :disable="configurationDisabled" :hint="$t('dashboard.widgetEditor.configurationOf3D.totalDepthHint')" @blur="modelChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '../../../../../../Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
export default defineComponent({
    name: 'hihgcharts-3d-configuration',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            model: null as IHighchartsChartModel | null
        }
    },
    computed: {
        configurationDisabled(): boolean {
            return !this.model || !this.model.chart.options3d.enabled
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            if (this.model && !this.model.chart.options3d.depth) this.model.chart.options3d.depth = 100
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        }
    }
})
</script>
