<template>
    <Card class="p-m-2">
        <template #content>
            <form class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-6">
                    <span class="p-float-label">
                        <InputText id="label" v-model="v$.dataset.sourceDatasetLabel.$model" class="kn-material-input" type="text" max-length="40" disabled />
                        <label for="label" class="kn-material-input-label"> {{ $t('common.sourceDataset') }} * </label>
                    </span>
                </div>
            </form>
            <div>
                <Button :label="$t('managers.datasetManagement.viewSQLButton')" class="p-col-2 p-mr-2 p-button kn-button--primary" style="max-height: 38px" @click="openQbeQueryDialog" />
                <Button :label="$t('managers.datasetManagement.openQbeButton')" class="p-col-2 p-button kn-button--primary" :disabled="parentValid" @click="openDatasetInQBE" />
            </div>
        </template>
    </Card>

    <Dialog class="dmdialog" :visible="qbeQueryDialogVisible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-col-12">
                <template #start>
                    <span>{{ $t('managers.datasetManagement.viewSQLButton') }}</span>
                </template>
                <template #end>
                    <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" @click="qbeQueryDialogVisible = false" />
                </template>
            </Toolbar>
        </template>
        <knMonaco ref="editor" v-model="qbeQuery" style="height: 400px" language="javascript"></knMonaco>
    </Dialog>

    <QBE v-if="qbeVisible" :visible="qbeVisible" :dataset="qbeDataset" :get-query-from-dataset-prop="getQueryFromDataset" :source-dataset="selectedDataset" :return-query-mode="false" @querySaved="onQbeDialogSave" @close="onQbeDialogClose" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import qbeDescriptor from './DatasetManagementDerivedDatasetDescriptor.json'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import QBE from '@/modules/qbe/QBE.vue'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    components: { Card, Dialog, knMonaco, QBE },
    props: { parentValid: { type: Boolean }, selectedDataset: { type: Object as any }, qbeDatasets: { type: Array as any } },
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
            sourceDataset: {} as any,
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
            if (typeof this.dataset.sqlQuery === 'string') {
                this.qbeQuery = this.dataset.sqlQuery
            }
            this.qbeQueryDialogVisible = true
        },
        openDatasetInQBE() {
            /*             if (this.$route.name === 'new-dataset') {
                this.qbeDataset = deepcopy(this.selectedBusinessModel)
                this.getQueryFromDataset ? (this.qbeDataset.qbeJSONQuery = this.dataset.qbeJSONQuery) : ''
            } else {
                if (this.datsetBmChanged) {
                    this.qbeDataset = deepcopy(this.selectedBusinessModel)
                } else {
                    this.qbeDataset = deepcopy(this.dataset)
                }
            } */

            this.qbeDataset = null
            this.sourceDataset = this.dataset.sourceDatasetLabel

            this.qbeVisible = true
        },
        onQbeDialogClose() {
            this.qbeVisible = false
        },
        onQbeDialogSave(query) {
            this.dataset.qbeJSONQuery = query
            this.datsetBmChanged = false
            this.getQueryFromDataset = true
        }
    }
})
</script>
<style lang="scss">
.dmdialog.p-dialog .p-dialog-header,
.dmdialog.p-dialog .p-dialog-content {
    padding: 0;
}
.dmdialog.p-dialog .p-dialog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
}
</style>
