<template>
    <q-dialog :model-value="visible" persistent @update:model-value="$emit('close')">
        <q-card style="min-width: 560px; max-width: 90vw">
            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                <q-toolbar-title>{{ $t('managers.usersManagement.bulk.results') }}</q-toolbar-title>
                <q-btn flat round dense icon="close" @click="$emit('close')">
                    <q-tooltip>{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
            <q-card-section class="q-pa-none">
                <q-table flat dense :rows="results" :columns="columns" row-key="userId" :pagination="{ rowsPerPage: 15 }">
                    <template #body-cell-success="props">
                        <q-td :props="props" class="text-center">
                            <q-chip v-if="props.row.success" dense color="positive" text-color="white" icon="check" :label="$t('common.success')" />
                            <q-chip v-else dense color="negative" text-color="white" icon="close" :label="$t('common.error')" />
                        </q-td>
                    </template>
                </q-table>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iUserBOResult } from './UsersManagement'

export default defineComponent({
    name: 'users-bulk-results-dialog',
    props: {
        visible: { type: Boolean, default: false },
        results: { type: Array as PropType<iUserBOResult[]>, default: () => [] }
    },
    emits: ['close'],
    computed: {
        columns() {
            return [
                { name: 'userId', label: this.$t('managers.usersManagement.form.userId'), field: 'userId', align: 'left', sortable: true },
                { name: 'success', label: '', field: 'success', align: 'center', style: 'width: 120px' },
                { name: 'message', label: this.$t('common.message'), field: 'message', align: 'left' }
            ]
        }
    }
})
</script>
