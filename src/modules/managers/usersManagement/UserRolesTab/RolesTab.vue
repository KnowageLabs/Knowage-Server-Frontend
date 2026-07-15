<template>
    <div class="um-tab-layout">
        <q-scroll-area class="um-tab-scroll">
            <div class="um-tab-container">
                <q-card v-if="selectedRoles.length > 1">
                    <q-card-section class="q-py-sm">
                        <div class="um-section-label">{{ $t('managers.usersManagement.form.defaultRole') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <q-select outlined dense v-model="defaultRole" :options="selectedRolesWithEmpty()" option-label="name" :label="$t('managers.usersManagement.form.defaultRole')" @update:model-value="onSelectDefaultRole">
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
                        <q-table dense flat selection="multiple" :rows="rolesList" v-model:selected="selectedRoles" :columns="cols" :pagination="{ rowsPerPage: 20 }" row-key="id" @update:selected="onRowSelect"></q-table>
                    </q-card-section>
                </q-card>
            </div>
        </q-scroll-area>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import rolesTabDescriptor from './RolesTabDescriptor.json'
import { iRole } from '../UsersManagement'

export default defineComponent({
    name: 'roles-tab',
    props: {
        defRole: Number,
        rolesList: { type: Array as PropType<iRole[]>, default: () => [] },
        selected: Array
    },
    emits: ['changed', 'setDefaultRole'],
    data() {
        return {
            defaultRole: null as null | iRole,
            rolesTabDescriptor,
            selectedRoles: [] as any,
            emptyOption: { id: null, name: this.$t('managers.usersManagement.emptyRolesOption'), value: '' },
            cols: [
                { name: 'name', field: 'name', label: this.$t('common.name'), align: 'left', sortable: true },
                { name: 'description', field: 'description', label: this.$t('common.description'), align: 'left' }
            ] as any[]
        }
    },
    mounted() {
        this.selectedRoles = this.selected || []
        this.setDefaultRole(this.defRole)
    },
    updated() {
        this.selectedRoles = this.selected || []
        this.setDefaultRole(this.defRole)
    },
    methods: {
        setDefaultRole(defRole) {
            if (this.selectedRoles) {
                const defaultRoleObj = this.selectedRoles.find((role) => role.id === defRole)
                this.defaultRole = defaultRoleObj ? defaultRoleObj : this.emptyOption
            }
        },
        onRowSelect() {
            if (this.selectedRoles?.length <= 1) {
                this.defaultRole = null
                this.onSelectDefaultRole()
            }
            this.$emit('changed', this.selectedRoles)
        },

        onSelectDefaultRole() {
            this.$emit('setDefaultRole', this.defaultRole ? this.defaultRole.id : null)
        },
        selectedRolesWithEmpty() {
            const selecteRolesArray: iRole[] = this.selectedRoles ? [...this.selectedRoles] : []
            selecteRolesArray.unshift(this.emptyOption)
            return selecteRolesArray
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
