<!-- eslint-disable vue/valid-v-model -->
<template>
    <Accordion class="p-mb-3 p-mr-3">
        <AccordionTab :header="$t('common.parameters')">
            <!-- PARAMETERS ---------------- -->
            <div v-for="(parameter, index) of selectedDataset.parameters" :key="index" class="p-fluid p-formgrid p-grid p-mx-2 p-mt-2">
                <div class="p-field p-col-4">
                    <span class="p-float-label">
                        <InputText id="label" v-model="parameter.name" class="kn-material-input" type="text" :disabled="true" />
                        <label for="label" class="kn-material-input-label"> {{ $t('common.parameter') }} </label>
                    </span>
                </div>
                <div class="p-field p-col-4">
                    <span class="p-float-label">
                        <Dropdown id="type" v-model="parameter.modelType" class="kn-material-input" :options="parameterTypes" />
                        <label for="type" class="kn-material-input-label"> {{ $t('common.type') }}</label>
                    </span>
                </div>
                <div class="p-field p-d-flex p-col-4">
                    <span v-if="!parameter.multiValue" class="p-float-label kn-flex">
                        <InputText id="label" v-model="parameter.value" class="kn-material-input" type="text" />
                        <label for="label" class="kn-material-input-label"> {{ $t('common.value') }} </label>
                    </span>
                    <div v-else class="p-d-flex p-flex-column chipsContainer">
                        <Chips v-model="parameter.value" class="kn-border-none" />
                        <small id="chips-help">{{ $t('common.chipsHint') }}</small>
                    </div>
                    <Button v-if="parameter.modelType === 'dynamic' && documentDriversProp && documentDriversProp.filterStatus.length > 0" icon="fa-solid fa-link" class="p-button-text p-button-rounded p-button-plain p-as-end" @click.stop="showMenu($event, parameter.name)" />
                </div>
            </div>

            <!-- DRIVERS ---------------- -->
            <div v-for="(driver, index) of selectedDataset.formattedDrivers" :key="index" class="p-fluid p-formgrid p-grid p-mx-2">
                <div class="p-field p-col-4">
                    <span class="p-float-label">
                        <InputText id="label" v-model="driver.label" class="kn-material-input" :disabled="true" />
                        <label for="label" class="kn-material-input-label"> {{ $t('common.driver') }} </label>
                    </span>
                </div>
                <div class="p-field p-col-8 p-d-flex">
                    <span class="p-float-label kn-flex">
                        <InputText v-if="driver.type === 'DATE'" v-model="driver.displayDate" class="kn-material-input" :disabled="true" />
                        <InputText v-else-if="(driver.parameterValue[0] && !driver.multivalue) || (driver.typeCode === 'MAN_IN' && (driver.type === 'NUM' || driver.type === 'STRING'))" v-model="driver.parameterValue[0].value as string" class="kn-material-input" :disabled="true" />
                        <Chips v-else v-model="driver.parameterValue" :disabled="true">
                            <template #chip="slotProps">
                                <div>
                                    <span>{{ slotProps.value?.value }}</span>
                                </div>
                            </template>
                        </Chips>
                        <label class="kn-material-input-label"> {{ $t('common.value') }} </label>
                    </span>
                    <div class="p-js-end">
                        <Button icon="pi pi-pencil" class="p-button-text p-button-rounded p-button-plain" @click.stop="openDriverDialog(driver)" />
                        <Button icon="fa fa-eraser" class="p-button-text p-button-rounded p-button-plain" @click="resetDefaultValue(driver)" />
                    </div>
                </div>
            </div>
        </AccordionTab>
    </Accordion>

    <Menu id="parameterPickerMenu" ref="parameterPickerMenu" :model="menuButtons" data-test="menu" />
    <DatasetEditorDriverDialog :visible="driversDialogVisible" :prop-driver="selectedDriver" :dashboard-id="dashboardId" :selected-dataset-prop="selectedDataset" :drivers="selectedDataset.formattedDrivers" @updateDriver="onUpdateDriver" @close="onDriversDialogClose"></DatasetEditorDriverDialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IDashboardDatasetDriver } from '../../../Dashboard'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Dropdown from 'primevue/dropdown'
import Menu from 'primevue/contextmenu'
import Chips from 'primevue/chips'
import DatasetEditorDriverDialog from './DatasetEditorDriverDialog/DatasetEditorDriverDialog.vue'
import deepcopy from 'deepcopy'
import { luxonFormatDate } from '@/helpers/commons/localeHelper'
import { updateDataDependency } from './DatasetEditorDriverDialog/DatasetEditorDriverDependencyHelper'
import { mapState } from 'pinia'
import mainStore from '@/App.store'
import { getFormattedDatasetDrivers } from './DatasetEditorDriverDialog/DatasetEditorDatasetDriverFormatterHelper'
import moment from 'moment'
import descriptor from './DatasetEditorDataDetailDescriptor.json'

export default defineComponent({
    name: 'dataset-editor-data-detail-info',
    components: { Accordion, AccordionTab, Dropdown, Menu, Chips, DatasetEditorDriverDialog },
    props: { selectedDatasetProp: { required: true, type: Object }, dashboardDatasetsProp: { required: true, type: Array as any }, documentDriversProp: { type: Array as any }, dashboardId: { type: String, required: true } },
    emits: [],
    data() {
        return {
            descriptor,
            parameterTypes: ['static', 'dynamic'],
            menuButtons: [] as any,
            drivers: [] as IDashboardDatasetDriver[],
            driversDialogVisible: false,
            selectedDriver: null as IDashboardDatasetDriver | null,
            selectedDataset: {} as any
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        })
    },
    watch: {
        selectedDatasetProp() {
            this.selectedDataset = this.selectedDatasetProp
            this.loadDrivers()
        }
    },
    async created() {
        this.selectedDataset = this.selectedDatasetProp
        this.loadDrivers()
    },
    methods: {
        loadDrivers() {
            if (!this.selectedDataset.formattedDrivers) {
                this.selectedDataset.formattedDrivers = this.selectedDataset && this.selectedDataset.drivers ? (getFormattedDatasetDrivers(this.selectedDataset) as IDashboardDatasetDriver[]) : []
            }
            this.selectedDataset.formattedDrivers.forEach((driver: IDashboardDatasetDriver) => {
                if (driver.type === 'DATE') this.setDateDisplayValue(driver)
            })
        },
        showMenu(event, parameter) {
            this.createMenuItems(parameter)
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.parameterPickerMenu.toggle(event)
        },
        createMenuItems(paramName) {
            this.menuButtons = this.documentDriversProp.filterStatus.map((driver) => {
                return { label: driver.label, urlName: driver.urlName, command: () => this.addDriverValueToParameter(driver.urlName, paramName) }
            })
        },
        addDriverValueToParameter(driverUrl, paramName) {
            this.selectedDataset.parameters.find((parameter) => parameter.name === paramName).value = '$P{' + driverUrl + '}'
        },
        openDriverDialog(driver: IDashboardDatasetDriver) {
            this.selectedDriver = driver
            this.driversDialogVisible = true
        },
        resetDefaultValue(driver: IDashboardDatasetDriver) {
            if (!driver.defaultValue || driver.defaultValue.length == 0) driver.parameterValue = [{ value: '', description: '' }]
            else driver.parameterValue = deepcopy(driver.defaultValue) as { value: string; description: string }[]

            if (driver.type === 'DATE' && driver.parameterValue && driver.parameterValue[0] && driver.parameterValue[0].value) {
                driver.parameterValue[0].value = moment(driver.parameterValue[0].value).toDate()
                this.setDateDisplayValue(driver)
            }
        },
        setDateDisplayValue(driver: IDashboardDatasetDriver) {
            if (!driver.parameterValue[0] || !driver.parameterValue[0].value) return ''
            const tempDate = new Date(driver.parameterValue[0].value)
            driver.displayDate = luxonFormatDate(tempDate, undefined, undefined)
        },
        onDriversDialogClose() {
            this.driversDialogVisible = false
            this.selectedDriver = null
        },
        async onUpdateDriver(driver: IDashboardDatasetDriver) {
            this.driversDialogVisible = false
            if (driver.type === 'DATE') this.setDateDisplayValue(driver)
            await updateDataDependency(this.selectedDataset.formattedDrivers, driver, this.documentDriversProp, this.user, this.$http)
            const index = this.selectedDataset.formattedDrivers.findIndex((tempDriver: IDashboardDatasetDriver) => tempDriver.urlName === driver.urlName)
            if (index !== -1) this.selectedDataset.formattedDrivers[index] = driver
        }
    }
})
</script>
