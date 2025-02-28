<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ datasource.label }}</q-toolbar-title>

        <q-btn flat round dense icon="network_check" :disable="readOnly || buttonDisabled" @click="testDataSource">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.test') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="save" :disable="readOnly || buttonDisabled" data-test="submit-button" @click="handleSubmit">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeTemplateConfirm">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
        </q-btn>
    </q-toolbar>
    <div class="column q-mx-xs q-mt-xs q-gutter-sm">
        <q-banner v-if="showOwnerMessage" rounded dense class="bg-warning q-ma-sm text-center">
            <template v-slot:avatar>
                <q-icon name="warning" />
            </template>
            {{ ownerMessage }}
        </q-banner>
        <div class="row">
            <q-card class="full-width">
                <q-card-section>
                    <div class="row q-gutter-sm">
                        <q-input
                            filled
                            class="col"
                            v-model="v$.datasource.label.$model"
                            max-length="100"
                            :error="v$.datasource.label.$invalid && v$.datasource.label.$dirty"
                            :error-message="$t('common.validation.required', { fieldName: $t('common.name') })"
                            :label="$t('common.name')"
                            @update:model-value="onFieldChange"
                            data-test="name-input"
                            :disable="readOnly || disableLabelField"
                        />

                        <q-select
                            class="col"
                            filled
                            emit-value
                            map-options
                            options-dense
                            :error="v$.datasource.dialectName.$invalid && v$.datasource.dialectName.$dirty"
                            v-model="v$.datasource.dialectName.$model"
                            :options="availableDatabases"
                            option-label="name"
                            option-value="value"
                            :label="$t('managers.dataSourceManagement.form.dialect')"
                            :disable="readOnly"
                            @update:model-value="selectDatabase($event)"
                        />
                    </div>
                    <div class="row">
                        <q-input filled rows="2" class="col" type="textarea" v-model="datasource.descr" max-length="160" :label="$t('common.description')" :disable="readOnly" data-test="description-input" />
                    </div>
                    <div class="row q-mt-sm justify-between">
                        <q-btn-toggle
                            v-model="datasource.readOnly"
                            toggle-color="primary"
                            :options="[
                                { label: $t('managers.dataSourceManagement.form.readOnly'), value: true, disabled: datasource.writeDefault || readOnly || datasource.useForDataprep },
                                { label: $t('managers.dataSourceManagement.form.readAndWrite'), value: false, disabled: readOnly || !selectedDatabase.cacheSupported }
                            ]"
                        />
                        <div class="row">
                            <q-checkbox v-if="currentUser.isSuperadmin" v-model="datasource.writeDefault" size="sm" :disable="readOnly || !selectedDatabase.cacheSupported || datasource.readOnly || !currentUser.isSuperadmin" :label="$t('managers.dataSourceManagement.form.writeDefault')" />
                            <q-checkbox
                                v-if="currentUser.isSuperadmin && !datasource.readOnly"
                                v-model="datasource.useForDataprep"
                                size="sm"
                                :disable="readOnly || !selectedDatabase.cacheSupported || datasource.readOnly || !currentUser.isSuperadmin"
                                :label="$t('managers.dataSourceManagement.form.useForDataprep')"
                                @update:model-value="setReadOnly($event)"
                            />
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>
        <div class="row">
            <q-card class="full-width">
                <q-card-section>
                    <div class="row">
                        <q-btn-toggle
                            v-model="jdbcOrJndi.type"
                            toggle-color="primary"
                            :options="[
                                { label: 'JDBC', value: 'JDBC', disabled: readOnly, title: $t('managers.dataSourceManagement.form.jdbcInfo') },
                                { label: 'JNDI', value: 'JNDI', disabled: readOnly || !currentUser.isSuperadmin, title: $t('managers.dataSourceManagement.form.jndiInfo') }
                            ]"
                        />
                    </div>
                    <div v-if="jdbcOrJndi.type == 'JNDI'" class="row q-mt-md">
                        <q-input
                            filled
                            bottom-slots
                            class="col"
                            v-model="v$.datasource.jndi.$model"
                            max-length="160"
                            :disable="readOnly"
                            :rules="[(val) => (val !== null && val !== '') || $t('common.validation.required', { fieldName: $t('managers.dataSourceManagement.form.jndi') }), (val) => val.match(/java:comp\/env\/jdbc\/[A-Za-z\d\-_|#$]+/g) || $t('common.validation.jndiformat')]"
                            :label="$t('managers.dataSourceManagement.form.jndi')"
                            @update:model-value="onFieldChange"
                            data-test="jndi-input"
                        >
                            <template v-slot:hint>
                                {{ $t('managers.dataSourceManagement.form.jndiHint') }}
                            </template>
                        </q-input>
                    </div>
                    <div v-if="jdbcOrJndi.type == 'JDBC'" class="row q-mt-md q-col-gutter-sm">
                        <q-input
                            filled
                            bottom-slots
                            dense
                            class="col-12"
                            v-model="v$.datasource.urlConnection.$model"
                            max-length="500"
                            type="url"
                            :disable="readOnly"
                            :error="v$.datasource.urlConnection.$invalid && v$.datasource.urlConnection.$dirty"
                            :error-message="$t('common.validation.required', { fieldName: $t('managers.dataSourceManagement.form.urlConnection') })"
                            :label="$t('managers.dataSourceManagement.form.urlConnection')"
                            @update:model-value="onFieldChange"
                            data-test="jdbc-input"
                        >
                            <template v-slot:hint>
                                {{ $t('managers.dataSourceManagement.form.urlConnectionHint') }}
                            </template>
                        </q-input>
                        <q-input
                            filled
                            bottom-slots
                            dense
                            class="col-12"
                            v-model="v$.datasource.driver.$model"
                            max-length="50"
                            :disable="readOnly"
                            :error="v$.datasource.driver.$invalid && v$.datasource.driver.$dirty"
                            :error-message="$t('common.validation.required', { fieldName: $t('managers.dataSourceManagement.form.driver') })"
                            :label="$t('managers.dataSourceManagement.form.driver')"
                            @update:model-value="onFieldChange"
                            data-test="jdbcdriver-input"
                        >
                            <template v-slot:hint>
                                {{ $t('managers.dataSourceManagement.form.driverHint') }}
                            </template>
                        </q-input>
                        <q-input filled dense class="col-6" v-model="datasource.user" max-length="50" :disable="readOnly" :label="$t('managers.dataSourceManagement.form.user')" @update:model-value="onFieldChange" data-test="user-input" />
                        <q-input filled dense autocomplete="new-password" type="password" class="col-6" v-model="datasource.pwd" max-length="50" :disable="readOnly" :label="$t('managers.dataSourceManagement.form.pwd')" @update:model-value="onFieldChange" data-test="password-input" />
                    </div>
                    <DataSourceAdvancedOptions v-if="jdbcOrJndi.type == 'JDBC'" :advanced-options="jdbcPoolConfiguration" :is-read-only="readOnly" @fieldChanged="onAdvancedOptionsChange" />
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script lang="ts">
/* eslint-disable no-prototype-builtins */
import { defineComponent } from 'vue'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import dataSourceDescriptor from '../DataSourceDescriptor.json'
import dataSourceDetailValidationDescriptor from './DataSourceDetailValidationDescriptor.json'
import DataSourceAdvancedOptions from '../DataSourceAdvancedOptions/DataSourceAdvancedOptions.vue'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import mainStore from '../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    components: {
        KnValidationMessages,
        DataSourceAdvancedOptions
    },

    props: {
        selectedDatasource: {
            type: Object,
            required: false
        },
        user: {
            type: Object,
            required: false
        },
        databases: Array,
        id: String
    },
    emits: ['touched', 'closed', 'inserted'],

    data() {
        return {
            v$: useValidate() as any,
            dataSourceDescriptor,
            datasource: {} as any,
            availableDatabases: [] as any,
            selectedDatabase: {} as any,
            jdbcOrJndi: {} as any,
            jdbcPoolConfiguration: {} as any,
            currentUser: {} as any,
            ownerMessage: '',
            showOwnerMessage: false,
            loading: false,
            touched: false,
            readOnly: false,
            disableLabelField: false
        }
    },

    computed: {
        operation() {
            if (this.id) {
                return 'update'
            }
            return 'insert'
        },
        buttonDisabled(): any {
            if (this.v$.$invalid) {
                return true
            }
            return false
        }
    },

    watch: {
        id() {
            if (this.id == undefined) {
                this.createNewDataSourceValues()
            } else {
                if (this.selectedDatasource?.dsId) this.loadExistingDataSourceValues()
                else {
                    this.setLoading(true)
                    setTimeout(() => {
                        this.loadExistingDataSourceValues()
                        this.setLoading(false)
                    }, 1000)
                }
            }
            this.touched = false
        },
        databases() {
            this.availableDatabases = this.databases
            this.availableDatabases = this.availableDatabases.map((i) => {
                return {
                    name: i.databaseDialect.name,
                    value: i.databaseDialect.value,
                    cacheSupported: i.cacheSupported,
                    writeDefault: i.writeDefault
                }
            })
            this.selectDatabase(this.datasource.dialectName)
            this.checkIfReadOnly()
        },
        user() {
            this.currentUser = { ...this.user } as any
        },
        datasource: {
            handler(newValue, oldValue) {
                if (oldValue.dsId && newValue.dsId === oldValue.dsId) {
                    this.touched = true
                    this.$emit('touched')
                }
            },
            deep: true
        }
    },

    mounted() {
        this.currentUser = { ...this.user } as any
        this.availableDatabases = this.databases
        if (this.id) {
            if (this.selectedDatasource?.dsId) this.loadExistingDataSourceValues()
            else {
                this.setLoading(true)
                setTimeout(() => {
                    this.loadExistingDataSourceValues()
                    this.setLoading(false)
                }, 1000)
            }
        } else {
            this.createNewDataSourceValues()
        }
    },

    validations() {
        const jndiTypeRequired = (jndiType) => (value) => {
            return this.jdbcOrJndi.type != jndiType || value
        }
        const jndiTypeFormat = (value) => {
            return this.jdbcOrJndi.type != 'JNDI' || value.match(/java:comp\/env\/jdbc\/[A-Za-z\d\-_|#$]+/g)
        }
        const customValidators: ICustomValidatorMap = {
            'jndi-name-required': jndiTypeRequired('JNDI'),
            'jdbc-data-required': jndiTypeRequired('JDBC'),
            'jndi-format': jndiTypeFormat
        }
        const validationObject = {
            datasource: createValidations('datasource', dataSourceDetailValidationDescriptor.validations.datasource, customValidators)
        }
        return validationObject
    },

    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo', 'setLoading']),
        setConnetionType() {
            if (this.datasource.driver) {
                this.jdbcOrJndi.type = 'JDBC'
            }
            if (this.datasource.jndi != undefined && this.datasource.jndi != '') {
                this.jdbcOrJndi.type = 'JNDI'
            }
        },

        createNewDataSourceValues() {
            this.jdbcOrJndi.type = 'JDBC'
            this.jdbcPoolConfiguration = { ...dataSourceDescriptor.newDataSourceValues.jdbcPoolConfiguration }
            this.datasource = { ...dataSourceDescriptor.newDataSourceValues }
            this.datasource.owner = this.user?.userId
            this.disableLabelField = false
            this.showOwnerMessage = false
            this.checkIfReadOnly()
        },

        loadExistingDataSourceValues() {
            this.datasource = { ...this.selectedDatasource } as any
            this.jdbcPoolConfiguration = { ...this.datasource.jdbcPoolConfiguration } as any
            this.disableLabelField = true
            this.setConnetionType()
            this.selectDatabase(this.datasource.dialectName)
            this.checkIfReadOnly()
        },

        convertToMili(dsToSave) {
            dsToSave.jdbcPoolConfiguration.maxWait *= 1000
            dsToSave.jdbcPoolConfiguration.timeBetweenEvictionRuns *= 1000
            dsToSave.jdbcPoolConfiguration.minEvictableIdleTimeMillis *= 1000
        },

        selectDatabase(selectedDatabaseDialect) {
            this.availableDatabases.forEach((database) => {
                if (database.value == selectedDatabaseDialect) {
                    this.selectedDatabase = database
                }
            })
            if (typeof this.selectedDatabase.cacheSupported === 'undefined') {
                this.selectedDatabase.cacheSupported = true
            }
            if (!this.selectedDatabase.cacheSupported) {
                this.datasource.writeDefault = false
                this.datasource.readOnly = true
            }
        },

        clearType() {
            if (!this.datasource.hasOwnProperty('dsId')) {
                if (this.jdbcOrJndi.type == 'JDBC') {
                    this.datasource.jndi = ''
                    this.datasource.jdbcPoolConfiguration = { ...dataSourceDescriptor.newDataSourceValues.jdbcPoolConfiguration }
                } else {
                    this.datasource.urlConnection = ''
                    this.datasource.user = ''
                    this.datasource.pwd = ''
                    this.datasource.driver = ''
                    delete this.datasource.jdbcPoolConfiguration
                }
            } else {
                if (this.jdbcOrJndi.type == 'JDBC') {
                    this.datasource.jndi = ''
                    if (!this.datasource.hasOwnProperty('jdbcPoolConfiguration')) {
                        this.jdbcPoolConfiguration = { ...dataSourceDescriptor.newDataSourceValues.jdbcPoolConfiguration }
                        this.datasource.jdbcPoolConfiguration = { ...dataSourceDescriptor.newDataSourceValues.jdbcPoolConfiguration }
                    }
                }
            }
        },

        checkIfReadOnly() {
            if (this.selectedDatasource) {
                if (this.currentUser.isSuperadmin || (this.currentUser.userId == this.datasource.owner && (!this.datasource.hasOwnProperty('jndi') || this.datasource.jndi == ''))) {
                    this.showOwnerMessage = false
                    this.readOnly = false
                } else {
                    this.ownerMessage = this.$t('managers.dataSourceManagement.form.notOwner')
                    this.showOwnerMessage = true
                    this.readOnly = true
                }
            } else {
                this.readOnly = false
            }
        },

        async testDataSource() {
            const url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasources/test'
            let dsToTest = {} as any
            dsToTest = { ...this.datasource }
            dsToTest.type = this.jdbcOrJndi.type

            await this.$http.post(url, dsToTest).then((response: AxiosResponse<any>) => {
                if (response.data.error) {
                    this.setError({ title: this.$t('managers.dataSourceManagement.form.errorTitle'), msg: response.data.error })
                } else {
                    this.setInfo({ msg: this.$t('managers.dataSourceManagement.form.testOk') })
                }
            })
        },

        async createOrUpdate(url, dsToSave) {
            return this.operation === 'update' ? this.$http.put(url, dsToSave) : this.$http.post(url, dsToSave)
        },

        async handleSubmit() {
            if (this.v$.$invalid) {
                return
            }
            const url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/datasources/'
            let dsToSave = {} as any
            dsToSave = { ...this.datasource }

            if (dsToSave.hasOwnProperty('jdbcPoolConfiguration')) {
                this.convertToMili(dsToSave)
            }

            await this.createOrUpdate(url, dsToSave).then((response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    this.setError({ title: 'Error', msg: response.data.error })
                } else {
                    this.setInfo({ title: 'Ok', msg: 'Saved OK' })
                }
            })
            this.$emit('inserted')
            this.touched = false
        },

        closeTemplateConfirm() {
            if (!this.touched) {
                this.closeTemplate()
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.closeTemplate()
                    }
                })
            }
        },
        onAdvancedOptionsChange(event) {
            this.datasource.jdbcPoolConfiguration[event.fieldName] = event.value
            this.touched = true
            this.$emit('touched')
        },
        onFieldChange() {
            this.touched = true
            this.$emit('touched')
        },
        closeTemplate() {
            this.$router.push({ name: 'datasource-hint' })
            this.$emit('closed')
        },
        isVisible() {
            return this.datasource.owner == this.user?.userId || this.user?.isSuperadmin
        },
        setReadOnly(value) {
            if (value) {
                this.datasource.readOnly = false
            }
        }
    }
})
</script>

<style lang="scss" scoped>
::v-deep(.p-toolbar-group-right) {
    height: 100%;
}
</style>
