<template>
    <q-card class="q-mb-md">
        <q-card-section class="q-py-sm row items-center">
            <div class="dd-section-label col">{{ $t('documentExecution.documentDetails.drivers.visibilityTitle') }}</div>
            <q-btn :label="$t('managers.businessModelManager.addCondition')" flat dense icon="add" color="primary" size="sm" @click="openVisibilityConditionDialog('newCondition')">
                <q-tooltip>{{ $t('managers.businessModelManager.addCondition') }}</q-tooltip>
            </q-btn>
        </q-card-section>
        <q-separator />
        <q-linear-progress v-if="loading" indeterminate color="primary" />
        <q-list separator>
            <q-item v-for="(cond, i) in visusalDependencyObjects" :key="i" clickable @click="openVisibilityConditionDialog(cond)">
                <q-item-section>
                    <q-item-label class="text-body2 ellipsis">
                        <b>{{ cond.viewLabel }}</b> {{ cond.parFatherUrlName }} {{ cond.operation }}{{ cond.compareValue }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn flat round dense icon="delete" size="sm" color="negative" @click.stop="deleteCondition(cond)">
                        <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                    </q-btn>
                </q-item-section>
            </q-item>
            <q-item v-if="visusalDependencyObjects.length === 0">
                <q-item-section class="text-grey-6">{{ $t('documentExecution.documentDetails.drivers.noVisCond') }}</q-item-section>
            </q-item>
        </q-list>
    </q-card>

    <q-dialog :model-value="showVisibilityConditionDialog" persistent @hide="showVisibilityConditionDialog = false">
        <q-card style="min-width: 600px">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('documentExecution.documentDetails.drivers.visualizationTitle') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section>
                <div class="row q-col-gutter-sm">
                    <div class="col-12">
                        <q-input outlined dense v-model="v$.selectedCondition.viewLabel.$model" hide-bottom-space :label="$t('common.title') + ' *'" :error="v$.selectedCondition.viewLabel.$invalid && v$.selectedCondition.viewLabel.$dirty" :error-message="getValidationErrorMessage(v$.selectedCondition.viewLabel, $t('common.title'))" @blur="v$.selectedCondition.viewLabel.$touch()" />
                    </div>
                    <div class="col-12 col-md-4">
                        <q-select
                            hide-bottom-space
                            outlined
                            dense
                            emit-value
                            map-options
                            v-model="v$.selectedCondition.parFatherId.$model"
                            :options="availableDrivers"
                            option-label="label"
                            option-value="id"
                            :label="$t('managers.businessModelManager.analyticalDriver') + ' *'"
                            :error="v$.selectedCondition.parFatherId.$invalid && v$.selectedCondition.parFatherId.$dirty"
                            :error-message="getValidationErrorMessage(v$.selectedCondition.parFatherId, $t('managers.businessModelManager.analyticalDriver'))"
                            @blur="v$.selectedCondition.parFatherId.$touch()"
                            @update:model-value="setParFatherUrlName"
                        />
                    </div>
                    <div class="col-12 col-md-4">
                        <q-select
                            hide-bottom-space
                            outlined
                            dense
                            v-model="v$.selectedCondition.operation.$model"
                            :options="availableOperators"
                            :label="$t('managers.businessModelManager.filterOperator') + ' *'"
                            :error="v$.selectedCondition.operation.$invalid && v$.selectedCondition.operation.$dirty"
                            :error-message="getValidationErrorMessage(v$.selectedCondition.operation, $t('managers.businessModelManager.filterOperator'))"
                            @blur="v$.selectedCondition.operation.$touch()"
                        />
                    </div>
                    <div class="col-12 col-md-4">
                        <q-input hide-bottom-space outlined dense v-model="v$.selectedCondition.compareValue.$model" :label="$t('common.value') + ' *'" :error="v$.selectedCondition.compareValue.$invalid && v$.selectedCondition.compareValue.$dirty" :error-message="getValidationErrorMessage(v$.selectedCondition.compareValue, $t('common.value'))" @blur="v$.selectedCondition.compareValue.$touch()" />
                    </div>
                </div>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat :label="$t('common.cancel')" @click=";((showVisibilityConditionDialog = false), (selectedCondition = {} as iVisualDependency))" />
                <q-btn color="primary" :label="$t('common.save')" :disable="v$.$invalid" @click="saveCondition" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { iDriver, iDocument, iVisualDependency } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { defineComponent, PropType } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import driversDescriptor from './DocumentDetailsDriversDescriptor.json'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'document-visibility-conditions',
    components: {},
    props: { selectedDocument: { type: Object as PropType<iDocument>, required: true }, availableDrivers: { type: Array as PropType<iDriver[]>, required: true }, selectedDriver: { type: Object as PropType<iDriver>, required: true } },
    emits: ['driversChanged'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            v$: useValidate() as any,
            selectedCondition: {} as iVisualDependency,
            visusalDependencyObjects: [] as iVisualDependency[],
            availableOperators: driversDescriptor.availableOperators,
            showVisibilityConditionDialog: false,
            loading: false
        }
    },
    watch: {
        selectedDriver() {
            this.selectedDriver.id ? this.getVisualDependenciesByDriverId() : ''
        }
    },
    created() {
        this.selectedDriver.id ? this.getVisualDependenciesByDriverId() : ''
    },
    validations() {
        const visibilityValidator = (value) => {
            return Object.keys(this.selectedCondition).length === 0 || value
        }
        const customValidators: ICustomValidatorMap = { 'visibility-validator': visibilityValidator }
        const validationObject = { selectedCondition: createValidations('selectedCondition', driversDescriptor.validations.selectedCondition, customValidators) }
        return validationObject
    },
    methods: {
        async getVisualDependenciesByDriverId() {
            this.loading = true
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/visualdependencies?driverId=${this.selectedDriver.id}`)
                .then((response: AxiosResponse<any>) => {
                    this.visusalDependencyObjects = response.data
                })
                .finally(() => (this.loading = false))
        },
        openVisibilityConditionDialog(condition?) {
            condition != 'newCondition' ? (this.selectedCondition = { ...condition }) : (this.selectedCondition = { parId: this.selectedDriver.id, prog: this.visusalDependencyObjects.length + 1 } as iVisualDependency)
            this.showVisibilityConditionDialog = true
        },
        setParFatherUrlName(value) {
            this.availableDrivers.filter((driver) => {
                driver.id === value ? (this.selectedCondition.parFatherUrlName = driver.parameterUrlName) : ''
            })
        },
        getValidationErrorMessage(field: any, fieldName: string): string {
            if (!field.$invalid || !field.$dirty || !field.$errors.length) return ''
            const error = field.$errors[0]
            return this.$t(`common.validation.${error.$validator}`, { ...error.$params, fieldName })
        },
        async saveCondition() {
            await this.saveRequest()
                .then(() => {
                    this.store.setInfo({ title: this.$t('common.save'), msg: this.$t('documentExecution.documentDetails.drivers.conditionSavedMsg') })
                    this.showVisibilityConditionDialog = false
                    this.getVisualDependenciesByDriverId()
                })
                .catch((error) => {
                    this.store.setError({ title: this.$t('common.error.saving'), msg: error })
                })
        },
        saveRequest() {
            if (!this.selectedCondition.id) {
                return this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/visualdependencies`, this.selectedCondition, { headers: { 'X-Disable-Errors': 'true' } })
            } else {
                return this.$http.put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/visualdependencies`, this.selectedCondition, { headers: { 'X-Disable-Errors': 'true' } })
            }
        },
        async deleteCondition(conditionToDelete) {
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/visualdependencies/delete`, conditionToDelete, { headers: { 'X-Disable-Errors': 'true' } })
                .then(() => {
                    this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                    this.getVisualDependenciesByDriverId()
                })
                .catch((error) => {
                    this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: error })
                })
        }
    }
})
</script>
<style lang="scss" scoped></style>
