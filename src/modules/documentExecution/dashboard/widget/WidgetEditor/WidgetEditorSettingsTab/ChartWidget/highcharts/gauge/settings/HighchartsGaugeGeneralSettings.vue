<template>
    <div v-if="model" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <q-input v-model.number="model.pane.startAngle" type="number" :label="$t('dashboard.widgetEditor.highcharts.paneSettings.startAngle')" outlined dense @blur="modelChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.paneSettings.startAngleHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model.number="model.pane.endAngle" type="number" :label="$t('dashboard.widgetEditor.highcharts.paneSettings.endAngle')" outlined dense @blur="modelChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.paneSettings.endAngleHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model.number="centralHorizontalPosition" type="number" :label="$t('dashboard.widgetEditor.highcharts.paneSettings.centralHorizontalPosition')" outlined dense @blur="onPositionChanged('horizontal')" />
            </div>
            <div class="col-6">
                <q-input v-model.number="centralVerticalPosition" type="number" :label="$t('dashboard.widgetEditor.highcharts.paneSettings.centralVerticalPosition')" outlined dense @blur="onPositionChanged('vertical')" />
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
    name: 'hihgcharts-gauge-geeneral-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            model: null as IHighchartsChartModel | null,
            centralHorizontalPosition: 0,
            centralVerticalPosition: 0
        }
    },
    computed: {},
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            this.loadHorizontalPosition('horizontal')
            this.loadHorizontalPosition('vertical')
        },
        modelChanged() {
            setTimeout(() => emitter.emit('refreshChart', this.widgetModel.id), 250)
        },
        loadHorizontalPosition(type: 'horizontal' | 'vertical') {
            if (!this.model || !this.model.pane.center || this.model.pane.center.length === 0) return
            const positionAsPercentageString = type === 'horizontal' ? this.model.pane.center[0] : this.model.pane.center[1]
            const formattedPosition = +positionAsPercentageString.trim().replace('%', '')
            type === 'horizontal' ? (this.centralHorizontalPosition = formattedPosition) : (this.centralVerticalPosition = formattedPosition)
        },
        onPositionChanged(type: 'horizontal' | 'vertical') {
            setTimeout(() => {
                if (!this.model) return
                type === 'horizontal' ? (this.model.pane.center[0] = this.centralHorizontalPosition + '%') : (this.model.pane.center[1] = this.centralVerticalPosition + '%')
                this.modelChanged()
            }, 250)
        }
    }
})
</script>
