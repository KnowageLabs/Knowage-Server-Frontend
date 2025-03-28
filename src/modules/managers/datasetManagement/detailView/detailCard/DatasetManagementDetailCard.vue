<template>
    <Card class="p-m-2">
        <template #content>
            <form class="p-fluid p-formgrid p-grid">
                <div class="p-field p-mt-1 p-col-6">
                    <span class="p-float-label">
                        <InputText id="label" v-model="v$.dataset.label.$model" class="kn-material-input" type="text" max-length="50" :class="{ 'p-invalid': v$.dataset.label.$invalid && v$.dataset.label.$dirty }" data-test="label-input" @blur="v$.dataset.label.$touch()" @change="$emit('touched')" />
                        <label for="label" class="kn-material-input-label"> {{ $t('common.label') }} * </label>
                    </span>
                    <KnValidationMessages class="p-mt-1" :v-comp="v$.dataset.label" :additional-translate-params="{ fieldName: $t('common.label') }" />
                </div>
                <div class="p-field p-mt-1 p-col-6">
                    <span class="p-float-label">
                        <InputText id="name" v-model="v$.dataset.name.$model" class="kn-material-input" type="text" max-length="50" :class="{ 'p-invalid': v$.dataset.name.$invalid && v$.dataset.name.$dirty }" data-test="name-input" @blur="v$.dataset.name.$touch()" @change="$emit('touched')" />
                        <label for="name" class="kn-material-input-label"> {{ $t('common.name') }} * </label>
                    </span>
                    <KnValidationMessages class="p-mt-1" :v-comp="v$.dataset.name" :additional-translate-params="{ fieldName: $t('common.name') }" />
                </div>
                <div class="p-field p-mt-1 p-col-12">
                    <span class="p-float-label">
                        <InputText
                            id="description"
                            v-model="v$.dataset.description.$model"
                            class="kn-material-input"
                            type="text"
                            max-length="150"
                            :class="{ 'p-invalid': v$.dataset.description.$invalid && v$.dataset.description.$dirty }"
                            data-test="description-input"
                            @blur="v$.dataset.description.$touch()"
                            @change="$emit('touched')"
                        />
                        <label for="description" class="kn-material-input-label"> {{ $t('common.description') }} </label>
                    </span>
                    <KnValidationMessages class="p-mt-1" :v-comp="v$.dataset.description" :additional-translate-params="{ fieldName: $t('common.description') }" />
                </div>
                <div class="p-field p-mt-1 p-col-6">
                    <span class="p-float-label">
                        <Dropdown
                            id="scope"
                            v-model="v$.dataset.scopeId.$model"
                            class="kn-material-input"
                            :options="scopeTypes"
                            option-label="VALUE_CD"
                            option-value="VALUE_ID"
                            :class="{
                                'p-invalid': v$.dataset.scopeId.$invalid && v$.dataset.scopeId.$dirty
                            }"
                            data-test="scope-input"
                            @before-show="v$.dataset.scopeId.$touch()"
                            @change="updateCdFromId(this.scopeTypes, 'scopeCd', $event.value), $emit('touched')"
                        />
                        <label for="scope" class="kn-material-input-label"> {{ $t('managers.datasetManagement.scope') }} * </label>
                    </span>
                    <KnValidationMessages
                        :v-comp="v$.dataset.scopeId"
                        :additional-translate-params="{
                            fieldName: $t('managers.datasetManagement.scope')
                        }"
                    />
                </div>
                <div class="p-field p-mt-1 p-col-6">
                    <span class="p-float-label">
                        <Dropdown
                            id="category"
                            v-model="v$.dataset.catTypeId.$model"
                            class="kn-material-input"
                            :options="categoryTypes"
                            option-label="VALUE_CD"
                            option-value="VALUE_ID"
                            :class="{
                                'p-invalid': v$.dataset.catTypeId.$invalid && v$.dataset.catTypeId.$dirty
                            }"
                            :show-clear="dataset.scopeCd === 'USER'"
                            data-test="category-input"
                            @before-show="v$.dataset.catTypeId.$touch()"
                            @change="updateCdFromId(this.categoryTypes, 'catTypeVn', $event.value), $emit('touched')"
                        />
                        <label v-if="dataset.scopeCd == 'USER'" for="category" class="kn-material-input-label"> {{ $t('common.category') }} </label>
                        <label v-else for="category" class="kn-material-input-label"> {{ $t('common.category') }} * </label>
                    </span>
                    <KnValidationMessages
                        :v-comp="v$.dataset.catTypeId"
                        :additional-translate-params="{
                            fieldName: $t('managers.datasetManagement.scope')
                        }"
                    />
                </div>
                <div class="p-field p-mt-1 p-col-12">
                    <span class="p-float-label kn-material-input">
                        <AutoComplete v-model="dataset.tags" :suggestions="filteredTagsNames" :multiple="true" @complete="searchTag" @keydown.enter="createTagChip" data-test="search-input">
                            <template #chip="slotProps">
                                {{ slotProps.value.name }}
                            </template>
                            <template #item="slotProps">
                                {{ slotProps.item.name }}
                            </template>
                        </AutoComplete>
                        <label for="tags" class="kn-material-input-label">{{ $t('common.tags') }}</label>
                    </span>
                    <small id="username1-help">{{ $t('managers.widgetGallery.tags.availableCharacters') }}</small>
                </div>
            </form>
        </template>
    </Card>
    <Card class="p-m-2">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--secondary">
                <template #start>
                    {{ $t('managers.datasetManagement.oldVersions') }}
                </template>
                <template #end>
                    <Button icon="fas fa-eraser" class="p-button-text p-button-rounded p-button-plain" :disabled="noDatasetVersions" @click="deleteConfirm('deleteAll')" />
                </template>
            </Toolbar>
        </template>
        <template #content>
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="versions-loading" />
            <DataTable v-if="!loading" class="p-datatable-sm kn-table" :value="selectedDatasetVersions" :scrollable="true" scroll-height="400px" :loading="loading" data-key="versNum" responsive-layout="stack" breakpoint="960px">
                <template #empty>
                    {{ $t('managers.datasetManagement.noVersions') }}
                </template>
                <Column field="userIn" :header="$t('managers.datasetManagement.creationUser')" :sortable="true" />
                <Column field="type" :header="$t('importExport.gallery.column.type')" :sortable="true" />
                <Column field="dateIn" :header="$t('managers.mondrianSchemasManagement.headers.creationDate')" data-type="date" :sortable="true">
                    <template #body="{ data }">
                        {{ formatDate(data.dateIn) }}
                    </template>
                </Column>
                <Column @rowClick="false">
                    <template #body="slotProps">
                        <Button v-if="slotProps.data.versNum !== 0" icon="fas fa-retweet" class="p-button-link" data-test="submit-button" @click="restoreVersionConfirm(slotProps.data)" />
                        <Button v-if="slotProps.data.versNum !== 0" icon="pi pi-trash" class="p-button-link" data-test="delete-button" @click="deleteConfirm('deleteOne', slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import detailTabDescriptor from './DatasetManagementDetailCardDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import AutoComplete from 'primevue/autocomplete'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import mainStore from '../../../../../App.store'

export default defineComponent({
    components: { Card, Dropdown, KnValidationMessages, DataTable, Column, AutoComplete },
    props: {
        scopeTypes: { type: Array as any, required: true },
        categoryTypes: { type: Array as any, required: true },
        selectedDataset: { type: Object as any },
        selectedDatasetVersions: { type: Array as any },
        availableTags: { type: Array as any },
        loading: { type: Boolean }
    },
    emits: ['touched', 'reloadVersions', 'loadingOlderVersion', 'olderVersionLoaded'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            detailTabDescriptor,
            loadingVersion: false,
            v$: useValidate() as any,
            dataset: {} as any,
            datasetVersions: [] as any,
            availableTagsNames: [] as any,
            selectedTagsNames: [] as any,
            filteredTagsNames: null as any
        }
    },
    computed: {
        noDatasetVersions(): any {
            if (this.selectedDatasetVersions.length > 0) {
                return false
            }
            return true
        }
    },
    watch: {
        selectedDataset() {
            this.dataset = this.selectedDataset
            this.v$.dataset.label.$touch()
            this.v$.dataset.name.$touch()
        }
    },
    created() {
        this.dataset = this.selectedDataset
    },
    validations() {
        const catTypeRequired = (value) => {
            return this.dataset.scopeCd == 'USER' || value
        }
        const customValidators: ICustomValidatorMap = { 'cat-type-required': catTypeRequired }
        const validationObject = { dataset: createValidations('dataset', detailTabDescriptor.validations.dataset, customValidators) }
        return validationObject
    },
    methods: {
        //#region ===================== Delete Versions Functionality ====================================================
        deleteConfirm(deletetype, event) {
            let msgDesc = ''
            deletetype === 'deleteOne' ? (msgDesc = 'managers.datasetManagement.deleteOneVersionMsg') : (msgDesc = 'managers.datasetManagement.deleteAllVersionsMsg')
            this.$confirm.require({
                message: this.$t(msgDesc),
                header: this.$t('common.uppercaseDelete'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    deletetype === 'deleteOne' ? this.deleteSelectedVersion(event) : this.deleteAllVersions()
                }
            })
        },
        async deleteSelectedVersion(event) {
            return this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${event.dsId}/version/${event.versNum}`)
                .then(() => {
                    this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                    this.$emit('reloadVersions')
                })
                .catch((error) => this.store.setError({ title: this.$t('common.error.generic'), msg: error.message }))
        },
        async deleteAllVersions() {
            return this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${this.selectedDataset.id}/allversions/`)
                .then(() => {
                    this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('managers.datasetManagement.deleteAllVersionsSuccess') })
                    this.$emit('reloadVersions')
                })
                .catch((error) => this.store.setError({ title: this.$t('common.error.generic'), msg: error.message }))
        },
        //#endregion ================================================================================================

        //#region ===================== Restore Versions Functionality ====================================================
        restoreVersionConfirm(event) {
            this.$confirm.require({
                icon: 'pi pi-exclamation-triangle',
                message: this.$t('managers.datasetManagement.restoreMsg'),
                header: this.$t('managers.datasetManagement.restoreTitle'),
                accept: () => this.restoreVersion(event)
            })
        },
        async restoreVersion(dsToRestore) {
            this.$emit('loadingOlderVersion')
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${this.dataset.id}/restore?versionId=${dsToRestore.versNum}`).then((response: AxiosResponse<any>) => {
                this.dataset.dsTypeCd.toLowerCase() == 'file' ? this.refactorFileDatasetConfig(response.data[0]) : ''
                this.$emit('olderVersionLoaded', response.data[0])
            })
            this.loadingVersion = false
        },
        refactorFileDatasetConfig(item) {
            this.dataset.fileType = item != undefined ? item.fileType : ''
            this.dataset.fileName = item != undefined ? item.fileName : ''
            this.dataset.csvEncoding = item != undefined ? item.csvEncoding : 'UTF-8'
            this.dataset.csvDelimiter = item != undefined ? item.csvDelimiter : ','
            this.dataset.csvQuote = item != undefined ? item.csvQuote : '"'
            this.dataset.dateFormat = item != undefined && item.dateFormat != undefined ? item.dateFormat : 'dd/MM/yyyy'
            this.dataset.timestampFormat = item != undefined && item.timestampFormat != undefined ? item.timestampFormat : 'dd/MM/yyyy HH:mm:ss'

            if (item != undefined) {
                if (item.limitRows != null && item.limitRows != '') {
                    this.dataset.limitRows = Number(item.limitRows)
                } else {
                    this.dataset.limitRows = item.limitRows
                }
            } else {
                this.dataset.limitRows = null
            }

            if (item != undefined) {
                this.dataset.catTypeVn = item.catTypeVn
                this.dataset.catTypeId = Number(item.catTypeId)
                this.dataset.xslSheetNumber = Number(1)
                this.dataset.skipRows = Number(item.skipRows)
                this.dataset.limitRows = Number(null)
            } else {
                this.dataset.catTypeVn = ''
                this.dataset.catTypeId = null
                this.dataset.xslSheetNumber = null
                this.dataset.skipRows = null
                this.dataset.limitRows = null
            }

            this.dataset.id = item != undefined ? item.id : ''
            this.dataset.label = item != undefined ? item.label : ''
            this.dataset.name = item != undefined ? item.name : ''
            this.dataset.description = item != undefined ? item.description : ''
            this.dataset.meta = item != undefined ? item.meta : []

            this.dataset.fileUploaded = false
        },
        //#endregion ================================================================================================

        //#region ===================== Tags Functionality ====================================================
        searchTag(event) {
            setTimeout(() => {
                if (!event.query.trim().length) {
                    this.filteredTagsNames = [...this.availableTags]
                } else {
                    this.filteredTagsNames = this.availableTags.filter((tag) => {
                        return tag.name.toLowerCase().startsWith(event.query.toLowerCase())
                    })
                }
            }, 250)
        },
        createTagChip(event: any) {
            if (event.target.value) {
                const tempWord = this.availableTags.find((el) => el.name == event.target.value)
                if (!tempWord) {
                    this.dataset.tags.push(event.target.value)
                    this.buildTagObject()
                    event.target.value = ''
                }
            }
        },
        buildTagObject() {
            this.dataset.tags = this.dataset.tags.map((tag) => {
                if (typeof tag !== 'string') {
                    return tag
                } else {
                    return { name: tag }
                }
            })
        },
        //#endregion ================================================================================================

        formatDate(date) {
            return formatDateWithLocale(date, { dateStyle: 'short', timeStyle: 'short' })
        },
        updateCdFromId(optionsArray, fieldToUpdate, updatedField) {
            const selectedField = optionsArray.find((option) => option.VALUE_ID === updatedField)
            if (selectedField) this.dataset[fieldToUpdate] = selectedField.VALUE_CD
        }
    }
})
</script>
