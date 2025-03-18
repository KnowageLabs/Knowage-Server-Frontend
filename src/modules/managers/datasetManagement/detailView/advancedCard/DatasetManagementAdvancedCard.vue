<template>
    <div v-if="dataset.dsTypeCd != 'Flat'">
        <Toolbar class="kn-toolbar kn-toolbar--secondary p-mt-3">
            <template #start>
                <InputSwitch v-model="dataset.isPersisted" :disabled="disablePersist" class="p-mr-2" @change="$emit('touched')" />
                <span v-tooltip.top="{ value: $t('managers.datasetManagement.peristenceWarning'), disabled: !disablePersist }">{{ $t('managers.datasetManagement.isPersisted') }}</span>
            </template>
        </Toolbar>
        <Card v-if="dataset.isPersisted">
            <template #content>
                <form class="p-fluid p-formgrid p-grid">
                    <div class="p-field p-col-3">
                        <span class="p-float-label">
                            <InputText
                                id="persistTableName"
                                v-model="dataset.persistTableName"
                                class="kn-material-input"
                                type="text"
                                :class="{
                                    'p-invalid': v$.dataset.persistTableName.$invalid && v$.dataset.persistTableName.$dirty
                                }"
                                @blur="v$.dataset.persistTableName.$touch()"
                                @change="$emit('touched')"
                            />
                            <label for="persistTableName" class="kn-material-input-label">{{ $t('managers.datasetManagement.persistTableName') }} *</label>
                        </span>
                        <KnValidationMessages class="p-mt-1" :v-comp="v$.dataset.persistTableName" :additional-translate-params="{ fieldName: $t('managers.datasetManagement.persistTableName') }" />
                    </div>
                </form>
                <Toolbar v-if="isAbleToSeeIsScheduledToolbar" class="kn-toolbar kn-toolbar--default p-mt-3">
                    <template #start>
                        <InputSwitch v-model="dataset.isScheduled" class="p-mr-2" @change="$emit('touched')" />
                        <span>{{ $t('managers.datasetManagement.isScheduled') }}</span>
                    </template>
                </Toolbar>
                <DatasetScheduler v-if="isAbleToSeeDatasetScheduler" :selected-dataset="dataset" :scheduling-data="schedulingData" />
            </template>
        </Card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import advancedCardDescriptor from './DatasetManagementAdvancedCardDescriptor.json'
import DatasetScheduler from './DatasetManagementScheduler.vue'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import InputSwitch from 'primevue/inputswitch'
import { mapState } from 'pinia'
import mainStore from '../../../../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    components: { Card, InputSwitch, Checkbox, KnValidationMessages, DatasetScheduler },
    props: {
        selectedDataset: { type: Object as any },
        transformationDataset: { type: Object as any },
        schedulingData: { type: Object as any }
    },
    emits: ['touched'],
    data() {
        return {
            v$: useValidate() as any,
            advancedCardDescriptor,
            dataset: {} as any,
            testInput: 'testinput',
            testCheckbox: true,
            isTransformable: false
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        }),
        disablePersist() {
            if (this.dataset['pars'] && this.dataset['pars'].length > 0) {
                return true
            }
            return false
        },
        isAbleToSeeIsScheduledToolbar(): boolean {
            return this.user.functionalities.includes(UserFunctionalitiesConstants.SCHEDULING_DATASET_MANAGEMENT) && this.dataset.isPersisted
        },
        isAbleToSeeDatasetScheduler(): boolean {
            return this.user.functionalities.includes(UserFunctionalitiesConstants.SCHEDULING_DATASET_MANAGEMENT) && this.dataset.isPersisted && this.dataset.isScheduled
        }
    },

    watch: {
        selectedDataset() {
            this.dataset = this.selectedDataset
            this.isDatasetTransformable()
        }
    },
    created() {
        this.dataset = this.selectedDataset
        this.isDatasetTransformable()
    },
    validations() {
        const transformationFieldsRequired = (value) => {
            return !this.isTransformable || value
        }
        const persistFieldsRequired = (value) => {
            return !this.dataset.isPersisted || value
        }
        const customValidators: ICustomValidatorMap = {
            'transformable-field-required': transformationFieldsRequired,
            'persist-field-required': persistFieldsRequired
        }
        const validationObject = {
            dataset: createValidations('dataset', advancedCardDescriptor.validations.advancedTab, customValidators)
        }
        return validationObject
    },
    methods: {
        isDatasetTransformable() {
            if (this.dataset.trasfTypeCd && this.dataset.trasfTypeCd == this.transformationDataset.VALUE_CD) {
                this.isTransformable = true
            } else {
                this.isTransformable = false
            }
        },
        setTransformationType() {
            if (this.isTransformable) {
                this.dataset.trasfTypeCd = this.transformationDataset.VALUE_CD
            } else {
                this.dataset.trasfTypeCd ? (this.dataset.trasfTypeCd = '') : null
                this.dataset.pivotColName ? (this.dataset.pivotColName = '') : null
                this.dataset.pivotColValue ? (this.dataset.pivotColValue = '') : null
                this.dataset.pivotIsNumRows ? (this.dataset.pivotIsNumRows = '') : null
                this.dataset.pivotRowName ? (this.dataset.pivotRowName = '') : null
            }
        }
    }
})
</script>
