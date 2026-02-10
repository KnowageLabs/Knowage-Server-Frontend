<template>
    <div v-if="sliderStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Layout Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.layout') }}</label>
            <div class="col-12">
                <q-btn-toggle v-model="sliderStyleModel.layout" :options="layoutOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="sliderStyleChanged" />
            </div>

            <!-- Design Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>

            <div class="col-6">
                <q-input v-model="sliderStyleModel.trackSize" :label="$t('dashboard.widgetEditor.selectorWidget.slider.trackSize')" placeholder="4px" dense outlined @update:model-value="sliderStyleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="sliderStyleModel.dense" label="Dense" @update:model-value="sliderStyleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="sliderStyleModel.darkMode" label="Dark Mode" @update:model-value="sliderStyleChanged" />
            </div>

            <!-- Coloring Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>
            <div class="col-6">
                <q-input v-model="sliderStyleModel.color" :label="$t('common.color')" placeholder="primary, red, #ff0000ff" dense outlined @update:model-value="sliderStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="sliderStyleModel.color" format-model="hexa" @update:model-value="sliderStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="sliderStyleModel.thumbColor" :label="$t('dashboard.widgetEditor.selectorWidget.slider.thumbColor')" placeholder="primary, red, #ff0000ff" dense outlined @update:model-value="sliderStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="sliderStyleModel.thumbColor" format-model="hexa" @update:model-value="sliderStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <!-- Labels Section - TODO: use font wizard? -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.label') }}</label>
            <div class="col-6">
                <q-input v-model="sliderStyleModel.markerFontSize" :label="$t('dashboard.widgetEditor.iconTooltips.fontSize')" placeholder="12px, 1rem" dense outlined @update:model-value="sliderStyleChanged" />
            </div>
            <div class="col-6">
                <q-input v-model="sliderStyleModel.labelColor" :label="$t('dashboard.widgetEditor.iconTooltips.fontColor')" placeholder="red, #ff0000ff" dense outlined @update:model-value="sliderStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="sliderStyleModel.labelColor" format-model="hexa" @update:model-value="sliderStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-12">
                <q-checkbox v-model="sliderStyleModel.switchMarkerLabelsSide" label="Labels Below/Above Slider" @update:model-value="sliderStyleChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetSliderStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-slider-style',
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<ISelectorWidgetSliderStyle | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            sliderStyleModel: null as ISelectorWidgetSliderStyle | null,
            layoutOptions: [
                { label: 'Horizontal', value: 'horizontal' },
                { label: 'Vertical', value: 'vertical' }
            ]
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadSliderStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadSliderStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadSliderStyleModel)
        },
        loadSliderStyleModel() {
            if (this.widgetModel?.settings?.style?.slider) {
                this.sliderStyleModel = this.widgetModel.settings.style.slider
            } else if (this.themeStyle) {
                this.sliderStyleModel = this.themeStyle
            }
        },
        sliderStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        }
    }
})
</script>

<style lang="scss" scoped>
.section-label {
    font-weight: bold;
    margin-top: 12px;
}
</style>
