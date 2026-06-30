<template>
    <div v-if="menuWidgetsConfig" class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3">{{ $t('dashboard.generalSettings.menuWidgets.title') }}</label>

        <form class="p-fluid p-formgrid p-grid p-m-1">
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.showExcelExport" />
                <label class="kn-material-input-label p-ml-3">{{ $t('dashboard.generalSettings.menuWidgets.showExcelExport') }}</label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.xlsxStyleEnabled" />
                <label class="kn-material-input-label p-ml-3">{{ $t('dashboard.generalSettings.menuWidgets.enableXlsxStyle') }}</label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.showScreenshot" />
                <label class="kn-material-input-label p-ml-3">{{ $t('dashboard.generalSettings.menuWidgets.showScreenshot') }}</label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.showSelectionButton" />
                <label class="kn-material-input-label p-ml-3">{{ $t('dashboard.generalSettings.menuWidgets.showSelectionButton') }}</label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.enableChartChange" />
                <label class="kn-material-input-label p-ml-3">{{ $t('dashboard.generalSettings.menuWidgets.enableChartChange') }}</label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.enableCaching" />
                <label class="kn-material-input-label p-ml-3">{{ $t('dashboard.generalSettings.menuWidgets.enableCaching') }}</label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.enableWidgetMenu" />
                <label class="kn-material-input-label p-ml-3">{{ $t('dashboard.generalSettings.menuWidgets.enableWidgetMenu') }}</label>
            </span>
            <div class="p-field p-col-12">
                <div class="p-d-flex p-ai-center">
                    <span class="p-float-label kn-flex">
                        <InputText id="dashboard-export-file-name" v-model="menuWidgetsConfig.exportFileName" class="kn-material-input kn-width-full" type="text" />
                        <label for="dashboard-export-file-name" class="kn-material-input-label">{{ $t('dashboard.generalSettings.menuWidgets.exportFileName') }}</label>
                    </span>
                    <q-icon name="info" size="18px" class="dashboard-export-file-name-info text-primary q-ml-sm">
                        <q-tooltip :delay="500">
                            {{ $t('dashboard.generalSettings.menuWidgets.exportFileNameHint') }}
                        </q-tooltip>
                    </q-icon>
                </div>
                <div v-if="availableParameterPlaceholders.length > 0 || availableVariablePlaceholders.length > 0" class="p-mt-3">
                    <div v-if="availableParameterPlaceholders.length > 0" class="p-mb-2">
                        <span class="kn-material-input-label p-d-block p-mb-2">{{ $t('common.parameters') }}</span>
                        <div class="p-d-flex p-flex-wrap">
                            <q-chip
                                v-for="placeholderOption in availableParameterPlaceholders"
                                :key="placeholderOption.placeholder"
                                clickable
                                outline
                                color="primary"
                                text-color="primary"
                                class="q-mr-sm q-mb-sm"
                                @click="appendExportPlaceholder(placeholderOption.placeholder)"
                            >
                                {{ placeholderOption.placeholder }}
                                <q-tooltip :delay="500">{{ placeholderOption.label }}</q-tooltip>
                            </q-chip>
                        </div>
                    </div>
                    <div v-if="availableVariablePlaceholders.length > 0">
                        <span class="kn-material-input-label p-d-block p-mb-2">{{ $t('common.variables') }}</span>
                        <div class="p-d-flex p-flex-wrap">
                            <q-chip
                                v-for="placeholderOption in availableVariablePlaceholders"
                                :key="placeholderOption.placeholder"
                                clickable
                                outline
                                color="primary"
                                text-color="primary"
                                class="q-mr-sm q-mb-sm"
                                @click="appendExportPlaceholder(placeholderOption.placeholder)"
                            >
                                {{ placeholderOption.placeholder }}
                                <q-tooltip :delay="500">{{ placeholderOption.label }}</q-tooltip>
                            </q-chip>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapState } from 'pinia'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import { IDashboardDriver, IMenuAndWidgets, IVariable } from '../../Dashboard'
import dashboardStore from '../../Dashboard.store'
import { getDashboardParameterPlaceholderOptions, getDashboardVariablePlaceholderOptions } from '../../helpers/DashboardPlaceholderHelper'

export default defineComponent({
    name: 'menu-and-widgets',
    components: { InputSwitch, InputText },
    props: {
        menuWidgetsConfigProp: { type: Object as PropType<IMenuAndWidgets>, required: true },
        dashboardId: { type: String, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    data() {
        return {
            descriptor,
            menuWidgetsConfig: null as IMenuAndWidgets | null
        }
    },
    computed: {
        ...mapState(dashboardStore, ['dashboards']),
        dashboardDrivers(): IDashboardDriver[] {
            return this.dashboards[this.dashboardId]?.drivers ?? []
        },
        availableParameterPlaceholders() {
            return getDashboardParameterPlaceholderOptions(this.dashboardDrivers)
        },
        availableVariablePlaceholders() {
            return getDashboardVariablePlaceholderOptions(this.variables)
        }
    },
    watch: {},
    created() {
        this.loadProps()
    },
    methods: {
        loadProps() {
            this.menuWidgetsConfig = this.menuWidgetsConfigProp
        },
        appendExportPlaceholder(placeholder: string) {
            if (!this.menuWidgetsConfig) return

            const currentValue = this.menuWidgetsConfig.exportFileName ?? ''
            const separator = currentValue && !/\s$/.test(currentValue) ? ' ' : ''
            this.menuWidgetsConfig.exportFileName = `${currentValue}${separator}${placeholder}`
        }
    }
})
</script>

<style lang="scss" scoped>
.dashboard-export-file-name-info {
    cursor: pointer;
}
</style>
