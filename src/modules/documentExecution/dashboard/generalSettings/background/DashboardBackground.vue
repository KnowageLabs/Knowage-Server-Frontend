<template>
    <div class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
        <label class="kn-material-input-label p-m-3"> {{ $t('dashboard.widgetEditor.background') }}</label>

        <form class="p-fluid p-formgrid p-grid p-m-1">
            <span class="p-field p-float-label p-col-12">
                <InputText id="imageBackgroundUrl" v-model="background.imageBackgroundUrl" class="kn-material-input kn-width-full" />
                <label for="imageBackgroundUrl" class="kn-material-input-label"> {{ $t('dashboard.generalSettings.background.sheetsImage') }} </label>
            </span>
            <span class="p-field p-float-label p-col-12">
                <InputText id="imageBackgroundSize" v-model="background.imageBackgroundSize" class="kn-material-input kn-width-full" />
                <label for="imageBackgroundSize" class="kn-material-input-label"> {{ $t('dashboard.generalSettings.background.sheetsSize') }} </label>
            </span>
            <span class="p-field p-col-12">
                <label for="sheetsBackgroundColor" class="kn-material-input-label p-m-0"> {{ $t('dashboard.generalSettings.background.sheetsColor') }} </label>
                <WidgetEditorColorPicker :initial-value="background.sheetsBackgroundColor" @change="onSelectionColorChanged" />
            </span>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from '../DashboardGeneralSettingsDescriptor.json'
import { IBackground } from '../../Dashboard'
import WidgetEditorColorPicker from '../../widget/WidgetEditor/WidgetEditorSettingsTab/common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'dashboard-variables',
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
            background: {} as IBackground
        }
    },
    watch: {},
    created() {
        this.background = this.dashboardModelProp.configuration.background as IBackground
    },
    methods: {
        onSelectionColorChanged(event: string | null) {
            if (!event || !this.background.sheetsBackgroundColor) return
            else this.background.sheetsBackgroundColor = event
        }
    }
})
</script>
