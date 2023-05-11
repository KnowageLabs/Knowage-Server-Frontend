<template>
    <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3"> {{ $t('common.information') }}</label>

        <form class="p-fluid p-formgrid p-grid p-m-1">
            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <InputText
                        id="name"
                        v-model="v$.document.name.$model"
                        class="kn-material-input"
                        type="text"
                        max-length="30"
                        :class="{
                            'p-invalid': v$.document.name.$invalid && v$.document.name.$dirty
                        }"
                        @blur="v$.document.name.$touch()"
                    />
                    <label for="name" class="kn-material-input-label"> {{ $t('common.name') }} * </label>
                </span>
                <KnValidationMessages class="p-mt-1" :v-comp="v$.document.name" :additional-translate-params="{ fieldName: $t('common.name') }" />
            </div>
            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <Textarea
                        id="description"
                        v-model="v$.document.description.$model"
                        class="kn-material-input kn-width-full"
                        rows="9"
                        max-length="150"
                        :auto-resize="true"
                        :class="{
                            'p-invalid': v$.document.description.$invalid && v$.document.description.$dirty
                        }"
                        @blur="v$.document.description.$touch()"
                    />
                    <label for="description" class="kn-material-input-label"> {{ $t('common.description') }} </label>
                </span>
                <KnValidationMessages class="p-mt-1" :v-comp="v$.document.description" :additional-translate-params="{ fieldName: $t('common.description') }" />
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import informationDescriptor from './DashboardInformationDescriptor.json'
import useValidate from '@vuelidate/core'
import { createValidations } from '@/helpers/commons/validationHelper'
import Textarea from 'primevue/textarea'

export default defineComponent({
    name: 'dashboard-variables',
    components: { Textarea },
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
        console.log('dashboardModel', this.dashboardModel)
    },
    validations() {
        const validationObject = { document: createValidations('document', informationDescriptor.validations.document) }
        return validationObject
    },
    methods: {}
})
</script>
