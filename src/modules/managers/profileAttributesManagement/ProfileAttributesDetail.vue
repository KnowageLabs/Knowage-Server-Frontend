<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ attribute.attributeName }}</q-toolbar-title>

        <q-btn flat round dense icon="save" :disable="formValid" data-test="submit-button" @click="save">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeForm">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
        </q-btn>
    </q-toolbar>

    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />

    <div class="column q-mx-xs q-mt-xs q-gutter-sm kn-detail">
        <div class="row">
            <q-card class="full-width">
                <q-card-section>
                    <div class="row q-col-gutter-sm">
                        <q-input
                            filled
                            class="col"
                            v-model="v$.attribute.attributeName.$model"
                            maxLength="100"
                            :error="v$.attribute.attributeName.$invalid && v$.attribute.attributeName.$dirty"
                            :error-message="$t('common.validation.required', { fieldName: $t('managers.profileAttributesManagement.form.name') })"
                            :label="$t('managers.profileAttributesManagement.form.name') + '*'"
                            @update:model-value="onDataChange(v$.attribute.attributeName)"
                            data-test="name-input"
                        />

                        <q-select class="col" filled emit-value map-options options-dense :error="v$.attribute.value.$invalid && v$.attribute.value.$dirty" v-model="v$.attribute.value.$model" :options="attributeTypeValues" option-label="name" option-value="value" :label="$t('managers.profileAttributesManagement.form.dataType') + '*'" @update:model-value="onDataChange(v$.attribute.value)" />
                    </div>
                    <div class="row">
                        <q-input
                            filled
                            rows="2"
                            class="col"
                            type="textarea"
                            v-model="v$.attribute.attributeDescription.$model"
                            :error="v$.attribute.attributeDescription.$invalid && v$.attribute.attributeDescription.$dirty"
                            :error-message="$t('common.validation.required', { fieldName: $t('common.description') })"
                            maxLength="250"
                            :label="$t('common.description') + '*'"
                            data-test="description-input"
                            @update:model-value="onDataChange(v$.attribute.attributeDescription)"
                        />
                    </div>
                    <div class="row q-mt-sm justify-between">
                        <q-btn-toggle
                            v-model="manualInput"
                            toggle-color="primary"
                            :options="[
                                { label: $t('managers.profileAttributesManagement.form.manualInput'), value: true },
                                { label: $t('managers.profileAttributesManagement.form.lov'), value: false }
                            ]"
                        />
                        <div class="row">
                            <q-checkbox v-model="v$.attribute.multivalue.$model" size="sm" :label="$t('managers.profileAttributesManagement.form.multiValue')" @update:model-value="onDataChange(v$.attribute.multivalue)" />
                            <q-checkbox v-model="v$.attribute.allowUser.$model" size="sm" :label="$t('managers.profileAttributesManagement.form.allowUser')" @update:model-value="onDataChange(v$.attribute.allowUser)" />
                        </div>
                    </div>
                    <div class="row q-mt-sm q-col-gutter-sm" v-if="!manualInput">
                        <q-select class="col" filled emit-value map-options options-dense :error="v$.attribute.lovId.$invalid && v$.attribute.lovId.$dirty" v-model="v$.attribute.lovId.$model" :options="lovs" option-label="name" option-value="id" :label="$t('managers.profileAttributesManagement.form.lov') + '*'" @update:model-value="onLoveDropdownChange()">
                            <template v-slot:option="scope">
                                <q-item v-bind="scope.itemProps">
                                    <q-item-section>
                                        <q-item-label>{{ scope.opt.name }}</q-item-label>
                                        <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-select>
                        <div v-if="attribute.lovId && attribute.multivalue">
                            <q-btn-toggle
                                v-model="v$.attribute.syntax.$model"
                                toggle-color="primary"
                                class="q-mt-sm"
                                :options="[
                                    { label: $t('managers.profileAttributesManagement.form.syntax.simple'), value: false, title: '* Simple = (\'Italy\',\'USA\',\'Serbia\', ...)' },
                                    { label: $t('managers.profileAttributesManagement.form.syntax.complex'), value: true, title: '* Complex = {;{Italy;USA;Serbia; ...}}' }
                                ]"
                            />
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { iAttribute, iLov } from './ProfileAttributesManagement'
import useValidate from '@vuelidate/core'
import { createValidations } from '@/helpers/commons/validationHelper'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import ProfileAttributesManagementDescriptor from './ProfileAttributesManagementDescriptor.json'
import profileAttributesManagementValidationDescriptor from './ProfileAttributesManagementValidationDescriptor.json'
import mainStore from '../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'profile-attributes-detail',
    components: {
        KnValidationMessages
    },
    props: {
        selectedAttribute: {
            type: Object,
            required: true
        }
    },
    emits: ['refreshRecordSet', 'closesForm', 'dataChanged'],
    data() {
        return {
            v$: useValidate() as any,
            apiUrl: import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/',
            attribute: {} as iAttribute,
            lovs: {} as iLov,
            loading: false as boolean,
            isDirty: false as boolean,
            manualInput: true as boolean,
            profileAttributesManagementDescriptor: ProfileAttributesManagementDescriptor,
            attributeTypeValues: ProfileAttributesManagementDescriptor.attributeTypeValues
        }
    },
    computed: {
        formValid(): any {
            return this.v$.$invalid
        }
    },
    watch: {
        selectedAttribute: {
            handler: function (attribute) {
                this.v$.$reset()
                this.loadAttribute(attribute)
            }
        }
    },
    validations() {
        return {
            attribute: createValidations('attribute', profileAttributesManagementValidationDescriptor.validations.attribute)
        }
    },
    async created() {
        await this.loadLovs()
        if (this.selectedAttribute) {
            this.loadAttribute(this.selectedAttribute)
        }
    },
    methods: {
        ...mapActions(mainStore, ['setInfo']),
        onLoveBlur() {
            this.v$.attribute.lovId.$touch()
        },
        async loadLovs() {
            this.loading = true
            await this.$http
                .get(this.apiUrl + 'lovs/get/all')
                .then((response: AxiosResponse<any>) => {
                    this.lovs = response.data
                })
                .finally(() => (this.loading = false))
        },
        resetForm() {
            Object.keys(this.attribute).forEach((k) => delete this.attribute[k])
            if (!this.attribute.multivalue || this.attribute.multivalue == null) this.attribute.multivalue = false
            if (!this.attribute.allowUser || this.attribute.allowUser == null) this.attribute.allowUser = false
        },
        showForm() {
            this.resetForm()
        },
        async save() {
            let response: AxiosResponse<any>
            if (this.attribute.value === 'NUMBER') {
                this.attribute.value = 'NUM'
            }
            if (this.attribute.attributeId != null) {
                response = await this.$http.put(this.apiUrl + 'attributes/' + this.attribute.attributeId, this.attribute, ProfileAttributesManagementDescriptor.headers)
            } else {
                response = await this.$http.post(this.apiUrl + 'attributes/', this.attribute, ProfileAttributesManagementDescriptor.headers)
            }
            if (response.status == 200) {
                if (response.data.errors) {
                    console.log(response.data.errors)
                } else {
                    this.setInfo({
                        title: this.$t('managers.profileAttributesManagement.info.saveTitle'),
                        msg: this.$t('managers.profileAttributesManagement.info.saveMessage')
                    })
                }
            }

            this.$emit('refreshRecordSet')
            this.resetForm()
        },
        closeForm() {
            this.$emit('closesForm')
        },
        onAttributeSelect(event: any) {
            this.populateForm(event.data)
        },
        populateForm(attribute: iAttribute) {
            this.attribute = { ...attribute }

            if (typeof attribute.value === 'object' && attribute.value !== null) {
                this.attribute.value = attribute.value['type'].toUpperCase()
            }
            if (!this.attribute.multivalue || this.attribute.multivalue == null) this.attribute.multivalue = false
            if (!this.attribute.allowUser || this.attribute.allowUser == null) this.attribute.allowUser = false

            this.manualInput = !this.attribute.lovId
        },
        onDataChange(v$Comp) {
            v$Comp.$touch()
            this.$emit('dataChanged')
        },
        onLoveDropdownChange() {
            this.$emit('dataChanged')
        },
        loadAttribute(attribute) {
            if (attribute.attributeId === null) {
                this.resetForm()
                return
            }
            this.populateForm(attribute)
        },
        setDirty(v$Comp) {
            v$Comp.$touch()
            this.$emit('dataChanged')
        }
    }
})
</script>

<style lang="scss" scoped>
.table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media screen and (max-width: 960px) {
        align-items: start;
    }
}

.record-image {
    width: 50px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
}

.p-dialog .record-image {
    width: 50px;
    margin: 0 auto 2rem auto;
    display: block;
}

.confirmation-content {
    display: flex;
    align-items: center;
    justify-content: center;
}
@media screen and (max-width: 960px) {
    ::v-deep(.p-toolbar) {
        flex-wrap: wrap;

        .p-button {
            margin-bottom: 0.25rem;
        }
    }
}
</style>
