<!-- eslint-disable vue/valid-v-model -->
<template>
    <div v-if="defaultValuesModel" class="p-grid p-jc-center p-ai-center kn-flex p-p-4">
        <div class="p-col-12 p-grid p-ai-center">
            <div v-if="isDateType" class="p-col-10 p-lg-11 p-grid">
                <div class="p-col-12 p-lg-6 p-d-flex p-flex-column">
                    <label class="kn-material-input-label"> {{ $t('cron.startDate') }}</label>
                    <Calendar v-model="(defaultValuesModel.startDate as Date)" :manual-input="true" @input="defaultValuesChanged" @dateSelect="defaultValuesChanged"></Calendar>
                </div>

                <div class="p-col-12 p-lg-6 p-d-flex p-flex-column">
                    <label class="kn-material-input-label"> {{ $t('cron.endDate') }}</label>
                    <Calendar v-model="(defaultValuesModel.endDate as Date)" :manual-input="true" @input="defaultValuesChanged" @dateSelect="defaultValuesChanged"></Calendar>
                </div>
            </div>
            <div class="p-col-2 p-lg-1 p-d-flex p-jc-center">
                <i v-tooltip.top="$t('dashboard.widgetEditor.dateRange.hint')" class="pi pi-question-circle kn-cursor-pointer p-ml-auto p-mr-4"></i>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import { ISelectorWidgetDefaultValues } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '../../../../../DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../SelectorWidgetSettingsDescriptor.json'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'selector-widget-default-values',
    components: { Calendar, Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            defaultValuesModel: null as ISelectorWidgetDefaultValues | null,
            getTranslatedLabel
        }
    },
    computed: {
        defaultModelDisabled() {
            return !this.defaultValuesModel || !this.defaultValuesModel.enabled
        },
        isDateType() {
            return this.widgetModel?.settings?.isDateType
        }
    },
    watch: {
        isDateType() {
            this.onDefaultValuesTypeChanged()
        }
    },
    created() {
        this.loadDefaultValuesModel()
    },
    methods: {
        loadDefaultValuesModel() {
            if (this.widgetModel.settings?.configuration?.defaultValues) this.defaultValuesModel = this.widgetModel.settings.configuration.defaultValues
        },
        defaultValuesChanged() {
            emitter.emit('defaultValuesChanged', this.widgetModel.id)
            emitter.emit('refreshSelector', this.widgetModel.id)
        },
        onDefaultValuesTypeChanged() {
            if (!this.defaultValuesModel) return
            if (this.defaultValuesModel.valueType !== 'STATIC') delete this.defaultValuesModel.value
            this.defaultValuesChanged()
        }
    }
})
</script>
