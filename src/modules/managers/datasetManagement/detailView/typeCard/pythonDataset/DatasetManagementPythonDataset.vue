<template>
    <Card class="p-m-2">
        <template #content>
            <form class="p-fluid p-formgrid p-grid p-mt-2">
                <div class="p-field p-col-6">
                    <span class="p-float-label">
                        <Dropdown
                            id="pythonEnvironment"
                            v-model="dataset.pythonEnvironment.label"
                            class="kn-material-input"
                            :options="pythonEnvironments"
                            option-label="label"
                            option-value="label"
                            :class="{
                                'p-invalid': !dataset.pythonEnvironment?.label || dataset.pythonEnvironment?.label === ''
                            }"
                            @change="updateValueFromLabel(pythonEnvironments, 'value', $event.value)"
                        />
                        <label for="pythonEnvironment" class="kn-material-input-label">{{ $t('managers.datasetManagement.environment') }} *</label>
                    </span>
                    <small v-if="!dataset.pythonEnvironment.label || dataset.pythonEnvironment.label === ''" for="pythonEnvironment" class="p-error p-mt-2">{{ $t('managers.datasetManagement.envIsRequired') }}</small>
                </div>
                <div class="p-field p-col-6">
                    <span class="p-float-label">
                        <InputText
                            id="dataframeName"
                            v-model.trim="v$.dataset.dataframeName.$model"
                            class="kn-material-input"
                            type="text"
                            :class="{
                                'p-invalid': v$.dataset.dataframeName.$invalid && v$.dataset.dataframeName.$dirty
                            }"
                            @blur="v$.dataset.dataframeName.$touch()"
                            @change="$emit('touched')"
                        />
                        <label for="dataframeName" class="kn-material-input-label">{{ $t('managers.datasetManagement.dataframeName') }} *</label>
                    </span>
                    <KnValidationMessages class="p-mt-1" :v-comp="v$.dataset.dataframeName" :additional-translate-params="{ fieldName: $t('managers.datasetManagement.dataframeName') }" />
                </div>
            </form>
            <Button :label="$t('managers.datasetManagement.checkEnvironment')" class="p-button kn-button--primary" :disabled="!dataset.pythonEnvironment.label" @click="checkEnvironment" />

            <knMonaco v-model="dataset.pythonScript" style="height: 400px" language="python" @keyup="$emit('touched')"></knMonaco>

            <Dialog :header="$t('managers.datasetManagement.availableLibraries')" style="width: 60vw" :visible="libListVisible" :modal="false" class="p-fluid kn-dialog--toolbar--primary" :closable="false">
                <div class="p-mt-3">
                    <DataTable class="p-datatable-sm kn-table" :value="pythonEnvLibs" :scrollable="true" responsive-layout="stack" breakpoint="960px">
                        <Column field="name" :header="$t('kpi.alert.name')" :sortable="true">
                            <template #body="{ data }">
                                <span v-if="dataset.pythonDatasetType == 'python'"></span>
                                {{ data.name }}
                                <span v-if="dataset.pythonDatasetType == 'r'"></span>
                                {{ data[0] }}
                            </template>
                        </Column>
                        <Column field="version" :header="$t('common.version')" :sortable="true">
                            <template #body="{ data }">
                                <span v-if="dataset.pythonDatasetType == 'python'"></span>
                                {{ data.version }}
                                <span v-if="dataset.pythonDatasetType == 'r'"></span>
                                {{ data[1] }}
                            </template>
                        </Column>
                    </DataTable>
                </div>
                <template #footer>
                    <Button class="kn-button kn-button--primary" @click="libListVisible = false">{{ $t('common.close') }}</Button>
                </template>
            </Dialog>
        </template>
    </Card>
</template>

<script lang="ts">
import { AxiosResponse } from 'axios'
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import useValidate from '@vuelidate/core'
import pythonDescriptor from './DatasetManagementPythonDataset.json'
import Dropdown from 'primevue/dropdown'
import Card from 'primevue/card'
import RadioButton from 'primevue/radiobutton'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

export default defineComponent({
    components: { Card, Dropdown, knMonaco, RadioButton, KnValidationMessages, Dialog, DataTable, Column },
    props: { selectedDataset: { type: Object as any }, pythonEnvironments: { type: Array as any }, rEnvironments: { type: Array as any } },
    emits: ['touched'],
    data() {
        return {
            pythonDescriptor,
            v$: useValidate() as any,
            dataset: {} as any,
            pythonEnvLibs: null as any,
            libListVisible: false
        }
    },
    watch: {
        selectedDataset() {
            this.loadDataset()
        }
    },
    created() {
        this.loadDataset()
    },
    validations() {
        const pythonFieldsRequired = (value) => {
            return this.dataset.dsTypeCd != 'Python/R' || value
        }
        const customValidators: ICustomValidatorMap = { 'python-fields-required': pythonFieldsRequired }
        const validationObject = { dataset: createValidations('dataset', pythonDescriptor.validations.dataset, customValidators) }
        return validationObject
    },
    methods: {
        loadDataset() {
            this.dataset = this.selectedDataset
            this.dataset.pythonDatasetType = 'python'
            this.dataset.pythonScript ? '' : (this.dataset.pythonScript = '')
        },
        getEnvLibraries() {
            return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/backendservices/widgets/python/libraries/${this.dataset.pythonEnvironment.label}`)
        },
        async checkEnvironment() {
            await this.$http
            this.getEnvLibraries()
                .then((response: AxiosResponse<any>) => {
                    this.dataset.pythonDatasetType == 'python' ? (this.pythonEnvLibs = JSON.parse(response.data.result)) : (this.pythonEnvLibs = JSON.parse(response.data.result))
                    this.libListVisible = true
                })
                .catch(() => {})
        },
        updateValueFromLabel(optionsArray, fieldToUpdate, updatedField) {
            const selectedField = optionsArray.find((option) => option.label === updatedField)
            selectedField ? (this.dataset.pythonEnvironment[fieldToUpdate] = selectedField.value) : ''
        },
        resetPythonEnv() {
            this.dataset.pythonEnvironment = {
                label: '',
                value: ''
            }
        }
    }
})
</script>
