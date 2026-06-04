<template>
    <div class="dd-tab-layout">
        <!-- LEFT: list -->
        <div class="dd-tab-list-col">
            <div class="dd-list-header row items-center q-px-sm q-py-xs">
                <q-input v-model="searchText" :placeholder="$t('common.search')" dense borderless clearable class="col q-pr-xs" @update:model-value="() => {}">
                    <template #prepend><q-icon name="search" size="16px" /></template>
                </q-input>
                <q-separator vertical />
                <q-btn class="q-ml-sm" unelevated dense icon="add" color="accent" :disable="hasDatasetWithDrivers" @click="addNewDriver">
                    <q-tooltip>{{ $t('common.add') }}</q-tooltip>
                </q-btn>
            </div>
            <q-separator />
            <q-scroll-area class="dd-scroll">
                <q-linear-progress v-if="loading" indeterminate color="primary" />
                <q-list separator class="dd-list">
                    <q-item v-for="driver in filteredDrivers" :key="driver.id ?? driver.priority" clickable :active="selectedDriver === driver" active-class="kn-list-item--selected dd-list-item" @click="selectDriver(driver)">
                        <q-item-section>
                            <q-item-label>{{ driver.label || '—' }}</q-item-label>
                            <q-item-label caption>{{ driver.parameterUrlName }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <div class="row no-wrap">
                                <q-btn flat round dense icon="arrow_upward" size="sm" @click.stop="movePriority(driver, 'up')">
                                    <q-tooltip>{{ $t('common.moveUp') }}</q-tooltip>
                                </q-btn>
                                <q-btn flat round dense icon="arrow_downward" size="sm" @click.stop="movePriority(driver, 'down')">
                                    <q-tooltip>{{ $t('common.moveDown') }}</q-tooltip>
                                </q-btn>
                                <q-btn flat round dense icon="delete" size="sm" @click.stop="deleteDriverConfirm({ item: driver })">
                                    <q-tooltip>{{ $t('common.delete') }}</q-tooltip>
                                </q-btn>
                            </div>
                        </q-item-section>
                    </q-item>
                    <q-item v-if="filteredDrivers.length === 0 && !loading">
                        <q-item-section class="text-grey-6 q-pa-sm">{{ $t('common.info.noDataFound') }}</q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
        </div>

        <q-separator vertical />

        <!-- RIGHT: detail -->
        <q-scroll-area class="dd-scroll dd-tab-detail-scroll">
            <div class="dd-drivers-detail">
                <q-banner v-if="hasDatasetWithDrivers" class="q-mb-sm bg-warning text-white" rounded dense>
                    {{ $t('documentExecution.documentDetails.drivers.dashboardUsesQBEDrivers') }}
                </q-banner>

                <KnHint v-if="!loading && Object.keys(selectedDriver).length === 0 && !hasDatasetWithDrivers" class="kn-hint-sm" :title="'documentExecution.documentDetails.drivers.noDriverSelected'" :hint="$t('documentExecution.documentDetails.drivers.noDriverSelectedHint')" data-test="hint"></KnHint>

                <q-card v-if="Object.keys(selectedDriver).length > 0">
                    <q-card-section class="q-py-sm">
                        <div class="dd-section-label">{{ $t('documentExecution.documentDetails.drivers.detailsTitle') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <div class="row q-col-gutter-sm">
                            <div class="col-4">
                                <q-input outlined dense v-model="v$.selectedDriver.label.$model" :label="$t('common.title') + ' *'" maxlength="40" :error="v$.selectedDriver.label.$invalid && v$.selectedDriver.label.$dirty" :error-message="getValidationErrorMessage(v$.selectedDriver.label, $t('common.title'))" @blur="v$.selectedDriver.label.$touch()" @update:model-value="markSelectedDriverForChange" />
                            </div>
                            <div class="col-4">
                                <q-select
                                    outlined
                                    dense
                                    v-model="v$.selectedDriver.parameter.$model"
                                    :options="filteredAnalyticalDrivers"
                                    option-label="label"
                                    use-input
                                    :input-debounce="0"
                                    :label="$t('managers.businessModelManager.analyticalDriver')"
                                    :error="v$.selectedDriver.parameter.$invalid && v$.selectedDriver.parameter.$dirty"
                                    :error-message="getValidationErrorMessage(v$.selectedDriver.parameter, $t('managers.businessModelManager.analyticalDriver'))"
                                    @blur="v$.selectedDriver.parameter.$touch()"
                                    @update:model-value="onAnalyticalDriverChange"
                                    @filter="filterAnalyticalDrivers"
                                >
                                    <template #no-option>
                                        <q-item>
                                            <q-item-section class="text-grey">{{ $t('common.info.noDataFound') }}</q-item-section>
                                        </q-item>
                                    </template>
                                </q-select>
                            </div>
                            <div class="col-4">
                                <q-input
                                    outlined
                                    dense
                                    v-model="v$.selectedDriver.parameterUrlName.$model"
                                    :label="$t('documentExecution.documentDetails.drivers.parameterUrlName') + ' *'"
                                    maxlength="20"
                                    :error="v$.selectedDriver.parameterUrlName.$invalid && v$.selectedDriver.parameterUrlName.$dirty"
                                    :error-message="getValidationErrorMessage(v$.selectedDriver.parameterUrlName, $t('documentExecution.documentDetails.drivers.parameterUrlName'))"
                                    @blur="v$.selectedDriver.parameterUrlName.$touch()"
                                    @update:model-value="markSelectedDriverForChange"
                                />
                            </div>
                            <div class="row q-gutter-md">
                                <div class="col-auto">
                                    <q-toggle v-model="selectedDriver.visible" dense icon="visibility" :label="$t('common.visible')" @update:model-value="markSelectedDriverForChange" />
                                </div>
                                <div class="col-auto">
                                    <q-toggle v-model="selectedDriver.required" dense icon="star" :label="$t('common.required')" @update:model-value="markSelectedDriverForChange" />
                                </div>
                                <div class="col-auto">
                                    <q-toggle v-model="selectedDriver.multivalue" dense icon="list" :label="$t('managers.businessModelManager.multivalue')" @update:model-value="markSelectedDriverForChange" />
                                </div>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>

                <div v-if="document.drivers && document.drivers.length > 1 && selectedDriver.id" class="q-mt-md dd-conditions-grid">
                    <DataConditions :available-drivers="document.drivers" :selected-document="selectedDocument" :selected-driver="selectedDriver" />
                    <VisibilityConditions v-if="selectedDocument.engine" :available-drivers="document.drivers" :selected-document="selectedDocument" :selected-driver="selectedDriver" />
                </div>
            </div>
        </q-scroll-area>
    </div>
</template>

<script lang="ts">
import { iDriver, iAnalyticalDriver, iDocument, iTemplate } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import driversDescriptor from './DocumentDetailsDriversDescriptor.json'
import DataConditions from './DocumentDetailsDataConditions.vue'
import VisibilityConditions from './DocumentDetailsVisibilityConditions.vue'
import useValidate from '@vuelidate/core'
import mainStore from '../../../../../App.store'
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    name: 'document-drivers',
    components: { DataConditions, VisibilityConditions, KnHint },
    props: {
        selectedDocument: { type: Object as PropType<iDocument>, required: true },
        availableDrivers: { type: Array as PropType<iDriver[]>, required: true },
        availableAnalyticalDrivers: { type: Array as PropType<iAnalyticalDriver[]>, required: true },
        refresh: { type: Boolean, required: false }
    },
    emits: ['driversChanged'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            driversDescriptor,
            v$: useValidate() as any,
            drivers: [] as iDriver[],
            driversToChange: [] as iDriver[],
            driversToDelete: [] as iDriver[],
            selectedDriver: {} as iDriver,
            driverParuses: [] as any,
            lovIdAndColumns: [] as any,
            visusalDependencyObjects: [] as any,
            dataDependencyObjects: [] as any,
            transformedObj: {} as any,
            document: {} as any,
            loading: false,
            listOfTemplates: [] as iTemplate[],
            hasDatasetWithDrivers: false as boolean,
            searchText: '' as string,
            filteredAnalyticalDrivers: [] as iAnalyticalDriver[]
        }
    },
    computed: {
        filteredDrivers(): iDriver[] {
            if (!this.searchText) return this.document.drivers || []
            const needle = this.searchText.toLowerCase()
            return (this.document.drivers || []).filter((d: iDriver) => d.label?.toLowerCase().includes(needle) || d.parameterUrlName?.toLowerCase().includes(needle))
        }
    },
    watch: {
        selectedDocument() {
            this.update()
        },
        refresh(newValue) {
            if (newValue && newValue == true) {
                this.update()
            }
        }
    },
    created() {
        this.getDocumentDrivers()
        this.document = this.selectedDocument
        this.filteredAnalyticalDrivers = [...this.availableAnalyticalDrivers]
        this.loadTemplatesAndSelectActive()
    },
    validations() {
        const customValidators: ICustomValidatorMap = {
            'custom-unique': (value: string) => {
                return this.urlNotUnique(value)
            },
            'drivers-validator': (value: string) => {
                return Object.keys(this.selectedDriver).length === 0 || value
            }
        }
        const validationObject = { selectedDriver: createValidations('driver', driversDescriptor.validations.driver, customValidators) }
        return validationObject
    },
    methods: {
        urlNotUnique(url: string) {
            const index = this.document.drivers.findIndex((driver) => driver.parameterUrlName === url && driver.id != this.selectedDriver?.id)
            return index === -1
        },
        async getDocumentDrivers() {
            this.loading = true
            if (this.selectedDocument?.id) {
                this.$http
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument?.id}/drivers`)
                    .then((response: AxiosResponse<any>) => (this.document.drivers = response.data))
                    .finally(() => (this.loading = false))
            }
        },
        selectDriver(driver) {
            this.selectedDriver = driver
            this.setParameterInfo(this.selectedDriver)
            this.filteredAnalyticalDrivers = [...this.availableAnalyticalDrivers]
        },
        setParId(id) {
            this.selectedDriver.parID = id
        },
        markSelectedDriverForChange() {
            this.selectedDriver.isChanged = true
            this.selectedDriver.numberOfErrors = this.v$.$errors.length
        },
        onAnalyticalDriverChange(value: iAnalyticalDriver) {
            this.selectedDriver.isChanged = true
            this.selectedDriver.numberOfErrors = this.v$.$errors.length
            if (value) this.setParId(value.id)
        },
        filterAnalyticalDrivers(val: string, update: Function) {
            update(() => {
                const needle = val.toLowerCase()
                this.filteredAnalyticalDrivers = this.availableAnalyticalDrivers.filter((o) => o.label.toLowerCase().includes(needle))
            })
        },
        getValidationErrorMessage(field: any, fieldName: string): string {
            if (!field.$invalid || !field.$dirty || !field.$errors.length) return ''
            const error = field.$errors[0]
            return this.$t(`common.validation.${error.$validator}`, { ...error.$params, fieldName })
        },
        setParameterInfo(driver) {
            if (this.availableAnalyticalDrivers) {
                for (let i = 0; i < this.availableAnalyticalDrivers.length; i++) {
                    if ((driver.parameter && this.availableAnalyticalDrivers[i].id == driver.parID) || (driver.parameter && this.availableAnalyticalDrivers[i].name == driver.parameter.name)) {
                        driver.parameter = { ...this.availableAnalyticalDrivers[i] }
                        driver.parID = this.availableAnalyticalDrivers[i].id
                    }
                }
            }
        },

        addNewDriver() {
            this.transformedObj = {}
            const newDriver = {
                label: '',
                parameter: this.availableAnalyticalDrivers[0] ? this.availableAnalyticalDrivers[0] : null,
                parameterUrlName: '',
                priority: this.document.drivers.length == 0 ? 1 : this.document.drivers.length + 1,
                biObjectID: this.selectedDocument.id,
                visible: true,
                required: true,
                multivalue: false,
                numberOfErrors: 1
            } as iDriver
            if (this.selectedDocument.id) {
                if (this.document.drivers) {
                    this.document.drivers.push(newDriver)
                    this.selectDriver(this.document.drivers[this.document.drivers.length - 1])
                } else {
                    this.document.drivers = [newDriver]
                    this.selectDriver(this.document.drivers[1])
                }
            }
        },
        async movePriority(driver, direction) {
            direction == 'up' ? (driver.priority -= 1) : (driver.priority += 1)
            await this.$http
                .put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/drivers/${driver.id}`, driver, { headers: { 'X-Disable-Errors': 'true' } })
                .then(() => {
                    this.store.setInfo({ title: 'Succes', msg: 'Driver priority changed' })
                    this.getDocumentDrivers()
                })
                .catch(() => this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: this.$t('documentExecution.documentDetails.drivers.priorityError') }))
        },
        deleteDriverConfirm(event) {
            this.$confirm.require({
                header: this.$t('common.toast.deleteConfirmTitle'),
                message: this.$t('documentExecution.documentDetails.drivers.deleteMessage'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteDriver(event.item)
            })
        },
        async deleteDriver(driverToDelete) {
            if (driverToDelete.id) {
                await this.$http
                    .delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.document.id}/drivers/${driverToDelete.id}`, { headers: { 'X-Disable-Errors': 'true' } })
                    .then(() => {
                        const deletedDriver = this.document.drivers.findIndex((param) => param.id === driverToDelete.id)
                        this.document.drivers.splice(deletedDriver, 1)
                        this.store.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                        this.selectedDriver = {} as iDriver
                    })
                    .catch((error) => {
                        this.store.setError({ title: this.$t('common.toast.errorTitle'), msg: error.message })
                    })
            } else {
                const deletedDriver = this.document.drivers.findIndex((param) => param.priority === driverToDelete.priority)
                this.document.drivers.splice(deletedDriver, 1)
                this.selectedDriver = {} as iDriver
            }
        },
        update() {
            this.getDocumentDrivers()
            this.document = this.selectedDocument
            this.selectedDriver = {} as iDriver
        },
        async loadTemplatesAndSelectActive() {
            this.loading = true

            this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/templates`)
                .then((response: AxiosResponse<any>) => {
                    this.listOfTemplates = response.data as iTemplate[]

                    const activeTemplate = this.listOfTemplates.find((template) => template.active)
                    if (activeTemplate) {
                        this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/documentdetails/${this.selectedDocument.id}/templates/selected/${activeTemplate.id}`, { headers: { 'X-Disable-Errors': 'true' } }).then((response: AxiosResponse<any>) => {
                            this.hasDatasetWithDrivers = response.data.configuration?.datasets?.some((dataset) => Array.isArray(dataset.drivers) && dataset.drivers.length > 0) || false
                        })
                    }
                })
                .finally(() => (this.loading = false))
        }
    }
})
</script>

<style lang="scss" scoped>
.dd-drivers-detail {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    padding: 16px;

    @media (max-width: 860px) {
        grid-template-columns: 1fr;
    }
}

.dd-conditions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: 0 16px;

    @media (max-width: 860px) {
        grid-template-columns: 1fr;
    }
}
</style>
