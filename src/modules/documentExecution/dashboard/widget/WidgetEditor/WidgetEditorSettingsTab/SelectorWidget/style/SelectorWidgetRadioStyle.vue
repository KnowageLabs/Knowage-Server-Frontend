<template>
    <div v-if="radioStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Layout Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.layout') }}</label>

            <div class="col-12">
                <q-btn-toggle v-model="radioStyleModel.layout" :options="translatedLayoutOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="radioStyleChanged" />
            </div>
            <div v-if="radioStyleModel.layout === 'grid'" class="col-12">
                <q-input v-model.number="radioStyleModel.gridColumns" :label="$t('common.columns')" type="number" placeholder="2" dense outlined @update:model-value="radioStyleChanged" />
            </div>

            <div class="col-12">
                <q-input v-model="radioStyleModel.size" :label="$t('common.size')" placeholder="sm, md, lg, 4px, 6rem" dense outlined @change="radioStyleChanged" />
            </div>
            <div class="col-6">
                <q-input v-model="radioStyleModel.padding" :label="$t('common.padding')" placeholder="4px, 6rem" dense outlined @change="radioStyleChanged" />
            </div>

            <div class="col-6">
                <q-input v-model="radioStyleModel.margin" :label="$t('common.margin')" placeholder="4px, 6rem" dense outlined @change="radioStyleChanged" />
            </div>

            <!--  Custom Icons Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.buttons') }}</label>

            <div class="col-6">
                <q-input v-model="radioStyleModel.checkedIcon" :label="$t('dashboard.widgetEditor.selectorWidget.radio.checkedIcon')" placeholder="task_alt" dense outlined @update:model-value="radioStyleChanged">
                    <template #prepend>
                        <q-icon v-if="radioStyleModel.checkedIcon" :name="radioStyleModel.checkedIcon" />
                    </template>
                    <template #append>
                        <q-icon name="search" class="cursor-pointer" @click.stop="openIconPicker('checkedIcon')" />
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="radioStyleModel.icon" :label="$t('dashboard.widgetEditor.selectorWidget.radio.uncheckedIcon')" placeholder="panorama_fish_eye" dense outlined @update:model-value="radioStyleChanged">
                    <template #prepend>
                        <q-icon v-if="radioStyleModel.icon" :name="radioStyleModel.icon" />
                    </template>
                    <template #append>
                        <q-icon name="search" class="cursor-pointer" @click.stop="openIconPicker('icon')" />
                    </template>
                </q-input>
            </div>

            <div class="col-12">
                <q-input v-model="radioStyleModel.color" :label="$t('common.color')" placeholder="red, #ff0000ff, #ff000080" dense outlined @update:model-value="radioStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="radioStyleModel.color" format-model="hexa" @update:model-value="radioStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-12">
                <q-checkbox v-model="radioStyleModel.keepColor" :label="$t('dashboard.widgetEditor.selectorWidget.radio.keepColor')" @update:model-value="radioStyleChanged" />
            </div>

            <!-- Label Style Section -->
            <label v-if="radioStyleModel.label" class="kn-material-input-label section-label col-12">{{ $t('common.label') }}</label>

            <div v-if="radioStyleModel.label" class="col-12">
                <WidgetEditorStyleToolbar :options="descriptor.labelToolbarStyleOptions" :prop-model="radioStyleModel.label" :disabled="false" @change="onLabelStyleToolbarChange" />
            </div>
        </div>

        <!-- Icon Picker Dialog -->
        <WidgetEditorStyleIconPickerDialog v-if="iconPickerVisible" :prop-model="currentIconModel" used-from="radio" @close="iconPickerVisible = false" @save="onIconSelected" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetRadioStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from './SelectorWidgetStyleDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import WidgetEditorStyleIconPickerDialog from '../../common/styleToolbar/WidgetEditorStyleIconPickerDialog.vue'
import { IIcon } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'selector-widget-radio-style',
    components: { WidgetEditorStyleToolbar, WidgetEditorStyleIconPickerDialog },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ISelectorWidgetRadioStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            radioStyleModel: null as ISelectorWidgetRadioStyle | null,
            iconPickerVisible: false,
            currentIconKey: '' as string,
            currentIconModel: { className: '' } as any
        }
    },
    computed: {
        translatedLayoutOptions(): any[] {
            return [
                { label: this.$t('common.column'), value: 'column' },
                { label: this.$t('common.row'), value: 'row' },
                { label: this.$t('common.grid'), value: 'grid' }
            ]
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadRadioStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadRadioStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadRadioStyleModel)
        },
        loadRadioStyleModel() {
            if (this.widgetModel?.settings?.style?.radio) {
                this.radioStyleModel = this.widgetModel.settings.style.radio
            } else if (this.themeStyle) {
                this.radioStyleModel = this.themeStyle
            }
        },
        radioStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onLabelStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.radioStyleModel?.label) return
            this.radioStyleModel.label = {
                'font-weight': model['font-weight'] ?? '',
                'font-style': model['font-style'] ?? '',
                'font-size': model['font-size'] ?? '',
                'font-family': model['font-family'] ?? '',
                color: model.color ?? 'rgba(0, 0, 0, 1)',
                'background-color': ''
            }
            this.radioStyleChanged()
        },
        openIconPicker(iconKey: string) {
            this.currentIconKey = iconKey
            this.currentIconModel = { className: this.radioStyleModel?.[iconKey] || '' }
            this.iconPickerVisible = true
        },
        onIconSelected(icon: IIcon) {
            if (!this.radioStyleModel) return
            this.radioStyleModel[this.currentIconKey] = icon.className
            this.iconPickerVisible = false
            this.radioStyleChanged()
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
