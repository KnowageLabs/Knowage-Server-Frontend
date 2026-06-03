<template>
    <div class="q-px-md q-pb-md q-gutter-sm">
        <q-input v-model="v$.document.name.$model" :label="$t('common.name') + ' *'" outlined dense disable maxlength="30" hide-bottom-space :error="v$.document.name.$invalid && v$.document.name.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('common.name') })" @blur="v$.document.name.$touch()" />
        <q-input v-model="v$.document.description.$model" :label="$t('common.description')" outlined dense type="textarea" autogrow maxlength="150" hide-bottom-space :error="v$.document.description.$invalid && v$.document.description.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('common.description') })" @blur="v$.document.description.$touch()" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import informationDescriptor from './DashboardInformationDescriptor.json'
import useValidate from '@vuelidate/core'
import { createValidations } from '@/helpers/commons/validationHelper'

export default defineComponent({
    name: 'dashboard-variables',
    components: {},
    props: {
        dashboardModelProp: {
            type: Object as any,
            default() {
                return {}
            }
        }
    },
    data() {
        return {
            descriptor,
            dashboardModel: {} as any,
            document: {} as any,
            v$: useValidate() as any
        }
    },
    watch: {},
    created() {
        this.dashboardModel = this.dashboardModelProp
        this.document = this.dashboardModelProp.document
    },
    validations() {
        const validationObject = { document: createValidations('document', informationDescriptor.validations.document) }
        return validationObject
    },
    methods: {}
})
</script>
