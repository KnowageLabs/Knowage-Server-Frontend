<template>
    <Card style="width: 100%" class="p-m-2">
        <template #content>
            <DataTable v-model:selection="selectedMode.associatedRoles" v-model:filters="filters" :paginator="true" :rows="10" :value="roles" class="p-datatable-sm kn-table" data-key="id" responsive-layout="stack" filter-display="menu" data-test="values-list">
                <template #header>
                    <div class="table-header">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText v-model="filters['global'].value" class="kn-material-input" type="text" :placeholder="$t('common.search')" badge="0" data-test="search-input" />
                        </span>
                    </div>
                </template>
                <template #empty>
                    {{ $t('common.info.noDataFound') }}
                </template>
                <template #loading>
                    {{ $t('common.info.dataLoading') }}
                </template>

                <Column selection-mode="multiple" header-style="width: 3rem"></Column>
                <Column field="name" header="Roles" class="kn-truncated"></Column>
            </DataTable>
        </template>
    </Card>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { filterDefault } from '@/helpers/commons/filterHelper'
import { FilterOperator } from 'primevue/api'
export default defineComponent({
    name: 'roles-card',
    components: { Column, DataTable },
    props: {
        roles: {
            type: Array,
            required: false
        },
        selectedModeProp: {
            type: Array,
            required: false
        }
    },
    data() {
        return {
            selectedMode: [] as any,
            filters: {
                global: [filterDefault],
                name: {
                    operator: FilterOperator.AND,
                    constraints: [filterDefault]
                }
            } as Object
        }
    },
    watch: {
        selectedModeProp() {
            this.selectedMode = this.selectedModeProp as any[]
        }
    },
    mounted() {
        if (this.selectedModeProp) {
            this.selectedMode = this.selectedModeProp as any[]
        }
    }
})
</script>
