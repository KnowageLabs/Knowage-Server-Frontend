<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ job?.jobName }}</q-toolbar-title>

        <q-btn flat round dense icon="save" :disable="saveDisabled" data-test="save-button" @click="saveJob">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeJobDetail">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
        </q-btn>
    </q-toolbar>
    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />

    <Card v-if="job" id="scheduler-detail-card" class="p-m-2">
        <template #content>
            <div class="row q-col-gutter-sm q-mx-sm">
                <q-input id="jobName" v-model.trim="job.jobName" class="col-6" :error="job.jobName?.length === 0 && jobNameDirty" :error-message="$t('common.validation.required', { fieldName: $t('common.name') })" :label="$t('common.name')" maxLength="80" filled :disable="testReadonly" data-test="name-input" @update:model-value="jobNameDirty = true" />
                <q-select class="col-6" v-model="job.role" :options="getRoleOptions()" :error="job.role?.length === 0 || job.role === $t('role.defaultRolePlaceholder')" :error-message="$t('common.validation.required', { fieldName: $t('common.role') })" :label="$t('common.role')" filled data-test="role-input" />
                <q-input v-model="job.jobDescription" class="col-12" maxLength="120" :label="$t('common.description')" filled row="2" data-test="description-input" />
            </div>
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
            roleOptions: [] as Array<string>,
            jobNameDirty: false,
            operation: 'create',
            loading: false
        }
    },
    computed: {
        saveDisabled(): any {
            return this.job && (!this.job.jobName || this.job.documents?.length === 0 || this.job.role === this.$t('role.defaultRolePlaceholder') || this.job.role === '' || this.job.role === undefined)
        },
        testReadonly(): any {
            return !!(this.job && this.job.edit)
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
            this.job.jobParameters = this.job.jobParameters || []
            if (this.job && this.job.jobParameters) {
                this.job.role = this.job.jobParameters.find((param: any) => param.name === 'userRoles')?.value
            }
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
            // Ensure jobParameters exists
            if (!this.job) return
            this.job.jobParameters = this.job.jobParameters || []

            // Try to find an existing userRoles parameter
            const userRolesParam = this.job.jobParameters.find((param: any) => param.name === 'userRoles')

            if (userRolesParam) {
                // Update existing param with selected role (or set empty string if not provided)
                userRolesParam.value = this.job.role || ''
            } else {
                // Insert a new userRoles parameter carrying the selected role (or empty string)
                const jobParameter = { name: 'userRoles', value: this.job.role || '' }
                this.job.jobParameters.push(jobParameter)
            }

            // Remove transient job.role field - backend expects it inside jobParameters
            delete this.job.role
        },
        closeJobDetail() {
            this.job = null
            this.jobNameDirty = false
            this.$emit('close')
            this.$router.push('/scheduler')
        },
        getRoleOptions(): Array<string> {
            const rolesOptions = this.store.user.roles
            if (this.job && !this.job.role) {
                this.job.role = this.job?.jobParameters?.find((param) => param.name === 'userRoles')?.value || this.job?.role
            }
            if (rolesOptions[0] !== this.$t('role.defaultRolePlaceholder')) rolesOptions.unshift(this.$t('role.defaultRolePlaceholder'))
            return rolesOptions
        }
    }
})
</script>

<style lang="scss">
#scheduler-detail-card .p-card-body {
    padding: 0;
}
</style>
