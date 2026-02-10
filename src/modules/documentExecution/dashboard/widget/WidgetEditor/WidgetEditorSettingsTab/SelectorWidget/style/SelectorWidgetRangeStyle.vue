<template>
    <div v-if="rangeStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Layout Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.layout') }}</label>
            <div class="col-12">
                <q-btn-toggle v-model="rangeStyleModel.layout" :options="layoutOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="rangeStyleChanged" />
            </div>

            <!-- Design Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>

            <div class="col-6">
                <q-input v-model="rangeStyleModel.trackSize" :label="$t('dashboard.widgetEditor.selectorWidget.slider.trackSize')" placeholder="4px" dense outlined @update:model-value="rangeStyleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="rangeStyleModel.dense" label="Dense" @update:model-value="rangeStyleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="rangeStyleModel.darkMode" label="Dark Mode" @update:model-value="rangeStyleChanged" />
            </div>

            <!-- Coloring Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>
            <div class="col-6">
                <q-input v-model="rangeStyleModel.color" :label="$t('common.color')" placeholder="primary, red, #ff0000ff" dense outlined @update:model-value="rangeStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="rangeStyleModel.color" format-model="hexa" @update:model-value="rangeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="rangeStyleModel.thumbColor" :label="$t('dashboard.widgetEditor.selectorWidget.slider.thumbColor')" placeholder="primary, red, #ff0000ff" dense outlined @update:model-value="rangeStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="rangeStyleModel.thumbColor" format-model="hexa" @update:model-value="rangeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <!-- Labels Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.label') }}</label>
            <div class="col-6">
                <q-input v-model="rangeStyleModel.markerFontSize" :label="$t('dashboard.widgetEditor.iconTooltips.fontSize')" placeholder="12px, 1rem" dense outlined @update:model-value="rangeStyleChanged" />
            </div>
            <div class="col-6">
                <q-input v-model="rangeStyleModel.labelColor" :label="$t('dashboard.widgetEditor.iconTooltips.fontColor')" placeholder="red, #ff0000ff" dense outlined @update:model-value="rangeStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="rangeStyleModel.labelColor" format-model="hexa" @update:model-value="rangeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-12">
                <q-checkbox v-model="rangeStyleModel.switchMarkerLabelsSide" label="Labels Below/Above Range" @update:model-value="rangeStyleChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetRangeStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-range-style',
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<ISelectorWidgetRangeStyle | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            rangeStyleModel: null as ISelectorWidgetRangeStyle | null,
            layoutOptions: [
                { label: 'Horizontal', value: 'horizontal' },
                { label: 'Vertical', value: 'vertical' }
            ]
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadRangeStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadRangeStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadRangeStyleModel)
        },
        loadRangeStyleModel() {
            if (this.widgetModel?.settings?.style?.range) {
                this.rangeStyleModel = this.widgetModel.settings.style.range
            } else if (this.themeStyle) {
                this.rangeStyleModel = this.themeStyle
            }
        },
        rangeStyleChanged() {
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
