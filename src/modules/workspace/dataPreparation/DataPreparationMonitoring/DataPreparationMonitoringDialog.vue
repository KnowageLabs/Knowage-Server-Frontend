<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary schedulerDialog" :visible="visibility" footer="footer" :header="$t('workspace.myData.monitoring')" modal :breakpoints="{ '960px': '75vw', '640px': '100vw' }" :closable="false" :base-z-index="1" :auto-z-index="true">
        <KnScheduler :cron-expression="currentCronExpression" :cron-expression-type="cronExpressionType" :read-only="false" :logs="logs" :schedulation-paused="schedulationPaused" :loading-logs="loadingLogs" @update:schedulationPaused="updateSchedulationPaused" @update:currentCronExpression="updateCurrentCronExpression" @update:cronExpressionType="updateCronExpressionType" />
        <template #footer>
            <Button :visible="visibility" class="kn-button--secondary" :label="$t('common.cancel')" data-test="close-button" @click="cancel" />

            <Button :label="$t('common.save')" :visible="visibility" class="kn-button--primary" data-test="save-button" @click="saveSchedulation" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'
import dataPreparationMonitoringDescriptor from '@/modules/workspace/dataPreparation/DataPreparationMonitoring/DataPreparationMonitoringDescriptor.json'
import KnScheduler from '@/components/UI/KnScheduler/KnScheduler.vue'
import { IDataPrepLog } from '@/modules/workspace/dataPreparation/DataPreparationMonitoring/DataPreparationMonitoring'
import { AxiosResponse } from 'axios'
import { filterDefault } from '@/helpers/commons/filterHelper'
import mainStore from '../../../../App.store'

export default defineComponent({
    name: 'data-preparation-monitoring-dialog',
    components: { Dialog, KnScheduler },
    props: { visibility: Boolean, dataset: Object },
    emits: ['close', 'save', 'update:loading'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            schedulerDescriptor: dataPreparationMonitoringDescriptor,
            logs: Array<IDataPrepLog>(),
            filters: { global: [filterDefault] } as Object,
            validSchedulation: Boolean,
            showHint: false,
            currentCronExpression: '',
            cronExpressionType: '',
            touched: false,
            schedulationPaused: false,
            instanceId: '',
            loadingLogs: false,
            isFormValid: true,
            isDirty: false
        }
    },
    watch: {
        async visibility(newVisibility) {
            this.store.setLoading(true)
            this.logs = []
            this.loadingLogs = true
            if (newVisibility) await this.loadLogs()
            this.store.setLoading(false)
            this.loadingLogs = false
        }
    },
    methods: {
        async loadLogs() {
            if (this.dataset && this.dataset.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + '/api/1.0/process/by-destination-data-set/' + this.dataset.id).then((response: AxiosResponse<any>) => {
                    const instance = response.data.instance
                    if (instance) {
                        this.instanceId = instance.id
                        this.currentCronExpression = instance.config.cron
                        if (!this.currentCronExpression) this.showHint
                        this.cronExpressionType = instance.config.type
                        this.schedulationPaused = instance.config.paused || false
                        this.$http.get(import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + '/api/1.0/process/logs/' + instance.id).then((response: AxiosResponse<any>) => {
                            this.logs = response.data
                        })
                        if (this.currentCronExpression) {
                            this.touched = true
                        }
                    }
                })
            }
        },
        cancel() {
            if (this.touched) {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesHeader'),
                    header: this.$t('common.toast.unsavedChangesMessage'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => this.resetAndClose()
                })
            } else {
                this.resetAndClose()
            }
        },
        resetAndClose() {
            this.currentCronExpression = ''
            this.cronExpressionType = ''
            this.touched = false
            this.showHint = false
            this.$emit('close')
            this.store.setLoading(false)
        },
        setCronValid(event) {
            this.validSchedulation = event.item
        },
        saveSchedulation() {
            const obj = { instanceId: this.instanceId, config: {} }

            obj['config']['cron'] = this.currentCronExpression
            obj['config']['paused'] = this.schedulationPaused
            obj['config']['type'] = this.cronExpressionType

            this.$emit('save', obj)
            this.resetAndClose()
        },
        updateSchedulationPaused(newSchedulationPaused) {
            this.schedulationPaused = !newSchedulationPaused
        },
        updateCurrentCronExpression(newCronExpression) {
            this.currentCronExpression = newCronExpression
        },
        updateCronExpressionType(cronExpressionType) {
            this.cronExpressionType = cronExpressionType
        }
    }
})
</script>

<style lang="scss">
.schedulerDialog {
    min-width: 600px;
    width: 1200px;
    max-width: 1400px;
    .p-datatable.p-datatable-sm.data-prep-table {
        min-height: 300px;
    }
}
</style>
