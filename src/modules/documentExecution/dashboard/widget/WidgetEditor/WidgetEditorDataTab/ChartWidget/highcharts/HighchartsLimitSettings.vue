<template>
    <form v-if="limitModel" class="p-fluid p-formgrid p-grid p-mt-3">
        <div class="p-col-6 p-lg-4">
            <span class="p-float-label">
                <InputNumber v-model="limitModel.itemsNumber" class="kn-material-input p-inputtext-sm" :disabled="limitSettingsDisabled" />
                <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.highcharts.limit.itemsNumber') }}</label>
            </span>
        </div>
        <span class="p-col-6 p-lg-6 p-d-flex p-ai-center">
            <InputSwitch id="visible" v-model="limitModel.enabled" />
            <label for="visible" class="kn-material-input-label p-ml-2"> {{ $t('common.enable') }} </label>
        </span>
    </form>
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
