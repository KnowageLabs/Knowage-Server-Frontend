<template>
    <div v-if="searchSettings" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-12">
                <q-select v-model="searchSettings.columns" :options="widgetModel.columns" option-label="columnName" option-value="columnName" :label="$t('common.columns')" multiple use-chips outlined dense :disable="searchSettingsDisabled" @update:model-value="searchSettingsChanged" />
            </div>
        </div>
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-auto">
                <q-toggle v-model="searchSettings.default" :label="$t('dashboard.widgetEditor.discoveryWidget.search.defaultTextSearch')" dense :disable="searchSettingsDisabled" @update:model-value="searchSettingsChanged" />
            </div>
        </div>
        <div class="row q-col-gutter-sm">
            <div class="col-3">
                <q-select v-model="searchSettings.defaultType" :options="descriptor.searchSettingsTypes" :label="$t('dashboard.widgetEditor.conditions.compareValueType')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="defaultSearchDisabled" @update:model-value="onDefaultTypeChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.searchSettingsTypes, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section>
                                <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </template>
                </q-select>
            </div>
            <div v-if="searchSettings.defaultType === 'static'" class="col-9">
                <q-input v-model="searchSettings.defaultValue" :label="$t('common.value')" outlined dense :disable="defaultSearchDisabled" @change="searchSettingsChanged" />
            </div>
            <div v-else-if="searchSettings.defaultType === 'driver'" class="col-9">
                <q-select v-model="searchSettings.driverLabel" :options="drivers" :label="$t('common.driver')" option-label="name" option-value="driverLabel" emit-value map-options outlined dense :disable="defaultSearchDisabled" @update:model-value="onDriverChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDashboardDriver } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDiscoveryWidgetSearchSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardDiscoveryWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { mapActions } from 'pinia'
import descriptor from '../DiscoveryWidgetSettingsDescriptor.json'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
export default defineComponent({
    name: 'discovery-widget-search-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, dashboardId: { type: String, required: true } },
    data() {
        return {
            descriptor,
            searchSettings: null as IDiscoveryWidgetSearchSettings | null,
            driverValuesMap: {},
            drivers: [] as IDashboardDriver[],
            getTranslatedLabel
        }
    },
    computed: {
        searchSettingsDisabled(): boolean {
            return !this.searchSettings || !this.searchSettings.enabled
        },
        defaultSearchDisabled() {
            return this.searchSettingsDisabled || !this.searchSettings?.default
        }
    },
    created() {
        this.setEventListeners()
        this.loadDrivers()
        this.loadDriverValuesMap()
        this.loadSearchSettings()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(dashboardStore, ['getDashboardDrivers']),
        setEventListeners() {
            emitter.on('columnAdded', this.onColumnAdded)
            emitter.on('columnRemoved', this.onColumnRemoved)
        },
        removeEventListeners() {
            emitter.off('columnAdded', this.onColumnAdded)
            emitter.off('columnRemoved', this.onColumnRemoved)
        },
        loadDrivers() {
            this.drivers = this.getDashboardDrivers(this.dashboardId)
        },
        loadDriverValuesMap() {
            if (!this.drivers) return
            this.drivers.forEach((driver: IDashboardDriver) => (this.driverValuesMap[driver.driverLabel] = driver.value))
        },
        loadSearchSettings() {
            if (this.widgetModel.settings?.search) this.searchSettings = this.widgetModel.settings.search
        },
        searchSettingsChanged() {
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onDefaultTypeChanged() {
            if (!this.searchSettings) return
            if (this.searchSettings.defaultType === 'static') delete this.searchSettings.driverLabel
            this.searchSettings.defaultValue = ''
            this.searchSettingsChanged()
        },
        onDriverChanged() {
            if (!this.searchSettings || !this.searchSettings.driverLabel) return
            this.searchSettings.defaultValue = this.driverValuesMap[this.searchSettings.driverLabel]
            this.searchSettingsChanged()
        },
        onColumnAdded() {
            this.loadSearchSettings()
        },
        onColumnRemoved() {
            this.loadSearchSettings()
        }
    }
})
</script>
