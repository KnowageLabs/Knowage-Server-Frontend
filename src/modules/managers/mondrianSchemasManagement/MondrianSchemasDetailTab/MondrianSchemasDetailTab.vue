<template>
    <Card class="q-ma-sm">
        <template #content>
            <form class="p-fluid p-m-3">
                <div class="p-field p-mb-3">
                    <span class="p-float-label">
                        <InputText
                            id="name"
                            v-model.trim="v$.schema.name.$model"
                            class="kn-material-input"
                            type="text"
                            :class="{
                                'p-invalid': v$.schema.name.$invalid && v$.schema.name.$dirty
                            }"
                            max-length="100"
                            data-test="name-input"
                            @blur="v$.schema.name.$touch()"
                            @input="onFieldChange('name', $event.target.value)"
                        />
                        <label for="name" class="kn-material-input-label">{{ $t('common.name') }} *</label>
                    </span>
                    <KnValidationMessages :v-comp="v$.schema.name" :additional-translate-params="{ fieldName: $t('common.name') }" />
                </div>
                <div class="p-field p-mb-3">
                    <span class="p-float-label">
                        <InputText
                            id="description"
                            v-model.trim="v$.schema.description.$model"
                            class="kn-material-input"
                            type="text"
                            :class="{
                                'p-invalid': v$.schema.description.$invalid && v$.schema.description.$dirty
                            }"
                            max-length="500"
                            data-test="description-input"
                            @blur="v$.schema.description.$touch()"
                            @input="onFieldChange('description', $event.target.value)"
                        />
                        <label for="description" class="kn-material-input-label">
                            {{ $t('common.description') }}
                        </label>
                    </span>
                    <KnValidationMessages :v-comp="v$.schema.description" :additional-translate-params="{ fieldName: $t('common.description') }" />
                </div>
                <div class="p-field">
                    <span class="p-float-label">
                        <KnInputFile label="" :change-function="onVersionUpload" accept=".xml,.csv" :visibility="true" />
                    </span>
                </div>
            </form>
        </template>
    </Card>
    <Card class="q-ma-sm">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--secondary">
                <template #start>
                    {{ $t('managers.mondrianSchemasManagement.detail.savedVersions') }}
                </template>
            </Toolbar>
        </template>
        <template #content>
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
            <div>
                <div class="p-col">
                    <DataTable
                        v-if="!loading"
                        v-model:selection="selectedVersion"
                        v-model:filters="filters"
                        :value="versions"
                        :scrollable="true"
                        scroll-height="40vh"
                        :loading="loading"
                        :rows="7"
                        class="p-datatable-sm kn-table"
                        data-key="id"
                        responsive-layout="stack"
                        breakpoint="960px"
                        @row-select="onActiveVersionChange"
                    >
                        <template #header>
                            <div class="table-header">
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search" />
                                    <InputText v-model="filters['global'].value" class="kn-material-input" type="text" :placeholder="$t('common.search')" badge="0" data-test="search-input" />
                                </span>
                            </div>
                        </template>
                        <template #empty>
                            {{ $t('common.info.noDataFound') }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" class="p-column-filter"></InputText>
                        </template>
                        <Column selection-mode="single" :header="$t('managers.mondrianSchemasManagement.headers.active')" header-style="width: 3em"></Column>
                        <Column v-for="col of columns" :key="col.field" :field="col.field" :header="$t(col.header)" :sortable="true" :style="detailDescriptor.table.column.style"></Column>
                        <Column field="creationDate" :header="$t('managers.mondrianSchemasManagement.headers.creationDate')" data-type="date">
                            <template #body="{ data }">
                                {{ formatDate(data.creationDate) }}
                            </template>
                        </Column>
                        <Column :style="detailDescriptor.table.iconColumn.style" @rowClick="false">
                            <template #body="slotProps">
                                <Button icon="pi pi-download" class="p-button-link" data-test="download-button" @click="downloadVersion(slotProps.data.id)" />
                                <Button icon="pi pi-trash" class="p-button-link" data-test="delete-button" @click="showDeleteDialog(slotProps.data.id)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { iSchema, iVersion } from '../MondrianSchemas'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { downloadDirect } from '@/helpers/commons/fileHelper'
import { AxiosResponse } from 'axios'
import moment from 'moment'
import useValidate from '@vuelidate/core'
import tabViewDescriptor from '../MondrianSchemasTabViewDescriptor.json'
import detailDescriptor from './MondrianSchemasDetailDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import mainStore from '../../../../App.store'

export default defineComponent({
    name: 'detail-tab',
    components: {
        Card,
        KnValidationMessages,
        DataTable,
        Column,
        KnInputFile
    },
    props: {
        selectedSchema: {
            type: Object,
            requried: false
        },
        reloadTable: {
            type: Boolean,
            default: false
        }
    },
    emits: ['fieldChanged', 'activeVersionChanged', 'versionUploaded', 'versionsReloaded'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            loading: false,
            moment,
            tabViewDescriptor,
            detailDescriptor,
            v$: useValidate() as any,
            schema: {} as iSchema,
            versions: [] as any,
            selectedVersion: null as iVersion | null,
            columns: detailDescriptor.columns,
            filters: {
                global: [filterDefault]
            } as Object
        }
    },
    validations() {
        return {
            schema: createValidations('schema', detailDescriptor.validations.schema)
        }
    },
    watch: {
        selectedSchema() {
            this.schema = { ...this.selectedSchema } as iSchema
            this.loadVersions()
        },
        reloadTable() {
            if (this.reloadTable) {
                this.loadVersions()
            }
        }
    },
    mounted() {
        if (this.selectedSchema) {
            this.schema = { ...this.selectedSchema } as iSchema
        }
    },
    methods: {
        onFieldChange(fieldName: string, value: any) {
            this.$emit('fieldChanged', { fieldName, value })
        },
        onActiveVersionChange(event) {
            const versionId = event.data.id
            this.$emit('activeVersionChanged', versionId)
        },
        async onVersionUpload(event) {
            const uploadedVersion = event.target.files[0]
            this.$emit('versionUploaded', uploadedVersion)
        },
        async loadVersions() {
            if (!this.schema.id) {
                this.versions = []
                return
            }
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/mondrianSchemasResource/${this.schema.id}` + '/versions')
                .then((response: AxiosResponse<any>) => {
                    this.versions = response.data
                    setTimeout(() => (this.selectedVersion = this.versions ? this.versions.find((version) => version.active) : null), 200)
                    this.$emit('versionsReloaded')
                })
                .finally(() => (this.loading = false))
        },
        async downloadVersion(versionId) {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/mondrianSchemasResource/${this.schema.id}` + `/versions/${versionId}` + `/file`, {
                    headers: {
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
                    }
                })
                .then(
                    (response: AxiosResponse<any>) => {
                        if (response.data.errors) {
                            this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('common.error.errorCreatingPackage') })
                        } else {
                            this.store.setInfo({ title: this.$t('managers.mondrianSchemasManagement.toast.downloadFile.downloaded'), msg: this.$t('managers.mondrianSchemasManagement.toast.downloadFile.ok') })
                            const contentDisposition = response.headers['content-disposition']

                            const contentDispositionMatches = contentDisposition.match(/(?!([\b attachment;filename= \b])).*(?=)/g)
                            if (contentDispositionMatches && contentDispositionMatches.length > 0) {
                                const fileAndExtension = contentDispositionMatches[0]
                                const completeFileName = fileAndExtension.replaceAll('"', '')
                                downloadDirect(response.data, completeFileName, 'application/zip; charset=utf-8')
                            }
                        }
                    },
                    (error) => this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t(error) })
                )
        },
        showDeleteDialog(versionId: number) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteConfirmTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteVersion(versionId)
            })
        },
        async deleteVersion(versionId: number) {
            await this.$http.delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/mondrianSchemasResource/${this.schema.id}` + '/versions/' + versionId).then(() => {
                this.store.setInfo({
                    title: this.$t('common.toast.deleteTitle'),
                    msg: this.$t('common.toast.deleteSuccess')
                })
                this.loadVersions()
            })
        },
        formatDate(date) {
            return formatDateWithLocale(date, { dateStyle: 'short', timeStyle: 'short' })
        }
    }
})
</script>
