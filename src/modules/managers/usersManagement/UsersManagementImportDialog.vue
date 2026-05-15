<template>
    <q-dialog :model-value="visible" persistent square>
        <q-card class="kn-dialog--toolbar--primary users-import-dialog">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('managers.usersManagement.import.title') }}</q-toolbar-title>
            </q-toolbar>

            <q-card-section>
                <template v-if="phase === 'select'">
                    <q-file v-model="selectedFile" :label="$t('managers.usersManagement.import.selectFile')" accept=".csv,.xls,.xlsx" outlined square dense>
                        <template #prepend>
                            <q-icon name="attach_file" />
                        </template>
                    </q-file>
                </template>

                <template v-else>
                    <div v-if="importedUsers.length > 0">
                        <div class="text-subtitle2 q-mb-sm">
                            <q-icon name="check_circle" color="positive" class="q-mr-xs" />
                            {{ $t('managers.usersManagement.import.importedUsers') }}
                        </div>
                        <q-table :rows="importedUsers" :columns="userColumns" row-key="userId" dense flat square virtual-scroll :rows-per-page-options="[0]" class="import-results-table" />
                    </div>
                    <div v-if="errors.length > 0" :class="importedUsers.length > 0 ? 'q-mt-md' : ''">
                        <div class="text-subtitle2 text-negative q-mb-sm">
                            <q-icon name="cancel" color="negative" class="q-mr-xs" />
                            {{ $t('managers.usersManagement.import.errors') }}
                        </div>
                        <q-list bordered separator dense>
                            <q-item v-for="(err, idx) in errors" :key="idx" dense>
                                <q-item-section>
                                    <q-item-label class="text-negative">{{ err }}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </div>
                </template>
            </q-card-section>

            <q-card-actions align="right" class="q-px-md q-pb-md">
                <q-btn v-if="phase === 'select'" flat :label="$t('common.cancel')" @click="closeDialog" />
                <q-btn v-if="phase === 'select'" :label="$t('common.import')" class="kn-button kn-button--primary q-ml-sm" :disable="!selectedFile" @click="importFile" />
                <q-btn v-else :label="$t('common.close')" class="kn-button kn-button--primary" @click="closeDialog" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'users-management-import-dialog',
    props: {
        visible: {
            type: Boolean,
            required: true
        }
    },
    emits: ['close', 'imported'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            phase: 'select' as 'select' | 'results',
            selectedFile: null as File | null,
            importedUsers: [] as any[],
            errors: [] as string[],
            userColumns: [
                { name: 'userId', label: this.$t('managers.usersManagement.form.userId'), field: 'userId', align: 'left' as const, sortable: true },
                { name: 'createdUserId', label: 'ID', field: 'createdUserId', align: 'left' as const, sortable: true }
            ]
        }
    },
    methods: {
        closeDialog() {
            this.phase = 'select'
            this.selectedFile = null
            this.importedUsers = []
            this.errors = []
            this.$emit('close')
        },
        async importFile() {
            if (!this.selectedFile) return

            const formData = new FormData()
            formData.append('file', this.selectedFile)

            this.store.setLoading(true)

            await this.$http
                .post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/users/uploadFileForInsert`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                .then((response: AxiosResponse<any[]>) => {
                    const data: any[] = response.data || []
                    this.importedUsers = data.filter((item) => item.success)
                    this.errors = data.filter((item) => !item.success).map((item) => `${item.userId}: ${item.message}`)
                    if (this.importedUsers.length > 0) {
                        this.$emit('imported')
                    }
                    this.phase = 'results'
                })
                .catch((error) => {
                    this.errors = [error?.message || this.$t('common.error.uploading')]
                    this.importedUsers = []
                    this.phase = 'results'
                })
                .finally(() => {
                    this.store.setLoading(false)
                })
        }
    }
})
</script>

<style lang="scss" scoped>
.users-import-dialog {
    min-width: 500px;
    max-width: 80vw;
}

.import-results-table {
    max-height: 350px;
    :deep(thead tr th) {
        position: sticky;
        z-index: 1;
        background-color: #ffffff;
        top: 0;
    }
    :deep(tbody) {
        scroll-margin-top: 48px;
    }
}
</style>
