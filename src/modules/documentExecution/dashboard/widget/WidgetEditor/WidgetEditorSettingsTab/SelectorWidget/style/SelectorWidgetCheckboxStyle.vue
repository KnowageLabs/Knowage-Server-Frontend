<template>
    <div v-if="checkboxStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Size Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.size') }}</label>
            <div class="col-12">
                <q-input v-model="checkboxStyleModel.size" :label="$t('common.size')" placeholder="sm, md, lg, 4px, 6rem" dense outlined @change="checkboxStyleChanged" />
            </div>

            <!-- Layout Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.layout') }}</label>

            <div class="col-12">
                <q-btn-toggle v-model="checkboxStyleModel.layout" :options="translatedLayoutOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="checkboxStyleChanged" />
            </div>

            <!-- Grid Columns (visible only for grid layout) -->
            <div v-if="checkboxStyleModel.layout === 'grid'" class="col-12">
                <q-input v-model.number="checkboxStyleModel.gridColumns" :label="$t('common.columns')" type="number" placeholder="2" dense outlined @update:model-value="checkboxStyleChanged" />
            </div>

            <!-- Spacing Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.spacing') }}</label>

            <div class="col-6">
                <q-input v-model="checkboxStyleModel.padding" :label="$t('common.padding')" placeholder="4px, 6rem" dense outlined @change="checkboxStyleChanged" />
            </div>

            <div class="col-6">
                <q-input v-model="checkboxStyleModel.margin" :label="$t('common.margin')" placeholder="4px, 6rem" dense outlined @change="checkboxStyleChanged" />
            </div>

            <!-- #region -- Custom Icons Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.buttons') }}</label>

            <div class="col-6">
                <q-input v-model="checkboxStyleModel.icon" :label="$t('dashboard.widgetEditor.selectorWidget.radio.uncheckedIcon')" placeholder="panorama_fish_eye" dense outlined @update:model-value="checkboxStyleChanged">
                    <template #prepend>
                        <q-icon v-if="checkboxStyleModel.icon" :name="checkboxStyleModel.icon" />
                    </template>
                    <template #append>
                        <q-icon name="search" class="cursor-pointer" @click.stop="openIconPicker('icon')" />
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="checkboxStyleModel.checkedIcon" :label="$t('dashboard.widgetEditor.selectorWidget.radio.checkedIcon')" placeholder="check_box" dense outlined @update:model-value="checkboxStyleChanged">
                    <template #prepend>
                        <q-icon v-if="checkboxStyleModel.checkedIcon" :name="checkboxStyleModel.checkedIcon" />
                    </template>
                    <template #append>
                        <q-icon name="search" class="cursor-pointer" @click.stop="openIconPicker('checkedIcon')" />
                    </template>
                </q-input>
            </div>

            <div class="col-12">
                <q-input v-model="checkboxStyleModel.color" :label="$t('common.color')" dense outlined @update:model-value="checkboxStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="checkboxStyleModel.color" format-model="hexa" @update:model-value="checkboxStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-12">
                <q-checkbox v-model="checkboxStyleModel.keepColor" :label="$t('dashboard.widgetEditor.selectorWidget.radio.keepColor')" @update:model-value="checkboxStyleChanged" />
            </div>
            <!-- #endregion -->

            <!-- Label Style Section -->
            <label v-if="checkboxStyleModel.label" class="kn-material-input-label section-label col-12">{{ $t('common.label') }}</label>

            <div v-if="checkboxStyleModel.label" class="col-12">
                <WidgetEditorStyleToolbar :options="descriptor.labelToolbarStyleOptions" :prop-model="checkboxStyleModel.label" :disabled="false" @change="onLabelStyleToolbarChange" />
            </div>
        </div>

        <!-- Icon Picker Dialog -->
        <WidgetEditorStyleIconPickerDialog v-if="iconPickerVisible" :prop-model="currentIconModel" used-from="checkbox" @close="iconPickerVisible = false" @save="onIconSelected" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetCheckboxStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from './SelectorWidgetStyleDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import WidgetEditorStyleIconPickerDialog from '../../common/styleToolbar/WidgetEditorStyleIconPickerDialog.vue'
import { IIcon } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'selector-widget-checkbox-style',
    components: { WidgetEditorStyleToolbar, WidgetEditorStyleIconPickerDialog },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ISelectorWidgetCheckboxStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            checkboxStyleModel: null as ISelectorWidgetCheckboxStyle | null,
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
        this.loadCheckboxStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadCheckboxStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadCheckboxStyleModel)
        },
        loadCheckboxStyleModel() {
            if (this.widgetModel?.settings?.style?.checkbox) {
                this.checkboxStyleModel = this.widgetModel.settings.style.checkbox
            } else if (this.themeStyle) {
                this.checkboxStyleModel = this.themeStyle
            }
        },
        checkboxStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onLabelStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.checkboxStyleModel?.label) return
            this.checkboxStyleModel.label = {
                'font-weight': model['font-weight'] ?? '',
                'font-style': model['font-style'] ?? '',
                'font-size': model['font-size'] ?? '',
                'font-family': model['font-family'] ?? '',
                color: model.color ?? 'rgba(0, 0, 0, 1)',
                'background-color': ''
            }
            this.checkboxStyleChanged()
        },
        openIconPicker(iconKey: string) {
            this.currentIconKey = iconKey
            this.currentIconModel = { className: this.checkboxStyleModel?.[iconKey] || '' }
            this.iconPickerVisible = true
        },
        onIconSelected(icon: IIcon) {
            if (!this.checkboxStyleModel) return
            this.checkboxStyleModel[this.currentIconKey] = icon.className
            this.iconPickerVisible = false
            this.checkboxStyleChanged()
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
