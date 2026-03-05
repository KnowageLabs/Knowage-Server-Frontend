<template>
    <div v-if="treeStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.selectorWidget.tree.mode') }}</label>
            <div class="col-12">
                <q-btn-toggle v-model="treeStyleModel.popupMode" :options="modeOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="treeStyleChanged" />
            </div>

            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>
            <div class="col-6">
                <q-checkbox v-model="treeStyleModel.showFilter" :label="$t('dashboard.widgetEditor.selectorWidget.tree.showFilter')" @update:model-value="treeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="treeStyleModel.defaultExpandAll" :label="$t('dashboard.widgetEditor.selectorWidget.tree.defaultExpandAll')" @update:model-value="treeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="treeStyleModel.dense" :label="$t('dashboard.widgetEditor.selectorWidget.tree.dense')" @update:model-value="treeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="treeStyleModel.noConnectors" :label="$t('dashboard.widgetEditor.selectorWidget.tree.noConnectors')" @update:model-value="treeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="treeStyleModel.accordion" :label="$t('dashboard.widgetEditor.selectorWidget.tree.accordion')" @update:model-value="treeStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="treeStyleModel.dark" :label="$t('dashboard.widgetEditor.selectorWidget.tree.dark')" @update:model-value="treeStyleChanged" />
            </div>

            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>

            <div class="col-6">
                <q-input v-model="treeStyleModel.color" :label="$t('dashboard.widgetEditor.selectorWidget.tree.color')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="treeStyleModel.color" format-model="hexa" @update:model-value="treeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="treeStyleModel.textColor" :label="$t('dashboard.widgetEditor.selectorWidget.tree.textColor')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="treeStyleModel.textColor" format-model="hexa" @update:model-value="treeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="treeStyleModel.selectedColor" :label="$t('dashboard.widgetEditor.selectorWidget.tree.selectedColor')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="treeStyleModel.selectedColor" format-model="hexa" @update:model-value="treeStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="treeStyleModel.controlColor" :label="$t('dashboard.widgetEditor.selectorWidget.tree.controlColor')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="treeStyleModel.controlColor" format-model="hexa" @update:model-value="treeStyleChanged" />
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
    name: 'selector-widget-tree-style',
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<ISelectorWidgetTreeStyle | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            treeStyleModel: null as ISelectorWidgetTreeStyle | null,
            modeOptions: [
                { label: 'Normal', value: false },
                { label: this.$t('dashboard.widgetEditor.selectorWidget.tree.popupMode'), value: true }
            ]
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadTreeStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadTreeStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadTreeStyleModel)
        },
        loadTreeStyleModel() {
            if (this.widgetModel?.settings?.style?.tree) {
                this.treeStyleModel = this.widgetModel.settings.style.tree
            } else if (this.themeStyle) {
                this.treeStyleModel = this.themeStyle
            }
        },
        treeStyleChanged() {
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
