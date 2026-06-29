<template>
    <div v-if="bordersStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <div v-if="themeStyle" class="col-12">
                <q-toggle v-model="bordersStyleModel.enabled" :label="$t('common.enabled')" @update:model-value="bordersStyleChanged" />
            </div>

            <div class="col-4">
                <q-select v-model="bordersStyleModel.properties['border-style']" :options="translatedBorderStyles" :label="$t('dashboard.widgetEditor.borders.bordersStyle')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="bordersStyleDisabled" @update:model-value="bordersStyleChanged" />
            </div>
            <div class="col-4">
                <q-input v-model="bordersStyleModel.properties['border-width']" outlined dense :label="$t('dashboard.widgetEditor.borders.bordersThickness')" :placeholder="$t('dashboard.widgetEditor.borders.bordersThicknessHint')" hide-bottom-space :disable="bordersStyleDisabled" @change="bordersStyleChanged" />
            </div>
            <div class="col-4">
                <WidgetEditorColorPicker :initial-value="bordersStyleModel.properties['border-color']" :label="$t('dashboard.widgetEditor.borders.bordersColor')" :disabled="bordersStyleDisabled" @change="onSelectionColorChanged" />
            </div>

            <div class="col-12 row items-center">
                <span class="text-subtitle2 text-weight-medium q-mr-xs">{{ $t('dashboard.widgetEditor.borders.borderRadius') }}</span>
                <q-btn flat round dense size="sm" :icon="radiusLinked ? 'link' : 'link_off'" :disable="bordersStyleDisabled" @click="radiusLinked = !radiusLinked" />
            </div>

            <div :class="radiusLinked ? 'col-12' : 'col-3'">
                <q-input v-model="bordersStyleModel.properties['border-top-left-radius']" outlined dense :label="radiusLinked ? $t('dashboard.widgetEditor.borders.borderRadius') : $t('dashboard.widgetEditor.borders.borderRadiusTopLeft')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" hide-bottom-space :disable="bordersStyleDisabled" @change="onRadiusChange" />
            </div>
            <div v-if="!radiusLinked" class="col-3">
                <q-input v-model="bordersStyleModel.properties['border-top-right-radius']" outlined dense :label="$t('dashboard.widgetEditor.borders.borderRadiusTopRight')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" hide-bottom-space :disable="bordersStyleDisabled" @change="bordersStyleChanged" />
            </div>
            <div v-if="!radiusLinked" class="col-3">
                <q-input v-model="bordersStyleModel.properties['border-bottom-left-radius']" outlined dense :label="$t('dashboard.widgetEditor.borders.borderRadiusBottomLeft')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" hide-bottom-space :disable="bordersStyleDisabled" @change="bordersStyleChanged" />
            </div>
            <div v-if="!radiusLinked" class="col-3">
                <q-input v-model="bordersStyleModel.properties['border-bottom-right-radius']" outlined dense :label="$t('dashboard.widgetEditor.borders.borderRadiusBottomRight')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" hide-bottom-space :disable="bordersStyleDisabled" @change="bordersStyleChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetBordersStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-borders-style',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IWidgetBordersStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            bordersStyleModel: null as IWidgetBordersStyle | null,
            radiusLinked: true
        }
    },
    computed: {
        bordersStyleDisabled() {
            return !this.bordersStyleModel || !this.bordersStyleModel.enabled
        },
        translatedBorderStyles(): { label: string; value: string }[] {
            return descriptor.bordersStyleOptions.map((opt) => ({ label: opt.label ? this.$t(opt.label) : '', value: opt.value }))
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadBordersStyle()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadBordersStyle)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadBordersStyle)
        },
        loadBordersStyle() {
            if (this.widgetModel?.settings?.style?.borders) this.bordersStyleModel = this.widgetModel.settings.style.borders
            else if (this.themeStyle) this.bordersStyleModel = this.themeStyle
        },
        bordersStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onSelectionColorChanged(event: string | null) {
            if (!event || !this.bordersStyleModel) return
            this.bordersStyleModel.properties['border-color'] = event
            this.bordersStyleChanged()
        },
        onRadiusChange() {
            if (!this.bordersStyleModel) return
            if (this.radiusLinked) {
                const v = this.bordersStyleModel.properties['border-top-left-radius']
                this.bordersStyleModel.properties['border-top-right-radius'] = v
                this.bordersStyleModel.properties['border-bottom-left-radius'] = v
                this.bordersStyleModel.properties['border-bottom-right-radius'] = v
            }
            this.bordersStyleChanged()
        }
    }
})
</script>
