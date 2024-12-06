<template>
    <Card class="p-mt-2">
        <template #content>
            <DataTable :value="executionList" :paginator="true" :rows-per-page-options="[10, 20, 50]" :rows="10" :loading="loading" class="p-datatable-sm kn-table p-m-1" data-key="id" responsive-layout="stack" breakpoint="960px" data-test="executions-table" @rowClick="showForm($event.data, false)">
                <template #loading>
                    {{ $t('common.info.dataLoading') }}
                </template>
                <template #header>
                    <div class="table-header">
                        <div class="row items-center">
                            <q-select
                                filled
                                class="col-md-2 p-mr-2"
                                v-model="schedule.delta"
                                emit-value
                                map-options
                                :option-label="(option) => (option.label ? $t(option.label) : '')"
                                option-value="value"
                                :options="[
                                    { label: 'kpi.kpiScheduler.insertAndUpdate', value: true },
                                    { label: 'kpi.kpiScheduler.deleteAndInsert', value: false }
                                ]"
                                :label="$t('kpi.kpiScheduler.executionType')"
                                stack-label
                                :dense="true"
                            />
                            <q-input class="col-md-2 p-mr-2" filled type="number" v-model="numberOfLogs" :label="$t('kpi.kpiScheduler.numberOfExecutions')" stack-label :dense="true" />
                            <Button id="load-button" class="kn-button kn-button--primary" :label="$t('common.load')" @click="loadLogExecutionList"></Button>
                        </div>
                    </div>
                </template>
                <Column :style="executeCardDescriptor.table.columns.style" field="timeRun" :header="$t('kpi.kpiScheduler.timeRun')" :sortable="true">
                    <template #body="slotProps">
                        {{ getFormattedDate(slotProps.data.timeRun) }}
                    </template>
                </Column>
                <Column v-for="col of executeCardDescriptor.columns" :key="col.field" class="kn-truncated" :style="executeCardDescriptor.table.columns.style" :field="col.field" :header="$t(col.header)" :sortable="true"> </Column>
                <Column :style="executeCardDescriptor.table.iconColumn.style">
                    <template #body="slotProps">
                        <Button v-if="slotProps.data.outputPresent" icon="pi pi-download" class="p-button-link" @click="downloadFile(slotProps.data.id)" />
                    </template>
                </Column>
            </DataTable>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { formatDate } from '@/helpers/commons/localeHelper'
import { downloadDirect } from '@/helpers/commons/fileHelper'
import { iKpiSchedule, iExecution } from '../../KpiScheduler'
import { AxiosResponse } from 'axios'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputNumber from 'primevue/inputnumber'
import RadioButton from 'primevue/radiobutton'
import executeCardDescriptor from './KpiSchedulerExecuteCardDescriptor.json'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'kpi-scheduler-execute-card',
    components: { Card, Column, DataTable, InputNumber, RadioButton },
    props: {
        selectedSchedule: {
            type: Object
        }
    },
    emits: ['touched'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            executeCardDescriptor,
            schedule: {} as iKpiSchedule,
            executionList: [] as iExecution[],
            numberOfLogs: 10,
            loading: false
        }
    },
    created() {
        this.loadSelectedSchedule()
        this.loadLogExecutionList()
    },
    methods: {
        loadSelectedSchedule() {
            this.schedule = this.selectedSchedule as iKpiSchedule
        },
        loadLogExecutionList() {
            if (this.schedule && this.schedule.id) {
                this.loading = true
                this.$http
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${this.schedule.id}/${this.numberOfLogs}/logExecutionList`)
                    .then((response: AxiosResponse<any>) => (this.executionList = response.data))
                    .finally(() => (this.loading = false))
            }
        },
        getFormattedDate(date: any) {
            return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
        },
        async downloadFile(id: number) {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${id}/logExecutionListOutputContent`).then((response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    this.store.setError({
                        title: this.$t('common.error.downloading'),
                        msg: this.$t('common.error.downloading')
                    })
                } else {
                    downloadDirect(JSON.stringify(response.data.output), this.schedule.name + 'ErrorLog', 'text/plain')
                    this.store.setInfo({ title: this.$t('common.toast.success') })
                }
            })
        }
    }
})
</script>

<style lang="scss" scoped>
#load-button {
    height: 2.5rem;
}
</style>
