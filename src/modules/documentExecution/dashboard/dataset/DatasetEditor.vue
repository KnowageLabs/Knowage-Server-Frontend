<template>
    <Teleport :to="`.dashboard-container-${dashboardIdProp}`">
        <div class="dashboardEditor dataset-editor">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('dashboard.datasetEditor.title') }}</q-toolbar-title>
                <span>
                    <q-btn flat round dense icon="save" :disable="modelHasEmptyAssociations" data-test="save-button" @click="saveDatasetsToModel" />
                    <q-tooltip :delay="500">{{ modelHasEmptyAssociations ? $t('dashboard.datasetEditor.saveDisabledAssociations') : $t('common.save') }}</q-tooltip>
                </span>
                <q-btn flat round dense icon="close" data-test="close-button" @click="closeDatasetEditor">
                    <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
            <q-tabs v-model="activeTab" align="left" dense no-caps class="dataset-editor__tabs">
                <q-tab name="data" :label="$t('dashboard.datasetEditor.dataTabTitle')" />
                <q-tab v-if="associationsTabVisible" name="associations" :class="{ 'text-negative': modelHasEmptyAssociations }" data-test="associations-tab">
                    <div class="row items-center no-wrap">
                        <span class="q-tab__label">{{ $t('dashboard.datasetEditor.associationsTabTitle') }}</span>
                        <q-icon v-if="modelHasEmptyAssociations" name="error" size="16px" class="q-ml-xs" />
                    </div>
                </q-tab>
            </q-tabs>
            <q-separator />

            <q-tab-panels v-model="activeTab" keep-alive class="dataset-editor__panels">
                <q-tab-panel name="data" class="q-pa-none">
                    <DataTab :available-datasets-prop="availableDatasets" :dashboard-datasets-prop="dashboardDatasets" :selected-datasets-prop="selectedDatasets" :document-drivers-prop="filtersDataProp" :dashboard-id="dashboardIdProp" @addSelectedDatasets="addSelectedDatasets" @deleteDataset="confirmDeleteDataset" />
                </q-tab-panel>
                <q-tab-panel v-if="associationsTabVisible" name="associations" class="q-pa-none">
                    <AssociationsTab :dashboard-associations-prop="dashboardAssociations" :selected-datasets-prop="selectedDatasets" :selected-association-prop="selectedAssociation" @associationSelected="selectAssociation" />
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </Teleport>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IAssociation, IDashboardDataset, IDashboardDatasetParameter, IDataset } from '../Dashboard'
import { emitter, loadDatasets } from '../DashboardHelpers'
import { mapActions } from 'pinia'
import DataTab from './DatasetEditorDataTab/DatasetEditorDataTab.vue'
import AssociationsTab from './DatasetEditorAssociations/DatasetEditorAssociations.vue'
import mainStore from '../../../../App.store'
import dashStore from '../Dashboard.store'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'dataset-editor',
    components: { DataTab, AssociationsTab },
    props: { availableDatasetsProp: { required: true, type: Array as PropType<IDataset[]> }, filtersDataProp: { type: Object }, dashboardIdProp: { type: String, required: true }, datasetsLoaded: { type: Boolean } },
    emits: ['closeDatasetEditor', 'datasetEditorSaved', 'allDatasetsLoaded'],
    setup() {
        const store = mainStore()
        const dashboardStore = dashStore()
        return { store, dashboardStore }
    },
    data() {
        return {
            activeTab: 'data',
            availableDatasets: {} as any,
            dashboardDatasets: [] as IDashboardDataset[],
            selectedDatasets: [] as any,
            dashboardAssociations: [] as IAssociation[],
            selectedAssociation: null as any,
            uncachedDatasets: ['SbiQueryDataSet', 'SbiQbeDataSet', 'SbiSolrDataSet', 'SbiPreparedDataSet'],
            initialDatasetsSnapshot: [] as IDashboardDataset[],
            initialChangeSnapshot: ''
        }
    },
    computed: {
        modelHasEmptyAssociations(): boolean {
            let isInvalid = false
            this.dashboardAssociations?.some((association) => {
                if (association.fields.length < 2) isInvalid = true
            })
            return isInvalid
        },
        associationsTabVisible(): boolean {
            return this.selectedDatasets.length > 1
        }
    },
    watch: {
        async availableDatasetsProp() {
            await this.setDatasetsData()
        },
        associationsTabVisible(visible: boolean) {
            if (!visible && this.activeTab === 'associations') this.activeTab = 'data'
        }
    },
    async created() {
        await this.setDatasetsData()
    },

    methods: {
        ...mapActions(dashStore, ['setAllDatasets']),
        async setDatasetsData() {
            await this.loadAvailableDatasets()
            this.dashboardDatasets = deepcopy(this.dashboardStore.$state.dashboards[this.dashboardIdProp].configuration.datasets)
            this.dashboardAssociations = deepcopy(this.dashboardStore.$state.dashboards[this.dashboardIdProp].configuration.associations)

            // Create initial snapshot for change detection
            this.initialDatasetsSnapshot = deepcopy(this.dashboardDatasets)

            this.selectedDatasets = this.selectModelDatasetsFromAvailable()
            this.setDatasetParametersFromModel()
            this.setDatasetDriversFromModel()
            this.initialChangeSnapshot = this.getChangeSnapshot()
        },
        // Everything the save writes, so any edit makes the editor dirty. Opening a dataset must not count as an edit:
        // the detail fills missing parameter types and values with their defaults, and adds displayDate to date drivers.
        getChangeSnapshot(): string {
            const datasets = this.selectedDatasets.map((dataset) => {
                const formattedDataset = this.formatDatasetForModel(dataset)
                formattedDataset.parameters = formattedDataset.parameters.map((parameter, index) => ({ ...parameter, type: parameter.type ?? 'static', value: parameter.value ?? dataset.parameters[index]?.defaultValue ?? '' }))
                return formattedDataset
            })
            const model = { datasets, associations: this.dashboardAssociations }
            return JSON.stringify(model, (key, value) => (key === 'displayDate' ? undefined : value))
        },
        async loadAvailableDatasets() {
            this.availableDatasets = deepcopy(this.availableDatasetsProp)
            if (this.datasetsLoaded === true) return
            this.availableDatasets = await loadDatasets(null, this.store, this.setAllDatasets, this.$http)
            this.$emit('allDatasetsLoaded', this.availableDatasets)
        },
        selectModelDatasetsFromAvailable() {
            return this.availableDatasets?.filter((responseDataset) => {
                return this.dashboardDatasets?.find((dashboardDataset) => {
                    if (responseDataset.id.dsId === dashboardDataset.id) {
                        responseDataset.modelParams = dashboardDataset.parameters
                        responseDataset.modelDrivers = dashboardDataset.drivers ? dashboardDataset.drivers : []
                        responseDataset.modelCache = dashboardDataset.cache
                        responseDataset.modelIndexes = dashboardDataset.indexes
                        responseDataset.frequency = dashboardDataset.frequency

                        return responseDataset
                    }
                })
            })
        },
        setDatasetParametersFromModel() {
            this.selectedDatasets.forEach((dataset) => {
                if (dataset.parameters.length > 0) {
                    dataset.parameters.forEach((parameter) => {
                        const modelParam = dataset.modelParams?.find((mp) => mp.name === parameter.name)
                        if (modelParam) {
                            parameter.value = modelParam.value
                            parameter.modelType = modelParam.type
                        } else {
                            parameter.value = parameter.defaultValue ?? ''
                            parameter.modelType = 'static'
                        }
                    })
                }
            })
        },
        setDatasetDriversFromModel() {
            this.selectedDatasets.forEach((dataset) => {
                if (dataset.drivers && dataset.modelDrivers) {
                    dataset.formattedDrivers = dataset.modelDrivers
                }
            })
        },
        addSelectedDatasets(datasetsToAdd) {
            this.setDatasetCache(datasetsToAdd)
            if ((this.selectedDatasets.some((dataset) => dataset.drivers?.length > 0) && datasetsToAdd.some((dataset) => dataset.drivers?.length > 0)) || datasetsToAdd.filter((dataset) => dataset.drivers?.length > 0).length > 1) {
                this.selectedDatasets.push(...datasetsToAdd.filter((dataset) => !(dataset.drivers?.length > 0)))
                const ignoredDatasets = datasetsToAdd.filter((dataset) => dataset.drivers?.length > 0).map((dataset) => dataset.name)
                this.$q.dialog({
                    title: this.$t('common.toast.warning'),
                    message: this.$t('dashboard.datasetEditor.datasetDriversWarningMsg1') + ignoredDatasets.join(', ') + this.$t('dashboard.datasetEditor.datasetDriversWarningMsg2'),
                    persistent: true
                })
            } else {
                datasetsToAdd.forEach((dataset) => {
                    this.selectedDatasets.push(dataset)
                    const formattedDatasetForDashboard = {
                        id: dataset.id.dsId,
                        label: dataset.label,
                        dsLabel: dataset.label,
                        indexes: [],
                        drivers: [],
                        cache: true,
                        parameters: []
                    } as IDashboardDataset
                    this.dashboardDatasets.push(formattedDatasetForDashboard)
                })
            }
        },
        setDatasetCache(datasets) {
            datasets.forEach((dataset) => {
                this.uncachedDatasets.includes(dataset.type) ? (dataset.modelCache = false) : (dataset.modelCache = true)
            })
        },
        selectAssociation(association) {
            this.selectedAssociation = association
        },

        confirmDeleteDataset(datasetToDelete) {
            const datasetUsedByWidgetCheck = false
            if (datasetUsedByWidgetCheck) {
                this.store.setInfo({ title: this.$t('common.toast.error'), msg: 'Dataset is being used by some widget.' })
            } else {
                this.$q
                    .dialog({
                        title: this.$t('common.toast.deleteConfirmTitle'),
                        message: this.$t('common.toast.deleteMessage'),
                        cancel: true,
                        persistent: true
                    })
                    .onOk(() => {
                        this.selectedAssociation = null as any
                        this.checkForDatasetAssociations(datasetToDelete)
                    })
            }
        },
        async checkForDatasetAssociations(datasetToDelete) {
            const datasetAssociations = (await this.getDatasetAssociations(datasetToDelete.id.dsId)) as unknown as IAssociation[]
            if (datasetAssociations && datasetAssociations.length > 0) this.deleteDatasetAssociations(datasetAssociations, datasetToDelete.id.dsId)
            this.deleteDataset(datasetToDelete.id.dsId)
        },
        async getDatasetAssociations(datasetId) {
            return this.dashboardAssociations?.filter((association) => {
                return association.fields.find((field) => field.dataset === datasetId)
            })
        },
        deleteDatasetAssociations(associationsWithDataset: IAssociation[], datasetId) {
            // Only the field of the deleted dataset goes; a group left with fewer than 2 fields is removed
            associationsWithDataset.forEach((association) => (association.fields = association.fields.filter((field) => field.dataset !== datasetId)))
            this.dashboardAssociations = this.dashboardAssociations.filter((association) => !associationsWithDataset.includes(association) || association.fields.length >= 2)
        },
        deleteDataset(datasetToDeleteId) {
            const toDeleteIndex = this.selectedDatasets.findIndex((dataset) => datasetToDeleteId === dataset.id.dsId)
            this.selectedDatasets.splice(toDeleteIndex, 1)
        },

        saveDatasetsToModel() {
            const formattedDatasets = [] as IDashboardDataset[]

            this.selectedDatasets.forEach((dataset) => {
                formattedDatasets.push(this.formatDatasetForModel(dataset))
            })
            const changedDatasetIds = this.detectDatasetChanges(formattedDatasets)

            this.dashboardStore.$state.dashboards[this.dashboardIdProp].configuration.datasets = formattedDatasets
            this.dashboardStore.$state.dashboards[this.dashboardIdProp].configuration.associations = this.dashboardAssociations

            changedDatasetIds.forEach((datasetId) => emitter.emit('datasetRefreshed', datasetId))

            this.$emit('datasetEditorSaved')
        },
        formatDatasetForModel(datasetToFormat) {
            const formattedDataset = {
                id: datasetToFormat.id.dsId,
                dsLabel: datasetToFormat.label,
                cache: datasetToFormat.modelCache ?? false,
                frequency: datasetToFormat.frequency,
                indexes: datasetToFormat.modelCache ? datasetToFormat.modelIndexes : [],
                parameters: datasetToFormat.parameters.map((parameter) => {
                    return { name: parameter.name, type: parameter.modelType, value: parameter.value, multivalue: parameter.multiValue ?? false } as IDashboardDatasetParameter
                })
            } as IDashboardDataset

            if (datasetToFormat.formattedDrivers && datasetToFormat.formattedDrivers.length > 0) {
                formattedDataset.drivers = datasetToFormat.formattedDrivers
            }

            return formattedDataset
        },
        closeDatasetEditor() {
            if (this.getChangeSnapshot() !== this.initialChangeSnapshot) {
                this.$q
                    .dialog({
                        title: this.$t('common.toast.warning'),
                        message: this.$t('dashboard.datasetEditor.pendingChanges'),
                        cancel: true,
                        persistent: true
                    })
                    .onOk(() => this.$emit('closeDatasetEditor'))
            } else this.$emit('closeDatasetEditor')
        },
        detectDatasetChanges(newDatasets: IDashboardDataset[]): string[] {
            const changedDatasetIds: string[] = []

            newDatasets.forEach((newDataset) => {
                const originalDataset = this.initialDatasetsSnapshot.find((orig) => orig.id === newDataset.id)

                if (originalDataset) {
                    const originalParams = JSON.stringify(originalDataset.parameters?.sort((a, b) => a.name.localeCompare(b.name)) || [])
                    const newParams = JSON.stringify(newDataset.parameters?.sort((a, b) => a.name.localeCompare(b.name)) || [])

                    const originalDrivers = JSON.stringify(originalDataset.drivers?.sort() || [])
                    const newDrivers = JSON.stringify(newDataset.drivers?.sort() || [])

                    const originalCache = originalDataset.cache
                    const newCache = newDataset.cache

                    const originalFrequency = originalDataset.frequency
                    const newFrequency = newDataset.frequency

                    if (originalParams !== newParams || originalDrivers !== newDrivers || originalCache !== newCache || originalFrequency !== newFrequency) {
                        changedDatasetIds.push(newDataset.id)
                    }
                }
            })

            return changedDatasetIds
        }
    }
})
</script>

<style lang="scss" scoped>
.dataset-editor__tabs {
    background-color: #fff;
    color: rgba(0, 0, 0, 0.87);
}

.dataset-editor__panels {
    flex: 1;
    min-height: 0;

    :deep(.q-tab-panel) {
        height: 100%;
    }
}
</style>

<style lang="scss">
// Layout shared by the Data and Associations tabs: a 300 px list on the left, cards on the right
.dataset-editor-tab {
    height: 100%;
}

.dataset-editor-tab__list {
    flex: 0 0 300px;
    width: 300px;
    overflow: hidden;
    background-color: var(--kn-editor-panel-background);
    border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.dataset-editor-tab__content {
    min-width: 0;
    overflow: hidden;
}

// q-scroll-area lets its content grow wider than the column; keep it at the column width, so long names get an ellipsis
.dataset-editor-tab__list .q-scrollarea__content,
.dataset-editor-tab__content .q-scrollarea__content {
    width: 100%;
}

.dataset-detail {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 850px;
    margin: 0 auto;
    padding: 16px;
}

// Card header shared by the detail cards (same pattern as the widget editor column tables)
.dataset-detail-card {
    border-radius: 4px;

    &__header {
        min-height: 44px;
    }
}
</style>
