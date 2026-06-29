<template>
    <div v-if="menuWidgetsConfig" class="q-px-md q-pb-md column">
        <div class="col-12 q-mb-md">
            <q-input v-model="menuWidgetsConfig.exportFileName" outlined dense clearable :label="$t('dashboard.generalSettings.menuWidgets.exportFileName')" hide-bottom-space />
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
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import { IMenuAndWidgets } from '../../Dashboard'

export default defineComponent({
    name: 'menu-and-widgets',
    components: {},
    props: { menuWidgetsConfigProp: { type: Object as PropType<IMenuAndWidgets>, required: true } },
    data() {
        return {
            descriptor,
            menuWidgetsConfig: null as IMenuAndWidgets | null
        }
    },
    watch: {},
    created() {
        this.loadProps()
    },
    methods: {
        loadProps() {
            this.menuWidgetsConfig = this.menuWidgetsConfigProp
        }
    }
})
</script>
