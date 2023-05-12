<template>
    <Toolbar class="kn-toolbar kn-toolbar--secondary">
        <template #start>
            <Button id="showSidenavIcon" icon="fas fa-bars" class="p-button-text p-button-rounded p-button-plain" @click="$emit('showMenu')" />
            {{ $t('workspace.menuLabels.myRepository') }}
        </template>
        <template #end>
            <Button v-if="toggleCardDisplay" icon="fas fa-list" class="p-button-text p-button-rounded p-button-plain" @click="toggleDisplayView" />
            <Button v-if="!toggleCardDisplay" icon="fas fa-th-large" class="p-button-text p-button-rounded p-button-plain" @click="toggleDisplayView" />
        </template>
    </Toolbar>

    <WorkspaceRepositoryBreadcrumb :breadcrumbs="breadcrumbs" @breadcrumbClicked="$emit('breadcrumbClicked', $event)"></WorkspaceRepositoryBreadcrumb>

    <InputText v-model="searchWord" class="kn-material-input p-m-2" :style="mainDescriptor.style.filterInput" type="text" :placeholder="$t('common.search')" data-test="search-input" @input="searchItems" />
    <div class="p-m-2 kn-overflow">
        <DataTable v-if="!toggleCardDisplay" class="p-datatable-sm kn-table p-mx-2" :value="filteredDocuments" :loading="loading" data-key="biObjId" responsive-layout="stack" breakpoint="600px" data-test="documents-table">
            <template #empty>
                {{ $t('common.info.noDataFound') }}
            </template>
            <template #filter="{ filterModel }">
                <InputText v-model="filterModel.value" type="text" class="p-column-filter"></InputText>
            </template>
            <Column style="width: 5%">
                <template #body="slotProps">
                    <i :class="slotProps.data['type'] === 'VIEW' ? 'fa-solid fa-eye' : 'fa-solid fa-file'"></i>
                </template>
            </Column>
            <Column :key="'type'" :header="$t('common.type')" :sortable="true">
                <template #body="slotProps">
                    <span class="kn-truncated">{{ slotProps.data['type'] ?? slotProps.data['documentType'] }}</span>
                </template>
            </Column>
            <Column :key="'name'" :header="$t('common.name')" :sortable="true">
                <template #body="slotProps">
                    <span class="kn-truncated">{{ slotProps.data['name'] ?? slotProps.data['documentName'] }}</span>
                </template>
            </Column>
            <Column :key="'description'" :header="$t('common.description')" :sortable="true">
                <template #body="slotProps">
                    <span class="kn-truncated">{{ slotProps.data['description'] ?? slotProps.data['documentDescription'] }}</span>
                </template>
            </Column>
            <Column :key="'owner'" :header="$t('common.owner')" :sortable="true" style="width: 5%">
                <template #body="slotProps">
                    <span class="kn-truncated">{{ slotProps.data['owner'] }}</span>
                </template>
            </Column>
            <Column class="icon-cell" :style="mainDescriptor.style.iconColumn">
                <template #body="slotProps">
                    <Button icon="fas fa-ellipsis-v" class="p-button-link" @click="showMenu($event, slotProps.data)" />
                    <Button v-tooltip.left="$t('workspace.myModels.showInfo')" icon="fas fa-info-circle" class="p-button-link" :data-test="'info-button-' + slotProps.data.documentName" @click="showSidebar(slotProps.data)" />
                    <Button icon="fas fa-play-circle" class="p-button-link" @click="executeDocumentFromOrganizer(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
        <div v-if="toggleCardDisplay" class="p-grid p-m-2" data-test="card-container">
            <Message v-if="filteredDocuments.length === 0" class="kn-flex p-m-2" severity="info" :closable="false" :style="mainDescriptor.style.message">
                {{ $t('common.info.noDataFound') }}
            </Message>
            <template v-else>
                <WorkspaceCard
                    v-for="(document, index) of filteredDocuments"
                    :key="index"
                    :view-type="'repository'"
                    :document="document"
                    @executeDocumentFromOrganizer="executeDocumentFromOrganizer"
                    @moveDocumentToFolder="moveDocumentToFolder"
                    @deleteDocumentFromOrganizer="deleteDocumentConfirm"
                    @openSidebar="showSidebar"
                />
            </template>
        </div>
    </div>

    <DetailSidebar
        :visible="showDetailSidebar"
        :view-type="'repository'"
        :document="selectedDocument"
        data-test="detail-sidebar"
        @executeDocumentFromOrganizer="executeDocumentFromOrganizer"
        @moveDocumentToFolder="moveDocumentToFolder"
        @deleteDocumentFromOrganizer="deleteDocumentConfirm"
        @close="showDetailSidebar = false"
    />

    <WorkspaceRepositoryMoveDialog :visible="moveDialogVisible" :prop-folders="folders" @close="moveDialogVisible = false" @move="handleDocumentMove"></WorkspaceRepositoryMoveDialog>
    <WorkspaceWarningDialog :visible="warningDialogVisbile" :warning-message="warningMessage" @close="closeWarningDialog"></WorkspaceWarningDialog>
    <Menu id="optionsMenu" ref="optionsMenu" :model="menuButtons" />

    <DashboardSaveViewDialog v-if="saveViewDialogVisible" :visible="saveViewDialogVisible" :prop-view="selectedView" @close="onSaveViewListDialogClose" @viewUpdated="onViewUpdated"></DashboardSaveViewDialog>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { IDocument, IFolder } from '@/modules/workspace/Workspace'
import mainDescriptor from '@/modules/workspace/WorkspaceDescriptor.json'
import DetailSidebar from '@/modules/workspace/genericComponents/DetailSidebar.vue'
import Message from 'primevue/message'
import WorkspaceCard from '@/modules/workspace/genericComponents/WorkspaceCard.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Menu from 'primevue/contextmenu'
import WorkspaceRepositoryMoveDialog from './dialogs/WorkspaceRepositoryMoveDialog.vue'
import WorkspaceWarningDialog from '../../genericComponents/WorkspaceWarningDialog.vue'
import WorkspaceRepositoryBreadcrumb from './breadcrumbs/WorkspaceRepositoryBreadcrumb.vue'
import { AxiosResponse } from 'axios'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import mainStore from '../../../../App.store'
import { IDashboardView } from '@/modules/documentExecution/dashboard/Dashboard'
import { deleteDashboardView } from '@/modules/documentExecution/dashboard/DashboardViews/DashboardViewsHelper'
import { mapActions } from 'pinia'
import DashboardSaveViewDialog from '@/modules/documentExecution/dashboard/DashboardViews/DashboardSaveViewDialog/DashboardSaveViewDialog.vue'
import appStore from '@/App.store'

export default defineComponent({
    components: { DataTable, Column, DetailSidebar, WorkspaceCard, Menu, Message, WorkspaceRepositoryMoveDialog, WorkspaceWarningDialog, WorkspaceRepositoryBreadcrumb, DashboardSaveViewDialog },
    props: { selectedFolder: { type: Object }, id: { type: String, required: false }, toggleCardDisplay: { type: Boolean }, breadcrumbs: { type: Array }, allFolders: { type: Array } },
    emits: ['showMenu', 'reloadRepositoryMenu', 'toggleDisplayView', 'breadcrumbClicked', 'execute'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            mainDescriptor,
            loading: false,
            showDetailSidebar: false,
            documents: [] as (IDocument | IDashboardView)[],
            filteredDocuments: [] as (IDocument | IDashboardView)[],
            menuButtons: [] as any,
            selectedDocument: {} as IDocument,
            searchWord: '' as string,
            folders: [] as IFolder[],
            moveDialogVisible: false,
            warningDialogVisbile: false,
            warningMessage: '',
            selectedView: null as IDashboardView | null,
            saveViewDialogVisible: false
        }
    },
    watch: {
        id() {
            this.getFolderDocuments()
        },
        allFolders() {
            this.loadFolders()
        }
    },
    created() {
        this.loadFolders()
        this.getFolderDocuments()
    },
    methods: {
        ...mapActions(appStore, ['setLoading']),
        loadFolders() {
            this.folders = this.allFolders as IFolder[]
        },
        async getFolderDocuments() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `1.0/repository/${this.id}`)
                .then((response: AxiosResponse<any>) => {
                    this.documents = [...response.data]
                    this.filteredDocuments = [...this.documents]
                })
                .finally(() => (this.loading = false))
            console.log('------- DOCUMENTS: ', this.documents)
        },
        formatDate(date) {
            return formatDateWithLocale(date, { dateStyle: 'short', timeStyle: 'short' })
        },
        showSidebar(clickedDocument) {
            this.selectedDocument = clickedDocument
            this.showDetailSidebar = true
        },
        showMenu(event, clickedDocument) {
            this.selectedDocument = clickedDocument
            this.createMenuItems(clickedDocument)
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.optionsMenu.toggle(event)
        },
        createMenuItems(clickedDocument: any) {
            this.menuButtons = []
            const isView = clickedDocument.type == 'VIEW'
            if (isView)
                this.menuButtons.push({
                    key: '2',
                    label: this.$t('workspace.myRepository.executeView'),
                    icon: 'fas fa-share',
                    command: () => {
                        this.executeView(clickedDocument)
                    }
                })

            this.menuButtons.push(
                {
                    key: '3',
                    label: isView ? this.$t('workspace.myRepository.moveView') : this.$t('workspace.myRepository.moveDocument'),
                    icon: 'fas fa-share',
                    command: () => {
                        this.moveDocumentToFolder(this.selectedDocument)
                    }
                },
                {
                    key: '4',
                    label: isView ? this.$t('workspace.myRepository.deleteView') : this.$t('workspace.myAnalysis.menuItems.delete'),
                    icon: 'fas fa-trash',
                    command: () => {
                        this.deleteDocumentConfirm(this.selectedDocument)
                    }
                }
            )
        },
        toggleDisplayView() {
            this.$emit('toggleDisplayView')
        },
        executeView(view: IDashboardView) {
            this.$emit('execute', view)
        },
        executeDocumentFromOrganizer(document: IDocument) {
            this.$emit('execute', document)
        },
        moveDocumentToFolder(document: IDocument | IDashboardView) {
            if ((document as IDashboardView).type === 'VIEW') {
                this.selectedView = { ...(document as IDashboardView) }
                this.saveViewDialogVisible = true
            } else {
                this.selectedDocument = document as IDocument
                this.moveDialogVisible = true
            }
        },
        async handleDocumentMove(folder: any) {
            this.loading = true
            await this.$http
                .put(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `2.0/organizer/documentsee/${this.selectedDocument.biObjId}/${this.selectedDocument.functId}/${folder.id}`)
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.toast.updateTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.moveDialogVisible = false
                    this.showDetailSidebar = false
                    this.getFolderDocuments()
                })
                .catch((response: any) => {
                    this.warningMessage = response
                    this.warningDialogVisbile = true
                })
            this.loading = false
        },
        deleteDocumentConfirm(document: IDocument | IDashboardView) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: async () => ((document as IDashboardView).type === 'VIEW' ? await this.deleteView(document as IDashboardView) : await this.deleteDocument(document as IDocument))
            })
        },
        async deleteView(view: IDashboardView) {
            this.setLoading(true)
            await deleteDashboardView(view, this.$http)
                .then(async () => {
                    this.store.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.showDetailSidebar = false
                    await this.getFolderDocuments()
                    if (this.selectedView?.id === view.id) {
                        this.selectedView = null
                        this.showDetailSidebar = false
                    }
                })
                .catch(() => {})
            this.setLoading(false)
        },
        async deleteDocument(document: IDocument) {
            this.loading = true

            await this.$http
                .delete(import.meta.env.VITE_RESTFUL_SERVICES_PATH + `2.0/organizer/documents/${document.functId}/${document.biObjId}`)
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.showDetailSidebar = false
                    this.getFolderDocuments()
                })
                .catch(() => {})
            this.loading = false
        },
        closeWarningDialog() {
            this.warningMessage = ''
            this.warningDialogVisbile = false
        },
        searchItems() {
            setTimeout(() => {
                if (!this.searchWord.trim().length) {
                    this.filteredDocuments = [...this.documents] as IDocument[]
                } else {
                    this.filteredDocuments = this.documents.filter((el: any) => {
                        return el.type === 'VIEW'
                            ? el.type?.toLowerCase().includes(this.searchWord.toLowerCase()) || el.name?.toLowerCase().includes(this.searchWord.toLowerCase()) || el.description?.toLowerCase().includes(this.searchWord.toLowerCase())
                            : el.documentType?.toLowerCase().includes(this.searchWord.toLowerCase()) ||
                                  el.documentLabel?.toLowerCase().includes(this.searchWord.toLowerCase()) ||
                                  el.documentName?.toLowerCase().includes(this.searchWord.toLowerCase()) ||
                                  el.documentDescription?.toLowerCase().includes(this.searchWord.toLowerCase())
                    })
                }
            }, 250)
        },
        onSaveViewListDialogClose() {
            this.saveViewDialogVisible = false
            this.selectedView = null
        },
        onViewUpdated() {
            this.getFolderDocuments()
        }
    }
})
</script>
