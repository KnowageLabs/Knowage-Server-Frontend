<template>
    <div class="import-export-users p-d-flex p-flex-column">
        <div class="q-mb-md row q-gutter-md">
            <q-input class="col" v-model="searchFilter" dense :placeholder="$t('common.search')" type="text">
                <template #prepend>
                    <q-icon name="search" />
                </template>
            </q-input>
            <q-input class="col" v-model="dateFilter" dense type="date" :label="$t('common.date')" @update:model-value="onDateFilterChange">
                <template #prepend>
                    <q-icon name="event" />
                </template>
            </q-input>
        </div>

        <q-table class="sticky-header-table" ref="usersTable" v-model:selected="selectedItems[FUNCTIONALITY]" :rows="filteredUsers" :columns="columns" row-key="id" selection="multiple" :visible-columns="visibleColumns" virtual-scroll :pagination.sync="pagination" :rows-per-page-options="[0]" flat dense>
            <template #body-cell-isSuperadmin="props">
                <q-td :props="props">
                    <q-icon v-if="props.row.isSuperadmin" name="check_circle" color="black" size="xs" />
                </q-td>
            </template>
        </q-table>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import importExportDescriptor from '../ImportExportDescriptor.json'
import { AxiosResponse } from 'axios'
import { iUser } from '@/modules/managers/usersManagement/UsersManagement'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import mainStore from '@/App.store'
import type { ISelectedItems } from '../ImportExportTypes'

export default defineComponent({
    name: 'import-export-users',
    props: { selectedItems: { type: Object as () => ISelectedItems, required: true } },
    emits: ['onItemSelected', 'update:loading'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            users: [] as Array<iUser>,
            searchFilter: '',
            dateFilter: null as string | null,
            FUNCTIONALITY: 'users',
            importExportDescriptor: importExportDescriptor,
            visibleColumns: ['userId', 'fullName', 'isSuperadmin'],
            pagination: {
                rowsPerPage: 0
            },
            selectAllCheckbox: false
        }
    },
    computed: {
        columns(): any[] {
            return this.importExportDescriptor.export.users.column.map((col: any) => ({
                ...col,
                label: this.$t(col.label)
            }))
        },
        filteredUsers(): iUser[] {
            if (!this.searchFilter) return this.users

            const searchLower = this.searchFilter.toLowerCase()
            return this.users.filter((user) => user.userId.toLowerCase().includes(searchLower) || user.fullName.toLowerCase().includes(searchLower))
        }
    },

    created() {
        this.loadAllUsers()
    },
    methods: {
        loadAllUsers(): void {
            this.$emit('update:loading', true)
            const params: any = {}
            if (this.dateFilter) {
                params.dateFilter = new Date(this.dateFilter).toString()
            }
            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/users', { params })
                .then((response: AxiosResponse<any>) => {
                    this.users = response.data

                    if (this.selectedItems && this.selectedItems[this.FUNCTIONALITY]) {
                        this.selectedItems[this.FUNCTIONALITY] = this.selectedItems[this.FUNCTIONALITY].filter((element) => {
                            return this.users.filter((el) => el.id === element.id).length == 1
                        })
                    }
                })
                .catch((error) => console.error(error))
                .finally(() => {
                    this.$emit('update:loading', false)
                })
        },
        toggleSelectAll(checked: boolean): void {
            if (checked) this.selectedItems[this.FUNCTIONALITY] = [...this.filteredUsers]
            else this.selectedItems[this.FUNCTIONALITY] = []
        },
        onDateFilterChange(): void {
            this.loadAllUsers()
        },
        updateSelectAllCheckbox(): void {
            if (this.filteredUsers.length === 0) this.selectAllCheckbox = false
            else this.selectAllCheckbox = this.selectedItems[this.FUNCTIONALITY].length === this.filteredUsers.length
        },
        async exportUsers(fileName: string): Promise<void> {
            const exportData = {
                selectedItems: {
                    users: this.selectedItems[this.FUNCTIONALITY].map((user) => user.id)
                },
                filename: fileName
            }

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/export/bulk', exportData, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/zip; charset=utf-8'
                    }
                })
                .then((response: AxiosResponse<any>) => {
                    if (response.data.errors) {
                        this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') })
                    } else {
                        downloadDirectFromResponse(response)
                        this.store.setInfo({ title: this.$t('common.downloading'), msg: this.$t('importExport.export.successfullyCompleted') })
                    }
                })
                .catch(() => this.store.setError({ title: this.$t('common.error.downloading'), msg: this.$t('importExport.export.completedWithErrors') }))
        }
    }
})
</script>

<style lang="scss" scoped>
.sticky-header-table {
    height: 91vh;

    :deep(thead tr th) {
        position: sticky;
        z-index: 1;
        background-color: #ffffff;
        top: 0;
    }

    /* prevent scrolling behind sticky top row on focus */
    :deep(tbody) {
        scroll-margin-top: 48px;
    }
}
</style>
