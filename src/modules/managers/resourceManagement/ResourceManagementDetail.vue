<template>
    <div class="kn-page">
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ folder.label }}</q-toolbar-title>

            <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeDetail">
                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
            </q-btn>
        </q-toolbar>

        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
        <Breadcrumb :home="home" :model="items"> </Breadcrumb>
        <div class="kn-page-content">
            <q-toolbar class="kn-toolbar kn-toolbar--default">
                <q-toolbar-title>{{ $t('managers.resourceManagement.selectedFiles', { num: selectedFiles.length, count: selectedFiles.length }) }}</q-toolbar-title>

                <q-btn flat round dense icon="refresh" data-test="refresh-button" :disable="selectedFiles.length > 0" @click="loadSelectedFolder">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.refresh') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="upload" data-test="refresh-button" :disable="selectedFiles.length > 0" @click="openImportFileDialog">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.upload') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="download" data-test="close-button" @click="downloadFiles">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.download') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="delete" data-test="close-button" @click="showDeleteDialog">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.delete') }}</q-tooltip>
                </q-btn>
            </q-toolbar>

            <ResourceManagementImportFileDialog v-model:visibility="importFile" :path="folder.key" :existing-files="files" @fileUploaded="fileUploaded" />

            <q-table :rows="files" :columns="columns" :filter="filter" row-key="name" dense flat class="q-ma-sm full-width" :pagination="{ rowsPerPage: 20 }" selection="multiple" v-model:selected="selectedFiles">
                <template v-slot:top>
                    <q-input ref="filter" class="q-ma-sm" dense square standout outlined v-model="filter" :placeholder="$t('common.search')">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                </template>
                <template #body-cell-size="props">
                    <q-td :props="props">
                        {{ getDataValue(props.value) }}
                    </q-td>
                </template>
                <template #body-cell-lastModified="props">
                    <q-td :props="props">
                        {{ getDate(props.value) }}
                    </q-td>
                </template>
            </q-table>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import descriptor from './ResourceManagementDescriptor.json'
import { IFileTemplate } from '@/modules/managers/resourceManagement/ResourceManagement'
import { byteToHumanFriendlyFormat } from '@/helpers/commons/fileHelper'
import { ITableColumn } from '../../commons/ITableColumn'
import { formatDate } from '@/helpers/commons/localeHelper'
import Breadcrumb from 'primevue/breadcrumb'
import ResourceManagementImportFileDialog from './ResourceManagementImportFileDialog.vue'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import mainStore from '../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    components: { Breadcrumb, ResourceManagementImportFileDialog },
    beforeRouteUpdate() {
        this.loadSelectedFolder()
    },
    props: {
        folder: Object
    },
    emits: ['touched', 'closed', 'inserted', 'folderCreated', 'fileUploaded'],
    data() {
        return {
            descriptor,
            loading: false,
            touched: false,
            files: [] as Array<IFileTemplate>,
            selectedFiles: [] as Array<IFileTemplate>,
            home: { icon: 'pi pi-home' },
            items: [] as Array<{ label: string }>,
            folderName: '',
            importFile: false,
            selectedFolder: {} as any,
            columns: [
                {
                    field: 'name',
                    label: this.$t('managers.resourceManagement.column.name'),
                    name: 'name',
                    sortable: true,
                    align: 'left'
                },
                {
                    field: 'size',
                    label: this.$t('managers.resourceManagement.column.size'),
                    name: 'size',
                    sortable: true,
                    align: 'right'
                },
                {
                    field: 'lastModified',
                    label: this.$t('managers.resourceManagement.column.lastModified'),
                    name: 'lastModified',
                    sortable: true,
                    align: 'right'
                }
            ],
            filter: '' as string
        }
    },
    watch: {
        id(oldId, newId) {
            if (oldId != newId) this.loadSelectedFolder()
        },
        folder() {
            this.loading = true
            /* this.v$.$reset() */
            this.selectedFolder = { ...this.folder }
            this.loadSelectedFolder()
            this.loading = false
        }
    },
    created() {
        this.loadSelectedFolder()
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo']),
        closeDetail() {
            this.$emit('closed')
        },
        downloadFiles() {
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/files/download`, this.getKeyAndFilenamesObj(), {
                    responseType: 'arraybuffer', // important...because we need to convert it to a blob. If we don't specify this, response.data will be the raw data. It cannot be converted to blob directly.

                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/zip; charset=utf-8'
                    }
                })
                .then((response: AxiosResponse<any>) => {
                    downloadDirectFromResponse(response)
                    this.selectedFiles = []
                })
                .catch((error) => {
                    this.setError({
                        title: this.$t('common.error.downloading'),
                        msg: this.$t(error)
                    })
                })
                .finally(() => (this.loading = false))
        },
        getBreadcrumbs() {
            this.items = []
            const relativePath = this.getCurrentFolderPath()
            if (relativePath) {
                const pathFolders = relativePath.split('\\')
                pathFolders.forEach((element) => {
                    const obj = { label: element, to: null }
                    this.items.push(obj)
                })
            }
        },
        getCurrentFolderPath() {
            return this.folder ? this.folder.relativePath : undefined
        },
        getCurrentFolderKey() {
            return this.folder ? '' + this.folder.key : undefined
        },
        getOrderedColumns(): Array<ITableColumn> {
            const columns = this.descriptor['column']
            columns.sort(function (a, b) {
                if (a.position > b.position) return 1
                if (a.position < b.position) return -1
                return 0
            })
            return columns
        },
        getDataValue(data) {
            return byteToHumanFriendlyFormat(data)
        },
        getDate(date) {
            return formatDate(date, 'LLL')
        },
        async loadSelectedFolder() {
            this.loading = true
            this.files = []
            this.selectedFiles = []
            if (this.folder) {
                await this.$http
                    .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/files` + '?key=' + this.folder.key)
                    .then((response: AxiosResponse<any>) => {
                        this.files = response.data
                        this.getBreadcrumbs()
                    })
                    .catch((error) => {
                        this.setError({
                            title: this.$t('common.error.downloading'),
                            msg: this.$t(error)
                        })
                    })
                    .finally(() => (this.loading = false))
            }
        },
        openImportFileDialog() {
            this.importFile = !this.importFile
        },
        setDirty() {
            this.touched = true
            this.$emit('touched')
        },
        showDeleteDialog() {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteConfirmTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteFiles()
            })
        },
        deleteFiles() {
            this.loading = true

            this.$http
                .delete(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/files`, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: this.getKeyAndFilenamesObj()
                })
                .then(() => {
                    this.selectedFiles = []
                    this.loadSelectedFolder()
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteSuccess')
                    })
                })
                .catch(() => {
                    this.setError({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.error.deleting')
                    })
                })
                .finally(() => (this.loading = false))
        },
        getKeyAndFilenamesObj() {
            const obj = {} as JSON
            if (this.folder) {
                obj['key'] = this.folder.key
                obj['selectedFilesNames'] = []
                for (const idx in this.selectedFiles) {
                    obj['selectedFilesNames'].push(this.selectedFiles[idx].name)
                }
            }
            return obj
        },
        fileUploaded() {
            this.loadSelectedFolder()
            this.$emit('fileUploaded')
        }
    }
})
</script>

<style scoped lang="scss">
.p-breadcrumb {
    border: none;
    border-radius: 0;
    border-bottom: 1px solid var(--kn-list-border-color);

    cursor: default !important;

    &:deep(.p-menuitem-link) {
        cursor: default !important;
    }
}
.cleanText {
    text-transform: none;
}
</style>
