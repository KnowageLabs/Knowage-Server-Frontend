<template>
    <div class="dd-tab-layout">
        <!-- LEFT: list -->
        <div class="dd-tab-list-col">
            <div class="dd-list-header row items-center q-px-sm q-py-xs">
                <q-input v-model="searchText" :placeholder="$t('common.search')" dense borderless clearable class="col q-pr-xs">
                    <template #prepend><q-icon name="search" size="16px" /></template>
                </q-input>
                <q-separator vertical />
                <q-btn class="q-ml-sm" unelevated dense icon="add" color="accent" @click="addParam">
                    <q-tooltip>{{ $t('common.add') }}</q-tooltip>
                </q-btn>
            </div>
            <q-separator />
            <q-scroll-area class="dd-scroll">
                <q-list separator class="dd-list">
                    <q-item v-for="param in filteredParams" :key="param.id ?? param.tempId" clickable :active="selectedParam === param" active-class="kn-list-item--selected" @click="selectParam(param)">
                        <q-item-section>
                            <q-item-label>{{ param.name || '—' }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn flat round dense icon="delete" size="sm" @click.stop="deleteParamConfirm(param)">
                                <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                            </q-btn>
                        </q-item-section>
                    </q-item>
                    <q-item v-if="filteredParams.length === 0">
                        <q-item-section class="text-grey-6 q-pa-sm">{{ $t('common.info.noDataFound') }}</q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
        </div>

        <q-separator vertical />

        <!-- RIGHT: detail -->
        <q-scroll-area class="dd-scroll dd-tab-detail-scroll">
            <div class="dd-params-detail">
                <KnHint v-if="Object.keys(selectedParam).length === 0" class="kn-hint-sm" :title="'documentExecution.documentDetails.drivers.noParamSelected'" :hint="$t('documentExecution.documentDetails.drivers.noParamSelectedHint')" data-test="hint"></KnHint>

                <q-card v-else>
                    <q-card-section class="q-py-sm">
                        <div class="dd-section-label">{{ $t('documentExecution.documentDetails.outputParams.paramDetails') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <div class="row q-col-gutter-sm">
                            <div class="col-6">
                                <q-input
                                    outlined
                                    dense
                                    hide-bottom-space
                                    v-model.trim="v$.selectedParam.name.$model"
                                    :label="$t('documentExecution.documentDetails.outputParams.paramName') + ' *'"
                                    :disable="!selectedParam.isUserDefined"
                                    :error="v$.selectedParam.name.$invalid && v$.selectedParam.name.$dirty"
                                    :error-message="getValidationErrorMessage(v$.selectedParam.name, $t('documentExecution.documentDetails.outputParams.paramName'))"
                                    @blur="v$.selectedParam.name.$touch()"
                                    @update:model-value="markSelectedParamForChange"
                                />
                            </div>
                            <div class="col-6">
                                <q-select outlined dense hide-bottom-space v-model="selectedParam.type" :options="typeList" option-label="valueCd" :label="$t('documentExecution.documentDetails.outputParams.paramType')" :disable="!selectedParam.isUserDefined" @update:model-value="markSelectedParamForChange" />
                            </div>
                            <div v-if="selectedParam.type?.valueCd === 'DATE'" :class="selectedParam.formatCode === 'CUSTOM' ? 'col-6' : 'col-12'">
                                <q-select outlined dense hide-bottom-space emit-value map-options v-model="selectedParam.formatCode" :options="dateFormats" option-label="translatedValueName" option-value="valueCd" :label="$t('managers.datasetManagement.ckanDateFormat')" :disable="!selectedParam.isUserDefined" @update:model-value="markSelectedParamForChange" />
                            </div>
                            <div v-if="selectedParam.type?.valueCd === 'DATE' && selectedParam.formatCode === 'CUSTOM'" class="col-6">
                                <q-input outlined dense hide-bottom-space v-model="selectedParam.formatValue" :label="$t('documentExecution.documentDetails.outputParams.customValue') + ' *'" :disable="!selectedParam.isUserDefined" @update:model-value="markSelectedParamForChange" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </q-scroll-area>
    </div>
</template>

<script lang="ts">
import { iDocument, iParType, iDateFormat, iOutputParam } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import { defineComponent, PropType } from 'vue'
import outputParamDescriptor from './DocumentDetailsOutputParametersDescriptor.json'
import useValidate from '@vuelidate/core'
import mainStore from '@/App.store'
import { useQuasar } from 'quasar'
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    name: 'document-output-parameters',
    props: { selectedDocument: { type: Object as PropType<iDocument>, required: true }, typeList: { type: Array as PropType<iParType[]>, required: true }, dateFormats: { type: Array as PropType<iDateFormat[]>, required: true } },
    emits: ['driversChanged'],
    components: { KnHint },
    setup() {
        const store = mainStore()
        const $q = useQuasar()
        return { store, $q }
    },
    data() {
        return {
            v$: useValidate() as any,
            outputParamDescriptor,
            searchText: '',
            selectedParam: {} as iOutputParam,
            document: {} as any
        }
    },
    computed: {
        filteredParams(): iOutputParam[] {
            if (!this.searchText) return this.document.outputParameters ?? []
            const needle = this.searchText.toLowerCase()
            return (this.document.outputParameters ?? []).filter((p: iOutputParam) => p.name?.toLowerCase().includes(needle))
        }
    },
    created() {
        this.document = this.selectedDocument
    },
    validations() {
        const outputParamsValidator = (value) => {
            return Object.keys(this.selectedParam).length === 0 || value
        }
        const customValidators: ICustomValidatorMap = { 'output-params-validator': outputParamsValidator }
        const validationObject = { selectedParam: createValidations('selectedParam', outputParamDescriptor.validations.selectedParam, customValidators) }
        return validationObject
    },
    methods: {
        addParam() {
            this.selectedParam = { numberOfErrors: 1, biObjectId: this.document.id, formatCode: null, formatValue: null, isUserDefined: true, type: this.typeList[0] ? this.typeList[0] : ({} as iParType), tempId: this.document.outputParameters.length + 1 } as iOutputParam
            this.document.outputParameters.push(this.selectedParam)
        },
        selectParam(param: iOutputParam) {
            this.selectedParam = param
        },
        markSelectedParamForChange() {
            this.selectedParam.isChanged = true
            this.selectedParam.numberOfErrors = this.v$.$errors.length
        },
        getValidationErrorMessage(field: any, fieldName: string): string {
            if (!field.$invalid || !field.$dirty || !field.$errors.length) return ''
            const error = field.$errors[0]
            return this.$t(`common.validation.${error.$validator}`, { ...error.$params, fieldName })
        },
        async deleteParamConfirm(param: iOutputParam) {
            if (param.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/outputparameters/${param.id}/sbicrossnavigation`).then((response: AxiosResponse<any>) => {
                    if (response.data.length === 0) {
                        this.$q
                            .dialog({
                                title: this.$t('common.toast.deleteConfirmTitle'),
                                message: this.$t('common.toast.deleteMessage'),
                                cancel: true,
                                persistent: true
                            })
                            .onOk(() => this.deleteParam(param))
                    } else {
                        this.$q.dialog({
                            title: this.$t('common.warning'),
                            message: this.$t('documentExecution.documentDetails.outputParams.usedParameterWarning', { count: response.data.length, cross: response.data.join(', ') })
                        })
                    }
                })
            } else {
                this.$q
                    .dialog({
                        title: this.$t('common.toast.deleteConfirmTitle'),
                        message: this.$t('common.toast.deleteMessage'),
                        cancel: true,
                        persistent: true
                    })
                    .onOk(() => this.deleteParam(param))
            }
        },
        async deleteParam(paramToDelete: iOutputParam) {
            if (paramToDelete.id) {
                await this.$http
                    .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/outputparameters/${paramToDelete.id}`, { headers: { 'X-Disable-Errors': 'true' } })
                    .then(() => {
                        const idx = this.document.outputParameters.findIndex((p: iOutputParam) => p.id === paramToDelete.id)
                        this.document.outputParameters.splice(idx, 1)
                        this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                        this.selectedParam = {} as iOutputParam
                    })
                    .catch((error) => {
                        this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: error.message })
                    })
            } else {
                const idx = this.document.outputParameters.findIndex((p: iOutputParam) => p.tempId === paramToDelete.tempId)
                this.document.outputParameters.splice(idx, 1)
                this.selectedParam = {} as iOutputParam
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.dd-params-detail {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    padding: 16px;
}
</style>
