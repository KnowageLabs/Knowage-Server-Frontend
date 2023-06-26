<template>
    <div v-if="axisLinesSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ 'TODO' }}
            {{ axisLinesSettings }}
        </div>

        <div class="p-col-12 p-md-3">
            <WidgetEditorColorPicker :initial-value="axisLinesSettings.color" :label="$t('common.color')" @change="onSelectionColorChanged($event)"></WidgetEditorColorPicker>
        </div>

        <div class="p-col-12 p-md-3">
            <WidgetEditorColorPicker :initial-value="axisLinesSettings.crosshairColor" :label="$t('dashboard.widgetEditor.highcharts.axisLines.crosshairColor')" @change="onSelectionColorChanged($event)"></WidgetEditorColorPicker>
        </div>

        <div class="p-col-12 p-md-3 p-d-flex p-flex-column p-mb-4">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.axisLines.crosshairWidth') }}</label>
            <InputNumber v-model="axisLinesSettings.crosshairWidth" class="kn-material-input p-inputtext-sm" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import InputNumber from 'primevue/inputnumber'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'highcharts-axis-lines-settings',
    components: { InputNumber, WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            axisLinesSettings: null as any,
            getTranslatedLabel
        }
    },
    created() {
        this.loadAxisLinesModel()
    },
    methods: {
        loadAxisLinesModel() {
            if (this.widgetModel.settings?.configuration?.axisLines) this.axisLinesSettings = this.widgetModel.settings.configuration.axisLines
            else this.axisLinesSettings = { color: '', crosshairColor: '', crosshairWidth: 8 }
        },
        onSelectionColorChanged(event: string | null) {
            if (!event) return
            this.axisLinesSettings.color = event
        }
    }
})
</script>
