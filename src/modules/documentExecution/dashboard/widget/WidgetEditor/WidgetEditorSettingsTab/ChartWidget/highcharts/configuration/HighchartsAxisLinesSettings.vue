<template>
    <div v-if="axisLinesSettings" class="q-px-md q-pb-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div v-if="chartType !== 'streamgraph'" class="col">
                <WidgetEditorColorPicker :initial-value="axisLinesSettings.color" :label="$t('common.color')" @change="onSelectionColorChanged($event, 'color')" />
            </div>
            <div class="col">
                <WidgetEditorColorPicker :initial-value="axisLinesSettings.crosshairColor" :label="$t('dashboard.widgetEditor.highcharts.axisLines.crosshairColor')" @change="onSelectionColorChanged($event, 'crosshairColor')" />
            </div>
            <div class="col">
                <q-input v-model.number="axisLinesSettings.crosshairWidth" type="number" :label="$t('dashboard.widgetEditor.highcharts.axisLines.crosshairWidth')" outlined dense />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'highcharts-axis-lines-settings',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            axisLinesSettings: null as any
        }
    },
    computed: {
        chartType() {
            return this.widgetModel?.settings.chartModel?.model?.chart.type
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
        onSelectionColorChanged(event: string | null, property: string) {
            if (!event || !property) return
            this.axisLinesSettings[property] = event
        }
    }
})
</script>
