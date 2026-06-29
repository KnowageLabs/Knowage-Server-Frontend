<template>
    <div v-if="model?.sonification" class="q-px-md q-pb-lg">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
                <q-input v-model.number="model.sonification.duration" type="number" :label="$t('dashboard.widgetEditor.highcharts.sonification.duration')" outlined dense :disable="sonificationDisabled" :hint="$t('dashboard.widgetEditor.highcharts.sonification.durationHint')" />
            </div>
            <div class="col-6">
                <q-select v-model="model.sonification.order" :label="$t('dashboard.widgetEditor.highcharts.sonification.order')" emit-value map-options outlined dense :options="descriptor.sonificationOrderOptions" option-value="value" option-label="label" :disable="sonificationDisabled" :hint="$t('dashboard.widgetEditor.highcharts.sonification.orderHint')">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.sonificationOrderOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section
                                ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </template>
                </q-select>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsAccessibilityDescriptor.json'

export default defineComponent({
    name: 'highcharts-sonification-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IHighchartsChartModel | null,
            getTranslatedLabel
        }
    },
    computed: {
        sonificationDisabled(): boolean {
            return !this.model || !this.model.sonification.enabled
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
        }
    }
})
</script>
