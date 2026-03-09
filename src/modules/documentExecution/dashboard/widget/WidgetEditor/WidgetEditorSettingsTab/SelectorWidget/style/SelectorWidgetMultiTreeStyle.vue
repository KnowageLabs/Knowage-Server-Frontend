<template>
    <div v-if="multiTreeStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.selectorWidget.tree.mode') }}</label>
            <div class="col-12">
                <q-btn-toggle v-model="multiTreeStyleModel.popupMode" :options="modeOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="multiTreeStyleChanged" />
            </div>

            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>
            <div class="col-6">
                <q-checkbox v-model="multiTreeStyleModel.showFilter" :label="$t('dashboard.widgetEditor.selectorWidget.tree.showFilter')" @update:model-value="multiTreeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="multiTreeStyleModel.defaultExpandAll" :label="$t('dashboard.widgetEditor.selectorWidget.tree.defaultExpandAll')" @update:model-value="multiTreeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="multiTreeStyleModel.dense" :label="$t('dashboard.widgetEditor.selectorWidget.tree.dense')" @update:model-value="multiTreeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="multiTreeStyleModel.noConnectors" :label="$t('dashboard.widgetEditor.selectorWidget.tree.noConnectors')" @update:model-value="multiTreeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="multiTreeStyleModel.accordion" :label="$t('dashboard.widgetEditor.selectorWidget.tree.accordion')" @update:model-value="multiTreeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="multiTreeStyleModel.dark" :label="$t('dashboard.widgetEditor.selectorWidget.tree.dark')" @update:model-value="multiTreeStyleChanged" />
            </div>

            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>

            <div class="col-6">
                <q-input v-model="multiTreeStyleModel.color" :label="$t('dashboard.widgetEditor.selectorWidget.tree.color')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="multiTreeStyleModel.color" format-model="hexa" @update:model-value="multiTreeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="multiTreeStyleModel.textColor" :label="$t('dashboard.widgetEditor.selectorWidget.tree.textColor')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="multiTreeStyleModel.textColor" format-model="hexa" @update:model-value="multiTreeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="multiTreeStyleModel.selectedColor" :label="$t('dashboard.widgetEditor.selectorWidget.tree.selectedColor')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="multiTreeStyleModel.selectedColor" format-model="hexa" @update:model-value="multiTreeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="multiTreeStyleModel.controlColor" :label="$t('dashboard.widgetEditor.selectorWidget.tree.controlColor')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="multiTreeStyleModel.controlColor" format-model="hexa" @update:model-value="multiTreeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetTreeStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-multi-tree-style',
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<ISelectorWidgetTreeStyle | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            multiTreeStyleModel: null as ISelectorWidgetTreeStyle | null,
            modeOptions: [
                { label: 'Normal', value: false },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.tree.popupMode'), value: true }
            ]
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadMultiTreeStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadMultiTreeStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadMultiTreeStyleModel)
        },
        loadMultiTreeStyleModel() {
            if (this.widgetModel?.settings?.style?.multiTree) {
                this.multiTreeStyleModel = this.widgetModel.settings.style.multiTree
            } else if (this.themeStyle) {
                this.multiTreeStyleModel = this.themeStyle
            }
        },
        multiTreeStyleChanged() {
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
