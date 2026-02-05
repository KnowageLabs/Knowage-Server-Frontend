<template>
    <div class="date-range-selector" :class="{ 'has-custom-color': isCustomColor, 'has-custom-bg': isCustomBgColor }" :style="customStyles">
        <q-input :model-value="formattedRange" :label="$t('dashboard.widgetEditor.selectorWidget.dateRange.title')" filled :dense="dateRangeStyle.dense" readonly :color="computedColor" :bg-color="computedBgColor" :dark="dateRangeStyle.darkMode">
            <template #append>
                <q-icon name="event" class="cursor-pointer" />
            </template>
            <q-popup-proxy transition-show="scale" transition-hide="scale">
                <q-date v-model="rangeModel" range :options="availableOptions" :navigation-min-year-month="getNavigationYearMonth('min')" :navigation-max-year-month="getNavigationYearMonth('max')" :default-year-month="defaultYearMonth" :dark="dateRangeStyle.darkMode" minimal @update:model-value="onRangeChanged" />
            </q-popup-proxy>
        </q-input>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ISelectorWidgetDateRangeStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import moment from 'moment'
import dashboardDescriptor from '../../../DashboardDescriptor.json'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'

export default defineComponent({
    name: 'date-range-selector',
    props: {
        modelValue: { type: Array as PropType<string[]>, required: true },
        dateRangeStyle: { type: Object as PropType<ISelectorWidgetDateRangeStyle>, required: true },
        availableDates: { type: Array as PropType<string[]>, default: () => [] },
        minDate: { type: String, default: '' },
        maxDate: { type: String, default: '' }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            rangeModel: {
                from: '',
                to: ''
            }
        }
    },
    computed: {
        isCustomColor(): boolean {
            const color = this.dateRangeStyle?.color || ''
            return /^(#|rgb)/.test(color)
        },
        isCustomBgColor(): boolean {
            const color = this.dateRangeStyle?.bgColor || ''
            return /^(#|rgb)/.test(color)
        },
        computedColor(): string | undefined {
            if (this.isCustomColor) return undefined
            return this.dateRangeStyle?.color || 'primary'
        },
        computedBgColor(): string | undefined {
            if (this.isCustomBgColor) return undefined
            return this.dateRangeStyle?.bgColor || undefined
        },
        customStyles(): Record<string, string> {
            const styles: Record<string, string> = {}
            if (this.isCustomColor) {
                styles.color = this.dateRangeStyle.color!
            }
            if (this.isCustomBgColor) {
                styles['--custom-bg-color'] = this.dateRangeStyle.bgColor!
            }
            return styles
        },
        formattedRange(): string {
            if (!this.rangeModel.from || !this.rangeModel.to) return ''
            const from = formatDateWithLocale(this.rangeModel.from)
            const to = formatDateWithLocale(this.rangeModel.to)
            return `${from} - ${to}`
        },
        availableOptions(): (date: string) => boolean {
            return (date: string) => {
                if (this.availableDates.length === 0) {
                    if (this.minDate && date < this.minDate) return false
                    if (this.maxDate && date > this.maxDate) return false
                    return true
                }

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
    watch: {
        modelValue() {
            this.loadInitialValues()
        }
    },
    created() {
        this.loadInitialValues()
    },
    methods: {
        loadInitialValues() {
            if (this.modelValue && this.modelValue.length >= 2) {
                this.rangeModel = {
                    from: this.modelValue[0] || '',
                    to: this.modelValue[1] || ''
                }
            }
        },
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
        onRangeChanged(range: any) {
            const filteredValues = this.filterAvailableDatesByRange([range.from, range.to])
            this.$emit('update:modelValue', { filteredDates: filteredValues, range: { from: range.from, to: range.to } })
        },
        filterAvailableDatesByRange(rangeDates: string[]): string[] {
            if (!this.availableDates || this.availableDates.length === 0) return []
            if (!rangeDates || rangeDates.length < 2 || !rangeDates[0] || !rangeDates[1]) return []

            const startMoment = moment(rangeDates[0], 'YYYY/MM/DD')
            const endMoment = moment(rangeDates[1], 'YYYY/MM/DD')

            return this.availableDates.filter((date) => {
                const dateMoment = moment(date, dashboardDescriptor.selectionsDateMultiFormat)
                const isAfterStart = dateMoment.isSameOrAfter(startMoment, 'day')
                const isBeforeEnd = dateMoment.isSameOrBefore(endMoment, 'day')
                return isAfterStart && isBeforeEnd
            })
        }
    }
})
</script>

<style lang="scss" scoped>
.date-range-selector {
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
