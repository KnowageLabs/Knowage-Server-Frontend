<template>
    <q-card>
        <q-table v-if="constraints" v-model:selected="selectedMode.associatedChecks" :pagination="{ rowsPerPage: 10 }" class="q-pa-sm" :rows="constraints" :columns="columns" selection="multiple" dense data-test="values-list"></q-table>
    </q-card>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    name: 'constraints-card',
    props: {
        constraints: {
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
            columns: [
                { field: 'name', name: 'name', label: this.$t('common.roles'), align: 'left', sortable: true },
                { field: 'description', name: 'description', label: this.$t('common.description'), align: 'left' }
            ]
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
