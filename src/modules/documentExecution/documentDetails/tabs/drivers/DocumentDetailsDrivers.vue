<template>
    <div class="p-grid p-m-0 kn-flex">
        <div class="p-col-4 p-sm-4 p-md-3 p-p-0 p-d-flex p-flex-column kn-flex">
            <Toolbar class="kn-toolbar kn-toolbar--secondary">
                <template #start>
                    {{ $t('documentExecution.documentDetails.drivers.title') }}
                </template>
                <template #end>
                    <Button :disabled="hasDatasetWithDrivers" :label="$t('common.add')" class="p-button-text p-button-rounded p-button-plain kn-white-color" @click="addNewDriver" />
                </template>
            </Toolbar>
            <div id="drivers-list-container" class="kn-flex kn-relative">
                <div :style="mainDescriptor.style.absoluteScroll">
                    <ProgressBar v-if="loading" class="kn-progress-bar" mode="indeterminate" data-test="progress-bar" />
                    <KnListBox v-if="!loading" class="kn-height-full" :options="document.drivers" :settings="driversDescriptor.knListSettings" @click="selectDriver($event.item)" @delete.stop="deleteDriverConfirm($event)" @moveUp.stop="movePriority($event.item, 'up')" @moveDown.stop="movePriority($event.item, 'down')"> </KnListBox>
                </div>
            </div>
        </div>
        <div class="p-col-8 p-sm-8 p-md-9 p-p-0 p-m-0" :style="mainDescriptor.style.driverDetailsContainer">
            <Toolbar class="kn-toolbar kn-toolbar--secondary">
                <template #start>
                    {{ $t('documentExecution.documentDetails.drivers.detailsTitle') }}
                </template>
            </Toolbar>
            <div v-if="!loading" id="driver-details-container" class="kn-flex kn-relative">
                <div :style="mainDescriptor.style.absoluteScroll">
                    <div class="p-m-2">
                        <div v-if="hasDatasetWithDrivers">
                            <InlineMessage severity="warn" class="kn-width-full">{{ $t('documentExecution.documentDetails.drivers.dashboardUsesQBEDrivers') }}</InlineMessage>
                        </div>
                        <div v-if="Object.keys(selectedDriver).length === 0">
                            <InlineMessage v-if="!hasDatasetWithDrivers" severity="info" class="kn-width-full">{{ $t('documentExecution.documentDetails.drivers.noDriverSelected') }}</InlineMessage>
                        </div>
                        <Card v-else>
                            <template #content>
                                <form class="p-fluid p-formgrid p-grid p-m-1">
                                    <div class="p-field p-col-12">
                                        <span class="p-float-label">
                                            <InputText
                                                id="label"
                                                v-model="v$.selectedDriver.label.$model"
                                                class="kn-material-input"
                                                type="text"
                                                max-length="40"
                                                :class="{
                                                    'p-invalid': v$.selectedDriver.label.$invalid && v$.selectedDriver.label.$dirty
                                                }"
                                                @blur="v$.selectedDriver.label.$touch()"
                                                @change="markSelectedDriverForChange"
                                            />
                                            <label for="label" class="kn-material-input-label"> {{ $t('common.title') }} * </label>
                                        </span>
                                        <KnValidationMessages class="p-mt-1" :v-comp="v$.selectedDriver.label" :additional-translate-params="{ fieldName: $t('common.title') }" />
                                    </div>
                                    <div class="p-field p-col-12">
                                        <span class="p-float-label">
                                            <Dropdown
                                                id="analytical"
                                                v-model="v$.selectedDriver.parameter.$model"
                                                class="kn-material-input"
                                                :options="availableAnalyticalDrivers"
                                                :class="{
                                                    'p-invalid': v$.selectedDriver.parameter.$invalid && v$.selectedDriver.parameter.$dirty
                                                }"
                                                option-label="label"
                                                :filter="true"
                                                :filter-placeholder="$t('documentExecution.documentDetails.drivers.dropdownSearchHint')"
                                                @blur="v$.selectedDriver.parameter.$touch()"
                                                @change="changeDriverValue"
                                            >
                                                <template #value="slotProps">
                                                    <div v-if="slotProps.value" class="p-dropdown-driver-value">
                                                        <span>{{ slotProps.value.label }}</span>
                                                    </div>
                                                    <span v-else>
                                                        {{ $t('common.info.noDataFound') }}
                                                    </span>
                                                </template>
                                                <template #option="slotProps">
                                                    <div class="p-dropdown-driver-option">
                                                        <span>{{ slotProps.option.label }}</span>
                                                    </div>
                                                </template>
                                            </Dropdown>
                                            <label for="analytical" class="kn-material-input-label"> {{ $t('managers.businessModelManager.analyticalDriver') }} </label>
                                        </span>
                                        <KnValidationMessages class="p-mt-1" :v-comp="v$.selectedDriver.parameter" :additional-translate-params="{ fieldName: $t('managers.businessModelManager.analyticalDriver') }" />
                                    </div>
                                    <div class="p-field p-col-12">
                                        <span class="p-float-label">
                                            <InputText
                                                id="parameterUrlName"
                                                v-model="v$.selectedDriver.parameterUrlName.$model"
                                                class="kn-material-input"
                                                type="text"
                                                max-length="20"
                                                :class="{
                                                    'p-invalid': v$.selectedDriver.parameterUrlName.$invalid && v$.selectedDriver.parameterUrlName.$dirty
                                                }"
                                                @blur="v$.selectedDriver.parameterUrlName.$touch()"
                                                @change="markSelectedDriverForChange"
                                            />
                                            <label for="parameterUrlName" class="kn-material-input-label"> {{ $t('documentExecution.documentDetails.drivers.parameterUrlName') }} * </label>
                                        </span>
                                        <KnValidationMessages class="p-mt-1" :v-comp="v$.selectedDriver.parameterUrlName" :additional-translate-params="{ fieldName: $t('documentExecution.documentDetails.drivers.parameterUrlName') }" :specific-translate-keys="{ custom_unique: 'managers.businessModelManager.driversUrlNotUnique' }" />
                                    </div>
                                    <span class="p-field p-col-12 p-md-4 p-jc-center p-mt-3">
                                        <InputSwitch id="visible" v-model="selectedDriver.visible" @change="markSelectedDriverForChange" />
                                        <i class="far fa-eye p-ml-2" />
                                        <label for="visible" class="kn-material-input-label p-ml-2"> {{ $t('common.visible') }} </label>
                                    </span>
                                    <span class="p-field p-col-12 p-md-4 p-jc-center p-mt-3">
                                        <InputSwitch id="required" v-model="selectedDriver.required" @change="markSelectedDriverForChange" />
                                        <i class="fas fa-asterisk p-ml-2" />
                                        <label for="required" class="kn-material-input-label p-ml-2"> {{ $t('common.required') }} </label>
                                    </span>
                                    <span class="p-field p-col-12 p-md-4 p-jc-center p-mt-3">
                                        <InputSwitch id="multivalue" v-model="selectedDriver.multivalue" @change="markSelectedDriverForChange" />
                                        <i class="fas fa-list p-ml-2" />
                                        <label for="multivalue" class="kn-material-input-label p-ml-2"> {{ $t('managers.businessModelManager.multivalue') }} </label>
                                    </span>
                                </form>
                            </template>
                        </Card>
                        <div v-if="document.drivers.length > 1 && selectedDriver.id" class="p-grid p-mt-1">
                            <DataConditions :available-drivers="document.drivers" :selected-document="selectedDocument" :selected-driver="selectedDriver" />
                            <VisibilityConditions v-if="selectedDocument.engine" :available-drivers="document.drivers" :selected-document="selectedDocument" :selected-driver="selectedDriver" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { iDriver, iAnalyticalDriver, iDocument, iTemplate } from '@/modules/documentExecution/documentDetails/DocumentDetails'
import { createValidations, ICustomValidatorMap } from '@/helpers/commons/validationHelper'
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import mainDescriptor from '@/modules/documentExecution/documentDetails/DocumentDetailsDescriptor.json'
import driversDescriptor from './DocumentDetailsDriversDescriptor.json'
import DataConditions from './DocumentDetailsDataConditions.vue'
import VisibilityConditions from './DocumentDetailsVisibilityConditions.vue'
import useValidate from '@vuelidate/core'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import InlineMessage from 'primevue/inlinemessage'
import mainStore from '../../../../../App.store'

export default defineComponent({
    name: 'document-drivers',
    components: { DataConditions, VisibilityConditions, KnListBox, KnValidationMessages, InputSwitch, Dropdown, InlineMessage },
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
            mainDescriptor,
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
            hasDatasetWithDrivers: false as boolean
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
        },
        setParId(id) {
            this.selectedDriver.parID = id
        },
        markSelectedDriverForChange() {
            this.selectedDriver.isChanged = true
            this.selectedDriver.numberOfErrors = this.v$.$errors.length
        },
        changeDriverValue(event) {
            this.selectedDriver.isChanged = true
            this.selectedDriver.numberOfErrors = this.v$.$errors.length
            this.setParId(event.value.id)
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
