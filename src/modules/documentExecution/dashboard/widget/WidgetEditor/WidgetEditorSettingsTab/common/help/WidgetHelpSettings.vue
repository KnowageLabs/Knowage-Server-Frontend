<template>
    IT WORKS
    <div v-if="widgetHelpSettingsModel" class="kn-flex p-p-4">
        {{ widgetHelpSettingsModel }}
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetHelpSettings } from '@/modules/documentExecution/Dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import WidgetEditorColorPicker from '../WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-help-settings',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            widgetHelpSettingsModel: null as IWidgetHelpSettings | null
        }
    },
    computed: {
        widgetHelpDisabled() {
            return !this.widgetHelpSettingsModel || !this.widgetHelpSettingsModel.enabled
        }
    },
    mounted() {
        this.loadWidgetHelpSettings()
    },
    unmounted() {},
    methods: {
        loadWidgetHelpSettings() {
            if (this.widgetModel?.settings?.help) this.widgetHelpSettingsModel = this.widgetModel.settings.help
        }
    }
})
</script>
