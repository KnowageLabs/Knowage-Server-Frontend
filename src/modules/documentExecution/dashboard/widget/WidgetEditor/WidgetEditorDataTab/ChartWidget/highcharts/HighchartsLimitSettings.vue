<template>
    <div v-if="limitModel" class="p-grid p-jc-center p-ai-center">
        <div class="p-col-12 p-md-3">
            <label class="kn-material-input-label p-mr-4">{{ $t('common.enable') }}</label>
            <InputSwitch v-model="limitModel.enabled"></InputSwitch>
        </div>
        <div class="p-col-12 p-md-7 p-d-flex p-flex-column">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.limit.itemsNumber') }}</label>
            <InputNumber v-model="limitModel.itemsNumber" class="kn-material-input p-inputtext-sm" :disabled="limitSettingsDisabled" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'

export default defineComponent({
    name: 'highcharts-limit-settings',
    components: { InputNumber, InputSwitch },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            limitModel: null as any,
            getTranslatedLabel
        }
    },
    computed: {
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
            else this.limitModel = { enabled: false, itemsNumber: null }
        }
    }
})
</script>
