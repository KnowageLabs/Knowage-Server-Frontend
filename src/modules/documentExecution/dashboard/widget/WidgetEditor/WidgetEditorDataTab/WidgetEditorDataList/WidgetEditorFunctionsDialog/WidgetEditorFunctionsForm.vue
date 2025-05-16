<template>
    <div class="kn-full-width">
        <Card v-if="selectedFunction && functionColumn?.catalogFunctionConfig" class="p-m-2">
            <template #content>
                <q-expansion-item class="function-description-expander kn-full-width p-m-2" icon="fas fa-eye" default-opened :label="$t('common.description')">
                    <div>
                        <p v-html="selectedFunction.description"></p>
                    </div>
                </q-expansion-item>

                <q-expansion-item v-if="selectedFunction.benchmark" class="kn-full-width p-m-2" :label="$t('managers.functionsCatalog.benchmarks')">
                    <div>
                        <p v-html="selectedFunction.benchmark"></p>
                    </div>
                </q-expansion-item>

                <div v-if="functionColumn.catalogFunctionConfig.inputColumns.length > 0" class="p-m-2">
                    <label class="kn-material-input-label"> {{ $t('managers.functionsCatalog.columnsSettings') }}</label>
                    <FunctionsCatalogDatasetFormColumnsTable :prop-rows="functionColumn.catalogFunctionConfig.inputColumns" :dataset-columns="datasetColumns"></FunctionsCatalogDatasetFormColumnsTable>
                </div>
                <div v-if="functionColumn.catalogFunctionConfig.inputVariables.length > 0" class="p-mx-2 p-mt-3">
                    <label class="kn-material-input-label"> {{ $t('managers.functionsCatalog.variablesSettings') }}</label>
                    <FunctionsCatalogDatasetFormVariablesTable :variables="functionColumn.catalogFunctionConfig.inputVariables"></FunctionsCatalogDatasetFormVariablesTable>
                </div>
                <div class="p-mx-2 p-mt-3">
                    <q-select v-model="selectedEnvironment" dense clearable emit-value outlined :options="pythonEnvironments" option-value="label" option-label="label" map-options :label="$t('common.environment')" @update:model-value="onEnvironmentSelected" />
                </div>

                <div v-if="selectedEnvironment" class="p-mx-2 p-mt-3">
                    <FunctionsCatalogDatasetEnvironmentTable :libraries="libraries"></FunctionsCatalogDatasetEnvironmentTable>
                </div>
            </template>
        </Card>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iFunction, iPythonConfiguration } from '../../../../../../../managers/functionsCatalog/FunctionsCatalog'
import { IDataset, IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import { AxiosResponse } from 'axios'
import store from '@/modules/documentExecution/dashboard/Dashboard.store'
import mainStore from '@/App.store'
import FunctionsCatalogDatasetFormColumnsTable from '@/modules/managers/functionsCatalog/FunctionsCatalogPreviewDialog/tabs/FunctionsCatalogConfiguratorTab/FunctionsCatalogDatasetForm/FunctionsCatalogDatasetFormColumnsTable.vue'
import FunctionsCatalogDatasetFormVariablesTable from '@/modules/managers/functionsCatalog/FunctionsCatalogPreviewDialog/tabs/FunctionsCatalogConfiguratorTab/FunctionsCatalogDatasetForm/FunctionsCatalogDatasetFormVariablesTable.vue'
import FunctionsCatalogDatasetEnvironmentTable from '@/modules/managers/functionsCatalog/FunctionsCatalogPreviewDialog/tabs/FunctionsCatalogConfiguratorTab/FunctionsCatalogDatasetForm/FunctionsCatalogDatasetEnvironmentTable.vue'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'widget-editors-functions-form',
    components: { Accordion, AccordionTab, Card, Dropdown, FunctionsCatalogDatasetFormColumnsTable, FunctionsCatalogDatasetFormVariablesTable, FunctionsCatalogDatasetEnvironmentTable },
    props: { propFunctionColumn: { type: Object as PropType<IWidgetFunctionColumn | null>, required: true }, propFunction: { type: Object as PropType<iFunction | null>, required: true }, selectedDataset: { type: Object as PropType<IDataset | null>, required: true } },
    emits: ['environmentSelected'],
    data() {
        return {
            functionColumn: null as IWidgetFunctionColumn | null,
            selectedFunction: null as iFunction | null,
            selectedEnvironment: null as string | null,
            dataset: null as IDataset | null,
            datasetColumns: [] as string[],
            pythonEnvironments: [] as iPythonConfiguration[],
            libraries: []
        }
    },
    watch: {
        async propFunctionColumn() {
            await this.loadFunctionColumn()
        },
        propFunction() {
            this.loadFunction()
        }
    },
    async created() {
        this.loadDataset()
        this.loadPythonEnvironments()
        await this.loadFunctionColumn()
        this.loadFunction()
    },
    methods: {
        ...mapActions(store, ['getPythonEnvironments']),
        ...mapActions(mainStore, ['setLoading']),
        async loadFunctionColumn() {
            this.functionColumn = this.propFunctionColumn
            if (this.functionColumn?.catalogFunctionConfig?.environment) {
                this.selectedEnvironment = this.functionColumn.catalogFunctionConfig.environment
                await this.onEnvironmentSelected(this.selectedEnvironment)
            }
        },
        loadFunction() {
            this.selectedFunction = this.propFunction as iFunction
        },
        loadDataset() {
            this.dataset = this.selectedDataset as IDataset | null
            this.datasetColumns = []
            if (this.dataset && this.dataset.metadata) this.dataset.metadata.fieldsMeta.forEach((field: any) => this.datasetColumns.push(field.name))
        },
        loadPythonEnvironments() {
            this.pythonEnvironments = this.getPythonEnvironments()
        },
        async onEnvironmentSelected(environment: string) {
            if (!this.functionColumn) return
            this.functionColumn.catalogFunctionConfig.environment = environment
            this.setLoading(true)
            if (environment && environment.split('.')[0] === 'python') {
                await this.loadEnvironmentLibraries(`2.0/backendservices/widgets/python/libraries/${environment}`)
                    .then((response: AxiosResponse<any>) => (this.libraries = JSON.parse(response.data.result)))
                    .catch(() => {})
            }
            this.setLoading(false)
        },
        async loadEnvironmentLibraries(url: string) {
            return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/${url}`)
        }
    }
})
</script>

<style lang="scss">
.function-description-expander .q-icon.fas.fa-eye {
    font-size: 1.5rem;
}

.function-description-expander .q-item__label::first-letter {
    text-transform: capitalize;
}
</style>
