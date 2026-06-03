<template>
    <div v-if="viewMode === 'document-detail' || route.name === 'document-details-new-document' || route.name === 'document-details-edit-document'" id="document-details-container" class="column kn-flex kn-height-full">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('documentExecution.documentDetails.title') }}</q-toolbar-title>
            <q-btn flat round dense icon="save" :disable="invalidDrivers > 0 || invalidOutputParams > 0 || invalidFunctionalities == 0 || v$.$invalid" data-test="submit-button" @click="saveDocument">
                <q-tooltip>{{ $t('common.save') }}</q-tooltip>
            </q-btn>
            <q-btn v-if="propMode === 'execution'" flat round dense icon="close" data-test="close-button" @click="closeDocument">
                <q-tooltip>{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </q-toolbar>

        <div class="document-details-tab-container column kn-flex">
            <q-tabs v-model="activeTab" dense align="left" class="kn-tabs" @update:model-value="onTabChange" style="border-bottom: 1px solid black">
                <q-tab name="informations" :label="$t('documentExecution.documentDetails.info.infoTitle')" />
                <q-tab v-if="selectedDocument?.id" name="drivers">
                    <span :class="{ 'details-warning-color': invalidDrivers }">{{ $t('documentExecution.documentDetails.drivers.title') }}</span>
                    <q-badge v-if="invalidDrivers > 0" color="negative" floating>{{ invalidDrivers }}</q-badge>
                </q-tab>
                <q-tab v-if="selectedDocument?.id" name="outputParams">
                    <span :class="{ 'details-warning-color': invalidOutputParams }">{{ $t('documentExecution.documentDetails.outputParams.title') }}</span>
                    <q-badge v-if="invalidOutputParams > 0" color="negative" floating>{{ invalidOutputParams }}</q-badge>
                </q-tab>
                <q-tab v-if="selectedDocument?.id && showDataLineageTab" name="dataLineage" :label="$t('documentExecution.documentDetails.dataLineage.title')" />
                <q-tab v-if="selectedDocument?.id" name="history" :label="$t('documentExecution.documentDetails.history.title')" />
                <q-tab v-if="selectedDocument?.id && selectedDocument?.typeCode == 'REPORT' && selectedDocument?.engine == 'knowagejasperreporte'" name="subreports" :label="$t('documentExecution.documentDetails.subreports.title')" />
            </q-tabs>
            <q-tab-panels v-model="activeTab" animated class="row kn-flex">
                <q-tab-panel name="informations" class="q-pa-none kn-height-full row">
                    <InformationsTab
                        v-if="!loading"
                        :selected-document="selectedDocument"
                        :available-folders="availableFolders"
                        :document-types="types"
                        :document-engines="engines"
                        :available-datasources="dataSources"
                        :available-states="states"
                        :selected-dataset="selectedDataset"
                        :available-templates="templates"
                        :available-attributes="attributes"
                        @setTemplateForUpload="setTemplateForUpload"
                        @setImageForUpload="setImageForUpload"
                        @deleteImage="deleteImage"
                        @openDesignerDialog="openDesignerDialog"
                    />
                </q-tab-panel>
                <q-tab-panel v-if="selectedDocument?.id" name="drivers" class="q-pa-none kn-height-full row">
                    <DriversTab :selected-document="selectedDocument" :available-drivers="drivers" :available-analytical-drivers="analyticalDrivers" :refresh="refreshDrivers" />
                </q-tab-panel>
                <q-tab-panel v-if="selectedDocument?.id" name="outputParams" class="q-pa-none kn-height-full row">
                    <OutputParamsTab :selected-document="selectedDocument" :type-list="parTypes" :date-formats="dateFormats" />
                </q-tab-panel>
                <q-tab-panel v-if="selectedDocument?.id && showDataLineageTab" name="dataLineage" class="q-pa-none kn-height-full row">
                    <DataLineageTab :selected-document="selectedDocument" :meta-source-resource="metaSourceResource" :saved-tables="savedTables" />
                </q-tab-panel>
                <q-tab-panel v-if="selectedDocument?.id" name="history" class="q-pa-none kn-height-full row">
                    <HistoryTab :selected-document="selectedDocument" @openDesignerDialog="openDesignerDialog" :refresh="refreshHistory" />
                </q-tab-panel>
                <q-tab-panel v-if="selectedDocument?.id && selectedDocument?.typeCode == 'REPORT' && selectedDocument?.engine == 'knowagejasperreporte'" name="subreports" class="q-pa-none kn-height-full row">
                    <SubreportsTab :selected-document="selectedDocument" :all-document-details-prop="allDocumentDetails" />
                </q-tab-panel>
            </q-tab-panels>
        </div>

        <DocumentDetailOlapDesignerDialog v-if="designerDialogVisible" :visible="designerDialogVisible" :selected-document="selectedDocument" @close="designerDialogVisible = false" @designerStarted="onDesignerStart"></DocumentDetailOlapDesignerDialog>
        <DocumentDetailDossierDesignerDialog v-if="user.enterprise && dossierDesignerDialogVisible" :visible="dossierDesignerDialogVisible" :selected-document="selectedDocument" @close="closeDossierDesignerDialog($event)"></DocumentDetailDossierDesignerDialog>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import mainDescriptor from './DocumentDetailsDescriptor.json'
import InformationsTab from './tabs/informations/DocumentDetailsInformations.vue'
import DriversTab from './tabs/drivers/DocumentDetailsDrivers.vue'
import OutputParamsTab from './tabs/outputParams/DocumentDetailsOutputParameters.vue'
import DataLineageTab from './tabs/dataLineage/DocumentDetailsDataLineage.vue'
import HistoryTab from './tabs/history/DocumentDetailsHistory.vue'
import SubreportsTab from './tabs/subreports/DocumentDetailsSubreports.vue'
import { iDataSource, iAnalyticalDriver, iDriver, iEngine, iTemplate, iAttribute, iParType, iDateFormat, iFolder, iTableSmall, iOutputParam, iDocumentType } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import DocumentDetailOlapDesignerDialog from './dialogs/olapDesignerDialog/DocumentDetailOlapDesignerDialog.vue'
import DocumentDetailDossierDesignerDialog from './dialogs/dossierDesignerDialog/DocumentDetailDossierDesignerDialog.vue'
import mainStore from '../../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { mapState, mapActions } from 'pinia'

export default defineComponent({
    name: 'document-details',
    components: {
        InformationsTab,
        DriversTab,
        OutputParamsTab,
        DataLineageTab,
        HistoryTab,
        SubreportsTab,
        DocumentDetailOlapDesignerDialog,
        DocumentDetailDossierDesignerDialog
    },
    props: { propDocId: { type: String }, propFolderId: { type: String }, propMode: { type: String }, viewMode: { type: String }, wholeItem: { type: Object } },
    emits: ['closeDetails', 'documentSaved'],
    setup() {
        const store = mainStore()
        const route = useRoute()
        const router = useRouter()
        const quasar = useQuasar()
        return { store, route, router, quasar }
    },
    data() {
        return {
            v$: useValidate() as any,
            mainDescriptor,
            loading: false,
            docId: null as any,
            folderId: null as any,
            templateToUpload: null as any,
            imageToUpload: null as any,
            selectedDataset: {} as any,
            selectedDocument: {} as any,
            dataSources: [] as iDataSource[],
            analyticalDrivers: [] as iAnalyticalDriver[],
            drivers: [] as iDriver[],
            engines: [] as iEngine[],
            templates: [] as iTemplate[],
            attributes: [] as iAttribute[],
            parTypes: [] as iParType[],
            dateFormats: [] as iDateFormat[],
            metaSourceResource: [] as any,
            savedTables: [] as iTableSmall[],
            availableFolders: [] as iFolder[],
            states: mainDescriptor.states,
            types: [] as iDocumentType[],
            allDocumentDetails: [] as any,
            savedSubreports: [] as any,
            selectedSubreports: [] as any,
            designerDialogVisible: false,
            dossierDesignerDialogVisible: false,
            refreshDrivers: false,
            refreshHistory: false,
            activeTab: 'informations'
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        }),
        invalidOutputParams(): number {
            if (this.selectedDocument && this.selectedDocument.outputParameters) {
                return this.selectedDocument.outputParameters.filter((parameter: any) => parameter.numberOfErrors > 0).length
            }
            return 0
        },
        invalidDrivers(): number {
            if (this.selectedDocument && this.selectedDocument.drivers) {
                return this.selectedDocument.drivers.filter((parameter: any) => parameter.numberOfErrors > 0).length
            }
            return 0
        },
        invalidFunctionalities(): number {
            return this.selectedDocument?.functionalities?.length
        },
        showDataLineageTab(): boolean {
            return this.user.functionalities.includes(UserFunctionalitiesConstants.DATA_SOURCE_MANAGEMENT)
        }
    },
    watch: {
        async propDocId() {
            await this.isForEdit()
        },
        loading(val: boolean) {
            if (val) this.quasar.loading.show()
            else this.quasar.loading.hide()
        }
    },
    async created() {
        if (this.viewMode !== 'document-detail' && this.route.name !== 'document-details-new-document' && this.route.name !== 'document-details-edit-document') return
        await this.isForEdit()
    },
    activated() {
        this.setDocumentAndFolderIds()
        this.resetNewDocumentData()
        if (this.propFolderId) {
            this.getFunctionalities()
            this.getAnalyticalDrivers()
            this.getDatasources()
            this.getTypes()
            this.getEngines()
            this.getAttributes()
            this.getParTypes()
            this.getDateFormats()
            this.getSavedTablesByDocumentID()
            this.getDataset()
            this.getDataSources()
        }
    },
    methods: {
        ...mapActions(mainStore, ['setLoading']),
        setDocumentAndFolderIds() {
            if (this.propMode === 'execution') {
                this.docId = this.propDocId
                this.folderId = this.propFolderId
            } else {
                this.route.params.docId ? (this.docId = this.route.params.docId) : (this.folderId = this.route.params.folderId)
            }
        },
        async isForEdit() {
            this.setDocumentAndFolderIds()
            await this.loadPage(this.docId)
        },
        resetNewDocumentData() {
            if (this.wholeItem && !this.wholeItem.fromTab && this.propFolderId) {
                this.selectedDocument = { ...this.mainDescriptor.newDocument }
                this.selectedDocument.functionalities = []
            }
        },
        async loadPage(id) {
            this.loading = true
            await Promise.all([await this.getSelectedDocumentById(id), this.getFunctionalities(), this.getAnalyticalDrivers(), this.getDatasources(), this.getTypes(), this.getEngines(), this.getAttributes(), this.getParTypes(), this.getDateFormats(), this.getSavedTablesByDocumentID(), this.getDataset(), this.getDataSources()])
            this.loading = false
        },
        async getSelectedDocumentById(id) {
            if (id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documents/${id}`).then((response: AxiosResponse<any>) => (this.selectedDocument = response.data))
            } else {
                this.selectedDocument = { ...this.mainDescriptor.newDocument }
                this.selectedDocument.functionalities = []
            }
        },
        async getFunctionalities() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/folders?includeDocs=false`).then((response: AxiosResponse<any>) => {
                this.availableFolders = response.data
                if (this.route.params.folderId) {
                    const sourceFolder = this.availableFolders.find((folder) => folder.id == parseInt(this.folderId)) as iFolder
                    if (sourceFolder && !this.selectedDocument.functionalities.includes(sourceFolder.path)) this.selectedDocument.functionalities.push(sourceFolder.path)
                }
            })
        },
        async getAnalyticalDrivers() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers`).then((response: AxiosResponse<any>) => (this.analyticalDrivers = response.data))
        },
        async getDatasources() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasources`).then((response: AxiosResponse<any>) => (this.dataSources = response.data))
        },
        async getDocumentDrivers() {
            if (this.selectedDocument?.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument?.id}/drivers`).then((response: AxiosResponse<any>) => (this.drivers = response.data))
            }
        },
        async getTemplates() {
            if (this.selectedDocument?.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument?.id}/templates`).then((response: AxiosResponse<any>) => (this.templates = response.data))
            }
        },
        async getTypes() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/document-detail/types`).then((response: AxiosResponse<any>) => (this.types = response.data))
        },
        async getEngines() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/document-detail/engines`).then((response: AxiosResponse<any>) => (this.engines = response.data))
        },
        async getAttributes() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/attributes`).then((response: AxiosResponse<any>) => (this.attributes = response.data))
        },
        async getParTypes() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/domains/listByCode/PAR_TYPE`).then((response: AxiosResponse<any>) => (this.parTypes = response.data))
        },
        async getDateFormats() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/domains/listByCode/DATE_FORMAT`).then((response: AxiosResponse<any>) => (this.dateFormats = response.data))
        },
        async getDataSources() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/metaSourceResource/`).then((response: AxiosResponse<any>) => (this.metaSourceResource = response.data))
        },
        async getSavedTablesByDocumentID() {
            if (this.selectedDocument.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/metaDocumetRelationResource/document/${this.selectedDocument.id}`).then((response: AxiosResponse<any>) => (this.savedTables = response.data))
            }
        },
        async getDataset() {
            if (this.selectedDocument?.dataSetId) {
                await this.$http
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/dataset/id/${this.selectedDocument?.dataSetId}`, { headers: { 'X-Disable-Errors': 'true' } })
                    .then((response: AxiosResponse<any>) => {
                        this.selectedDataset = response.data[0]
                    })
                    .catch((error) => {
                        this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: error.message })
                    })
            }
        },
        async getAllSubreports() {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/`).then((response: AxiosResponse<any>) => (this.allDocumentDetails = response.data))
            this.loading = false
        },
        setTemplateForUpload(event) {
            this.templateToUpload = event
        },
        async uploadTemplate(uploadedFile, responseId) {
            if (this.templateToUpload) {
                const formData = new FormData()
                formData.append('file', uploadedFile)
                await this.$http
                    .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${responseId}/templates`, formData, {
                        headers: { 'X-Disable-Errors': 'true' }
                    })
                    .then(() => (this.templateToUpload = null))
                    .catch(() => {
                        this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.history.uploadError') })
                    })
            }
        },
        deleteImage() {
            this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/image`, { headers: { 'X-Disable-Errors': 'true' } })
                .then(() => this.loadPage(this.docId))
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.info.imageError') }))
        },
        setImageForUpload(event) {
            this.imageToUpload = event
        },
        async uploadImage(uploadedFile, responseId) {
            if (this.imageToUpload) {
                const formData = new FormData()
                formData.append('file', uploadedFile)
                formData.append('fileName', uploadedFile.name)
                await this.$http
                    .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${responseId}/image`, formData, {
                        headers: { 'X-Disable-Errors': 'true' }
                    })
                    .then(() => (this.imageToUpload = null))
                    .catch(() => {
                        this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.info.imageUploadError') })
                    })
            }
        },
        async saveOutputParams() {
            if (this.selectedDocument.outputParameters) {
                this.selectedDocument.outputParameters.forEach((parameter: iOutputParam) => {
                    if (!parameter.id) {
                        delete parameter.numberOfErrors
                        delete parameter.tempId
                        delete parameter.isChanged
                        this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/outputparameters`, parameter, { headers: { 'X-Disable-Errors': 'true' } }).catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.outputParams.persistError') }))
                    } else if (parameter.isChanged) {
                        delete parameter.numberOfErrors
                        delete parameter.isChanged
                        this.$http.put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/outputparameters/${parameter.id}`, parameter, { headers: { 'X-Disable-Errors': 'true' } }).catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.outputParams.persistError') }))
                    }
                })
            }
        },
        async saveDrivers() {
            if (this.selectedDocument.drivers) {
                this.selectedDocument.drivers.forEach((driver: iDriver) => {
                    driver.modifiable = 0
                    if (!driver.id) {
                        delete driver.numberOfErrors
                        delete driver.isChanged
                        this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/drivers`, driver, { headers: { 'X-Disable-Errors': 'true' } }).catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.drivers.persistError') }))
                    } else if (driver.isChanged) {
                        delete driver.numberOfErrors
                        delete driver.isChanged
                        this.$http.put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/drivers/${driver.id}`, driver, { headers: { 'X-Disable-Errors': 'true' } }).catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.drivers.persistError') }))
                    }
                })
            }
        },
        saveRequest(docToSave) {
            if (!this.selectedDocument.id) {
                return this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails`, docToSave, { headers: { 'X-Disable-Errors': 'true' } })
            } else {
                return this.$http.put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${docToSave.id}`, docToSave, { headers: { 'X-Disable-Errors': 'true' } })
            }
        },
        async saveDocument() {
            this.loading = true
            const docToSave = { ...this.selectedDocument }
            const folderId = this.propFolderId
            delete docToSave.drivers
            delete docToSave.outputParameters
            delete docToSave.dataSetLabel

            await this.saveRequest(docToSave)
                .then(async (response: AxiosResponse<any>) => {
                    await this.saveOutputParams()
                    await this.saveDrivers()
                    await this.uploadTemplate(this.templateToUpload, response.data.id)
                    await this.uploadImage(this.imageToUpload, response.data.id)
                    this.store.setInfo({ title: this.$t('common.save'), msg: this.$t('common.toast.updateSuccess') })
                    setTimeout(() => {
                        const path = `/document-details/${response.data.id}`
                        !this.selectedDocument.id ? this.router.push(path) : ''
                        this.$emit('documentSaved', { ...response.data, folderId: folderId })
                        this.loadPage(response.data.id)
                    }, 200)
                })
                .catch((error) => {
                    ;(this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: error.message }), (this.loading = false))
                })
        },
        closeDocument() {
            this.$emit('closeDetails')
        },
        onTabChange(tabName: string) {
            if (tabName === 'subreports') this.getAllSubreports()
        },
        openDesignerDialog() {
            if (this.selectedDocument.engine === 'knowagedossierengine') {
                this.dossierDesignerDialogVisible = true
                this.refreshDrivers = false
                this.refreshHistory = false
                this.designerDialogVisible = false
            } else {
                this.designerDialogVisible = true
                this.dossierDesignerDialogVisible = false
            }
        },
        onDesignerStart(document: any) {
            this.router.push(`/olap-designer/${document.sbiExecutionId}?olapId=${document.id}&olapName=${document.name}&olapLabel=${document.label}&noTemplate=${true}&reference=${document.reference}&engine=${document.engine}&artifactId=${document.artifactId}`)
        },
        closeDossierDesignerDialog(refreshObj) {
            this.dossierDesignerDialogVisible = false

            if (refreshObj.refreshDrivers) this.refreshDrivers = true

            if (refreshObj.refreshHistory) this.refreshHistory = true
        }
    }
})
</script>

<style lang="scss">
.right-border {
    border-right: 1px solid #ccc;
}

.details-warning-color {
    color: red;
}
</style>
