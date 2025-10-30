<!-- eslint-disable vue/no-mutating-props -->
<template>
    <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3">{{ $t('common.themes') }}</label>

        <form class="p-fluid p-formgrid p-grid p-m-1">
            <Message class="p-m-2" severity="info" :closable="false">
                {{ $t('dashboard.generalSettings.themes.info') }}
            </Message>
            <span class="p-col-12 p-grid p-mt-2">
                <q-select v-model="dashboardModelProp.configuration.theme.id" clearable emit-value class="p-col-7" outlined :options="availableThemes" option-value="id" option-label="themeName" map-options :label="$t('dashboard.generalSettings.themes.dashboardTheme')" @update:model-value="onThemeSelected" />
                <q-btn color="primary" class="kn-flex p-mr-2" :label="$t('dashboard.generalSettings.themes.editTheme')" />
                <q-btn-dropdown color="primary" :label="$t('dashboard.generalSettings.themes.applyTheme')">
                    <q-list>
                        <q-item clickable v-close-popup @click="applyThemeToWidgets('allWidgets')">
                            <q-item-section>
                                <q-item-label>{{ $t('dashboard.generalSettings.themes.toAllWidgets') }}</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item clickable v-close-popup @click="applyThemeToWidgets('withoutThemes')">
                            <q-item-section>
                                <q-item-label>{{ $t('dashboard.generalSettings.themes.toWidgetsWithoutThemes') }}</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item clickable v-close-popup @click="applyThemeToWidgets('withThemes')">
                            <q-item-section>
                                <q-item-label>{{ $t('dashboard.generalSettings.themes.toWidgetsWithThemes') }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
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
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { applySelectedThemeToWidgets } from './ThemesHelper'

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
        },
        onThemeSelected(selectedThemeId: number | null) {
            const theme = this.availableThemes.find((theme: IDashboardTheme) => theme.id === selectedThemeId)
            if (this.dashboardModelProp.configuration.theme) this.dashboardModelProp.configuration.theme.themeName = theme ? theme.themeName : ''
        },
        getSelectedTheme(themeId: number | null) {
            const allThemes = this.getAllThemes()
            return allThemes.find((theme: IDashboardTheme) => theme.id === themeId)
        },
        applyThemeToWidgets(filterType: 'allWidgets' | 'withThemes' | 'withoutThemes' = 'allWidgets') {
            if (this.dashboardModel.configuration.theme?.id != null) {
                const selectedTheme = this.getSelectedTheme(this.dashboardModel.configuration.theme.id)
                if (selectedTheme) this.dashboardModel.configuration.theme = { ...selectedTheme }
                applySelectedThemeToWidgets(this.dashboardModel.widgets, this.dashboardModel.configuration.theme, filterType)
            }
        }
    }
})
</script>
