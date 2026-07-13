<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row" style="position: unset">
                <q-drawer v-model="drawerVisible" side="left" :width="300" :breakpoint="0" show-if-above class="column no-wrap">
                    <q-toolbar class="kn-toolbar kn-toolbar--primary">
                        <q-toolbar-title>{{ $t('managers.usersManagement.title') }}</q-toolbar-title>
                        <q-btn round class="kn-fab-btn" data-test="new-button">
                            <q-icon name="fas fa-plus" size="xs" />
                            <q-menu square>
                                <q-list dense style="min-width: 180px">
                                    <q-item clickable v-close-popup @click="showForm()">
                                        <q-item-section avatar>
                                            <q-icon name="fas fa-plus" size="xs" />
                                        </q-item-section>
                                        <q-item-section>{{ $t('managers.usersManagement.newUser') }}</q-item-section>
                                    </q-item>
                                    <q-item clickable v-close-popup @click="importDialogVisible = true">
                                        <q-item-section avatar>
                                            <q-icon name="fas fa-file-import" size="xs" />
                                        </q-item-section>
                                        <q-item-section>{{ $t('managers.usersManagement.import.fromFile') }}</q-item-section>
                                    </q-item>
                                </q-list>
                            </q-menu>
                        </q-btn>
                    </q-toolbar>
                    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                    <UsersManagementList class="col kn-height-full" :users="users" :loading="loading" :active-user="activeUser" :selected-users="selectedUsers" @select="onUserSelect(null, $event)" @selectionChange="onSelectionChange" @delete="onUserDelete({ item: $event })" @lockToggle="onInlineLockToggle" />
                </q-drawer>

                <div class="col column no-wrap">
                    <KnHint v-if="viewMode === 'hint'" :title="'managers.usersManagement.title'" :hint="'managers.usersManagement.hint'"></KnHint>

                    <template v-if="viewMode === 'single'">
                        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                            <q-btn flat round dense icon="menu_open" @click="drawerVisible = !drawerVisible">
                                <q-tooltip>{{ $t('common.toggle') }}</q-tooltip>
                            </q-btn>
                            <q-toolbar-title>{{ userDetailsForm.userId }}</q-toolbar-title>
                            <q-btn flat round dense icon="save" :disable="!dirty || !passwordValidation" data-test="submit-button" @click="saveUser">
                                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
                            </q-btn>
                            <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeForm">
                                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
                            </q-btn>
                        </q-toolbar>
                        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                        <q-tabs dense align="left" class="kn-tabs" v-model="selectedTab" style="border-bottom: 1px solid #ccc">
                            <q-tab name="detail" :label="$t('managers.usersManagement.detail')" />
                            <q-tab name="roles" :label="$t('managers.usersManagement.roles')" />
                            <q-tab name="attributes" :label="$t('managers.usersManagement.attributes')" />
                        </q-tabs>
                        <q-tab-panels v-model="selectedTab" animated keep-alive class="col">
                            <q-tab-panel name="detail" class="q-pa-none kn-height-full">
                                <DetailFormTab v-if="viewMode === 'single'" :form-insert="formInsert" :form-values="userDetailsForm" :vobj="v$" :disabled-u-i-d="disableUsername" :tenant="tenant" @dataChanged="onDataChange" @unlock="unlockUser()"></DetailFormTab>
                            </q-tab-panel>
                            <q-tab-panel name="roles" class="q-pa-none kn-height-full">
                                <RolesTab :def-role="defaultRole ?? undefined" :roles-list="roles" :selected="selectedRoles" @changed="setSelectedRoles($event)" @setDefaultRole="setDefaultRoleValue($event)"></RolesTab>
                            </q-tab-panel>
                            <q-tab-panel name="attributes" class="q-pa-none kn-height-full">
                                <UserAttributesForm v-model="attributesForm" :attributes="attributes" @formDirty="onFormDirty"></UserAttributesForm>
                            </q-tab-panel>
                        </q-tab-panels>
                    </template>

                    <template v-if="viewMode === 'bulk'">
                        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                            <q-btn flat round dense icon="menu_open" @click="drawerVisible = !drawerVisible">
                                <q-tooltip>{{ $t('common.toggle') }}</q-tooltip>
                            </q-btn>
                            <q-toolbar-title>{{ $t('managers.usersManagement.bulk.title', { count: selectedUsers.length }) }}</q-toolbar-title>
                            <q-btn flat round dense icon="save" :disable="!bulkDirty || loading" data-test="bulk-save-button" @click="saveBulk">
                                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
                            </q-btn>
                            <q-btn flat round dense icon="cancel" @click="closeBulk">
                                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
                            </q-btn>
                        </q-toolbar>
                        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
                        <q-tabs dense align="left" class="kn-tabs" v-model="selectedBulkTab" style="border-bottom: 1px solid #ccc">
                            <q-tab name="roles" :label="$t('managers.usersManagement.roles')" />
                            <q-tab name="attributes" :label="$t('managers.usersManagement.attributes')" />
                        </q-tabs>
                        <q-tab-panels v-model="selectedBulkTab" animated keep-alive class="col">
                            <q-tab-panel name="roles" class="q-pa-none kn-height-full">
                                <UsersBulkRolesTab ref="bulkRolesTab" :selected-users="selectedUsers" :roles="roles" @dirty="bulkDirty = true" />
                            </q-tab-panel>
                            <q-tab-panel name="attributes" class="q-pa-none kn-height-full">
                                <UserAttributesForm v-model="bulkAttributesForm" :attributes="attributes" @formDirty="bulkDirty = true" />
                            </q-tab-panel>
                        </q-tab-panels>
                    </template>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>

    <UsersManagementImportDialog :visible="importDialogVisible" @close="importDialogVisible = false" @imported="loadAllUsers" />
    <UsersBulkResultsDialog :visible="bulkResultsVisible" :results="bulkResults" @close="bulkResultsVisible = false" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { iUser, iRole, iAttribute, iUserBOResult } from './UsersManagement'
import useValidate from '@vuelidate/core'
import { AxiosResponse } from 'axios'
import KnHint from '@/components/UI/KnHint.vue'
import UsersManagementList from './UsersManagementList.vue'
import RolesTab from './UserRolesTab/RolesTab.vue'
import UsersBulkRolesTab from './UserRolesTab/UsersBulkRolesTab.vue'
import DetailFormTab from './UserDetailTab/DetailFormTab.vue'
import UserAttributesForm from './UserAttributesTab/UserAttributesForm.vue'
import UsersManagementImportDialog from './UsersManagementImportDialog.vue'
import UsersBulkResultsDialog from './UsersBulkResultsDialog.vue'
import detailFormTabValidationDescriptor from './UserDetailTab/DetailFormTabValidationDescriptor.json'
import usersManagementDescriptor from './UsersManagementDescriptor.json'
import { sameAs } from '@vuelidate/validators'
import mainStore from '../../../App.store'
import { iTenant } from '../tenantManagement/TenantManagement'

export default defineComponent({
    name: 'user-management',
    components: { UsersManagementList, KnHint, RolesTab, UsersBulkRolesTab, DetailFormTab, UserAttributesForm, UsersManagementImportDialog, UsersBulkResultsDialog },
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
            viewMode: 'hint' as 'hint' | 'single' | 'bulk',
            drawerVisible: true,
            activeUser: null as iUser | null,
            disableUsername: true,
            loading: false,
            importDialogVisible: false,
            selectedRoles: [] as iRole[],
            selectedUsers: [] as iUser[],
            selectedBulkTab: 'roles',
            bulkAttributesForm: {} as any,
            bulkDirty: false,
            bulkResultsVisible: false,
            bulkResults: [] as iUserBOResult[],
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
            this.viewMode = 'single'
            this.activeUser = null
            this.selectedUsers = []
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
                            this.viewMode = 'hint'
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
            this.viewMode = 'single'
            this.activeUser = userObj
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
                        this.viewMode = 'hint'
                        this.activeUser = null
                        this.dirty = false
                    },
                    reject: () => {}
                })
            } else {
                this.viewMode = 'hint'
                this.activeUser = null
            }
        },
        onDataChange() {
            this.dirty = true
        },
        onSelectionChange(users: iUser[]) {
            this.selectedUsers = users
            if (users.length > 1) {
                if (this.dirty) {
                    this.$confirm.require({
                        message: this.$t('common.toast.unsavedChangesMessage'),
                        header: this.$t('common.toast.unsavedChangesHeader'),
                        icon: 'pi pi-exclamation-triangle',
                        accept: () => {
                            this.enterBulkMode()
                        },
                        reject: () => {}
                    })
                } else {
                    this.enterBulkMode()
                }
            } else if (users.length === 1) {
                this.onUserSelect(null, users[0])
            } else {
                this.viewMode = 'hint'
                this.activeUser = null
            }
        },
        enterBulkMode() {
            this.viewMode = 'bulk'
            this.selectedBulkTab = 'roles'
            this.bulkDirty = false
            this.bulkAttributesForm = {}
            this.attributes.forEach((attr: iAttribute) => {
                this.bulkAttributesForm[attr.attributeId] = { [attr.attributeName]: null }
            })
        },
        closeBulk() {
            if (this.bulkDirty) {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.selectedUsers = []
                        this.viewMode = 'hint'
                        this.bulkDirty = false
                    },
                    reject: () => {}
                })
            } else {
                this.selectedUsers = []
                this.viewMode = 'hint'
            }
        },
        async saveBulk() {
            this.loading = true
            const allResults: iUserBOResult[] = []
            try {
                const rolesTab = this.$refs.bulkRolesTab as any
                if (rolesTab?.isDirty) {
                    const rolesResults = await rolesTab.save()
                    allResults.push(...rolesResults)
                }
                const attrResults = await this.saveBulkAttributes()
                allResults.push(...attrResults)
                if (allResults.length > 0) {
                    this.bulkResults = allResults
                    this.bulkResultsVisible = true
                }
                this.bulkDirty = false
                await this.loadAllUsers()
            } catch (error: any) {
                this.setError({ title: this.$t('common.error.saving'), msg: error?.message || '' })
            } finally {
                this.loading = false
            }
        },
        async saveBulkAttributes(): Promise<iUserBOResult[]> {
            const filtered: any = {}
            for (const attrId of Object.keys(this.bulkAttributesForm)) {
                const attrObj = this.bulkAttributesForm[attrId]
                const hasValue = attrObj && Object.values(attrObj).some((v) => v !== null && v !== '')
                if (hasValue) filtered[attrId] = attrObj
            }
            if (Object.keys(filtered).length === 0) return []
            const payload = this.selectedUsers.map((user) => ({
                ...user,
                sbiUserAttributeses: filtered
            }))
            const response = await this.$http.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/users/massiveUpdateAttribute`, payload)
            return response.data as iUserBOResult[]
        },
        getTenantInfo() {
            this.setLoading(true)
            this.$http
                .get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/1.0/tenant/${this.user.organization}`)
                .then((response: AxiosResponse<any>) => {
                    this.tenant = response.data.root
                })
                .finally(() => this.setLoading(false))
        },
        async onInlineLockToggle(user: iUser) {
            this.loading = true
            try {
                if (user.flgPwdBlocked) {
                    await this.$http.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/users/unlockedUserAll`, [user])
                    this.setInfo({ title: this.$t('managers.usersManagement.unlockUser'), msg: this.$t('managers.usersManagement.info.unlockSuccess') })
                } else {
                    await this.$http.put(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/users/${user.id}`, { ...user, flgPwdBlocked: true })
                    this.setInfo({ title: this.$t('managers.usersManagement.lockUser'), msg: this.$t('managers.usersManagement.info.lockSuccess') })
                }
                await this.loadAllUsers()
            } catch (error: any) {
                this.setError({ title: error.title, msg: error.msg })
            } finally {
                this.loading = false
            }
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

.kn-fab-btn {
    position: absolute;
    width: 40px;
    right: 20px;
    height: 40px;
    transform: translateY(30%);
    z-index: 90;
    border-radius: 50%;
    background-color: var(--kn-button-fab-background-color);
    color: var(--kn-button-fab-color);
    box-shadow:
        0px 3px 5px -1px rgba(0, 0, 0, 0.2),
        0px 6px 10px 0px rgba(0, 0, 0, 0.14),
        0px 1px 18px 0px rgba(0, 0, 0, 0.12);
    transition: background-color 0.3s cubic-bezier(0.445, 0.05, 0.55, 0.95);
    &:hover {
        background-color: var(--kn-button-fab-hover-background-color);
        color: var(--kn-button-fab-hover-color);
    }
}

.record-image {
    width: 50px;
    box-shadow:
        0 3px 6px rgba(0, 0, 0, 0.16),
        0 3px 6px rgba(0, 0, 0, 0.23);
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
