<template>
    <q-dialog :model-value="true" persistent class="import-catalog-dialog" square>
        <q-card class="kn-dialog--toolbar--primary">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('common.import') }}</q-toolbar-title>
            </q-toolbar>
            <q-stepper ref="stepper" v-model="step" color="primary" animated class="kn-width-full">
                <q-step :name="1" title="Upload File" icon="settings" :done="step > 1">
                    <q-file v-model="uploadedFiles" accept=".zip" max-file-size="10000000" :label="uploadedFiles ? '' : $t('common.dragAndDropFileHere')" outlined square @update:model-value="onUpload">
                        <template #prepend>
                            <q-icon name="attach_file" />
                        </template>
                        <template #hint v-if="fileUploadedMessage">
                            {{ fileUploadedMessage }}
                        </template>
                    </q-file>
                </q-step>

                <q-step :name="2" title="Select Items" icon="assignment" :done="step > 2">
                    <div class="p-mb-3">
                        <q-radio v-model="importMode" val="Missing" :label="$t('importExport.glossary.addMissing')" />
                        <q-radio v-model="importMode" val="Override" :label="$t('importExport.glossary.override')" class="q-ml-md" />
                    </div>

                    <q-table v-model:selected="selectedItems" :rows="exportedCatalog" :columns="columns" row-key="id" selection="multiple" virtual-scroll :rows-per-page-options="[0]" class="kn-table catalog-import-table" :no-data-label="$t('common.info.noDataFound')" dense square>
                        <template #body-cell-name="props">
                            <q-td :props="props">
                                {{ props.row.name }}
                            </q-td>
                        </template>
                        <template #body-cell-typeCatalog="props">
                            <q-td :props="props">
                                {{ props.row.typeCatalog }}
                            </q-td>
                        </template>
                        <template #body-cell-type="props">
                            <q-td :props="props">
                                {{ props.row.type || '-' }}
                            </q-td>
                        </template>
                    </q-table>
                </q-step>

                <q-step :name="3" title="Exported Roles" icon="group" :done="step > 3">
                    <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-m-0 p-p-0">
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
                    </form>
                    <ul class="roles-list p-mt-0">
                        <li v-for="expRole in rolesData.exportedRoles" :key="expRole.id">
                            <form class="p-fluid p-formgrid p-grid p-m-1">
                                <p class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0 role-name-text">{{ expRole.name }}</p>

                                <p v-if="rolesData.associatedRoles[expRole.id]?.fixed == true" class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0 role-name-text">
                                    {{ rolesData.associatedRoles[expRole.id].name }}
                                </p>

                                <span v-else class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                    <q-select v-model="rolesData.associatedRoles[expRole.id]" class="datasource-dropdown" style="min-width: 50%; margin-bottom: 0 !important" :options="getSelectableRoles(expRole)" option-label="name" clearable outlined dense square />
                                </span>
                            </form>
                        </li>
                    </ul>
                </q-step>

                <q-step :name="4" title="Exported Datasources" icon="storage" :done="step > 4">
                    <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-m-0 p-p-0">
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
                    </form>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(expDatasource, index) in datasourceData.exportedDatasources" :key="index">
                            <form class="p-fluid p-formgrid p-grid p-m-1">
                                <q-expansion-item expand-separator :label="expDatasource.label" class="p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center">
                                    <span class="p-d-flex p-flex-column p-m-3">
                                        <span>
                                            <b>{{ $t('common.type') }}:</b>
                                            {{ expDatasource.jndi != undefined && expDatasource.jndi != '' ? '(jndi)' : '(jdbc)' }}
                                        </span>
                                        <span v-if="expDatasource.descr">
                                            <b>{{ $t('common.description') }}:</b>
                                            {{ expDatasource.descr }}
                                        </span>
                                        <span v-if="expDatasource.driver">
                                            <b>{{ $t('common.driver') }}:</b>
                                            {{ expDatasource.driver }}
                                        </span>
                                        <span v-if="expDatasource.urlConnection">
                                            <b>{{ $t('common.url') }}:</b>
                                            {{ expDatasource.urlConnection }}
                                        </span>
                                        <span v-if="expDatasource.jndi">
                                            <b>JNDI:</b>
                                            {{ expDatasource.jndi }}
                                        </span>
                                    </span>
                                </q-expansion-item>
                                <p v-if="datasourceData.associatedDatasources[expDatasource.dsId]?.fixed == true" class="p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                    {{ datasourceData.associatedDatasources[expDatasource.dsId].label }}
                                </p>
                                <span v-else class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                    <q-select v-model="datasourceData.associatedDatasources[expDatasource.dsId]" class="datasource-dropdown" style="min-width: 100%; margin-bottom: 0 !important" :options="datasourceData.currentDatasources" option-label="label" clearable outlined dense square />
                                </span>
                            </form>
                        </li>
                    </ul>
                </q-step>

                <template #navigation>
                    <q-stepper-navigation class="p-d-flex p-flex-row">
                        <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
                        <span class="p-ml-auto">
                            <q-btn v-if="step > 1" flat :label="$t('common.back')" class="kn-button kn-button--secondary" @click=";($refs.stepper as any).previous()" />
                            <q-btn :label="step === 4 ? $t('common.finish') : $t('common.next')" class="kn-button kn-button--primary q-ml-sm" :disable="isNextDisabled" @click="goToNextStep" />
                        </span>
                    </q-stepper-navigation>
                </template>
            </q-stepper>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import mainStore from '../../../App.store'
import { AxiosResponse } from 'axios'
import { importExportEmitter } from '../ImportExportEmitter'

export default defineComponent({
    name: 'import-catalog-dialog',
    components: {},
    props: {
        catalogType: { type: String, required: true } // 'DATASET', 'BUSINESS MODEL', 'SCHEMA', 'LAYER'
    },
    emits: ['close', 'imported'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            step: 1,
            uploadedFiles: null as any,
            fileUploadedMessage: '',
            exportedCatalog: [] as any[],
            selectedItems: [] as any[],
            importMode: 'Missing' as 'Missing' | 'Override',
            columns: [
                { name: 'name', label: this.$t('common.name'), field: 'name', align: 'left' as const, sortable: true },
                { name: 'typeCatalog', label: this.$t('importExport.catalog.typeCatalog'), field: 'typeCatalog', align: 'left' as const, sortable: true },
                { name: 'type', label: this.$t('common.type'), field: 'type', align: 'left' as const, sortable: true }
            ],
            rolesData: {
                exportedRoles: [] as any[],
                currentRoles: [] as any[],
                associatedRoles: {} as any
            },
            datasourceData: {
                exportedDatasources: [] as any[],
                currentDatasources: [] as any[],
                associatedDatasources: {} as any
            }
        }
    },
    computed: {
        isNextDisabled() {
            if (this.step === 1) return !this.uploadedFiles
            if (this.step === 2) return this.selectedItems.length === 0
            if (this.step === 3) return this.hasEmptyRole()
            if (this.step === 4) return this.hasEmptyDatasource()
            return false
        }
    },
    methods: {
        closeDialog() {
            this.$emit('close')
        },
        onUpload(file) {
            if (file) {
                this.sendFileForImport()
            }
        },
        goToNextStep() {
            if (this.step === 1) {
                ;(this.$refs.stepper as any).next()
            } else if (this.step === 2) {
                this.associateRoles()
            } else if (this.step === 3) {
                this.associateDatasources()
            } else if (this.step === 4) {
                this.importCatalog()
            }
        },
        sendFileForImport() {
            const formData = new FormData()
            formData.append('exportedArchive', this.uploadedFiles)

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/catalog/import', formData)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS === 'OK') {
                        this.exportedCatalog = (response.data.exportedCatalog || []).filter((item: any) => this.matchesCatalogType(item.typeCatalog))
                        this.selectedItems = []
                        this.fileUploadedMessage = `${(this.uploadedFiles as any).name} ${this.$t('managers.importExportDocs.fileUploadSuccess')}`
                    } else {
                        this.store.setError({
                            title: this.$t('common.error.uploading'),
                            msg: response.data.ERROR || this.$t('managers.importExportDocs.fileUploadFail')
                        })
                    }
                })
                .catch((error) => {
                    this.uploadedFiles = null
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.uploading'), msg: error })
                    this.fileUploadedMessage = `${this.$t('managers.importExportDocs.fileUploadFail')}`
                })
                .finally(() => {
                    this.store.setLoading(false)
                })
        },
        associateRoles() {
            const payload = this.selectedItems.map((item) => ({
                ...item,
                catalogType: this.catalogType
            }))

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/wizard/associateRoles', payload)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS === 'OK') {
                        this.rolesData.exportedRoles = response.data.exportedRoles || []
                        this.rolesData.currentRoles = response.data.currentRoles || []
                        this.rolesData.associatedRoles = response.data.associatedRoles || {}
                        ;(this.$refs.stepper as any).next()
                    } else {
                        this.store.setError({
                            title: this.$t('common.error.generic'),
                            msg: response.data.ERROR || this.$t('common.error.generic')
                        })
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.generic'), msg: error })
                })
                .finally(() => {
                    this.store.setLoading(false)
                })
        },
        hasEmptyRole() {
            const associations = this.rolesData.associatedRoles
            if (Object.keys(associations).length === 0) return false
            for (const key in associations) {
                if (associations.hasOwnProperty(key)) {
                    const role = associations[key]
                    if (!associations[key]?.fixed && (role === null || role === '')) return true
                }
            }
            return false
        },
        getSelectableRoles(expRole) {
            if (!this.rolesData?.currentRoles) return []

            return this.rolesData.currentRoles.filter((role) => {
                return this.currentRoleIsSelectable(role, expRole)
            })
        },
        currentRoleIsSelectable(role, expRole) {
            let roleIndex = -1 as any
            for (const i in this.rolesData.associatedRoles) {
                if (this.rolesData.associatedRoles[i]?.name === role?.name) {
                    roleIndex = i
                }
            }

            if (roleIndex != -1 && roleIndex != expRole.id) {
                return false
            }
            return true
        },
        associateDatasources() {
            const exportedRoles: Array<{ roleAssociateId: any; expRoleId: string }> = []
            for (const key in this.rolesData.associatedRoles) {
                if (this.rolesData.associatedRoles[key]) {
                    exportedRoles.push({ roleAssociateId: this.rolesData.associatedRoles[key].id, expRoleId: key })
                }
            }

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/wizard/associateDataSource', { exportedRoles })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS === 'OK') {
                        this.datasourceData.exportedDatasources = response.data.exportedDatasources || []
                        this.datasourceData.currentDatasources = response.data.currentDatasources || []
                        this.datasourceData.associatedDatasources = response.data.associatedDatasources || {}

                        // Skip step 4 if there are no exported datasources to map
                        if (this.datasourceData.exportedDatasources.length === 0) {
                            this.importCatalog()
                        } else {
                            ;(this.$refs.stepper as any).next()
                        }
                    } else {
                        this.store.setError({
                            title: this.$t('common.error.generic'),
                            msg: response.data.ERROR || this.$t('common.error.generic')
                        })
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.generic'), msg: error })
                })
                .finally(() => {
                    this.store.setLoading(false)
                })
        },
        hasEmptyDatasource() {
            // If there are no exported datasources, skip validation
            if (this.datasourceData.exportedDatasources.length === 0) return false

            const associations = this.datasourceData.associatedDatasources
            if (Object.keys(associations).length === 0) return true
            for (const key in associations) {
                if (associations.hasOwnProperty(key)) {
                    const datasource = associations[key]
                    if (datasource === null || datasource === '') return true
                }
            }
            return false
        },
        importCatalog() {
            const importData = {
                ds: this.selectedItems,
                type: this.importMode,
                associateRoles: this.rolesData.associatedRoles,
                exportedRoles: this.rolesData.exportedRoles,
                associateDatasources: this.datasourceData.associatedDatasources,
                exportedDatasources: this.datasourceData.exportedDatasources
            }

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/catalog/importCatalog', importData)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS === 'OK' || !response.data.STATUS) {
                        this.store.setInfo({
                            title: this.$t('common.toast.success'),
                            msg: this.$t('common.toast.importSuccess')
                        })
                        this.$emit('imported')
                        this.emitCatalogImported()
                        this.closeDialog()
                    } else {
                        this.store.setError({
                            title: this.$t('common.error.importing'),
                            msg: response.data.ERROR || this.$t('common.error.generic')
                        })
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({
                        title: this.$t('common.error.importing'),
                        msg: this.$t('common.error.generic')
                    })
                })
                .finally(() => {
                    this.store.setLoading(false)
                })
        },
        emitCatalogImported() {
            const eventMap = {
                DATASET: 'datasetImported',
                'BUSINESS MODEL': 'businessModelImported',
                SCHEMA: 'schemaImported',
                LAYER: 'layerImported'
            }
            const eventName = eventMap[this.catalogType]
            if (eventName) {
                importExportEmitter.emit(eventName as any)
            }
        },
        matchesCatalogType(typeCatalog: string): boolean {
            // Map frontend catalog types to backend typeCatalog values
            const typeMapping = {
                DATASET: 'DATASET',
                'BUSINESS MODEL': 'BUSINESS MODEL',
                SCHEMA: 'MONDRIAN SCHEMA',
                LAYER: 'Layer'
            }
            return typeCatalog === typeMapping[this.catalogType]
        }
    }
})
</script>

<style lang="scss" scoped>
.import-catalog-dialog .q-card {
    max-width: 90vw;
    min-width: 700px;
    padding: 0 !important;
}

.q-stepper--horizontal .q-stepper__nav {
    padding: 0 12px 12px;
}

.catalog-import-table {
    max-height: 400px;
    :deep(thead tr th) {
        position: sticky;
        z-index: 1;
        background-color: #ffffff;
        top: 0;
    }

    /* prevent scrolling behind sticky top row on focus */
    :deep(tbody) {
        scroll-margin-top: 48px;
    }
}

.roles-list {
    padding: 0;
    list-style-type: none;
    line-height: 1.5em;
    border: 1px solid rgba(0, 0, 0, 0.12);
    overflow: auto;
    max-height: 410px;
    li {
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    li:last-child {
        border: none;
    }
}

.role-name-text {
    word-break: break-word;
    white-space: normal;
}
</style>
