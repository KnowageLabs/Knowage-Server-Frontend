<template>
    <div class="um-tab-layout">
        <q-scroll-area class="um-tab-scroll">
            <div class="um-tab-container">
                <q-card>
                    <q-card-section class="q-py-sm">
                        <div class="um-section-label">{{ $t('managers.usersManagement.form.defaultRole') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <q-select v-if="checkedRoles.length > 1" outlined dense v-model="defaultRole" :options="checkedRolesWithEmpty" option-label="name" :label="$t('managers.usersManagement.form.defaultRole')" @update:model-value="onSelectDefaultRole">
                            <template #append>
                                <q-icon name="info" color="grey" size="xs">
                                    <q-tooltip>{{ $t('managers.usersManagement.defaultRoleInfo') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-select>
                    </q-card-section>
                </q-card>

                <q-card>
                    <q-card-section class="q-py-sm">
                        <div class="um-section-label">{{ $t('managers.usersManagement.roles') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section class="q-pa-none">
                        <q-list dense separator>
                            <q-item v-for="role in roles" :key="role.id">
                                <q-item-section avatar>
                                    <q-checkbox :model-value="roleStates[role.id]" :indeterminate="roleStates[role.id] === null" @update:model-value="setRoleState(role.id, $event)" />
                                </q-item-section>
                                <q-item-section>{{ role.name }}</q-item-section>
                                <q-item-section side>
                                    <span class="text-caption text-grey-6" style="cursor: default">
                                        {{ getUsersCount(role.id) }} / {{ selectedUsers.length }}
                                        <q-tooltip v-if="getUsersCount(role.id) > 0" max-width="300px">
                                            <div v-for="u in getUsersWithRole(role.id)" :key="u.userId">{{ u.fullName }} ({{ u.userId }})</div>
                                        </q-tooltip>
                                    </span>
                                </q-item-section>
                            </q-item>
                            <q-item v-if="roles.length === 0">
                                <q-item-section class="text-grey-6">{{ $t('common.info.noDataFound') }}</q-item-section>
                            </q-item>
                        </q-list>
                    </q-card-section>
                </q-card>
            </div>
        </q-scroll-area>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iUser, iRole, iUserBOResult } from '../UsersManagement'

export default defineComponent({
    name: 'users-bulk-roles-tab',
    props: {
        selectedUsers: {
            type: Array as PropType<iUser[]>,
            default: () => []
        },
        roles: {
            type: Array as PropType<iRole[]>,
            default: () => []
        }
    },
    emits: ['dirty'],
    data() {
        return {
            roleStates: {} as Record<number, boolean | null>,
            isDirty: false as boolean,
            defaultRole: null as null | iRole
        }
    },
    computed: {
        checkedRoles(): iRole[] {
            return this.roles.filter((r) => this.roleStates[r.id!] === true)
        },
        checkedRolesWithEmpty(): (iRole | { id: null; name: string; value: string })[] {
            return [{ id: null, name: this.$t('managers.usersManagement.emptyRolesOption'), value: '' }, ...this.checkedRoles]
        }
    },
    watch: {
        selectedUsers: {
            handler() {
                this.computeRoleStates()
            },
            immediate: true,
            deep: false
        },
        roles: {
            handler() {
                this.computeRoleStates()
            }
        }
    },
    methods: {
        computeRoleStates() {
            if (!this.selectedUsers.length || !this.roles.length) {
                this.roleStates = {}
                return
            }
            const states: Record<number, boolean | null> = {}
            for (const role of this.roles) {
                const count = this.selectedUsers.filter((u) => {
                    const ids = (u.sbiExtUserRoleses as any[]).map((r) => (typeof r === 'object' ? r.id : r))
                    return ids.includes(role.id)
                }).length
                if (count === this.selectedUsers.length) states[role.id!] = true
                else if (count === 0) states[role.id!] = false
                else states[role.id!] = null
            }
            this.roleStates = states
            this.isDirty = false
            this.defaultRole = null
        },
        setRoleState(roleId: number | null, val: boolean) {
            if (roleId === null) return
            this.roleStates = { ...this.roleStates, [roleId]: val }
            // If the previously selected default role was unchecked, reset it
            if (!val && this.defaultRole?.id === roleId) this.defaultRole = null
            if (!this.isDirty) {
                this.isDirty = true
                this.$emit('dirty')
            }
        },
        onSelectDefaultRole() {
            if (!this.isDirty) {
                this.isDirty = true
                this.$emit('dirty')
            }
        },
        getUsersCount(roleId: number | null): number {
            if (roleId === null) return 0
            return this.selectedUsers.filter((u) => {
                const ids = (u.sbiExtUserRoleses as any[]).map((r) => (typeof r === 'object' ? r.id : r))
                return ids.includes(roleId)
            }).length
        },
        getUsersWithRole(roleId: number | null): iUser[] {
            if (roleId === null) return []
            return this.selectedUsers.filter((u) => {
                const ids = (u.sbiExtUserRoleses as any[]).map((r) => (typeof r === 'object' ? r.id : r))
                return ids.includes(roleId)
            })
        },
        async save(): Promise<iUserBOResult[]> {
            const payload = this.selectedUsers.map((user) => {
                const originalIds: number[] = (user.sbiExtUserRoleses as any[]).map((r) => (typeof r === 'object' ? r.id : r))
                const newRoleIds: number[] = []
                for (const [roleIdStr, state] of Object.entries(this.roleStates)) {
                    const id = Number(roleIdStr)
                    if (state === true) newRoleIds.push(id)
                    else if (state === null && originalIds.includes(id)) newRoleIds.push(id)
                    // state === false → excluded for all
                }
                return { ...user, sbiExtUserRoleses: newRoleIds, defaultRoleId: this.defaultRole?.id ?? null }
            })
            const response = await this.$http.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/users/massiveUpdateRoles`, payload)
            this.isDirty = false
            return response.data as iUserBOResult[]
        }
    }
})
</script>

<style lang="scss" scoped>
.um-tab-layout {
    display: flex;
    flex-direction: column;
    flex: 1;
    background-color: #f3f3f3;
    overflow: hidden;
    height: 100%;
}
.um-tab-scroll {
    flex: 1;
}
.um-tab-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.um-section-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.54);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
</style>
