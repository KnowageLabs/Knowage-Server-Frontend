<template>
    <div v-if="centerTextSettings" class="q-px-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-12">
                <q-input v-model="centerTextSettings.text" :label="$t('common.text')" outlined dense :hint="$t('dashboard.widgetEditor.highcharts.legend.formatHint')" />
            </div>
        </div>
        <div class="row q-mb-md">
            <div class="col-12">
                <WidgetEditorStyleToolbar :options="descriptor.centerTextSettingsStyleToolbarOptions" :prop-model="toolbarModel" @change="onStyleToolbarChange" />
            </div>
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
            toolbarModel: {} as { 'font-family': string; 'font-size': string; 'font-style': string; 'font-weight': string; color: string },
            advancedVisible: false
        }
    },
    created() {
        this.loadCenterTextSettings()
    },
    methods: {
        loadCenterTextSettings() {
            this.centerTextSettings = this.widgetModel.settings.configuration.centerText ?? { text: '', style: { 'font-family': '', 'font-size': '14px', 'font-weight': '', color: '' } }
            this.loadToolbarModel()
        },
        loadToolbarModel() {
            if (this.centerTextSettings) {
                this.toolbarModel = {
                    'font-family': this.centerTextSettings.style.fontFamily,
                    'font-size': this.centerTextSettings.style.fontSize,
                    'font-style': this.centerTextSettings.style.fontStyle,
                    'font-weight': this.centerTextSettings.style.fontWeight,
                    color: this.centerTextSettings.style.color
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
            this.toolbarModel = {
                'font-family': model['font-family'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-style': model['font-style'] ?? '',
                'font-weight': model['font-weight'] ?? '',
                color: model.color ?? ''
            }
        }
    }
})
</script>
