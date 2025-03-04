<template>
    <Card class="q-ma-md q-mt-sm">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--secondary">
                <template #start>
                    {{ $t('managers.menuManagement.roles') }}
                </template>
            </Toolbar>
        </template>
        <template #content>
            <div class="row q-mb-sm">
                <q-input dense outlined v-model="filter" class="col-4" :placeholder="$t('common.search')" data-test="search-input">
                    <template v-slot:prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </div>
            <q-table flat dense hide-pagination :rows="rolesListFiltered" :filter="filter" :pagination="{ rowsPerPage: 0 }" :columns="columns" row-key="name" selection="multiple" v-model:selected="selectedRoles" @update:selected="$emit('changed', $event)">
                <template #no-data>
                    <q-banner rounded dense class="bg-warning q-ma-sm text-center full-width">
                        <template v-slot:avatar>
                            <q-icon name="warning" />
                        </template>
                        {{ $t('managers.menuManagement.noRoles') }}
                    </q-banner>
                </template>
            </q-table>
        </template>
    </Card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { iRole } from '../MenuManagement'

export default defineComponent({
    name: 'roles-tab',
    components: {
        Card,
        Column,
        DataTable
    },
    props: {
        rolesList: {
            type: Array as PropType<iRole[]>
        },
        selected: Array as PropType<iRole[]>,
        parentNodeRoles: {
            type: Array as PropType<iRole[]>
        }
    },
    emits: ['changed'],
    data() {
        return {
            selectedRoles: [] as iRole[] | null,
            filter: null as string | null,
            columns: [{ name: 'name', sortable: true, field: 'name', label: this.$t('managers.functionalitiesManagement.roles'), align: 'left' }]
        }
    },
    computed: {
        rolesListFiltered(): iRole[] {
            if (!this.rolesList) return []
            if (this.parentNodeRoles) {
                return this.rolesList.filter((role) => this.parentNodeRoles && this.parentNodeRoles.findIndex((parentNodeRole) => parentNodeRole.id === role.id) >= 0)
            } else {
                return this.rolesList
            }
        }
    },
    created() {
        if (this.selected) {
            this.selectedRoles = this.selected
        }
    }
})
</script>
