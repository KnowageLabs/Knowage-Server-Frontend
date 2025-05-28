<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ selectedFolder.name }}</q-toolbar-title>

        <q-btn flat round dense icon="save" :disable="buttonDisabled" data-test="submit-button" @click="handleSubmit">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeTemplate">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
        </q-btn>
    </q-toolbar>
    <div v-if="!selectedFolder.id || selectedFolder.parentId" class="kn-detail col">
        <Card class="q-ma-md q-mb-sm">
            <template #content>
                <div class="row">
                    <q-input filled class="col" v-model="v$.selectedFolder.code.$model" max-length="100" :error="v$.selectedFolder.code.$invalid && v$.selectedFolder.code.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('common.label') })" :label="$t('common.label')" @update:model-value="$emit('touched')" data-test="code-input" />
                    <q-input
                        filled
                        class="col q-ml-sm"
                        v-model="v$.selectedFolder.name.$model"
                        max-length="255"
                        :error="v$.selectedFolder.name.$invalid && v$.selectedFolder.name.$dirty"
                        :error-message="$t('common.validation.required', { fieldName: $t('common.name') })"
                        :label="$t('common.name')"
                        @update:model-value="$emit('touched')"
                        data-test="name-input"
                    />
                </div>
                <q-input class="q-mt-sm" rows="2" filled type="textarea" v-model="selectedFolder.description" max-length="255" :label="$t('common.description')" @update:model-value="$emit('touched')" data-test="description-input" />
            </template>
        </Card>
        <Card class="q-ma-md q-mt-sm" v-if="!loading">
            <template #header>
                <Toolbar class="kn-toolbar kn-toolbar--secondary">
                    <template #start>
                        {{ $t('managers.menuManagement.roles') }}
                    </template>
                </Toolbar>
            </template>
            <template #content>
                <q-table flat dense hide-pagination :rows="roles" :pagination="{ rowsPerPage: 0 }" :columns="columns" row-key="name">
                    <template #body-cell-development="props">
                        <q-td class="text-center no-padding">
                            <q-checkbox size="xs" v-model="props.row[props.col.field]" :disable="!props.row['devRoles'].checkable" />
                        </q-td>
                    </template>
                    <template #body-cell-test="props">
                        <q-td class="text-center no-padding">
                            <q-checkbox size="xs" v-model="props.row[props.col.field]" :disable="!props.row['testRoles'].checkable" />
                        </q-td>
                    </template>
                    <template #body-cell-creation="props">
                        <q-td class="text-center no-padding">
                            <q-checkbox size="xs" v-model="props.row[props.col.field]" :disable="!props.row['createRoles'].checkable" />
                        </q-td>
                    </template>
                    <template #body-cell-execution="props">
                        <q-td class="text-center no-padding">
                            <q-checkbox size="xs" v-model="props.row[props.col.field]" :disable="!props.row['execRoles'].checkable" />
                        </q-td>
                    </template>
                    <template #body-cell-actions="props">
                        <q-td class="text-center no-padding">
                            <q-btn flat round icon="done_all" size="xs" :disable="props.row.isButtonDisabled" :data-test="'check-all-' + props.row.id" @click="checkAll(props.row)">
                                <q-tooltip>
                                    {{ $t('common.checkAll') }}
                                </q-tooltip>
                            </q-btn>
                            <q-btn flat round icon="clear_all" size="xs" :disable="props.row.isButtonDisabled" :data-test="'uncheck-all-' + props.row.id" @click="uncheckAll(props.row)">
                                <q-tooltip>
                                    {{ $t('common.clearAll') }}
                                </q-tooltip>
                            </q-btn>
                        </q-td>
                    </template>
                </q-table>
            </template>
        </Card>
    </div>
    <div v-else class="kn-detail col">
        <KnHint :title="'managers.functionalitiesManagement.title'" :hint="'managers.functionalitiesManagement.detailHint'" data-test="functionality-hint"></KnHint>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import useValidate from '@vuelidate/core'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import validationDescriptor from './FunctionalitiesManagementValidation.json'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Checkbox from 'primevue/checkbox'
import mainStore from '../../../../App.store'
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    components: {
        Card,
        DataTable,
        Column,
        Checkbox,
        KnValidationMessages,
        KnHint
    },
    props: {
        functionality: Object,
        rolesShort: Array as any,
        parentId: Number
    },
    emits: ['touched', 'close', 'inserted'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            v$: useValidate() as any,
            validationDescriptor,
            formVisible: false,
            selectedFolder: {} as any,
            parentFolder: null as any,
            roles: [] as any,
            checked: [] as any,
            loading: false,
            dirty: false,
            columns: [
                { name: 'name', sortable: true, field: 'name', label: this.$t('managers.functionalitiesManagement.roles'), align: 'left' },
                { name: 'development', field: 'development', label: this.$t('managers.functionalitiesManagement.development'), align: 'center' },
                { name: 'test', field: 'test', label: this.$t('common.test'), align: 'center' },
                { name: 'execution', field: 'execution', label: this.$t('managers.functionalitiesManagement.execution'), align: 'center' },
                { name: 'creation', field: 'creation', label: this.$t('managers.functionalitiesManagement.creation'), align: 'center' },
                { name: 'actions', field: 'actions', label: '', align: 'right' }
            ]
        }
    },
    computed: {
        buttonDisabled(): boolean {
            return this.v$.$invalid
        }
    },
    validations() {
        return {
            selectedFolder: createValidations('selectedFolder', validationDescriptor.validations.selectedFolder)
        }
    },
    watch: {
        async functionality() {
            this.loading = true
            this.v$.$reset()
            this.selectedFolder = { ...this.functionality }
            await this.loadParentFolder()
            this.loadRoles()
            this.loading = false
        },
        rolesShort() {
            this.loadRoles()
        }
    },
    async created() {
        this.loading = true
        this.selectedFolder = { ...this.functionality }
        await this.loadParentFolder()
        this.loadRoles()
        this.loading = false
    },
    methods: {
        closeTemplate() {
            this.$emit('close')
        },
        loadRoles() {
            this.roles = []
            const tempFolder = this.selectedFolder.id ? this.selectedFolder : this.parentFolder
            this.rolesShort.forEach((role: any) => {
                const tempRole = {
                    id: role.id,
                    name: role.name,
                    development: false,
                    test: false,
                    execution: false,
                    creation: false,
                    isButtonDisabled: false
                }
                this.roleIsChecked(tempRole, tempFolder.devRoles, 'development')
                this.roleIsChecked(tempRole, tempFolder.testRoles, 'test')
                this.roleIsChecked(tempRole, tempFolder.execRoles, 'execution')
                this.roleIsChecked(tempRole, tempFolder.createRoles, 'creation')

                for (const field of ['devRoles', 'testRoles', 'execRoles', 'createRoles']) {
                    this.isCheckable(tempRole, field)
                }

                if (tempRole['devRoles'].checkable == false && tempRole['testRoles'].checkable == false && tempRole['execRoles'].checkable == false && tempRole['createRoles'].checkable == false) tempRole.isButtonDisabled = true

                this.roles.push(tempRole)
            })
        },
        async loadParentFolder() {
            if (this.parentId) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/functionalities/getParent/${this.parentId}`).then((response: AxiosResponse<any>) => (this.parentFolder = response.data))
            }
        },
        roleIsChecked(role: any, roles: [], roleField: string) {
            if (roles) {
                const index = roles.findIndex((currentRole: any) => role.id === currentRole.id)

                if (index > -1) {
                    role[roleField] = true
                }
            }
        },
        isCheckable(role: any, roleField: string) {
            role[roleField] = { checkable: false }
            if (this.parentFolder?.path === '/Functionalities') {
                role[roleField].checkable = true
            } else if (this.parentFolder && this.parentFolder[roleField] && this.parentFolder[roleField].length > 0) {
                this.parentFolder[roleField].forEach((currentRole) => {
                    if (role.name === currentRole.name) {
                        role[roleField].checkable = true
                    }
                })
            }
        },
        prepareFunctionalityToSend(functionalityToSend) {
            const roles = [...this.roles]
            functionalityToSend.codeType = functionalityToSend.codType
            delete functionalityToSend.codType
            delete functionalityToSend.biObjects
            this.emptyFunctionalityRoles(functionalityToSend)
            roles.forEach((role) => {
                if (role.development) functionalityToSend.devRoles.push(role)
                if (role.test) functionalityToSend.testRoles.push(role)
                if (role.execution) functionalityToSend.execRoles.push(role)
                if (role.creation) functionalityToSend.createRoles.push(role)
            })
            if (!functionalityToSend.id) {
                this.prepareNewFunctionality(functionalityToSend)
            }
        },
        prepareNewFunctionality(functionalityToSend) {
            functionalityToSend.codeType = this.parentFolder.codType
            functionalityToSend.parentId = this.parentFolder.id
            functionalityToSend.path = this.parentFolder.path + '/' + functionalityToSend.name
            if (!functionalityToSend.description) functionalityToSend.description = ''
        },
        emptyFunctionalityRoles(functionality) {
            functionality.devRoles = []
            functionality.testRoles = []
            functionality.execRoles = []
            functionality.createRoles = []
        },
        async createOrUpdate(functionalityToSend) {
            return this.selectedFolder.id ? this.$http.put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/functionalities/${functionalityToSend.id}`, functionalityToSend) : this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/functionalities/', functionalityToSend)
        },
        async handleSubmit() {
            if (this.v$.$invalid) {
                return
            }
            const functionalityToSend = { ...this.selectedFolder }
            this.prepareFunctionalityToSend(functionalityToSend)
            await this.createOrUpdate(functionalityToSend).then((response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    this.store.setError({ title: 'Error', msg: response.data.error })
                } else {
                    this.$emit('inserted', response.data.id)
                    this.store.setInfo({ title: this.$t('common.toast.success') })
                }
            })
            this.dirty = false
        },
        checkSingleRole(role, roleField, checkboxField, value) {
            if (role[roleField].checkable) {
                role[checkboxField] = value
            }
        },
        checkAll(role) {
            this.checkSingleRole(role, 'createRoles', 'creation', true)
            this.checkSingleRole(role, 'devRoles', 'development', true)
            this.checkSingleRole(role, 'execRoles', 'execution', true)
            this.checkSingleRole(role, 'testRoles', 'test', true)
        },
        uncheckAll(role) {
            this.checkSingleRole(role, 'createRoles', 'creation', false)
            this.checkSingleRole(role, 'devRoles', 'development', false)
            this.checkSingleRole(role, 'execRoles', 'execution', false)
            this.checkSingleRole(role, 'testRoles', 'test', false)
        }
    }
})
</script>
