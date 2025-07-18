<template>
    <DataPreparationMonitoringDialog v-model:visibility="showMonitoring" :dataset="selectedDataset" @close="showMonitoring = false" @save="updateDatasetAndSave"></DataPreparationMonitoringDialog>
    <Toolbar class="kn-toolbar kn-toolbar--secondary">
        <template #start>
            {{ $t('workspace.advancedData.title') }}
        </template>
        <template #end>
            <Button v-if="toggleCardDisplay" icon="fas fa-list" class="p-button-text p-button-rounded p-button-plain" @click="toggleDisplayView" />
            <!-- <Button v-if="!toggleCardDisplay" icon="fas fa-th-large" class="p-button-text p-button-rounded p-button-plain" @click="toggleDisplayView" /> -->
            <KnFabButton icon="fas fa-plus" data-test="new-folder-button" @click="showDataSetCatalog" />
        </template>
    </Toolbar>
    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar p-ml-2" data-test="progress-bar" />
    <KnDatasetList :visibility="showDatasetList" :items="availableDatasets" @selected="newDataPrep" @save="handleSave(selectedDsForDataPrep)" @cancel="hideDataSetCatalog" />

    <div class="p-d-flex p-flex-row p-ai-center">
        <InputText v-model="searchWord" class="kn-material-input p-m-2" :style="mainDescriptor.style.filterInput" type="text" :placeholder="$t('common.search')" data-test="search-input" @input="searchItems" />
    </div>

    <div class="kn-overflow">
        <DataTable v-if="!toggleCardDisplay" class="p-datatable-sm kn-table p-mx-2" :value="preparedDatasets" :loading="loading" data-key="objId" responsive-layout="stack" breakpoint="600px" data-test="datasets-table">
            <template #empty>
                {{ $t('common.info.noDataFound') }}
            </template>
            <Column field="label" :header="$t('importExport.catalogFunction.column.label')" class="kn-truncated" :sortable="true" />
            <Column field="name" :header="$t('importExport.gallery.column.name')" class="kn-truncated" :sortable="true" />
            <Column field="tags" :header="$t('importExport.gallery.column.tags')" :sortable="true">
                <template #body="slotProps">
                    <span v-if="slotProps.data.tags.length > 0">
                        <Chip v-for="(tag, index) of slotProps.data.tags" :key="index"> {{ tag.name }} </Chip>
                    </span>
                </template>
            </Column>

            <Column :style="mainDescriptor.style.iconColumn">
                <template #header> &ensp; </template>
                <template #body="slotProps">
                    <Button icon="fas fa-ellipsis-v" class="p-button-link" @click.stop="showMenu($event, slotProps.data)" />
                    <Button v-tooltip.left="$t('workspace.myModels.showInfo')" icon="fas fa-info-circle" class="p-button-link" :data-test="'info-button-' + slotProps.data.name" @click.stop="showSidebar(slotProps.data)" />
                    <Button icon="fas fa-eye" class="p-button-link" @click.stop="previewDataset(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
        <div v-if="toggleCardDisplay" class="p-grid p-m-2" data-test="card-container">
            <Message v-if="preparedDatasets.length === 0" class="kn-flex p-m-2" severity="info" :closable="false" :style="mainDescriptor.style.message">
                {{ $t('common.info.noDataFound') }}
            </Message>
            <template v-else>
                <WorkspaceCard
                    v-for="(dataset, index) of preparedDatasets"
                    :key="index"
                    :view-type="'dataset'"
                    :document="dataset"
                    @previewDataset="previewDataset"
                    @editDataset="editDataset"
                    @exportToXlsx="exportDataset($event, 'xls')"
                    @exportToCsv="exportDataset($event, 'csv')"
                    @shareDataset="shareDataset"
                    @cloneDataset="cloneDataset"
                    @deleteDataset="deleteDatasetConfirm"
                    @openDataPreparation="openDataPreparation"
                    @openSidebar="showSidebar"
                    @monitoring="showMonitoring = !showMonitoring"
                />
            </template>
        </div>
    </div>

    <DetailSidebar
        :visible="showDetailSidebar"
        :view-type="'dataset'"
        :document="selectedDataset"
        data-test="detail-sidebar"
        @previewDataset="previewDataset"
        @editDataset="editDataset"
        @exportToXlsx="exportDataset($event, 'xls')"
        @exportToCsv="exportDataset($event, 'csv')"
        @shareDataset="shareDataset"
        @cloneDataset="cloneDataset"
        @deleteDataset="deleteDatasetConfirm"
        @openDataPreparation="openDataPreparation"
        @close="showDetailSidebar = false"
        @monitoring="showMonitoring = !showMonitoring"
    />

    <EditPreparedDatasetDialog :dataset="selectedDataset" :visible="showEditPreparedDatasetDialog" @save="updatePreparedDataset" @cancel="showEditPreparedDatasetDialog = false" />
    <Menu id="optionsMenu" ref="optionsMenu" :model="menuButtons" data-test="menu" />
    <Menu id="creationMenu" ref="creationMenu" :model="creationMenuButtons" data-test="creation-menu" />

    <WorkspaceDataCloneDialog :visible="cloneDialogVisible" :prop-dataset="selectedDataset" @close="cloneDialogVisible = false" @clone="handleDatasetClone"> </WorkspaceDataCloneDialog>
    <WorkspaceDataPreviewDialog v-if="previewDialogVisible && correctRolesForExecution != null" :visible="previewDialogVisible && correctRolesForExecution != null" :prop-dataset="selectedDataset" :correct-roles-for-execution="correctRolesForExecution" @close="previewDialogVisible = false"> </WorkspaceDataPreviewDialog>
    <WorkspaceWarningDialog :visible="warningDialogVisbile" :title="$t('workspace.advancedData.title')" :warning-message="warningMessage" @close="closeWarningDialog"></WorkspaceWarningDialog>

    <DataPreparationAvroHandlingDialog :visible="dataPrepAvroHandlingDialogVisbile" :title="$t('workspace.myData.isPreparing')" :info-message="dataPrepAvroHandlingMessage" :events="events" @close="proceedToDataPrep"></DataPreparationAvroHandlingDialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { filterDefault } from '@/helpers/commons/filterHelper'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import EditPreparedDatasetDialog from '@/modules/workspace/views/dataView/dialogs/EditPreparedDatasetDialog.vue'
import mainDescriptor from '@/modules/workspace/WorkspaceDescriptor.json'
import DetailSidebar from '@/modules/workspace/genericComponents/DetailSidebar.vue'
import WorkspaceCard from '@/modules/workspace/genericComponents/WorkspaceCard.vue'
import DataTable from 'primevue/datatable'
import KnDatasetList from '@/components/functionalities/KnDatasetList/KnDatasetList.vue'
import Column from 'primevue/column'
import Chip from 'primevue/chip'
import Menu from 'primevue/contextmenu'
import { IDataset } from '@/modules/workspace/Workspace'
import Message from 'primevue/message'
import WorkspaceDataCloneDialog from '@/modules/workspace/views/dataView/dialogs/WorkspaceDataCloneDialog.vue'
import WorkspaceDataPreviewDialog from '@/modules/workspace/views/dataView/dialogs/WorkspaceDataPreviewDialog.vue'
import WorkspaceWarningDialog from '@/modules/workspace/genericComponents/WorkspaceWarningDialog.vue'
import DataPreparationAvroHandlingDialog from '@/modules/workspace/dataPreparation/DataPreparationAvroHandlingDialog.vue'
import { AxiosResponse } from 'axios'
import DataPreparationMonitoringDialog from '@/modules/workspace/dataPreparation/DataPreparationMonitoring/DataPreparationMonitoringDialog.vue'
import { mapState, mapActions } from 'pinia'
import mainStore from '../../../../App.store'
import workspaceStore from '@/modules/workspace/Workspace.store.js'
import { Client } from '@stomp/stompjs'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { getCorrectRolesForExecution } from '@/helpers/commons/roleHelper'

export default defineComponent({
    components: { DataTable, KnDatasetList, Column, Chip, DataPreparationMonitoringDialog, EditPreparedDatasetDialog, DetailSidebar, WorkspaceCard, KnFabButton, WorkspaceDataCloneDialog, WorkspaceWarningDialog, WorkspaceDataPreviewDialog, Message, Menu, DataPreparationAvroHandlingDialog },
    props: { toggleCardDisplay: { type: Boolean } },
    emits: ['toggleDisplayView'],

    data() {
        return {
            mainDescriptor,
            loading: false,
            showDetailSidebar: false,
            showDatasetList: false as boolean,
            showEditPreparedDatasetDialog: false,
            datasetList: [] as Array<IDataset>,
            preparedDatasets: [] as any,
            availableDatasets: [] as any,
            selectedDataset: {} as any,
            selectedDsForDataPrep: {} as any,
            menuButtons: [] as any,
            creationMenuButtons: [] as any,
            filters: {
                global: [filterDefault]
            } as Object,
            cloneDialogVisible: false,
            shareDialogVisible: false,
            previewDialogVisible: false,
            warningDialogVisbile: false,
            warningMessage: '',
            searchWord: '' as string,
            showMonitoring: false,
            client: {} as any,
            dataPrepAvroHandlingDialogVisbile: false,
            dataPrepAvroHandlingMessage: '',
            existingPreparedDatasetId: null,
            events: [] as any,
            correctRolesForExecution: null as string[] | null
        }
    },
    computed: {
        ...mapState(mainStore, ['user']),
        ...mapState(workspaceStore, ['dataPreparation', 'isAvroReady']),
        isDatasetOwner(): any {
            return this.user.userId === this.selectedDataset.owner
        },
        canLoadData(): any {
            if (this.selectedDataset.actions) {
                for (let i = 0; i < this.selectedDataset.actions.length; i++) {
                    const action = this.selectedDataset.actions[i]
                    if (action.name == 'loaddata') {
                        return true
                    }
                }
            }
            return false
        }
    },
    async created() {
        if (this.user?.functionalities.includes(UserFunctionalitiesConstants.DATA_PREPARATION)) {
            this.events = []
            const url = new URL(window.location.origin)
            url.protocol = url.protocol.replace('http', 'ws')
            const uri = url.origin + import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + '/ws?' + import.meta.env.VITE_DEFAULT_AUTH_HEADER + '=' + localStorage.getItem('token')
            this.client = new Client({
                brokerURL: uri,
                connectHeaders: {},
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000
            })
            this.client.onConnect = (frame) => {
                // Do something, all subscribes must be done is this callback
                // This is needed because this will be executed after a (re)connect
                console.log(frame)
                this.client.subscribe('/user/queue/prepare', (message) => {
                    // called when the client receives a STOMP message from the server
                    if (message.body) {
                        const avroJobResponse = JSON.parse(message.body)
                        if (avroJobResponse.statusOk) {
                            this.addToLoadedAvros(avroJobResponse.dsId)
                            this.addToAvroDatasets(avroJobResponse.dsId)

                            if (this.dataPrepAvroHandlingDialogVisbile) {
                                this.pushEvent(4)
                            } else {
                                this.setInfo({ title: this.$t('managers.workspaceManagement.dataPreparation.dataPreparationIsCompleted') })
                                setTimeout(() => {
                                    this.openDataPreparation({ id: avroJobResponse.dsId })
                                }, 1500)
                            }
                        } else {
                            if (this.dataPrepAvroHandlingDialogVisbile) {
                                this.pushEvent(5)
                            } else {
                                this.setError({ title: 'Cannot prepare dataset', msg: avroJobResponse.errorMessage })
                            }
                            this.removeFromLoadingAvros(avroJobResponse.dsId)
                        }
                    } else {
                        this.setError({ title: 'Websocket error', msg: 'got empty message' })
                    }
                })
            }
            this.client.onStompError = function (frame) {
                // Will be invoked in case of error encountered at Broker
                // Bad login/passcode typically will cause an error
                // Complaint brokers will set `message` header with a brief message. Body may contain details.
                // Compliant brokers will terminate the connection after any error
                console.log('Broker reported error: ' + frame.headers['message'])
                console.log('Additional details: ' + frame.body)
            }
            this.client.activate()
        }

        await this.getAllAvroDataSets()
        await this.getDatasets()
    },
    unmounted() {
        if (this.user?.functionalities.includes(UserFunctionalitiesConstants.DATA_PREPARATION) && this.client && Object.keys(this.client).length > 0) {
            this.client.deactivate()
            this.client = {}
            this.events = []
        }
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError']),
        ...mapActions(workspaceStore, ['addToLoadedAvros', 'addToLoadingAvros', 'addToAvroDatasets', 'removeFromLoadingAvros', 'removeFromLoadedAvros', 'setAvroDatasets', 'setLoadedAvros', 'setLoadingAvros']),
        async updatePreparedDataset(newDataset) {
            this.showEditPreparedDatasetDialog = false
            this.selectedDataset.name = newDataset.name
            this.selectedDataset.description = newDataset.description
            this.selectedDataset.type = 'PreparedDataset'
            await this.$http({
                method: 'POST',
                url: import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/selfservicedataset/update',
                data: this.selectedDataset,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Disable-Errors': 'true' },
                transformRequest: function (obj) {
                    const str = [] as any
                    for (const p in obj) str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
                    return str.join('&')
                }
            })
                .then(() => {
                    this.setInfo({ title: 'Updated successfully' })
                })
                .catch(() => {
                    this.setError({ title: 'Save error', msg: 'Cannot update Prepared Dataset' })
                })
            await this.getDatasets()
        },
        async loadDataset(datasetId: number) {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/dataset/id/${datasetId}`)
                .then((response: AxiosResponse<any>) => {
                    this.selectedDataset = response.data[0]
                })
                .catch(() => {})
            this.loading = false
        },
        toggleDisplayView() {
            this.$emit('toggleDisplayView')
        },
        newDataPrep(dataset) {
            this.selectedDsForDataPrep = dataset
        },
        showSidebar(clickedDataset) {
            this.selectedDataset = clickedDataset
            this.showDetailSidebar = true
        },
        hideDataSetCatalog() {
            this.showDatasetList = false
            this.selectedDsForDataPrep = {}
        },
        showDataSetCatalog() {
            this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/datasets/for-dataprep`).then(
                (response: AxiosResponse<any>) => {
                    this.availableDatasets = [...response.data.root]
                    this.showDatasetList = true
                },
                () => {
                    this.setError({ title: 'Error', msg: 'Cannot load dataset list' })
                }
            )
        },
        showMenu(event, clickedDocument) {
            this.selectedDataset = clickedDocument
            this.createMenuItems(clickedDocument)
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.optionsMenu.toggle(event)
        },
        // prettier-ignore
        createMenuItems(clickedDocument: any) {
            let tmp = [] as any

            if (this.user?.functionalities.includes(UserFunctionalitiesConstants.DATA_PREPARATION)) {
                tmp.push(
                    { key: 1, label: this.$t('workspace.myData.openDataPreparation'), icon: 'fas fa-cogs', command: () => this.openDataPreparation(clickedDocument), visible: true },
                    { key: 2, label: this.$t('workspace.myData.monitoring'), icon: 'pi pi-chart-line', command: () => this.handleMonitoring(clickedDocument), visible: true }
                )
            }
            tmp.push(
                {
                    key: 3,
                    label: this.$t('common.export'),
                    icon: 'fa-solid fa-file-export',
                    visible: this.canLoadData && this.selectedDataset.dsTypeCd && this.selectedDataset.dsTypeCd != 'File',
                    items: [
                        { key: '10', label: this.$t('workspace.myData.xlsxExport'), icon: 'fas fa-file-excel', command: () => this.exportDataset(clickedDocument, 'xls') },
                        { key: '11', label: this.$t('workspace.myData.csvExport'), icon: 'fas fa-file-csv', command: () => this.exportDataset(clickedDocument, 'csv') },
                    ]
                })
            tmp.push({ key: 100, label: this.$t('workspace.myData.deleteDataset'), icon: 'fas fa-trash', command: () => this.deleteDatasetConfirm(clickedDocument), visible: this.isDatasetOwner })

            tmp = tmp.sort((a, b) => a.key < b.key)
            tmp.forEach(element => {
                if (element.items) {
                    element.items = element.items.sort((a, b) => a.key < b.key)
                }
            })
            this.menuButtons = tmp
        },
        createCreationMenuButtons() {
            this.creationMenuButtons = []
            this.creationMenuButtons.push({ key: '0', label: this.$t('workspace.myData.prepareData'), visible: true })
        },
        async previewDataset(dataset: any) {
            await this.loadDataset(dataset.id)
            await getCorrectRolesForExecution(null, dataset).then(async (response) => {
                this.correctRolesForExecution = response as string[]
                if (this.selectedDataset) this.selectedDataset.drivers = dataset.drivers
                this.previewDialogVisible = true
            })
        },
        editDataset() {
            this.showEditPreparedDatasetDialog = true
        },
        handleMonitoring(dataset: any) {
            console.log(dataset)
            this.showMonitoring = !this.showMonitoring
        },
        handleSave(dataset: any) {
            this.hideDataSetCatalog()
            this.openDataPreparation(dataset)
        },
        getDatasetInfo(dataset) {
            if (!dataset) return ''
            const tempDs = {
                label: dataset.label,
                name: dataset.name,
                description: dataset.description,
                id: dataset.id
            }
            return JSON.stringify(tempDs)
        },
        async openDataPreparation(dataset: any) {
            this.events = []
            this.pushEvent(0)
            if (dataset.dsTypeCd == 'Prepared') {
                //edit existing data prep
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/datasets/advanced/${dataset.id}`).then(
                    (response: AxiosResponse<any>) => {
                        const instanceId = response.data.configuration.dataPrepInstanceId
                        this.$http.get(import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + `/api/1.0/process/by-instance-id/${instanceId}`).then((response: AxiosResponse<any>) => {
                            const datasetId = response.data.instance.dataSetId
                            if (!this.isAvroReady(datasetId)) {
                                // check if Avro file has been deleted or not
                                /*                                 this.$router.push({ name: 'data-preparation', params: { id: datasetId, transformations: JSON.stringify(transformations), processId: processId, instanceId: instanceId, dataset: JSON.stringify(dataset) } }) */

                                this.dataPrepAvroHandlingDialogVisbile = true
                                this.dataPrepAvroHandlingMessage = this.$t('managers.workspaceManagement.dataPreparation.info.dataPrepIsLoadingAndWillBeOpened')

                                this.generateAvro(datasetId)
                                this.existingPreparedDatasetId = datasetId
                            } else {
                                  this.$router.push({ name: 'data-preparation', params: { id: datasetId, instanceId: instanceId, dataset: this.getDatasetInfo(dataset) } })
                                }
                        })
                    },
                    () => {
                        this.setError({
                            title: 'Cannot open data preparation'
                        })
                    }
                )
            } else if (this.isAvroReady(dataset.id)) {
                // original dataset already exported in Avro
                this.$router.push({ name: 'data-preparation', params: { id: dataset.id } })
            } else {
                this.dataPrepAvroHandlingDialogVisbile = true
                this.dataPrepAvroHandlingMessage = this.$t('managers.workspaceManagement.dataPreparation.info.dataPrepIsLoadingAndWillBeOpened')

                await this.generateAvro(dataset.id)
                this.existingPreparedDatasetId = dataset.id
            }
        },
        async generateAvro(dsId: number) {
            this.pushEvent(1)
            // listen on websocket for avro export job to be finished
            if (this.user?.functionalities.includes(UserFunctionalitiesConstants.DATA_PREPARATION) && this.client && Object.keys(this.client).length > 0) this.client.publish({ destination: '/app/prepare', body: dsId })

            // launch avro export job
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/data-preparation/prepare/${dsId}`, {})
                .then(() => {
                    this.pushEvent(2)

                    this.addToLoadingAvros(dsId)
                    const idx = this.dataPreparation.loadedAvros.indexOf(dsId)
                    if (idx >= 0) this.removeFromLoadedAvros(idx)
                    this.pushEvent(3)
                })
                .catch(() => {})
        },
        async getAllAvroDataSets() {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/datasets/avro`)
                .then((response: AxiosResponse<any>) => {
                    this.setAvroDatasets(response.data)
                    this.setLoadedAvros(response.data)
                    this.setLoadingAvros([])
                })
                .catch(() => {})
        },
        async exportDataset(dataset: any, format: string) {
            this.loading = true
            //  { 'Content-Type': 'application/x-www-form-urlencoded' }
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/export/dataset/${dataset.id}/${format}`, {})
                .then(() => {
                    this.setInfo({
                        title: this.$t('common.toast.updateTitle'),
                        msg: this.$t('workspace.myData.exportSuccess')
                    })
                })
                .catch(() => {})
            this.loading = false
        },
        getFileType(type: string) {
            switch (type) {
                case 'csv':
                    return 'text/csv'
                case 'xls':
                    return 'application/vnd.ms-excel'
                case 'xlsx':
                    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        },
        shareDataset() {
            this.shareDialogVisible = true
        },
        async handleDatasetShare(dataset: any) {
            this.loading = true
            const url = dataset.catTypeId ? `/restful-services/selfservicedataset/share/?catTypeId=${dataset.catTypeId}&id=${dataset.id}` : `/restful-services/selfservicedataset/share/?id=${dataset.id}`
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + url)
                .then(() => {
                    this.setInfo({
                        title: this.$t('common.toast.updateTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.showDetailSidebar = false
                    this.shareDialogVisible = false
                    this.getDatasets()
                })
                .catch(() => {})
            this.loading = false
        },
        async cloneDataset(dataset: any) {
            await this.loadDataset(dataset.id)
            this.cloneDialogVisible = true
        },
        async handleDatasetClone(dataset: any) {
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets`, dataset, { headers: { 'X-Disable-Errors': 'true' } })
                .then(() => {
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.showDetailSidebar = false
                    this.cloneDialogVisible = false
                    this.getDatasets()
                })
                .catch((response: any) => {
                    this.warningDialogVisbile = true
                    this.warningMessage = response
                })
        },
        datasetPreparation(dataset: any) {
            this.$router.push({ name: 'data-preparation', params: { id: dataset.id } })
        },
        deleteDatasetConfirm(dataset: any) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: async () => await this.deleteDataset(dataset)
            })
        },
        async deleteDataset(dataset: any) {
            this.loading = true
            await this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${dataset.label}`)
                .then(() => {
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.showDetailSidebar = false
                    this.getDatasets()
                })
                .catch(() => {})
            this.loading = false
        },
        closeWarningDialog() {
            this.warningMessage = ''
            this.warningDialogVisbile = false
        },
        proceedToDataPrep() {
            this.dataPrepAvroHandlingMessage = ''
            this.dataPrepAvroHandlingDialogVisbile = false

            if (this.existingPreparedDatasetId && this.isAvroReady(this.existingPreparedDatasetId)) this.openDataPreparation({ id: this.existingPreparedDatasetId })
        },
        async getDatasets() {
            this.loading = true
            this.searchWord = ''
            this.preparedDatasets = this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/datasets/advanced`)
                .then((response: AxiosResponse<any>) => {
                    this.datasetList = [...response.data.root]
                    this.preparedDatasets = [...this.datasetList]
                })
                .finally(() => (this.loading = false))
        },
        searchItems() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.preparedDatasets = [...this.datasetList] as any[]
                } else {
                    this.preparedDatasets = this.datasetList.filter((el: any) => {
                        return el.label?.toLowerCase().includes(this.searchWord.toLowerCase()) || el.name?.toLowerCase().includes(this.searchWord.toLowerCase()) || el.dsTypeCd?.toLowerCase().includes(this.searchWord.toLowerCase())
                    })
                }
            }, 250)
        },
        async updateDatasetAndSave(newConfig) {
            this.showMonitoring = false
            await this.$http.patch(import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + '/api/1.0/instance/' + newConfig.instanceId, { config: newConfig.config }).then(
                () => {
                    this.loadDataset(this.selectedDataset.id)
                    this.setInfo({ title: this.$t('common.save'), msg: this.$t('common.toast.updateSuccess') })
                },
                () => {
                    this.setError({ title: this.$t('common.error.saving'), msg: this.$t('managers.workspaceManagement.dataPreparation.errors.updatingSchedulation') })
                }
            )
        },
        pushEvent(id: number) {
            let message = {}
            switch (id) {
                case 0:
                    message = { id: 0, message: this.$t('managers.workspaceManagement.dataPreparation.dataPreparationIsStarting') }
                    break
                case 1:
                    message = { id: 1, message: this.$t('managers.workspaceManagement.dataPreparation.dataPreparationIsManagingTheDataset') }
                    break
                case 2:
                    message = { id: 2, message: this.$t('managers.workspaceManagement.dataPreparation.dataPreparationIsCreatingFiles') }
                    break
                case 3:
                    message = { id: 3, message: this.$t('managers.workspaceManagement.dataPreparation.dataPreparationIsApplyingTheChanges') }
                    break
                case 4:
                    message = { id: 4, message: this.$t('managers.workspaceManagement.dataPreparation.dataPreparationIsCompleted') }
                    break
                case 5:
                    message = { id: 4, message: this.$t('managers.workspaceManagement.dataPreparation.dataPreparationStoppedWithErrors'), status: 'error' }
                    break
            }
            setTimeout(this.events.push(message), 1500)
        }
    }
})
</script>
