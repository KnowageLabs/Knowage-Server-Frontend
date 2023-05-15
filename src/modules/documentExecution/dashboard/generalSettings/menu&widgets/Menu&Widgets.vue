<template>
    <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3"> {{ $t('dashboard.generalSettings.menuWidgets.title') }}</label>

        <form class="p-fluid p-formgrid p-grid p-m-1">
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.showExcelExport" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.generalSettings.menuWidgets.showExcelExport') }} </label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.showScreenshot" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.generalSettings.menuWidgets.showScreenshot') }} </label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.showSelectionButton" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.generalSettings.menuWidgets.showSelectionButton') }} </label>
            </span>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import InputSwitch from 'primevue/inputswitch'
import { IMenuAndWidgets } from '../../Dashboard'

export default defineComponent({
    name: 'dashboard-variables',
    components: { InputSwitch },
    props: {
        dashboardModelProp: {
            type: Object as any,
            default() {
                return {}
            }
        }
    },
    data() {
        return {
            descriptor,
            menuWidgetsConfig: {} as any
        }
    },
    watch: {},
    created() {
        this.menuWidgetsConfig = this.dashboardModelProp.configuration.menuWidgets as IMenuAndWidgets
    },
    methods: {}
})
</script>
