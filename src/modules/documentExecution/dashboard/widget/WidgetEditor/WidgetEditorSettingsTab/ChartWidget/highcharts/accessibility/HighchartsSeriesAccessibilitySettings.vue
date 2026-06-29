<template>
    <div v-if="model" class="q-px-md q-pb-sm">
        <!-- Global section (index 0 — "all series") shown only when allSeriesOptionEnabled -->
        <template v-if="allSeriesOptionEnabled && seriesSettings.length > 0">
            <div class="q-mb-md">
                <div class="row no-wrap items-center q-col-gutter-sm q-mb-sm">
                    <div class="col">
                        <q-select :model-value="seriesSettings[0].names[0]" :options="descriptor.allSerieOption" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.series.title')" outlined dense disable />
                    </div>
                    <div class="col-auto">
                        <q-toggle v-model="seriesSettings[0].accessibility.enabled" :label="$t('common.enabled')" dense @update:model-value="modelChanged" />
                    </div>
                </div>
                <div class="row q-mb-sm">
                    <div class="col-12">
                        <q-input v-model="seriesSettings[0].accessibility.description" :label="$t('common.description')" type="textarea" outlined dense autogrow maxlength="250" :disable="!seriesSettings[0].accessibility.enabled" @change="modelChanged" />
                    </div>
                </div>
                <div class="row q-gutter-x-md q-mb-sm">
                    <q-toggle v-model="seriesSettings[0].accessibility.exposeAsGroupOnly" :disable="!seriesSettings[0].accessibility.enabled" :label="$t('dashboard.widgetEditor.accessibility.exposeAsGroupOnly')" dense @update:model-value="modelChanged">
                        <q-tooltip>{{ $t('dashboard.widgetEditor.accessibility.exposeAsGroupOnlyHint') }}</q-tooltip>
                    </q-toggle>
                    <q-toggle v-model="seriesSettings[0].accessibility.keyboardNavigation.enabled" :disable="!seriesSettings[0].accessibility.enabled" :label="$t('dashboard.widgetEditor.accessibility.enabelKeyboardNavigation')" dense @update:model-value="modelChanged" />
                </div>
            </div>

            <q-separator class="q-mb-xs" />

            <!-- Per-series overrides header + add button -->
            <div class="row items-center justify-between q-mb-xs">
                <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.accessibility.perSeriesOverrides') }}</span>
                <q-btn flat round dense color="primary" icon="add" @click="addSerieSetting" />
            </div>
        </template>

        <!-- Per-series list (index 1+ when allSeriesOptionEnabled, all items when !allSeriesOptionEnabled) -->
        <!--
            For chart types where allSeriesOptionEnabled = false (pie, solidgauge, sunburst, treemap, sankey, etc.),
            each measure maps to a discrete visual element rather than a shared series, so there is no "all series"
            concept. In the old app this section had no add/delete controls — the first series was hardcoded and
            users had no way to manage per-series overrides. That was a limitation, not intentional design, so we
            now show + on the first card and delete on subsequent ones, consistent with how SeriesLabelSettings works.
        -->
        <div v-for="(serieSetting, listIndex) in perSeriesSettings" :key="listIndex" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row no-wrap items-center q-col-gutter-sm q-mb-sm">
                    <div class="col">
                        <HighchartsSeriesMultiselect :value="serieSetting.names" :available-series-options="availableSeriesOptions" :disabled="false" @change="onSeriesSelected($event, serieSetting)" />
                    </div>
                    <div class="col-auto">
                        <q-toggle v-model="serieSetting.accessibility.enabled" :label="$t('common.enabled')" dense @update:model-value="modelChanged" />
                    </div>
                </div>
                <div class="row q-mb-sm">
                    <div class="col-12">
                        <q-input v-model="serieSetting.accessibility.description" :label="$t('common.description')" type="textarea" outlined dense autogrow maxlength="250" :disable="!serieSetting.accessibility.enabled" @change="modelChanged" />
                    </div>
                </div>
                <div class="row q-gutter-x-md">
                    <q-toggle v-model="serieSetting.accessibility.exposeAsGroupOnly" :disable="!serieSetting.accessibility.enabled" :label="$t('dashboard.widgetEditor.accessibility.exposeAsGroupOnly')" dense @update:model-value="modelChanged">
                        <q-tooltip>{{ $t('dashboard.widgetEditor.accessibility.exposeAsGroupOnlyHint') }}</q-tooltip>
                    </q-toggle>
                    <q-toggle v-model="serieSetting.accessibility.keyboardNavigation.enabled" :disable="!serieSetting.accessibility.enabled" :label="$t('dashboard.widgetEditor.accessibility.enabelKeyboardNavigation')" dense @update:model-value="modelChanged" />
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <!-- when allSeriesOptionEnabled: + is in the section header, cards only have delete -->
                <!-- when !allSeriesOptionEnabled: first card gets +, rest get delete -->
                <q-btn v-if="!allSeriesOptionEnabled && listIndex === 0" flat round dense icon="add_circle" size="sm" @click="addSerieSetting()" />
                <q-btn v-else flat round dense icon="delete" size="sm" @click="removeSerieSetting(allSeriesOptionEnabled ? listIndex + 1 : listIndex)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '../../../../../../Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IHighchartsChartModel, ISerieAccessibilitySetting } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import HighchartsSeriesMultiselect from '../common/HighchartsSeriesMultiselect.vue'
import * as highchartsDefaultValues from '../../../../helpers/chartWidget/highcharts/HighchartsDefaultValues'

export default defineComponent({
    name: 'hihgcharts-series-accessibility-settings',
    components: { HighchartsSeriesMultiselect },
    props: { propWidgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            widgetModel: {} as IWidget,
            model: null as IHighchartsChartModel | null,
            availableSeriesOptions: [] as string[]
        }
    },
    computed: {
        allSeriesOptionEnabled(): boolean {
            return !!this.model && !['pie', 'solidgauge', 'sunburst', 'treemap', 'dependencywheel', 'sankey', 'pictorial', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall', 'scatter'].includes(this.model.chart.type)
        },
        seriesSettings(): ISerieAccessibilitySetting[] {
            return this.widgetModel.settings?.accesssibility?.seriesAccesibilitySettings ?? []
        },
        perSeriesSettings(): ISerieAccessibilitySetting[] {
            return this.allSeriesOptionEnabled ? this.seriesSettings.slice(1) : this.seriesSettings
        }
    },
    watch: {
        propWidgetModel() {
            this.loadWidgetModel()
        }
    },
    created() {
        this.setEventListeners()
        this.loadWidgetModel()
        this.loadModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        loadWidgetModel() {
            this.widgetModel = this.propWidgetModel
        },
        setEventListeners() {
            emitter.on('seriesAdded', this.loadModel)
            emitter.on('seriesRemoved', this.loadModel)
            emitter.on('chartTypeChanged', this.onChartTypeChanged)
        },
        removeEventListeners() {
            emitter.off('seriesAdded', this.loadModel)
            emitter.off('seriesRemoved', this.loadModel)
            emitter.off('chartTypeChanged', this.onChartTypeChanged)
        },
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            // Ensure the settings array exists on the widget model
            if (!this.widgetModel.settings.accesssibility) (this.widgetModel.settings as any).accesssibility = { seriesAccesibilitySettings: [] }
            if (!this.widgetModel.settings.accesssibility.seriesAccesibilitySettings) this.widgetModel.settings.accesssibility.seriesAccesibilitySettings = []
            this.loadSeriesOptions()
            this.removeSeriesFromAvailableOptions()
            this.removeAllSerieSettingsFromModel()
            if (this.seriesSettings.length === 0) this.addFirstSeriesSetting()
            if (!this.allSeriesOptionEnabled) {
                // Remove "all" entry if chart type no longer supports it
                while (this.seriesSettings.length > 0 && this.seriesSettings[0].names[0] === 'all') {
                    this.seriesSettings.splice(0, 1)
                }
            }
        },
        removeAllSerieSettingsFromModel() {
            if (this.seriesSettings[0]?.names[0] === 'all' && !this.allSeriesOptionEnabled) {
                this.seriesSettings.splice(0, 1)
            }
        },
        removeSeriesFromAvailableOptions() {
            for (let i = 1; i < this.seriesSettings.length; i++) {
                for (let j = 0; j < this.seriesSettings[i].names.length; j++) {
                    this.removeSerieFromAvailableOptions(this.seriesSettings[i].names[j])
                }
            }
        },
        removeSerieFromAvailableOptions(seriesName: string) {
            const index = this.availableSeriesOptions.findIndex((s: string) => s === seriesName)
            if (index !== -1) this.availableSeriesOptions.splice(index, 1)
        },
        loadSeriesOptions() {
            this.availableSeriesOptions = []
            if (!this.widgetModel) return
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                if (column.fieldType === 'MEASURE' && (!column.axis || ['Y', 'start'].includes(column.axis))) this.availableSeriesOptions.push(column.columnName)
            })
        },
        addFirstSeriesSetting() {
            if (!this.model || this.availableSeriesOptions.length < 1) return
            const name = this.allSeriesOptionEnabled ? 'all' : this.availableSeriesOptions[0]
            const entry = { names: [name], accessibility: { ...highchartsDefaultValues.getDefaultSerieAccessibilitySetting() } } as ISerieAccessibilitySetting
            // Push to the shared array directly (seriesSettings IS the widget model array)
            this.seriesSettings.push(entry)
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onSeriesSelected(event: any, serieSetting: ISerieAccessibilitySetting) {
            const removed = serieSetting.names.filter((el: string) => !event.value.includes(el))
            serieSetting.names = event.value
            removed.length > 0 ? removed.forEach((n: string) => this.availableSeriesOptions.push(n)) : this.onSeriesAddedFromMultiselect(serieSetting)
            this.modelChanged()
        },
        onSeriesAddedFromMultiselect(serieSetting: ISerieAccessibilitySetting) {
            serieSetting.names.forEach((serieName: string) => {
                const index = this.availableSeriesOptions.findIndex((s: string) => s === serieName)
                if (index !== -1) this.availableSeriesOptions.splice(index, 1)
            })
        },
        addSerieSetting() {
            // Push only once — seriesSettings is the widget model array (computed prop)
            const entry = { names: [], accessibility: highchartsDefaultValues.getDefaultSeriesAccessibilitySettings() } as ISerieAccessibilitySetting
            this.seriesSettings.push(entry)
        },
        removeSerieSetting(index: number) {
            this.seriesSettings[index].names.forEach((n: string) => this.availableSeriesOptions.push(n))
            this.seriesSettings.splice(index, 1)
            this.modelChanged()
        },
        onChartTypeChanged() {
            this.widgetModel.settings.accesssibility.seriesAccesibilitySettings = []
            this.loadModel()
        }
    }
})
</script>

<style scoped lang="scss">
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
