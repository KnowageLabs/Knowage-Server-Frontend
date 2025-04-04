<template>
    <Toolbar class="kn-toolbar kn-toolbar--primary p-m-0">
        <template #start>{{ job.jobName }}</template>
        <template #end>
            <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" :disabled="saveDisabled" data-test="save-button" @click="saveJob" />
            <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" data-test="close-button" @click="closeJobDetail" />
        </template>
    </Toolbar>
    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />

    <Card v-if="job" id="scheduler-detail-card" class="p-m-2">
        <template #content>
            <form v-if="job" class="p-fluid p-formgrid p-grid p-m-4">
                <div class="p-field p-col-6 p-mb-6">
                    <span class="p-float-label">
                        <InputText
                            id="jobName"
                            v-model.trim="job.jobName"
                            class="kn-material-input"
                            :class="{
                                'p-invalid': job.jobName?.length === 0 && jobNameDirty
                            }"
                            max-length="80"
                            :disabled="testReadonly"
                            data-test="name-input"
                            @blur="jobNameDirty = true"
                        />
                        <label for="jobName" class="kn-material-input-label"> {{ $t('managers.scheduler.packageName') }} *</label>
                    </span>
                    <small v-if="job.jobName?.length === 0 && jobNameDirty" class="p-error">
                        {{ $t('common.validation.required', { fieldName: $t('managers.scheduler.packageName') }) }}
                    </small>
                </div>
                <div class="p-field p-col-6 p-mb-6">
                    <span class="p-float-label">
                        <InputText id="jobDescription" v-model.trim="job.jobDescription" class="kn-material-input" max-length="120" />
                        <label for="jobDescription" class="kn-material-input-label"> {{ $t('managers.scheduler.packageDescription') }} </label>
                    </span>
                </div>
            </form>
            <SchedulerDocumentsTable class="p-mt-4" :job-documents="job.documents" @loading="setLoading"></SchedulerDocumentsTable>
            <SchedulerTimingOutputTable v-if="job.edit" class="p-mt-4" :job="job" @loading="setLoading" @triggerSaved="$emit('triggerSaved')"></SchedulerTimingOutputTable>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iPackage } from './Scheduler'
import Card from 'primevue/card'
import SchedulerDocumentsTable from './SchedulerDocumentsTable/SchedulerDocumentsTable.vue'
import SchedulerTimingOutputTable from './SchedulerTimingOutputTable/SchedulerTimingOutputTable.vue'
import { AxiosResponse } from 'axios'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'scheduler-detail',
    components: { Card, SchedulerDocumentsTable, SchedulerTimingOutputTable },
    props: { id: { type: String }, clone: { type: String }, selectedJob: { type: Object } },
    emits: ['documentSaved', 'close'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            job: null as iPackage | null,
            jobNameDirty: false,
            operation: 'create',
            loading: false
        }
    },
    computed: {
        saveDisabled(): any {
            return this.job && (!this.job.jobName || this.job.documents?.length === 0)
        },
        testReadonly(): any {
            return this.job && this.job.edit ? true : false
        }
    },
    watch: {
        selectedJob() {
            this.loadJob()
        }
    },
    created() {
        this.loadJob()
    },
    methods: {
        loadJob() {
            this.job = { ...this.selectedJob } as iPackage
        },
        setLoading(loading: boolean) {
            this.loading = loading
        },
        async saveJob() {
            this.loading = true
            const originalJob = { ...this.job }

            this.formatJob()

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/scheduleree/saveJob`, this.job)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.resp === 'ok') {
                        this.store.setInfo({
                            title: this.$t('common.toast.' + this.operation + 'Title'),
                            msg: this.$t('common.toast.success')
                        })
                        this.$router.push(`/scheduler/edit-package-schedule?id=${this.job?.jobName}&clone=false`)
                        this.$emit('documentSaved', this.job?.jobName)
                    }
                })
                .catch(() => {
                    this.job = originalJob as iPackage
                })
            this.loading = false
        },
        formatJob() {
            delete this.job?.edit
            delete this.job?.numberOfDocuments
            this.job?.documents.forEach((document: any) => document.parameters?.forEach((parameter: any) => (parameter.value = parameter.value.trim())))
        },
        closeJobDetail() {
            this.job = null
            this.jobNameDirty = false
            this.$emit('close')
            this.$router.push('/scheduler')
        }
    }
})
</script>

<style lang="scss">
#scheduler-detail-card .p-card-body {
    padding: 0;
}
</style>
