<template>
    <div>
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>
                {{ $t('managers.scheduler.timingAndOutput') }}
            </q-toolbar-title>
            <q-btn flat stretch :label="$t('common.add')" @click="showTriggerDetail(null)" />
        </q-toolbar>
        <q-banner v-if="triggers.length === 0" rounded dense class="bg-info q-ma-sm text-center">
            <template v-slot:avatar>
                <q-icon name="info" />
            </template>
            {{ $t('managers.scheduler.noTriggersInfo') }}
        </q-banner>
        <DataTable
            v-else
            id="triggers-datatable"
            :value="triggers"
            :paginator="true"
            :rows="schedulerTimingOutputTableDescriptor.rows"
            class="p-datatable-sm kn-table p-m-2"
            data-key="triggerName"
            :responsive-layout="schedulerTimingOutputTableDescriptor.responsiveLayout"
            :breakpoint="schedulerTimingOutputTableDescriptor.breakpoint"
            :row-class="rowClass"
        >
            <Column class="kn-truncated" :header="$t('common.name')">
                <template #body="slotProps">
                    <span>{{ slotProps.data.triggerName }}</span>
                </template></Column
            >
            <Column class="kn-truncated" :header="$t('common.type')">
                <template #body="slotProps">
                    {{ slotProps.data.triggerChronType }}
                </template></Column
            >
            <Column class="kn-truncated" :header="$t('cron.startDate')">
                <template #body="slotProps">
                    {{ getFormatedDate(slotProps.data.triggerZonedStartTime, 'DD/MM/YYYY HH:mm') }}
                </template></Column
            >
            <Column class="kn-truncated" :header="$t('cron.endDate')">
                <template #body="slotProps">
                    {{ slotProps.data.triggerZonedEndTime ? getFormatedDate(slotProps.data.triggerZonedEndTime, 'DD/MM/YYYY HH:mm') : '' }}
                </template></Column
            >
            <Column class="kn-truncated" :header="$t('common.paused')">
                <template #body="slotProps">
                    {{ slotProps.data.triggerIsPaused ? $t('common.yes') : $t('common.no') }}
                </template></Column
            >

            <Column :style="schedulerTimingOutputTableDescriptor.iconColumnStyle">
                <template #body="slotProps">
                    <Button class="p-button-link p-button-sm" icon="fa fa-ellipsis-v" aria-haspopup="true" aria-controls="overlay_menu" @click="toggle($event, slotProps.data)" />
                    <Menu ref="menu" :model="items" :popup="true" data-test="menu"></Menu>
                    <Button icon="pi pi-trash" class="p-button-link" @click="deleteTriggerConfirm({ trigger: slotProps.data, index: slotProps.index })" />
                </template>
            </Column>
        </DataTable>

        <SchedulerTimingOutputInfoDialog :visible="triggerInfoDialogVisible" :trigger-info="triggerInfo" @close="triggerInfoDialogVisible = false"></SchedulerTimingOutputInfoDialog>
        <SchedulerTimingOutputDetailDialog :visible="triggerDetailDialogVisible" :prop-trigger="triggerInfo" @close="triggerDetailDialogVisible = false" @saved="onSave"></SchedulerTimingOutputDetailDialog>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { formatDate } from '@/helpers/commons/localeHelper'
import { AxiosResponse } from 'axios'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import schedulerTimingOutputTableDescriptor from './SchedulerTimingOutputTableDescriptor.json'
import SchedulerTimingOutputDetailDialog from './SchedulerTimingOutputDetailDialog/SchedulerTimingOutputDetailDialog.vue'
import SchedulerTimingOutputInfoDialog from './SchedulerTimingOutputInfoDialog.vue'
import mainStore from '../../../../App.store'

export default defineComponent({
    name: 'scheduler-timing-output-table',
    components: { Column, DataTable, Menu, SchedulerTimingOutputDetailDialog, SchedulerTimingOutputInfoDialog },
    props: { job: { type: Object, required: true } },
    emits: ['loading', 'triggerSaved'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            schedulerTimingOutputTableDescriptor,
            triggers: [] as any[],
            items: [] as { label: string; icon: string; command: Function }[],
            triggerInfo: null as any,
            triggerInfoDialogVisible: false,
            triggerDetailDialogVisible: false
        }
    },
    watch: {
        job() {
            this.loadTriggers()
        }
    },
    created() {
        this.loadTriggers()
    },
    methods: {
        loadTriggers() {
            this.triggers = this.job?.triggers as any[]
        },
        getFormatedDate(date: any, format: any) {
            return formatDate(date, format)
        },
        rowClass(trigger: any) {
            return this.isTriggerActive(trigger) ? 'trigger-active' : 'trigger-inactive'
        },
        isTriggerActive(trigger: any) {
            let active = true
            const now = new Date().getTime()
            const startDate = new Date(trigger.triggerZonedStartTime).getTime()
            const endDate = trigger.triggerZonedEndTime ? new Date(trigger.triggerZonedEndTime).getTime() : null

            if (trigger.triggerIsPaused) active = false

            if (trigger.triggerChronType === 'Single' && startDate < now) {
                active = false
            } else if (endDate && (endDate < now || startDate > now)) {
                active = false
            }

            return active
        },
        toggle(event: any, trigger: any) {
            this.createMenuItems(trigger)
            const menu = this.$refs.menu as any
            menu.toggle(event)
        },
        createMenuItems(trigger: any) {
            this.items = []
            this.items.push({ label: this.$t('managers.scheduler.info'), icon: 'fa fa-info', command: () => this.getTriggerInfo(trigger, true) })
            this.items.push({ label: this.$t('managers.scheduler.detail'), icon: 'pi pi-pencil', command: () => this.showTriggerDetail(trigger) })
            this.items.push({ label: this.$t('managers.scheduler.execute'), icon: 'fa fa-play', command: () => this.triggerExecuteConfirm(trigger) })
            trigger.triggerIsPaused
                ? this.items.push({ label: this.$t('managers.scheduler.resumeSchedulation'), icon: 'fa fa-unlock', command: () => this.triggerPauseConfirm(trigger) })
                : this.items.push({ label: this.$t('managers.scheduler.pauseSchedulation'), icon: 'fa fa-lock', command: () => this.triggerPauseConfirm(trigger) })
        },
        async getTriggerInfo(trigger: any, openDialog: boolean) {
            this.$emit('loading', true)
            if (trigger) {
                await this.$http
                    .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/getTriggerInfo?jobName=${trigger.jobName}&jobGroup=${trigger.jobGroup}&triggerName=${trigger.triggerName}&triggerGroup=${trigger.triggerGroup}`)
                    .then((response) => {
                        this.triggerInfo = response.data
                    })
                    .catch(() => {})
            } else {
                this.triggerInfo = { jobName: this.job.jobName, jobGroup: this.job.jobGroup, chrono: { type: 'single', parameter: {} }, documents: null }
            }
            this.triggerInfoDialogVisible = openDialog
            this.$emit('loading', false)
        },
        async showTriggerDetail(trigger: any) {
            await this.getTriggerInfo(trigger, false)
            this.triggerDetailDialogVisible = true
        },
        triggerExecuteConfirm(trigger: any) {
            this.$confirm.require({
                message: this.$t('managers.scheduler.executeNow'),
                header: this.$t('managers.scheduler.confirmHeader'),
                icon: 'pi pi-exclamation-triangle',
                accept: async () => await this.executeTrigger(trigger)
            })
        },
        async executeTrigger(trigger: any) {
            this.$emit('loading', true)

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/executeTrigger?jobName=${trigger.jobName}&jobGroup=${trigger.jobGroup}&triggerName=${trigger.triggerName}&triggerGroup=${trigger.triggerGroup}`)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.resp === 'ok') {
                        this.store.setInfo({
                            title: this.$t('common.information'),
                            msg: this.$t('managers.scheduler.schedulationExecuted')
                        })
                    }
                })
                .catch(() => {})
            this.$emit('loading', false)
        },
        triggerPauseConfirm(trigger: any) {
            this.$confirm.require({
                message: trigger.triggerIsPaused ? this.$t('managers.scheduler.resumeSchedulation') : this.$t('managers.scheduler.pauseSchedulation'),
                header: this.$t('managers.scheduler.confirmHeader'),
                icon: 'pi pi-exclamation-triangle',
                accept: async () => await this.pauseTrigger(trigger)
            })
        },
        async pauseTrigger(trigger: any) {
            this.$emit('loading', true)
            const action = trigger.triggerIsPaused ? 'resumeTrigger' : 'pauseTrigger'
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/${action}?jobName=${trigger.jobName}&jobGroup=${trigger.jobGroup}&triggerName=${trigger.triggerName}&triggerGroup=${trigger.triggerGroup}`)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.resp === 'ok') {
                        this.store.setInfo({
                            title: this.$t('common.information'),
                            msg: trigger.triggerIsPaused ? this.$t('managers.scheduler.schedulationResumed') : this.$t('managers.scheduler.schedulationPaused')
                        })
                        trigger.triggerIsPaused = action === 'pauseTrigger'
                    }
                })
                .catch(() => {})
            this.$emit('loading', false)
        },
        deleteTriggerConfirm(event: any) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: async () => await this.deleteTrigger(event.trigger, event.index)
            })
        },
        async deleteTrigger(trigger: any, index: number) {
            this.$emit('loading', true)
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/deleteTrigger?jobName=${trigger.jobName}&jobGroup=${trigger.jobGroup}&triggerName=${trigger.triggerName}&triggerGroup=${trigger.triggerGroup}`)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.resp === 'ok') {
                        this.store.setInfo({
                            title: this.$t('common.toast.deleteTitle'),
                            msg: this.$t('common.toast.deleteSuccess')
                        })
                        this.triggers.splice(index, 1)
                    }
                })
                .catch(() => {})
            this.$emit('loading', false)
        },
        onSave() {
            this.triggerDetailDialogVisible = false
            this.$emit('triggerSaved')
        }
    }
})
</script>

<style lang="scss">
#documents-datatable .p-datatable-wrapper {
    height: auto;
}

.trigger-active {
    border-left: 2px solid green;
}

.trigger-inactive {
    border-left: 2px solid red;
}
</style>
