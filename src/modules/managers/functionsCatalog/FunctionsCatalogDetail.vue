<template>
    <Dialog id="function-catalog-detail-dialog" class="full-screen-dialog p-fluid kn-dialog--toolbar--primary" :content-style="functionsCatalogDetailDescriptor.dialog.style" :visible="visible" :modal="false" :closable="false" position="right" :base-z-index="1" :auto-z-index="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ selectedFunction.name }}
                </template>
                <template #end>
                    <Button class="kn-button p-button-text p-m-2" :label="$t('common.close')" data-test="close-button" @click="closeFunctionDetail"></Button>
                    <Button class="kn-button p-button-text" :label="$t('common.save')" :disabled="readonly" data-test="save-button" @click="onSave"></Button>
                </template>
            </Toolbar>
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
        </template>

        <TabView v-model:activeIndex="activeTab">
            <TabPanel>
                <template #header>
                    <span>{{ $t('common.general') }}</span>
                    <Badge v-if="invalidGeneral" class="p-ml-2" severity="danger"></Badge>
                </template>

                <FunctionsCatalogGeneralTab :prop-function="selectedFunction" :readonly="readonly" :function-types="filteredFunctionTypes"></FunctionsCatalogGeneralTab>
            </TabPanel>
            <TabPanel>
                <template #header>
                    <span>{{ $t('common.input') }}</span>
                    <Badge v-if="invalidInput" class="p-ml-2" severity="danger"></Badge>
                </template>

                <FunctionsCatalogInputTab :prop-function="selectedFunction" :readonly="readonly"></FunctionsCatalogInputTab>
            </TabPanel>
            <TabPanel>
                <template #header>
                    <span>{{ $t('common.script') }}</span>
                    <Badge v-if="invalidCode" class="p-ml-2" severity="danger"></Badge>
                </template>
                <FunctionsCatalogScriptTab :active-tab="activeTab" :prop-function="selectedFunction" :readonly="readonly"></FunctionsCatalogScriptTab>
            </TabPanel>
            <TabPanel>
                <template #header>
                    <span>{{ $t('common.output') }}</span>
                    <Badge v-if="invalidOutput" class="p-ml-2" severity="danger"></Badge>
                </template>

                <FunctionsCatalogOutputTab :prop-function="selectedFunction" :readonly="readonly"></FunctionsCatalogOutputTab>
            </TabPanel>
        </TabView>

        <FunctionsCatalogWarningDialog :visible="warningVisible" :title="warningTitle" :missing-fields="missingFields" @close="warningVisible = false"></FunctionsCatalogWarningDialog>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iFunction, iFunctionType, iInputColumn, iInputVariable, iOutputColumn } from './FunctionsCatalog'
import { AxiosResponse } from 'axios'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'
import functionsCatalogDetailDescriptor from './FunctionsCatalogDetailDescriptor.json'
import FunctionsCatalogGeneralTab from './tabs/FunctionsCatalogGeneralTab/FunctionsCatalogGeneralTab.vue'
import FunctionsCatalogInputTab from './tabs/FunctionsCatalogInputTab/FunctionsCatalogInputTab.vue'
import FunctionsCatalogScriptTab from './tabs/FunctionsCatalogScriptTab/FunctionsCatalogScriptTab.vue'
import FunctionsCatalogOutputTab from './tabs/FunctionsCatalogOutputTab/FunctionsCatalogOutputTab.vue'
import FunctionsCatalogWarningDialog from './FunctionsCatalogWarningDialog.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import mainStore from '../../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    name: 'functions-catalog-detail',
    components: { Badge, Dialog, FunctionsCatalogGeneralTab, FunctionsCatalogInputTab, FunctionsCatalogScriptTab, FunctionsCatalogOutputTab, FunctionsCatalogWarningDialog, TabView, TabPanel },
    props: {
        visible: { type: Boolean },
        propFunction: { type: Object },
        functionTypes: { type: Array }
    },
    emits: ['created', 'close'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            functionsCatalogDetailDescriptor,
            selectedFunction: {} as iFunction,
            filteredFunctionTypes: [] as iFunctionType[],
            missingFields: [] as string[],
            warningTitle: '',
            operation: 'create',
            warningVisible: false,
            activeTab: 0,
            loading: false
        }
    },
    computed: {
        canManageFunctionalities(): boolean {
            const index = (this.store.$state as any).user?.functionalities?.findIndex((el: string) => el === UserFunctionalitiesConstants.FUNCTIONS_CATALOG_MANAGEMENT)
            return index !== -1
        },
        readonly(): boolean {
            return !this.canManageFunctionalities && this.selectedFunction?.owner !== (this.store.$state as any).user.userId
        },
        invalidGeneral(): boolean {
            return !this.validateFunctionInfo(false)
        },
        invalidInput(): boolean {
            return !this.validateInputColumns(false) || !this.validateInputVariables(false)
        },
        invalidCode(): boolean {
            return !this.validateCode(false)
        },
        invalidOutput(): boolean {
            return !this.validateOutputColumns(false)
        }
    },
    watch: {
        propFunction() {
            this.loadFunction()
        },
        functionTypes() {
            this.loadFunctionTypes()
        }
    },
    created() {
        this.loadFunction()
        this.loadFunctionTypes()
    },
    methods: {
        loadFunction() {
            this.selectedFunction = this.propFunction ? ({ ...this.propFunction, inputColumns: [...this.propFunction.inputColumns], inputVariables: [...this.propFunction.inputVariables], outputColumns: [...this.propFunction.outputColumns] } as iFunction) : this.getFunctionDefaultValues()
        },
        loadFunctionTypes() {
            this.filteredFunctionTypes = this.functionTypes?.filter((el: any) => el.valueCd !== 'All') as iFunctionType[]
        },
        closeFunctionDetail() {
            this.selectedFunction = this.getFunctionDefaultValues()
            this.$emit('close')
            this.activeTab = 0
        },
        getFunctionDefaultValues() {
            return {
                name: '',
                description: '',
                benchmark: '',
                type: '',
                label: '',
                owner: (this.store.$state as any).user.userId,
                language: 'Python',
                inputColumns: [] as iInputColumn[],
                inputVariables: [] as iInputVariable[],
                outputColumns: [] as iOutputColumn[],
                onlineScript: '',
                offlineScriptTrain: '',
                offlineScriptUse: '',
                family: 'online'
            } as iFunction
        },
        validateArguments() {
            let valid = true
            this.missingFields = []

            if (!this.validateFunctionInfo(true)) {
                valid = false
            }

            if (!this.validateInputColumns(true)) {
                valid = false
            }

            if (!this.validateInputVariables(true)) {
                valid = false
            }

            if (!this.validateCode(true)) {
                valid = false
            }

            if (!this.validateOutputColumns(true)) {
                valid = false
            }

            return valid
        },
        validateInputColumns(setMessages: boolean) {
            let valid = true

            for (let i = 0; i < this.selectedFunction.inputColumns.length; i++) {
                delete this.selectedFunction.inputColumns[i].dsColumn
                if (!this.selectedFunction.inputColumns[i].name) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.inputColumnName', { number: i + 1 }))
                }
                if (!this.selectedFunction.inputColumns[i].type) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.inputColumnType', { number: i + 1 }))
                }
            }

            return valid
        },
        validateInputVariables(setMessages: boolean) {
            let valid = true

            for (let i = 0; i < this.selectedFunction.inputVariables.length; i++) {
                if (!this.selectedFunction.inputVariables[i].name) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.inputVariableName', { number: i + 1 }))
                }
                if (!this.selectedFunction.inputVariables[i].type) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.inputVariableType', { number: i + 1 }))
                }
            }

            return valid
        },
        validateOutputColumns(setMessages: boolean) {
            let valid = true

            if (this.selectedFunction.outputColumns.length === 0) {
                valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.outputColumnMissing'))
            }

            for (let i = 0; i < this.selectedFunction.outputColumns.length; i++) {
                if (!this.selectedFunction.outputColumns[i].name) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.outputColumnName', { number: i + 1 }))
                }

                if (!this.selectedFunction.outputColumns[i].fieldType) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.outputColumnFieldType', { number: i + 1 }))
                }

                if (!this.selectedFunction.outputColumns[i].type) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.outputColumnType', { number: i + 1 }))
                }
            }

            return valid
        },

        validateFunctionInfo(setMessages: boolean) {
            let valid = true

            if (!this.selectedFunction.description) {
                valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.functionDescription'))
            }

            return valid
        },
        validateCode(setMessages: boolean) {
            let valid = true

            if (this.selectedFunction.family === 'online' && this.selectedFunction.onlineScript === '') {
                valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.onlineScript'))
            } else if (this.selectedFunction.family === 'offline') {
                if (!this.selectedFunction.offlineScriptTrain) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.offlineTrainingScript'))
                }
                if (!this.selectedFunction.offlineScriptUse) {
                    valid = this.addMissingFields(setMessages, this.$t('managers.functionsCatalog.missingFields.offlineUseScript'))
                }
            }

            return valid
        },
        addMissingFields(setMessages: boolean, message: any) {
            if (setMessages) this.missingFields.push(message)

            return false
        },
        async onSave() {
            this.loading = true

            if (!this.validateArguments()) {
                this.warningTitle = this.$t('managers.functionsCatalog.warningTitle')
                this.warningVisible = true
                return
            }

            let url = import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/1.0/functioncatalog/new'

            if (this.selectedFunction.id) {
                this.operation = 'update'
                url = import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/1.0/functioncatalog`
            } else {
                this.operation = 'create'
            }

            await this.sendRequest(url)
                .then((response: AxiosResponse<any>) => {
                    if (response.data.errors) {
                        this.warningVisible = true
                        this.missingFields.push(response.data.errrors[0].message)
                    } else {
                        this.store.setInfo({
                            title: this.$t('common.toast.' + this.operation + 'Title'),
                            msg: this.$t('common.toast.success')
                        })
                        this.$emit('created')
                    }
                })
                .catch((response) => {
                    this.warningTitle = this.$t('common.toast.' + this.operation + 'Title')
                    this.warningVisible = true
                    this.missingFields.push(response.message)
                })

            this.loading = false
        },
        sendRequest(url: string) {
            if (this.operation === 'create') {
                return this.$http.post(url, this.selectedFunction)
            } else {
                return this.$http.patch(url, this.selectedFunction)
            }
        }
    }
})
</script>

<style lang="scss">
.full-screen-dialog.p-dialog {
    max-height: 100%;
    width: calc(100vw - var(--kn-mainmenu-width));
    margin: 0;
}

.full-screen-dialog.p-dialog .p-dialog-content {
    padding: 0;
    margin: 0;
}

#function-catalog-detail-dialog .p-toolbar-group-right {
    height: 100%;
}
</style>
