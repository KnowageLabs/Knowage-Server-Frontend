<template>
    <div v-if="limitModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ 'TODO' }}
            {{ limitModel }}
        </div>
        <div class="p-col-12 p-md-4 p-d-flex p-flex-column p-p-2">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.limit.sortBySerie') }}</label>
            <Dropdown v-model="limitModel.direction" class="kn-material-input" :options="seriesOptions" option-value="columnName" option-label="columnName" :disabled="limitSettingsDisabled"> </Dropdown>
        </div>
        <div class="p-col-12 p-md-4 p-d-flex p-flex-column">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.limit.itemsNumber') }}</label>
            <InputNumber v-model="limitModel.itemsNumber" class="kn-material-input p-inputtext-sm" :disabled="limitSettingsDisabled" />
        </div>
        <div class="p-col-12 p-md-4 p-d-flex p-flex-column p-p-2">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.limit.direction') }}</label>
            <Dropdown v-model="limitModel.direction" class="kn-material-input" :options="descriptor.limitDirectionOptions" option-value="value" :disabled="limitSettingsDisabled">
                <template #value="slotProps">
                    <div>
                        <span>{{ getTranslatedLabel(slotProps.value, descriptor.limitDirectionOptions, $t) }}</span>
                    </div>
                </template>
                <template #option="slotProps">
                    <div>
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </template>
            </Dropdown>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from './HighchartsConfigurationDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'

export default defineComponent({
    name: 'highcharts-limit-settings',
    components: { Dropdown, InputNumber },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            limitModel: null as any,
            getTranslatedLabel
        }
    },
    computed: {
        seriesOptions() {
            return this.widgetModel ? this.widgetModel.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE') : []
        },
        limitSettingsDisabled() {
            return this.limitModel && !this.limitModel.enabled
        }
    },
    created() {
        this.loadLimitModel()
    },
    methods: {
        loadLimitModel() {
            if (this.widgetModel.settings?.configuration?.limit) this.limitModel = this.widgetModel.settings.configuration.limit
        }
    }
})
</script>
