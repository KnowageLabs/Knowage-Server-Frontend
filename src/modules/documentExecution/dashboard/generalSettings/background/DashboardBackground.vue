<template>
    <div v-if="background" class="q-px-md q-pb-xs">
        <q-banner v-if="connectedThemeName" dense class="dashboard-background__banner q-mb-sm">
            <template #avatar><q-icon name="link" size="xs" /></template>
            {{ $t('dashboard.generalSettings.background.themeConnected', { theme: connectedThemeName }) }}
        </q-banner>
        <q-banner v-else-if="disconnected" dense class="dashboard-background__banner dashboard-background__banner--warning q-mb-sm">
            <template #avatar><q-icon name="link_off" size="xs" /></template>
            {{ $t('dashboard.generalSettings.background.themeDisconnected') }}
        </q-banner>
        <DashboardBackgroundFields class="q-mb-sm" :background="background" @change="onBackgroundChange">
            <template #beside-color>
                <q-toggle v-model="background.showGrid" :label="$t('dashboard.generalSettings.background.showGrid')" />
            </template>
        </DashboardBackgroundFields>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions } from 'pinia'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import { IBackground } from '../../Dashboard'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import DashboardBackgroundFields from './DashboardBackgroundFields.vue'

export default defineComponent({
    name: 'dashboard-background',
    components: { DashboardBackgroundFields },
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
            dashboard: {} as any,
            background: {} as IBackground,
            // Shown after a change disconnects the background from its theme, until the settings close.
            disconnected: false
        }
    },
    computed: {
        connectedThemeName(): string {
            if (this.background?.themeId == null) return ''
            const theme = (this.getAllThemes() ?? []).find((theme: IDashboardTheme) => theme.id === this.background.themeId)
            return theme?.themeName ?? ''
        }
    },
    created() {
        this.loadProps()
    },
    methods: {
        ...mapActions(dashboardStore, ['getAllThemes']),
        loadProps() {
            this.dashboard = this.dashboardModelProp
            if (!this.dashboard.configuration?.background) this.dashboard.configuration.background = { sheetsBackgroundColor: '', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: '', showGrid: true } as IBackground
            else if (this.dashboard.configuration.background.sheetsBackgroundStyle === undefined) this.dashboard.configuration.background.sheetsBackgroundStyle = ''
            this.background = this.dashboard.configuration.background as IBackground
        },
        // Like a widget style change, a change to the background disconnects it from the theme. "Show grid" is not a theme value.
        onBackgroundChange() {
            if (this.background.themeId == null) return
            this.background.themeId = null
            this.disconnected = true
        }
    }
})
</script>

<style lang="scss" scoped>
.dashboard-background__banner {
    background-color: #eef4fb;
    color: #35506b;
    font-size: 0.75rem;
    border-radius: 4px;

    &--warning {
        background-color: #fff4e5;
        color: #7a4a00;
    }
}
</style>
