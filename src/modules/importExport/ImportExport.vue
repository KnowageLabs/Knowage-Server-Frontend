<template>
    <div class="kn-importExport kn-page">
        <ImportDialog v-model:visibility="displayImportDialog"></ImportDialog>
        <ExportDialog v-model:visibility="displayExportDialog" @export="startExport"></ExportDialog>
        <ExportUsersDialog v-model:visibility="displayExportUsersDialog" @export="startExportUsers"></ExportUsersDialog>
        <ExportMenuDialog v-model:visibility="displayExportMenuDialog" @export="startExportMenu"></ExportMenuDialog>

        <Toolbar class="kn-toolbar kn-toolbar--primary">
            <template #start>
                {{ $t('importExport.title') }}
            </template>
            <template #end>
                <Button class="kn-button p-button-text" @click="openImportDialog">{{ $t('common.import') }}</Button>
                <Button class="kn-button p-button-text" :disabled="isExportDisabled()" @click="openExportDialog">{{ $t('common.export') }}</Button>
            </template>
        </Toolbar>

        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

        <div class="p-d-flex kn-flex" style="flex-shrink: 0">
            <div class="p-col-2">
                <KnTabCard v-for="(functionality, index) in functionalities" :key="index" :element="functionality" :selected="functionality.route === route.path" @click="selectType(functionality)"> </KnTabCard>
            </div>
            <div class="kn-flex p-d-flex p-flex-column p-mr-2">
                <router-view v-model:loading="loading" :selected-items="selectedItems" @onItemSelected="getSelectedItems($event)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { AxiosResponse } from 'axios'
import importExportDescriptor from './ImportExportDescriptor.json'
import ExportDialog from './ExportDialog.vue'
import ExportUsersDialog from './users/ExportUsersDialog.vue'
import ExportMenuDialog from './menu/ExportMenuDialog.vue'
import ImportDialog from './ImportDialog.vue'
import ProgressBar from 'primevue/progressbar'
import KnTabCard from '@/components/UI/KnTabCard.vue'
import { downloadDirectFromResponse, downloadDirectFromResponseWithCustomName } from '@/helpers/commons/fileHelper'
import { mapState } from 'pinia'
import mainStore from '../../App.store'
import type { ISelectedItems } from './ImportExportTypes'

export default defineComponent({
    name: 'import-export',
    components: { ExportDialog, ExportUsersDialog, ExportMenuDialog, KnTabCard, ImportDialog, ProgressBar },
    emits: ['onItemSelected'],
    computed: {
        ...mapState(mainStore, {
            user: 'user',
            isEnterprise: 'isEnterprise',
            licenses: 'licenses'
        })
    },
    setup() {
        const store = mainStore()
        const router = useRouter()
        const route = useRoute()
        return { store, router, route }
    },
    data() {
        return {
            importExportDescriptor: importExportDescriptor,
            displayImportDialog: false,
            displayExportDialog: false,
            displayExportUsersDialog: false,
            displayExportMenuDialog: false,
            fileName: '',
            loading: false,
            selectedItems: {
                gallery: [],
                catalogFunction: [],
                users: [],
                menu: []
            } as ISelectedItems,
            functionalities: Array<any>(),
            currentFunctionality: null as any
        }
    },
    mounted() {
        this.setFunctionalities()
    },
    watch: {
        isEnterprise(newVal) {
            if (newVal) this.setFunctionalities()
        }
    },
    methods: {
        async setFunctionalities() {
            this.loading = true
            this.functionalities = []

            const licenses = this.licenses.licenses
            const currentHostName = this.licenses.hosts[0] ? this.licenses.hosts[0].hostName : undefined

            this.functionalities = importExportDescriptor.functionalities
                .filter((x) => {
                    return x.requiredFunctionality ? this.user.functionalities.includes(x.requiredFunctionality) : true
                })
                .filter((x) => {
                    return x.requiredLicense && currentHostName && licenses[currentHostName] ? licenses[currentHostName].filter((lic) => lic.product === x.requiredLicense).length == 1 : true
                })

            this.loading = false
        },
        getSelectedItems(e) {
            if (e.items) this.selectedItems[e.functionality] = e.items
        },
        isExportDisabled() {
            for (const index in this.selectedItems) {
                if (this.selectedItems[index].length > 0) return false
            }
            return true
        },
        selectType(type): void {
            // Check if there are selected items in other categories
            const hasSelectedItems = Object.entries(this.selectedItems).some(([key, items]: [string, any[]]) => {
                return items.length > 0 && key !== type.type
            })

            if (hasSelectedItems) {
                this.$confirm.require({
                    message: this.$t('importExport.clearSelectedItems'),
                    header: this.$t('common.warning'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.selectedItems = {
                            gallery: [],
                            catalogFunction: [],
                            users: [],
                            menu: []
                        }
                        this.currentFunctionality = type
                        this.router.push(type.route)
                    }
                })
            } else {
                this.currentFunctionality = type
                this.router.push(type.route)
            }
        },
        openImportDialog(): void {
            this.displayImportDialog = !this.displayImportDialog
        },
        openExportDialog(): void {
            if (this.selectedItems.users && this.selectedItems.users.length > 0) {
                this.displayExportUsersDialog = !this.displayExportUsersDialog
            } else if (this.selectedItems.menu && this.selectedItems.menu.length > 0) {
                this.displayExportMenuDialog = !this.displayExportMenuDialog
            } else {
                this.displayExportDialog = !this.displayExportDialog
            }
        },
        openExportUsersDialog(): void {
            this.displayExportUsersDialog = !this.displayExportUsersDialog
        },
        openExportMenuDialog(): void {
            this.displayExportMenuDialog = !this.displayExportMenuDialog
        },
        async startExport(fileName: string) {
            if (this.selectedItems.users && this.selectedItems.users.length > 0) {
                await this.exportUsers(fileName)
            } else {
                await this.exportOtherFunctionalities(fileName)
            }
        },
        async startExportUsers(fileName: string, exportPersonalFolder: boolean) {
            await this.exportUsers(fileName, exportPersonalFolder)
        },
        async startExportMenu(fileName: string) {
            await this.exportMenu(fileName)
        },
        async exportUsers(fileName: string, exportPersonalFolder = true): Promise<void> {
            const exportData = {
                USERS_LIST: this.selectedItems.users,
                EXPORT_FILE_NAME: fileName,
                EXPORT_PERSONAL_FOLDER: exportPersonalFolder
            }

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/serverManager/importExport/users/export`, exportData, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/zip; charset=utf-8'
                    }
                })
                .then(
                    (response: AxiosResponse<any>) => {
                        if (response.data.errors) {
                            this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                        } else {
                            downloadDirectFromResponseWithCustomName(response, fileName)
                            this.store.setInfo({ title: this.$t('common.downloading'), msg: this.$t('importExport.export.successfullyCompleted') })
                        }

                        this.selectedItems = {
                            gallery: [],
                            catalogFunction: [],
                            users: [],
                            menu: []
                        }
                        this.openExportUsersDialog()
                    },
                    () => this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                )
        },
        async exportMenu(fileName: string): Promise<void> {
            const exportData = {
                EXPORT_SELECTED_MENU: this.selectedItems.menu,
                EXPORT_FILE_NAME: fileName
            }

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/serverManager/importExport/menu/export`, exportData, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/zip; charset=utf-8'
                    }
                })
                .then(
                    (response: AxiosResponse<any>) => {
                        if (response.data.errors) {
                            this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                        } else {
                            downloadDirectFromResponseWithCustomName(response, fileName)
                            this.store.setInfo({ title: this.$t('common.downloading'), msg: this.$t('importExport.export.successfullyCompleted') })
                        }

                        this.selectedItems = {
                            gallery: [],
                            catalogFunction: [],
                            users: [],
                            menu: []
                        }
                        this.openExportMenuDialog()
                    },
                    () => this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                )
        },
        async exportOtherFunctionalities(fileName: string): Promise<void> {
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/export/bulk', this.streamlineSelectedItemsArray(fileName), {
                    responseType: 'arraybuffer',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/zip; charset=utf-8'
                    }
                })
                .then(
                    (response: AxiosResponse<any>) => {
                        if (response.data.errors) {
                            this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                        } else {
                            downloadDirectFromResponse(response)
                            this.store.setInfo({ title: this.$t('common.downloading'), msg: this.$t('importExport.export.successfullyCompleted') })
                        }

                        this.selectedItems = {
                            gallery: [],
                            catalogFunction: [],
                            users: [],
                            menu: []
                        }
                        /* closing dialog */
                        this.openExportDialog()
                    },
                    () => this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                )
        },

        streamlineSelectedItemsArray(fileName): JSON {
            const selectedItemsToBE = {} as JSON
            selectedItemsToBE['selectedItems'] = {}
            for (const category in this.selectedItems) {
                for (const k in this.selectedItems[category]) {
                    if (!selectedItemsToBE['selectedItems'][category]) {
                        selectedItemsToBE['selectedItems'][category] = []
                    }

                    selectedItemsToBE['selectedItems'][category].push(this.selectedItems[category][k].id)
                }
            }
            selectedItemsToBE['filename'] = fileName
            return selectedItemsToBE
        }
    }
})
</script>

<style lang="scss" scoped></style>
