<template>
    <Card :style="knCronDescriptor.style.cardContainer">
        <template #content>
            <div class="p-d-flex p-ai-center p-mt-2">
                <div class="p-d-flex p-flex-row p-col-5">
                    <label for="startDate" class="kn-material-input-label p-m-2"> {{ $t('cron.startDate') + ':' }}</label>
                    <span>
                        <Calendar
                            id="startDate"
                            v-model="startDate"
                            class="kn-material-input"
                            :style="knCronDescriptor.style.calendarInput"
                            :class="{
                                'p-invalid': !validDates
                            }"
                            :show-icon="true"
                            :manual-input="true"
                            @change="setDate('startDate')"
                            @date-select="setDate('startDate')"
                        />
                        <div v-show="!validDates" class="p-error p-grid">
                            <small class="p-col-12">
                                {{ $t('kpi.kpiScheduler.dateError') }}
                            </small>
                        </div>
                    </span>
                </div>

                <div class="p-col-4 p-d-flex p-ai-center">
                    <label for="startTime" class="kn-material-input-label p-m-2"> {{ $t('cron.startTime') + ':' }}</label>
                    <span>
                        <Calendar id="startTime" v-model="startTime" :style="knCronDescriptor.style.timePicker" class="kn-material-input custom-timepicker" :manual-input="true" :time-only="true" hour-format="24" @change="setDate('startDate')" @date-select="setDate('startDate')" />
                    </span>
                </div>
            </div>

            <div class="p-d-flex p-ai-center p-mt-3">
                <div class="p-d-flex p-flex-row p-col-5">
                    <label for="endDate" class="kn-material-input-label p-m-2"> {{ $t('cron.endDate') + ':' }}</label>
                    <span>
                        <Calendar
                            id="endDate"
                            v-model="endDate"
                            class="kn-material-input p-ml-2"
                            :style="knCronDescriptor.style.calendarInput"
                            :class="{
                                'p-invalid': !validDates
                            }"
                            :show-icon="true"
                            :manual-input="true"
                            :show-button-bar="true"
                            @change="setDate('endDate')"
                            @date-select="setDate('endDate')"
                            @clear-click="clearEndDate"
                        />
                        <div v-show="!validDates" class="p-error p-grid">
                            <small class="p-col-12">
                                {{ $t('kpi.kpiScheduler.dateError') }}
                            </small>
                        </div>
                    </span>
                </div>

                <div v-if="endDate" class="p-col-6 p-d-flex p-ai-center">
                    <label for="endTime" class="kn-material-input-label p-m-2"> {{ $t('cron.endTime') + ':' }}</label>
                    <span>
                        <Calendar id="endTime" v-model="endTime" :style="knCronDescriptor.style.timePicker" class="kn-material-input p-ml-2 custom-timepicker" :manual-input="true" :time-only="true" hour-format="24" @change="setDate('endDate')" @date-select="setDate('endDate')" />
                    </span>
                </div>
            </div>
            <div class="p-d-flex p-flex-row">
                <div class="p-d-flex p-flex-row p-mt-5">
                    <div class="p-d-flex p-flex-row p-mr-4">
                        <label class="kn-material-input-label p-m-2"> {{ $t('cron.repeatInterval') + ':' }} *</label>
                        <span>
                            <Dropdown
                                id="repeatInterval"
                                v-model="repeatInterval"
                                class="kn-material-input"
                                :class="{ 'p-error': !validInterval }"
                                :style="knCronDescriptor.style.intervalInput"
                                option-label="name"
                                option-value="value"
                                :options="knCronDescriptor.intervals"
                                @change="updateCronInterval"
                            />
                            <div v-show="!validInterval" class="p-error">
                                <small class="p-col-12">
                                    {{ $t('cron.repeatInterval') + ' is required!' }}
                                </small>
                            </div>
                        </span>
                    </div>

                    <div v-if="repeatInterval === 'minute' || repeatInterval === 'hour' || repeatInterval === 'day'" class="p-d-flex p-flex-row">
                        <label for="parameter" class="kn-material-input-label p-m-2"> {{ $t('kpi.kpiScheduler.every') }}</label>
                        <span>
                            <Dropdown id="parameter" v-model="parameter" class="kn-material-input" option-label="name" option-value="value" :options="parameterOptions" @change="updateCronNumberOfRepetition" />
                        </span>
                    </div>
                    <div v-else-if="repeatInterval === 'week'" class="p-d-flex p-flex-row p-m-2">
                        <div v-for="(day, index) in knCronDescriptor.weeklyOptions" :key="index">
                            <span class="p-m-1">{{ day.name + ':' }}</span>
                            <Checkbox v-model="selectedDays" :value="day.value" @click="updateCronDays" />
                        </div>
                    </div>
                    <div v-else-if="repeatInterval === 'month'" class="p-d-flex p-flex-row">
                        <div class="p-m-2">
                            <div>
                                <span class="p-mr-2">{{ $t('cron.advanced') }}</span>
                                <InputSwitch v-model="simpleMonth" class="p-mr-2" />
                                <span>{{ $t('cron.simple') }}</span>
                            </div>
                            <div v-if="simpleMonth" class="p-d-flex p-flex-row p-mt-2">
                                <label for="parameterMonth" class="kn-material-input-label p-m-2"> {{ $t('kpi.kpiScheduler.every') }}</label>
                                <Dropdown v-model="parameter" class="kn-material-input" option-label="name" option-value="value" :options="parameterOptions" @change="updateCronSimpleMonthRepetition(true)" />
                                <label for="parameterMonth" class="kn-material-input-label p-m-2"> {{ $t('cron.months') }}</label>
                            </div>
                            <div v-else class="p-d-flex p-flex-row p-mt-2">
                                <label class="kn-material-input-label p-m-2"> {{ $t('cron.inMonth') }}</label>
                                <MultiSelect v-model="selectedMonths" class="kn-material-input" option-label="name" option-value="value" :options="parameterOptions" @change="updateCronAdvancedMonthRepetition(true)" />
                            </div>
                        </div>
                        <div class="p-m-2">
                            <span class="p-mr-2">{{ $t('cron.advanced') }}</span>
                            <InputSwitch v-model="simpleDay" class="p-mr-2" />
                            <span>{{ $t('cron.simple') }}</span>
                            <div v-if="simpleDay" class="p-d-flex p-flex-row p-mt-2">
                                <label for="parameterDay" class="kn-material-input-label p-m-2"> {{ $t('cron.theDay') }}</label>
                                <Dropdown v-model="simpleDayParameter" class="kn-material-input" option-label="name" option-value="value" :options="dayOptions" @change="updateCronSimpleDayRepetition(true)" />
                            </div>
                            <div v-else class="p-d-flex p-flex-row p-mt-2">
                                <label for="parameterDay" class="kn-material-input-label p-m-2"> {{ $t('cron.theWeek') }}</label>
                                <Dropdown v-model="parameterDay" class="kn-material-input" :style="knCronDescriptor.style.advancedDayDropdown" option-label="name" option-value="value" :options="knCronDescriptor.dayOptions" @change="updateCronAdvancedDayRepetition(true)" />
                                <label for="parameterDay" class="kn-material-input-label p-m-2"> {{ $t('cron.inDay') }}</label>
                                <MultiSelect v-model="selectedDays" class="kn-material-input" option-label="name" option-value="value" :options="knCronDescriptor.weeklyOptions" @change="updateCronAdvancedDayRepetition" />
                            </div>
                        </div>
                    </div>
                    <label v-if="repeatInterval === 'minute'" for="parameter" class="kn-material-input-label p-m-2"> {{ $t('cron.minutes') }}</label>
                    <label v-else-if="repeatInterval === 'hour'" for="parameter" class="kn-material-input-label p-m-2"> {{ $t('cron.hours') }}</label>
                    <label v-else-if="repeatInterval === 'day'" for="parameter" class="kn-material-input-label p-m-2"> {{ $t('cron.days') }}</label>
                </div>
                <!-- <div id="next-schedulation">
                    <Message class="p-m-4" severity="info" :closable="false" :style="knCronDescriptor.styles.message">
                        {{ 'NEXT SCHEDULATION PLACEHOLDER' }}
                    </Message>
                </div> -->
            </div>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import knCronDescriptor from './KnCronDescriptor.json'
// import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'

export default defineComponent({
    name: 'frequency-card',
    components: {
        Calendar,
        Card,
        Checkbox,
        Dropdown,
        InputSwitch,
        // Message,
        MultiSelect
    },
    props: {
        frequency: {
            type: Object,
            required: true
        }
    },
    emits: ['touched', 'cronValid'],
    data() {
        return {
            knCronDescriptor,
            currentFrequency: {} as any,
            startDate: null as Date | null,
            endDate: null as Date | null,
            startTime: null as Date | null,
            endTime: null as Date | null,
            repeatInterval: null as string | null,
            parameter: null as string | null,
            parameterOptions: [] as any[],
            simpleMonth: true,
            simpleDay: true,
            parameterMonth: null,
            parameterDay: null as number | null,
            dayOptions: [] as any[],
            selectedDays: [] as any,
            selectedMonths: [] as any,
            simpleDayParameter: null as number | null
        }
    },
    computed: {
        validDates() {
            let valid = true
            const startDate = this.currentFrequency.startDate
            const now = new Date()
            const endDate = this.currentFrequency.endDate

            if (endDate && endDate.valueOf() < now.valueOf()) {
                valid = false
            }

            if (endDate && startDate && endDate.valueOf() < startDate.valueOf()) {
                valid = false
            }

            return valid
        },
        validInterval(): boolean {
            const valid = this.repeatInterval ? true : false
            return valid
        },
        combinedValidity() {
            const validDates = this.validDates
            const validInterval = this.validInterval
            const combinedValid = validDates && validInterval
            this.$emit('cronValid', combinedValid)
            return combinedValid
        }
    },
    watch: {
        simpleMonth(value) {
            if (value) {
                this.fillParameterOptions(12)
                delete this.currentFrequency.cron.parameter.months
                this.parameter = '1' as any
                this.updateCronSimpleMonthRepetition(false)
            } else {
                this.parameterOptions = this.knCronDescriptor.monthOptions
                delete this.currentFrequency.cron.parameter.numRepetition
                this.parameter = null
                this.updateCronAdvancedMonthRepetition(false)
            }
        },
        simpleDay(value) {
            if (value) {
                this.fillDayOptions()
                delete this.currentFrequency.cron.parameter.weeks
                delete this.currentFrequency.cron.parameter.days
                this.updateCronSimpleDayRepetition(false)
            } else {
                this.dayOptions = this.knCronDescriptor.weeklyOptions
                delete this.currentFrequency.cron.parameter.dayRepetition
                this.updateCronAdvancedDayRepetition(false)
            }
        },
        frequency() {
            if (!this.frequency) return
            this.loadFrequency()
        }
    },
    async created() {
        this.loadFrequency()
    },
    methods: {
        loadFrequency() {
            this.currentFrequency = this.frequency as any

            this.startDate = new Date(this.currentFrequency.startDate)
            this.startTime = new Date(this.currentFrequency.startDate)
            this.startDate.setHours(0)
            this.startDate.setMinutes(0)
            this.startDate.setSeconds(0)
            this.startTime.setMilliseconds(0)

            if (this.currentFrequency.endDate) {
                this.endDate = new Date(this.currentFrequency.endDate)
                this.endTime = new Date(this.currentFrequency.endDate)
                this.endDate.setHours(0)
                this.endDate.setMinutes(0)
                this.endDate.setSeconds(0)
            } else {
                this.endDate = null
                this.endTime = null
            }

            this.currentFrequency.startTime = ''
            this.currentFrequency.endTime = ''

            if (!this.currentFrequency.cron) {
                this.currentFrequency.cron = { type: 'minute', parameter: { numRepetition: '1' } }
            }

            this.repeatInterval = this.currentFrequency.cron.type
            this.updateParameterOptionsBasedOnRepeatInterval()
            switch (this.repeatInterval) {
                case 'minute':
                case 'hour':
                case 'day':
                    this.parameter = ('' + this.currentFrequency.cron.parameter.numRepetition) as any
                    break
                case 'week':
                    this.selectedDays = []
                    this.currentFrequency.cron.parameter.days.forEach((day) => this.selectedDays.push(day))

                    break
                case 'month': {
                    if (this.currentFrequency.cron.parameter.months) {
                        this.selectedMonths = []
                        this.currentFrequency.cron.parameter.months.forEach((month) => {
                            this.selectedMonths.push(month)
                        })
                        this.simpleMonth = false
                    } else {
                        this.parameter = this.currentFrequency.cron.parameter.numRepetition as any
                    }
                    if (this.currentFrequency.cron.parameter.weeks) {
                        this.selectedDays = []
                        this.currentFrequency.cron.parameter.days.forEach((day) => this.selectedDays.push('' + day))
                        this.parameterDay = this.currentFrequency.cron.parameter.weeks
                        this.simpleDay = false
                    } else {
                        this.simpleDayParameter = this.currentFrequency.cron.parameter.dayRepetition
                    }
                }
            }
        },
        updateParameterOptionsBasedOnRepeatInterval() {
            switch (this.repeatInterval) {
                case 'minute':
                    this.fillParameterOptions(60)
                    break

                case 'hour':
                    this.fillParameterOptions(24)
                    break
                case 'day':
                    this.fillParameterOptions(31)
                    break
                case 'week':
                    this.selectedDays = []
                    break
                case 'month': {
                    this.fillParameterOptions(12)
                    this.fillDayOptions()
                    this.selectedDays = []
                }
            }
            this.parameter = '1' as any
            this.simpleDayParameter = '1' as any
        },
        fillParameterOptions(number: number) {
            this.parameterOptions = []
            for (let i = 1; i <= number; i++) {
                this.parameterOptions.push({
                    name: i,
                    value: '' + i
                })
            }
        },
        fillDayOptions() {
            this.dayOptions = []
            for (let i = 1; i <= 31; i++) {
                this.dayOptions.push({
                    name: i,
                    value: '' + i
                })
            }
        },
        updateCronInterval() {
            this.updateParameterOptionsBasedOnRepeatInterval()
            this.currentFrequency.cron ? (this.currentFrequency.cron.type = this.repeatInterval) : (this.currentFrequency.cron = { type: this.repeatInterval })
            switch (this.repeatInterval) {
                case 'minute':
                case 'hour':
                case 'day':
                    this.currentFrequency.cron = { type: this.currentFrequency.cron.type, parameter: { numRepetition: this.parameter } }
                    break
                case 'week':
                    this.currentFrequency.cron = { type: this.currentFrequency.cron.type, parameter: { days: this.selectedDays.map((day) => day) } }
                    break
                case 'month': {
                    this.currentFrequency.cron = { type: this.currentFrequency.cron.type, parameter: { numRepetition: this.parameter, dayRepetition: this.simpleDayParameter } }
                }
            }
            this.$emit('touched')
        },
        updateCronNumberOfRepetition() {
            this.currentFrequency.cron = { type: this.currentFrequency.cron.type, parameter: { numRepetition: this.parameter } }
            this.$emit('touched')
        },
        updateCronDays() {
            setTimeout(() => {
                this.currentFrequency.cron = { type: this.currentFrequency.cron.type, parameter: { days: this.selectedDays } }
                this.$emit('touched')
            }, 50)
        },
        updateCronSimpleMonthRepetition(touched: boolean) {
            this.currentFrequency.cron.parameter.numRepetition = this.parameter
            if (touched) {
                this.$emit('touched')
            }
        },
        updateCronSimpleDayRepetition(touched: boolean) {
            this.currentFrequency.cron.parameter.dayRepetition = this.simpleDayParameter
            if (touched) {
                this.$emit('touched')
            }
        },
        updateCronAdvancedMonthRepetition(touched: boolean) {
            this.currentFrequency.cron.parameter.months = this.selectedMonths
            if (touched) {
                this.$emit('touched')
            }
        },
        updateCronAdvancedDayRepetition(touched: boolean) {
            this.currentFrequency.cron.parameter.weeks = this.parameterDay
            this.currentFrequency.cron.parameter.days = this.selectedDays
            if (touched) {
                this.$emit('touched')
            }
        },
        setDate(type: string) {
            this.startDate?.setSeconds(0)
            this.startDate?.setMilliseconds(0)
            const date = type === 'startDate' ? this.startDate?.valueOf() : this.endDate?.valueOf()
            const tempTime = type === 'startDate' ? this.startTime : this.endTime

            let time = 0
            if (tempTime && tempTime instanceof Date) {
                time = tempTime.getHours() * 60 * 60 * 1000 + tempTime.getMinutes() * 60 * 1000
            }

            if (date) {
                this.currentFrequency[type] = date + time
            }

            this.$emit('touched')
        },
        clearEndDate() {
            this.currentFrequency.endDate = null
        }
    }
})
</script>
<style lang="css">
.custom-timepicker .p-datepicker {
    border-color: transparent;
}

#next-schedulation {
    margin-left: auto;
}
</style>
