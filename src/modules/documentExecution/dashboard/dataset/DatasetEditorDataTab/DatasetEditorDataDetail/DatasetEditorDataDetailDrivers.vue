<template>
    <q-card flat bordered class="dataset-detail-card">
        <div class="dataset-grid dataset-grid--drivers">
            <div class="dataset-grid__row dataset-grid__row--header kn-editor-card-label">
                <div>{{ $t('common.driver') }}</div>
                <div>{{ $t('common.value') }}</div>
                <div></div>
            </div>
            <div v-for="(driver, index) of selectedDataset.formattedDrivers" :key="index" class="dataset-grid__row" data-test="driver-row">
                <q-input :model-value="driver.label" readonly outlined dense hide-bottom-space class="kn-field-compact">
                    <q-tooltip :delay="500">{{ driver.label }}</q-tooltip>
                </q-input>
                <q-input v-if="driver.type === 'DATE'" :model-value="driver.displayDate" readonly outlined dense hide-bottom-space class="kn-field-compact" />
                <q-input v-else-if="(driver.parameterValue[0] && !driver.multivalue) || (driver.typeCode === 'MAN_IN' && (driver.type === 'NUM' || driver.type === 'STRING'))" :model-value="driver.parameterValue[0]?.value" readonly outlined dense hide-bottom-space class="kn-field-compact" />
                <q-select v-else :model-value="getValueLabels(driver)" readonly multiple use-chips hide-dropdown-icon outlined dense hide-bottom-space class="kn-field-compact dataset-grid__chips">
                    <q-tooltip :delay="500">{{ getValueLabels(driver).join(', ') }}</q-tooltip>
                </q-select>
                <div class="dataset-grid__actions">
                    <q-btn flat round dense size="sm" icon="edit" class="kn-editor-action" data-test="driver-edit-button" @click.stop="openDriverDialog(driver)">
                        <q-tooltip :delay="500">{{ $t('common.edit') }}</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense size="sm" icon="restart_alt" class="kn-editor-action" data-test="driver-reset-button" @click="resetDefaultValue(driver)">
                        <q-tooltip :delay="500">{{ $t('common.reset') }}</q-tooltip>
                    </q-btn>
                </div>
            </div>
        </div>
    </q-card>

    <DatasetEditorDriverDialog :visible="driversDialogVisible" :prop-driver="selectedDriver" :dashboard-id="dashboardId" :selected-dataset-prop="selectedDataset" :drivers="selectedDataset.formattedDrivers" @updateDriver="onUpdateDriver" @close="onDriversDialogClose"></DatasetEditorDriverDialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IDashboardDatasetDriver } from '../../../Dashboard'
import DatasetEditorDriverDialog from './DatasetEditorDriverDialog/DatasetEditorDriverDialog.vue'
import deepcopy from 'deepcopy'
import { luxonFormatDate } from '@/helpers/commons/localeHelper'
import { updateDataDependency } from './DatasetEditorDriverDialog/DatasetEditorDriverDependencyHelper'
import { mapState } from 'pinia'
import mainStore from '@/App.store'
import { getFormattedDatasetDrivers } from './DatasetEditorDriverDialog/DatasetEditorDatasetDriverFormatterHelper'
import moment from 'moment'

export default defineComponent({
    name: 'dataset-editor-data-detail-drivers',
    components: { DatasetEditorDriverDialog },
    props: { selectedDatasetProp: { required: true, type: Object }, documentDriversProp: { type: Object as any }, dashboardId: { type: String, required: true } },
    data() {
        return {
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
    created() {
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
        getValueLabels(driver: IDashboardDatasetDriver): string[] {
            return driver.parameterValue.filter((parameterValue) => parameterValue?.value !== '' && parameterValue?.value !== null && parameterValue?.value !== undefined).map((parameterValue) => String(parameterValue.value))
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

<style lang="scss" scoped>
.dataset-grid--drivers .dataset-grid__row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) 72px;
}
</style>
