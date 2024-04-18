<template>
    <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3"> {{ $t('dashboard.widgetEditor.background') }}</label>
        <form v-if="background" class="p-fluid p-formgrid p-grid p-m-1">
            <span class="p-col-12 p-sm-6 p-xl-3 p-mb-4">
                <q-input v-model="background.imageBackgroundUrl" :label="$t('dashboard.generalSettings.background.sheetsImage')" :hint="$t('dashboard.generalSettings.background.sheetsImageHint')">
                    <template #append>
                        <q-icon name="close" @click="background.imageBackgroundUrl = ''" />
                    </template>
                </q-input>
            </span>
            <span class="p-col-12 p-sm-6 p-xl-3 p-mb-4">
                <q-input v-model="background.imageBackgroundSize" :label="$t('dashboard.generalSettings.background.sheetsSize')" :hint="$t('dashboard.generalSettings.background.sheetsSizeHint')">
                    <template #append>
                        <q-icon name="close" @click="background.imageBackgroundSize = ''" />
                    </template>
                </q-input>
            </span>
            <span class="p-col-12 p-sm-6 p-xl-3 p-mb-4">
                <q-input v-model="background.sheetsBackgroundColor" :label="$t('dashboard.generalSettings.background.sheetsColor')">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="background.sheetsBackgroundColor" format-model="hexa" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </span>
            <span class="p-col-12 p-sm-6 p-xl-3 p-mb-4">
                <q-toggle v-model="background.showGrid" :label="$t('dashboard.generalSettings.background.showGrid')" />
            </span>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import { IBackground } from '../../Dashboard'

export default defineComponent({
    name: 'dashboard-variables',
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
            background: {} as IBackground
        }
    },
    watch: {},
    created() {
        this.loadProps()
    },
    methods: {
        loadProps() {
            this.dashboard = this.dashboardModelProp
            if (!this.dashboard.configuration?.background) this.dashboard.configuration.background = { sheetsBackgroundColor: '', imageBackgroundUrl: '', imageBackgroundSize: '', showGrid: true } as IBackground
            this.background = this.dashboard.configuration.background as IBackground
        },
        onSelectionColorChanged(event: string | null) {
            if (!event) return
            else this.background.sheetsBackgroundColor = event
        }
    }
})
</script>
