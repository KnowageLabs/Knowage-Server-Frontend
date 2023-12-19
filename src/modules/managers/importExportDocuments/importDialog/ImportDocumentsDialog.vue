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
                                                <b>{{ $t('common.description') }}: </b>{{ expEngines.description }}
                                            </span>
                                            <span>
                                                <b>{{ $t('common.url') }}: </b>{{ expEngines.url }}
                                            </span>
                                            <span>
                                                <b>{{ $t('managers.importExportDocs.driverName') }}: </b>
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
                                                <b>{{ $t('common.type') }}: </b>
                                                {{ expDatasources.jndi != undefined && expDatasources.jndi != '' ? '(jndi)' : '(jdbc)' }}
                                            </span>
                                            <span>
                                                <b>{{ $t('common.description') }}: </b>{{ expDatasources.descr }}
                                            </span>
                                            <span>
                                                <b> {{ $t('common.driver') }}: </b>{{ expDatasources.driver }}
                                            </span>
                                            <span>
                                                <b>{{ $t('common.url') }}: </b>{{ expDatasources.urlConnection }}
                                            </span>
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
                <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-m-0 p-p-0">
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>
                    <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
                </form>

                <div v-if="importData?.notImportable.length != 0">
                    <span class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-p-0">NOT IMPORTABLE</span>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(doc, index) in importData?.notImportable" :key="index">
                            <form class="p-fluid p-formgrid p-grid p-m-1">
                                <q-expansion-item expand-separator :label="doc.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.url') }}: </b>{{ doc.label }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ doc.name }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ doc.description }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                                <q-expansion-item expand-separator :label="doc.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.url') }}: </b>{{ doc.engine.label }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ doc.engine.name }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ doc.engine.description }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                            </form>
                        </li>
                    </ul>
                </div>

                <div v-if="importData.summary.SbiObjects.length != 0">
                    <span class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-p-0">Documents that will be imported </span>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(item, index) in importData.summary.SbiObjects" :key="index">
                            <form class="p-fluid p-formgrid p-grid p-m-1">
                                <q-expansion-item expand-separator :label="item.biobjExp.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.name') }}: </b>{{ item.biobjExp.label }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ item.biobjExp.label }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                                <q-expansion-item expand-separator :label="item.biobjExist.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.name') }}: </b>{{ item.biobjExist.name }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ item.biobjExist.description }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                            </form>
                        </li>
                    </ul>
                </div>

                <div v-if="importData.summary.SbiLov.length != 0">
                    <span class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-p-0">List Of Values</span>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(item, index) in importData.summary.SbiLov" :key="index">
                            <form class="p-fluid p-formgrid p-grid p-m-1">
                                <q-expansion-item expand-separator :label="item.lovExp.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.name') }}: </b>{{ item.lovExp.name }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ item.lovExp.description }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                                <q-expansion-item expand-separator :label="item.lovExist.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.name') }}: </b>{{ item.lovExist.name }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ item.lovExist.description }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                            </form>
                        </li>
                    </ul>
                </div>

                <div v-if="importData.summary.SbiFunctions.length != 0">
                    <span class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-p-0">Functionalities</span>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(item, index) in importData.summary.SbiFunctions" :key="index">
                            <form class="p-fluid p-formgrid p-grid p-m-1">
                                <q-expansion-item expand-separator :label="item.functExp.code" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.name') }}: </b>{{ item.functExp.name }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.path') }}: </b>{{ item.functExp.path }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ item.functExp.description }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                                <q-expansion-item expand-separator :label="item.functExist.code" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.name') }}: </b>{{ item.functExist.name }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.path') }}: </b>{{ item.functExist.path }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ item.functExist.description }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                            </form>
                        </li>
                    </ul>
                </div>

                <div v-if="importData.summary.SbiParameters.length != 0">
                    <span class="p-d-flex p-flex-row p-ai-center p-jc-center kn-toolbar p-m-0 p-p-0">Parameters</span>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(item, index) in importData.summary.SbiParameters" :key="index">
                            <form class="p-fluid p-formgrid p-grid p-m-1">
                                <q-expansion-item expand-separator :label="item.paramExp.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.name') }}: </b>{{ item.paramExp.label }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ item.paramExp.label }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                                <q-expansion-item expand-separator :label="item.paramExist.label" class="p-field p-col-6 p-d-flex p-flex-column p-jc-center p-ai-center p-m-0">
                                    <q-card>
                                        <q-card-section>
                                            <span class="p-d-flex p-flex-column p-m-0">
                                                <span>
                                                    <b>{{ $t('common.name') }}: </b>{{ item.paramExist.name }}
                                                </span>
                                                <span>
                                                    <b>{{ $t('common.description') }}: </b>{{ item.paramExist.description }}
                                                </span>
                                            </span>
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                            </form>
                        </li>
                    </ul>
                </div>
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
                    // this.toggleExportDialog()
                })
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
