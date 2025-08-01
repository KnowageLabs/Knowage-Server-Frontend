<template>
    <Toolbar class="kn-toolbar kn-toolbar--primary p-m-0">
        <template #start>{{ selectedDataset.label }}</template>
        <template #end>
            <Button :label="$t('managers.lovsManagement.preview')" class="p-button-text p-button-rounded p-button-plain" :disabled="buttonDisabled" @click="sendDatasetForPreview" />
            <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" :disabled="buttonDisabled" data-test="submit-button" @click="checkFormulaForParams" />
            <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" data-test="close-button" @click="$emit('close')" />
        </template>
    </Toolbar>
    <div class="datasetDetail">
        <TabView v-model:activeIndex="activeTab" class="tabview-custom kn-tab" data-test="tab-view">
            <TabPanel>
                <template #header>
                    <span>{{ $t('managers.mondrianSchemasManagement.detail.title') }}</span>
                </template>
                <DetailCard
                    :scope-types="scopeTypes"
                    :category-types="categoryTypes"
                    :selected-dataset="selectedDataset"
                    :selected-dataset-versions="selectedDatasetVersions"
                    :available-tags="availableTags"
                    :loading="loading"
                    @reloadVersions="getSelectedDatasetVersions"
                    @loadingOlderVersion="$emit('loadingOlderVersion')"
                    @olderVersionLoaded="onOlderVersionLoaded"
                    @touched="$emit('touched')"
                />
            </TabPanel>

            <TabPanel>
                <template #header>
                    <span>{{ $t('kpi.alert.type') }}</span>
                </template>
                <TypeCard
                    :active-tab="activeTab"
                    :selected-dataset="selectedDataset"
                    :dataset-types="filteredDatasetTypes"
                    :data-sources="dataSources"
                    :business-models="businessModels"
                    :script-types="scriptTypes"
                    :parent-valid="v$.$invalid"
                    :python-environments="pythonEnvironments"
                    :r-environments="rEnvironments"
                    @fileUploaded="selectedDataset.fileUploaded = true"
                    @queryEdited="showMetadataQueryInfo = true"
                    @touched="$emit('touched')"
                />
            </TabPanel>

            <TabPanel>
                <template #header>
                    <span>{{ $t('kpi.measureDefinition.metadata') }}</span>
                </template>
                <MetadataCard :selected-dataset="selectedDataset" :show-metadata-query-info-prop="showMetadataQueryInfo" @touched="$emit('touched')" />
            </TabPanel>

            <TabPanel v-if="selectedDataset.dsTypeCd == 'Query'">
                <template #header>
                    <span>{{ $t('managers.glossary.glossaryUsage.link') }}</span>
                </template>
                <LinkCard :selected-dataset="selectedDataset" :meta-source-resource="metaSourceResource" :active-tab="activeTab" @addTables="onAddLinkedTables" @removeTables="onRemoveLinkedTables" />
            </TabPanel>

            <TabPanel v-if="selectedDataset.dsTypeCd != 'Prepared' && selectedDataset.dsTypeCd != 'Flat'">
                <template #header>
                    <span>{{ $t('cron.advanced') }}</span>
                </template>
                <AdvancedCard :selected-dataset="selectedDataset" :transformation-dataset="transformationDataset" :scheduling-data="scheduling" @touched="$emit('touched')" />
            </TabPanel>
        </TabView>

        <Button v-if="selectedDataset.dsTypeCd == 'Prepared' || isOpenInQBEVisible(selectedDataset)" icon="far fa-share-from-square" class="p-button-text p-button-rounded p-button-plain advancedTransformations" @click="toggleMenu($event, selectedDataset)"></Button>
        <PreparedDataset v-if="selectedDataset.dsTypeCd == 'Prepared'" :selected-dataset="selectedDataset" :show-monitoring-dialog="showMonitoringDialog" :show-data-preparation="showDataPreparation" @closeMonitoringDialog="showMonitoringDialog = false" @closeDataPreparation="showDataPreparation = false" />
        <QBE v-if="qbeVisible" :source-dataset="selectedDataset" @close="closeQbe" />

        <Menu id="optionsMenu" ref="optionsMenu" :model="menuButtons" :popup="true" data-test="menu" />

        <WorkspaceDataPreviewDialog v-if="showPreviewDialog && correctRolesForExecution" :visible="showPreviewDialog" :prop-dataset="previewDataset" :preview-type="'dataset'" :load-from-dataset-management="true" :correct-roles-for-execution="correctRolesForExecution" @close="showPreviewDialog = false"></WorkspaceDataPreviewDialog>
    </div>
</template>

<script lang="ts">
import useValidate from '@vuelidate/core'
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import detailViewDescriptor from './DatasetManagementDetailViewDescriptor.json'
import DetailCard from './detailCard/DatasetManagementDetailCard.vue'
import TypeCard from './typeCard/DatasetManagementTypeCard.vue'
import AdvancedCard from './advancedCard/DatasetManagementAdvancedCard.vue'
import LinkCard from './linkCard/DatasetManagementLinkCard.vue'
import MetadataCard from './metadataCard/DatasetManagementMetadataCard.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import WorkspaceDataPreviewDialog from '@/modules/workspace/views/dataView/dialogs/WorkspaceDataPreviewDialog.vue'
import mainStore from '../../../../App.store'
import { mapState, mapActions } from 'pinia'
import Menu from 'primevue/menu'
import PreparedDataset from '@/modules/managers/datasetManagement/detailView/preparedDataset/DatasetManagementPreparedDataset.vue'
import QBE from '@/modules/qbe/QBE.vue'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { getCorrectRolesForExecution } from '@/helpers/commons/roleHelper'

export default defineComponent({
    components: { TabView, TabPanel, DetailCard, AdvancedCard, LinkCard, TypeCard, MetadataCard, WorkspaceDataPreviewDialog, Menu, PreparedDataset, QBE },
    props: {
        id: { type: String, required: false },
        scopeTypes: { type: Array as any, required: true },
        categoryTypes: { type: Array as any, required: true },
        datasetTypes: { type: Array as any, required: true },
        transformationDataset: { type: Object as any, required: true },
        scriptTypes: { type: Array as any, required: true },
        dataSources: { type: Array as any, required: true },
        businessModels: { type: Array as any, required: true },
        pythonEnvironments: { type: Array as any, required: true },
        rEnvironments: { type: Array as any, required: true },
        metaSourceResource: { type: Array as any, required: true },
        availableTags: { type: Array as any, required: true },
        datasetToCloneId: { type: Number as any }
    },
    emits: ['close', 'touched', 'loadingOlderVersion', 'olderVersionLoaded', 'updated', 'created', 'showSavingSpinner', 'hideSavingSpinner'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            detailViewDescriptor,
            v$: useValidate() as any,
            tablesToAdd: [] as any,
            tablesToRemove: [] as any,
            selectedDataset: {} as any,
            previewDataset: {} as any,
            selectedDatasetVersions: [] as any,
            filteredDatasetTypes: [] as any,
            scheduling: {
                repeatInterval: null as string | null
            } as any,
            touched: false,
            loading: false,
            loadingVersion: false,
            showPreviewDialog: false,
            showMetadataQueryInfo: false,
            activeTab: 0,
            qbeVisible: false,
            menuButtons: [] as any,
            showMonitoringDialog: false,
            showDataPreparation: false,
            correctRolesForExecution: null as string[] | null
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        }),
        buttonDisabled(): any {
            return this.v$.$invalid
        }
    },

    watch: {
        id() {
            this.getAllDatasetData()
            this.activeTab = 0
        },
        datasetToCloneId() {
            this.cloneDatasetConfirm(this.datasetToCloneId)
        },
        datasetTypes() {
            this.filteredDatasetTypes = this.datasetTypes
        }
    },
    created() {
        this.getAllDatasetData()
    },
    validations() {},
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError']),
        //#region ===================== Get All Data ====================================================
        async getSelectedDataset() {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/dataset/id/${this.id}`)
                .then((response: AxiosResponse<any>) => {
                    this.selectedDataset = response.data[0] ? { ...response.data[0] } : {}

                    const columns = [...new Set(this.selectedDataset.meta?.columns.map((e) => e.column))]
                    columns.forEach((col) => {
                        const hasDescription = this.selectedDataset.meta?.columns.some((item) => item.pname === 'description' && item.column === col)
                        if (!hasDescription) {
                            this.selectedDataset.meta?.columns.push({ column: col, pname: 'description', pvalue: '' })
                        }
                    })

                    this.selectedDataset.restJsonPathAttributes ? (this.selectedDataset.restJsonPathAttributes = JSON.parse(this.selectedDataset.restJsonPathAttributes ? this.selectedDataset.restJsonPathAttributes : '[]')) : []
                    this.selectedDataset.restRequestHeaders ? (this.selectedDataset.restRequestHeaders = JSON.parse(this.selectedDataset.restRequestHeaders ? this.selectedDataset.restRequestHeaders : '{}')) : {}

                    if (this.selectedDataset.restRequestHeaders) {
                        const restRequestHeadersKeys = Object.keys(this.selectedDataset.restRequestHeaders)
                        this.selectedDataset.restRequestHeaders = restRequestHeadersKeys.map((e) => ({ name: e, value: this.selectedDataset.restRequestHeaders[e] }))
                    }

                    this.selectedDataset.pythonEnvironment ? (this.selectedDataset.pythonEnvironment = JSON.parse(this.selectedDataset.pythonEnvironment ? this.selectedDataset.pythonEnvironment : '{}')) : ''
                })
                .catch()
        },
        async getSelectedDatasetVersions() {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/olderversions/${this.id}`)
                .then((response: AxiosResponse<any>) => {
                    response.data.root ? (this.selectedDatasetVersions = response.data.root) : (this.selectedDatasetVersions = [])
                })
                .catch()
                .finally(() => (this.loading = false))
        },
        async getAllDatasetData() {
            if (this.id) {
                this.loading = true
                await this.getSelectedDataset()
                await this.getSelectedDatasetVersions()
                this.insertCurrentVersion()
            } else {
                this.selectedDataset = { ...detailViewDescriptor.newDataset }
                this.selectedDatasetVersions = []
            }
            this.filteredDatasetTypes = this.datasetTypes
        },
        insertCurrentVersion() {
            if (this.selectedDatasetVersions.length === 0) {
                const selectedType = this.datasetTypes.find((type) => type.VALUE_CD === this.selectedDataset.dsTypeCd)
                this.selectedDatasetVersions.push({ type: selectedType.VALUE_DS, userIn: this.selectedDataset.owner, versNum: 0, dateIn: this.selectedDataset.dateIn, dsId: this.selectedDataset.id })
            }
        },
        //#endregion ===============================================================================================

        //#region ===================== Clone Functionality ====================================================
        cloneDatasetConfirm(datasetId) {
            this.$confirm.require({
                icon: 'pi pi-exclamation-triangle',
                message: this.$t('kpi.kpiDefinition.confirmClone'),
                header: this.$t(' '),
                accept: () => this.cloneDataset(datasetId)
            })
        },
        async cloneDataset(datasetId) {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/dataset/id/${datasetId}`).then(async (response: AxiosResponse<any>) => {
                if (response.data[0].dsTypeCd === 'File') {
                    await this.$http.put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/clone-file?fileName=${response.data[0].fileName}`)
                }
                delete response.data[0].id
                response.data[0].label = '...'
                response.data[0].dsVersions = []
                response.data[0].usedByNDocs = 0

                this.selectedDataset = { ...response.data[0] }

                this.selectedDataset.restJsonPathAttributes ? (this.selectedDataset.restJsonPathAttributes = JSON.parse(this.selectedDataset.restJsonPathAttributes ? this.selectedDataset.restJsonPathAttributes : '[]')) : []
                this.selectedDataset.restRequestHeaders ? (this.selectedDataset.restRequestHeaders = JSON.parse(this.selectedDataset.restRequestHeaders ? this.selectedDataset.restRequestHeaders : '{}')) : {}

                if (this.selectedDataset.restRequestHeaders) {
                    const restRequestHeadersKeys = Object.keys(this.selectedDataset.restRequestHeaders)
                    this.selectedDataset.restRequestHeaders = restRequestHeadersKeys.map((e) => ({ name: e, value: this.selectedDataset.restRequestHeaders[e] }))
                }

                console.log('this.selectedDataset.', this.selectedDataset)
            })
        },
        //#endregion ===============================================================================================

        //#region ===================== Save/Update Dataset & Tags =================================================
        async saveDataset() {
            const dsToSave = { ...this.selectedDataset } as any
            if (this.user?.functionalities?.includes(UserFunctionalitiesConstants.DATA_PREPARATION) && dsToSave.id) {
                await this.$http
                    .get(import.meta.env.VITE_KNOWAGE_DATA_PREPARATION_CONTEXT + '/api/1.0/instance/dataset/' + dsToSave.id, { headers: { 'X-Disable-Interceptor': 'true' } })
                    .then((response: AxiosResponse<any>) => {
                        if (response.data) {
                            this.$confirm.require({
                                icon: 'pi pi-exclamation-triangle',
                                message: this.$t('managers.datasetManagement.dataPreparation.datasetInvolvedIntoDataPrep'),
                                header: this.$t('managers.datasetManagement.saveTitle'),
                                accept: () => this.checkDerived(dsToSave)
                            })
                        } else {
                            this.checkDerived(dsToSave)
                        }
                    })
                    .catch((err) => {
                        this.setError({ title: 'Server error', msg: err.data.errors[0].message })
                    })
            } else {
                this.checkDerived(dsToSave)
            }
        },
        async checkDerived(dsToSave) {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/datasets/dataset/' + dsToSave.label + '/derived', { headers: { 'X-Disable-Interceptor': 'true' } })
                .then((response: AxiosResponse<any>) => {
                    if (response.data) {
                        this.$confirm.require({
                            icon: 'pi pi-exclamation-triangle',
                            message: this.$t('managers.datasetManagement.derived.checkForExistingDerivedDatasets'),
                            header: this.$t('managers.datasetManagement.saveTitle'),
                            accept: () => this.proceedOnSaving(dsToSave)
                        })
                    } else {
                        this.proceedOnSaving(dsToSave)
                    }
                })
                .catch((err) => {
                    this.setError({ title: 'Server error', msg: err.data.errors[0].message })
                })
        },
        async proceedOnSaving(dsToSave) {
            this.$emit('showSavingSpinner')
            if (dsToSave.dsTypeCd.toLowerCase() == 'rest' || dsToSave.dsTypeCd.toLowerCase() == 'solr') {
                dsToSave.restRequestHeaders = (dsToSave.restRequestHeaders || []).reduce((acc, curr) => {
                    acc[curr['name']] = curr['value']
                    return acc
                }, {})
            }

            dsToSave.pars ? '' : (dsToSave.pars = [])
            dsToSave.pythonEnvironment ? (dsToSave.pythonEnvironment = JSON.stringify(dsToSave.pythonEnvironment)) : ''

            dsToSave.meta ? (dsToSave.meta = await this.manageDatasetFieldMetadata(dsToSave.meta)) : (dsToSave.meta = [])
            dsToSave.recalculateMetadata = true

            dsToSave.isScheduled ? (dsToSave.schedulingCronLine = await this.formatCronForSave()) : ''

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/`, dsToSave)
                .then(async (response: AxiosResponse<any>) => {
                    this.touched = false
                    this.setInfo({ title: this.$t('common.toast.createTitle'), msg: this.$t('common.toast.success') })
                    this.selectedDataset.id ? this.$emit('updated') : this.$emit('created', response)
                    await this.saveTags(dsToSave, response.data.id)
                    await this.saveLinks(response.data.id)
                    await this.removeLinks(response.data.id)
                    await this.getSelectedDataset()
                })
                .catch()
                .finally(() => this.$emit('hideSavingSpinner'))
        },

        async saveTags(dsToSave, id) {
            const tags = {} as any
            tags.versNum = dsToSave.versNum + 1
            tags.tagsToAdd = dsToSave.tags

            await this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/datasets/${id}/dstags/`, tags).catch()
        },
        async saveLinks(id) {
            if (this.tablesToAdd.length > 0) {
                this.tablesToAdd.forEach(async (link) => {
                    if (link.added === true) {
                        delete link.added
                        await this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/metaDsRelationResource/${id}`, link).catch()
                    }
                })
            }
        },
        async removeLinks(id) {
            if (this.tablesToRemove.length > 0) {
                this.tablesToRemove.forEach(async (link) => {
                    if (link.deleted === true) {
                        await this.$http.delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/metaDsRelationResource/${id}/${link.tableId}`).catch()
                    }
                })
            }
        },
        async manageDatasetFieldMetadata(fieldsColumns) {
            if (fieldsColumns.columns != undefined && fieldsColumns.columns != null) {
                const columnsArray = []
                let columnsNames = []

                for (let i = 0; i < fieldsColumns.columns.length; i++) {
                    const element = fieldsColumns.columns[i]
                    columnsNames.push(element.column)
                }

                columnsNames = this.removeDuplicates(columnsNames)

                for (let i = 0; i < columnsNames.length; i++) {
                    const columnObject = { displayedName: '', name: '', fieldType: '', type: '', personal: false, decrypt: false, subjectId: false, description: '' }
                    const currentColumnName = columnsNames[i]

                    //remove the part before the double dot if the column is in the format ex: it.eng.spagobi.Customer:customerId
                    if (currentColumnName.indexOf(':') != -1) {
                        const arr = currentColumnName.split(':')
                        columnObject.displayedName = arr[1]
                    } else {
                        columnObject.displayedName = currentColumnName
                    }

                    columnObject.name = currentColumnName
                    for (let j = 0; j < fieldsColumns.columns.length; j++) {
                        const element = fieldsColumns.columns[j]
                        if (element.column == currentColumnName) {
                            if (element.pname.toUpperCase() == 'type'.toUpperCase()) {
                                columnObject.type = element.pvalue
                            } else if (element.pname.toUpperCase() == 'fieldType'.toUpperCase()) {
                                columnObject.fieldType = element.pvalue
                            } else if (element.pname.toUpperCase() == 'personal'.toUpperCase()) {
                                columnObject.personal = element.pvalue
                            } else if (element.pname.toUpperCase() == 'decrypt'.toUpperCase()) {
                                columnObject.decrypt = element.pvalue
                            } else if (element.pname.toUpperCase() == 'subjectId'.toUpperCase()) {
                                columnObject.subjectId = element.pvalue
                            } else if (element.pname.toUpperCase() == 'description'.toUpperCase()) {
                                columnObject.description = element.pvalue
                            }
                        }
                    }
                    columnsArray.push(columnObject)
                }

                return columnsArray
            }
        },
        checkFormulaForParams() {
            if (this.selectedDataset?.query?.includes('${') && this.selectedDataset?.isPersisted) {
                this.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('managers.datasetManagement.formulaParamError') })
            } else this.saveDataset()
        },
        removeDuplicates(array) {
            const index = {}
            for (let i = array.length - 1; i >= 0; i--) {
                if (array[i] in index) {
                    array.splice(i, 1)
                } else {
                    index[array[i]] = true
                }
            }
            return array
        },
        async formatCronForSave() {
            if (this.selectedDataset.isScheduled) {
                if (this.selectedDataset.startDate == null) {
                    this.selectedDataset.startDate = new Date()
                }
                const repeatInterval = this.scheduling.repeatInterval
                let finalCronString = ''
                const secondsForCron = 0
                const minutesForCron = this.stringifySchedulingValues(this.scheduling.minutesSelected && this.scheduling.minutesSelected.length != 0, 'minutesSelected')
                const hoursForCron = this.stringifySchedulingValues(repeatInterval != 'minute' && this.scheduling.hoursSelected && this.scheduling.hoursSelected.length != 0, 'hoursSelected')
                let daysForCron = this.stringifySchedulingValues((repeatInterval === 'day' || repeatInterval === 'month') && this.scheduling.daysSelected && this.scheduling.daysSelected.length != 0, 'daysSelected')
                const monthsForCron = this.stringifySchedulingValues(repeatInterval === 'month' && this.scheduling.monthsSelected && this.scheduling.monthsSelected.length != 0, 'monthsSelected')
                let weekdaysForCron = this.stringifySchedulingValues(repeatInterval === 'week' && this.scheduling.weekdaysSelected && this.scheduling.weekdaysSelected.length != 0, 'weekdaysSelected')

                if (daysForCron == '*' && weekdaysForCron != '*') {
                    daysForCron = '?'
                } else {
                    weekdaysForCron = '?'
                }
                finalCronString = minutesForCron + ' ' + hoursForCron + ' ' + daysForCron + ' ' + monthsForCron + ' ' + weekdaysForCron

                return secondsForCron + ' ' + finalCronString
            }
        },
        stringifySchedulingValues(condition, selectedValue) {
            let stringValue = ''
            if (condition) {
                for (let i = 0; i < this.scheduling[selectedValue].length; i++) {
                    stringValue += '' + this.scheduling[selectedValue][i]

                    if (i < this.scheduling[selectedValue].length - 1) {
                        stringValue += ','
                    }
                }
                return stringValue
            } else {
                stringValue = '*'
                return stringValue
            }
        },
        //#endregion ===============================================================================================

        async sendDatasetForPreview() {
            if (this.previewDataset?.id) {
                getCorrectRolesForExecution(null, this.selectedDataset).then(async (response) => {
                    this.correctRolesForExecution = response as string[]
                })
            } else {
                const sessionRole = (this.store.$state as any).user.sessionRole !== this.$t('role.defaultRolePlaceholder') ? (this.store.$state as any).user.sessionRole : null
                this.correctRolesForExecution = sessionRole ? [sessionRole] : [(this.store.$state as any).user.roles[0]]
            }

            if (this.selectedDataset.dsTypeCd === 'Solr') {
                this.previewDataset = JSON.parse(JSON.stringify(this.selectedDataset))
                const restRequestHeadersTemp = {}
                if (this.previewDataset.dsTypeCd.toLowerCase() == 'rest' || this.previewDataset.dsTypeCd.toLowerCase() == 'solr') {
                    for (let i = 0; i < this.previewDataset.restRequestHeaders.length; i++) {
                        restRequestHeadersTemp[this.previewDataset.restRequestHeaders[i]['name']] = this.previewDataset.restRequestHeaders[i]['value']
                    }
                }
                this.previewDataset['restRequestHeaders'] = JSON.stringify(restRequestHeadersTemp)
                this.previewDataset['restJsonPathAttributes'] && this.previewDataset['restJsonPathAttributes'].length > 0 ? (this.previewDataset.restJsonPathAttributes = JSON.stringify(this.previewDataset.restJsonPathAttributes)) : (this.previewDataset.restJsonPathAttributes = [])
                this.previewDataset.pars ? '' : (this.previewDataset.pars = [])
                this.previewDataset.pythonEnvironment ? (this.previewDataset.pythonEnvironment = JSON.stringify(this.previewDataset.pythonEnvironment)) : ''
                this.previewDataset.meta ? (this.previewDataset.meta = await this.manageDatasetFieldMetadata(this.previewDataset.meta)) : (this.previewDataset.meta = [])

                this.showPreviewDialog = true
            } else {
                this.previewDataset = this.selectedDataset
                this.showPreviewDialog = true
                console.log('PREVIEW DS', this.previewDataset)
            }
        },

        onAddLinkedTables(event) {
            this.tablesToAdd = event
            this.$emit('touched')
        },
        onRemoveLinkedTables(event) {
            this.tablesToRemove = event
            this.$emit('touched')
        },
        onOlderVersionLoaded(event) {
            this.$emit('olderVersionLoaded')
            this.selectedDataset = { ...event }
        },
        toggleMenu(event: Event, dataset: any): void {
            this.menuButtons = [] as any

            if (this.isOpenInQBEVisible(this.selectedDataset)) {
                this.menuButtons.push({
                    key: 1,
                    label: this.$t('workspace.myModels.openInQBE'),
                    icon: 'fas fa-file-circle-question',
                    command: () => {
                        this.openDatasetInQbe()
                    }
                })
            }

            if (dataset.pars && dataset.pars?.length == 0) {
                this.menuButtons.push({
                    key: 2,
                    label: this.$t('managers.datasetManagement.openDP'),
                    icon: 'fas fa-cogs',
                    command: () => {
                        this.showDataPreparation = true
                    }
                })
            }
            if (dataset.dsTypeCd == 'Prepared') {
                this.menuButtons.push({
                    key: 3,
                    label: this.$t('managers.datasetManagement.monitoring'),
                    icon: 'pi pi-chart-line',
                    command: () => {
                        this.showMonitoringDialog = true
                    }
                })
            }

            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.optionsMenu.toggle(event)
        },
        isOpenInQBEVisible(dataset: any) {
            return dataset.pars?.length == 0 && ((dataset.isPersisted && dataset.dsTypeCd == 'File') || dataset.dsTypeCd == 'Query' || dataset.dsTypeCd == 'Flat')
        },
        openDatasetInQbe() {
            this.qbeVisible = true
        },
        closeQbe() {
            this.qbeVisible = false
        }
    }
})
</script>
<style lang="scss" scoped>
.datasetDetail {
    overflow: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.advancedTransformations {
    position: fixed;
    right: 20px;
    top: 40px;
    z-index: 1000;
}
</style>
