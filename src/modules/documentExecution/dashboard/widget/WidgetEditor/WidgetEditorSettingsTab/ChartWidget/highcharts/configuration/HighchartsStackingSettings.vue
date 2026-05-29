<template>
    <div v-if="seriesSettings" class="q-px-md q-pb-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
                <q-select v-model="seriesSettings.stacking" :label="$t('dashboard.widgetEditor.highcharts.stackingMode')" emit-value map-options outlined dense :options="descriptor.stackingOptions" option-value="value" option-label="label">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.stackingOptions, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section>
                                <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                            </q-item-section>
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
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsConfigurationDescriptor.json'

export default defineComponent({
    name: 'highcharts-stacking-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IWidget | null,
            seriesSettings: null as any,
            getTranslatedLabel
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel
            if (this.widgetModel.settings.chartModel?.model?.plotOptions?.series) this.seriesSettings = this.widgetModel.settings.chartModel.model.plotOptions.series
        }
    }
})
</script>
