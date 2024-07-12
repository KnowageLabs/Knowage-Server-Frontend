<template>
    <Card class="p-m-2">
        <template #content>
            <span class="p-float-label">
                <div class="p-field">
                    <span class="p-float-label">
                        <Dropdown
                            id="scriptLanguage"
                            v-model="v$.dataset.scriptLanguage.$model"
                            class="kn-material-input"
                            :style="queryDescriptor.style.maxWidth"
                            :options="scriptTypes"
                            option-label="VALUE_NM"
                            option-value="VALUE_CD"
                            :class="{
                                'p-invalid': v$.dataset.scriptLanguage.$invalid && v$.dataset.scriptLanguage.$dirty
                            }"
                            @before-show="v$.dataset.scriptLanguage.$touch()"
                        />
                        <label for="scope" class="kn-material-input-label"> {{ $t('managers.lovsManagement.language') }} * </label>
                    </span>
                    <KnValidationMessages
                        :v-comp="v$.dataset.scriptLanguage"
                        :additional-translate-params="{
                            fieldName: $t('managers.lovsManagement.language')
                        }"
                    />
                </div>
            </span>
            <knMonaco v-model="dataset.script" style="height: 400px" language="javascript" @keyup="$emit('touched')"></knMonaco>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import useValidate from '@vuelidate/core'
import queryDescriptor from './DatasetManagementScriptDataset.json'
import Dropdown from 'primevue/dropdown'
import Card from 'primevue/card'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'

export default defineComponent({
    components: { Card, Dropdown, knMonaco, KnValidationMessages },
    props: { selectedDataset: { type: Object as any }, scriptTypes: { type: Array as any }, activeTab: { type: Number as any } },
    emits: ['touched'],
    data() {
        return {
            queryDescriptor,
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
        const scriptFieldsRequired = (value) => {
            return this.dataset.dsTypeCd != 'Script' || value
        }
        const customValidators: ICustomValidatorMap = { 'script-fields-required': scriptFieldsRequired }
        const validationObject = { dataset: createValidations('dataset', queryDescriptor.validations.dataset, customValidators) }
        return validationObject
    },
    methods: {
        loadDataset() {
            this.dataset = this.selectedDataset
            this.dataset.script ? '' : (this.dataset.script = '')
            this.dataset.scriptLanguage ? '' : (this.dataset.scriptLanguage = 'ECMAScript')
        }
    }
})
</script>
