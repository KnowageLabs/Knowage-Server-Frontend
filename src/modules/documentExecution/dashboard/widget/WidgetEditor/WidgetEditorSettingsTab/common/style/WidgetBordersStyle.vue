<template>
    <div v-if="bordersStyleModel" class="p-ai-center kn-flex p-p-4">
        <span v-if="themeManagerMode" class="p-d-flex p-flex-row p-ai-center p-mb-2"> {{ $t('common.enabled') }} <q-toggle v-model="bordersStyleModel.enabled" color="black" /> </span>

        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12 p-md-12 p-lg-4">
                <span class="p-float-label">
                    <Dropdown v-model="bordersStyleModel.properties['border-style']" class="kn-material-input p-inputtext-sm" :options="descriptor.bordersStyleOptions" option-value="value" :disabled="bordersStyleDisabled" @change="bordersStyleChanged">
                        <template #value="slotProps">
                            <div>
                                <span>{{ getTranslatedLabel(slotProps.value, descriptor.bordersStyleOptions, $t) }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div>
                                <span>{{ $t(slotProps.option.label) }}</span>
                            </div>
                        </template>
                    </Dropdown>
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.borders.bordersStyle') }}</label>
                </span>
            </div>
            <div class="p-field p-col-12 p-md-6 p-lg-4">
                <span class="p-float-label">
                    <InputText v-model="bordersStyleModel.properties['border-width']" v-tooltip.top="$t('dashboard.widgetEditor.borders.bordersThicknessHint')" class="kn-material-input p-inputtext-sm" :disabled="bordersStyleDisabled" @change="bordersStyleChanged" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.borders.bordersThickness') }}</label>
                    <!-- TODO: Remove commented smalls if not necessary -->
                    <!-- <small>{{ $t('dashboard.widgetEditor.borders.bordersThicknessHint') }}</small> -->
                </span>
            </div>
            <div class="p-field p-col-12 p-md-6 p-lg-4">
                <span class="">
                    <!-- TODO: Fix this shit component holy damn is it bad :<<<< -->
                    <WidgetEditorColorPicker :initial-value="bordersStyleModel.properties['border-color']" :label="$t('dashboard.widgetEditor.borders.bordersColor')" :disabled="bordersStyleDisabled" @change="onSelectionColorChanged"></WidgetEditorColorPicker>
                </span>
            </div>

            <label class="kn-material-input-label p-col-12 p-mb-3" style="color: black !important">{{ $t('dashboard.widgetEditor.borders.borderRadius') }}</label>

            <div class="p-field p-col-12 p-md-6 p-lg-3">
                <span class="p-float-label">
                    <InputText v-model="bordersStyleModel.properties['border-top-left-radius']" v-tooltip.top="$t('dashboard.widgetEditor.inputHintForPixels')" class="kn-material-input p-inputtext-sm" :disabled="bordersStyleDisabled" @change="bordersStyleChanged" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.borders.borderRadiusTopLeft') }}</label>
                    <!-- <small>{{ $t('dashboard.widgetEditor.inputHintForPixels') }}</small> -->
                </span>
            </div>
            <div class="p-field p-col-12 p-md-6 p-lg-3">
                <span class="p-float-label">
                    <InputText v-model="bordersStyleModel.properties['border-top-right-radius']" v-tooltip.top="$t('dashboard.widgetEditor.inputHintForPixels')" class="kn-material-input p-inputtext-sm" :disabled="bordersStyleDisabled" @change="bordersStyleChanged" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.borders.borderRadiusTopRight') }}</label>
                    <!-- <small>{{ $t('dashboard.widgetEditor.inputHintForPixels') }}</small> -->
                </span>
            </div>
            <div class="p-field p-col-12 p-md-6 p-lg-3">
                <span class="p-float-label">
                    <InputText v-model="bordersStyleModel.properties['border-bottom-left-radius']" v-tooltip.top="$t('dashboard.widgetEditor.inputHintForPixels')" class="kn-material-input p-inputtext-sm" :disabled="bordersStyleDisabled" @change="bordersStyleChanged" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.borders.borderRadiusBottomLeft') }}</label>
                    <!-- <small>{{ $t('dashboard.widgetEditor.inputHintForPixels') }}</small> -->
                </span>
            </div>
            <div class="p-field p-col-12 p-md-6 p-lg-3">
                <span class="p-float-label">
                    <InputText v-model="bordersStyleModel.properties['border-bottom-right-radius']" v-tooltip.top="$t('dashboard.widgetEditor.inputHintForPixels')" class="kn-material-input p-inputtext-sm" :disabled="bordersStyleDisabled" @change="bordersStyleChanged" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.borders.borderRadiusBottomRight') }}</label>
                    <!-- <small>{{ $t('dashboard.widgetEditor.inputHintForPixels') }}</small> -->
                </span>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetBordersStyle } from '@/modules/documentExecution/Dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import Dropdown from 'primevue/dropdown'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-borders-style',
    components: { Dropdown, WidgetEditorColorPicker },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        themeManagerMode: { default: false, type: Boolean }
    },
    data() {
        return {
            descriptor,
            bordersStyleModel: null as IWidgetBordersStyle | null,
            widgetType: '' as string,
            getTranslatedLabel
        }
    },
    computed: {
        bordersStyleDisabled() {
            return !this.bordersStyleModel || !this.bordersStyleModel.enabled
        }
    },
    created() {
        this.loadBordersStyle()
    },
    methods: {
        loadBordersStyle() {
            if (!this.widgetModel) return
            this.widgetType = this.widgetModel.type
            if (this.widgetModel?.settings?.style?.borders) this.bordersStyleModel = this.widgetModel.settings.style.borders
        },
        bordersStyleChanged() {
            switch (this.widgetType) {
                case 'table':
                    emitter.emit('refreshTable', this.widgetModel.id)
                    break
                case 'selector':
                    emitter.emit('refreshSelector', this.widgetModel.id)
                    break
                case 'selection':
                    emitter.emit('refreshSelection', this.widgetModel.id)
            }
        },
        onSelectionColorChanged(event: string | null) {
            if (!event || !this.bordersStyleModel) return
            this.bordersStyleModel.properties['border-color'] = event
            this.bordersStyleChanged()
        }
    }
})
</script>
