<template>
    <q-dialog :model-value="true" persistent class="import-kpi-dialog" square>
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

                <q-step :name="2" title="Select KPIs" icon="assignment" :done="step > 2">
                    <div class="p-mb-3">
                        <q-checkbox v-model="importOptions.overwriteMode" :label="$t('importExport.kpis.importkpi')" />
                        <q-checkbox v-model="importOptions.targetsAndRelatedKpis" :label="$t('importExport.kpis.importTarget')" class="q-ml-md" />
                        <q-checkbox v-model="importOptions.scorecardsAndRelatedKpis" :label="$t('importExport.kpis.importScorecard')" class="q-ml-md" />
                        <q-checkbox v-model="importOptions.schedulersAndRelatedKpis" :label="$t('importExport.kpis.importScheduler')" class="q-ml-md" />
                    </div>

                    <q-table v-model:selected="selectedKpis" :rows="exportedKpis" :columns="columns" row-key="id" selection="multiple" virtual-scroll :rows-per-page-options="[0]" class="kn-table kpi-import-table" :no-data-label="$t('common.info.noDataFound')" dense square>
                        <template #body-cell-name="props">
                            <q-td :props="props">
                                {{ props.row.name }}
                            </q-td>
                        </template>
                        <template #body-cell-formula="props">
                            <q-td :props="props">
                                {{ props.row.formula }}
                            </q-td>
                        </template>
                        <template #body-cell-thresholdName="props">
                            <q-td :props="props">
                                {{ props.row.thresholdName || '-' }}
                            </q-td>
                        </template>
                        <template #body-cell-targetsNames="props">
                            <q-td :props="props">
                                {{ props.row.targetsNames || '-' }}
                            </q-td>
                        </template>
                    </q-table>
                </q-step>

                <q-step :name="3" title="Exported Datasources" icon="storage" :done="step > 3">
                    <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-m-0 p-p-0">
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
                    </form>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(expDatasource, index) in datasourceAssociation.exportedDatasources" :key="index">
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
                                <p v-if="datasourceAssociation.associatedDatasources[expDatasource.dsId]?.fixed == true" class="p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                    {{ datasourceAssociation.associatedDatasources[expDatasource.dsId].label }}
                                </p>
                                <span v-else class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                    <q-select v-model="datasourceAssociation.associatedDatasources[expDatasource.dsId]" class="datasource-dropdown" style="min-width: 100%; margin-bottom: 0 !important" :options="datasourceAssociation.currentDatasources" option-label="label" clearable outlined dense square />
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
                            <q-btn :label="step === 3 ? $t('common.finish') : $t('common.next')" class="kn-button kn-button--primary q-ml-sm" :disable="isNextDisabled" @click="goToNextStep" />
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
    name: 'import-kpi-dialog',
    components: {},
    props: {},
    emits: ['close'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            step: 1,
            uploadedFiles: null as any,
            fileUploadedMessage: '',
            exportedKpis: [] as any[],
            selectedKpis: [] as any[],
            importOptions: {
                overwriteMode: false,
                targetsAndRelatedKpis: false,
                scorecardsAndRelatedKpis: false,
                schedulersAndRelatedKpis: false
            },
            columns: [
                { name: 'name', label: this.$t('common.name'), field: 'name', align: 'left' as const, sortable: true },
                { name: 'formula', label: this.$t('common.formula'), field: 'formula', align: 'left' as const, sortable: true },
                { name: 'thresholdName', label: this.$t('kpi.alert.threshold'), field: 'thresholdName', align: 'left' as const, sortable: true },
                { name: 'targetsNames', label: this.$t('common.targets'), field: 'targetsNames', align: 'left' as const, sortable: true }
            ],
            datasourceAssociation: {
                exportedDatasources: [] as any[],
                currentDatasources: [] as any[],
                associatedDatasources: {} as any
            }
        }
    },
    computed: {
        isNextDisabled() {
            if (this.step === 1) return !this.uploadedFiles
            if (this.step === 2) return this.selectedKpis.length === 0
            if (this.step === 3) return this.hasEmptyDatasource()
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
                this.associateDatasources()
            } else if (this.step === 3) {
                this.importKpis()
            }
        },
        sendFileForImport() {
            const formData = new FormData()
            formData.append('exportedArchive', this.uploadedFiles)

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/kpis/uploadArchive', formData)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS === 'OK') {
                        this.exportedKpis = response.data.exportedKpis || []
                        this.selectedKpis = []
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
        associateDatasources() {
            const payload = {
                kpis: this.selectedKpis,
                overwrite: this.importOptions.overwriteMode,
                targetsAndRelatedKpis: this.importOptions.targetsAndRelatedKpis,
                scorecardsAndRelatedKpis: this.importOptions.scorecardsAndRelatedKpis,
                schedulersAndRelatedKpis: this.importOptions.schedulersAndRelatedKpis
            }

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/kpis/associateDataSource', payload)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS === 'OK') {
                        this.datasourceAssociation.exportedDatasources = response.data.exportedDatasources || []
                        this.datasourceAssociation.currentDatasources = response.data.currentDatasources || []
                        this.datasourceAssociation.associatedDatasources = response.data.associatedDatasources || {}
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
        hasEmptyDatasource() {
            const associations = this.datasourceAssociation.associatedDatasources
            if (Object.keys(associations).length === 0) return true
            for (const key in associations) {
                if (associations.hasOwnProperty(key)) {
                    const datasource = associations[key]
                    if (datasource === null || datasource === '') return true
                }
            }
            return false
        },
        importKpis() {
            const importData = {
                kpis: this.selectedKpis,
                overwrite: this.importOptions.overwriteMode,
                targetsAndRelatedKpis: this.importOptions.targetsAndRelatedKpis,
                scorecardsAndRelatedKpis: this.importOptions.scorecardsAndRelatedKpis,
                schedulersAndRelatedKpis: this.importOptions.schedulersAndRelatedKpis,
                associateDatasources: this.datasourceAssociation.associatedDatasources,
                exportedDatasources: this.datasourceAssociation.exportedDatasources
            }

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/kpis/import', importData)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.success === true) {
                        this.store.setInfo({
                            title: this.$t('common.toast.success'),
                            msg: this.$t('managers.importExportDocs.importComplete')
                        })
                        importExportEmitter.emit('kpisImported')
                    } else {
                        this.store.setError({
                            title: this.$t('common.error.importing'),
                            msg: response.data.error || this.$t('common.error.generic')
                        })
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({
                        title: this.$t('common.error.importing'),
                        msg: error
                    })
                })
                .finally(() => {
                    //BE has an error where if the upload fails, any attempt of calling associateDataSource will return incorrect data, thats why im closing the dialog and making the user go through the whole process again
                    this.store.setLoading(false)
                    this.closeDialog()
                })
        }
    }
})
</script>

<style lang="scss" scoped>
.import-kpi-dialog .q-card {
    max-width: 90vw;
    min-width: 700px;
    padding: 0 !important;
}

.q-stepper--horizontal .q-stepper__nav {
    padding: 0 12px 12px;
}

.kpi-import-table {
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
</style>
