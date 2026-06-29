<template>
    <div v-if="pieOptions && pieOptions.enabled" class="row items-center q-gutter-sm q-px-md q-pb-md">
        <div class="col-6">
            <q-input v-model.number="innerSizeLocal" type="number" min="0" max="99" :label="$t('dashboard.widgetEditor.highcharts.piechart.innerSizeLabel')" outlined dense @blur="onInnerSizeBlur">
                <template #append>%</template>
            </q-input>
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
            innerSizeLocal: this.getInnerSizeFromModel() as number | null
        }
    },
    computed: {
        pieOptions(): any {
            return this.widgetModel?.settings.chartModel?.model?.plotOptions?.pie ?? null
        }
    },
    watch: {
        'pieOptions.enabled'(val: boolean) {
            if (val) this.innerSizeLocal = this.getInnerSizeFromModel() ?? 50
            else this.innerSizeLocal = null
        }
    },
    methods: {
        getInnerSizeFromModel(): number | null {
            const pie: any = this.widgetModel?.settings.chartModel?.model?.plotOptions?.pie
            if (!pie || pie.innerSize === undefined || pie.innerSize === null || pie.innerSize === '') return null
            const value = parseFloat(pie.innerSize)
            return isNaN(value) ? null : value
        },
        onInnerSizeBlur() {
            if (!this.pieOptions?.enabled) return
            let value = this.innerSizeLocal ?? 50
            if (value < 0) value = 0
            if (value > 99) value = 99
            this.innerSizeLocal = value
            this.pieOptions.innerSize = value + '%'
        }
    }
})
</script>
