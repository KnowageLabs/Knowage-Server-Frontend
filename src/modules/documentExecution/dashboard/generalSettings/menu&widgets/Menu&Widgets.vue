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
                <span class="p-float-label">
                    <InputText id="dashboard-export-file-name" v-model="menuWidgetsConfig.exportFileName" class="kn-material-input kn-width-full" type="text" />
                    <label for="dashboard-export-file-name" class="kn-material-input-label">{{ $t('dashboard.generalSettings.menuWidgets.exportFileName') }}</label>
                </span>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import { IMenuAndWidgets } from '../../Dashboard'

export default defineComponent({
    name: 'menu-and-widgets',
    components: { InputSwitch, InputText },
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
