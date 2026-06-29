<template>
    <div v-if="background" class="q-px-md q-pb-xs">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="background.sheetsBackgroundColor" :label="'dashboard.generalSettings.background.sheetsColor'" @change="background.sheetsBackgroundColor = $event" />
            </div>
            <div class="col-6">
                <q-toggle v-model="background.showGrid" :label="$t('dashboard.generalSettings.background.showGrid')" />
            </div>
            <div class="col-6">
                <q-input v-model="background.imageBackgroundUrl" class="col-6" outlined dense :label="$t('dashboard.generalSettings.background.sheetsImage')" hide-bottom-space>
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                            <q-tooltip>{{ $t('dashboard.generalSettings.background.sheetsImageHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="background.imageBackgroundSize" class="col-6" outlined dense :label="$t('dashboard.generalSettings.background.sheetsSize')" hide-bottom-space>
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                            <q-tooltip>{{ $t('dashboard.generalSettings.background.sheetsSize') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-12">
                <q-input v-model="background.sheetsBackgroundStyle" type="textarea" rows="2" outlined dense clearable :label="$t('dashboard.generalSettings.background.sheetsStyle')" hide-bottom-space>
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                            <q-tooltip>{{ $t('dashboard.generalSettings.background.sheetsStyleHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import { IBackground } from '../../Dashboard'
import WidgetEditorColorPicker from '../../widget/WidgetEditor/WidgetEditorSettingsTab/common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'dashboard-background',
    components: { WidgetEditorColorPicker },
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
            if (!this.dashboard.configuration?.background) this.dashboard.configuration.background = { sheetsBackgroundColor: '', imageBackgroundUrl: '', imageBackgroundSize: '', sheetsBackgroundStyle: '', showGrid: true } as IBackground
            else if (this.dashboard.configuration.background.sheetsBackgroundStyle === undefined) this.dashboard.configuration.background.sheetsBackgroundStyle = ''
            this.background = this.dashboard.configuration.background as IBackground
        }
    }
})
</script>
