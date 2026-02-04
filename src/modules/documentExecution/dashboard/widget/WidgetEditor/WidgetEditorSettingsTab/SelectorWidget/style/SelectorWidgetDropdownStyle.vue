<template>
    <div v-if="dropdownStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Design Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>
            <div class="col-12">
                <q-btn-toggle v-model="dropdownStyleModel.shape" :options="shapeOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="dropdownStyleChanged" />
            </div>
            <div class="col-12">
                <q-btn-toggle v-model="dropdownStyleModel.type" :options="typeOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="dropdownStyleChanged" />
            </div>

            <!-- Dense Options -->
            <div class="col-12">
                <q-checkbox v-model="dropdownStyleModel.dense" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.dense')" @update:model-value="dropdownStyleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="dropdownStyleModel.denseOptions" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.denseOptions')" @update:model-value="dropdownStyleChanged" />
            </div>

            <!-- Dark Mode -->
            <div class="col-12">
                <q-checkbox v-model="dropdownStyleModel.darkMode" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.darkMode')" @update:model-value="dropdownStyleChanged" />
            </div>

            <!-- Coloring Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>

            <div class="col-6">
                <q-input v-model="dropdownStyleModel.color" :label="$t('common.color')" placeholder="red, #ff0000ff, #ff000080" dense outlined @update:model-value="dropdownStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="dropdownStyleModel.color" format-model="hexa" @update:model-value="dropdownStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="dropdownStyleModel.bgColor" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.bgColor')" placeholder="red, #ff0000ff, #ff000080" dense outlined @update:model-value="dropdownStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="dropdownStyleModel.bgColor" format-model="hexa" @update:model-value="dropdownStyleChanged" />
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
import { ISelectorWidgetDropdownStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-dropdown-style',
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ISelectorWidgetDropdownStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            dropdownStyleModel: null as ISelectorWidgetDropdownStyle | null,
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
        this.loadDropdownStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadDropdownStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadDropdownStyleModel)
        },
        loadDropdownStyleModel() {
            if (this.widgetModel?.settings?.style?.dropdown) {
                this.dropdownStyleModel = this.widgetModel.settings.style.dropdown
            } else if (this.themeStyle) {
                this.dropdownStyleModel = this.themeStyle
            }
        },
        dropdownStyleChanged() {
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
