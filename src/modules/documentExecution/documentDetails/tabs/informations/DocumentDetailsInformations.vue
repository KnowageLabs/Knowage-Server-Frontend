<template>
    <div class="dd-info-layout">
        <q-scroll-area class="dd-scroll">
            <div class="dd-grid">
                <!-- ══════ LEFT COLUMN ══════ -->
                <div class="dd-col">
                    <!-- Template -->
                    <q-card>
                        <q-card-section class="q-py-sm">
                            <div class="dd-section-label">{{ $t('documentExecution.documentDetails.history.template') }}</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section>
                            <div v-if="templates.length === 0">
                                <q-input :model-value="templateToUpload.name" :placeholder="$t('documentExecution.documentDetails.info.uploadTemplate')" dense outlined readonly class="cursor-pointer" @click="setUploadType">
                                    <template #prepend>
                                        <q-icon name="description" color="primary" />
                                    </template>
                                    <template #append>
                                        <q-spinner v-if="uploading" color="primary" size="xs" />
                                        <q-icon v-else name="upload" color="grey-6" />
                                    </template>
                                </q-input>
                                <KnInputFile v-if="!uploading" label="" :change-function="setTemplateForUpload" :trigger-input="triggerUpload" />
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Identity -->
                    <q-card>
                        <q-card-section class="q-py-sm">
                            <div class="dd-section-label">{{ $t('documentExecution.documentDetails.info.infoTitle') }}</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section>
                            <div class="row q-col-gutter-sm">
                                <div class="col-6">
                                    <q-input outlined dense hide-bottom-space v-model="v$.document.label.$model" :label="$t('common.label') + ' *'" :error="v$.document.label.$invalid && v$.document.label.$dirty" :error-message="getValidationErrorMessage(v$.document.label, $t('common.label'))" @blur="v$.document.label.$touch()" @update:model-value="$emit('touched')" />
                                </div>
                                <div class="col-6">
                                    <q-input outlined dense hide-bottom-space v-model="v$.document.name.$model" :label="$t('common.name') + ' *'" :error="v$.document.name.$invalid && v$.document.name.$dirty" :error-message="getValidationErrorMessage(v$.document.name, $t('common.name'))" @blur="v$.document.name.$touch()" @update:model-value="$emit('touched')" />
                                </div>
                                <div class="col-12">
                                    <q-input outlined dense hide-bottom-space v-model="v$.document.description.$model" type="textarea" :rows="3" :label="$t('common.description')" :error="v$.document.description.$invalid && v$.document.description.$dirty" :error-message="getValidationErrorMessage(v$.document.description, $t('common.description'))" @blur="v$.document.description.$touch()" @update:model-value="$emit('touched')" />
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Media -->
                    <q-card>
                        <q-card-section class="q-py-sm row items-center">
                            <div class="dd-section-label col">{{ $t('common.media') }}</div>
                            <q-btn v-if="document.previewFile" class="q-ma-none q-pa-none" flat round dense icon="delete" size="sm" color="red" @click.stop="$emit('deleteImage')">
                                <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                            </q-btn>
                        </q-card-section>
                        <q-separator />
                        <q-card-section>
                            <div class="row q-col-gutter-md">
                                <div class="col-12">
                                    <div v-if="imagePreviewUrl" class="dd-img-wrap rounded-borders" @click="setImageUploadType">
                                        <q-img :src="imagePreviewUrl" fit="contain" class="rounded-borders dd-preview-img">
                                            <div class="absolute-full flex flex-center column dd-img-overlay">
                                                <q-icon name="photo_camera" size="1.5rem" color="white" />
                                                <span class="text-white text-caption q-mt-xs">{{ $t('documentExecution.documentDetails.info.uploadTemplate') }}</span>
                                            </div>
                                        </q-img>
                                    </div>
                                    <div v-else class="dd-upload-zone rounded-borders cursor-pointer column flex-center" @click="setImageUploadType">
                                        <q-icon name="image" size="2rem" color="grey-5" />
                                        <span class="text-caption text-grey-6 q-mt-sm">{{ $t('documentExecution.documentDetails.info.previewImage') }}</span>
                                        <span class="text-caption text-grey-4">PNG · JPG · JPEG</span>
                                    </div>
                                    <KnInputFile :change-function="setImageForUpload" accept=".png, .jpg, .jpeg" :trigger-input="triggerImageUpload" />
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Configuration -->
                    <q-card>
                        <q-card-section class="q-py-sm row items-center justify-between">
                            <div class="dd-section-label">{{ $t('common.configuration') }}</div>
                            <q-btn v-if="designerButtonVisible" class="q-ma-none q-pa-none" flat dense size="sm" color="primary" :label="$t('documentExecution.olap.openDesigner')" @click="openDesignerConfirm" />
                        </q-card-section>
                        <q-separator />
                        <q-card-section>
                            <div class="row q-col-gutter-sm">
                                <div class="col-6">
                                    <q-select
                                        outlined
                                        dense
                                        emit-value
                                        map-options
                                        hide-bottom-space
                                        v-model="v$.document.typeCode.$model"
                                        :options="documentTypes"
                                        option-label="translatedValueName"
                                        option-value="valueCd"
                                        :label="$t('importExport.catalogFunction.column.type') + ' *'"
                                        :error="v$.document.typeCode.$invalid && v$.document.typeCode.$dirty"
                                        :error-message="getValidationErrorMessage(v$.document.typeCode, $t('importExport.catalogFunction.column.type'))"
                                        @blur="v$.document.typeCode.$touch()"
                                        @update:model-value="onTypeChange"
                                    />
                                </div>
                                <div class="col-6">
                                    <q-select
                                        outlined
                                        dense
                                        emit-value
                                        map-options
                                        hide-bottom-space
                                        v-model="v$.document.engine.$model"
                                        :options="filteredEngines"
                                        option-label="name"
                                        option-value="label"
                                        :disable="!document.typeCode || document.typeCode === ''"
                                        :label="$t('documentExecution.documentDetails.info.engine') + ' *'"
                                        :error="v$.document.engine.$invalid && v$.document.engine.$dirty"
                                        :error-message="getValidationErrorMessage(v$.document.engine, $t('documentExecution.documentDetails.info.engine'))"
                                        @blur="v$.document.engine.$touch()"
                                        @update:model-value="$emit('touched')"
                                    >
                                        <template #append>
                                            <q-icon name="info" color="grey" size="xs">
                                                <q-tooltip>{{ $t('documentExecution.documentDetails.info.engineHint') }}</q-tooltip>
                                            </q-icon>
                                        </template>
                                    </q-select>
                                </div>
                                <div v-if="isDataSourceVisible" class="col-6">
                                    <q-select outlined dense emit-value map-options v-model="document.dataSourceLabel" :options="availableDatasources" option-label="label" option-value="label" :label="$t('managers.businessModelManager.dataSource')" />
                                </div>
                                <div class="col-6">
                                    <q-input outlined dense readonly :model-value="dataset.name" :label="$t('common.dataset')" @click="showDatasetDialog = true">
                                        <template #append>
                                            <q-btn flat round dense icon="search" size="sm" @click="showDatasetDialog = true" />
                                        </template>
                                    </q-input>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <!-- Publishing -->
                    <q-card>
                        <q-card-section class="q-py-sm">
                            <div class="dd-section-label">{{ $t('common.state') }}</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section>
                            <div class="row q-col-gutter-sm">
                                <div class="col-6">
                                    <q-select
                                        outlined
                                        dense
                                        emit-value
                                        map-options
                                        hide-bottom-space
                                        v-model="v$.document.stateCode.$model"
                                        :options="availableStates"
                                        option-label="translatedValueName"
                                        option-value="valueCd"
                                        :label="$t('common.state') + ' *'"
                                        :error="v$.document.stateCode.$invalid && v$.document.stateCode.$dirty"
                                        :error-message="getValidationErrorMessage(v$.document.stateCode, $t('common.state'))"
                                        @blur="v$.document.stateCode.$touch()"
                                        @update:model-value="$emit('touched')"
                                    />
                                </div>
                                <div class="col-6">
                                    <q-input outlined dense v-model="document.refreshSeconds" type="number" :label="$t('documentExecution.documentDetails.info.refresh')">
                                        <template #append>
                                            <span class="text-caption text-grey-5">sec</span>
                                            <q-icon class="q-ml-sm" name="info" color="grey" size="xs">
                                                <q-tooltip>{{ $t('documentExecution.documentDetails.info.refreshHint') }}</q-tooltip>
                                            </q-icon>
                                        </template>
                                    </q-input>
                                </div>
                                <div class="col-12">
                                    <div class="dd-toggles-row">
                                        <q-toggle v-model="document.visible" :label="$t('common.visible')" dense />
                                        <q-toggle v-model="lockedByUser" :label="$t('common.locked')" dense @update:model-value="setIsLockedByUser" />
                                    </div>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <!-- ══════ RIGHT COLUMN ══════ -->
                <div class="dd-col">
                    <!-- Parameters panel position (only when drivers exist) -->
                    <q-card v-if="document.drivers && document.drivers.length > 0">
                        <q-card-section class="q-py-sm">
                            <div class="dd-section-label">{{ $t('documentExecution.documentDetails.info.parametersPanelPosition') }}</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section>
                            <q-select outlined dense emit-value map-options v-model="document.parametersRegion" :options="driversPositions" :option-label="translatedLabel" option-value="value" :label="$t('documentExecution.documentDetails.info.positionTitle')">
                                <template #option="slotProps">
                                    <q-item v-bind="slotProps.itemProps">
                                        <q-item-section>
                                            <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </template>
                            </q-select>
                        </q-card-section>
                    </q-card>

                    <!-- Visibility Restrictions -->
                    <q-card>
                        <q-card-section class="q-py-sm row items-center">
                            <div class="dd-section-label col">{{ $t('documentExecution.documentDetails.info.restrictionsTitle') }}</div>
                            <q-btn class="q-ma-none q-pa-none" flat round dense icon="delete_sweep" size="sm" color="red" :disable="!document.profiledVisibility" @click="clearAllRestrictions">
                                <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                            </q-btn>
                        </q-card-section>
                        <q-separator />
                        <q-card-section>
                            <div class="row q-col-gutter-sm items-end q-mb-sm">
                                <div class="col">
                                    <q-select outlined dense emit-value map-options v-model="visibilityAttribute" :options="availableAttributes" option-label="attributeName" option-value="attributeName" :label="$t('documentExecution.documentDetails.info.attribute')" />
                                </div>
                                <div class="col-auto text-grey-5 q-pb-sm text-h6">=</div>
                                <div class="col">
                                    <q-input outlined dense v-model="restrictionValue" :label="$t('documentExecution.documentDetails.info.restrictionValueHint')" />
                                </div>
                                <div class="col-auto q-pb-xs">
                                    <q-btn flat round dense icon="add_circle" color="primary" :disable="!visibilityAttribute" @click="addRestriction">
                                        <q-tooltip>{{ $t('common.add') }}</q-tooltip>
                                    </q-btn>
                                </div>
                            </div>
                            <q-input outlined dense readonly type="textarea" :rows="2" :model-value="document.profiledVisibility" :label="$t('documentExecution.documentDetails.info.profiledVisibility')" />
                        </q-card-section>
                    </q-card>

                    <!-- Folders -->
                    <q-card>
                        <q-card-section class="q-py-sm">
                            <div class="dd-section-label">{{ $t('documentExecution.documentDetails.info.visibilityLocationTitle') }}</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="q-pa-none q-ma-none">
                            <DocumentDetailsTree :prop-functionalities="folders" :prop-selected-folders="document.functionalities" @selected="setFunctionality" />
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </q-scroll-area>

        <DatasetDialog v-if="showDatasetDialog" :selected-dataset="selectedDataset" :visible="showDatasetDialog" @closeDialog="showDatasetDialog = false" @saveSelectedDataset="saveSelectedDataset" />
    </div>
</template>

<script lang="ts">
import { iDocument, iDataSource, iEngine, iTemplate, iAttribute, iFolder } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { defineComponent, PropType } from 'vue'
import { useRouter } from 'vue-router'
import { createValidations } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import { mapState } from 'pinia'
import { startOlap } from '../../dialogs/olapDesignerDialog/DocumentDetailOlapHelpers'
import mainDescriptor from '../../DocumentDetailsDescriptor.json'
import infoDescriptor from './DocumentDetailsInformationsDescriptor.json'
import useValidate from '@vuelidate/core'
import DatasetDialog from './DocumentDetailsDatasetDialog.vue'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import DocumentDetailsTree from './DocumentDetailsTree.vue'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'document-details-informations',
    components: { DatasetDialog, KnInputFile, DocumentDetailsTree },
    props: {
        selectedDocument: { type: Object as PropType<iDocument> },
        selectedDataset: { type: Object },
        availableStates: { type: Array },
        documentTypes: { type: Array as any, required: true },
        documentEngines: { type: Array as PropType<iEngine[]>, required: true },
        availableDatasources: { type: Array as PropType<iDataSource[]> },
        availableFolders: { type: Array as PropType<iFolder[]> },
        availableTemplates: { type: Array as PropType<iTemplate[]> },
        availableAttributes: { type: Array as PropType<iAttribute[]> }
    },
    emits: ['setTemplateForUpload', 'setImageForUpload', 'deleteImage', 'touched', 'openDesignerDialog'],
    computed: {
        filteredEngines(): any {
            if (this.document.typeCode) {
                return this.documentEngines.filter((engine) => engine.biobjTypeId === this.documentTypes.filter((type) => type.valueCd === this.document.typeCode)[0].valueId)
            }
            return []
        },
        isDataSourceVisible(): boolean {
            switch (this.document.engine) {
                case 'knowageofficeengine':
                case 'knowagecompositedoce':
                case 'knowageprocessengine':
                case 'knowagechartengine':
                case 'knowagenetworkengine':
                case 'knowagecockpitengine':
                case 'knowagedossierengine':
                case 'knowagekpiengine':
                case 'knowagesvgviewerengine':
                    return false
                default:
                    return true
            }
        },
        isDataSetVisible(): boolean {
            switch (this.document.engine) {
                case 'knowagegisengine':
                case 'knowagechartengine':
                case 'knowagenetworkengine':
                    return true
                default:
                    return false
            }
        },
        designerButtonVisible(): boolean {
            return this.document.typeCode == 'OLAP' || this.document.typeCode == 'KPI' || this.document.engine == 'knowagegisengine' || (this.document.engine == 'knowagedossierengine' && this.document.id !== undefined)
        },
        ...mapState(mainStore, {
            user: 'user'
        })
    },
    setup() {
        const store = mainStore()
        const router = useRouter()
        return { store, router }
    },
    data() {
        return {
            v$: useValidate() as any,
            mainDescriptor,
            infoDescriptor,
            uploading: false,
            lockedByUser: false,
            triggerUpload: false,
            showDatasetDialog: false,
            triggerImageUpload: false,
            dataset: {} as any,
            folders: [] as iFolder[],
            document: {} as iDocument,
            templates: [] as iTemplate[],
            templateToUpload: { name: '' } as any,
            imageToUpload: { name: '' } as any,
            visibilityAttribute: '',
            restrictionValue: '',
            driversPositions: infoDescriptor.driversPositions,
            listOfTemplates: [] as iTemplate[],
            imagePreviewUrl: null as any,
            imagePreview: false
        }
    },
    watch: {
        selectedDocument() {
            this.setData()
            this.getAllTemplates()
        },
        'selectedDocument.previewFile': {
            immediate: true,
            async handler() {
                if (this.selectedDocument?.previewFile) {
                    const imageData = await this.getImageUrl()
                    this.setImagePreview(imageData)
                } else {
                    this.resetImagePreview()
                }
            }
        }
    },
    async created() {
        this.setData()
        await this.getAllTemplates()
        await this.touchValidatedFields()
    },
    validations() {
        const validationObject = { document: createValidations('document', infoDescriptor.validations.document) }
        return validationObject
    },
    methods: {
        async getImageUrl(): Promise<Blob | string> {
            if (!this.selectedDocument?.previewFile) {
                return ''
            }
            try {
                const response = await this.$http.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/preview-file/download?fileName=${this.selectedDocument.previewFile}`, { responseType: 'blob' })
                return response.data
            } catch (error) {
                return ''
            }
        },
        setData() {
            this.templates = this.availableTemplates as iTemplate[]
            this.document = this.selectedDocument as iDocument
            this.dataset = this.selectedDataset
            this.folders = this.availableFolders as iFolder[]

            this.setImagePreview()
            this.IsLockedByUser()
        },
        IsLockedByUser() {
            this.lockedByUser = this.document.lockedByUser === 'true' ? true : false
        },
        setIsLockedByUser() {
            this.document.lockedByUser = this.lockedByUser ? 'true' : 'false'
        },
        addRestriction() {
            if (this.document.profiledVisibility) {
                this.document.profiledVisibility = this.document.profiledVisibility + ' AND ' + this.visibilityAttribute + ' = ' + this.restrictionValue
            } else {
                this.document.profiledVisibility = this.visibilityAttribute + ' = ' + this.restrictionValue
            }
        },
        clearAllRestrictions() {
            this.document.profiledVisibility = ''
            this.visibilityAttribute = ''
            this.restrictionValue = ''
        },
        saveSelectedDataset(event) {
            this.document.dataSetId = event.id
            this.dataset = event
        },
        setUploadType() {
            this.triggerUpload = false
            setTimeout(() => (this.triggerUpload = true), 200)
        },
        setTemplateForUpload(event) {
            this.uploading = true
            this.templateToUpload = event.target.files[0]
            this.$emit('setTemplateForUpload', event.target.files[0])
            this.triggerUpload = false
            setTimeout(() => (this.uploading = false), 200)
        },
        setImageUploadType() {
            this.triggerImageUpload = false
            setTimeout(() => (this.triggerImageUpload = true), 200)
        },
        setImageForUpload(event) {
            this.uploading = true
            this.imageToUpload = event.target.files[0]
            this.$emit('setImageForUpload', event.target.files[0])
            this.setImagePreview(event.target.files[0])
            this.triggerImageUpload = false
            setTimeout(() => (this.uploading = false), 200)
        },
        setImagePreview(imageFile?: any) {
            if (imageFile instanceof Blob) {
                this.imagePreviewUrl = URL.createObjectURL(imageFile)
                this.imagePreview = true
            } else {
                this.resetImagePreview()
            }
        },
        resetImagePreview() {
            this.imagePreviewUrl = null
            this.imagePreview = false
        },
        setFunctionality(event) {
            this.document.functionalities = event
        },
        onTypeChange() {
            this.$emit('touched')
            this.document.engine = ''
        },
        openDesignerConfirm() {
            this.$confirm.require({
                header: this.$t('common.toast.warning'),
                message: this.$t('documentExecution.olap.openDesignerMsg'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    switch (this.document.typeCode) {
                        case 'KPI':
                            this.openKpiDocumentDesigner()
                            break
                        case 'MAP': {
                            this.openGis()
                            break
                        }
                        case 'DOSSIER': {
                            this.openDossierDesigner()
                            break
                        }
                        default:
                            this.openDesigner()
                    }
                }
            })
        },
        async openDossierDesigner() {
            this.$emit('openDesignerDialog')
        },
        async openDesigner() {
            if (this.listOfTemplates.length === 0) {
                this.$emit('openDesignerDialog')
            } else {
                const activeTemplate = this.findActiveTemplate()
                const sbiExecutionId = crypto.randomUUID()
                await startOlap(this.$http, this.user, sbiExecutionId, this.document, activeTemplate, this.router)
            }
        },
        findActiveTemplate() {
            let activeTemplate = null as any
            for (let i = 0; i < this.listOfTemplates.length; i++) {
                if (this.listOfTemplates[i].active) {
                    activeTemplate = this.listOfTemplates[i]
                    break
                }
            }
            return activeTemplate
        },
        getValidationErrorMessage(field: any, fieldName: string): string {
            if (!field.$invalid || !field.$dirty || !field.$errors.length) return ''
            const error = field.$errors[0]
            return this.$t(`common.validation.${error.$validator}`, { ...error.$params, fieldName })
        },
        translatedLabel(a) {
            return this.$t(a.label)
        },
        openKpiDocumentDesigner() {
            this.router.push(`/kpi-edit/${this.document.id}?from=documentDetail`)
        },
        openGis() {
            this.router.push(`/gis/edit?documentId=${this.document.id}`)
        },
        async getAllTemplates() {
            if (this.document && this.document.id) this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.document.id}/templates`).then((response: AxiosResponse<any>) => (this.listOfTemplates = response.data as iTemplate[]))
        },
        touchValidatedFields() {
            this.v$.document.label.$touch()
            this.v$.document.name.$touch()
        }
    }
})
</script>

<style lang="scss" scoped>
.dd-info-layout {
    display: flex;
    flex-direction: column;
    flex: 1;
    background-color: #f3f3f3;
    min-height: 0;
}

.dd-grid {
    display: grid;
    grid-template-columns: 1fr 45%;
    align-items: start;
    gap: 0 1px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    padding: 8px;

    @media (max-width: 860px) {
        grid-template-columns: 1fr;
    }
}

.dd-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 8px;
    min-width: 0;
}

.dd-img-wrap {
    position: relative;
    cursor: pointer;

    .dd-preview-img {
        height: 160px;
        width: 100%;
    }

    .dd-img-overlay {
        background: rgba(0, 0, 0, 0.45);
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    &:hover .dd-img-overlay {
        opacity: 1;
        border: 2px dashed grey;
    }

    .dd-img-delete {
        position: absolute;
        top: 6px;
        right: 6px;
    }
}

.dd-upload-zone {
    height: 160px;
    border: 2px dashed #e0e0e0;
    background: #fafaf9;
    transition:
        border-color 0.15s,
        background 0.15s;

    &:hover {
        border-color: var(--q-primary);
        background: #eef2ff;
    }
}

.dd-toggles-row {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
}
</style>
