<template>
    <div v-if="menuWidgetsConfig" class="q-px-md q-pb-md column">
        <div class="col-12 q-mb-md">
            <q-input v-model="menuWidgetsConfig.exportFileName" outlined dense clearable :label="$t('dashboard.generalSettings.menuWidgets.exportFileName')" hide-bottom-space>
                <template #append>
                    <q-icon name="info" size="18px" class="dashboard-export-file-name-info text-primary">
                        <q-tooltip :delay="500">
                            {{ $t('dashboard.generalSettings.menuWidgets.exportFileNameHint') }}
                        </q-tooltip>
                    </q-icon>
                </template>
            </q-input>
            <div v-if="availableParameterPlaceholders.length > 0 || availableVariablePlaceholders.length > 0" class="q-mt-sm">
                <div v-if="availableParameterPlaceholders.length > 0" class="q-mb-sm">
                    <div class="text-caption text-weight-medium q-mb-xs">{{ $t('common.parameters') }}</div>
                    <div class="row q-col-gutter-sm">
                        <div v-for="placeholderOption in availableParameterPlaceholders" :key="placeholderOption.placeholder">
                            <q-chip clickable outline color="primary" text-color="primary" @click="appendExportPlaceholder(placeholderOption.placeholder)">
                                {{ placeholderOption.placeholder }}
                                <q-tooltip :delay="500">{{ placeholderOption.label }}</q-tooltip>
                            </q-chip>
                        </div>
                    </div>
                </div>
                <div v-if="availableVariablePlaceholders.length > 0">
                    <div class="text-caption text-weight-medium q-mb-xs">{{ $t('common.variables') }}</div>
                    <div class="row q-col-gutter-sm">
                        <div v-for="placeholderOption in availableVariablePlaceholders" :key="placeholderOption.placeholder">
                            <q-chip clickable outline color="primary" text-color="primary" @click="appendExportPlaceholder(placeholderOption.placeholder)">
                                {{ placeholderOption.placeholder }}
                                <q-tooltip :delay="500">{{ placeholderOption.label }}</q-tooltip>
                            </q-chip>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="column q-gutter-sm">
            <q-toggle v-model="menuWidgetsConfig.showExcelExport" :label="$t('dashboard.generalSettings.menuWidgets.showExcelExport')" dense />
            <q-toggle v-model="menuWidgetsConfig.xlsxStyleEnabled" :label="$t('dashboard.generalSettings.menuWidgets.enableXlsxStyle')" dense />
            <q-toggle v-model="menuWidgetsConfig.showScreenshot" :label="$t('dashboard.generalSettings.menuWidgets.showScreenshot')" dense />
            <q-toggle v-model="menuWidgetsConfig.showSelectionButton" :label="$t('dashboard.generalSettings.menuWidgets.showSelectionButton')" dense />
            <q-toggle v-model="menuWidgetsConfig.enableChartChange" :label="$t('dashboard.generalSettings.menuWidgets.enableChartChange')" dense />
            <q-toggle v-model="menuWidgetsConfig.enableCaching" :label="$t('dashboard.generalSettings.menuWidgets.enableCaching')" dense />
            <q-toggle v-model="menuWidgetsConfig.enableWidgetMenu" :label="$t('dashboard.generalSettings.menuWidgets.enableWidgetMenu')" dense />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapState } from 'pinia'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import { IDashboardDriver, IMenuAndWidgets, IVariable } from '../../Dashboard'
import dashboardStore from '../../Dashboard.store'
import { getDashboardParameterPlaceholderOptions, getDashboardVariablePlaceholderOptions } from '../../helpers/DashboardPlaceholderHelper'

export default defineComponent({
    name: 'menu-and-widgets',
    components: {},
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
