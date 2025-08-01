<template>
    <div class="kn-page">
        <div class="kn-page-content p-grid p-m-0">
            <div class="kn-list--column p-col-4 p-sm-4 p-md-3 p-p-0">
                <Toolbar class="kn-toolbar kn-toolbar--primary">
                    <template #start>
                        {{ $t('managers.layersManagement.title') }}
                    </template>
                    <template #end>
                        <FabButton icon="fas fa-plus" data-test="open-form-button" @click="showDetail" />
                    </template>
                </Toolbar>
                <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                <KnListBox :options="allLayers" :settings="descriptor.knListSettings" @click="showDetail" @delete.stop="deleteLayerConfirm" @download.stop="downloadLayerFile" />
            </div>

            <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 kn-router-view">
                <LayersManagementDetailView v-if="selectedLayer" :selected-layer="selectedLayer" :all-roles="allRoles" :all-categories="allCategories" @closed="onDetailClose" @saved="reloadPageOnSave" @touched="touched = true"></LayersManagementDetailView>
                <LayersManagementHint v-else></LayersManagementHint>
            </div>

            <LayersManagementDownloadDialog :visible="downloadDialogVisible" :layer="selectedLayerForDownload" @close="downloadDialogVisible = false"></LayersManagementDownloadDialog>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { iLayer } from './LayersManagement'
import FabButton from '@/components/UI/KnFabButton.vue'
import descriptor from './LayersManagementDescriptor.json'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import LayersManagementDetailView from './detailView/LayersManagementDetailView.vue'
import LayersManagementHint from './LayersManagementHint.vue'
import LayersManagementDownloadDialog from './downloadDialog/LayersManagementDownloadDialog.vue'
import mainStore from '../../../App.store'
import deepcopy from 'deepcopy'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'roles-management',
    components: { FabButton, KnListBox, LayersManagementDetailView, LayersManagementHint, LayersManagementDownloadDialog },
    data() {
        return {
            descriptor,
            allLayers: [] as iLayer[],
            allRoles: [] as any,
            allCategories: [] as any,
            selectedLayer: null as iLayer | null,
            touched: false,
            loading: false,
            downloadDialogVisible: false,
            selectedLayerForDownload: null
        }
    },
    async created() {
        this.loadPage()
    },
    methods: {
        ...mapActions(mainStore, ['setInfo']),
        async loadPage() {
            this.loading = true
            this.touched = false
            await Promise.all([await this.getAllLayers(), await this.getAllRoles(), await this.getAllCategories()])
            this.loading = false
        },
        async getAllLayers() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers`).then((response: AxiosResponse<any>) => (this.allLayers = response.data.root))
        },
        async getAllRoles() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/getroles?`).then((response: AxiosResponse<any>) => (this.allRoles = response.data))
        },
        async getAllCategories() {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/domains/listValueDescriptionByType?DOMAIN_TYPE=GEO_CATEGORY`).then((response: AxiosResponse<any>) => (this.allCategories = response.data))
        },
        showDetail(event) {
            if (!this.touched) {
                this.selectedLayer = event.item ? (deepcopy(event.item) as iLayer) : (deepcopy(this.descriptor.newLayer) as iLayer)
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.selectedLayer = event.item ? (deepcopy(event.item) as iLayer) : (deepcopy(this.descriptor.newLayer) as iLayer)
                    }
                })
            }
        },
        deleteLayerConfirm(event) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteLayer(event.item.label)
            })
        },
        async deleteLayer(layerLabel: string) {
            await this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/deleteLayer?label=${layerLabel}`).then(() => {
                this.setInfo({
                    title: this.$t('common.toast.deleteTitle'),
                    msg: this.$t('common.toast.deleteSuccess')
                })
                this.getAllLayers()
            })
        },
        onDetailClose() {
            this.touched = false
            this.selectedLayer = null
        },
        downloadLayerFile(event: any) {
            this.selectedLayerForDownload = event.item
            this.downloadDialogVisible = true
        },
        async reloadPageOnSave(id) {
            await this.loadPage()
            const layerToReload = this.allLayers.find((layer) => layer.layerId === id) as any
            this.selectedLayer = deepcopy(layerToReload) as iLayer
        }
    }
})
</script>
