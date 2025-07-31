<template>
    <q-card>
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ $t('managers.usersManagement.roles') }}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="row q-gutter-sm">
            <q-banner v-if="selectedRoles.length > 1" dense class="bg-info col-12 text-center">
                <template v-slot:avatar>
                    <q-icon name="info" />
                </template>
                {{ $t('managers.usersManagement.defaultRoleInfo') }}
            </q-banner>
            <q-select v-if="selectedRoles.length > 1" filled class="col-12" v-model="defaultRole" :options="selectedRolesWithEmpty()" option-label="name" @update:model-value="onSelectDefaultRole"> </q-select>

            <q-table class="col-12" dense flat selection="multiple" :rows="rolesList" v-model:selected="selectedRoles" :columns="cols" :pagination="{ rowsPerPage: 20 }" row-key="id" @update:selected="onRowSelect"></q-table>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import rolesTabDescriptor from './RolesTabDescriptor.json'
import { iRole } from '../UsersManagement'

export default defineComponent({
    name: 'roles-tab',
    props: {
        defRole: Number,
        rolesList: Array,
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
