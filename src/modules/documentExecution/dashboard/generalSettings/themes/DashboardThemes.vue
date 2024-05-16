<!-- eslint-disable vue/no-mutating-props -->
<template>
    <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3"> {{ $t('common.themes') }}</label>

        <form class="p-fluid p-formgrid p-grid p-m-1">
            <Message class="p-m-2" severity="info" :closable="false">
                {{ $t('dashboard.generalSettings.themes.info') }}
            </Message>
            <span class="p-col-12 p-grid p-mt-2">
                <q-select v-model="dashboardModelProp.configuration.theme.themeName" clearable emit-value class="p-col-8" outlined :options="availableThemes" option-value="themeName" option-label="themeName" :label="$t('dashboard.generalSettings.themes.dashboardTheme')" />
                <q-btn color="primary" class="kn-flex" :label="$t('dashboard.generalSettings.themes.editTheme')" />
            </span>
        </form>

        <div v-if="dashboardModelProp.configuration.theme?.themeName != null" class="theme-manager-examples kn-page p-p-0 kn-overflow dashboard-scrollbar">
            <KnHint :title="'dashboard.generalSettings.themes.dashboardTheme'" :hint="'dashboard.generalSettings.themes.dashboardThemeHint'"></KnHint>
            <!-- ThemeExamples :selected-theme-prop="dashboardModelProp.configuration.theme" /-->
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
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    name: 'dashboard-variables',
    components: { KnHint, Message, Dropdown, ThemeExamples },
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
