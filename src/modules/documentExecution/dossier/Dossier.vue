<template>
    <div class="kn-width-full">
        <Card class="p-m-3">
            <template #header>
                <Toolbar class="kn-toolbar kn-toolbar--secondary">
                    <template #start>
                        {{ $t('common.details') }}
                    </template>
                    <template #end>
                        <Button v-if="templateOptionEnabled('uploadable') || templateOptionEnabled('downloadable')" icon="fas fa-ellipsis-v kn-cursor-pointer" class="p-button-text p-button-rounded p-button-plain" @click="showMenu" />
                    </template>
                </Toolbar>
            </template>
            <template #content>
                <form class="p-fluid p-formgrid p-grid">
                    <div class="p-field p-col-12 p-md-10">
                        <span class="p-float-label">
                            <InputText
                                id="activityName"
                                v-model.trim="v$.activity.activityName.$model"
                                class="kn-material-input p-mb-2"
                                type="text"
                                :class="{
                                    'p-invalid': v$.activity.activityName.$invalid && v$.activity.activityName.$dirty
                                }"
                                max-length="100"
                                data-test="activityName-input"
                                @blur="v$.activity.activityName.$touch()"
                            />
                            <label for="activityName" class="kn-material-input-label"> {{ $t('documentExecution.dossier.headers.activity') }} * </label>
                        </span>
                        <KnValidationMessages
                            :v-comp="v$.activity.activityName"
                            :additional-translate-params="{
                                fieldName: $t('documentExecution.dossier.headers.activity')
                            }"
                        />
                    </div>
                    <div class="p-field p-md-2">
                        <Button class="kn-button p-button-text" :disabled="buttonDisabled || launchButtonDisabled || launchClicked" :label="$t('documentExecution.dossier.launchActivity')" data-test="input-button" @click="createNewActivity" />
                    </div>
                </form>
            </template>
        </Card>

        <Card class="p-m-3">
            <template #header>
                <Toolbar class="kn-toolbar kn-toolbar--secondary">
                    <template #start>
                        {{ $t('documentExecution.dossier.launchedActivities') }}
                    </template>
                </Toolbar>
            </template>
            <template #content>
                <KnHint v-if="showHint" :title="'documentExecution.dossier.title'" :hint="'documentExecution.dossier.hint'" data-test="hint"></KnHint>
                <DataTable v-else v-model:filters="filters" :value="dossierActivities" :scrollable="true" scroll-height="40vh" :rows="20" class="p-datatable-sm kn-table" data-key="id" responsive-layout="stack" breakpoint="960px" data-test="activities-table" sort-field="creationDate" :sort-order="-1">
                    <template #header>
                        <div class="table-header">
                            <span class="p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters['global'].value" class="kn-material-input" type="text" :placeholder="$t('common.search')" badge="0" data-test="search-input" />
                            </span>
                        </div>
                    </template>
                    <template #empty>
                        {{ $t('common.info.noDataFound') }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter"></InputText>
                    </template>
                    <Column field="activity" :header="$t('documentExecution.dossier.headers.activity')" :sortable="true" />
                    <Column field="creationDate" :header="$t('common.creationDate')" :sortable="true" data-type="date">
                        <template #body="{ data }">
                            {{ formatDate(data.creationDate) }}
                        </template>
                    </Column>
                    <Column v-for="col of columns" :key="col.field" :field="col.field" :header="$t(col.header)" :style="col.style" class="kn-truncated" :sortable="true" />
                    <Column header :style="dossierDescriptor.table.iconColumn.style" @rowClick="false">
                        <template #body="slotProps">
                            <Button icon="pi pi-download" class="p-button-link" data-test="download" @click="downloadActivity(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-link" :disabled="dateCheck(slotProps.data)" data-test="delete-button" @click="deleteDossierConfirm(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
    </div>
    <Menu id="optionsMenu" ref="optionsMenu" :model="menuButtons" data-test="menu" />
    <KnInputFile v-if="!uploading" label="" :change-function="startTemplateUpload" :trigger-input="triggerUpload" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import dossierDescriptor from './DossierDescriptor.json'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import KnHint from '@/components/UI/KnHint.vue'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import mainStore from '../../../App.store'
import Menu from 'primevue/contextmenu'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import { iParameter } from '@/components/UI/KnParameterSidebar/KnParameterSidebar'
export default defineComponent({
    name: 'dossier',
    components: { KnInputFile, Menu, Card, Column, DataTable, KnHint, KnValidationMessages },
    props: { id: { type: String, required: false }, reloadTrigger: { type: Boolean }, filterData: Object, userRole: String },
    setup() {
        const store = mainStore()
        return { store }
    },
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
            columns: dossierDescriptor.columns,
            jsonTemplate: {} as any,
            filters: {
                global: [filterDefault]
            } as Object
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
        this.getDossierTemplate()
        this.getDossierActivities()
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
                        this.store.setInfo({
                            title: this.$t('common.toast.deleteTitle'),
                            msg: this.$t('documentExecution.dossier.deleteSuccess')
                        })
                        this.getDossierActivities()
                    })
                    .catch((error) => {
                        if (error) {
                            this.store.setError({
                                title: this.$t('common.error.generic'),
                                msg: error.message
                            })
                        }
                    })
            } else {
                this.store.setError({
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
                    this.store.setError({ title: this.$t('common.error.saving'), msg: response.data.errors })
                } else {
                    this.store.setInfo({ title: this.$t('common.save'), msg: this.$t('documentExecution.dossier.saveSuccess') })
                }
            })
            this.getDossierActivities()
        },
        async downloadActivity(selectedActivity) {
            if (selectedActivity.status == 'ERROR') {
                if (selectedActivity.hasBinContent) {
                    const link = import.meta.env.VITE_KNOWAGEDOSSIER_CONTEXT + `/restful-services/dossier/activity/${selectedActivity.id}/txt?activityName=${selectedActivity.activity}`
                    window.open(link)
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
                        window.open(link)
                        response.data.errors ? this.store.setError({ title: this.$t('common.error.generic'), msg: response.data.errors[0].message }) : ''
                    })
                }
            } else if (selectedActivity.partial == selectedActivity.total) {
                if (selectedActivity.hasBinContent) {
                    const link = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/activity/${selectedActivity.id}/pptx?activityName=${selectedActivity.activity}`
                    window.open(link)
                } else if (selectedActivity.hasDocBinContent) {
                    const link = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/activity/${selectedActivity.id}/doc?activityName=${selectedActivity.activity}`
                    window.open(link)
                } else if (selectedActivity.hasPptV2BinContent) {
                    const link = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/dossier/activity/${selectedActivity.id}/pptv2?activityName=${selectedActivity.activity}`
                    window.open(link)
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
                        response.data.errors ? this.store.setError({ title: this.$t('common.error.generic'), msg: response.data.errors[0].message }) : ''
                    })
                }
            } else {
                this.store.setError({
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

        showMenu(event) {
            this.createMenuItems()
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.optionsMenu.toggle(event)
        },
        createMenuItems() {
            this.menuButtons = []
            this.menuButtons.push({ key: '1', visible: this.templateOptionEnabled('uploadable'), icon: 'fas fa-upload', label: this.$t('documentExecution.dossier.uploadTemplate'), command: () => this.setUploadType() }, { key: '2', visible: this.templateOptionEnabled('downloadable'), icon: 'fas fa-download', label: this.$t('documentExecution.dossier.downloadTemplate'), command: () => this.downloadTemplate() })
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
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/dossier/checkPathFile?templateName=' + fileName)
                    .then((response: AxiosResponse<any>) => {
                        if (response.data.STATUS == 'KO') {
                            this.store.setInfo({ title: this.$t('common.error.generic'), msg: this.$t('documentExecution.dossier.templateDownloadError') })
                        } else if (response.data.STATUS == 'OK') {
                            window.open(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/dossier/resourcePath?templateName=' + fileName)
                        }
                    })
                    .catch((error) => {
                        if (error) this.store.setError({ title: this.$t('common.error.generic'), msg: error.message })
                    })
            } else {
                const fileName = this.jsonTemplate.PPT_TEMPLATE.name
                window.open(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/resourcePath?templateName=' + fileName)
            }
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
                    this.store.setInfo({ title: this.$t('common.toast.success'), msg: this.$t('common.toast.uploadSuccess') })
                })
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.dossier.templateUploadError') }))
                .finally(() => (this.triggerUpload = false))
        }
    },
    beforeUnmount() {
        this.interval()
    }
})
</script>
