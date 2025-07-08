<template>
    <div class="q-ma-sm q-gutter-md">
        <q-card class="col-12 q-ml-none">
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>{{ $t('common.details') }}</q-toolbar-title>
                <q-btn v-if="templateOptionEnabled('uploadable') || templateOptionEnabled('downloadable')" flat round dense icon="more_vert">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.more') }}</q-tooltip>
                    <q-menu auto-close v-if="menuButtons">
                        <q-list dense>
                            <q-item v-for="button in menuButtons" clickable v-close-popup>
                                <q-item-section avatar>
                                    <q-icon color="primary" :name="button.icon" />
                                </q-item-section>
                                <q-item-section @click="button.command()">{{ button.label }}</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </q-toolbar>
            <q-card-section>
                <form class="row q-gutter-md items-start">
                    <q-input class="col" dense filled v-model="v$.activity.activityName.$model" :label="$t('documentExecution.dossier.headers.activity') + ' *'" :error="v$.activity.activityName.$invalid && v$.activity.activityName.$dirty" :error-message="v$.activity.activityName.$errors[0]?.$message" data-test="activityName-input" />
                    <q-btn color="primary" :disable="buttonDisabled || launchButtonDisabled || launchClicked" :label="$t('documentExecution.dossier.launchActivity')" data-test="input-button" @click="createNewActivity" />
                </form>
            </q-card-section>
        </q-card>
        <q-card class="col-12 q-ml-none">
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>{{ $t('documentExecution.dossier.launchedActivities') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section>
                <q-banner v-if="showHint" class="col-12 q-mt-sm bg-info text-black" rounded dense>{{ $t('documentExecution.dossier.hint') }}</q-banner>
                <q-table v-else dense flat :rows="dossierActivities" :columns="columns" :pagination="{ rowsPerPage: 10 }">
                    <template #body-cell-actions="props">
                        <q-td class="text-right">
                            <q-btn flat round size="sm" icon="download" class="q-mr-sm" data-test="download" @click="downloadActivity(props.row)">
                                <q-tooltip :delay="500">{{ $t('common.download') }}</q-tooltip>
                            </q-btn>
                            <q-btn flat round size="sm" icon="delete" :disabled="dateCheck(props.row)" data-test="delete-button" @click="deleteDossierConfirm(props.row)">
                                <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                            </q-btn>
                        </q-td>
                    </template>
                </q-table>
            </q-card-section>
        </q-card>
    </div>
    <KnInputFile v-if="!uploading" label="" :change-function="startTemplateUpload" :trigger-input="triggerUpload" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import dossierDescriptor from './DossierDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import mainStore from '../../../App.store'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import { iParameter } from '@/components/UI/KnParameterSidebar/KnParameterSidebar'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'dossier',
    components: { KnInputFile, KnValidationMessages },
    props: { id: { type: String, required: false }, reloadTrigger: { type: Boolean }, filterData: Object, userRole: String },
    data() {
        return {
            v$: useValidate() as any,
            dossierDescriptor,
            activity: { activityName: '' } as any,
            loading: false,
            launchClicked: false,
            triggerUpload: false,
            uploading: false,
            interval: null as any,
            dossierActivities: [] as any,
            menuButtons: [] as any,
            jsonTemplate: {} as any,
            filters: {
                global: [filterDefault]
            } as Object,
            columns: [] as any
        }
    },
    computed: {
        showHint() {
            if (this.dossierActivities.length != 0) {
                return false
            }
            return true
        },
        buttonDisabled(): any {
            return this.v$.$invalid
        },
        launchButtonDisabled(): boolean {
            const startedActivity = this.dossierActivities.find((activity) => {
                return activity.status === 'STARTED'
            })
            if (startedActivity && this.timeDifference(startedActivity)) return true
            else return false
        }
    },
    watch: {
        async reloadTrigger() {
            this.getDossierTemplate()
            this.getDossierActivities()
            this.interval = setInterval(() => {
                this.getDossierActivities()
            }, 10000)
        }
    },
    created() {
        this.columns = [
            {
                name: 'activity',
                field: 'activity',
                label: this.$t('documentExecution.dossier.headers.activity'),
                align: 'left',
                sortable: true
            },
            {
                name: 'creationDate',
                field: 'creationDate',
                label: this.$t('common.creationDate'),
                align: 'left',
                sortable: true,
                style: { width: '20%' }
            },
            {
                name: 'partial',
                field: 'partial',
                label: this.$t('documentExecution.dossier.headers.partial'),
                align: 'left',
                sortable: true
            },
            {
                name: 'total',
                field: 'total',
                label: this.$t('documentExecution.dossier.headers.total'),
                align: 'left',
                sortable: true
            },
            {
                name: 'status',
                field: 'status',
                label: this.$t('documentExecution.dossier.headers.status'),
                align: 'left',
                sortable: true
            },
            {
                name: 'actions',
                field: 'actions',
                label: '',
                alight: 'right'
            }
        ]
        this.getDossierTemplate()
        this.getDossierActivities()
        this.createMenuItems()
        this.interval = setInterval(() => {
            this.getDossierActivities()
        }, 10000)
    },
    deactivated() {
        clearInterval(this.interval)
    },
    validations() {
        return {
            activity: createValidations('activity', dossierDescriptor.validations.activity)
        }
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError']),
        formatDate(date) {
            return formatDateWithLocale(date, { dateStyle: 'short', timeStyle: 'short' })
        },
        dateCheck(item): boolean {
            return Date.now() - item.creationDate < 86400000 && item.status === 'STARTED'
        },
        timeDifference(startedActivity) {
            const startDate = startedActivity.creationDate
            const currentDate = new Date()
            const seconds = (currentDate.getTime() - startDate) / 1000

            return seconds <= 600
        },
        async getDossierActivities() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/activities/${this.id}`)
                .then((response: AxiosResponse<any>) => {
                    this.dossierActivities = [...response.data]
                })
                .finally(() => {
                    this.loading = false
                })
        },
        async getDossierTemplate() {
            this.loading = true
            const url = `${import.meta.env.VITE_KNOWAGEDOSSIER_CONTEXT}/api/start/dossierTemplate?documentId=${this.id}`
            const filters = this.filterData ? this.filterData : {}
            filters.filterStatus?.forEach((filter: iParameter) => {
                const fields = ['dataDependsOnParameters', 'dataDependentParameters', 'lovDependsOnParameters', 'lovDependentParameters', 'dependsOnParameters', 'dependentParameters']
                fields.forEach((field: string) => delete filter[field])
            })
            const config = {
                data: encodeURIComponent(JSON.stringify(filters))
            }
            await this.$http
                .post(url, config)
                .then((response: AxiosResponse<any>) => {
                    this.jsonTemplate = { ...response.data }
                })
                .catch((err) => console.log(err))
                .finally(() => {
                    this.loading = false
                })
        },
        deleteDossierConfirm(selectedDossier) {
            this.$confirm.require({
                message: this.$t('documentExecution.dossier.deleteConfirm'),
                header: this.$t('documentExecution.dossier.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteDossier(selectedDossier)
            })
        },
        async deleteDossier(selectedDossier) {
            const url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/activity/${selectedDossier.id}`
            if (selectedDossier.status == 'DOWNLOAD' || selectedDossier.status == 'ERROR' || !this.dateCheck(selectedDossier)) {
                await this.$http
                    .delete(url)
                    .then(() => {
                        this.setInfo({
                            title: this.$t('common.toast.deleteTitle'),
                            msg: this.$t('documentExecution.dossier.deleteSuccess')
                        })
                        this.getDossierActivities()
                    })
                    .catch((error) => {
                        if (error) {
                            this.setError({
                                title: this.$t('common.error.generic'),
                                msg: error.message
                            })
                        }
                    })
            } else {
                this.setError({
                    title: this.$t('common.error.generic'),
                    msg: this.$t('documentExecution.dossier.progressNotFinished')
                })
            }
        },
        async createNewActivity() {
            this.launchClicked = true
            setTimeout(() => (this.launchClicked = false), 3000)

            if (this.jsonTemplate) this.jsonTemplate.executionRole = this.userRole

            const url = `${import.meta.env.VITE_KNOWAGEDOSSIER_CONTEXT}/api/dossier/run?activityName=${this.activity.activityName}&documentId=${this.id}`
            await this.$http.post(url, this.jsonTemplate).then((response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    this.setError({ title: this.$t('common.error.saving'), msg: response.data.errors })
                } else {
                    this.setInfo({ title: this.$t('common.save'), msg: this.$t('documentExecution.dossier.saveSuccess') })
                }
            })
            this.getDossierActivities()
        },
        async downloadActivity(selectedActivity) {
            if (selectedActivity.status == 'ERROR') {
                if (selectedActivity.hasBinContent) {
                    const link = import.meta.env.VITE_KNOWAGEDOSSIER_CONTEXT + `/restful-services/dossier/activity/${selectedActivity.id}/txt?activityName=${selectedActivity.activity}`
                    this.downloadFile(link)
                } else {
                    await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/random-key/${selectedActivity.progressId}`).then((response: AxiosResponse<any>) => {
                        let url = `/api/start/errorFile?activityId=${selectedActivity.id}&randomKey=${response.data}&activityName=${selectedActivity.activity}`
                        if (this.jsonTemplate.PPT_TEMPLATE != null) {
                            url += '&type=PPT'
                            url += '&templateName=' + this.jsonTemplate.PPT_TEMPLATE.name
                        } else if (this.jsonTemplate.DOC_TEMPLATE != null) {
                            url += '&type=DOC'
                            url += '&templateName=' + this.jsonTemplate.DOC_TEMPLATE.name
                        } else {
                            url += '&type=PPTV2'
                            url += '&templateName=' + this.jsonTemplate.PPT_TEMPLATE_V2.name
                        }
                        const link = import.meta.env.VITE_KNOWAGE_CONTEXT + url
                        this.downloadFile(link)
                        response.data.errors ? this.setError({ title: this.$t('common.error.generic'), msg: response.data.errors[0].message }) : ''
                    })
                }
            } else if (selectedActivity.partial == selectedActivity.total) {
                if (selectedActivity.hasBinContent) {
                    const link = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/activity/${selectedActivity.id}/pptx?activityName=${selectedActivity.activity}`
                    this.downloadFile(link)
                } else if (selectedActivity.hasDocBinContent) {
                    const link = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/activity/${selectedActivity.id}/doc?activityName=${selectedActivity.activity}`
                    this.downloadFile(link)
                } else if (selectedActivity.hasPptV2BinContent) {
                    const link = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/activity/${selectedActivity.id}/pptv2?activityName=${selectedActivity.activity}`
                    this.downloadFile(link)
                } else {
                    const link = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/random-key/${selectedActivity.progressId}`
                    await this.$http.get(link).then((response: AxiosResponse<any>) => {
                        if (this.jsonTemplate.PPT_TEMPLATE != null) {
                            this.storePPT(selectedActivity.id, response.data, selectedActivity.activity)
                        } else if (this.jsonTemplate.DOC_TEMPLATE != null) {
                            this.storeDOC(selectedActivity.id, response.data, selectedActivity.activity)
                        } else {
                            this.storePPTV2(selectedActivity.id, response.data, selectedActivity.activity)
                        }
                        response.data.errors ? this.setError({ title: this.$t('common.error.generic'), msg: response.data.errors[0].message }) : ''
                    })
                }
            } else {
                this.setError({
                    title: this.$t('common.error.generic'),
                    msg: this.$t('documentExecution.dossier.progressNotFinished')
                })
            }
        },

        storePPT(id, randomKey, activityName) {
            const generateType = 'generatePPT'
            const templateName = this.jsonTemplate.PPT_TEMPLATE.name
            this.storeDossier(id, randomKey, activityName, generateType, templateName)
        },
        storePPTV2(id, randomKey, activityName) {
            const generateType = 'generatePPTV2'
            const templateName = this.jsonTemplate.PPT_TEMPLATE_V2.name
            this.storeDossier(id, randomKey, activityName, generateType, templateName)
        },
        storeDOC(id, randomKey, activityName) {
            const generateType = 'generateDOC'
            const templateName = this.jsonTemplate.DOC_TEMPLATE.name
            this.storeDossier(id, randomKey, activityName, generateType, templateName)
        },
        storeDossier(id, randomKey, activityName, generateType, templateName) {
            const link = import.meta.env.VITE_HOST_URL + `${import.meta.env.VITE_KNOWAGEDOSSIER_CONTEXT}/api/start/` + generateType + `?activityId=${id}&randomKey=${randomKey}&templateName=${templateName}&activityName=${activityName}`
            window.open(link)
        },

        createMenuItems() {
            this.menuButtons = [
                { key: '1', visible: this.templateOptionEnabled('uploadable'), icon: 'upload', label: this.$t('documentExecution.dossier.uploadTemplate'), command: () => this.setUploadType() },
                { key: '2', visible: this.templateOptionEnabled('downloadable'), icon: 'download', label: this.$t('documentExecution.dossier.downloadTemplate'), command: () => this.downloadTemplate() }
            ]
        },
        templateOptionEnabled(optionName: string) {
            let isEnabled = false

            if (this.jsonTemplate && this.jsonTemplate?.PPT_TEMPLATE) {
                isEnabled = this.jsonTemplate?.PPT_TEMPLATE?.[optionName]
            } else if (this.jsonTemplate && this.jsonTemplate?.PPT_TEMPLATE_V2) {
                isEnabled = this.jsonTemplate?.PPT_TEMPLATE_V2?.[optionName]
            } else if (this.jsonTemplate && this.jsonTemplate?.DOC_TEMPLATE) {
                isEnabled = this.jsonTemplate?.DOC_TEMPLATE?.[optionName]
            }
            return isEnabled
        },
        async downloadTemplate() {
            if (this.jsonTemplate.PPT_TEMPLATE == null) {
                const fileName = this.jsonTemplate?.DOC_TEMPLATE?.name ? this.jsonTemplate?.DOC_TEMPLATE?.name : this.jsonTemplate?.PPT_TEMPLATE_V2?.name
                await this.$http
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/checkPathFile?templateName=${fileName}&documentId=${this.id}`)
                    .then((response: AxiosResponse<any>) => {
                        if (response.data.STATUS == 'KO') {
                            this.setInfo({ title: this.$t('common.error.generic'), msg: this.$t('documentExecution.dossier.templateDownloadError') })
                        } else if (response.data.STATUS == 'OK') {
                            this.downloadFile(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/resourcePath?templateName=${fileName}&documentId=${this.id}`)
                        }
                    })
                    .catch((error) => {
                        if (error) this.setError({ title: this.$t('common.error.generic'), msg: error.message })
                    })
            } else {
                const fileName = this.jsonTemplate.PPT_TEMPLATE.name
                this.downloadFile(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/resourcePath?templateName=${fileName}&documentId=${this.id}`)
            }
        },
        async downloadFile(url) {
            await this.$http
                .get(url, { responseType: 'arraybuffer' })
                .then((response: AxiosResponse<any>) => {
                    downloadDirectFromResponse(response)
                })
                .catch((error) => {
                    if (error) this.setError({ title: this.$t('common.error.generic'), msg: error.message })
                })
        },
        setUploadType() {
            this.triggerUpload = false
            setTimeout(() => (this.triggerUpload = true), 200)
        },
        startTemplateUpload(event) {
            this.uploading = true
            this.uploadTemplate(event.target.files[0])
            this.triggerUpload = false
            setTimeout(() => (this.uploading = false), 200)
        },
        async uploadTemplate(uploadedFile) {
            const formData = new FormData()
            formData.append('file', uploadedFile)
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/dossier/importTemplateFile', formData, { headers: { 'X-Disable-Errors': 'true' } })
                .then(async () => {
                    this.setInfo({ title: this.$t('common.toast.success'), msg: this.$t('common.toast.uploadSuccess') })
                })
                .catch(() => this.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.dossier.templateUploadError') }))
                .finally(() => (this.triggerUpload = false))
        }
    },
    beforeUnmount() {
        clearInterval(this.interval)
    }
})
</script>
