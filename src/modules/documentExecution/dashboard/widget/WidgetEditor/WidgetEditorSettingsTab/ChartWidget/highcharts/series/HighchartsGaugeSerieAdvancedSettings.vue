<template>
    <div v-if="serieSettings && serieSettings.pivot && serieSettings.dial" class="q-pb-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-4">
                <q-input v-model.number="dialRadius" type="number" :label="$t('dashboard.widgetEditor.highcharts.dial.dialRadius')" outlined dense :disable="disabled" @blur="onRadiusChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.dial.dialRadiusHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-4">
                <q-input v-model.number="serieSettings.dial.baseWidth" type="number" :label="$t('dashboard.widgetEditor.highcharts.dial.dialBaseWitdh')" outlined dense :disable="disabled" @blur="modelChanged" />
            </div>
            <div class="col-4">
                <q-input v-model.number="serieSettings.pivot.radius" type="number" :label="$t('dashboard.widgetEditor.highcharts.pivot.pivotRadius')" outlined dense :disable="disabled" @blur="modelChanged">
                    <template #append>
                        <q-icon name="help_outline" size="xs" class="cursor-pointer">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.pivot.pivotRadiusHint') }}</q-tooltip>
                        </q-icon>
                    </template>
                </q-input>
            </div>
        </div>
        <div class="row q-col-gutter-sm">
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="serieSettings.dial.backgroundColor" :label="$t('dashboard.widgetEditor.highcharts.dial.dialColor')" :disabled="disabled" @change="onSelectionColorChanged($event, 'dial')" />
            </div>
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="serieSettings.pivot.backgroundColor" :label="$t('dashboard.widgetEditor.highcharts.pivot.pivotColor')" :disabled="disabled" @change="onSelectionColorChanged($event, 'pivot')" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IHighchartsSeriesLabelsSetting } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'hihgcharts-gauge-serie-advanced-settings',
    components: { WidgetEditorColorPicker },
    props: { serieSettingsProp: { type: Object as PropType<IHighchartsSeriesLabelsSetting>, required: true }, disabled: { type: Boolean, required: true } },
    emits: ['modelChanged'],
    data() {
        return {
            serieSettings: null as IHighchartsSeriesLabelsSetting | null,
            dialRadius: 0
        }
    },
    watch: {
        seriesSettingsProp() {
            this.loadSerieSettings()
        }
    },
    created() {
        this.loadSerieSettings()
    },

    methods: {
        loadSerieSettings() {
            this.serieSettings = this.serieSettingsProp
            this.loadDialRadius()
        },
        loadDialRadius() {
            if (!this.serieSettings) return
            this.dialRadius = this.serieSettings.dial?.radius ? +this.serieSettings.dial.radius.trim().replace('%', '') : 0
        },
        modelChanged() {
            setTimeout(() => this.$emit('modelChanged'), 250)
        },
        onRadiusChanged() {
            setTimeout(() => {
                if (!this.serieSettings || !this.serieSettings.dial) return
                this.serieSettings.dial.radius = this.dialRadius + '%'
                this.modelChanged()
            }, 250)
        },
        onSelectionColorChanged(event: string | null, type: 'dial' | 'pivot') {
            if (!event || !this.serieSettings) return
            const radiusTypeSettings = this.serieSettings[type]
            if (radiusTypeSettings) {
                radiusTypeSettings.backgroundColor = event
                this.modelChanged()
            }
        }
    }
})
</script>
