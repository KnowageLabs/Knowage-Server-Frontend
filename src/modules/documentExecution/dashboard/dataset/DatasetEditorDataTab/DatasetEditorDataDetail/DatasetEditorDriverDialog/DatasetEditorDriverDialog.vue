<template>
    <q-dialog :model-value="visible" persistent>
        <q-card class="driver-dialog column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ driver ? driver.label : '' }}</q-toolbar-title>
            </q-toolbar>

            <div v-if="driver" class="col driver-dialog__body">
                <DriverDialogManualInput v-if="driver.typeCode === 'MAN_IN' && (driver.type === 'NUM' || driver.type === 'STRING')" :prop-driver="driver"></DriverDialogManualInput>
                <DriverDialogList v-else-if="driver.selectionType === 'LIST'" :prop-driver="driver"></DriverDialogList>
                <DriverDialogDropdown v-else-if="driver.selectionType === 'COMBOBOX'" :prop-driver="driver"></DriverDialogDropdown>
                <DriverDialogDateInput v-else-if="driver.type === 'DATE'" :prop-driver="driver"></DriverDialogDateInput>
                <DriverDialogPopup v-else-if="driver.selectionType === 'LOOKUP'" :prop-driver="driver" :dashboard-id="dashboardId" :selected-dataset-prop="selectedDatasetProp" :drivers="drivers"></DriverDialogPopup>
                <DriverDialogTree v-else-if="driver.selectionType === 'TREE'" :prop-driver="driver" :dashboard-id="dashboardId" :selected-dataset-prop="selectedDatasetProp" :drivers="drivers"></DriverDialogTree>
                <span v-else class="q-pa-md">
                    {{ driver }}
                </span>
            </div>

            <q-card-actions align="right">
                <q-btn flat color="secondary" :label="$t('common.cancel')" data-test="close-button" @click="closeDialog" />
                <q-btn unelevated color="primary" :label="$t('common.save')" data-test="save-button" @click="updateDriver" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDashboardDatasetDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import deepcopy from 'deepcopy'
import DriverDialogManualInput from './DriverDialogManualInput.vue'
import DriverDialogList from './DriverDialogList.vue'
import DriverDialogDropdown from './DriverDialogDropdown.vue'
import DriverDialogPopup from './DriverDialogPopup.vue'
import DriverDialogDateInput from './DriverDialogDateInput.vue'
import DriverDialogTree from './DriverDialogTree.vue'

export default defineComponent({
    name: 'dataset-editor-driver-dialog',
    components: { DriverDialogManualInput, DriverDialogList, DriverDialogDropdown, DriverDialogPopup, DriverDialogDateInput, DriverDialogTree },
    props: {
        visible: Boolean,
        propDriver: { type: Object as PropType<IDashboardDatasetDriver | null>, required: true },
        dashboardId: { type: String, required: true },
        selectedDatasetProp: { required: true, type: Object },
        drivers: { type: Array as PropType<IDashboardDatasetDriver[]>, required: true }
    },
    emits: ['close', 'updateDriver'],
    data() {
        return {
            driver: null as IDashboardDatasetDriver | null
        }
    },
    watch: {
        propDriver() {
            this.loadDriver()
        }
    },
    created() {
        this.loadDriver()
    },
    methods: {
        loadDriver() {
            this.driver = deepcopy(this.propDriver)
        },
        updateDriver() {
            this.$emit('updateDriver', deepcopy(this.driver))
            this.driver = null
        },
        closeDialog() {
            this.driver = null
            this.$emit('close')
        }
    }
})
</script>

<style lang="scss">
.widget-tags-dialog .p-dialog-content {
    padding: 0;
}
</style>

<style lang="scss" scoped>
.driver-dialog {
    width: 60vw;
    max-width: 900px;
    max-height: 85vh;

    &__body {
        min-height: 0;
        overflow: auto;
    }
}
</style>
