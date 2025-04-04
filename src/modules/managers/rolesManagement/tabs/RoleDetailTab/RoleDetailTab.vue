<template>
    <q-card class="q-ma-sm">
        <q-card-section class="row q-col-gutter-sm">
            <q-input class="col-4" v-model.trim="v$.role.name.$model" :label="$t('common.name') + '*'" filled @update:model-value="(value) => onFieldChange('name', value)" maxlength="100" data-test="name-input" />
            <q-input class="col-4" v-model.trim="v$.role.code.$model" :label="$t('managers.rolesManagement.detail.code') + '*'" filled @update:model-value="(value) => onFieldChange('code', value)" maxlength="20" data-test="code-input" />
            <q-select
                class="col-4"
                v-model.trim="v$.role.roleTypeID.$model"
                :options="translatedRoleTypes"
                emit-value
                map-options
                option-label="VALUE_CD"
                option-value="VALUE_ID"
                :label="$t('managers.rolesManagement.detail.roleTypeID') + '*'"
                filled
                @update:model-value="(value) => onRoleTypeChange('roleTypeID', 'roleTypeCD', value)"
                data-test="name-input"
            />
            <q-input class="col-12" type="textarea" rows="2" v-model.trim="v$.role.description.$model" :label="$t('common.description')" filled @update:model-value="(value) => onFieldChange('description', value)" maxlength="150" data-test="description-input" />
            <q-toggle v-model="role.isPublic" :label="$t('managers.rolesManagement.detail.isPublic')" @update:model-value="onPublicChange" />
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import rolesManagementTabViewDescriptor from '../../RolesManagementTabViewDescriptor.json'
import roleDetailValidationDescriptor from './RoleDetailValidationDescriptor.json'

export default defineComponent({
    name: 'detail-tab',
    components: {
        KnValidationMessages
    },
    props: {
        selectedRole: {
            type: Object,
            requried: false
        },
        publicRole: {
            type: Object,
            requried: false
        }
    },
    emits: ['fieldChanged', 'roleTypeChanged'],
    data() {
        return {
            rolesManagementTabViewDescriptor,
            roleDetailValidationDescriptor,
            translatedRoleTypes: [] as any,
            v$: useValidate() as any,
            roleTypes: [] as any,
            role: {} as any
        }
    },
    validations() {
        return {
            role: createValidations('role', roleDetailValidationDescriptor.validations.role)
        }
    },
    watch: {
        selectedRole() {
            this.v$.$reset()
            this.role = { ...this.selectedRole } as any
            if (!this.role.isPublic) this.role.isPublic = false
        }
    },
    async created() {
        if (this.selectedRole) {
            this.role = { ...this.selectedRole } as any
            if (!this.role.isPublic) this.role.isPublic = false
        }
        await this.loadRoleTypes()
    },
    methods: {
        async loadRoleTypes() {
            await this.loadDomains('ROLE_TYPE').then((response: AxiosResponse<any>) => {
                this.roleTypes = response.data
                this.translatedRoleTypes = response.data.map((roleType) => {
                    return {
                        VALUE_CD: this.$t(`managers.rolesManagement.rolesDropdown.${roleType.VALUE_CD}`),
                        VALUE_ID: roleType.VALUE_ID
                    }
                })
            })
        },
        onFieldChange(fieldName: string, value: any) {
            this.$emit('fieldChanged', { fieldName, value })
        },
        loadDomains(type: string) {
            return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/domains/listValueDescriptionByType?DOMAIN_TYPE=${type}`)
        },
        onRoleTypeChange(roleTypeIDField: string, roleTypeCDField: string, event) {
            const selRoleType = this.roleTypes.find((roleType) => roleType.VALUE_ID === event)
            if (selRoleType) {
                this.role.roleTypeCD = selRoleType.VALUE_CD
            }
            const ID = event
            const CD = this.role.roleTypeCD
            this.$emit('roleTypeChanged', { roleTypeIDField, roleTypeCDField, ID, CD })
        },
        onPublicChange() {
            if (this.publicRole && this.publicRole.id != this.role.id && this.role.isPublic) {
                const warningMessage = this.$t('managers.rolesManagement.publicRoleWarning1') + `< ${this.publicRole.name} >` + this.$t('managers.rolesManagement.publicRoleWarning2')
                this.$confirm.require({
                    message: warningMessage,
                    header: this.$t('common.warning'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.role.isPublic = true
                        this.onFieldChange('isPublic', true)
                    },
                    reject: () => {
                        this.role.isPublic = false
                        this.onFieldChange('isPublic', false)
                    }
                })
            } else {
                this.onFieldChange('isPublic', this.role.isPublic)
            }
        }
    }
})
</script>
