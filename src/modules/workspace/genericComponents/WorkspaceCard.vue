<template>
    <div class="p-col-12 p-md-6 p-lg-4 p-xl-3" tabindex="0">
        <div class="card-container">
            <span class="details-container">
                <div class="p-ml-3 detail-type" role="type">
                    {{ document[documentFields.type] }}
                </div>
                <div class="p-ml-3 detail-info">
                    <h4 v-tooltip="document[documentFields.label]" class="p-m-0 kn-truncated" role="title">
                        {{ document[documentFields.label] }}
                    </h4>
                    <p v-tooltip="document[documentFields.name]" class="p-m-0 kn-truncated">{{ document[documentFields.name] }}</p>
                </div>
                <div class="detail-buttons">
                    <template v-for="(button, index) of documentButtons" :key="index">
                        <Button v-if="button.visible" :id="button.id" v-tooltip="$t(button.label)" :icon="button.icon" class="p-mx-1 p-button-text p-button-rounded p-button-plain p-button-lg" :aria-label="$t(button.label)" @click="button.command" />
                    </template>
                </div>
            </span>
            <div v-if="document[documentFields.image]" aria-hidden="true" class="card-image" :style="documentImageSource" />
            <div v-else aria-hidden="true" class="card-image" :style="documentImageSource" />
        </div>
    </div>
    <Menu id="optionsMenu" ref="optionsMenu" :model="menuButtons" data-test="menu" />
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from './DetailSidebarDescriptor.json'
import cardDescriptor from './WorkspaceCardDescriptor.json'
import Menu from 'primevue/contextmenu'
import mainStore from '../../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    name: 'workspace-sidebar',
    components: { Menu },
    props: { visible: Boolean, viewType: String, document: Object as any, isPrepared: Boolean },
    //prettier-ignore
    emits: ['executeRecent', 'executeDocumentFromOrganizer', 'moveDocumentToFolder', 'deleteDocumentFromOrganizer', 'executeAnalysisDocument', 'editAnalysisDocument', 'shareAnalysisDocument', 'cloneAnalysisDocument', 'deleteAnalysisDocument', 'uploadAnalysisPreviewFile', 'openDatasetInQBE', 'editDataset', 'deleteDataset', 'previewDataset', 'deleteDataset', 'editDataset', 'exportToXlsx', 'exportToCsv', 'getHelp', 'downloadDatasetFile', 'shareDataset', 'openSidebar', 'cloneDataset', 'prepareData', 'openDataPreparation'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            cardDescriptor,
            sidebarVisible: false,
            menuButtons: [] as any
        }
    },
    computed: {
        isOwner(): any {
            return (this.store.$state as any).user.fullName === this.document.creationUser
        },

        isAnalysisShared(): any {
            return this.document.functionalities.length > 1
        },
        isDatasetOwner(): any {
            return (this.store.$state as any).user.fullName === this.document.owner
        },
        showQbeEditButton(): any {
            return (this.store.$state as any).user.fullName === this.document.owner && (this.document.dsTypeCd == 'Federated' || this.document.dsTypeCd == 'Qbe')
        },
        datasetHasDrivers(): any {
            return this.document.drivers && this.document.length > 0
        },
        datasetHasParams(): any {
            return this.document.pars && this.document.pars > 0
        },
        datasetIsIterable(): any {
            // in order to export to XLSX, dataset must implement an iterator (BE side)
            const notIterableDataSets = ['Federated']
            if (notIterableDataSets.includes(this.document.dsTypeCd)) return false
            else return true
        },
        canLoadData(): any {
            if (this.document.actions) {
                for (let i = 0; i < this.document.actions.length; i++) {
                    const action = this.document.actions[i]
                    if (action.name == 'loaddata') {
                        return true
                    }
                }
            }
            return false
        },
        documentImageSource(): any {
            if (this.document[this.documentFields.image]) {
                return {
                    'background-image': `url(${import.meta.env.VITE_HOST_URL}${descriptor.imgPath}${this.document[this.documentFields.image]}),url('@/assets/images/workspace/documentTypes/'${cardDescriptor.defaultImages.missing})`
                }
            }
            return {
                'background-image': `url('@/assets/images/workspace/documentTypes/'${cardDescriptor.defaultImages[this.document.type] || cardDescriptor.defaultImages.missing})`
            }
        },
        documentFields(): any {
            switch (this.viewType) {
                case 'recent':
                    return cardDescriptor.defaultViewFields
                case 'repository':
                    return cardDescriptor.defaultViewFields
                case 'dataset':
                    return cardDescriptor.datasetViewFields
                case 'analysis':
                    return cardDescriptor.analysisViewFields
                case 'businessModel':
                    return cardDescriptor.businessModelViewFields
                case 'federationDataset':
                    return cardDescriptor.federationDatasetViewFields
                default:
                    return []
            }
        },
        documentButtons(): any {
            switch (this.viewType) {
                case 'recent':
                    return [
                        { icon: 'fas fa-info-circle', id: 'list-button', visible: true, command: () => this.emitEvent('openSidebar'), label: 'common.details' },
                        { icon: 'fas fa-play-circle', visible: true, command: () => this.emitEvent('executeRecent'), label: 'common.execute' }
                    ]
                case 'repository':
                    return [
                        { icon: 'fas fa-ellipsis-v', id: 'list-button', visible: true, command: (event) => this.showMenu(event), label: 'common.menu' },
                        { icon: 'fas fa-info-circle', id: 'list-button', visible: true, command: () => this.emitEvent('openSidebar'), label: 'common.details' },
                        { icon: 'fas fa-play-circle', visible: true, command: () => this.emitEvent('executeDocumentFromOrganizer'), label: 'common.execute' }
                    ]
                case 'dataset':
                    return [
                        { icon: 'fas fa-ellipsis-v', id: 'list-button', visible: true, command: (event) => this.showMenu(event), label: 'common.menu' },
                        { icon: 'fas fa-info-circle', id: 'list-button', visible: true, command: () => this.emitEvent('openSidebar'), label: 'common.details' },
                        { icon: 'fas fa-eye', visible: true, command: () => this.emitEvent('previewDataset'), label: 'common.details' }
                    ]
                case 'analysis':
                    return [
                        { icon: 'fas fa-ellipsis-v', id: 'list-button', visible: true, command: (event) => this.showMenu(event), label: 'common.menu' },
                        { icon: 'fas fa-info-circle', id: 'list-button', visible: true, command: () => this.emitEvent('openSidebar'), label: 'common.details' },
                        { icon: 'fas fa-play-circle', visible: true, command: () => this.emitEvent('executeAnalysisDocument'), label: 'common.execute' }
                    ]
                case 'businessModel':
                    return [
                        { icon: 'fas fa-info-circle', id: 'list-button', visible: true, command: () => this.emitEvent('openSidebar'), label: 'common.details' },
                        { icon: 'fa fa-search', visible: true, command: () => this.emitEvent('openDatasetInQBE'), label: 'common.execute' }
                    ]
                case 'federationDataset':
                    return [
                        { icon: 'fas fa-ellipsis-v', id: 'list-button', visible: true, command: (event) => this.showMenu(event), label: 'common.menu' },
                        { icon: 'fas fa-info-circle', id: 'list-button', visible: true, command: () => this.emitEvent('openSidebar'), label: 'common.details' },
                        { icon: 'fa fa-search', visible: true, command: () => this.emitEvent('openDatasetInQBE'), label: 'common.execute' }
                    ]
                default:
                    return []
            }
        }
    },
    methods: {
        showMenu(event) {
            this.createMenuItems()
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.optionsMenu.toggle(event)
        },
        emitEvent(event) {
            this.$emit(event, this.document)
        },
        // prettier-ignore
        createMenuItems() {
            this.menuButtons = []
            if (this.viewType == 'analysis') {
                this.menuButtons.push(
                    { key: 0, label: this.$t('workspace.myAnalysis.menuItems.edit'), icon: 'fas fa-edit', command: ()=>this.emitEvent('editAnalysisDocument'), visible: this.isOwner },
                    { key: 1, label: this.$t('workspace.myAnalysis.menuItems.share'), icon: 'fas fa-share-alt', command: ()=>this.emitEvent('shareAnalysisDocument'), visible: !this.isAnalysisShared },
                    { key: 2, label: this.$t('workspace.myAnalysis.menuItems.unshare'), icon: 'fas fa-times-circle', command: ()=>this.emitEvent('shareAnalysisDocument'), visible: this.isAnalysisShared },
                    { key: 3, label: this.$t('workspace.myAnalysis.menuItems.clone'), icon: 'fas fa-clone', command: ()=>this.emitEvent('cloneAnalysisDocument') },
                    { key: 4, label: this.$t('workspace.myAnalysis.menuItems.upload'), icon: 'fas fa-upload', command: ()=>this.emitEvent('uploadAnalysisPreviewFile') },
                    { key: 5, label: this.$t('workspace.myAnalysis.menuItems.delete'), icon: 'fas fa-trash', command: ()=>this.emitEvent('deleteAnalysisDocument') },
                )
            } else if (this.viewType == 'dataset') {
                let tmp = [] as any
                tmp.push({ key: 0, label: this.$t('workspace.myModels.editDataset'), icon: 'fas fa-pen', command: ()=>this.emitEvent('editDataset'), visible: this.isDatasetOwner && (this.document.dsTypeCd == 'File' || this.document.dsTypeCd == 'Prepared') })
                tmp.push({ key: 1, label: this.$t('workspace.myModels.openInQBE'), icon: 'fas fa-file-circle-question', command: ()=>this.emitEvent('openDatasetInQBE'), visible: this.isOpenInQBEVisible(this.document) })

                if ((this.store.$state as any).user?.functionalities.includes(UserFunctionalitiesConstants.DATA_PREPARATION)) {
                    tmp.push(
                        { key: 2, label: this.$t('workspace.myData.openDataPreparation'), icon: 'fas fa-cogs', command: ()=>this.emitEvent('openDataPreparation'), visible: this.canLoadData && this.document.dsTypeCd != 'Qbe' && (this.document.pars && this.document.pars.length == 0) },
                        { key: 3, label: this.$t('workspace.myData.monitoring'), icon: 'fas fa-cogs', command: ()=>this.emitEvent('monitoring'), visible: this.canLoadData && this.document.dsTypeCd != 'Qbe' && (this.document.pars && this.document.pars.length == 0) }
                    )
                }

                tmp.push({
                    key: 4,
                    label: this.$t('common.export'),
                    icon: 'fa-solid fa-file-export',
                    visible: this.canLoadData && !this.datasetHasDrivers && !this.datasetHasParams && this.document.dsTypeCd != 'File',
                    items: [
                        { key: 40, label: this.$t('workspace.myData.xlsxExport'), icon: 'fas fa-file-excel', command: ()=>this.emitEvent('exportToXlsx'), visible: this.datasetIsIterable },
                        { key: 41, label: this.$t('workspace.myData.csvExport'), icon: 'fas fa-file-csv', command: ()=>this.emitEvent('exportToCsv') },
                    ]
                })

                tmp.push({ key: 5, label: this.$t('workspace.myData.fileDownload'), icon: 'fas fa-download', command: ()=>this.emitEvent('downloadDatasetFile'), visible: this.document.dsTypeCd == 'File' })
                tmp.push({ key: 6, label: this.$t('workspace.myData.shareDataset'), icon: 'fas fa-share-alt', command: ()=>this.emitEvent('shareDataset'), visible: this.canLoadData && this.isDatasetOwner })
                tmp.push({ key: 7, label: this.$t('workspace.myData.cloneDataset'), icon: 'fas fa-clone', command: ()=>this.emitEvent('cloneDataset'), visible: this.canLoadData && this.document.dsTypeCd == 'Qbe' })
                tmp.push({ key: 100, label: this.$t('workspace.myData.deleteDataset'), icon: 'fas fa-trash', command: ()=>this.emitEvent('deleteDataset'), visible: this.isDatasetOwner })

                tmp = tmp.sort((a, b) => a.key < b.key)
                tmp.forEach(element => {
                    if (element.items) {
                        element.items = element.items.sort((a, b) => a.key < b.key)
                    }
                })
                this.menuButtons = tmp

            } else if (this.viewType === 'federationDataset') {
                this.menuButtons.push(
                    { key: 0, icon: 'pi pi-pencil', label: this.$t('workspace.myModels.editDataset'), class: 'p-button-text p-button-rounded p-button-plain', visible: true, command: ()=>this.emitEvent('editDataset') },
                    { key: 1, icon: 'fas fa-trash-alt', label: this.$t('workspace.myModels.deleteDataset'), class: 'p-button-text p-button-rounded p-button-plain', visible: (this.store.$state as any).user.isSuperadmin || (this.store.$state as any).user.userId === this.document.owner, command: ()=>this.emitEvent('deleteDataset') })
            } else if (this.viewType === 'repository') {
                this.menuButtons.push(
                    { key: 3, label: this.$t('workspace.myRepository.moveDocument'), icon: 'fas fa-share', command: ()=>this.emitEvent('moveDocumentToFolder') },
                    { key: 4, label: this.$t('workspace.myAnalysis.menuItems.delete'), icon: 'fas fa-trash', command: ()=>this.emitEvent('deleteDocumentFromOrganizer') },
                )
            }
        },
        isOpenInQBEVisible(dataset: any) {
            return dataset.pars?.length == 0 && ((dataset.isPersisted && dataset.dsTypeCd == 'File') || dataset.dsTypeCd == 'Query' || dataset.dsTypeCd == 'Flat')
        }
    }
})
</script>
<style lang="scss" scoped>
.card-container {
    display: flex;
    flex-direction: row;
    position: relative;
    border-radius: 0;
    overflow: hidden;
    height: 120px;
    padding: 0;
    border: 1px solid var(--kn-color-borders);

    .details-container {
        order: 1;
        -webkit-clip-path: polygon(0 0, 0 100%, 70% 101%, 90% 0);
        clip-path: polygon(0 0, 0 100%, 70% 101%, 90% 0);
        background-color: white;
        height: 100%;
        z-index: 2;
        width: 100%;

        .detail-type {
            text-transform: uppercase;
            font-size: 0.8rem;
            font-weight: bold;
            color: grey;
            margin-top: 1rem;
        }

        .detail-info {
            width: 70%;
        }

        .detail-buttons {
            position: absolute;
            left: 0;
            bottom: 0;
        }
    }

    .card-image {
        position: absolute;
        right: 0;
        top: 0;
        order: 2;
        height: 100%;
        z-index: 1;
        width: 200px;
    }
}

@media screen and (max-width: 576px) {
    .card-container {
        .details-container {
            -webkit-clip-path: none;
            clip-path: none;

            .detail-info {
                width: 100%;

                h4,
                p {
                    white-space: normal;
                }
            }
        }

        .card-image {
            display: none;
        }
    }

    #list-button {
        display: none;
    }
}
</style>
