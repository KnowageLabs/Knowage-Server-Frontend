<template>
    <MonitoringDialog :visibility="showMonitoringDialog" :dataset="selectedDataset" @close="closeDialog" @save="updateDatasetAndSave" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import descriptor from './DatasetManagementPreparedDataset.json'
import MonitoringDialog from '@/modules/workspace/dataPreparation/DataPreparationMonitoring/DataPreparationMonitoringDialog.vue'
import mainStore from '@/App.store'

export default defineComponent({
    components: { MonitoringDialog },
    props: { selectedDataset: { type: Object as any }, dataSources: { type: Array as any }, showMonitoringDialog: Boolean, showDataPreparation: Boolean },
    emits: ['touched', 'closeMonitoringDialog', 'closeDataPreparation'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            descriptor,
            dataset: {} as any,
            availableDatasets: [] as any,
            avroDatasets: [] as any
        }
    },
    watch: {
        selectedDataset() {
            this.dataset = this.selectedDataset
        },
        showDataPreparation(newValue) {
            if (newValue) {
                this.prepareForDataPreparation()
            }
        }
    },
    created() {
        this.dataset = this.selectedDataset
    },
    methods: {
        async loadDataset(datasetId: number) {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/dataset/id/${datasetId}`)
                .then((response: AxiosResponse<any>) => {
                    this.dataset = response.data[0]
                })
                .catch(() => {})
        },
        routeToDataPreparation() {
            const path = ''
            this.$confirm.require({
                header: this.$t('managers.datasetManagement.openDP'),
                message: this.$t('managers.datasetManagement.confirmMsg'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.$router.push(path)
                }
            })
        },

        async getAllAvroDataSets() {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/datasets/avro`)
                .then((response: AxiosResponse<any>) => {
                    this.avroDatasets = response.data
                })
                .catch(() => {})
        },

        async prepareForDataPreparation() {
            await this.getAllAvroDataSets()
            await this.openDataPreparation(this.selectedDataset)
        },

        isAvroReady(dsId: number) {
            if (this.avroDatasets.indexOf(dsId) >= 0 || (dsId && this.avroDatasets.indexOf(dsId.toString())) >= 0) return true
            else return false
        },

        getDatasetInfo(dataset) {
            if (!dataset) return ''
            const tempDs = {
                label: dataset.label,
                name: dataset.name,
                description: dataset.description,
                id: dataset.id
            }
            return JSON.stringify(tempDs)
        },

        openDataPreparation(dataset: any) {
            if (dataset.dsTypeCd == 'Prepared') {
                //edit existing data prep
                this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/datasets/advanced/${dataset.id}`).then(
                    (response: AxiosResponse<any>) => {
                        const instanceId = response.data.configuration.dataPrepInstanceId
                        this.$http.get(import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + `/api/1.0/process/by-instance-id/${instanceId}`).then(
                            (response: AxiosResponse<any>) => {
                                const transformations = response.data.definition
                                const processId = response.data.id
                                const datasetId = response.data.instance.dataSetId
                                if (this.isAvroReady(datasetId))
                                    // check if Avro file has been deleted or not
                                    this.$router.push({ name: 'data-preparation', params: { id: datasetId, transformations: JSON.stringify(transformations), processId: processId, instanceId: instanceId, dataset: this.getDatasetInfo(dataset) } })
                                else {
                                    this.store.setInfo({
                                        title: 'Avro file is missing',
                                        msg: 'Generate it again and then retry'
                                    })
                                }
                            },
                            () => {
                                this.store.setError({ title: 'Save error', msg: 'Cannot create process' })
                            }
                        )
                    },
                    () => {
                        this.store.setError({
                            title: 'Cannot open data preparation'
                        })
                    }
                )
            } else if (this.isAvroReady(dataset.id)) {
                // original dataset already exported in Avro
                this.$router.push({ name: 'data-preparation', params: { id: dataset.id } })
            } else {
                this.store.setInfo({
                    title: 'Avro file is missing',
                    msg: 'Generate it again and then retry'
                })
            }
        },
        async updateDatasetAndSave(newConfig) {
            this.closeDialog()

            await this.$http.patch(import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + '/api/1.0/instance/' + newConfig.instanceId, { config: newConfig.config }).then(
                () => {
                    this.loadDataset(this.selectedDataset.id)
                },
                () => {
                    this.store.setError({ title: this.$t('common.error.saving'), msg: this.$t('managers.workspaceManagement.dataPreparation.errors.updatingSchedulation') })
                }
            )
        },
        closeDialog() {
            this.$emit('closeMonitoringDialog')
        },
        closeDataPreparation() {
            this.$emit('closeDataPreparation')
        }
    }
})
</script>
