<template>
    <div v-if="shadowsStyleModel" class="kn-flex p-p-4">
        <span v-if="themeStyle" class="p-d-flex p-flex-row p-ai-center p-mb-2"> {{ $t('common.enabled') }} <q-toggle v-model="shadowsStyleModel.enabled" color="black" /> </span>

        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12 p-lg-8">
                <span class="p-float-label">
                    <Dropdown v-model="shadowSize" class="kn-material-input p-inputtext-sm" :options="descriptor.shadowsSizeOptions" option-value="value" :disabled="shadowsStyleDisabled" @change="onShadowsSizeChanged">
                        <template #value="slotProps">
                            <div>
                                <span>{{ getTranslatedLabel(slotProps.value, descriptor.shadowsSizeOptions, $t) }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.shadows.shadowSize') }}</label>
                </span>
            </div>
            <div class="p-field p-col-12 p-md-6 p-lg-4">
                <span class="">
                    <WidgetEditorColorPicker :initial-value="shadowsStyleModel.properties.color" :label="$t('dashboard.widgetEditor.iconTooltips.backgroundColor')" :disabled="shadowsStyleDisabled" @change="onBackroundColorChanged"></WidgetEditorColorPicker>
                </span>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetShadowsStyle } from '@/modules/documentExecution/Dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import Dropdown from 'primevue/dropdown'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-shadows-style',
    components: { Dropdown, WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IWidgetShadowsStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            shadowsStyleModel: null as IWidgetShadowsStyle | null,
            shadowSize: '',
            shadowSizeOptionsMap: { small: '0px 1px 1px', medium: '0px 2px 3px', large: '0px 8px 19px', extraLarge: '0px 8px 19px' },
            widgetType: '' as string,
            getTranslatedLabel
        }
    },
    computed: {
        shadowsStyleDisabled() {
            return !this.shadowsStyleModel || !this.shadowsStyleModel.enabled
        }
    },
    watch: {
        shadowsStyleDisabled() {
            this.shadowStyleChanged()
        }
    },
    created() {
        this.loadShadowsStyle()
    },
    methods: {
        loadShadowsStyle() {
            if (this.widgetModel?.settings?.style?.shadows) this.shadowsStyleModel = this.widgetModel.settings.style.shadows
            else if (this.themeStyle) this.shadowsStyleModel = this.themeStyle
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

<style lang="scss" scoped>
#padding-left-container {
    max-width: 300px;
}
</style>
