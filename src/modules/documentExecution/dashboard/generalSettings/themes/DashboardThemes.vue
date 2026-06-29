<!-- eslint-disable vue/no-mutating-props -->
<template>
    <div class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm items-center">
            <div v-if="bannerVisible" class="col-12">
                <q-banner class="bg-info text-black" rounded dense>
                    {{ $t('dashboard.generalSettings.themes.info') }}.
                    <br />
                    <span v-if="dashboardModelProp.configuration.theme?.themeName != null"> {{ $t('dashboard.generalSettings.themes.dashboardThemeHint') }}</span>
                    <template #action>
                        <q-btn flat dense round icon="close" size="sm" @click="bannerVisible = false" />
                    </template>
                </q-banner>
            </div>
            <div class="col-6">
                <q-select v-model="dashboardModelProp.configuration.theme.id" clearable emit-value outlined dense :options="availableThemes" option-value="id" option-label="themeName" map-options :label="$t('dashboard.generalSettings.themes.dashboardTheme')" @update:model-value="onThemeSelected" />
            </div>
            <div class="col-auto">
                <span v-tooltip.top="'Work in progress'">
                    <q-btn color="primary" :label="$t('dashboard.generalSettings.themes.editTheme')" disabled />
                </span>
            </div>
            <div class="col-auto">
                <q-btn-dropdown color="primary" :label="$t('dashboard.generalSettings.themes.applyTheme')">
                    <q-list>
                        <q-item clickable v-close-popup @click="applyThemeToWidgets('allWidgets')">
                            <q-item-section
                                ><q-item-label>{{ $t('dashboard.generalSettings.themes.toAllWidgets') }}</q-item-label></q-item-section
                            >
                        </q-item>
                        <q-item clickable v-close-popup @click="applyThemeToWidgets('withoutThemes')">
                            <q-item-section
                                ><q-item-label>{{ $t('dashboard.generalSettings.themes.toWidgetsWithoutThemes') }}</q-item-label></q-item-section
                            >
                        </q-item>
                        <q-item clickable v-close-popup @click="applyThemeToWidgets('withThemes')">
                            <q-item-section
                                ><q-item-label>{{ $t('dashboard.generalSettings.themes.toWidgetsWithThemes') }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { mapActions } from 'pinia'
import ThemeExamples from '@/modules/managers/dashboardThemeManagement/dashboardThemeManagementExamples/DashboardThemeManagementExamples.vue'
import KnHint from '@/components/UI/KnHint.vue'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import { applySelectedThemeToWidgets } from './ThemesHelper'

export default defineComponent({
    name: 'dashboard-variables',
    components: { ThemeExamples },
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
            bannerVisible: true,
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
