<template>
    <div class="kn-page kn-width-full-with-menu">
        <div class="kn-page-content p-grid p-m-0">
            <div class="kn-list--column p-col-4 p-sm-4 p-md-3 p-p-0">
                <q-toolbar class="kn-toolbar kn-toolbar--primary">
                    <q-toolbar-title>{{ $t('managers.usersManagement.title') }}</q-toolbar-title>
                    <KnFabButton icon="fas fa-plus" data-test="new-button" @click="showForm()"></KnFabButton>
                </q-toolbar>
                <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                <KnListBox :options="users" :settings="usersManagementDescriptor.knListSettings" @click="onUserSelect" @delete.stop="onUserDelete" />
            </div>

            <KnHint v-if="hiddenForm" :title="'managers.usersManagement.title'" :hint="'managers.usersManagement.hint'"></KnHint>
            <div v-show="!hiddenForm" class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 kn-page">
                <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                    <q-toolbar-title>{{ userDetailsForm.userId }}</q-toolbar-title>
                    <q-btn flat round dense icon="save" :disable="!dirty || !passwordValidation" data-test="submit-button" @click="saveUser">
                        <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeForm">
                        <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
                    </q-btn>
                </q-toolbar>
                <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                <div class="kn-page-content">
                    <q-tabs align="left" v-model="selectedTab">
                        <q-tab name="detail" :label="$t('managers.usersManagement.detail')" />
                        <q-tab name="roles" :label="$t('managers.usersManagement.roles')" />
                        <q-tab name="attributes" :label="$t('managers.usersManagement.attributes')" />
                    </q-tabs>
                    <q-tab-panels v-model="selectedTab" animated keep-alive>
                        <q-tab-panel name="detail" class="q-pa-sm">
                            <DetailFormTab v-if="!hiddenForm" :form-insert="formInsert" :form-values="userDetailsForm" :vobj="v$" :disabled-u-i-d="disableUsername" :tenant="tenant" @dataChanged="onDataChange" @unlock="unlockUser($event)"></DetailFormTab>
                        </q-tab-panel>
                        <q-tab-panel name="roles" class="q-pa-sm">
                            <RolesTab :def-role="defaultRole" :roles-list="roles" :selected="selectedRoles" @changed="setSelectedRoles($event)" @setDefaultRole="setDefaultRoleValue($event)"></RolesTab>
                        </q-tab-panel>
                        <q-tab-panel name="attributes" class="q-pa-sm">
                            <UserAttributesForm v-model="attributesForm" :attributes="attributes" @formDirty="onFormDirty"></UserAttributesForm>
                        </q-tab-panel>
                    </q-tab-panels>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { iUser, iRole, iAttribute } from './UsersManagement'
import useValidate from '@vuelidate/core'
import { AxiosResponse } from 'axios'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import KnHint from '@/components/UI/KnHint.vue'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import RolesTab from './UserRolesTab/RolesTab.vue'
import DetailFormTab from './UserDetailTab/DetailFormTab.vue'
import UserAttributesForm from './UserAttributesTab/UserAttributesForm.vue'
import detailFormTabValidationDescriptor from './UserDetailTab/DetailFormTabValidationDescriptor.json'
import usersManagementDescriptor from './UsersManagementDescriptor.json'
import { sameAs } from '@vuelidate/validators'
import mainStore from '../../../App.store'
import { iTenant } from '../tenantManagement/TenantManagement'

export default defineComponent({
    name: 'user-management',
    components: { KnListBox, TabView, TabPanel, KnFabButton, KnHint, RolesTab, DetailFormTab, UserAttributesForm },
    data() {
        return {
            v$: useValidate() as any,
            apiUrl: import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/',
            users: [] as iUser[],
            roles: [] as iRole[],
            detailFormTabValidationDescriptor: detailFormTabValidationDescriptor,
            attributes: [],
            userDetailsForm: {} as any,
            dirty: false,
            formInsert: true,
            attributesForm: {},
            tempAttributes: {},
            defaultRole: null,
            hiddenForm: true,
            disableUsername: true,
            loading: false,
            selectedRoles: [] as iRole[],
            usersManagementDescriptor: usersManagementDescriptor,
            selectedTab: 'detail',
            tenant: {} as iTenant
        }
    },
    validations() {
        const customValidators: ICustomValidatorMap = {
            'custom-required': (value) => {
                return !this.formInsert || value
            },
            'password-format': (value) => {
                return value.match(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\-_|#$])[A-Za-z\d\-_|#$]{8,}/)
            },
            'custom-sameAs': sameAs(this.userDetailsForm.password)
        }
        const validationObject = {
            userDetailsForm: createValidations('userDetailsForm', detailFormTabValidationDescriptor.validations.userDetailsForm, customValidators)
        }

        return validationObject
    },
    computed: {
        ...mapState(mainStore, ['user']),
        passwordValidation() {
            return (this.disableUsername && !this.userDetailsForm.password) || (this.userDetailsForm.password && !this.v$.userDetailsForm.$invalid)
        }
    },
    async created() {
        await this.loadAllUsers()
        await this.loadAllRoles()
        await this.loadAllAttributes()
        await this.getTenantInfo()
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo', 'setLoading']),
        async loadAllUsers() {
            this.loading = true
            await this.$http
                .get(this.apiUrl + 'users')
                .then((response: AxiosResponse<any>) => {
                    this.users = response.data
                })
                .finally(() => (this.loading = false))
        },
        async loadAllRoles() {
            this.loading = true
            await this.$http
                .get(this.apiUrl + 'roles')
                .then((response: AxiosResponse<any>) => {
                    this.roles = response.data
                })
                .finally(() => (this.loading = false))
        },
        async loadAllAttributes() {
            this.loading = true
            await this.$http
                .get(this.apiUrl + 'attributes')
                .then((response: AxiosResponse<any>) => {
                    this.attributes = response.data
                })
                .finally(() => (this.loading = false))
        },
        setDefaultRoleValue(defaultRole: any) {
            this.defaultRole = defaultRole
            this.dirty = true
        },
        setSelectedRoles(roles: iRole[]) {
            this.selectedRoles = roles
            this.dirty = true
        },
        async showForm() {
            this.tempAttributes = {}
            this.attributesForm = {}
            this.disableUsername = false
            this.hiddenForm = false
            this.selectedRoles = []
            this.userDetailsForm.id = null
            this.userDetailsForm.userId = ''
            this.userDetailsForm.fullName = ''
            if (this.userDetailsForm.password) delete this.userDetailsForm.password
            if (this.userDetailsForm.passwordConfirm) delete this.userDetailsForm.passwordConfirm
            this.userDetailsForm.failedLoginAttempts = 0
            this.userDetailsForm.sbiExtUserRoleses = []
            this.userDetailsForm.sbiUserAttributeses = {}

            this.formInsert = true
            this.dirty = false
            this.v$.$reset()

            this.populateForms(this.userDetailsForm)
        },
        formatUserObject() {
            const userToSave = { ...this.userDetailsForm }
            delete userToSave.passwordConfirm
            userToSave['defaultRoleId'] = this.defaultRole
            for (const key in this.attributesForm) {
                for (const key2 in this.attributesForm[key]) {
                    this.attributesForm[key][key2] === '' ? delete this.attributesForm[key] : ''
                }
            }
            userToSave['sbiUserAttributeses'] = { ...this.attributesForm }
            userToSave['sbiExtUserRoleses'] = this.selectedRoles ? [...this.selectedRoles.map((selRole) => selRole.id)] : []
            return userToSave
        },
        onFormDirty() {
            this.dirty = true
        },
        saveOrUpdateUser(user: iUser) {
            const endpointPath = `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/users`
            return this.userDetailsForm.id ? this.$http.put<any>(`${endpointPath}/${user.id}`, user) : this.$http.post<any>(endpointPath, user)
        },
        async saveUser() {
            this.loading = true
            const isNewUser = this.userDetailsForm.id ? false : true
            if (!this.selectedRoles || this.selectedRoles.length == 0) {
                this.setError({
                    title: this.userDetailsForm.id ? this.$t('common.toast.updateTitle') : this.$t('managers.usersManagement.info.createTitle'),
                    msg: this.$t('managers.usersManagement.error.noRolesSelected')
                })
                this.loading = false
            } else {
                const userToSave = this.formatUserObject()
                this.saveOrUpdateUser(userToSave)
                    .then((response: AxiosResponse<any>) => {
                        this.afterSaveOrUpdate(response, isNewUser)
                    })
                    .catch((error) => {
                        this.setError({
                            title: error.title,
                            msg: error.msg
                        })
                    })
                    .finally(() => {
                        this.loading = false
                    })
            }
        },
        async afterSaveOrUpdate(response: AxiosResponse<any>, isNewUser: boolean) {
            this.dirty = false
            await this.loadAllUsers()
            this.formInsert = false
            const id: number | null = response.data
            const selectedUser = this.users.find((user) => {
                return user.id === id
            })
            if (selectedUser) {
                this.onUserSelect(null, selectedUser)
            }
            this.setInfo({
                title: !isNewUser ? this.$t('common.toast.updateTitle') : this.$t('managers.usersManagement.info.createTitle'),
                msg: !isNewUser ? this.$t('common.toast.updateSuccess') : this.$t('managers.usersManagement.info.createMessage')
            })
        },
        onUserDelete(event: any) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.uppercaseDelete'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.loading = true
                    this.$http
                        .delete(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/users/${event.item.id}`)
                        .then(() => {
                            this.loadAllUsers()
                            this.setInfo({
                                title: this.$t('managers.usersManagement.info.deleteTitle'),
                                msg: this.$t('managers.usersManagement.info.deleteMessage')
                            })
                        })
                        .catch((error) => {
                            this.setError({
                                title: error.title,
                                msg: error.msg
                            })
                        })
                        .finally(() => {
                            this.hiddenForm = true
                            this.loading = false
                        })
                }
            })
        },
        async unlockUser() {
            this.userDetailsForm.failedLoginAttempts = 0
            await this.saveUser()
        },
        async onUserSelect(event, userSelected: any) {
            const user = userSelected || event.item
            this.formInsert = false
            if (this.dirty) {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.populateForms(user)
                        this.dirty = false
                    },
                    reject: () => {}
                })
            } else {
                this.populateForms(user)
            }
        },
        populateForms(userObj: any) {
            this.selectedTab = 'detail'
            this.dirty = false
            this.v$.$reset()
            this.attributesForm = {}
            this.hiddenForm = false
            this.disableUsername = userObj.id ? true : false
            this.defaultRole = userObj.defaultRoleId
            this.selectedRoles = this.getSelectedUserRoles(userObj.sbiExtUserRoleses)
            this.userDetailsForm = { ...userObj }
            if (this.userDetailsForm.password) delete this.userDetailsForm.password
            if (this.userDetailsForm.passwordConfirm) delete this.userDetailsForm.passwordConfirm
            this.populateAttributesForm(userObj.sbiUserAttributeses)
        },
        populateAttributesForm(userAttributeValues: any) {
            const tmp = {}
            this.attributes.forEach((attribute: iAttribute) => {
                const obj = {}
                obj[attribute.attributeName] = userAttributeValues && userAttributeValues[attribute.attributeId] ? userAttributeValues[attribute.attributeId][attribute.attributeName] : null
                tmp[attribute.attributeId] = obj
            })
            this.attributesForm = { ...tmp }
        },
        getSelectedUserRoles(userRoles: number[]) {
            return this.roles ? [...this.roles.filter((role) => userRoles && userRoles.find((userRoleId) => role.id === userRoleId))] : []
        },
        closeForm() {
            if (this.dirty) {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.hiddenForm = true
                        this.dirty = false
                    },
                    reject: () => {}
                })
            } else {
                this.hiddenForm = true
            }
        },
        onDataChange() {
            this.dirty = true
        },
        getTenantInfo() {
            this.setLoading(true)
            this.$http
                .get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/1.0/tenant/${this.user.organization}`)
                .then((response: AxiosResponse<any>) => {
                    this.tenant = response.data.root
                })
                .finally(() => this.setLoading(false))
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
