<template>
    <Message v-if="showHint" severity="info" :closable="false"> {{ $t('managers.workspaceManagement.dataPreparation.monitoring.hint') }} </Message>

    <div class="row">
        <q-card class="col-4 q-ma-md">
            <q-card-section class="row q-ma-md">
                <div class="col-12 row justify-between">
                    <q-toggle v-model="enableSchedulation" :label="$t('knScheduler.enableSchedulation')" @update:model-value="toggleSchedulationEnabled" />
                    <q-btn v-if="enableSchedulation" :icon="paused ? 'play_arrow' : 'pause'" rounded flat @click="togglePause">
                        <q-tooltip :delay="500">{{ paused ? $t('knScheduler.resumeSchedulation') : $t('knScheduler.pauseSchedulation') }}</q-tooltip>
                    </q-btn>
                </div>
                <div class="col-12">
                    <q-input v-model="startDate" :label="$t('kpi.targetDefinition.startDate')" @update:model-value="$emit('touched')" :mask="locale === 'en_US' ? '####/##/##' : '##/##/####'" :disable="isDisabled" filled>
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-date v-model="startDate" :mask="locale === 'en_US' ? 'YYYY/MM/DD' : 'DD/MM/YYYY'" :rules="['date']" bordered>
                                <div class="row items-center justify-end">
                                    <q-btn v-close-popup label="Close" color="primary" flat />
                                </div>
                            </q-date>
                        </q-popup-proxy>
                    </q-input>
                </div>

                <div class="col-12 q-ma-md">
                    <q-select
                        v-model="selectedRefreshRate"
                        :options="refreshRates"
                        option-label="name"
                        option-value="code"
                        map-options
                        emit-value
                        filled
                        :disable="isDisabled"
                        :label="$t(descriptor?.refreshRate.placeholder)"
                        @update:model-value="
                            () => {
                                resetFormula()
                                $emit('touched')
                            }
                        "
                    />

                    <div v-if="selectedRefreshRate === 'daily'" class="row q-ma-md">
                        <div class="row wrap items-center">
                            <q-radio id="dayConf1" v-model="dayConf" :class="descriptor?.style.radiobutton" name="dayConf" val="everyDay" :disable="isDisabled" @change="$emit('touched')" />
                            <i18n-t keypath="knScheduler.everyDay" tag="div" class="p-d-flex p-ai-center p-mr-2">
                                <template #day>
                                    <q-select
                                        id="type"
                                        v-model="selectedDay"
                                        option-label="name"
                                        option-value="code"
                                        map-options
                                        emit-value
                                        :options="getNumberOptions(5)"
                                        :disable="isDisabled"
                                        filled
                                        @change="
                                            () => {
                                                dayConf = 'everyDay'
                                                $emit('touched')
                                            }
                                        "
                                    />
                                </template>
                            </i18n-t>

                            <span class="m-2" style="white-space: nowrap">
                                {{ $t('knScheduler.startingIn') }}
                            </span>
                            <q-select
                                id="type"
                                v-model="selectedDayExtended"
                                option-label="name"
                                option-value="id"
                                map-options
                                emit-value
                                filled
                                :options="days"
                                :disable="isDisabled"
                                @change="
                                    () => {
                                        dayConf = 'everyDay'
                                        $emit('touched')
                                    }
                                "
                            />
                        </div>

                        <div class="p-d-flex p-ai-center">
                            <q-radio id="dayConf2" v-model="dayConf" :class="descriptor?.style.radiobutton" name="dayConf" val="everyNotWorkingDays" :disable="isDisabled" @change="$emit('touched')" />
                            {{ $t('knScheduler.everyNotWorkingDays') }}
                        </div>
                    </div>
                    <div v-if="selectedRefreshRate === 'weekly'" class="row q-ma-md">
                        <div v-for="(day, index) in descriptor?.days" :key="index">
                            <q-btn
                                square
                                :color="selectedWeekdays[day.id] ? 'primary' : ''"
                                :text-color="selectedWeekdays[day.id] ? 'white' : 'primary'"
                                @click="
                                    () => {
                                        selectedWeekdays[day.id] === day.code || (selectedWeekdays[day.id] && selectedWeekdays[day.id].includes(day.code)) ? delete selectedWeekdays[day.id] : (selectedWeekdays[day.id] = day.code)
                                        $emit('touched')
                                    }
                                "
                                :label="$t(day.name).substring(0, 2)"
                                :disable="isDisabled"
                            >
                            </q-btn>
                        </div>
                    </div>
                    <div v-else-if="selectedRefreshRate === 'monthly'" class="q-ma-md">
                        <i18n-t keypath="knScheduler.everyMonth" tag="div">
                            <template #month>
                                <q-select id="selectedMonth" v-model="selectedMonth" option-label="name" option-value="id" map-options emit-value :options="getNumberOptions(5)" :disable="isDisabled" filled />
                            </template>
                        </i18n-t>

                        <div>
                            {{ $t('knScheduler.startingIn') }}
                            <q-select id="selectedMonthExtended" v-model="selectedMonthExtended" :class="descriptor?.style.dropdown" data-key="id" option-label="name" option-value="id" :options="months" map-options emit-value :disable="isDisabled" filled />
                        </div>

                        <div class="p-d-flex p-ai-center p-flex-wrap itemClass">
                            <q-radio id="monthConf1" v-model="monthConf" :class="descriptor?.style.radiobutton" name="monthConf" val="theDay" :disable="isDisabled" @change="$emit('touched')" />
                            <q-select
                                id="selectedDayNumber"
                                v-model="selectedDayNumber"
                                data-key="id"
                                option-label="name"
                                option-value="code"
                                :options="getNumberOptions(31)"
                                map-options
                                emit-value
                                @change="
                                    () => {
                                        monthConf = 'theDay'
                                    }
                                "
                                :disable="isDisabled"
                                filled
                            />
                        </div>

                        <div class="p-d-flex p-ai-center p-flex-wrap itemClass">
                            <q-radio id="monthConf2" v-model="monthConf" :class="descriptor?.style.radiobutton" name="monthConf" :disable="isDisabled" val="theOrdinalDay" />
                            {{ $t('knScheduler.the') }}
                            <q-select
                                id="selectedDayOrdinal"
                                v-model="selectedDayOrdinal"
                                :class="descriptor?.style.dropdown"
                                data-key="id"
                                option-label="name"
                                option-value="id"
                                :options="ordinal"
                                map-options
                                emit-value
                                :disable="isDisabled"
                                @change="
                                    () => {
                                        monthConf = 'theOrdinalDay'
                                    }
                                "
                                filled
                            />

                            <q-select
                                id="selectedDayExtended"
                                v-model="selectedDayExtended"
                                :class="descriptor?.style.dropdown"
                                data-key="id"
                                option-label="name"
                                option-value="id"
                                :options="days"
                                map-options
                                emit-value
                                :disable="isDisabled"
                                @change="
                                    () => {
                                        monthConf = 'theOrdinalDay'
                                    }
                                "
                                filled
                            />
                        </div>
                    </div>
                    <div v-else-if="selectedRefreshRate === 'yearly'" class="q-ma-md">
                        <i18n-t keypath="knScheduler.everyYear" tag="div">
                            <template #year>
                                <q-select id="selectedYear" v-model="selectedYear" :class="descriptor?.style.dropdown" data-key="id" option-label="name" option-value="code" :options="getNumberOptions(5)" map-options emit-value :disabled="isDisabled" filled />
                            </template>
                        </i18n-t>

                        <div class="p-d-flex p-ai-center">
                            {{ $t('knScheduler.in') }}

                            <q-select id="selectedMonth" v-model="selectedMonth" :class="descriptor?.style.dropdown" data-key="id" option-label="name" option-value="code" map-options emit-value :options="months" max-length="100" :disabled="isDisabled" filled />
                        </div>

                        <div class="p-d-flex p-ai-center p-flex-wrap itemClass">
                            <q-radio id="monthConf1" v-model="yearConf" :class="descriptor?.style.radiobutton" name="yearConf" val="theDay" :disabled="isDisabled" /> {{ $t('knScheduler.theDay') }}

                            <q-select
                                id="type"
                                v-model="selectedDayNumber"
                                :class="descriptor?.style.dropdown"
                                data-key="id"
                                option-label="name"
                                option-value="code"
                                :options="getNumberOptions(31)"
                                map-options
                                emit-value
                                :disabled="isDisabled"
                                @change="
                                    () => {
                                        yearConf = 'theDay'
                                    }
                                "
                                filled
                            />
                        </div>

                        <div class="p-d-flex p-ai-center p-flex-wrap itemClass">
                            <q-radio id="monthConf2" v-model="yearConf" :class="descriptor?.style.radiobutton" name="yearConf" val="theOrdinalDay" :disabled="isDisabled" /> {{ $t('knScheduler.the') }}

                            <q-select
                                id="selectedDayOrdinal"
                                v-model="selectedDayOrdinal"
                                :class="descriptor?.style.dropdown"
                                data-key="id"
                                option-label="name"
                                option-value="id"
                                map-options
                                emit-value
                                :options="ordinal"
                                max-length="100"
                                :disabled="isDisabled"
                                @change="
                                    () => {
                                        yearConf = 'theOrdinalDay'
                                    }
                                "
                                filled
                            />

                            <q-select
                                id="selectedDayExtended"
                                v-model="selectedDayExtended"
                                :class="descriptor?.style.dropdown"
                                data-key="id"
                                option-label="name"
                                option-value="id"
                                :options="days"
                                map-options
                                emit-value
                                :disabled="isDisabled"
                                @change="
                                    () => {
                                        yearConf = 'theOrdinalDay'
                                    }
                                "
                                filled
                            />
                        </div>
                    </div>

                    <div v-if="descriptor?.config.endDateEnabled" class="p-float-label p-col-12 p-mb-1">
                        <Calendar id="icon" v-model="endDate" :show-icon="true" />
                        <label for="endDate" class="kn-material-input-label"> {{ $t('kpi.targetDefinition.endDate') }} </label>
                    </div>
                    <div v-else-if="selectedRefreshRate === 'custom'">
                        <q-input :id="name" v-model="localCronExpression" type="text" v-bind="$attrs" :disabled="isDisabled" @change="$emit('update:currentCronExpression', localCronExpression)" />
                        <small id="custom-cron-hint" v-html="$t('knScheduler.customCronHint')"></small>
                    </div>
                </div>
            </q-card-section>
        </q-card>
    </div>

    <div class="p-grid p-d-flex p-m-1 p-fluid">
        <div v-if="schedulerVisible" :class="getSchedulerClass">
            <Card class="kn-card full-height">
                <template #content>
                    <div class="p-grid knScheduler p-jc-between p-flex-column">
                        <div v-if="selectedRefreshRate" class="p-d-flex p-flex-wrap p-col-12 p-mb-1">
                            <div v-if="selectedRefreshRate === 'weekly'" class="p-d-flex p-flex-wrap">
                                <!--                                <div v-for="(day, index) in descriptor.days" :key="index" class="p-d-flex field-checkbox p-mb-1 p-mr-2 dayCheckbox">-->
                                <!--&lt;!&ndash;                                    <Checkbox :id="day - `${index}`" v-model="selectedWeekdays[day.id]" :name="day.name" :value="day.code" @change="$emit('touched')" /><label class="p-ml-2">{{ $t(day.name) }}</label>&ndash;&gt;-->
                                <!--                                </div>-->
                            </div>
                        </div>
                    </div>
                    <Message v-if="!readOnly" :class="['p-col-12 messageClass', readOnly ? 'p-message-disabled' : '']" :severity="'info'">
                        <template v-if="paused">{{ $t('knScheduler.schedulationPaused') }} </template><template v-else>{{ getCronstrueFormula }} </template></Message
                    >
                </template></Card
            >
        </div>
        <div v-if="logsVisible" :class="getLogsTableClass">
            <Card class="kn-card full-height--with-toolbar">
                <template #header
                    ><Toolbar class="kn-toolbar kn-toolbar--secondary">
                        <template #start>
                            {{ $t('managers.workspaceManagement.dataPreparation.monitoring.executionLogs') }}
                        </template>
                    </Toolbar></template
                ><template #content>
                    <DataTable
                        v-model:filters="filters"
                        :value="logs"
                        class="p-datatable-sm kn-table"
                        column-resize-mode="fit | expand"
                        data-key="id"
                        :paginator="true"
                        :rows="10"
                        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        responsive-layout="stack"
                        breakpoint="960px"
                        :current-page-report-template="$t('common.table.footer.paginated', { first: '{first}', last: '{last}', totalRecords: '{totalRecords}' })"
                        :global-filter-fields="descriptor?.globalFilterFields"
                        :loading="loadingLogs"
                    >
                        <template #empty>
                            {{ $t('common.info.noDataFound') }}
                        </template>
                        <template #loading>
                            {{ $t('common.info.dataLoading') }}
                        </template>

                        <Column
                            v-for="col of descriptor?.columns"
                            :key="col.field"
                            class="kn-truncated"
                            :field="col.field"
                            :header="col.field !== 'errorFile' ? $t(col.header) : ''"
                            :sortable="col.field !== 'errorFile'"
                            :selection-mode="col.field == 'selectionMode' ? 'multiple' : ''"
                            :exportable="col.field == 'selectionMode' ? false : ''"
                            ><template #body="slotProps">
                                <span v-if="col.field === 'start' || col.field === 'stop'"> {{ getFormattedDate(slotProps.data[col.field]) }}</span>
                                <span v-else>{{ slotProps.data[col.field] }}</span>
                            </template></Column
                        >

                        <Column class="kn-truncated" field="errorFile" :header="''" :sortable="false" :selection-mode="false" :exportable="false">
                            <template #body="slotProps">
                                <span><Button v-if="slotProps.data['status'] === 'KO'" icon="pi pi-download" class="p-button-link" @click="downloadLog(slotProps.data)" /></span> </template
                        ></Column> </DataTable
                ></template>
            </Card>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import RadioButton from 'primevue/radiobutton'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputSwitch from 'primevue/inputswitch'
import moment from 'moment'
import { luxonFormatDate } from '@/helpers/commons/localeHelper'
import cronstrue from 'cronstrue/i18n'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import { IDataPrepLog } from '@/modules/workspace/dataPreparation/DataPreparationMonitoring/DataPreparationMonitoring'
import { AxiosResponse } from 'axios'
import { mapState } from 'pinia'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'kn-scheduler',
    components: {
        Calendar,
        Checkbox,
        Column,
        DataTable,
        Dropdown,
        InputSwitch,
        Message,
        InputText,
        RadioButton
    },
    props: {
        descriptor: Object,
        readOnly: { type: Boolean, default: false },
        cronExpression: String,
        cronExpressionType: String,
        logs: [] as any,
        schedulerVisible: { type: Boolean, default: true },
        logsVisible: { type: Boolean, default: true },
        schedulationEnabled: Boolean,
        schedulationPaused: Boolean,
        loadingLogs: { type: Boolean, default: false }
    },
    emits: ['touched', 'update:schedulationPaused', 'update:schedulationEnabled', 'update:currentCronExpression', 'update:cronExpressionType', 'validation-changed'],
    data() {
        return {
            startDate: null as Date | null,
            endDate: null as Date | null,
            selectedRefreshRate: '',
            selectedMonth: null as number | null,
            selectedYear: null,
            selectedDay: null,
            selectedDayExtended: null as number | null,
            selectedDayOrdinal: null as number | null,
            selectedDayNumber: null as number | null,
            selectedMonthExtended: null as number | null,
            dateFormat: '' as string,
            dayConf: null as string | null,
            monthConf: null as string | null,
            yearConf: null as string | null,
            days: [] as any,
            months: [] as any,
            ordinal: [] as any,
            refreshRates: [] as any,
            nextFlush: '',
            selectedWeekdays: {} as any,
            startDateEnabled: false,
            endDateEnabled: false,
            localCronExpression: '0 0 0 * * ? *',
            // CONST
            allValues: '*',
            noSpecificValue: '?',
            enableSchedulation: true,
            paused: false,
            validCronExpression: true
        }
    },
    computed: {
        ...mapState(mainStore, {
            configuration: 'configuration',
            locale: 'locale'
        }),
        isFormValid(): boolean {
            if (this.selectedRefreshRate === 'daily' && this.dayConf === 'everyDay') {
                return this.selectedDay !== null && this.selectedDayExtended !== null
            }
            return true
        },
        getCronstrueFormula(): string {
            const locale = localStorage.getItem('locale')
            let cronLocale = ''
            if (locale) {
                const splitted = locale.split('_')
                cronLocale = locale.includes('#') ? (cronLocale = splitted[0] + '_' + splitted[2]) : (cronLocale = splitted[0])
            }
            let verboseDescription = cronstrue.toString(this.localCronExpression, { locale: cronLocale })
            if (verboseDescription.includes('undefined')) verboseDescription = this.$t('knScheduler.invalidCronExpression')
            return verboseDescription
        },
        getSchedulerClass(): string {
            if (this.logsVisible) {
                if (this.schedulerVisible) {
                    return 'p-col-5'
                } else {
                    return 'p-col-0'
                }
            } else {
                return 'p-col'
            }
        },
        getLogsTableClass(): string {
            if (this.schedulerVisible) {
                if (this.logsVisible) {
                    return 'p-col-7'
                } else {
                    return 'p-col-0'
                }
            } else {
                return 'p-col-12'
            }
        },
        isDisabled(): boolean {
            return this.readOnly || !this.enableSchedulation || this.loadingLogs
        }
    },
    watch: {
        selectedRefreshRate(newValue) {
            this.$emit('update:cronExpressionType', newValue)
        },
        selectedMonth() {
            this.updateFormula()
        },
        selectedYear() {
            this.updateFormula()
        },
        selectedDay() {
            this.updateFormula()
        },
        selectedDayExtended() {
            this.updateFormula()
        },
        selectedDayOrdinal() {
            this.updateFormula()
        },
        selectedDayNumber() {
            this.updateFormula()
        },
        dayConf() {
            this.updateFormula()
        },
        monthConf() {
            this.updateFormula()
        },
        selectedWeekdays: {
            handler() {
                this.updateFormula()
            },
            deep: true
        },
        cronExpression(newFormula) {
            if (newFormula) {
                this.localCronExpression = newFormula
                this.parseFormula(this.localCronExpression)
            }
        },
        cronExpressionType(newCronExpressionType) {
            this.selectedRefreshRate = newCronExpressionType
            if (this.localCronExpression) {
                this.parseFormula(this.localCronExpression)
            }
        },
        localCronExpression() {
            if (this.localCronExpression !== this.cronExpression) this.$emit('touched')
            if (this.localCronExpression) {
                this.parseFormula(this.localCronExpression)
            }
        },
        schedulationPaused(newSchedulationPaused) {
            this.paused = newSchedulationPaused
        },
        schedulationEnabled(newSchedulationEnabled) {
            this.enableSchedulation = newSchedulationEnabled
        },
        isFormValid: {
            immediate: true,
            handler(newValue) {
                this.$emit('validation-changed', newValue)
            }
        }
    },
    async created() {
        if (!this.configuration || (!this.configuration && !this.configuration['SPAGOBI.TIMESTAMP-FORMAT.format'])) await this.loadUserConfig()
        this.startDateEnabled = this.descriptor?.config.startDateEnabled
        if (this.startDateEnabled) {
            this.startDate = new Date()
        }
        this.descriptor?.refreshRate.options.forEach((x) => {
            this.refreshRates.push({ code: x.code, id: x.id, name: this.$t(x.name) })
        })
        this.descriptor?.days.forEach((x) => {
            this.days.push({ code: x.code, id: x.id, name: this.$t(x.name) })
        })
        this.descriptor?.months.forEach((x) => {
            this.months.push({ code: x.code, id: x.id, name: this.$t(x.name) })
        })
        this.descriptor?.monthly.ordinal.options.forEach((x) => {
            this.ordinal.push({ code: x.code, id: x.id, name: this.$t(x.name) })
        })
        this.localCronExpression = this.cronExpression || '0 0 0 * * ? *'
        if (this.schedulationEnabled) this.enableSchedulation = this.schedulationEnabled
        this.selectedRefreshRate = this.descriptor?.refreshRate.options[0].code
        if (this.cronExpressionType) {
            this.selectedRefreshRate = this.cronExpressionType
        }
        this.$nextTick(() => {
            this.$emit('validation-changed', this.isFormValid)
        })
    },
    updated() {
        this.enableSchedulation = this.schedulationEnabled
        this.paused = this.schedulationPaused
    },
    methods: {
        async downloadLog(item: IDataPrepLog) {
            await this.$http.post(import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + '/api/1.0/process/' + item.id + '/log/download').then((response: AxiosResponse<any>) => {
                downloadDirectFromResponse(response)
            })
        },
        getFormattedDate(date: any): string {
            return luxonFormatDate(new Date(date), undefined, this.dateFormat)
        },
        getNumberOptions(max: number) {
            const tmp = [] as any
            for (let i = 1; i <= max; i++) tmp.push({ code: i.toString(), id: i, name: i.toString() })
            return tmp
        },
        isSet(cronExpressionToken): boolean {
            return cronExpressionToken && cronExpressionToken !== this.allValues && cronExpressionToken !== this.noSpecificValue
        },
        async loadUserConfig() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/user-configs`).then((response: AxiosResponse<any>) => {
                if (response.data) {
                    this.dateFormat = response.data['SPAGOBI.TIMESTAMP-FORMAT.format'] ? response.data['SPAGOBI.TIMESTAMP-FORMAT.format'] : response.data['SPAGOBI.DATE-FORMAT-SERVER.format'] === '%Y-%m-%d' ? 'dd/MM/yyyy' : response.data['SPAGOBI.DATE-FORMAT-SERVER.format']
                }
            })
        },
        parseFormula(cronExpression) {
            console.log(this.selectedWeekdays)
            if (this.selectedRefreshRate == 'custom') {
                return
            }
            if (cronExpression === '0 0 0 ? * MON,TUE,WED,THU,FRI *') {
                // @ts-ignore
                this.dayConf = 'everyNotWorkingDays'
            } else {
                const cronExpressionArr = cronExpression.split(' ')
                if (this.isSet(cronExpressionArr[3])) {
                    this.selectedDayNumber = cronExpressionArr[3]
                }
                if (this.isSet(cronExpressionArr[4])) {
                    const splitted = cronExpressionArr[4].split('/')
                    if (splitted.length > 1) {
                        this.selectedMonthExtended = parseInt(splitted[0])
                        this.selectedMonth = parseInt(splitted[1])
                    } else if (this.months.filter((x) => x.code === cronExpressionArr[4]).length == 1) {
                        this.selectedMonth = cronExpressionArr[4]
                    }
                }
                if (this.isSet(cronExpressionArr[5])) {
                    let splitted = cronExpressionArr[5].split('/')
                    if (splitted.length > 1) {
                        this.selectedDayExtended = parseInt(splitted[0])
                        this.selectedDay = splitted[1]
                    } else {
                        splitted = cronExpressionArr[5].split('#')
                        if (splitted.length > 1) {
                            this.selectedDayExtended = parseInt(splitted[0])
                            this.selectedDayOrdinal = parseInt(splitted[1])
                        } else {
                            splitted = cronExpressionArr[5].split(',')
                            if (splitted.length > 0) {
                                for (const index in splitted) {
                                    const day = this.descriptor?.days.filter((x) => x.code === splitted[index].toLowerCase())[0]
                                    this.selectedWeekdays[day.id] = [day.code]
                                }
                            }
                        }
                    }
                }
                if (this.isSet(cronExpressionArr[6])) {
                    this.selectedYear = cronExpressionArr[6].split('/')[1]
                }
                if (this.selectedYear) {
                    if (this.selectedDayExtended) {
                        this.yearConf = 'theOrdinalDay'
                    } else this.yearConf = 'theDay'
                } else {
                    if (this.selectedDay) {
                        this.dayConf = 'everyDay'
                    } else if (this.selectedMonth) {
                        if (this.selectedDayNumber) {
                            this.monthConf = 'theDay'
                        } else {
                            this.monthConf = 'theOrdinalDay'
                        }
                    }
                }
            }
        },
        resetFormula() {
            this.localCronExpression = '0 0 0 * * ? *'
            this.selectedMonth = null
            this.selectedYear = null
            this.selectedDay = null
            this.selectedDayExtended = null
            this.selectedDayOrdinal = null
            this.selectedDayNumber = null
            this.dayConf = null
            this.monthConf = null
            this.yearConf = null
            this.$emit('update:currentCronExpression', this.localCronExpression)
            this.$emit('update:cronExpressionType', this.selectedRefreshRate)
        },
        updateFormula() {
            if (this.selectedRefreshRate === 'custom') {
                return
            }
            let cronExpressionArr = this.localCronExpression.split(' ')
            cronExpressionArr[0] = cronExpressionArr[1] = cronExpressionArr[2] = '0'
            if (this.selectedRefreshRate === 'daily') {
                if (this.dayConf === 'everyDay') {
                    cronExpressionArr[3] = this.noSpecificValue
                    if (this.selectedDay && this.selectedDayExtended) {
                        console.log(this.selectedDayExtended, this.selectedDay)
                        cronExpressionArr[5] = this.selectedDayExtended + '/' + this.selectedDay
                    }
                } else if (this.dayConf === 'everyNotWorkingDays') {
                    cronExpressionArr = '0 0 0 ? * MON,TUE,WED,THU,FRI *'.split(' ')
                }
            } else if (this.selectedRefreshRate === 'weekly') {
                let t = ''
                const weekdayKeys = Object.keys(this.selectedWeekdays)
                if (weekdayKeys.length > 0) {
                    const set = new Set()
                    for (const day in this.selectedWeekdays) {
                        if (this.selectedWeekdays[day]) {
                            console.log('day', this.selectedWeekdays[day])
                            set.add(this.selectedWeekdays[day])
                        }
                    }
                    t = Array.from(set).join(',')
                } else {
                    t += this.allValues
                }
                cronExpressionArr[5] = t
                cronExpressionArr[3] = '?'
                cronExpressionArr[4] = this.allValues
            } else if (this.selectedRefreshRate === 'monthly') {
                if (this.selectedMonthExtended && this.selectedMonth) {
                    cronExpressionArr[4] = this.selectedMonthExtended + '/' + this.selectedMonth
                }
                if (this.monthConf === 'theDay') {
                    cronExpressionArr[3] = this.selectedDayNumber ? this.selectedDayNumber! : this.allValues
                    cronExpressionArr[5] = this.noSpecificValue
                } else if (this.monthConf === 'theOrdinalDay') {
                    cronExpressionArr[3] = this.noSpecificValue
                    if (this.selectedDayExtended && this.selectedDayOrdinal) {
                        cronExpressionArr[5] = this.selectedDayExtended + '#' + this.selectedDayOrdinal
                    }
                }
                cronExpressionArr[6] = this.allValues
            } else if (this.selectedRefreshRate === 'yearly') {
                cronExpressionArr[4] = this.selectedMonth ? this.selectedMonth! : this.allValues
                if (this.yearConf === 'theDay') {
                    cronExpressionArr[3] = this.selectedDayNumber ? this.selectedDayNumber! : this.allValues
                } else if (this.yearConf === 'theOrdinalDay') {
                    cronExpressionArr[3] = this.noSpecificValue
                    if (this.selectedDayExtended && this.selectedDayOrdinal) {
                        cronExpressionArr[5] = this.selectedDayExtended + '#' + this.selectedDayOrdinal
                    }
                }
                if (this.selectedYear) {
                    cronExpressionArr[6] = moment().year() + '/' + this.selectedYear
                } else {
                    cronExpressionArr[6] = this.allValues
                }
            }
            this.localCronExpression = cronExpressionArr.join(' ')
            console.log('localCronExpression', this.localCronExpression)
            this.$emit('update:currentCronExpression', this.localCronExpression)
        },
        togglePause() {
            this.paused = !this.paused
            this.$emit('update:schedulationPaused', this.paused)
            this.$emit('touched')
        },
        toggleSchedulationEnabled() {
            this.$emit('update:schedulationEnabled', this.enableSchedulation)
            this.$emit('touched')
        }
    }
})
</script>

<style lang="css" scoped>
.knScheduler {
    min-width: 200px;
    min-height: 100px;
    max-height: 350px;
    font-size: 0.9rem;
}
.dayCheckbox {
    width: 100px;
}
.messageClass {
    height: 50px;
}
.itemClass {
    width: 100%;
}
</style>
