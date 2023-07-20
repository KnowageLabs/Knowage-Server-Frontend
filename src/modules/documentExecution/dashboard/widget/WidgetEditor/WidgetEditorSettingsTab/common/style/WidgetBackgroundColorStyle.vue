<template>
    <div v-if="backgroundStyleModel" class="kn-flex p-p-4">
        <span v-if="themeStyle" class="p-d-flex p-flex-row p-ai-center p-mb-2"> {{ $t('common.enabled') }} <q-toggle v-model="backgroundStyleModel.enabled" color="black" /> </span>
        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12">
                <span class="">
                    <WidgetEditorColorPicker :initial-value="backgroundStyleModel.properties['background-color']" :label="$t('dashboard.widgetEditor.iconTooltips.backgroundColor')" :disabled="backgroundStyleDisabled" @change="onBackroundColorChanged"></WidgetEditorColorPicker>
                </span>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetBackgroundStyle } from '@/modules/documentExecution/Dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import WidgetEditorColorPicker from '../WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-background-color-style',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IWidgetBackgroundStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            backgroundStyleModel: null as IWidgetBackgroundStyle | null,
            widgetType: '' as string,
            getTranslatedLabel
        }
    },
    computed: {
        backgroundStyleDisabled() {
            return !this.backgroundStyleModel || !this.backgroundStyleModel.enabled
        }
    },
    created() {
        this.loadBackgroundColor()
    },
    methods: {
        loadBackgroundColor() {
            if (this.widgetModel?.settings?.style?.background) this.backgroundStyleModel = this.widgetModel.settings.style.background
            else if (this.themeStyle) this.backgroundStyleModel = this.themeStyle
        },
        backgroundColorStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onBackroundColorChanged(event: string | null) {
            if (!event || !this.backgroundStyleModel) return
            this.backgroundStyleModel.properties['background-color'] = event
            this.backgroundColorStyleChanged()
        }
    }
})
</script>
