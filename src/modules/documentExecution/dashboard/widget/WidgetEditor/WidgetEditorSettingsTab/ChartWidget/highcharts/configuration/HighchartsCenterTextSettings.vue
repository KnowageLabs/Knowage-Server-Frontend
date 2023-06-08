<template>
    <div v-if="centerTextSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ centerTextSettings }}
        </div>
        <div class="p-col-9 p-fluid">
            <label class="kn-material-input-label">{{ $t('common.text') }}</label>
            <div class="p-d-flex p-flex-row p-ai-center">
                <InputText v-model="centerTextSettings.text" class="kn-material-input p-inputtext-sm" />
                <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.legend.formatHint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
            </div>
        </div>
        <div class="p-col-3"></div>

        <div class="p-col-12 p-py-4">
            <WidgetEditorStyleToolbar :options="descriptor.centerTextSettingsStyleToolbarOptions" :prop-model="toolbarModel" @change="onStyleToolbarChange"> </WidgetEditorStyleToolbar>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '../../../../../../Dashboard'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import descriptor from './HighchartsConfigurationDescriptor.json'

export default defineComponent({
    name: 'hihgcharts-center-text-settings',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            centerTextSettings: null as any,
            toolbarModel: {} as { 'font-family': string; 'font-size': string; 'font-style': string; 'font-weight': string; color: string; 'background-color': string },
            advancedVisible: false
        }
    },
    created() {
        this.loadCenterTextSettings()
    },
    methods: {
        loadCenterTextSettings() {
            this.centerTextSettings = this.widgetModel.settings.centerText ?? { text: '', style: { 'font-family': '', 'font-size': '14px', 'font-weight': '', color: '', 'background-color': '' } }
            this.loadToolbarModel()
        },
        loadToolbarModel() {
            if (this.centerTextSettings) {
                this.toolbarModel = {
                    'font-family': this.centerTextSettings.style.fontFamily,
                    'font-size': this.centerTextSettings.style.fontSize,
                    'font-style': this.centerTextSettings.style.fontStyle,
                    'font-weight': this.centerTextSettings.style.fontWeight,
                    color: this.centerTextSettings.style.color,
                    'background-color': this.centerTextSettings.style.backgroundColor
                }
            }
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.centerTextSettings) return
            this.centerTextSettings.style['font-family'] = model['font-family'] ?? ''
            this.centerTextSettings.style['font-size'] = model['font-size'] ?? '14px'
            this.centerTextSettings.style['font-style'] = model['font-style'] ?? ''
            this.centerTextSettings.style['font-weight'] = model['font-weight'] ?? ''
            this.centerTextSettings.style.color = model.color ?? ''
            this.centerTextSettings.style['background-color'] = model['background-color'] ?? ''
            this.toolbarModel = {
                'font-family': model['font-family'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-style': model['font-style'] ?? '',
                'font-weight': model['font-weight'] ?? '',
                color: model.color ?? '',
                'background-color': model['background-color'] ?? ''
            }
        }
    }
})
</script>
