<template>
    <div class="p-d-flex p-flex-row">
        <Card id="form-container" class="p-m-2">
            <template #content>
                <Accordion class="p-m-2" :active-index="0">
                    <AccordionTab :header="$t('common.description')">
                        <div>
                            <label class="kn-material-input-label"> {{ $t('common.description') }}</label>
                            <p v-html="selectedFunction.description"></p>
                        </div>
                    </AccordionTab>
                </Accordion>
                <Accordion v-if="selectedFunction.benchmark" class="p-m-2">
                    <AccordionTab :header="$t('managers.functionsCatalog.benchmarks')">
                        <div>
                            <label class="kn-material-input-label"> {{ $t('managers.functionsCatalog.benchmarks') }}</label>
                            <p v-html="selectedFunction.benchmark"></p>
                        </div>
                    </AccordionTab>
                </Accordion>
                <div v-if="selectedFunction.inputColumns.length > 0" class="p-m-2">
                    <label class="kn-material-input-label"> {{ $t('managers.functionsCatalog.columnsSettings') }}</label>
                    <FunctionsCatalogDatasetFormColumnsTable :prop-rows="selectedFunction.inputColumns" :dataset-columns="datasetColumns"></FunctionsCatalogDatasetFormColumnsTable>
                </div>
                <div v-if="selectedFunction.inputVariables.length > 0" class="p-mx-2 p-mt-3">
                    <label class="kn-material-input-label"> {{ $t('managers.functionsCatalog.variablesSettings') }}</label>
                    <FunctionsCatalogDatasetFormVariablesTable :variables="selectedFunction.inputVariables"></FunctionsCatalogDatasetFormVariablesTable>
                </div>
                <div class="p-mx-2 p-mt-3">
                    <label class="kn-material-input-label">{{ $t('common.environment') }}</label>
                    <Dropdown v-model="selectedEnvironment" class="kn-material-input" :options="selectedFunction.language == 'Python' ? pythonEnvironments : rEnvironments" option-label="label" option-value="label" @change="$emit('environmentSelected', selectedEnvironment)" />
                </div>
                <div v-if="selectedEnvironment" class="p-mx-2 p-mt-3">
                    <FunctionsCatalogDatasetEnvironmentTable :libraries="libraries"></FunctionsCatalogDatasetEnvironmentTable>
                </div>
            </template>
        </Card>
        <FunctionsCatalogParametersForm v-if="selectedDataset.pars.length > 0" id="parameters-form" class="p-m-2" :prop-parameters="selectedDataset.pars"></FunctionsCatalogParametersForm>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iDataset, iFunction, iInputColumn } from '../../../../FunctionsCatalog'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import FunctionsCatalogDatasetFormColumnsTable from './FunctionsCatalogDatasetFormColumnsTable.vue'
import FunctionsCatalogDatasetFormVariablesTable from './FunctionsCatalogDatasetFormVariablesTable.vue'
import FunctionsCatalogDatasetEnvironmentTable from './FunctionsCatalogDatasetEnvironmentTable.vue'
import FunctionsCatalogParametersForm from './FunctionsCatalogParametersForm.vue'

export default defineComponent({
    name: 'function-catalog-dateset-form',
    components: { Accordion, AccordionTab, Card, Dropdown, FunctionsCatalogDatasetFormColumnsTable, FunctionsCatalogDatasetFormVariablesTable, FunctionsCatalogDatasetEnvironmentTable, FunctionsCatalogParametersForm },
    props: { selectedDataset: { type: Object }, propFunction: { type: Object }, pythonEnvironments: { type: Array }, rEnvironments: { type: Array }, libraries: { type: Array } },
    emits: ['environmentSelected'],
    data() {
        return {
            selectedFunction: {} as iFunction,
            dataset: {} as iDataset,
            datasetColumns: [] as any[],
            selectedEnvironment: null
        }
    },
    watch: {
        selectedDataset() {
            this.loadDataset()
        }
    },
    created() {
        this.loadDataset()
        this.loadFunction()
    },
    methods: {
        loadDataset() {
            this.dataset = this.selectedDataset as iDataset
            if (this.dataset && this.dataset.meta) {
                this.getDatasetColumns()
            }
            this.clearInputColumnDatasetColumn()
        },
        loadFunction() {
            this.selectedFunction = this.propFunction as iFunction
        },
        getDatasetColumns() {
            this.datasetColumns = []
            for (let i = 2; i < this.dataset.meta.columns.length; i++) {
                if (this.dataset.meta.columns[i].pname === 'fieldAlias') {
                    this.datasetColumns.push(this.dataset.meta.columns[i].pvalue)
                }
            }
        },
        clearInputColumnDatasetColumn() {
            this.selectedFunction.inputColumns?.forEach((el: iInputColumn) => (el.dsColumn = ''))
        }
    }
})
</script>

<style lang="scss" scoped>
#form-container {
    flex: 3;
}

#parameters-form {
    flex: 1;
}
</style>
