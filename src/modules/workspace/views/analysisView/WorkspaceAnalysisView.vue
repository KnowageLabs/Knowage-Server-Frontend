<template>
    <Toolbar class="kn-toolbar kn-toolbar--secondary">
        <template #start>
            <Button id="showSidenavIcon" icon="fas fa-bars" class="p-button-text p-button-rounded p-button-plain" @click="$emit('showMenu')" />
            {{ $t('workspace.menuLabels.myAnalysis') }}
        </template>
        <template #end>
            <Button v-if="toggleCardDisplay" icon="fas fa-list" class="p-button-text p-button-rounded p-button-plain" @click="$emit('toggleDisplayView')" />
            <!-- <Button v-if="!toggleCardDisplay" icon="fas fa-th-large" class="p-button-text p-button-rounded p-button-plain" @click="$emit('toggleDisplayView')" /> -->

            <q-btn v-if="addButtonIsVisible" round class="customFabButton" icon="fas fa-plus">
                <q-menu data-test="menu">
                    <q-list dense style="min-width: 200px">
                        <q-item v-for="item in creationMenuButtons" :key="item" v-close-popup clickable @click="item.command">
                            <q-item-section>
                                <div>
                                    {{ item.label }}
                                    <q-badge v-if="item.beta" rounded color="red" text-color="white" label="Beta" />
                                </div>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
        </template>
    </Toolbar>
    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

    <InputText v-model="searchWord" class="kn-material-input p-m-2" :style="mainDescriptor.style.filterInput" type="text" :placeholder="$t('common.search')" data-test="search-input" @input="searchItems" />

    <div class="p-m-2 kn-overflow">
        <DataTable v-if="!toggleCardDisplay" class="p-datatable-sm kn-table p-mx-2" :value="filteredAnalysisDocuments" :loading="loading" data-key="id" responsive-layout="stack" breakpoint="600px" data-test="analysis-table">
            <template #empty>
                {{ $t('common.info.noDataFound') }}
            </template>
            <template #filter="{ filterModel }">
                <InputText v-model="filterModel.value" type="text" class="p-column-filter"></InputText>
            </template>
            <Column field="typeCode" :header="$t('common.type').replace(/^./, $t('common.type')[0].toUpperCase())" :sortable="true" />
            <Column field="name" :header="$t('importExport.gallery.column.name')" :sortable="true" />
            <Column field="creationUser" :header="$t('kpi.targetDefinition.kpiAuthor')" :sortable="true" />
            <Column field="creationDate" :header="$t('kpi.targetDefinition.kpiDate')" :sortable="true">
                <template #body="{ data }">
                    {{ formatDate(data.creationDate) }}
                </template>
            </Column>
            <Column :style="mainDescriptor.style.iconColumn">
                <template #body="slotProps">
                    <Button icon="fas fa-ellipsis-v" class="p-button-link" @click="showMenu($event, slotProps.data)" />
                    <Button v-tooltip.left="$t('workspace.myModels.showInfo')" icon="fas fa-info-circle" class="p-button-link" :data-test="'info-button-' + slotProps.data.name" @click="showSidebar(slotProps.data)" />
                    <Button icon="fas fa-play-circle" class="p-button-link" @click="executeAnalysisDocument(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
        <div v-if="toggleCardDisplay" class="p-grid p-m-2" data-test="card-container">
            <Message v-if="filteredAnalysisDocuments.length === 0" class="kn-flex p-m-2" severity="info" :closable="false" :style="mainDescriptor.style.message">
                {{ $t('common.info.noDataFound') }}
            </Message>
            <template v-else>
                <WorkspaceCard
                    v-for="(document, index) of filteredAnalysisDocuments"
                    :key="index"
                    :view-type="'analysis'"
                    :document="document"
                    @executeAnalysisDocument="executeAnalysisDocument"
                    @editAnalysisDocument="openKpiDesigner"
                    @shareAnalysisDocument="shareAnalysisDocument"
                    @cloneAnalysisDocument="cloneAnalysisDocument"
                    @deleteAnalysisDocument="deleteAnalysisDocumentConfirm"
                    @uploadAnalysisPreviewFile="uploadAnalysisPreviewFile"
                    @openSidebar="showSidebar"
                />
            </template>
        </div>
    </div>
    <DetailSidebar
        :visible="showDetailSidebar"
        :view-type="'analysis'"
        :document="selectedAnalysis"
        data-test="detail-sidebar"
        @executeAnalysisDocument="executeAnalysisDocument"
        @editAnalysisDocument="editAnalysisDocument"
        @shareAnalysisDocument="shareAnalysisDocument"
        @cloneAnalysisDocument="cloneAnalysisDocumentConfirm"
        @deleteAnalysisDocument="deleteAnalysisDocumentConfirm"
        @uploadAnalysisPreviewFile="uploadAnalysisPreviewFile"
        @close="showDetailSidebar = false"
    />
    <Menu id="optionsMenu" ref="optionsMenu" :model="menuButtons" data-test="menu" />
    <Menu id="creationMenu" ref="creationMenu" :model="creationMenuButtons" data-test="creation-menu" />

    <WorkspaceAnalysisViewShareDialog :visible="shareDialogVisible" :prop-folders="folders" @close="shareDialogVisible = false" @share="handleAnalysShared($event, false)"></WorkspaceAnalysisViewShareDialog>
    <WorkspaceAnalysisViewEditDialog :visible="editDialogVisible" :prop-analysis="selectedAnalysis" @close="editDialogVisible = false" @save="handleEditAnalysis"></WorkspaceAnalysisViewEditDialog>
    <WorkspaceWarningDialog :visible="warningDialogVisbile" :title="$t('workspace.menuLabels.myAnalysis')" :warning-message="warningMessage" @close="closeWarningDialog"></WorkspaceWarningDialog>

    <KnInputFile v-if="!uploading" :change-function="uploadAnalysisFile" accept="image/*" :trigger-input="triggerUpload" />
    <WorkspaceCockpitDialog :visible="cockpitDialogVisible" @close="closeCockpitDialog"></WorkspaceCockpitDialog>
    <DocumentDetailDossierDesignerDialog v-if="user.enterprise && dossierDesignerDialogVisible" :visible="dossierDesignerDialogVisible" :selected-document="selectedDocument" :is-from-workspace="true" @close="closeDossierDialog($event)"></DocumentDetailDossierDesignerDialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import mainDescriptor from '@/modules/workspace/WorkspaceDescriptor.json'
import DetailSidebar from '@/modules/workspace/genericComponents/DetailSidebar.vue'
import WorkspaceCard from '@/modules/workspace/genericComponents/WorkspaceCard.vue'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/contextmenu'
import Message from 'primevue/message'
import Column from 'primevue/column'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import WorkspaceAnalysisViewEditDialog from './dialogs/WorkspaceAnalysisViewEditDialog.vue'
import WorkspaceWarningDialog from '../../genericComponents/WorkspaceWarningDialog.vue'
import WorkspaceAnalysisViewShareDialog from './dialogs/WorkspaceAnalysisViewShareDialog.vue'
import { AxiosResponse } from 'axios'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import WorkspaceCockpitDialog from './dialogs/WorkspaceCockpitDialog.vue'
import mainStore from '../../../../App.store'
import { mapActions, mapState } from 'pinia'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import DocumentDetailDossierDesignerDialog from '@/modules/documentExecution/documentDetails/dialogs/dossierDesignerDialog/DocumentDetailDossierDesignerDialog.vue'
import appStore from '@/App.store'
import { iFolder } from '@/modules/documentBrowser/DocumentBrowser'

export default defineComponent({
    name: 'workspace-analysis-view',
    components: { DataTable, Column, DetailSidebar, WorkspaceCard, KnFabButton, Menu, Message, KnInputFile, WorkspaceAnalysisViewEditDialog, WorkspaceWarningDialog, WorkspaceAnalysisViewShareDialog, WorkspaceCockpitDialog, DocumentDetailDossierDesignerDialog },
    props: { toggleCardDisplay: { type: Boolean } },
    emits: ['showMenu', 'toggleDisplayView', 'execute'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            mainDescriptor,
            loading: false,
            showDetailSidebar: false,
            analysisDocuments: [] as any,
            filteredAnalysisDocuments: [] as any[],
            selectedAnalysis: {} as any,
            menuButtons: [] as any,
            folders: [] as any[],
            searchWord: '' as string,
            editDialogVisible: false,
            warningDialogVisbile: false,
            warningMessage: '',
            triggerUpload: false,
            uploading: false,
            shareDialogVisible: false,
            creationMenuButtons: [] as any,
            cockpitDialogVisible: false,
            dossierDesignerDialogVisible: false,
            selectedDocument: null,
            documentBrowserFolders: [] as iFolder[]
        }
    },
    computed: {
        isOwner(): any {
            return (this.store.$state as any).user.userId === this.selectedAnalysis.creationUser
        },
        isShared(): any {
            return this.selectedAnalysis.functionalities.length > 1
        },
        ...mapState(mainStore, {
            user: 'user',
            isEnterprise: 'isEnterprise'
        }),
        addButtonIsVisible(): boolean {
            return this.user.functionalities.includes(UserFunctionalitiesConstants.CREATE_SELF_SELVICE_COCKPIT) || this.user.functionalities.includes(UserFunctionalitiesConstants.CREATE_SELF_SELVICE_GEOREPORT) || this.user.functionalities.includes(UserFunctionalitiesConstants.CREATE_SELF_SELVICE_KPI)
        }
    },

    created() {
        this.getAnalysisDocs()
        this.createCreationMenuButtons()
    },

    methods: {
        ...mapActions(appStore, ['setLoading', 'getUser']),
        getAnalysisDocs() {
            this.loading = true
            return this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/documents/myAnalysisDocsList`)
                .then((response: AxiosResponse<any>) => {
                    this.analysisDocuments = [...response.data.root]
                    this.filteredAnalysisDocuments = [...this.analysisDocuments]
                })
                .finally(() => (this.loading = false))
        },
        formatDate(date) {
            return formatDateWithLocale(date, { dateStyle: 'short', timeStyle: 'short' })
        },
        showSidebar(clickedDocument) {
            this.selectedAnalysis = clickedDocument
            this.showDetailSidebar = true
        },
        showMenu(event, clickedDocument) {
            this.selectedAnalysis = clickedDocument
            this.createMenuItems()
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.optionsMenu.toggle(event)
        },
        // prettier-ignore
        createMenuItems() {
            this.menuButtons = []
            this.menuButtons.push({ key: '0', label: this.$t('workspace.myAnalysis.menuItems.edit'), icon: 'fas fa-edit', command: () => { this.editAnalysisDocument(this.selectedAnalysis) }, visible: this.isOwner })
            this.menuButtons.push({ key: '1', label: this.$t('workspace.myAnalysis.menuItems.editTemplate'), icon: 'fa-solid fa-wand-magic-sparkles', command: () => { this.editTemplateDocument(this.selectedAnalysis) }, visible: this.isOwner && this.selectedAnalysis.typeCode === 'DOSSIER'})
            this.menuButtons.push({ key: '2', label: this.$t('workspace.myAnalysis.menuItems.share'), icon: 'fas fa-share-alt', command: () => { this.shareAnalysisDocument(this.selectedAnalysis) }, visible: !this.isShared })
            this.menuButtons.push({ key: '2', label: this.$t('workspace.myAnalysis.menuItems.unshare'), icon: 'fas fa-times-circle', command: () => { this.shareAnalysisDocument(this.selectedAnalysis) }, visible: this.isShared })
            this.menuButtons.push({ key: '3', label: this.$t('workspace.myAnalysis.menuItems.clone'), icon: 'fas fa-clone', command: () => { this.cloneAnalysisDocument(this.selectedAnalysis) } , visible: this.selectedAnalysis.typeCode != 'DOSSIER'})

            this.menuButtons.push({ key: '4', label: this.$t('workspace.myAnalysis.menuItems.upload'), icon: 'fas fa-upload', command: () => { this.uploadAnalysisPreviewFile(this.selectedAnalysis) } })
            this.menuButtons.push({ key: '5', label: this.$t('workspace.myAnalysis.menuItems.delete'), icon: 'fas fa-trash', command: () => { this.deleteAnalysisDocumentConfirm(this.selectedAnalysis) } })

        },
        executeAnalysisDocument(document: any) {
            this.$emit('execute', document)
        },
        openKpiDesigner(analysis: any) {
            this.$router.push(`/kpi-edit/${analysis?.id}?from=Workspace`)
        },
        editAnalysisDocument(analysis: any) {
            this.selectedAnalysis = analysis
            this.editDialogVisible = true
        },
        async handleEditAnalysis(analysis: any) {
            const formatedAnalysis = {
                document: {
                    name: analysis.label,
                    label: analysis.name,
                    description: analysis.description,
                    id: analysis.id
                },
                updateFromWorkspace: true
            }
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/saveDocument/', formatedAnalysis, { headers: { 'X-Disable-Errors': 'true' } })
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.toast.updateTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.editDialogVisible = false
                    this.showDetailSidebar = false
                    this.getAnalysisDocs()
                })
                .catch((response: any) => {
                    this.warningMessage = response
                    this.warningDialogVisbile = true
                })
        },
        async shareAnalysisDocument(analysis: any) {
            this.selectedAnalysis = analysis
            this.loading = true
            const shared = this.selectedAnalysis.functionalities.length > 1
            if (!shared) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/functionalities/forsharing/${analysis.id}`).then((response: AxiosResponse<any>) => {
                    this.folders = response.data
                    this.shareDialogVisible = true
                })
            } else {
                await this.handleAnalysShared(null, shared)
            }
            this.loading = false
        },
        async handleAnalysShared(selectedFolders: any, shared: boolean) {
            this.loading = true

            let url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/documents/share?docId=${this.selectedAnalysis.id}&`
            if (!shared) {
                Object.keys(selectedFolders).forEach((id: any) => (url += `functs=${selectedFolders[id]}&`))
            }
            url += `isShare=${!shared}`

            await this.$http
                .post(url)
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.toast.updateTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.shareDialogVisible = false
                    this.showDetailSidebar = false
                    this.getAnalysisDocs()
                })
                .catch(() => {})

            this.loading = false
        },
        async cloneAnalysisDocumentConfirm(analysis: any) {
            this.$confirm.require({
                header: this.$t('common.toast.cloneConfirmTitle'),
                accept: async () => await this.cloneAnalysisDocument(analysis)
            })
        },
        async cloneAnalysisDocument(analysis: any) {
            this.loading = true
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/documents/clone?docId=${analysis.id}`)
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.toast.createTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.showDetailSidebar = false
                    this.getAnalysisDocs()
                })
                .catch(() => {})
            this.loading = true
        },
        deleteAnalysisDocumentConfirm(analysis: any) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteAnalysis(analysis)
            })
        },
        deleteAnalysis(analysis: any) {
            this.loading = true
            this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/documents/${analysis.label}`)
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.showDetailSidebar = false
                    this.getAnalysisDocs()
                })
                .catch(() => {})
            this.loading = false
        },
        uploadAnalysisPreviewFile(analysis: any) {
            this.selectedAnalysis = analysis
            this.triggerUpload = false
            setTimeout(() => (this.triggerUpload = true), 200)
        },
        uploadAnalysisFile(event: any) {
            this.uploading = true
            const uploadedFile = event.target.files[0]

            this.startUpload(uploadedFile)

            this.triggerUpload = false
            setTimeout(() => (this.uploading = false), 200)
        },
        startUpload(uploadedFile: any) {
            const formData = new FormData()
            formData.append('file', uploadedFile)
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analysis/${this.selectedAnalysis.id}`, formData)
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.uploading'),
                        msg: this.$t('common.toast.uploadSuccess')
                    })
                    this.showDetailSidebar = false
                    this.getAnalysisDocs()
                })
                .catch()
                .finally(() => {
                    this.triggerUpload = false
                })
        },
        closeWarningDialog() {
            this.warningMessage = ''
            this.warningDialogVisbile = false
        },
        searchItems() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.filteredAnalysisDocuments = [...this.analysisDocuments] as any[]
                } else {
                    this.filteredAnalysisDocuments = this.analysisDocuments.filter((el: any) => {
                        return el.name?.toLowerCase().includes(this.searchWord.toLowerCase()) || el.creationUser?.toLowerCase().includes(this.searchWord.toLowerCase())
                    })
                }
            }, 250)
        },
        createCreationMenuButtons() {
            this.creationMenuButtons = []

            if (this.user.functionalities.includes(UserFunctionalitiesConstants.CREATE_SELF_SELVICE_COCKPIT)) this.creationMenuButtons.push({ key: '0', label: this.$t('common.cockpit'), command: () => this.openCockpitDialog(), visible: true })
            if (this.user.functionalities.includes(UserFunctionalitiesConstants.CREATE_SELF_SELVICE_GEOREPORT)) this.creationMenuButtons.push({ key: '1', label: this.$t('workspace.myAnalysis.geoRef'), command: () => this.openGeoRefCreation(), visible: true })
            if (this.user.functionalities.includes(UserFunctionalitiesConstants.CREATE_SELF_SELVICE_KPI)) this.creationMenuButtons.push({ key: '2', label: this.$t('common.kpi'), command: () => this.openKpiDocumentDesigner(), visible: true })
            if (this.isEnterprise && this.user.functionalities.includes(UserFunctionalitiesConstants.DOSSIER_CREATION)) this.creationMenuButtons.push({ key: '3', label: this.$t('common.dossier'), command: () => this.openDossierDesigner(), visible: true })
            if (this.user.functionalities.includes(UserFunctionalitiesConstants.CREATE_COCKPIT_FUNCTIONALITY)) this.creationMenuButtons.push({ key: '4', label: this.$t('dashboard.dashboard'), command: () => this.createNewDashboard(), visible: true, beta: true })
        },
        openCockpitDialog() {
            this.cockpitDialogVisible = true
        },
        closeCockpitDialog() {
            this.cockpitDialogVisible = false
            this.getAnalysisDocs()
        },
        openKpiDocumentDesigner() {
            this.$router.push('/kpi-edit/new-kpi?from=Workspace')
        },
        openGeoRefCreation() {
            this.$router.push('/gis/new')
        },
        editTemplateDocument(analysis: any) {
            this.openDossierDesigner()
            this.selectedDocument = analysis
        },
        openDossierDesigner() {
            this.selectedDocument = null
            this.cockpitDialogVisible = false
            this.dossierDesignerDialogVisible = true
        },
        closeDossierDialog(refreshObj) {
            this.dossierDesignerDialogVisible = false

            if (refreshObj.refreshHistory) this.getAnalysisDocs()
        },
        async createNewDashboard() {
            if (this.documentBrowserFolders.length === 0) await this.loadDocumentBrowserFolders()
            const personalFolders = this.documentBrowserFolders.filter((folder: iFolder) => folder.codType === 'USER_FUNCT')
            const user = this.getUser()
            const userFolder = personalFolders.find((folder: iFolder) => folder.name === user?.userId)

            const link = `/dashboard/new-dashboard?folderId=${userFolder?.id ?? ''}&fromWorkspace=true`
            this.$router.push(link)
        },
        async loadDocumentBrowserFolders() {
            this.setLoading(true)
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/folders?includeDocs=false`)
                .then((response: AxiosResponse<any>) => {
                    this.documentBrowserFolders = response.data
                })
                .catch(() => {})

            this.setLoading(false)
        }
    }
})
</script>

<style lang="scss" scoped>
.customFabButton {
    top: 5px;
}
</style>
