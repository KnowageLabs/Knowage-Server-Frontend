<template>
    <div v-if="menuWidgetsConfig" class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
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
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.enableChartChange" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.generalSettings.menuWidgets.enableChartChange') }} </label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.enableCaching" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.generalSettings.menuWidgets.enableCaching') }} </label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.enableCustomHeader" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.generalSettings.menuWidgets.enableCustomHeader') }} </label>
            </span>
            <span class="p-field p-col-12">
                <InputSwitch v-model="menuWidgetsConfig.enableWidgetMenu" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.generalSettings.menuWidgets.enableWidgetMenu') }} </label>
            </span>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import InputSwitch from 'primevue/inputswitch'
import { IMenuAndWidgets } from '../../Dashboard'

export default defineComponent({
    name: 'menu-and-widgets',
    components: { InputSwitch },
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
