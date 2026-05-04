<template>
    <div v-if="backgroundStyleModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div v-if="themeStyle" class="col-12">
                <q-toggle v-model="backgroundStyleModel.enabled" :label="$t('common.enabled')" @update:model-value="backgroundColorStyleChanged" />
            </div>
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="backgroundStyleModel.properties['background-color']" :label="$t('dashboard.widgetEditor.iconTooltips.backgroundColor')" @change="backgroundColorStyleChanged"></WidgetEditorColorPicker>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetBackgroundStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
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
            widgetType: '' as string
        }
    },
    computed: {
        backgroundStyleDisabled() {
            return !this.backgroundStyleModel || !this.backgroundStyleModel.enabled
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadBackgroundColor()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadBackgroundColor)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadBackgroundColor)
        },
        loadBackgroundColor() {
            if (this.widgetModel?.settings?.style?.background) this.backgroundStyleModel = this.widgetModel.settings.style.background
            else if (this.themeStyle) this.backgroundStyleModel = this.themeStyle
        },
        backgroundColorStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        }
    }
})
</script>

<style lang="scss" scoped>
.color-preview {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.24);
}
</style>
