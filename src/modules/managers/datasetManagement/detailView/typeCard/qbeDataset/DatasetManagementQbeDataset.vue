<template>
    <Card class="p-m-2">
        <template #content>
            <form v-if="dataset.dsTypeCd == 'Qbe'" class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-6">
                    <span class="p-float-label">
                        <Dropdown
                            id="qbeDataSource"
                            v-model="v$.dataset.qbeDataSource.$model"
                            class="kn-material-input"
                            :options="dataSources"
                            option-label="label"
                            option-value="label"
                            :class="{
                                'p-invalid': v$.dataset.qbeDataSource.$invalid && v$.dataset.qbeDataSource.$dirty
                            }"
                            @before-show="v$.dataset.qbeDataSource.$touch()"
                        />
                        <label for="scope" class="kn-material-input-label"> {{ $t('managers.glossary.glossaryUsage.dataSource') }} * </label>
                    </span>
                    <KnValidationMessages
                        :v-comp="v$.dataset.qbeDataSource"
                        :additional-translate-params="{
                            fieldName: $t('managers.glossary.glossaryUsage.dataSource')
                        }"
                    />
                </div>
                <div class="p-field p-col-6">
                    <span class="p-float-label">
                        <Dropdown
                            id="qbeDatamarts"
                            v-model="v$.dataset.qbeDatamarts.$model"
                            class="kn-material-input"
                            :options="businessModels"
                            option-label="name"
                            option-value="name"
                            :class="{
                                'p-invalid': v$.dataset.qbeDatamarts.$invalid && v$.dataset.qbeDatamarts.$dirty
                            }"
                            @change="getDriversData"
                            @before-show="v$.dataset.qbeDatamarts.$touch()"
                        />
                        <label for="scope" class="kn-material-input-label"> {{ $t('managers.datasetManagement.qbeDatamarts') }} * </label>
                    </span>
                    <KnValidationMessages
                        :v-comp="v$.dataset.qbeDatamarts"
                        :additional-translate-params="{
                            fieldName: $t('managers.datasetManagement.qbeDatamarts')
                        }"
                    />
                </div>
            </form>
            <div v-if="dataset.dsTypeCd == 'Qbe' || dataset.dsTypeCd == 'Federated'">
                <Button :label="$t('managers.datasetManagement.viewQbeButton')" class="p-col-2 p-mr-2 p-button kn-button--primary" style="max-height: 38px" @click="openQbeQueryDialog" />
                <Button :label="$t('managers.datasetManagement.openQbeButton')" class="p-col-2 p-button kn-button--primary" :disabled="parentValid" @click="openDatasetInQBE" />
            </div>
        </template>
    </Card>

    <Dialog class="dmdialog" :visible="qbeQueryDialogVisible" :modal="true" :closable="false" :style="qbeDescriptor.style.codeMirror">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-col-12">
                <template #start>
                    <span>{{ $t('managers.datasetManagement.viewQbeButton') }}</span>
                </template>
                <template #end>
                    <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" @click="qbeQueryDialogVisible = false" />
                </template>
            </Toolbar>
        </template>
        <knMonaco v-model="qbeQuery" style="height: 100%" :options="{ readOnly: true }" language="sql"></knMonaco>
    </Dialog>
    <QBE v-if="qbeVisible" :visible="qbeVisible" :dataset="qbeDataset" :return-query-mode="true" :from-ds-management="true" :get-query-from-dataset-prop="getQueryFromDataset" @querySaved="onQbeDialogSave" @close="onQbeDialogClose" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import useValidate from '@vuelidate/core'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import qbeDescriptor from './DatasetManagementQbeDatasetDescriptor.json'
import Dropdown from 'primevue/dropdown'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import QBE from '@/modules/qbe/QBE.vue'
import deepcopy from 'deepcopy'

export default defineComponent({
    components: { Card, Dropdown, knMonaco, KnValidationMessages, Dialog, QBE },
    props: { parentValid: { type: Boolean }, selectedDataset: { type: Object as any }, dataSources: { type: Array as any }, businessModels: { type: Array as any } },
    emits: ['touched', 'qbeDialogClosed', 'qbeDialogSaved'],
    data() {
        return {
            qbeDescriptor,
            dataset: {} as any,
            v$: useValidate() as any,
            qbeQuery: '' as any,
            qbeQueryDialogVisible: false,
            qbeVisible: false,
            qbeDataset: {} as any,
            selectedBusinessModel: {} as any,
            datsetBmChanged: false,
            getQueryFromDataset: false
        }
    },
    watch: {
        selectedDataset() {
            this.dataset = this.selectedDataset
        }
    },
    created() {
        this.dataset = this.selectedDataset
    },
    validations() {
        const qbeFieldsRequired = (value) => {
            return this.dataset.dsTypeCd != 'Qbe' || value
        }
        const customValidators: ICustomValidatorMap = { 'qbe-fields-required': qbeFieldsRequired }
        const validationObject = { dataset: createValidations('dataset', qbeDescriptor.validations.dataset, customValidators) }
        return validationObject
    },
    methods: {
        openQbeQueryDialog() {
            if (typeof this.dataset.qbeJSONQuery === 'string') {
                this.qbeQuery = JSON.stringify(JSON.parse(this.dataset.qbeJSONQuery), null, 2)
            } else {
                this.qbeQuery = JSON.stringify(this.dataset.qbeJSONQuery, null, 2)
            }
            this.qbeQueryDialogVisible = true
        },
        async getDriversData(event) {
            this.datsetBmChanged = true
            this.getQueryFromDataset = false
            const bmId = this.businessModels.find((bm) => bm.name === event.value).id
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/businessmodels/${bmId}`)
                .then((response: AxiosResponse<any>) => {
                    this.selectedBusinessModel = response.data
                })
                .catch()
        },
        openDatasetInQBE() {
            if (this.$route.name === 'new-dataset') {
                this.qbeDataset = deepcopy(this.selectedBusinessModel)
                this.getQueryFromDataset ? (this.qbeDataset.qbeJSONQuery = this.dataset.qbeJSONQuery) : ''
            } else {
                if (this.datsetBmChanged) {
                    this.qbeDataset = deepcopy(this.selectedBusinessModel)
                } else {
                    this.qbeDataset = deepcopy(this.dataset)
                }
            }
            this.qbeDataset.pars = this.dataset.pars
            this.qbeDataset.dsTypeCd = 'Qbe'
            this.qbeVisible = true
        },
        onQbeDialogClose() {
            this.qbeVisible = false
        },
        onQbeDialogSave(query) {
            this.dataset.qbeJSONQuery = query
            this.datsetBmChanged = false
            this.getQueryFromDataset = true
            this.qbeVisible = false
        }
    }
})
</script>
