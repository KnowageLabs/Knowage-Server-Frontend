<template>
    <Dialog :visible="true" :modal="true" class="kn-dialog--toolbar--primary" :header="formHeader" :closable="false" :style="configurationManagementDescriptor.form.style">
        <form class="p-fluid p-m-5">
            <div class="p-field" :style="configurationManagementDescriptor.pField.style">
                <span class="p-float-label">
                    <InputText
                        id="label"
                        v-model.trim="v$.configuration.label.$model"
                        class="kn-material-input"
                        type="text"
                        :class="{
                            'p-invalid': v$.configuration.label.$invalid && v$.configuration.label.$dirty
                        }"
                        max-length="100"
                        @blur="v$.configuration.label.$touch()"
                    />
                    <label for="label" class="kn-material-input-label"> {{ $t('managers.configurationManagement.headers.label') }} * </label>
                </span>
                <KnValidationMessages
                    :v-comp="v$.configuration.label"
                    :additional-translate-params="{
                        fieldName: $t('managers.configurationManagement.headers.label')
                    }"
                ></KnValidationMessages>
            </div>

            <div class="p-field" :style="configurationManagementDescriptor.pField.style">
                <span class="p-float-label">
                    <InputText
                        id="name"
                        v-model.trim="v$.configuration.name.$model"
                        class="kn-material-input"
                        type="text"
                        :class="{
                            'p-invalid': v$.configuration.name.$invalid && v$.configuration.name.$dirty
                        }"
                        max-length="100"
                        @blur="v$.configuration.name.$touch()"
                    />
                    <label for="name" class="kn-material-input-label"> {{ $t('managers.configurationManagement.headers.name') }} * </label>
                </span>
                <KnValidationMessages
                    :v-comp="v$.configuration.name"
                    :additional-translate-params="{
                        fieldName: $t('managers.configurationManagement.headers.name')
                    }"
                ></KnValidationMessages>
            </div>

            <div class="p-field" :style="configurationManagementDescriptor.pField.style">
                <span class="p-float-label">
                    <InputText
                        id="description"
                        v-model.trim="v$.configuration.description.$model"
                        class="kn-material-input"
                        type="text"
                        :class="{
                            'p-invalid': v$.configuration.description.$invalid && v$.configuration.description.$dirty
                        }"
                        max-length="500"
                        @blur="v$.configuration.description.$touch()"
                    />
                    <label for="description" class="kn-material-input-label">
                        {{ $t('managers.configurationManagement.headers.description') }}
                    </label>
                </span>
                <KnValidationMessages
                    :v-comp="v$.configuration.description"
                    :additional-translate-params="{
                        fieldName: $t('managers.configurationManagement.headers.description')
                    }"
                ></KnValidationMessages>
            </div>

            <div class="p-field" :style="configurationManagementDescriptor.pField.style">
                <span class="p-float-label">
                    <Dropdown
                        id="category"
                        v-model="v$.configuration.category.$model"
                        class="kn-material-input"
                        :class="{
                            'p-invalid': v$.configuration.category.$invalid && v$.configuration.category.$dirty
                        }"
                        :options="configurationManagementDescriptor.category"
                        option-label="name"
                        option-value="value"
                        @before-show="v$.configuration.category.$touch()"
                    />
                    <label for="category" class="kn-material-input-label"> {{ $t('managers.configurationManagement.headers.category') }} * </label>
                </span>
                <KnValidationMessages
                    :v-comp="v$.configuration.category"
                    :additional-translate-params="{
                        fieldName: $t('managers.configurationManagement.headers.category')
                    }"
                ></KnValidationMessages>
            </div>
            <div class="p-field" :style="configurationManagementDescriptor.pField.style">
                <span v-if="configuration?.label?.toLowerCase().endsWith('.password')" class="p-float-label">
                    <InputText id="description" v-model.trim="v$.configuration.valueCheck.$model" class="kn-material-input" type="password" @blur="v$.configuration.valueCheck.$touch()" />
                    <label v-if="configuration.id" for="pwd" class="kn-material-input-label"> {{ $t('managers.dataSourceManagement.form.pwd') }}</label>
                    <label v-else for="description" class="kn-material-input-label"> {{ $t('managers.configurationManagement.headers.valueCheck') }} </label>
                </span>
                <span v-else class="p-float-label">
                    <InputText id="description" v-model.trim="v$.configuration.valueCheck.$model" class="kn-material-input" type="text" @blur="v$.configuration.valueCheck.$touch()" />
                    <label for="description" class="kn-material-input-label"> {{ $t('managers.configurationManagement.headers.valueCheck') }} </label>
                </span>
            </div>
            <div class="p-field" :style="configurationManagementDescriptor.pField.style">
                <div class="p-field-checkbox">
                    <Checkbox id="isActive" v-model="v$.configuration.active.$model" :binary="true" />
                    <label for="isActive"> {{ $t('managers.configurationManagement.headers.active') }}</label>
                </div>
            </div>
        </form>

        <template #footer>
            <Button class="kn-button kn-button--secondary" :label="$t('common.close')" data-test="close-button" @click="closeTemplate" />
            <Button class="kn-button kn-button--primary" :label="$t('common.save')" data-test="submit-button" :disabled="buttonDisabled" @click="handleSubmit" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { iConfiguration } from './ConfigurationManagement'
import configurationManagementDescriptor from './ConfigurationManagementDescriptor.json'
import configurationManagementValidationDescriptor from './ConfigurationManagementValidationDescriptor.json'
import useValidate from '@vuelidate/core'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'configuration-management-dialog',
    components: { Dialog, Dropdown, Checkbox, KnValidationMessages },
    props: {
        model: {
            type: Object,
            requried: false
        }
    },
    emits: ['close', 'created'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            configurationManagementDescriptor: configurationManagementDescriptor,
            configurationManagementValidationDescriptor: configurationManagementValidationDescriptor,
            configuration: {} as iConfiguration,
            v$: useValidate() as any,
            operation: 'insert',
            dirty: false,
            options: [true, false]
        }
    },
    validations() {
        return {
            configuration: createValidations('configuration', configurationManagementValidationDescriptor.validations.configuration)
        }
    },
    computed: {
        formHeader(): any {
            return this.configuration.id ? this.configuration.name : this.$t('managers.configurationManagement.createNewHeader')
        },
        buttonDisabled(): any {
            return this.v$.$invalid
        }
    },
    watch: {
        model() {
            this.configuration = { ...this.model } as iConfiguration
        }
    },
    mounted() {
        if (this.model) {
            this.configuration = { ...this.model } as iConfiguration
        }
    },
    methods: {
        async handleSubmit() {
            if (this.v$.$invalid) {
                return
            }
            let url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs'
            if (this.configuration.id) {
                this.operation = 'update'
                url += '/' + this.configuration.id
            }
            await this.sendRequest(url).then(() => {
                this.store.setInfo({
                    title: this.$t(this.configurationManagementDescriptor.operation[this.operation].toastTitle),
                    msg: this.$t(this.configurationManagementDescriptor.operation.success)
                })
                this.$emit('created')
            })
        },
        sendRequest(url: string) {
            if (this.operation === 'insert') {
                return this.$http.post(url, this.configuration)
            } else {
                return this.$http.put(url, this.configuration)
            }
        },
        closeTemplate() {
            this.$emit('close')
        }
    }
})
</script>
