<template>
    <div v-if="driver && driver.parameterValue" class="q-pa-md">
        <q-table
            v-model:selected="selectedRows"
            :rows="rows"
            :columns="tableColumns"
            :row-key="getRowKey"
            :selection="driver.multivalue ? 'multiple' : 'single'"
            :filter="search"
            :loading="loading"
            v-model:pagination="pagination"
            :rows-per-page-options="[0, 20]"
            :no-data-label="$t('common.info.noDataFound')"
            :no-results-label="$t('common.info.noDataFound')"
            flat
            dense
            @update:selected="onRowSelect"
        >
            <template #top>
                <q-input v-model="search" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" class="full-width" data-test="search-input">
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </template>
        </q-table>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import { IDashboardDatasetDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { getFormattedDrivers, getUserRole } from './DatasetEditorDriverHelper'
import { mapState } from 'pinia'
import mainStore from '@/App.store'

export default defineComponent({
    name: 'driver-dialog-popup',
    props: { propDriver: { type: Object as PropType<IDashboardDatasetDriver | null>, required: true }, dashboardId: { type: String, required: true }, selectedDatasetProp: { required: true, type: Object }, drivers: { type: Array as PropType<IDashboardDatasetDriver[]>, required: true } },
    data() {
        return {
            driver: null as IDashboardDatasetDriver | null,
            rows: [] as any[],
            columns: [] as { header: string; name: string }[],
            search: '' as string | null,
            selectedRows: [] as any[],
            pagination: { rowsPerPage: 0 },
            loading: false
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        }),
        tableColumns(): any[] {
            return this.columns.map((column) => ({ name: column.name, label: column.header, field: column.name, sortable: true, align: 'left', classes: 'ellipsis', style: 'max-width: 300px' }))
        }
    },
    watch: {
        propDriver() {
            this.loadDriver()
        }
    },
    created() {
        this.loadDriver()
    },
    methods: {
        loadDriver() {
            this.driver = this.propDriver
            this.getDriverPopupInfo()
        },
        getRowKey(row: any) {
            return `${row.value}|${row.description}`
        },
        async getDriverPopupInfo() {
            if (!this.driver || !this.selectedDatasetProp) return
            this.loading = true
            const postData = {
                OBJECT_NAME: this.selectedDatasetProp.configuration?.qbeDatamarts,
                ROLE: getUserRole(this.user),
                PARAMETER_ID: this.driver.urlName,
                MODE: 'extra',
                PARAMETERS: getFormattedDrivers(this.drivers)
            }

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/businessModelOpening/getParameters', postData)
                .then((response: AxiosResponse<any>) => {
                    this.columns = response.data.result.metaData.fields.splice(1, response.data.result.metaData.fields.length - 2)
                    this.rows = response.data.result.root
                    // Same as the PrimeVue paginator: pages of 20 only when there are more than 20 rows
                    this.pagination = { rowsPerPage: this.rows.length > 20 ? 20 : 0 }
                })
                .catch((error: any) => console.log('ERROR: ', error))

            this.setSelectedRows()
            this.loading = false
        },
        setSelectedRows() {
            this.selectedRows = []
            this.driver?.parameterValue.forEach((parameterValue: { value: string | number | Date; description: string }) => {
                const index = this.rows.findIndex((row: any) => row.value === parameterValue.value && row.description == parameterValue.description)
                if (index !== -1) this.selectedRows.push(this.rows[index])
            })
        },
        // q-table always gives an array; the single selection is its first item
        onRowSelect() {
            if (!this.driver) return
            if (this.driver.multivalue) {
                this.driver.parameterValue = this.selectedRows.map((row: any) => ({ value: row.value, description: row.description }))
            } else {
                const row = this.selectedRows[0]
                this.driver.parameterValue[0] = row ? { value: row.value, description: row.description } : { value: '', description: '' }
            }
        }
    }
})
</script>
