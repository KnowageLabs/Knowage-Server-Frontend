<template>
    <div v-if="multiDropdownStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Design Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>
            <div class="col-12">
                <q-btn-toggle v-model="multiDropdownStyleModel.shape" :options="shapeOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="multiDropdownStyleChanged" />
            </div>
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.selectorWidget.multiDropdown.variant') }}</label>
            <div class="col-12">
                <q-btn-toggle v-model="multiDropdownStyleModel.type" :options="typeOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="multiDropdownStyleChanged" />
            </div>
            <label class="kn-material-input-label section-label col-12">{{ $t('common.options') }}</label>
            <div class="col-6">
                <q-checkbox v-model="multiDropdownStyleModel.dense" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.dense')" @update:model-value="multiDropdownStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="multiDropdownStyleModel.denseOptions" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.denseOptions')" @update:model-value="multiDropdownStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="multiDropdownStyleModel.counter" :label="$t('dashboard.widgetEditor.selectorWidget.multiDropdown.counter')" @update:model-value="multiDropdownStyleChanged" />
            </div>
            <div class="col-6">
                <q-checkbox v-model="multiDropdownStyleModel.chips" :label="$t('dashboard.widgetEditor.selectorWidget.multiDropdown.chips')" @update:model-value="multiDropdownStyleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="multiDropdownStyleModel.darkMode" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.darkMode')" @update:model-value="multiDropdownStyleChanged" />
            </div>
            <div class="col-6">
                <q-input v-model.number="multiDropdownStyleModel.maxValues" type="number" min="0" :label="$t('dashboard.widgetEditor.selectorWidget.multiDropdown.max')" outlined dense @update:model-value="multiDropdownStyleChanged" />
            </div>
            <div class="col-6">
                <q-input v-model="multiDropdownStyleModel.hint" type="text" :label="$t('dashboard.widgetEditor.selectorWidget.multiDropdown.hint')" outlined dense @update:model-value="multiDropdownStyleChanged" />
            </div>

            <!-- Coloring Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>

            <div class="col-6">
                <q-input v-model="multiDropdownStyleModel.color" :label="$t('common.color')" placeholder="red, #ff0000ff, #ff000080" dense outlined @update:model-value="multiDropdownStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="multiDropdownStyleModel.color" format-model="hexa" @update:model-value="multiDropdownStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="multiDropdownStyleModel.bgColor" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.bgColor')" placeholder="red, #ff0000ff, #ff000080" dense outlined @update:model-value="multiDropdownStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="multiDropdownStyleModel.bgColor" format-model="hexa" @update:model-value="multiDropdownStyleChanged" />
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
import { ISelectorWidgetMultiDropdownStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-multi-dropdown-style',
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ISelectorWidgetMultiDropdownStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            multiDropdownStyleModel: null as ISelectorWidgetMultiDropdownStyle | null,
            shapeOptions: [
                { label: 'Standard', value: 'standard' },
                { label: 'Rounded', value: 'rounded' },
                { label: 'Squared', value: 'squared' }
            ],
            typeOptions: [
                { label: 'Filled', value: 'filled' },
                { label: 'Outlined', value: 'outlined' },
                { label: 'Borderless', value: 'borderless' }
            ]
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadMultiDropdownStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadMultiDropdownStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadMultiDropdownStyleModel)
        },
        loadMultiDropdownStyleModel() {
            if (this.widgetModel?.settings?.style?.multiDropdown) {
                this.multiDropdownStyleModel = this.widgetModel.settings.style.multiDropdown
            } else if (this.themeStyle) {
                this.multiDropdownStyleModel = this.themeStyle
            }
        },
        multiDropdownStyleChanged() {
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
