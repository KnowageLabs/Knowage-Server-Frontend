<template>
    <Toolbar class="kn-toolbar kn-toolbar--secondary p-m-0">
        <template #start>{{ selectedAlert.name }} </template>
        <template #end>
            <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" :disabled="buttonDisabled" data-test="save-button" @click="handleSubmit" />
            <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" @click="closeTemplateConfirm" />
        </template>
    </Toolbar>
    <div class="p-grid p-m-0 p-jc-center" style="overflow: auto">
        <Message v-if="expiredCard" class="p-m-2" severity="warn" :closable="true" :style="alertDescriptor.styles.message">
            {{ $t('kpi.alert.expiredWarning') }}
        </Message>
        <NameCard :selected-alert="selectedAlert" :listeners="listeners" :vcomp="v$.selectedAlert" @valueChanged="updateAlert" />
        <KnCron v-if="selectedAlert?.frequency" class="p-m-2" :frequency="selectedAlert.frequency" @touched="touched = true" @cronValid="setCronValid($event)" />
        <EventsCard :selected-alert="selectedAlert" @valueChanged="updateAlert" />
        <KpiCard v-if="isListenerSelected && actionList?.length > 0" :selected-alert="selectedAlert" :kpi-list="kpiList" :action-list="actionList" @showDialog="onShowActionDialog($event)" @kpiLoaded="updateKpi" @touched="touched = true" />
    </div>
    <AddActionDialog :dialog-visible="isActionDialogVisible" :kpi="kpi" :selected-action="selectedAction" :action-list="actionList" @close="isActionDialogVisible = false" @save="onActionSave" />
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { iAction, iAlert, iListener } from './AlertDefinition'
import { createValidations } from '@/helpers/commons/validationHelper'
import alertValidationDescriptor from './AlertDefinitionValidationDescriptor.json'
import alertDescriptor from './AlertDefinitionDescriptor.json'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import Message from 'primevue/message'
import NameCard from './cards/AlertDefinitionNameCard.vue'
import KpiCard from './cards/AlertDefinitionKpiCard.vue'
import EventsCard from './cards/AlertDefinitionEventsCard.vue'
import KnCron from '@/components/UI/KnCron/KnCron.vue'
import AddActionDialog from './actions/AlertDefinitionActionDialog.vue'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'alert-details',
    components: { NameCard, EventsCard, AddActionDialog, KpiCard, Message, KnCron },
    props: { id: { type: String, required: false } },
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            v$: useValidate() as any,
            alertValidationDescriptor,
            alertDescriptor,
            kpi: {} as any,
            emptyObject: {} as any,
            jsonOptions: {} as any,
            selectedAlert: {} as iAlert,
            selectedAction: {} as iAction,
            listeners: [] as iListener[],
            actionList: [] as any,
            actions: [] as any[],
            kpiList: [] as any,
            isActionDialogVisible: false,
            expiredCard: false,
            touched: false,
            actionIndexToEdit: -1,
            validCron: true
        }
    },
    computed: {
        isListenerSelected(): any {
            if (!this.selectedAlert.alertListener || this.selectedAlert.alertListener === this.emptyObject) {
                return false
            }
            return true
        },
        buttonDisabled(): any {
            if (this.selectedAlert.jsonOptions?.actions?.length === 0 || !this.selectedAlert.name || !this.selectedAlert.alertListener || this.validCron == false) return true
            return false
        }
    },
    watch: {
        async id() {
            await this.checkId()
            if (this.id == undefined)
                this.selectedAlert = {
                    id: null,
                    singleExecution: false,
                    jsonOptions: { actions: [] },
                    frequency: {
                        cron: { type: 'minute', parameter: { numRepetition: '1' } },
                        startDate: new Date().valueOf(),
                        endDate: null,
                        startTime: new Date().valueOf(),
                        endTime: ''
                    }
                }
        }
    },

    created() {
        if (this.id) {
            this.loadAlert()
        } else {
            this.selectedAlert = {
                id: null,
                singleExecution: false,
                jsonOptions: { actions: [] },
                frequency: {
                    cron: { type: 'minute', parameter: { numRepetition: '1' } },
                    startDate: new Date().valueOf(),
                    endDate: null,
                    startTime: new Date().valueOf(),
                    endTime: ''
                }
            }
        }
        this.loadListener()
        this.loadKpiList()
        this.loadActionList()
    },
    validations() {
        return {
            selectedAlert: createValidations('alert', alertValidationDescriptor.validations.alert)
        }
    },
    methods: {
        async loadAlert() {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/alert/' + this.id + '/load')
                .then((response: AxiosResponse<any>) => {
                    this.selectedAlert = { ...response.data }
                    this.selectedAlert.jsonOptions = JSON.parse(this.selectedAlert.jsonOptions ? this.selectedAlert.jsonOptions : '{}')
                    if (this.selectedAlert.frequency) {
                        this.selectedAlert.frequency.cron = JSON.parse(this.selectedAlert.frequency.cron ? this.selectedAlert.frequency.cron : '{}')
                        this.selectedAlert.frequency.startDate = this.selectedAlert.frequency.startDate ?? new Date()
                    }

                    if (this.selectedAlert.jsonOptions) {
                        this.selectedAlert.jsonOptions.actions = this.selectedAlert.jsonOptions.actions?.map((action: any) => {
                            return {
                                jsonActionParameters: JSON.parse(action.jsonActionParameters),
                                idAction: action.idAction,
                                thresholdValues: action.thresholdValues
                            }
                        })
                    }
                })
                .finally(() => (this.expiredCard = this.selectedAlert.jobStatus == 'EXPIRED'))
        },
        async loadListener() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/alert/listListener').then((response: AxiosResponse<any>) => {
                this.listeners = response.data
            })
        },
        async loadKpiList() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/kpi/listKpi').then((response: AxiosResponse<any>) => {
                this.kpiList = [...response.data]
            })
        },
        async loadActionList() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/alert/listAction').then((response: AxiosResponse<any>) => {
                this.actionList = [...response.data]
            })
        },
        updateAlert(event) {
            this.touched = true
            if (event.fieldName == 'singleExecution') {
                this.selectedAlert.singleExecution = !this.selectedAlert.singleExecution
            } else {
                this.selectedAlert[event.fieldName] = event.value
            }
        },
        async handleSubmit() {
            const alertToSave = JSON.parse(JSON.stringify(this.selectedAlert))
            if (alertToSave.jsonOptions) {
                alertToSave.jsonOptions.actions = alertToSave.jsonOptions.actions.map((action: any) => {
                    return {
                        jsonActionParameters: JSON.stringify(action.jsonActionParameters),
                        idAction: action.idAction,
                        thresholdValues: action.thresholdValues
                    }
                })
            }
            alertToSave.jsonOptions = JSON.stringify(alertToSave.jsonOptions)
            if (alertToSave.frequency) alertToSave.frequency.cron = JSON.stringify(alertToSave.frequency.cron)

            const operation = alertToSave.id ? 'update' : 'insert'

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/alert/save', alertToSave)
                .then((response: AxiosResponse<any>) => {
                    this.touched = false
                    this.store.setInfo({
                        title: this.$t(this.alertDescriptor.operation[operation].toastTitle),
                        msg: this.$t(this.alertDescriptor.operation.success)
                    })
                    this.$emit('saved', response.data.id)
                })
                .catch((error) => {
                    this.store.setError({
                        title: this.$t('kpi.alert.savingError'),
                        msg: error.message
                    })
                })
        },
        async checkId() {
            if (this.id) {
                await this.loadAlert()
            } else {
                this.selectedAlert = {
                    id: null,
                    singleExecution: false,
                    frequency: {
                        cron: { type: 'minute', parameter: { numRepetition: '1' } },
                        startDate: new Date().valueOf(),
                        endDate: null,
                        startTime: new Date().valueOf(),
                        endTime: ''
                    }
                }
            }
            this.v$.$reset()
        },
        closeTemplateConfirm() {
            if (!this.touched) {
                this.closeTemplate()
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.closeTemplate()
                    }
                })
            }
        },
        closeTemplate() {
            this.$emit('close')
        },
        updateKpi(event) {
            this.kpi = event
        },
        onActionSave(action) {
            this.isActionDialogVisible = false
            this.touched = true
            const actionToSave = { ...action, idAction: +action.idAction, data: this.actionList.find((ac) => action.idAction == ac.id) }
            actionToSave['thresholdData'] = actionToSave.thresholdValues.map((thresholdId) => {
                return this.kpi.threshold.thresholdValues.find((threshold) => threshold.id == thresholdId)
            })
            if (this.actionIndexToEdit === -1) {
                this.selectedAlert.jsonOptions.actions.push(actionToSave)
            } else {
                this.selectedAlert.jsonOptions.actions[this.actionIndexToEdit] = actionToSave
            }
        },
        onShowActionDialog(payload) {
            this.selectedAction = payload && payload.action ? { ...payload.action, idAction: +payload.action.idAction, className: payload.action.data.className } : { jsonActionParameters: {} }
            this.actionIndexToEdit = payload ? payload.index : -1
            this.isActionDialogVisible = true
        },
        setCronValid(value: boolean) {
            this.validCron = value
        }
    }
})
</script>
