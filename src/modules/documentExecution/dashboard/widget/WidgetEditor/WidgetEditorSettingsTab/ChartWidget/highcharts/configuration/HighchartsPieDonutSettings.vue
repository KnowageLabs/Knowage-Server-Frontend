<template>
    <div class="row items-center q-gutter-md q-pa-sm">
        <div class="col-auto">
            <q-toggle v-model="isDonut" :label="$t('dashboard.widgetEditor.highcharts.piechart.donutEnabled')" @update:model-value="onToggle" />
        </div>
        <div v-if="isDonut" class="col-auto">
            <div class="column">
                <div class="text-body2 q-mb-xs">
                    {{ $t('dashboard.widgetEditor.highcharts.piechart.innerSizeLabel') }}
                </div>
                <q-input v-model.number="innerSizeLocal" type="number" min="0" max="99" dense style="max-width: 90px" @blur="onInnerSizeBlur">
                    <template #append>%</template>
                </q-input>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'highcharts-pie-donut-settings',
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true }
    },
    data() {
        return {
            innerSizeLocal: this.getInnerSizeFromModel() as number | null,
            isDonut: this.getInnerSizeFromModel() !== null
        }
    },
    methods: {
        getInnerSizeFromModel(): number | null {
            const pieOptions: any = this.widgetModel?.settings.chartModel?.model?.plotOptions?.pie
            if (!pieOptions || pieOptions.innerSize === undefined || pieOptions.innerSize === null || pieOptions.innerSize === '') return null
            const value = parseFloat(pieOptions.innerSize)
            return isNaN(value) ? null : value
        },
        ensurePieOptions() {
            const chartModel: any = this.widgetModel?.settings.chartModel?.model
            if (!chartModel.plotOptions) chartModel.plotOptions = {}
            if (!chartModel.plotOptions.pie) chartModel.plotOptions.pie = {}
            return chartModel.plotOptions.pie
        },
        onToggle() {
            const pieOptions = this.ensurePieOptions()
            if (!this.isDonut) {
                delete pieOptions.innerSize
                this.innerSizeLocal = null
            } else {
                const value = this.innerSizeLocal ?? 50
                this.innerSizeLocal = value
                pieOptions.innerSize = value + '%'
            }
        },
        onInnerSizeBlur() {
            if (!this.isDonut) return
            const pieOptions = this.ensurePieOptions()
            let value = this.innerSizeLocal ?? 50
            if (value < 0) value = 0
            if (value > 99) value = 99
            this.innerSizeLocal = value
            pieOptions.innerSize = value + '%'
        }
    }
})
</script>
