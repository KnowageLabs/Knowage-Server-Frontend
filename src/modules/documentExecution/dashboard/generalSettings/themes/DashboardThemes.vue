<!-- eslint-disable vue/no-mutating-props -->
<template>
    <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3"> {{ $t('common.themes') }}</label>

        <form class="p-fluid p-formgrid p-grid p-m-1">
            <Message class="p-m-2" severity="info" :closable="false">
                {{ $t('dashboard.generalSettings.themes.info') }}
            </Message>
            <span class="p-field p-col-12 p-d-flex p-flex-row">
                <span class="p-float-label kn-flex">
                    <Dropdown id="theme" v-model="dashboardModelProp.configuration.theme" class="kn-material-input" :options="availableThemes" option-label="themeName" option-value="" />
                    <label for="theme" class="kn-material-input-label"> {{ $t('dashboard.generalSettings.themes.dashboardTheme') }} </label>
                </span>
                <Button class="kn-button kn-button--primary p-ml-2" style="flex: 0.2" label="Edit Theme" />
            </span>
        </form>

        <div v-if="dashboardModelProp.configuration.theme?.themeName != null" class="theme-manager-examples kn-page p-p-0 kn-overflow dashboard-scrollbar">
            <ThemeExamples :selected-theme-prop="dashboardModelProp.configuration.theme" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import Message from 'primevue/message'
import Dropdown from 'primevue/dropdown'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { mapActions } from 'pinia'
import ThemeExamples from '@/modules/managers/dashboardThemeManagement/dashboardThemeManagementExamples/DashboardThemeManagementExamples.vue'

export default defineComponent({
    name: 'dashboard-variables',
    components: { Message, Dropdown, ThemeExamples },
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
            dashboardModel: {} as any,
            document: {} as any,
            availableThemes: [] as any
        }
    },
    watch: {},
    created() {
        this.loadProps()
    },
    methods: {
        ...mapActions(dashboardStore, ['getAllThemes']),
        loadProps() {
            this.availableThemes = this.getAllThemes()
            this.dashboardModel = this.dashboardModelProp
            this.document = this.dashboardModelProp.document
        }
    }
})
</script>
