<template>
    <div class="kn-importExport kn-page">
        <ImportDialog v-model:visibility="displayImportDialog" />
        <ImportMenuDialog v-if="displayImportMenu" @close="displayImportMenu = false" />
        <ImportKpiDialog v-if="displayImportKpiDialog" @close="displayImportKpiDialog = false" />
        <ImportGlossaryDialog v-if="displayImportGlossaryDialog" @close="displayImportGlossaryDialog = false" />
        <ImportCatalogDialog v-if="catalogImportDialog.visible" :catalog-type="catalogImportDialog.type" @close="catalogImportDialog.visible = false" />
        <ImportDriversDialog v-if="displayImportDriversDialog" @close="displayImportDriversDialog = false" />
        <ImportUsersDialog v-if="displayImportUsersDialog" @close="displayImportUsersDialog = false" />

        <ExportDialog v-model:visibility="exportDialog.visible" :checkbox-options="exportDialog.checkboxOptions" @export="handleExport" />

        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('importExport.title') }}</q-toolbar-title>
            <q-btn v-if="route.path !== '/import-export'" flat round dense icon="upload" @click="openImportDialog">
                <q-tooltip :delay="500">{{ $t('common.import') }}</q-tooltip>
            </q-btn>
            <q-btn v-if="route.path !== '/import-export'" flat round dense icon="download" :disable="isExportDisabled" @click="openExportDialog">
                <q-tooltip :delay="500">{{ $t('common.export') }}</q-tooltip>
            </q-btn>
        </q-toolbar>

        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

        <div class="p-d-flex kn-flex" style="flex-shrink: 0; height: 100%">
            <div class="p-col-2 tab-card-container">
                <KnTabCard v-for="(functionality, index) in functionalities" :key="index" :element="functionality" :selected="functionality.route === route.path" @click="selectType(functionality)" />
            </div>
            <div class="kn-flex p-d-flex p-flex-column p-mr-2">
                <router-view ref="routerViewRef" v-model:loading="loading" :selected-items="selectedItems" :trigger-import="documentsImportTrigger" :trigger-export="documentsExportTrigger" @onItemSelected="getSelectedItems($event)" @documentsReady="onDocumentsReady" />
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
import ImportDialog from './ImportDialog.vue'
import ProgressBar from 'primevue/progressbar'
import KnTabCard from '@/components/UI/KnTabCard.vue'
import { downloadDirectFromResponse, downloadDirectFromResponseWithCustomName } from '@/helpers/commons/fileHelper'
import { mapState } from 'pinia'
import mainStore from '../../App.store'
import { EXPORT_CONFIG, CATALOG_CONFIG, createEmptySelectedItems } from './ImportExportHelpers'
import type { CheckboxOption } from './ExportDialog.vue'
import ImportMenuDialog from './menu/ImportMenuDialog.vue'
import ImportKpiDialog from './kpi/ImportKpiDialog.vue'
import ImportGlossaryDialog from './glossary/ImportGlossaryDialog.vue'
import ImportCatalogDialog from './catalogFunction/ImportCatalogDialog.vue'
import ImportDriversDialog from './drivers/ImportDriversDialog.vue'
import ImportUsersDialog from './users/ImportUsersDialog.vue'

export default defineComponent({
    name: 'import-export',
    components: { ExportDialog, KnTabCard, ImportDialog, ProgressBar, ImportMenuDialog, ImportKpiDialog, ImportGlossaryDialog, ImportCatalogDialog, ImportDriversDialog, ImportUsersDialog },
    emits: ['onItemSelected'],
    computed: {
        ...mapState(mainStore, {
            user: 'user',
            isEnterprise: 'isEnterprise',
            licenses: 'licenses'
        }),

        isExportDisabled(): boolean {
            if (this.route.path.includes('documents')) return !this.documentsHasSelection
            return !Object.values(this.selectedItems).some((items) => items.length > 0)
        }
    },
    setup() {
        const store = mainStore()
        const router = useRouter()
        const route = useRoute()
        return { store, router, route }
    },
    data() {
        return {
            importExportDescriptor,
            displayImportDialog: false,
            exportDialog: {
                visible: false,
                type: null as string | null,
                checkboxOptions: [] as CheckboxOption[]
            },
            loading: false,
            selectedItems: createEmptySelectedItems(),
            functionalities: [] as any[],
            currentFunctionality: null as any,
            // For documents integration
            documentsComponent: null as any,
            documentsImportTrigger: 0,
            documentsExportTrigger: 0,
            documentsHasSelection: false,
            displayImportMenu: false,
            displayImportKpiDialog: false,
            displayImportGlossaryDialog: false,
            displayImportDriversDialog: false,
            displayImportUsersDialog: false,
            catalogImportDialog: {
                visible: false,
                type: '' as 'DATASET' | 'BUSINESS MODEL' | 'SCHEMA' | 'LAYER' | ''
            }
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
            const currentHostName = this.licenses.hosts[0]?.hostName

            this.functionalities = importExportDescriptor.functionalities
                .filter((x) => !x.requiredFunctionality || this.user?.functionalities?.includes(x.requiredFunctionality))
                .filter((x) => {
                    if (!x.requiredLicense || !currentHostName || !licenses[currentHostName]) return true
                    return licenses[currentHostName].some((lic) => lic.product === x.requiredLicense)
                })

            this.loading = false
        },
        getSelectedItems(e: { functionality: string; items: any[] }) {
            if (e.items) {
                this.selectedItems[e.functionality] = e.items
            }
        },
        onDocumentsReady(hasSelection: boolean) {
            this.documentsHasSelection = hasSelection
        },

        selectType(type): void {
            const hasOtherSelectedItems = Object.entries(this.selectedItems).some(([key, items]: [string, any[]]) => items.length > 0 && key !== type.type)

            if (hasOtherSelectedItems) {
                this.$confirm.require({
                    message: this.$t('importExport.clearSelectedItems'),
                    header: this.$t('common.warning'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.resetSelectedItems()
                        this.navigateToType(type)
                    }
                })
            } else {
                this.navigateToType(type)
            }
        },
        navigateToType(type): void {
            this.currentFunctionality = type
            this.router.push(type.route)
        },

        openImportDialog(): void {
            if (this.route.path.includes('documents')) {
                this.documentsImportTrigger++
            } else if (this.route.path.includes('menu')) {
                this.displayImportMenu = true
            } else if (this.route.path.includes('kpi')) {
                this.displayImportKpiDialog = true
            } else if (this.route.path.includes('glossary')) {
                this.displayImportGlossaryDialog = true
            } else if (this.route.path.includes('drivers')) {
                this.displayImportDriversDialog = true
            } else if (this.route.path.includes('users')) {
                this.displayImportUsersDialog = true
            } else if (this.route.path.includes('datasets')) {
                this.catalogImportDialog = { visible: true, type: 'DATASET' }
            } else if (this.route.path.includes('businessmodels')) {
                this.catalogImportDialog = { visible: true, type: 'BUSINESS MODEL' }
            } else if (this.route.path.includes('mondrianschemas')) {
                this.catalogImportDialog = { visible: true, type: 'SCHEMA' }
            } else if (this.route.path.includes('layers')) {
                this.catalogImportDialog = { visible: true, type: 'LAYER' }
            } else if (this.route.path.includes('gallery') || this.route.path.includes('catalogfunction')) {
                this.displayImportDialog = true
            } else {
                this.displayImportDialog = true
            }
        },

        openExportDialog(): void {
            if (this.route.path.includes('documents')) {
                this.documentsExportTrigger++
            } else {
                const selectedEntry = Object.entries(this.selectedItems).find(([_, items]) => items.length > 0)
                if (!selectedEntry) return

                const [selectedType] = selectedEntry
                const config = EXPORT_CONFIG[selectedType]
                const checkboxOptions = config?.checkboxOptions || []

                this.exportDialog = { visible: true, type: selectedType, checkboxOptions }
            }
        },
        closeExportDialog(): void {
            this.exportDialog.visible = false
            this.exportDialog.type = null
            this.exportDialog.checkboxOptions = []
        },

        async handleExport(fileName: string, ...checkboxValues: any[]): Promise<void> {
            if (!this.exportDialog.type) return

            // Build options from checkbox values
            const options = this.buildExportOptions(this.exportDialog.type, checkboxValues)

            // Determine which export method to use
            const exportType = this.exportDialog.type
            const selectedItems = this.selectedItems[exportType]

            if (!selectedItems || selectedItems.length === 0) return

            // Route to appropriate export method
            if (EXPORT_CONFIG[exportType]) {
                await this.exportWithConfig(exportType, fileName, options)
            } else if (CATALOG_CONFIG[exportType]) {
                await this.exportCatalogItem(exportType, fileName)
            } else {
                await this.exportOtherFunctionalities(fileName)
            }
        },
        buildExportOptions(type: string, checkboxValues: any[]): any {
            const config = EXPORT_CONFIG[type]
            if (!config?.checkboxOptions) return {}

            const options = {}
            config.checkboxOptions.forEach((option, index) => {
                options[option.key] = checkboxValues[index] ?? option.defaultValue
            })
            return options
        },
        async exportWithConfig(type: string, fileName: string, options: any): Promise<void> {
            const config = EXPORT_CONFIG[type]
            if (!config) return

            const exportData = config.buildData(this.selectedItems[type], fileName, options)
            const url = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/1.0/serverManager/importExport${config.endpoint}`

            if (type === 'users') {
                await this.exportUsers(url, exportData, fileName)
            } else {
                await this.performExport(url, exportData, fileName)
            }
        },
        async exportUsers(url: string, exportData: any, fileName: string): Promise<void> {
            this.store.setLoading(true)

            await this.$http
                .post(url, exportData)
                .then(async (response: AxiosResponse<any>) => {
                    if (response.data.hasOwnProperty('STATUS') && response.data.STATUS == 'OK') {
                        const downloadUrl = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/1.0/serverManager/importExport/users/downloadExportFile`
                        await this.$http.post(downloadUrl, { FILE_NAME: fileName }, { responseType: 'arraybuffer', headers: { 'Content-Type': 'application/json', Accept: 'application/zip; charset=utf-8' } }).then((downloadResponse: AxiosResponse<any>) => {
                            downloadDirectFromResponseWithCustomName(downloadResponse, fileName)
                            this.store.setInfo({ title: this.$t('common.downloading'), msg: this.$t('importExport.export.successfullyCompleted') })
                            this.resetSelectedItems()
                            this.closeExportDialog()
                        })
                    }
                })
                .catch(() => this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') }))
                .finally(() => this.store.setLoading(false))
        },
        async exportCatalogItem(type: string, fileName: string): Promise<void> {
            const config = CATALOG_CONFIG[type]
            if (!config) return

            const exportData = this.buildCatalogExportData(config.listKey, this.selectedItems[type], config.catalogType, fileName)

            const url = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/1.0/serverManager/importExport/catalog/export`
            await this.performExport(url, exportData, fileName)
        },

        buildCatalogExportData(listKey: string, items: any[], catalogType: string, fileName: string): any {
            return {
                DATASET_LIST: listKey === 'DATASET_LIST' ? items.map((item) => ({ ...item, catalogType })) : [],
                BM_LIST: listKey === 'BM_LIST' ? items.map((item) => ({ ...item, catalogType })) : [],
                SCHEMA_LIST: listKey === 'SCHEMA_LIST' ? items.map((item) => ({ ...item, catalogType })) : [],
                LAYER_LIST: listKey === 'LAYER_LIST' ? items.map((item) => ({ ...item, catalogType })) : [],
                SVG_LIST: [], // Required by BE
                EXPORT_FILE_NAME: fileName,
                EXPORT_SUB_OBJ: false,
                EXPORT_SNAPSHOT: false
            }
        },
        async performExport(url: string, exportData: any, fileName: string): Promise<void> {
            this.store.setLoading(true)

            await this.$http
                .post(url, exportData, {
                    responseType: 'arraybuffer',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/zip; charset=utf-8' }
                })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.errors) {
                        this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                    } else {
                        downloadDirectFromResponseWithCustomName(response, fileName)
                        this.store.setInfo({ title: this.$t('common.downloading'), msg: this.$t('importExport.export.successfullyCompleted') })
                    }

                    this.resetSelectedItems()
                    this.closeExportDialog()
                })
                .catch(() => this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') }))
                .finally(() => this.store.setLoading(false))
        },

        // Technically, everything will be exported with this bulk service in the future
        async exportOtherFunctionalities(fileName: string): Promise<void> {
            this.store.setLoading(true)
            const exportData = this.streamlineSelectedItemsArray(fileName)

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/export/bulk', exportData, {
                    responseType: 'arraybuffer',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/zip; charset=utf-8' }
                })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.errors) {
                        this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                    } else {
                        downloadDirectFromResponse(response)
                        this.store.setInfo({ title: this.$t('common.downloading'), msg: this.$t('importExport.export.successfullyCompleted') })
                    }

                    this.resetSelectedItems()
                    this.closeExportDialog()
                })
                .catch(() => this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') }))
                .finally(() => this.store.setLoading(false))
        },

        resetSelectedItems(): void {
            this.selectedItems = createEmptySelectedItems()
        },

        streamlineSelectedItemsArray(fileName: string): any {
            const selectedItemsToBE = {
                selectedItems: {},
                filename: fileName
            }

            Object.entries(this.selectedItems).forEach(([category, items]) => {
                if (items.length > 0) {
                    selectedItemsToBE.selectedItems[category] = items.map((item) => item.id)
                }
            })

            return selectedItemsToBE
        }
    }
})
</script>

<style lang="scss" scoped>
.tab-card-container {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */

    &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
    }
}
</style>
