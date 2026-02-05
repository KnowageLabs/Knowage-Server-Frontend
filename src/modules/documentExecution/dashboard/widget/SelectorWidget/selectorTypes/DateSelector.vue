<template>
    <div class="date-selector" :class="{ 'has-custom-color': isCustomColor, 'has-custom-bg': isCustomBgColor }" :style="customStyles">
        <q-input :model-value="formattedValue" :label="label" filled :dense="dateStyle.dense" readonly :color="computedColor" :bg-color="computedBgColor" :dark="dateStyle.darkMode">
            <template #append>
                <q-icon name="event" class="cursor-pointer" />
            </template>
            <q-popup-proxy transition-show="scale" transition-hide="scale">
                <q-date :model-value="modelValue" :options="availableOptions" :navigation-min-year-month="getNavigationYearMonth('min')" :navigation-max-year-month="getNavigationYearMonth('max')" :default-year-month="defaultYearMonth" :dark="dateStyle.darkMode" minimal @update:model-value="onDateChanged" />
            </q-popup-proxy>
        </q-input>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetDateStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import moment from 'moment'
import dashboardDescriptor from '../../../DashboardDescriptor.json'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'

export default defineComponent({
    name: 'date-selector',
    props: {
        modelValue: { type: String, required: true },
        dateStyle: { type: Object as PropType<ISelectorWidgetDateStyle>, required: true },
        label: { type: String, default: '' },
        availableDates: { type: Array as PropType<string[]>, default: () => [] },
        minDate: { type: String, default: '' },
        maxDate: { type: String, default: '' }
    },
    emits: ['update:modelValue'],
    computed: {
        isCustomColor(): boolean {
            const color = this.dateStyle?.color || ''
            return /^(#|rgb)/.test(color)
        },
        isCustomBgColor(): boolean {
            const color = this.dateStyle?.bgColor || ''
            return /^(#|rgb)/.test(color)
        },
        computedColor(): string | undefined {
            if (this.isCustomColor) return undefined
            return this.dateStyle?.color || 'primary'
        },
        computedBgColor(): string | undefined {
            if (this.isCustomBgColor) return undefined
            return this.dateStyle?.bgColor || undefined
        },
        customStyles(): Record<string, string> {
            const styles: Record<string, string> = {}
            if (this.isCustomColor) {
                styles.color = this.dateStyle.color!
            }
            if (this.isCustomBgColor) {
                styles['--custom-bg-color'] = this.dateStyle.bgColor!
            }
            return styles
        },
        formattedValue(): string {
            if (!this.modelValue) return ''
            return formatDateWithLocale(this.modelValue)
        },
        availableOptions(): (date: string) => boolean {
            return (date: string) => {
                // If no available dates specified, allow all dates within min/max range
                if (this.availableDates.length === 0) {
                    if (this.minDate && date < this.minDate) return false
                    if (this.maxDate && date > this.maxDate) return false
                    return true
                }

                // Check if date is in available dates and within min/max range
                const isAvailable = this.availableDates.some((availableDate) => {
                    const parsedDate = moment(availableDate, dashboardDescriptor.selectionsDateFormat).format('YYYY/MM/DD')
                    const checkDate = moment(date, 'YYYY/MM/DD').format('YYYY/MM/DD')
                    return parsedDate === checkDate
                })

                if (!isAvailable) return false
                if (this.minDate && date < this.minDate) return false
                if (this.maxDate && date > this.maxDate) return false

                return true
            }
        },
        defaultYearMonth(): string {
            if (this.availableDates.length === 0) {
                if (this.minDate) return this.minDate.substring(0, 7)
                return '1900/01'
            }

            const parsedDates = this.availableDates.map((date) => moment(date, dashboardDescriptor.selectionsDateFormat))
            const minDate = moment.min(parsedDates)
            return minDate.format('YYYY/MM')
        }
    },
    methods: {
        getNavigationYearMonth(type: 'min' | 'max'): string {
            const isMin = type === 'min'
            const fallback = isMin ? '1900/01' : '2100/12'
            const dateBoundary = isMin ? this.minDate : this.maxDate

            if (this.availableDates.length === 0) {
                return dateBoundary ? dateBoundary.substring(0, 7) : fallback
            }

            const parsedDates = this.availableDates.map((date) => moment(date, dashboardDescriptor.selectionsDateFormat))
            const availableDate = isMin ? moment.min(parsedDates) : moment.max(parsedDates)

            if (dateBoundary) {
                const rangeDate = moment(dateBoundary, 'YYYY/MM/DD')
                const combined = isMin ? moment.max(availableDate, rangeDate) : moment.min(availableDate, rangeDate)
                return combined.format('YYYY/MM')
            }

            return availableDate.format('YYYY/MM')
        },
        onDateChanged(newDate: string) {
            this.$emit('update:modelValue', newDate)
        }
    }
})
</script>

<style lang="scss" scoped>
.date-selector {
    width: 100%;

    &.has-custom-color :deep(.q-field__control),
    &.has-custom-color :deep(.q-field__append),
    &.has-custom-color :deep(.q-field__prepend) {
        color: inherit !important;
    }

    &.has-custom-bg :deep(.q-field__control) {
        background-color: var(--custom-bg-color) !important;
    }
}
</style>
