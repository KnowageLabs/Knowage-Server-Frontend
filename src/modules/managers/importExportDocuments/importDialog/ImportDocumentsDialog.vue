<template>
    <Dialog :auto-z-index="false" class="kn-dialog--toolbar--primary import-docs-dialog" :visible="true" :header="$t('common.import')" :closable="false" modal>
        <q-stepper ref="stepper" v-model="step" color="primary" animated>
            <q-step :name="1" title="Upload File" icon="settings" :done="step > 1">
                <FileUpload name="importDocuments" :choose-label="$t('common.choose')" :custom-upload="true" :auto="true" :max-file-size="10000000" accept="application/zip, application/x-zip-compressed" :multiple="false" :file-limit="1" @uploader="onUpload" @remove="onDelete">
                    <template #empty>
                        <p v-if="!disableStep1">{{ fileUploadedMessage }}</p>
                        <p v-else>{{ $t('common.dragAndDropFileHere') }}</p>
                    </template>
                </FileUpload>
            </q-step>

            <q-step :name="2" title="Exported Roles" icon="create_new_folder" :done="step > 2">
                <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-m-0 p-p-0">
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">SOURCE</b>

                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">TARGET</b>
                </form>
                <ul class="roles-list p-mt-0">
                    <li v-for="(expRol, index) in importData.roles.exportedRoles" :key="index">
                        <form class="p-fluid p-formgrid p-grid p-m-1">
                            <p class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                {{ expRol.name }}
                            </p>

                            <p v-if="importData.roles.associatedRoles[expRol.id]?.fixed == true" class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                {{ importData.roles.associatedRoles[expRol.id].name }}
                            </p>

                            <span v-else class="p-field p-float-label p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                <Dropdown id="datasource" v-model="importData.roles.associatedRoles[expRol.id]" class="datasource-dropdown kn-material-input" panel-class="import-export-dropdown" style="min-width: 50%" :options="importData.roles.currentRoles" option-label="name" show-clear>
                                    <template #option="slotProps">
                                        <div :class="[{ 'datasource-dropdown-option': currentRoleIsSelectable(slotProps.option, expRol) }]">
                                            <span v-if="currentRoleIsSelectable(slotProps.option, expRol)">{{ $t(slotProps.option.name) }} </span>
                                        </div>
                                    </template>
                                </Dropdown>
                            </span>
                        </form>
                    </li>
                </ul>
            </q-step>

            <q-step :name="3" title="Exported Engines" icon="assignment" :done="step > 3">
                <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-m-0 p-p-0">
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">SOURCE</b>

                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">TARGET</b>
                </form>
                <ul class="roles-list p-mt-0">
                    <li v-for="(expEngines, index) in importData.engines.exportedEngines" :key="index">
                        <form class="p-fluid p-formgrid p-grid p-m-1">
                            <q-expansion-item expand-separator :label="expEngines.name" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                <q-card>
                                    <q-card-section>
                                        <span class="p-d-flex p-flex-column p-m-0">
                                            <!-- <b>{{ expEngines.name }}</b> -->
                                            <span><b>Description: </b>{{ expEngines.description }}</span>
                                            <span><b>URL: </b>{{ expEngines.url }}</span>
                                            <span><b>Driver Name: </b>{{ expEngines.driverName }}</span>
                                        </span>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>

                            <p v-if="importData.engines.associatedEngines[expEngines.id]?.fixed == true" class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                {{ importData.engines.associatedEngines[expEngines.id].name }}
                            </p>

                            <span v-else class="p-field p-float-label p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                <Dropdown id="datasource" v-model="importData.engines.associatedEngines[expEngines.id]" class="kn-material-input" style="min-width: 50%" :options="importData.engines.currentEngines" option-label="name" show-clear />
                            </span>
                        </form>
                    </li>
                </ul>
            </q-step>

            <q-step :name="4" title="Exported Datasources" icon="add_comment" :done="step > 4">
                <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-m-0 p-p-0">
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">SOURCE</b>
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">TARGET</b>
                </form>
                <ul class="roles-list p-mt-0">
                    <li v-for="(expDatasources, index) in importData.datasources.exportedDatasources" :key="index">
                        <form class="p-fluid p-formgrid p-grid p-m-1">
                            <q-expansion-item expand-separator :label="expDatasources.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                <q-card>
                                    <q-card-section>
                                        <span class="p-d-flex p-flex-column p-m-0">
                                            <span><b>Type: </b>{{ expDatasources.jndi != undefined && expDatasources.jndi != '' ? '(jndi)' : '(jdbc)' }}</span>
                                            <span><b>Description: </b>{{ expDatasources.descr }}</span>
                                            <span><b>Driver: </b>{{ expDatasources.driver }}</span>
                                            <span><b>URL: </b>{{ expDatasources.urlConnection }}</span>
                                            <span><b>JNDI: </b>{{ expDatasources.jndi }}</span>
                                        </span>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                            <p v-if="importData.datasources.associatedDatasources[expDatasources.dsId]?.fixed == true" class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                {{ importData.datasources.associatedDatasources[expDatasources.dsId].label }}
                            </p>

                            <span v-else class="p-field p-float-label p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                <Dropdown id="datasource" v-model="importData.datasources.associatedDatasources[expDatasources.dsId]" class="kn-material-input" style="min-width: 50%" :options="importData.datasources.currentDatasources" option-label="label" show-clear />
                            </span>
                        </form>
                    </li>
                </ul>
            </q-step>
            <q-step :name="5" title="Metadata" icon="add_comment" :done="step > 5">
                Try out different ad text to see what brings in the most customers, and learn how to enhance your ads using features like ad extensions. If you run into any problems with your ads, find out how to tell if they're running and how to resolve approval issues.
            </q-step>
            <template #navigation>
                <q-stepper-navigation class="p-d-flex p-flex-row">
                    <!-- <q-btn @click="$refs.stepper.next()" color="primary" :label="step === 4 ? 'Finish' : 'Continue'" />
                    <q-btn v-if="step > 1" flat color="primary" @click="$refs.stepper.previous()" label="Back" class="q-ml-sm" /> -->

                    <Button class="p-button-text kn-button" :label="$t('common.cancel')" @click="closeDialog" />
                    <span class="p-ml-auto">
                        <Button v-if="step > 1" class="kn-button kn-button--secondary" :label="$t('common.back')" @click=";($refs.stepper as any).previous()" />
                        <Button class="kn-button kn-button--primary p-ml-2" :disabled="disableStep1" :label="step === 5 ? $t('common.finish') : $t('common.next')" @click="goToNextStep" />
                    </span>
                </q-stepper-navigation>
            </template>
        </q-stepper>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import FileUpload from 'primevue/fileupload'
import mainStore from '../../../../App.store'
import Dialog from 'primevue/dialog'
import { AxiosResponse } from 'axios'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'import-dialog',
    components: { FileUpload, Dialog, Dropdown },
    props: {},
    emits: ['close', 'import'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            steps: [{ label: 'Upload File' }, { label: 'Exported Roles' }, { label: 'Exported Engines' }, { label: 'Exported Datasources' }, { label: 'Metadata' }],
            step: 1,
            uploadedFiles: [],
            loading: false,
            fileUploadedMessage: '',
            importData: {} as any
        }
    },
    computed: {
        disableStep1() {
            return this.uploadedFiles.length == 0
        }
    },
    created() {},
    methods: {
        closeDialog() {
            this.$emit('close')
        },
        emitImport(): void {
            this.$emit('import', { files: this.uploadedFiles })
        },
        onDelete(idx) {
            this.uploadedFiles.splice(idx)
        },
        onUpload(data) {
            // eslint-disable-next-line
            // @ts-ignore
            this.uploadedFiles[0] = data.files[0]

            console.log(this.uploadedFiles)
            this.sendFileForImport()
        },
        goToNextStep() {
            switch (this.step) {
                case 1:
                    ;(this.$refs.stepper as any).next()
                    break
                case 2:
                    this.sendExportedRolesForImport()
                    break
                case 3:
                    this.sendExportedEnginesForImport()
                    break
                case 4:
                    this.sendExportedDatasourcesForImport()
                    break
                default:
                    break
            }
        },
        //Step 1
        sendFileForImport() {
            const importParams = new FormData()
            importParams.append('exportedArchive', this.uploadedFiles[0])
            importParams.append('importAssociationKind', 'noAssociations')

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/import', importParams)
                .then((response: AxiosResponse<any>) => {
                    console.log(this.uploadedFiles[0])
                    console.log(response)
                    this.importData.roles = { currentRoles: response.data.currentRoles, exportedRoles: response.data.exportedRoles, associatedRoles: response.data.associatedRoles }
                    this.importData.notImportable = response.data.notImportable ?? []

                    this.fileUploadedMessage = `${(this.uploadedFiles[0] as any).name} ${this.$t('managers.importExportDocs.fileUploadSuccess')}`
                })
                .catch((error) => {
                    this.uploadedFiles = []
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.uploading'), msg: error })

                    this.fileUploadedMessage = `${this.$t('managers.importExportDocs.fileUploadFail')}`
                })
                .finally(() => {
                    this.store.setLoading(false)
                    // this.toggleExportDialog()
                })
        },
        //Step 2
        sendExportedRolesForImport() {
            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/associateRoles', this.getExportedRoles())
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS == 'NON OK') {
                        this.store.setError({ title: this.$t('common.error.uploading'), msg: response.data?.ERROR })
                    } else {
                        this.importData.engines = { currentEngines: response.data.currentEngines, exportedEngines: response.data.exportedEngines, associatedEngines: response.data.associatedEngines }
                        ;(this.$refs.stepper as any).next()
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.uploading'), msg: error })
                })
                .finally(() => {
                    this.store.setLoading(false)
                    // this.toggleExportDialog()
                })
        },
        getExportedRoles() {
            const exportingRoles = [] as any
            for (const key in this.importData.roles.associatedRoles) {
                if (this.importData.roles.associatedRoles[key]) exportingRoles.push({ roleAssociateId: this.importData.roles.associatedRoles[key].id, expRoleId: key })
            }

            console.log(this.importData.roles)

            return exportingRoles
        },
        currentRoleIsSelectable(role, exprole) {
            //importData.roles.currentRoles
            let roleinl = -1 as any
            for (const i in this.importData.roles.associatedRoles) {
                if (this.importData.roles.associatedRoles[i]?.name == role?.name) {
                    roleinl = i
                }
            }

            //roles.exportedRoles
            if (roleinl != -1 && roleinl != exprole.id) {
                return false
            }
            return true
        },
        //Step 3
        sendExportedEnginesForImport() {
            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/associateEngines', this.getExportedEngines())
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS == 'NON OK') {
                        this.store.setError({ title: this.$t('common.error.uploading'), msg: response.data?.ERROR })
                    } else {
                        this.importData.datasources = { currentDatasources: response.data.currentDatasources, exportedDatasources: response.data.exportedDatasources, associatedDatasources: response.data.associatedDatasources }
                        ;(this.$refs.stepper as any).next()
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.uploading'), msg: error })
                })
                .finally(() => {
                    this.store.setLoading(false)
                    // this.toggleExportDialog()
                })
        },
        getExportedEngines() {
            const exportingEngines = [] as any
            for (const key in this.importData.engines.associatedEngines) {
                if (this.importData.engines.associatedEngines[key]) exportingEngines.push({ engineAssociateId: this.importData.engines.associatedEngines[key].id, expEngineId: key })
            }

            return exportingEngines
        },
        //Step 4
        sendExportedDatasourcesForImport() {
            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/associateDatasources', this.getExportedDatasources())
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS == 'NON OK') {
                        this.store.setError({ title: this.$t('common.error.uploading'), msg: response.data?.ERROR })
                    } else {
                        this.importData.summary = response.data
                        console.log(this.importData)
                        ;(this.$refs.stepper as any).next()
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.uploading'), msg: error })
                })
                .finally(() => {
                    this.store.setLoading(false)
                    // this.toggleExportDialog()
                })
        },
        getExportedDatasources() {
            const exportingDatasources = [] as any
            for (const key in this.importData.datasources.associatedDatasources) {
                if (this.importData.datasources.associatedDatasources[key]) exportingDatasources.push({ datasourceAssociateId: this.importData.datasources.associatedDatasources[key].id, expDatasourceId: key })
            }

            return exportingDatasources
        }
    }
})
</script>
<style lang="scss">
.import-docs-dialog .p-dialog-header,
.import-docs-dialog .p-dialog-content {
    max-width: 1200px;
    padding: 0;
}
.q-stepper--horizontal .q-stepper__nav {
    padding: 0 12px 12px;
}

.p-fileupload-buttonbar {
    border: none;

    .p-button:not(.p-fileupload-choose) {
        display: none;
    }

    .p-fileupload-choose {
        @extend .kn-button--primary;
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

.import-export-dropdown {
    li {
        padding: 0 !important;
    }
}

.datasource-dropdown-option {
    padding: 0.75em;
}
</style>
