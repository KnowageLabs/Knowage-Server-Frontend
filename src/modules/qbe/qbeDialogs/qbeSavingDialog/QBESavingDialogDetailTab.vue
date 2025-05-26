<template>
    <q-card>
        <q-card-section>
            <form class="row q-col-gutter-sm">
                <q-input class="col-6" filled dense maxLength="50" v-model="v$.dataset.label.$model" :error="v$.dataset.label.$invalid" :error-message="v$.dataset.label.$errors[0]?.$message" :label="$t('common.label') + ' *'" @update:model-value="$emit('edited', v$)" />
                <q-input class="col-6" filled dense maxLength="50" v-model="v$.dataset.name.$model" :error="v$.dataset.name.$invalid" :error-message="v$.dataset.label.$errors[0]?.$message" :label="$t('common.name') + ' *'" @update:model-value="$emit('edited', v$)" />
                <q-input class="col-12" type="textarea" rows="2" filled dense maxLength="150" v-model="v$.dataset.description.$model" :label="$t('common.description')" @update:model-value="$emit('edited', v$)" />
                <q-select
                    class="col-6"
                    filled
                    dense
                    v-model="v$.dataset.scopeCd.$model"
                    :options="scopeTypes"
                    option-label="VALUE_CD"
                    option-value="VALUE_CD"
                    emit-value
                    map-options
                    :error="v$.dataset.scopeCd.$invalid && v$.dataset.scopeCd.$dirty"
                    :error-message="v$.dataset.label.$errors[0]?.$message"
                    :label="$t('managers.datasetManagement.scope') + ' *'"
                    @before-show="v$.dataset.scopeCd.$touch()"
                    @update:model-value="$emit('edited', v$)"
                />
                <q-select
                    class="col-6"
                    filled
                    dense
                    emit-value
                    map-options
                    v-model="v$.dataset.catTypeVn.$model"
                    :options="categoryTypes"
                    option-label="VALUE_CD"
                    option-value="VALUE_CD"
                    :error="v$.dataset.catTypeVn.$invalid && v$.dataset.catTypeVn.$dirty"
                    :error-message="v$.dataset.label.$errors[0]?.$message"
                    :label="$t('common.category') + (dataset.scopeCd == 'USER' ? '' : ' *')"
                    @before-show="v$.dataset.catTypeVn.$touch()"
                    @update:model-value="$emit('edited', v$)"
                />
            </form>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import descriptor from './QBESavingDialogDescriptor.json'
import mainStore from '../../../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    name: 'olap-custom-view-save-dialog',
    props: { propDataset: Object, scopeTypes: Array, categoryTypes: Array },
    emits: ['edited'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            v$: useValidate() as any,
            dataset: {} as any,
            descriptor
        }
    },
    computed: {
        qbeAdvancedSaving(): any {
            return (this.store.$state as any).user.functionalities.includes(UserFunctionalitiesConstants.QBE_ADVANCED_SAVING)
        }
    },
    watch: {
        selectedDataset() {
            this.dataset = this.propDataset
        }
    },
    created() {
        this.dataset = this.propDataset
        this.$emit('edited', this.v$)
    },
    validations() {
        const catTypeRequired = (value) => {
            return this.dataset.scopeCd == 'USER' || value
        }
        const customValidators: ICustomValidatorMap = { 'cat-type-required': catTypeRequired }
        const validationObject = { dataset: createValidations('dataset', descriptor.validations.dataset, customValidators) }
        return validationObject
    },
    methods: {
        updateIdFromCd(optionsArray, fieldToUpdate, updatedField) {
            const selectedField = optionsArray.find((option) => option.VALUE_CD === updatedField)
            selectedField ? (this.dataset[fieldToUpdate] = selectedField.VALUE_ID) : ''
        }
    }
})
</script>
<style lang="scss">
#qbe-saving-dialog .p-dialog-content {
    padding: 0;
}
</style>
