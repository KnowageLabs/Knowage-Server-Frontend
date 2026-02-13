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
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>

                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
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
                                            <span v-if="currentRoleIsSelectable(slotProps.option, expRol)">{{ $t(slotProps.option.name) }}</span>
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
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>

                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
                </form>
                <ul class="roles-list p-mt-0">
                    <li v-for="(expEngines, index) in importData.engines.exportedEngines" :key="index">
                        <form class="p-fluid p-formgrid p-grid p-m-1">
                            <q-expansion-item expand-separator :label="expEngines.name" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                <q-card>
                                    <q-card-section>
                                        <span class="p-d-flex p-flex-column p-m-0">
                                            <span>
                                                <b>{{ $t('common.description') }}:</b>
                                                {{ expEngines.description }}
                                            </span>
                                            <span>
                                                <b>{{ $t('common.url') }}:</b>
                                                {{ expEngines.url }}
                                            </span>
                                            <span>
                                                <b>{{ $t('managers.importExportDocs.driverName') }}:</b>
                                                {{ expEngines.driverName }}
                                            </span>
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
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
                </form>
                <ul class="roles-list p-mt-0">
                    <li v-for="(expDatasources, index) in importData.datasources.exportedDatasources" :key="index">
                        <form class="p-fluid p-formgrid p-grid p-m-1">
                            <q-expansion-item expand-separator :label="expDatasources.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                <q-card>
                                    <q-card-section>
                                        <span class="p-d-flex p-flex-column p-m-0">
                                            <span>
                                                <b>{{ $t('common.type') }}:</b>
                                                {{ expDatasources.jndi != undefined && expDatasources.jndi != '' ? '(jndi)' : '(jdbc)' }}
                                            </span>
                                            <span>
                                                <b>{{ $t('common.description') }}:</b>
                                                {{ expDatasources.descr }}
                                            </span>
                                            <span>
                                                <b>{{ $t('common.driver') }}:</b>
                                                {{ expDatasources.driver }}
                                            </span>
                                            <span>
                                                <b>{{ $t('common.url') }}:</b>
                                                {{ expDatasources.urlConnection }}
                                            </span>
                                            <span>
                                                <b>JNDI:</b>
                                                {{ expDatasources.jndi }}
                                            </span>
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
                <div v-if="importData?.notImportable && importData.notImportable.length > 0" class="p-mb-4">
                    <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #ffebee; color: #c62828; font-weight: bold">
                        <i class="fa fa-exclamation-triangle p-mr-2"></i>
                        NOT IMPORTABLE
                    </div>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(doc, index) in importData.notImportable" :key="index" class="p-p-2">
                            <div class="p-d-flex p-flex-column">
                                <span style="font-weight: bold">{{ doc.label }}</span>
                                <span style="font-size: 0.875rem; color: #666">{{ doc.name }}</span>
                                <span style="font-size: 0.875rem; color: #666">Engine: {{ doc.engine.label }}</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <div class="metadata-summary-container">
                    <!-- DOCUMENTS SECTION -->
                    <div v-if="hasDocuments" class="p-mb-4 category-section">
                        <div style="font-weight: bold; font-size: 1rem; margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem">
                            <i class="fa fa-file p-mr-2"></i>Documents
                        </div>
                        <div class="p-d-flex p-flex-row p-gap-3">
                            <!-- New Documents -->
                            <div v-if="importData.summary.toCreateObjects?.documents?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #e8f5e9; color: #2e7d32; font-weight: bold;">
                                    <i class="fa fa-plus-circle p-mr-2"></i>
                                    New
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(doc, index) in importData.summary.toCreateObjects.documents" :key="'new-doc-' + index" class="p-p-2">
                                        {{ doc }}
                                    </li>
                                </ul>
                            </div>
                            <!-- Existing Documents -->
                            <div v-if="importData.summary.existingObjects?.documents?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #fff3e0; color: #e65100; font-weight: bold;">
                                    <i class="fa fa-info-circle p-mr-2"></i>
                                    Existing
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(doc, index) in importData.summary.existingObjects.documents" :key="'exist-doc-' + index" class="p-p-2">
                                        {{ doc }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- DATASETS SECTION -->
                    <div v-if="hasDatasets" class="p-mb-4 category-section">
                        <div style="font-weight: bold; font-size: 1rem; margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem">
                            <i class="fa fa-database p-mr-2"></i>Datasets
                        </div>
                        <div class="p-d-flex p-flex-row p-gap-3">
                            <!-- New Datasets -->
                            <div v-if="importData.summary.toCreateObjects?.datasets?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #e8f5e9; color: #2e7d32; font-weight: bold;">
                                    <i class="fa fa-plus-circle p-mr-2"></i>
                                    New
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(dataset, index) in importData.summary.toCreateObjects.datasets" :key="'new-ds-' + index" class="p-p-2">
                                        {{ dataset }}
                                    </li>
                                </ul>
                            </div>
                            <!-- Existing Datasets -->
                            <div v-if="importData.summary.existingObjects?.datasets?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #fff3e0; color: #e65100; font-weight: bold;">
                                    <i class="fa fa-info-circle p-mr-2"></i>
                                    Existing
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(dataset, index) in importData.summary.existingObjects.datasets" :key="'exist-ds-' + index" class="p-p-2">
                                        {{ dataset }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- LOVS SECTION -->
                    <div v-if="hasLovs" class="p-mb-4 category-section">
                        <div style="font-weight: bold; font-size: 1rem; margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem">
                            <i class="fa fa-list p-mr-2"></i>LOVs
                        </div>
                        <div class="p-d-flex p-flex-row p-gap-3">
                            <!-- New LOVs -->
                            <div v-if="importData.summary.toCreateObjects?.lovs?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #e8f5e9; color: #2e7d32; font-weight: bold;">
                                    <i class="fa fa-plus-circle p-mr-2"></i>
                                    New
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(lov, index) in importData.summary.toCreateObjects.lovs" :key="'new-lov-' + index" class="p-p-2">
                                        {{ lov }}
                                    </li>
                                </ul>
                            </div>
                            <!-- Existing LOVs -->
                            <div v-if="importData.summary.existingObjects?.lovs?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #fff3e0; color: #e65100; font-weight: bold;">
                                    <i class="fa fa-info-circle p-mr-2"></i>
                                    Existing
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(lov, index) in importData.summary.existingObjects.lovs" :key="'exist-lov-' + index" class="p-p-2">
                                        {{ lov }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- ENGINES SECTION -->
                    <div v-if="hasEngines" class="p-mb-4 category-section">
                        <div style="font-weight: bold; font-size: 1rem; margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem">
                            <i class="fa fa-cog p-mr-2"></i>Engines
                        </div>
                        <div class="p-d-flex p-flex-row p-gap-3">
                            <!-- New Engines -->
                            <div v-if="importData.summary.toCreateObjects?.engines?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #e8f5e9; color: #2e7d32; font-weight: bold;">
                                    <i class="fa fa-plus-circle p-mr-2"></i>
                                    New
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(engine, index) in importData.summary.toCreateObjects.engines" :key="'new-engine-' + index" class="p-p-2">
                                        {{ engine }}
                                    </li>
                                </ul>
                            </div>
                            <!-- Existing Engines -->
                            <div v-if="importData.summary.existingObjects?.engines?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #fff3e0; color: #e65100; font-weight: bold;">
                                    <i class="fa fa-info-circle p-mr-2"></i>
                                    Existing
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(engine, index) in importData.summary.existingObjects.engines" :key="'exist-engine-' + index" class="p-p-2">
                                        {{ engine }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- FUNCTIONALITIES SECTION -->
                    <div v-if="hasFunctionalities" class="p-mb-4 category-section">
                        <div style="font-weight: bold; font-size: 1rem; margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem">
                            <i class="fa fa-folder p-mr-2"></i>Functionalities
                        </div>
                        <div class="p-d-flex p-flex-row p-gap-3">
                            <!-- New Functionalities -->
                            <div v-if="importData.summary.toCreateObjects?.functionalities?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #e8f5e9; color: #2e7d32; font-weight: bold;">
                                    <i class="fa fa-plus-circle p-mr-2"></i>
                                    New
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(func, index) in importData.summary.toCreateObjects.functionalities" :key="'new-func-' + index" class="p-p-2">
                                        {{ func }}
                                    </li>
                                </ul>
                            </div>
                            <!-- Existing Functionalities -->
                            <div v-if="importData.summary.existingObjects?.functionalities?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #fff3e0; color: #e65100; font-weight: bold;">
                                    <i class="fa fa-info-circle p-mr-2"></i>
                                    Existing
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(func, index) in importData.summary.existingObjects.functionalities" :key="'exist-func-' + index" class="p-p-2">
                                        {{ func }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- CROSS NAVIGATIONS SECTION -->
                    <div v-if="hasCrossNavigations" class="p-mb-4 category-section">
                        <div style="font-weight: bold; font-size: 1rem; margin-bottom: 1rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem">
                            <i class="fa fa-random p-mr-2"></i>Cross Navigations
                        </div>
                        <div class="p-d-flex p-flex-row p-gap-3">
                            <!-- New Cross Navigations -->
                            <div v-if="importData.summary.toCreateObjects?.crossNavigations?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #e8f5e9; color: #2e7d32; font-weight: bold;">
                                    <i class="fa fa-plus-circle p-mr-2"></i>
                                    New
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(nav, index) in importData.summary.toCreateObjects.crossNavigations" :key="'new-nav-' + index" class="p-p-2">
                                        {{ nav }}
                                    </li>
                                </ul>
                            </div>
                          <!-- Existing Cross Navigations -->
                            <div v-if="importData.summary.existingObjects?.crossNavigations?.length > 0" class="p-flex-1">
                                <div class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-mb-2" style="background-color: #fff3e0; color: #e65100; font-weight: bold;">
                                    <i class="fa fa-info-circle p-mr-2"></i>
                                    Existing
                                </div>
                                <ul class="summary-list p-mt-0">
                                    <li v-for="(nav, index) in importData.summary.existingObjects.crossNavigations" :key="'exist-nav-' + index" class="p-p-2">
                                        {{ nav }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </q-step>
            <template #navigation>
                <q-stepper-navigation class="p-d-flex p-flex-row">
                    <Button class="p-button-text kn-button" :label="$t('common.cancel')" @click="closeDialog" />
                    <span class="p-ml-auto">
                        <Button v-if="step > 1" class="kn-button kn-button--secondary" :label="$t('common.back')" @click=";($refs.stepper as any).previous()" />
                        <Button class="kn-button kn-button--primary p-ml-2" :disabled="disableStep1 || disableStep4" :label="step === 5 ? $t('common.finish') : $t('common.next')" @click="goToNextStep" />
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
            if (this.step === 1) return this.uploadedFiles.length == 0
        },
        disableStep4() {
            if (this.step === 4) return this.hasEmptyDatasource(this.importData.datasources.associatedDatasources)
        },
        hasDocuments() {
            return (this.importData.summary?.toCreateObjects?.documents?.length > 0) || (this.importData.summary?.existingObjects?.documents?.length > 0)
        },
        hasDatasets() {
            return (this.importData.summary?.toCreateObjects?.datasets?.length > 0) || (this.importData.summary?.existingObjects?.datasets?.length > 0)
        },
        hasFunctionalities() {
            return (this.importData.summary?.toCreateObjects?.functionalities?.length > 0) || (this.importData.summary?.existingObjects?.functionalities?.length > 0)
        },
        hasCrossNavigations() {
            return (this.importData.summary?.toCreateObjects?.crossNavigations?.length > 0) || (this.importData.summary?.existingObjects?.crossNavigations?.length > 0)
        },
        hasLovs() {
            return (this.importData.summary?.toCreateObjects?.lovs?.length > 0) || (this.importData.summary?.existingObjects?.lovs?.length > 0)
        },
        hasEngines() {
            return (this.importData.summary?.toCreateObjects?.engines?.length > 0) || (this.importData.summary?.existingObjects?.engines?.length > 0)
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
                case 5:
                    this.importDocuments()
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
                })
        },
        getExportedDatasources() {
            const exportingDatasources = [] as any
            for (const key in this.importData.datasources.associatedDatasources) {
                if (this.importData.datasources.associatedDatasources[key]) exportingDatasources.push({ datasourceAssociateId: this.importData.datasources.associatedDatasources[key].id || this.importData.datasources.associatedDatasources[key].dsId, expDatasourceId: key })
            }

            return exportingDatasources
        },
        //Step 5
        importDocuments() {
            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/associateMetadata', { overwrite: true })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS == 'NON OK') {
                        this.store.setError({ title: this.$t('common.error.uploading'), msg: response.data?.ERROR })
                    } else {
                        this.importData.associationsFileName = response.data.associationsName
                        this.importData.logFileName = response.data.logFileName
                        this.importData.folderName = response.data.folderName

                        if (response.data?.warnings?.length > 0) {
                            response.data.warnings.forEach((i) => {
                                this.store.setWarning({ title: this.$t('managers.importExportDocs.importComplete'), msg: `${this.$t(i.MESSAGE, { count: i.PARAMETERS?.length || 1, parameters: i.PARAMETERS?.toString() })}` })
                            })
                        }

                        this.store.setInfo({ title: this.$t('managers.importExportDocs.importComplete'), msg: `${this.importData.logFileName}` })
                        this.closeDialog()
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.uploading'), msg: error })
                })
                .finally(() => {
                    this.store.setLoading(false)
                })
        },
        hasEmptyDatasource(associatedDatasources) {
            if (Object.keys(associatedDatasources).length === 0) return true
            for (const key in associatedDatasources) {
                if (associatedDatasources.hasOwnProperty(key)) {
                    const datasource = associatedDatasources[key]
                    if (datasource === null || datasource === '') return true
                }
            }
            return false
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
        @extend %kn-button--primary;
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

.metadata-summary-container {
    overflow-y: auto;
    max-height: 600px;
    padding-right: 8px;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;

        &:hover {
            background: #555;
        }
    }
}

.category-section {
    background-color: #fafafa;
    padding: 1rem;
    border-radius: 4px;
    border-left: 4px solid #333;

    .p-gap-3 {
        gap: 1rem;
    }

    .summary-list {
        padding: 0;
        margin: 0;
        list-style: none;
        border: 1px solid rgba(0, 0, 0, 0.12);
        overflow: auto;
        max-height: 300px;

        li {
            padding: 0.75rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            font-size: 0.9rem;
            word-break: break-word;

            &:last-child {
                border-bottom: none;
            }

            &:hover {
                background-color: rgba(0, 0, 0, 0.03);
            }
        }
    }
}

.p-flex-1 {
    flex: 1;
    min-width: 0;
}

.p-gap-3 {
    gap: 1rem;
}
</style>
