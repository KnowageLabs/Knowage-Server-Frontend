<template>
    <div class="kn-page-content p-grid p-m-0">
        <div class="kn-list--column p-col-4 p-sm-4 p-md-3 p-p-0">
            <Toolbar class="kn-toolbar kn-toolbar--primary">
                <template #start>
                    {{ $t('managers.dataSourceManagement.title') }}
                </template>
                <template #end>
                    <FabButton icon="fas fa-plus" data-test="open-form-button" @click="showForm" />
                </template>
            </Toolbar>
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
            <Listbox
                v-if="!loading"
                class="kn-list--column"
                :options="datasources"
                option-label="label"
                :filter="true"
                :filter-placeholder="$t('common.search')"
                filter-match-mode="contains"
                :filter-fields="dataSourceDescriptor.filterFields"
                :empty-filter-message="$t('common.info.noDataFound')"
                data-test="datasource-list"
                @change="showForm"
            >
                <template #empty>{{ $t('common.info.noDataFound') }}</template>
                <template #option="slotProps">
                    <div class="kn-list-item" data-test="list-item">
                        <Avatar
                            v-tooltip="dataSourceDescriptor.iconTypesMap[slotProps.option.dialectName]?.tooltip"
                            :icon="dataSourceDescriptor.iconTypesMap[slotProps.option.dialectName]?.dbIcon"
                            shape="circle"
                            size="medium"
                            :style="dataSourceDescriptor.iconTypesMap[slotProps.option.dialectName]?.style"
                        />
                        <div class="kn-list-item-text">
                            <span>{{ slotProps.option.label }}</span>
                            <span class="kn-list-item-text-secondary">{{ slotProps.option.descr }}</span>
                        </div>
                        <Button v-if="slotProps.option.owner == user.userId || user.isSuperadmin" icon="far fa-trash-alt" class="p-button-text p-button-rounded p-button-plain" data-test="delete-button" @click.stop="deleteDatasourceConfirm(slotProps.option.dsId)" />
                    </div>
                </template>
            </Listbox>
        </div>
        <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0 p-d-flex column window-height">
            <router-view :selected-datasource="selDatasource" :databases="listOfAvailableDatabases" :user="user" @touched="touched = true" @closed="onFormClose" @inserted="reloadPage" />
        </div>
    </div>
</template>

<script lang="ts">
/* eslint-disable no-prototype-builtins */
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import dataSourceDescriptor from './DataSourceDescriptor.json'
import FabButton from '@/components/UI/KnFabButton.vue'
import Listbox from 'primevue/listbox'
import Avatar from 'primevue/avatar'
import mainStore from '../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'datasources-management',
    components: {
        FabButton,
        Listbox,
        Avatar
    },
    data() {
        return {
            dataSourceDescriptor,
            datasources: [] as any[],
            selDatasource: {} as any,
            listOfAvailableDatabases: [] as any,
            user: {} as any,
            loading: false,
            touched: false
        }
    },
    async created() {
        await this.getAllDatasources()
        await this.getAllDatabases()
        await this.getCurrentUser()
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo']),
        async getAllDatabases() {
            return this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/databases`)
                .then((response: AxiosResponse<any>) => {
                    this.listOfAvailableDatabases = response.data
                })
                .finally(() => (this.loading = false))
        },

        async getCurrentUser() {
            return this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/currentuser`)
                .then((response: AxiosResponse<any>) => {
                    this.user = response.data
                })
                .finally(() => (this.loading = false))
        },

        async getAllDatasources() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasources')
                .then((response: AxiosResponse<any>) => {
                    this.datasources = response.data
                    this.convertToSeconds(this.datasources)
                    if (this.$route?.params?.id) {
                        const datasource = this.datasources.find((ds) => ds.dsId === parseInt(this.$route.params.id))
                        if (datasource) {
                            this.selDatasource = datasource
                        }
                    }
                })
                .finally(() => (this.loading = false))
        },
        convertToSeconds(dataSourceArr) {
            Array.prototype.forEach.call(dataSourceArr, (dataSource) => {
                if (dataSource.hasOwnProperty('jdbcPoolConfiguration')) {
                    dataSource.jdbcPoolConfiguration.maxWait /= 1000
                    dataSource.jdbcPoolConfiguration.timeBetweenEvictionRuns /= 1000
                    dataSource.jdbcPoolConfiguration.minEvictableIdleTimeMillis /= 1000
                    if (dataSource.jdbcPoolConfiguration.maxIdle === null) dataSource.jdbcPoolConfiguration.maxIdle = dataSourceDescriptor.newDataSourceValues.jdbcPoolConfiguration.maxIdle
                    if (dataSource.jdbcPoolConfiguration.validationQueryTimeout === null) dataSource.jdbcPoolConfiguration.validationQueryTimeout = dataSourceDescriptor.newDataSourceValues.jdbcPoolConfiguration.validationQueryTimeout
                }
            })
        },

        showForm(event: any) {
            const path = event.value ? `/datasource-management/${event.value.dsId}` : '/datasource-management/new-datasource'

            if (!this.touched) {
                this.$router.push(path)
                this.selDatasource = event.value
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.$router.push(path)
                        this.selDatasource = event.value
                    }
                })
            }
        },

        deleteDatasourceConfirm(datasourceId: number) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteDatasource(datasourceId)
            })
        },
        async deleteDatasource(datasourceId: number) {
            await this.$http
                .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasources/' + datasourceId)
                .then(() => {
                    this.setInfo({
                        title: this.$t('common.toast.deleteTitle'),
                        msg: this.$t('common.toast.deleteSuccess')
                    })
                    this.$router.push('/datasource-management')
                    this.getAllDatasources()
                })
                .catch((error) => {
                    this.setError({ title: 'Delete error', msg: error.message })
                })
        },

        reloadPage() {
            this.touched = false
            this.$router.push('/datasource-management')
            this.getAllDatasources()
        },
        onFormClose() {
            this.touched = false
        }
    }
})
</script>
