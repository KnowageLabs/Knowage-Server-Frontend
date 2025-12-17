<template>
    <q-dialog :model-value="true" persistent class="import-glossary-dialog" square>
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

                <q-step :name="2" title="Select Glossaries" icon="assignment" :done="step > 2">
                    <div class="p-mb-3">
                        <q-radio v-model="importType" val="Missing" :label="$t('importExport.glossary.addMissing')" />
                        <q-radio v-model="importType" val="Override" :label="$t('importExport.glossary.override')" class="q-ml-md" />
                    </div>

                    <q-table v-model:selected="selectedGlossaries" :rows="exportedGlossaries" :columns="columns" row-key="glossaryId" selection="multiple" virtual-scroll :rows-per-page-options="[0]" class="kn-table glossary-import-table" :no-data-label="$t('common.info.noDataFound')" dense square>
                        <template #body-cell-glossaryCd="props">
                            <q-td :props="props">
                                {{ props.row.glossaryCd || '-' }}
                            </q-td>
                        </template>
                        <template #body-cell-glossaryNm="props">
                            <q-td :props="props">
                                {{ props.row.glossaryNm }}
                            </q-td>
                        </template>
                        <template #body-cell-glossaryDs="props">
                            <q-td :props="props">
                                {{ props.row.glossaryDs || '-' }}
                            </q-td>
                        </template>
                    </q-table>
                </q-step>

                <template #navigation>
                    <q-stepper-navigation class="p-d-flex p-flex-row">
                        <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
                        <span class="p-ml-auto">
                            <q-btn v-if="step > 1" flat :label="$t('common.back')" class="kn-button kn-button--secondary" @click=";($refs.stepper as any).previous()" />
                            <q-btn :label="step === 2 ? $t('common.finish') : $t('common.next')" class="kn-button kn-button--primary q-ml-sm" :disable="isNextDisabled" @click="goToNextStep" />
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
    name: 'import-glossary-dialog',
    components: {},
    props: {},
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
            exportedGlossaries: [] as any[],
            selectedGlossaries: [] as any[],
            importType: 'Missing' as 'Missing' | 'Override',
            columns: [
                { name: 'glossaryCd', label: this.$t('managers.glossary.code'), field: 'glossaryCd', align: 'left' as const, sortable: true },
                { name: 'glossaryNm', label: this.$t('common.name'), field: 'glossaryNm', align: 'left' as const, sortable: true },
                { name: 'glossaryDs', label: this.$t('common.description'), field: 'glossaryDs', align: 'left' as const, sortable: true }
            ]
        }
    },
    computed: {
        isNextDisabled() {
            if (this.step === 1) return !this.uploadedFiles
            if (this.step === 2) return this.selectedGlossaries.length === 0
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
                this.importGlossaries()
            }
        },
        sendFileForImport() {
            const formData = new FormData()
            formData.append('exportedArchive', this.uploadedFiles)

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/glossary/import', formData)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS === 'OK') {
                        this.exportedGlossaries = response.data.glossaryListFromFile || []
                        this.selectedGlossaries = []
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
        importGlossaries() {
            const importData = {
                type: this.importType,
                glossaryList: this.selectedGlossaries
            }

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/glossary/importGlossaryintoDB', importData)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS === 'OK' || !response.data.STATUS) {
                        this.store.setInfo({
                            title: this.$t('common.toast.success'),
                            msg: this.$t('common.toast.importSuccess')
                        })
                        this.$emit('imported')
                        importExportEmitter.emit('glossaryImported')
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
                        msg: error
                    })
                })
                .finally(() => {
                    this.store.setLoading(false)
                })
        }
    }
})
</script>

<style lang="scss" scoped>
.import-glossary-dialog .q-card {
    max-width: 90vw;
    min-width: 700px;
    padding: 0 !important;
}

.q-stepper--horizontal .q-stepper__nav {
    padding: 0 12px 12px;
}

.glossary-import-table {
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
</style>
