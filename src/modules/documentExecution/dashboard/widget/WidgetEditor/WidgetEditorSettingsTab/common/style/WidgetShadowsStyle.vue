<template>
    <div v-if="shadowsStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <div v-if="themeStyle" class="col-12">
                <q-toggle v-model="shadowsStyleModel.enabled" :label="$t('common.enabled')" @update:model-value="shadowStyleChanged" />
            </div>

            <div class="col-8">
                <q-select v-model="shadowSize" :options="translatedShadowSizes" :label="$t('dashboard.widgetEditor.shadows.shadowSize')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="shadowsStyleDisabled" @update:model-value="onShadowsSizeChanged" />
            </div>
            <div class="col-4">
                <WidgetEditorColorPicker :initial-value="shadowsStyleModel.properties.color" :label="$t('dashboard.widgetEditor.iconTooltips.backgroundColor')" :disabled="shadowsStyleDisabled" @change="onBackroundColorChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetShadowsStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-shadows-style',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IWidgetShadowsStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            shadowsStyleModel: null as IWidgetShadowsStyle | null,
            shadowSize: '',
            shadowSizeOptionsMap: { small: '0px 1px 1px', medium: '0px 2px 3px', large: '0px 4px 6px', extraLarge: '0px 8px 12px' }
        }
    },
    computed: {
        shadowsStyleDisabled() {
            return !this.shadowsStyleModel || !this.shadowsStyleModel.enabled
        },
        translatedShadowSizes(): { label: string; value: string }[] {
            return descriptor.shadowsSizeOptions.map((opt) => ({ label: opt.label ? this.$t(opt.label) : '', value: opt.value }))
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadShadowsStyle()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadShadowsStyle)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadShadowsStyle)
        },
        loadShadowsStyle() {
            if (this.widgetModel?.settings?.style?.shadows) this.shadowsStyleModel = this.widgetModel.settings.style.shadows
            else if (this.themeStyle) this.shadowsStyleModel = this.themeStyle

            if (this.shadowsStyleModel && !this.shadowsStyleModel.properties['box-shadow']) this.shadowsStyleModel.properties['box-shadow'] = '0px 2px 3px'
            this.getShadowSize()
        },
        shadowStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        getShadowSize() {
            if (!this.shadowsStyleModel) return
            switch (this.shadowsStyleModel.properties['box-shadow']) {
                case '0px 1px 1px':
                    this.shadowSize = 'small'
                    break
                case '0px 2px 3px':
                    this.shadowSize = 'medium'
                    break
                case '0px 4px 5px':
                    this.shadowSize = 'large'
                    break
                case '0px 8px 19px':
                    this.shadowSize = 'extraLarge'
                    break
                default:
                    this.shadowSize = 'medium'
            }
        },
        onShadowsSizeChanged() {
            if (!this.shadowsStyleModel) return
            this.shadowsStyleModel.properties['box-shadow'] = this.shadowSizeOptionsMap[this.shadowSize]
            this.shadowStyleChanged()
        },
        onBackroundColorChanged(event: string | null) {
            if (!event || !this.shadowsStyleModel) return
            this.shadowsStyleModel.properties.color = event
            this.shadowStyleChanged()
        }
    }
})
</script>
