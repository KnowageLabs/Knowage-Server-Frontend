<template>
    <Teleport to=".dashboard-container">
        <div class="dashboardEditor">
            <Toolbar class="kn-toolbar kn-toolbar--primary">
                <template #start>{{ $t('dashboard.datasetEditor.title') }}</template>
                <template #end>
                    <Button :disabled="modelHasEmptyAssociations" icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" data-test="save-button" @click="saveDatasetsToModel" />
                    <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" @click="closeDatasetEditor" />
                </template>
            </Toolbar>

            <TabView v-if="!loading" class="dashboardEditor-tabs">
                <TabPanel :header="$t('dashboard.datasetEditor.dataTabTitle')">
                    <DataTab :available-datasets-prop="availableDatasets" :dashboard-datasets-prop="dashboardDatasets" :selected-datasets-prop="selectedDatasets" :document-drivers-prop="filtersDataProp" :dashboard-id="dashboardIdProp" @addSelectedDatasets="addSelectedDatasets" @deleteDataset="confirmDeleteDataset" />
                </TabPanel>
                <TabPanel v-if="dashboardDatasets.length > 1">
                    <template #header>
                        <span :class="{ 'details-warning-color': modelHasEmptyAssociations }">{{ $t('dashboard.datasetEditor.associationsTabTitle') }}</span>
                        <i v-if="modelHasEmptyAssociations" class="fa-solid fa-circle-exclamation p-ml-1 details-warning-color" />
                    </template>
                    <AssociationsTab :dashboard-associations-prop="dashboardAssociations" :selected-datasets-prop="selectedDatasets" :selected-association-prop="selectedAssociation" @associationSelected="selectAssociation" />
                </TabPanel>
            </TabView>
        </div>
    </Teleport>
    <DriverWarningDialog :visible="warningDialogVisible" :ignored-datasets="ignoredDatasets" @close="warningDialogVisible = false" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IAssociation, IDashboardDataset, IDashboardDatasetParameter, IDataset } from '../Dashboard'
import { emitter, loadDatasets } from '../DashboardHelpers'
import { mapActions } from 'pinia'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTab from './DatasetEditorDataTab/DatasetEditorDataTab.vue'
import AssociationsTab from './DatasetEditorAssociations/DatasetEditorAssociations.vue'
import DriverWarningDialog from './DatasetEditorDataTab/DatasetEditorDataDialog/DatasetEditorDataWarningDialog.vue'
import mainStore from '../../../../App.store'
import dashStore from '../Dashboard.store'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'dataset-editor',
    components: { TabView, TabPanel, DataTab, AssociationsTab, DriverWarningDialog },
    props: { availableDatasetsProp: { required: true, type: Array as PropType<IDataset[]> }, filtersDataProp: { type: Object }, dashboardIdProp: { type: String, required: true }, datasetsLoaded: { type: Boolean } },
    emits: ['closeDatasetEditor', 'datasetEditorSaved', 'allDatasetsLoaded'],
    setup() {
        const store = mainStore()
        const dashboardStore = dashStore()
        return { store, dashboardStore }
    },
    data() {
        return {
            activeIndex: 0,
            loading: false,
            warningDialogVisible: false,
            availableDatasets: {} as any,
            dashboardDatasets: [] as IDashboardDataset[],
            selectedDatasets: [] as any,
            dashboardAssociations: [] as IAssociation[],
            selectedAssociation: {} as any,
            ignoredDatasets: [] as string[],
            uncachedDatasets: ['SbiQueryDataSet', 'SbiQbeDataSet', 'SbiSolrDataSet', 'SbiPreparedDataSet'],
            dirty: false,
            initialDatasetsSnapshot: [] as IDashboardDataset[]
        }
    },
    computed: {
        modelHasEmptyAssociations(): boolean {
            let isInvalid = false
            this.dashboardAssociations?.some((association) => {
                if (association.fields.length < 2) isInvalid = true
            })
            return isInvalid
        }
    },
    watch: {
        async availableDatasetsProp() {
            await this.setDatasetsData()
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
                if (dataset.parameters.length > 0 && dataset.modelParams.length > 0) {
                    dataset.parameters.forEach((parameter) => {
                        dataset.modelParams.forEach((modelParam) => {
                            if (parameter.name === modelParam.name) {
                                parameter.value = modelParam.value
                                parameter.modelType = modelParam.type
                            }
                        })
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
                this.ignoredDatasets = datasetsToAdd.filter((dataset) => dataset.drivers?.length > 0).map((dataset) => dataset.name)
                this.warningDialogVisible = true
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
                this.$confirm.require({
                    message: this.$t('common.toast.deleteMessage'),
                    header: this.$t('common.toast.deleteConfirmTitle'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.selectedAssociation = null as any
                        this.checkForDatasetAssociations(datasetToDelete)
                    }
                })
            }
        },
        async checkForDatasetAssociations(datasetToDelete) {
            const datasetAssociations = (await this.getDatasetAssociations(datasetToDelete.id.dsId)) as unknown as IAssociation[]
            if (datasetAssociations && datasetAssociations.length > 0) this.deleteDatasetAssociations(datasetAssociations)
            this.deleteDataset(datasetToDelete.id.dsId)
        },
        async getDatasetAssociations(datasetId) {
            return this.dashboardAssociations?.filter((association) => {
                return association.fields.find((field) => field.dataset === datasetId)
            })
        },
        deleteDatasetAssociations(associationsToDelete) {
            this.dashboardAssociations = this.dashboardAssociations.filter((association) => !associationsToDelete.find((assToDelete) => assToDelete.id === association.id))
        },
        deleteDataset(datasetToDeleteId) {
            const toDeleteIndex = this.selectedDatasets.findIndex((dataset) => datasetToDeleteId === dataset.id.dsId)
            this.selectedDatasets.splice(toDeleteIndex, 1)

            this.dirty = true
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
            console.log('Formatting dataset for model:', datasetToFormat)
            console.log('datasetToFormat.parameters', datasetToFormat.parameters)
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
            if (this.dirty) {
                this.$confirm.require({
                    message: this.$t('dashboard.datasetEditor.pendingChanges'),
                    header: this.$t('common.toast.warning'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => this.$emit('closeDatasetEditor')
                })
            } else this.$emit('closeDatasetEditor')
        },
        detectDatasetChanges(newDatasets: IDashboardDataset[]): string[] {
            const changedDatasetIds: string[] = []

            newDatasets.forEach((newDataset) => {
                const originalDataset = this.initialDatasetsSnapshot.find((orig) => orig.id === newDataset.id)

                console.log('Comparing datasets:', newDataset, 'with original:', originalDataset)

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
