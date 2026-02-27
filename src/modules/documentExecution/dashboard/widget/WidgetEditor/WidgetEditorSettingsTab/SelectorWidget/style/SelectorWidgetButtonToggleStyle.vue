<template>
    <div v-if="buttonToggleStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Design Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>

            <div class="col-12">
                <q-btn-toggle v-model="buttonToggleStyleModel.type" :options="typeOptions" color="secondary" toggle-color="primary" unelevated clearable @update:model-value="buttonToggleStyleChanged" />
            </div>
            <div class="col-6">
                <q-input v-model="buttonToggleStyleModel.size" :label="$t('common.size')" placeholder="xs, sm, md, lg, xl" dense outlined @update:model-value="buttonToggleStyleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="buttonToggleStyleModel.spread" label="Spread" @update:model-value="buttonToggleStyleChanged" />
            </div>
            <div class="col-12">
                <q-checkbox v-model="buttonToggleStyleModel.rounded" label="Rounded" @update:model-value="buttonToggleStyleChanged" />
            </div>
            <div class="col-12">
                <q-checkbox v-model="buttonToggleStyleModel.dense" label="Dense" @update:model-value="buttonToggleStyleChanged" />
            </div>

            <!-- Coloring Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>

            <div class="col-6">
                <q-input v-model="buttonToggleStyleModel.color" :label="$t('dashboard.widgetEditor.selectorWidget.buttonToggle.color')" placeholder="secondary, grey, #888888ff" dense outlined @update:model-value="buttonToggleStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="buttonToggleStyleModel.color" format-model="hexa" @update:model-value="buttonToggleStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="buttonToggleStyleModel.textColor" :label="$t('dashboard.widgetEditor.selectorWidget.buttonToggle.textColor')" placeholder="white, black, #000000ff" dense outlined @update:model-value="buttonToggleStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="buttonToggleStyleModel.textColor" format-model="hexa" @update:model-value="buttonToggleStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="buttonToggleStyleModel.toggleColor" :label="$t('dashboard.widgetEditor.selectorWidget.buttonToggle.toggleColor')" placeholder="primary, blue, #0000ffff" dense outlined @update:model-value="buttonToggleStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="buttonToggleStyleModel.toggleColor" format-model="hexa" @update:model-value="buttonToggleStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="buttonToggleStyleModel.toggleTextColor" :label="$t('dashboard.widgetEditor.selectorWidget.buttonToggle.toggleTextColor')" placeholder="white, black, #ffffffff" dense outlined @update:model-value="buttonToggleStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="buttonToggleStyleModel.toggleTextColor" format-model="hexa" @update:model-value="buttonToggleStyleChanged" />
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
import { ISelectorWidgetButtonToggleStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-button-toggle-style',
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<ISelectorWidgetButtonToggleStyle | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            buttonToggleStyleModel: null as ISelectorWidgetButtonToggleStyle | null,
            typeOptions: [
                { label: 'Unelevated', value: 'unelevated' },
                { label: 'Outline', value: 'outline' },
                { label: 'Flat', value: 'flat' }
            ]
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadButtonToggleStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadButtonToggleStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadButtonToggleStyleModel)
        },
        loadButtonToggleStyleModel() {
            if (this.widgetModel?.settings?.style?.buttonToggle) {
                this.buttonToggleStyleModel = this.widgetModel.settings.style.buttonToggle
            } else if (this.themeStyle) {
                this.buttonToggleStyleModel = this.themeStyle
            }
        },
        buttonToggleStyleChanged() {
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
