<template>
    <Card class="p-m-2">
        <template #content>
            <form class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-12">
                    <span class="p-float-label">
                        <InputText
                            id="sparqlEndpoint"
                            v-model.trim="v$.dataset.sparqlEndpoint.$model"
                            class="kn-material-input"
                            type="text"
                            :class="{
                                'p-invalid': v$.dataset.sparqlEndpoint.$invalid && v$.dataset.sparqlEndpoint.$dirty
                            }"
                            @blur="v$.dataset.sparqlEndpoint.$touch()"
                            @change="$emit('touched')"
                        />
                        <label for="sparqlEndpoint" class="kn-material-input-label"> {{ $t('managers.datasetManagement.sparqlEndpoint') }} * </label>
                    </span>
                    <KnValidationMessages class="p-mt-1" :v-comp="v$.dataset.sparqlEndpoint" :additional-translate-params="{ fieldName: $t('managers.datasetManagement.sparqlEndpoint') }" />
                </div>
                <div class="p-field p-col-6">
                    <span class="p-float-label">
                        <InputText id="sparqlDefaultGraphIri" v-model.trim="dataset.sparqlDefaultGraphIri" class="kn-material-input" @change="$emit('touched')" />
                        <label for="sparqlDefaultGraphIri" class="kn-material-input-label"> {{ $t('managers.datasetManagement.sparqlDefaultGraphIri') }} </label>
                    </span>
                </div>
                <div class="p-field p-col-6">
                    <span class="p-float-label">
                        <InputText id="sparqlExecutionTimeout" v-model.trim="dataset.sparqlExecutionTimeout" class="kn-material-input" type="number" @change="$emit('touched')" />
                        <label for="sparqlExecutionTimeout" class="kn-material-input-label"> {{ $t('managers.datasetManagement.sparqlExecutionTimeout') }} </label>
                    </span>
                </div>
            </form>
            <knMonaco ref="editor" v-model="dataset.sparqlQuery" style="height: 200px" language="sparql" @change="$emit('touched')"></knMonaco>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import sparqlDescriptor from './DatasetManagementSparqlDataset.json'
import Card from 'primevue/card'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    components: { Card, knMonaco, KnValidationMessages },
    props: { selectedDataset: { type: Object as any } },
    emits: ['touched'],
    data() {
        return {
            sparqlDescriptor,
            dataset: {} as any,
            v$: useValidate() as any
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
        const sparqlFieldsRequired = (value) => {
            return this.dataset.dsTypeCd != 'SPARQL' || value
        }
        const customValidators: ICustomValidatorMap = { 'sparql-fields-required': sparqlFieldsRequired }
        const validationObject = { dataset: createValidations('dataset', sparqlDescriptor.validations.dataset, customValidators) }
        return validationObject
    },
    methods: {
        loadDataset() {
            this.dataset = this.selectedDataset
            this.dataset.sparqlQuery ? '' : (this.dataset.sparqlQuery = '')
        }
    }
})
</script>
