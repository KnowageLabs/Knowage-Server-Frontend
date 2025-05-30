<template>
    <div class="kn-page">
        <div class="kn-page-content p-grid p-m-0">
            <div class="kn-list--column p-col-4 p-sm-4 p-md-3 p-p-0">
                <Toolbar class="kn-toolbar kn-toolbar--primary">
                    <template #start>
                        {{ $t('managers.rolesManagement.title') }}
                    </template>
                    <template #end>
                        <FabButton icon="fas fa-plus" data-test="open-form-button" @click="showForm" />
                    </template>
                </Toolbar>
                <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
                <KnListBox class="kn-height-full" :options="roles" :settings="rolesDecriptor.knListSettings" @click="showForm" @delete.stop="deleteRoleConfirm"></KnListBox>
            </div>

            <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 kn-router-view">
                <router-view :public-role="publicRole" @touched="touched = true" @closed="touched = false" @inserted="pageReload" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iRole } from './RolesManagement'
import { AxiosResponse } from 'axios'
import rolesDecriptor from './RolesManagementDescriptor.json'
import FabButton from '@/components/UI/KnFabButton.vue'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'roles-management',
    components: { FabButton, KnListBox },
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            roles: [] as iRole[],
            loading: false,
            touched: false,
            rolesDecriptor: rolesDecriptor,
            hiddenForm: false,
            dirty: false,
            publicRole: null as any
        }
    },
    async created() {
        await this.loadAllRoles()
    },
    methods: {
        async loadAllRoles() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/roles')
                .then((response: AxiosResponse<any>) => {
                    this.roles = response.data
                    this.checkAllRolesForPublicRole()
                })
                .finally(() => (this.loading = false))
        },
        checkAllRolesForPublicRole() {
            this.publicRole = null
            this.roles.forEach((role) => {
                if (role.isPublic) {
                    this.publicRole = role
                }
            })
        },
        showForm(event: any) {
            const path = event.item ? `/roles-management/${event.item.id}` : '/roles-management/new-role'

            if (!this.touched) {
                this.$router.push(path)
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.$router.push(path)
                    }
                })
            }
        },
        deleteRoleConfirm(event: any) {
            if (!event.item) return
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteRole(event.item.id)
            })
        },
        async deleteRole(roleId: number) {
            await this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/roles/' + roleId, { headers: { 'X-Disable-Errors': 'true' } })
                .then(() => {
                    this.store.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteSuccess')
                    })
                    this.$router.push('/roles-management')
                    this.loadAllRoles()
                })
                .catch((error) => {
                    if (error) {
                        this.store.setError({
                            title: this.$t('common.toast.deleteTitle'),
                            msg: this.$t('managers.rolesManagement.errors.delete')
                        })
                    }
                })
        },
        pageReload() {
            this.touched = false
            this.loadAllRoles()
        }
    }
})
</script>
