<!-- eslint-disable vue/valid-v-model -->
<template>
    <div v-if="defaultValuesModel" class="p-grid p-jc-center p-ai-center kn-flex p-p-4">
        <div class="p-col-12 p-grid p-ai-center">
            <div class="p-col-10 p-lg-11 p-grid">
                <div class="p-col-12 p-lg-7 p-fluid p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.defaultValues.selectDafaultValue') }}</label>
                    <Dropdown v-model="defaultValuesModel.valueType" class="kn-material-input" :options="filteredDefaultValuesTypes" option-value="value" :disabled="defaultModelDisabled" @change="onDefaultValuesTypeChanged">
                        <template #value="slotProps">
                            <div>
                                <span>{{ getTranslatedLabel(slotProps.value, descriptor.defaultValuesTypes, $t) }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <div v-if="defaultValuesModel.valueType === 'STATIC'" class="p-col-12 p-lg-5 p-d-flex p-flex-column">
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.value') }}</label>
                    <Calendar v-if="isDateType" v-model="(defaultValuesModel.value as Date)" :disabled="defaultModelDisabled" :manual-input="true" :min-date="getDateRange('startDate')" :max-date="getDateRange('endDate')" @input="defaultValuesChanged" @dateSelect="defaultValuesChanged"></Calendar>
                    <Chips v-if="!isDateType" v-model="defaultValuesModel.value" class="kn-material-input kn-flex" :disabled="defaultModelDisabled" @change="defaultValuesChanged" aria-describedby="chips-help" />
                    <small v-if="!isDateType" id="chips-help">{{ $t('common.chipsHint') }}</small>
                </div>
            </div>
            <div class="p-col-2 p-lg-1 p-d-flex p-jc-center">
                <i v-tooltip.top="$t('dashboard.widgetEditor.defaultValues.hint')" class="pi pi-question-circle kn-cursor-pointer p-ml-auto p-mr-4"></i>
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
import Chips from 'primevue/chips'

export default defineComponent({
    name: 'selector-widget-default-values',
    components: { Calendar, Dropdown, Chips },
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
        },
        filteredDefaultValuesTypes() {
            if (this.isDateType) {
                return this.descriptor.defaultValuesTypes.filter((option) => option.value === 'STATIC')
            }
            return this.descriptor.defaultValuesTypes
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
        },
        getDateRange(rangeValue: string) {
            const dateRange = this.widgetModel.settings.configuration.defaultValues
            if (dateRange[rangeValue]) return new Date(dateRange[rangeValue])
            else return undefined
        }
    }
})
</script>
