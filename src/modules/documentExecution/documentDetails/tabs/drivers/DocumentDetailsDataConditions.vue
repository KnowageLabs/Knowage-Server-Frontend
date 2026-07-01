<template>
    <q-card v-if="!loading" class="q-mb-md">
        <q-card-section class="q-py-sm row items-center">
            <div class="dd-section-label col">{{ $t('documentExecution.documentDetails.drivers.conditionsTitle') }}</div>
            <q-btn :label="$t('managers.businessModelManager.addCondition')" flat dense icon="add" color="primary" size="sm" @click="showForm">
                <q-tooltip>{{ $t('managers.businessModelManager.addCondition') }}</q-tooltip>
            </q-btn>
        </q-card-section>
        <q-separator />
        <q-linear-progress v-if="loading" indeterminate color="primary" />
        <q-list separator>
            <q-item v-for="(cond, i) in conditions" :key="i" clickable @click="showForm({ value: cond })">
                <q-item-section>
                    <q-item-label class="text-body2 ellipsis">
                        <b>{{ cond.filterOperation }} {{ $t('documentExecution.documentDetails.drivers.dataConditionsValue') }}</b> {{ cond.parFatherUrlName }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn flat round dense icon="delete" size="sm" color="negative" @click.stop="deleteConditions(cond)">
                        <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                    </q-btn>
                </q-item-section>
            </q-item>
            <q-item v-if="conditions.length === 0">
                <q-item-section class="text-grey-6">{{ $t('documentExecution.documentDetails.drivers.noDataCond') }}</q-item-section>
            </q-item>
        </q-list>
    </q-card>

    <q-dialog :model-value="conditionFormVisible" persistent @hide="conditionFormVisible = false">
        <q-card style="min-width: 600px">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('documentExecution.documentDetails.drivers.visualizationTitle') }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section>
                <div class="row q-col-gutter-sm">
                    <div class="col-4">
                        <q-select outlined dense emit-value map-options v-model="condition.parFatherId" :options="excludeCurrentDriverFromList()" option-label="label" option-value="id" :label="$t('documentExecution.documentDetails.drivers.ad') + ' ' + $t('documentExecution.documentDetails.drivers.adDepends')" @update:model-value="setParFatherUrlName" />
                    </div>
                    <div class="col-4">
                        <q-select outlined dense v-model="condition.filterOperation" :options="availableOperators" :label="$t('managers.businessModelManager.filterOperator')">
                            <template #append>
                                <q-icon name="info" color="grey" size="xs">
                                    <q-tooltip>{{ $t('documentExecution.documentDetails.drivers.dataHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-select>
                    </div>
                    <div class="col-4">
                        <q-select outlined dense v-model="condition.logicOperator" :options="connectingOperators" :label="$t('managers.businessModelManager.logicOperator')" />
                    </div>
                </div>
                <q-separator class="q-mt-md q-mb-sm"></q-separator>
                <div v-for="mode in modes" :key="mode.useID">
                    <div class="text-subtitle1 q-mb-xs text-weight-medium">{{ $t('managers.businessModelManager.modality') + ': ' + mode.name }}</div>
                    <div class="row q-col-gutter-sm items-center">
                        <div class="col">
                            <q-select outlined dense v-model="modalities[mode.useID]" :options="getLovs(mode.idLov)" :label="$t('managers.businessModelManager.lovsColumn')" :placeholder="$t('managers.businessModelManager.lovsColumnSelect')" />
                        </div>
                        <div class="col-auto">
                            <q-checkbox v-model="selectedModes" :val="mode.useID" :label="$t('managers.businessModelManager.check')" dense />
                        </div>
                    </div>
                </div>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat :label="$t('common.cancel')" @click="conditionFormVisible = false" />
                <q-btn color="primary" :label="$t('common.save')" @click="handleSubmit" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iDriver, iDocument } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { AxiosResponse } from 'axios'
import driversDescriptor from './DocumentDetailsDriversDescriptor.json'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'document-data-conditions',
    props: { availableDrivers: { type: Array as PropType<iDriver[]>, required: true }, selectedDocument: { type: Object as PropType<iDocument>, required: true }, selectedDriver: { type: Object as PropType<iDriver>, required: true } },
    emits: ['driversChanged'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            availableOperators: driversDescriptor.dataOperators,
            connectingOperators: driversDescriptor.connectingOperators,
            modes: [] as any,
            lovs: [] as any,
            condition: {} as any,
            conditionFormVisible: false,
            loading: false,
            modalities: {} as any,
            selectedModes: [] as any,
            originalModalities: [] as any[],
            conditions: [] as any[],
            oldDropdownValue: null as any,
            driver: null as any | null,
            operation: 'insert',
            errorMessage: '',
            displayWarning: false
        }
    },
    watch: {
        async selectedDriver() {
            this.loadSelectedDriver()
            if (this.driver) {
                await this.loadDataDependencies()
                if (this.driver.parameter) {
                    await this.loadModes()
                    await this.loadLovs()
                }
            }
        }
    },
    async created() {
        this.loadSelectedDriver()
        if (this.selectedDriver) {
            await this.loadDataDependencies()
            await this.loadModes()
            await this.loadLovs()
        }
    },
    methods: {
        loadSelectedDriver() {
            this.oldDropdownValue = null
            this.driver = this.selectedDriver as any

            if (this.driver) {
                if (this.driver.parameter) {
                    this.oldDropdownValue = this.driver.parameter
                }
            }
        },
        async loadDataDependencies() {
            this.conditions = []
            if (this.driver && this.driver.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/datadependencies?driverId=${this.selectedDriver.id}`).then((response: AxiosResponse<any>) =>
                    response.data.forEach((condition: any) => {
                        const index = this.conditions.findIndex((cond) => cond.parFatherId === condition.parFatherId && cond.filterOperation == condition.filterOperation && cond.logicOperator == condition.logicOperator)
                        condition.modalities = []
                        condition.modalities.push({ conditionId: condition.id, useModeId: condition.useModeId, filterColumn: condition.filterColumn })
                        if (index > -1) {
                            this.conditions[index].modalities.push({ conditionId: condition.id, useModeId: condition.useModeId, filterColumn: condition.filterColumn })
                        } else {
                            this.conditions.push(condition)
                        }
                    })
                )
            }
        },
        async loadModes() {
            this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers/${this.selectedDriver.parID}/modes`).then((response: AxiosResponse<any>) => (this.modes = response.data))
        },
        async loadLovs() {
            this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/analyticalDrivers/${this.selectedDriver.parID}/lovs`).then((response: AxiosResponse<any>) => (this.lovs = response.data))
        },
        getLovs(lovId: number) {
            const index = this.lovs.findIndex((lov) => lov.id === lovId)
            if (index > -1) {
                const lov = JSON.parse(this.lovs[index].lovProviderJSON)
                return lov.QUERY?.['VISIBLE-COLUMNS']?.split(',') ?? []
            }
            return []
        },
        isModeActive(modeId: number) {
            const index = this.selectedModes.findIndex((id: any) => {
                return id === modeId
            })
            return index === -1
        },
        urlNotUnique(url: string) {
            const index = this.availableDrivers.findIndex((driver) => driver.parameterUrlName === url && driver.id != this.driver?.id)
            return index === -1
        },
        excludeCurrentDriverFromList() {
            return this.availableDrivers.filter((driver) => driver.id != this.selectedDriver.id)
        },
        setParFatherUrlName(value) {
            this.availableDrivers.filter((driver) => {
                driver.id === value ? (this.condition.parFatherUrlName = driver.parameterUrlName) : ''
            })
        },
        showAnalyticalDropdownConfirm() {
            if (this.oldDropdownValue) {
                this.$confirm.require({
                    message: this.$t('managers.businessModelManager.analyticalDropdownConfirm'),
                    header: this.$t('common.toast.deleteTitle'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => '',
                    reject: () => this.resetDrodpwonValue()
                })
            }
        },
        resetDrodpwonValue() {
            if (this.driver) {
                this.driver.parameter = this.oldDropdownValue
            }
        },
        showForm(event: any) {
            this.originalModalities = []
            this.selectedModes = []
            if (event.value) {
                this.condition = { ...event.value, parFather: this.selectedDriver }
                this.condition.modalities.forEach((modality: any) => {
                    this.originalModalities.push(modality)
                    this.selectedModes.push(modality.useModeId)
                    this.modalities[modality.useModeId] = modality.filterColumn
                })
            } else {
                this.condition = {
                    parFather: this.excludeCurrentDriverFromList()[0],
                    parFatherId: this.excludeCurrentDriverFromList()[0].id,
                    filterOperation: 'equal',
                    logicOperator: 'AND'
                }
            }
            this.conditionFormVisible = true
        },
        async handleSubmit() {
            if (this.condition.id) {
                this.operation = 'update'
            }
            const modalityKeys = Object.keys(this.modalities)
            for (let i = 0; i < this.selectedModes.length; i++) {
                for (let j = 0; j < modalityKeys.length; j++) {
                    if (this.selectedModes[i] === +modalityKeys[j]) {
                        const conditionForPost = {
                            ...this.condition,
                            parFatherId: this.condition.parFatherId,
                            // parFatherUrlName: (this.selectedDriver as any).parameterUrlName,
                            parFatherUrlName: this.getDriverProperty(this.condition.parFatherId, 'parameterUrlName'),
                            parId: (this.selectedDriver as any).id,
                            useModeId: +modalityKeys[j],
                            filterColumn: this.modalities[this.selectedModes[i]]
                        }

                        if (this.operation === 'update') {
                            const index = this.originalModalities.findIndex((modality) => {
                                return modality.conditionId === conditionForPost.id
                            })
                            if (index > -1) {
                                this.originalModalities.splice(index, 1)
                            }
                        }

                        if (!conditionForPost.prog) {
                            conditionForPost.prog = 0
                        }
                        conditionForPost.prog++
                        delete conditionForPost.parFather
                        delete conditionForPost.modalities
                        await this.sendRequest(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/datadependencies`, conditionForPost).then((response: AxiosResponse<any>) => {
                            if (response.data.errors) {
                                this.errorMessage = response.data.errors[0].message
                                this.displayWarning = true
                            } else {
                                this.store.setInfo({
                                    title: this.$t('common.toast.success'),
                                    msg: this.$t('documentExecution.documentDetails.drivers.conditionSavedMsg')
                                })
                            }
                        })
                    }
                }
            }
            this.originalModalities.forEach((modality) => {
                this.deleteCondition({
                    ...this.condition,
                    id: modality.conditionId,
                    parFatherId: this.condition.parFatherId,
                    parFatherUrlName: (this.selectedDriver as any).parameterUrlName,
                    parId: (this.selectedDriver as any).id,
                    useModeId: modality.useModeId,
                    filterColumn: modality.filterColumn
                })
            })
            this.originalModalities = []

            this.loadData()
        },
        sendRequest(url: string, condition: any) {
            if (this.operation === 'insert') {
                return this.$http.post(url, condition, { headers: { 'X-Disable-Errors': 'true' } })
            } else {
                return this.$http.put(url, condition, { headers: { 'X-Disable-Errors': 'true' } })
            }
        },
        async deleteConditions(condition: any) {
            condition.modalities.forEach((mode: any) => {
                this.deleteCondition({ ...condition, id: mode.conditionId, useModeId: mode.useModeId, filterColumn: mode.filterColumn })
            })
        },
        async deleteCondition(condition: any) {
            delete condition.parFather
            delete condition.modalities
            await this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/datadependencies/delete`, condition, { headers: { 'X-Disable-Errors': 'true' } }).then(() => {
                this.store.setInfo({
                    title: this.$t('common.toast.deleteTitle'),
                    msg: this.$t('common.toast.deleteSuccess')
                })
                this.loadData()
            })
        },
        deleteAllConditions() {
            this.oldDropdownValue = this.driver?.parameter
            this.conditions.forEach((condition) => this.deleteCondition(condition))
        },
        loadData() {
            this.loadDataDependencies()
            this.loadModes()
            this.loadLovs()
            this.selectedModes = []
            this.condition = {}
            this.operation = 'insert'
            this.conditionFormVisible = false
        },
        getDriverProperty(driverId: number, property: string) {
            const index = this.availableDrivers.findIndex((driver: any) => driver.id === driverId)
            return index !== -1 ? this.availableDrivers[index][property] : ''
        }
    }
})
</script>
<style lang="scss" scoped></style>
