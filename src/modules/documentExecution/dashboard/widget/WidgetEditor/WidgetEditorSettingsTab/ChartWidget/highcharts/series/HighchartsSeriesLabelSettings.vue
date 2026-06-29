<template>
    <div v-if="model" class="q-px-md q-pb-sm">
        <div v-for="(serieSetting, index) in seriesSettings" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <!-- Row 1: Series selector -->
                <div class="row q-mb-sm">
                    <div class="col">
                        <q-select v-if="index === 0 && allSeriesOptionEnabled" :model-value="serieSetting.names[0]" :options="descriptor.allSerieOption" option-value="value" option-label="label" emit-value map-options :label="$t('dashboard.widgetEditor.series.title')" outlined dense disable />
                        <HighchartsSeriesMultiselect v-else :value="serieSetting.names" :available-series-options="availableSeriesOptions" :disabled="!allSeriesOptionEnabled" @change="onSeriesSelected($event, serieSetting)" />
                    </div>
                </div>

                <!-- Row 2: toggles -->
                <div class="row q-gutter-xs q-mb-sm">
                    <q-toggle v-if="seriesNameVisible" v-model="serieSetting.showName" :label="$t('dashboard.widgetEditor.series.showSeriesName')" dense @update:model-value="modelChanged" />
                    <div class="col-12 q-my-xs"><q-separator /></div>
                    <q-toggle v-if="labelOptionsVisible" class="col-12" v-model="serieSetting.label.enabled" :label="$t('dashboard.widgetEditor.showLabel')" dense @update:model-value="modelChanged" />
                    <q-toggle v-if="serieColorPickerVisible" v-model="serieSetting.serieColorEnabled" :label="$t('dashboard.widgetEditor.series.enableColor')" dense @update:model-value="modelChanged" />
                    <q-toggle v-if="percentageAvailable" v-model="serieSetting.label.percentage" :disable="!serieSetting.label.enabled" :label="$t('dashboard.widgetEditor.percentage')" dense @update:model-value="modelChanged" />
                    <q-toggle v-if="absoluteVisible" v-model="serieSetting.label.absolute" :disable="!serieSetting.label.enabled" :label="$t('dashboard.widgetEditor.absolute')" dense @update:model-value="modelChanged" />
                </div>

                <!-- Row 3: color picker (activitygauge) -->
                <div v-if="serieColorPickerVisible" class="row q-mb-sm">
                    <div class="col-6">
                        <WidgetEditorColorPicker :initial-value="serieSetting.serieColor" :label="$t('common.color')" :disabled="!serieSetting.serieColorEnabled" @change="onSelectionColorChanged($event, serieSetting)" />
                    </div>
                </div>

                <!-- Row 4: style toolbar -->
                <div v-if="styleToolbarVisible" class="row q-mb-sm">
                    <div class="col-12">
                        <WidgetEditorStyleToolbar :options="descriptor.noDataToolbarStyleOptions" :prop-model="toolbarModels[index]" :disabled="!serieSetting.label.enabled" @change="onStyleToolbarChange($event, index)" />
                    </div>
                </div>

                <!-- Row 5: prefix / suffix / precision / scale -->
                <div v-if="formattingSectionAvailable || scaleVisible" class="row q-col-gutter-sm q-mb-sm">
                    <div v-if="formattingSectionAvailable" class="col-3">
                        <q-input v-model="serieSetting.label.prefix" :label="$t('dashboard.widgetEditor.prefix')" outlined dense :disable="!serieSetting.label.enabled" @change="modelChanged" />
                    </div>
                    <div v-if="formattingSectionAvailable" class="col-3">
                        <q-input v-model="serieSetting.label.suffix" :label="$t('dashboard.widgetEditor.suffix')" outlined dense :disable="!serieSetting.label.enabled" @change="modelChanged" />
                    </div>
                    <div v-if="precisionAvailable" class="col-3">
                        <q-input v-model.number="serieSetting.label.precision" type="number" :label="$t('dashboard.widgetEditor.precision')" outlined dense :disable="!serieSetting.label.enabled" @blur="modelChanged" />
                    </div>
                    <div v-if="scaleVisible" class="col-3">
                        <q-select v-model="serieSetting.label.scale" :label="$t('dashboard.widgetEditor.series.scale')" outlined dense :options="descriptor.scaleOptions" :disable="!serieSetting.label.enabled" @update:model-value="modelChanged">
                            <template #append>
                                <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                                    <q-tooltip>{{ $t('dashboard.widgetEditor.series.scaleHint') }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-select>
                    </div>
                </div>

                <!-- Row 6: advanced section (gauge only) -->
                <div v-if="advancedSectionAvailable" class="row">
                    <div class="col-12">
                        <div class="row items-center justify-center cursor-pointer q-mb-sm" @click="advancedVisible[index] = !advancedVisible[index]">
                            <span class="text-subtitle2">{{ $t('common.advanced') }}</span>
                            <q-icon :name="advancedVisible[index] ? 'expand_less' : 'expand_more'" class="q-ml-xs" />
                        </div>
                        <Transition>
                            <div v-if="advancedVisible[index]">
                                <HighchartsGaugeSerieAdvancedSettings :serie-settings-prop="serieSetting" :disabled="!serieSetting.label.enabled" @modelChanged="modelChanged" />
                            </div>
                        </Transition>
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn v-if="index === 0" flat round dense icon="add_circle" size="sm" @click="addSerieSetting()" />
                <q-btn v-else flat round dense icon="delete" size="sm" @click="removeSerieSetting(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn, IWidgetStyleToolbarModel } from '../../../../../../Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { IHighchartsChartModel, IHighchartsSeriesLabelsSetting } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'
import HighchartsSeriesMultiselect from '../common/HighchartsSeriesMultiselect.vue'
import WidgetEditorStyleToolbar from '../../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import HighchartsGaugeSerieAdvancedSettings from './HighchartsGaugeSerieAdvancedSettings.vue'
import * as highchartsDefaultValues from '../../../../helpers/chartWidget/highcharts/HighchartsDefaultValues'
import WidgetEditorColorPicker from '../../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'hihgcharts-series-label-settings',
    components: {
        HighchartsSeriesMultiselect,
        WidgetEditorStyleToolbar,
        HighchartsGaugeSerieAdvancedSettings,
        WidgetEditorColorPicker
    },
    props: { propWidgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            widgetModel: {} as IWidget,
            model: null as IHighchartsChartModel | null,
            seriesSettings: [] as IHighchartsSeriesLabelsSetting[],
            toolbarModels: [] as {
                'font-family': string
                'font-size': string
                'font-weight': string
                color: string
                'background-color': string
            }[],
            availableSeriesOptions: [] as string[],
            advancedVisible: {},
            getTranslatedLabel
        }
    },
    computed: {
        allSeriesOptionEnabled() {
            return this.model && !['pie', 'solidgauge', 'sunburst', 'treemap', 'dependencywheel', 'sankey', 'pictorial', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall', 'scatter'].includes(this.model.chart.type)
        },
        formattingSectionAvailable() {
            return this.model && ['pie', 'gauge', 'solidgauge', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'sunburst', 'treemap', 'dependencywheel', 'sankey', 'pictorial', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall'].includes(this.model.chart.type)
        },
        precisionAvailable() {
            return this.model && ['pie', 'gauge', 'solidgauge', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall'].includes(this.model.chart.type)
        },
        scaleVisible() {
            return this.model && ['pie', 'gauge', 'solidgauge', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall'].includes(this.model.chart.type)
        },
        percentageAvailable() {
            return this.model && ['pie', 'gauge', 'solidgauge'].includes(this.model.chart.type)
        },
        absoluteVisible() {
            return this.model && ['pie', 'gauge', 'solidgauge', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble'].includes(this.model.chart.type)
        },
        advancedSectionAvailable() {
            return this.model?.chart.type === 'gauge'
        },
        styleToolbarVisible() {
            return this.model && ['pie', 'gauge', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'sunburst', 'treemap', 'dependencywheel', 'sankey', 'pictorial', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall'].includes(this.model.chart.type)
        },
        serieColorPickerVisible() {
            return this.model?.chart.type === 'activitygauge'
        },
        labelOptionsVisible() {
            return this.model && ['pie', 'gauge', 'solidgauge', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'sunburst', 'treemap', 'dependencywheel', 'sankey', 'pictorial', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall'].includes(this.model.chart.type)
        },
        seriesNameVisible() {
            return this.model && ['pie', 'gauge', 'solidgauge', 'radar', 'area', 'bar', 'column', 'line', 'scatter', 'bubble', 'sunburst', 'treemap', 'dependencywheel', 'sankey', 'pictorial', 'funnel', 'dumbbell', 'streamgraph', 'packedbubble', 'waterfall'].includes(this.model.chart.type)
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
    mounted() {
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
            this.seriesSettings = []
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
            if (this.widgetModel.settings?.series?.seriesSettings) {
                this.widgetModel.settings.series.seriesSettings.forEach((seriesSettings: IHighchartsSeriesLabelsSetting) => {
                    if (this.model?.chart.type !== 'gauge') {
                        ;['dial', 'pivot'].forEach((property: string) => delete seriesSettings[property])
                    }
                    this.seriesSettings.push(seriesSettings)
                })
            }
            this.loadToolbarModels()
            this.loadSeriesOptions()
            this.removeSeriesFromAvailableOptions()
            this.removeAllSerieSettingsFromModel()
            if (this.seriesSettings.length === 0) this.addFirstSeriesSetting()
            if (!this.allSeriesOptionEnabled) this.seriesSettings.splice(1)
        },
        removeAllSerieSettingsFromModel() {
            if (this.seriesSettings[0]?.names[0] && this.seriesSettings[0].names[0] === 'all' && !this.allSeriesOptionEnabled) {
                this.seriesSettings.splice(0, 1)
                this.widgetModel.settings.series.seriesSettings.splice(0, 1)
            }
        },
        loadToolbarModels() {
            this.seriesSettings.forEach((serieSetting: IHighchartsSeriesLabelsSetting) => {
                this.toolbarModels.push({
                    'font-family': serieSetting.label.style.fontFamily,
                    'font-size': serieSetting.label.style.fontSize,
                    'font-weight': serieSetting.label.style.fontWeight,
                    color: serieSetting.label.style.color,
                    'background-color': serieSetting.label.backgroundColor
                })
            })
        },
        loadSeriesOptions() {
            this.availableSeriesOptions = []
            if (!this.widgetModel) return
            this.widgetModel.columns.forEach((column: IWidgetColumn) => {
                if (column.fieldType === 'MEASURE' && (!column.axis || ['Y', 'start'].includes(column.axis))) this.availableSeriesOptions.push(column.columnName)
            })
        },
        addFirstSeriesSetting() {
            if (!this.model) return
            this.seriesSettings = []
            if (this.availableSeriesOptions.length >= 1) {
                const name = this.allSeriesOptionEnabled ? 'all' : this.availableSeriesOptions[0]
                const formattedSeriesSettings = {
                    names: [name],
                    label: { ...highchartsDefaultValues.getDefaultSerieLabelSettings(), enabled: true }
                } as IHighchartsSeriesLabelsSetting
                if (this.model.chart.type === 'gauge') {
                    formattedSeriesSettings.dial = highchartsDefaultValues.getDefaultSerieDialSettings()
                    formattedSeriesSettings.pivot = highchartsDefaultValues.getDefaultSeriePivotSettings()
                }
                this.seriesSettings.push(formattedSeriesSettings)
                this.widgetModel.settings.series.seriesSettings.push(formattedSeriesSettings)
            }
        },
        removeSeriesFromAvailableOptions() {
            for (let i = 1; i < this.widgetModel.settings.series.seriesSettings?.length; i++) {
                for (let j = 0; j < this.widgetModel.settings.series.seriesSettings[i].names.length; j++) {
                    this.removeSerieFromAvailableOptions(this.widgetModel.settings.series.seriesSettings[i].names[j])
                }
            }
        },
        removeSerieFromAvailableOptions(seriesName: string) {
            const index = this.availableSeriesOptions.findIndex((tempSerieName: string) => tempSerieName === seriesName)
            if (index !== -1) this.availableSeriesOptions.splice(index, 1)
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        onSeriesSelected(event: any, serieSetting: IHighchartsSeriesLabelsSetting) {
            const intersection = serieSetting.names.filter((el: string) => !event.value.includes(el))
            serieSetting.names = event.value
            intersection.length > 0 ? this.onSeriesRemovedFromMultiselect(intersection) : this.onSeriesAddedFromMultiselect(serieSetting)
            this.modelChanged()
        },
        onSeriesAddedFromMultiselect(serieSetting: IHighchartsSeriesLabelsSetting) {
            serieSetting.names.forEach((serieName: string) => {
                const index = this.availableSeriesOptions.findIndex((tempSerieName: string) => tempSerieName === serieName)
                if (index !== -1) this.availableSeriesOptions.splice(index, 1)
            })
        },
        onSeriesRemovedFromMultiselect(intersection: string[]) {
            intersection.forEach((serieName: string) => this.availableSeriesOptions.push(serieName))
        },
        addSerieSetting() {
            const newSerieSetting = {
                names: [],
                label: highchartsDefaultValues.getDefaultSerieLabelSettings(),
                seriesName: highchartsDefaultValues.getDefaultSerieLabelSettings(),
                showName: true
            } as IHighchartsSeriesLabelsSetting
            if (this.model?.chart.type === 'gauge') {
                newSerieSetting.dial = highchartsDefaultValues.getDefaultSerieDialSettings()
                newSerieSetting.pivot = highchartsDefaultValues.getDefaultSeriePivotSettings()
            }
            this.seriesSettings.push(newSerieSetting)
            this.widgetModel.settings.series.seriesSettings.push(newSerieSetting)
            this.toolbarModels.push({
                'font-family': '',
                'font-size': '',
                'font-weight': '',
                color: '',
                'background-color': 'rgba(194,194,194, 1)'
            })
        },
        removeSerieSetting(index: number) {
            this.seriesSettings[index].names.forEach((serieName: string) => this.availableSeriesOptions.push(serieName))
            this.advancedVisible[index] = false
            this.widgetModel.settings.series.seriesSettings.splice(index, 1)
            this.seriesSettings.splice(index, 1)
            this.toolbarModels.splice(index, 1)
            this.modelChanged()
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, index: number) {
            if (!this.model || !this.toolbarModels[index]) return
            this.toolbarModels[index] = {
                'font-family': model['font-family'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-weight': model['font-weight'] ?? '',
                color: model.color ?? '',
                'background-color': model['background-color'] ?? ''
            }
            ;((this.seriesSettings[index].label.backgroundColor = this.toolbarModels[index]['background-color'] ?? ''),
                (this.seriesSettings[index].label.style = {
                    color: this.toolbarModels[index].color ?? '',
                    fontSize: this.toolbarModels[index]['font-size'] ?? '14px',
                    fontFamily: this.toolbarModels[index]['font-family'] ?? '',
                    fontWeight: this.toolbarModels[index]['font-weight'] ?? ''
                }))
            this.modelChanged()
        },
        onSelectionColorChanged(event: string | null, serieSetting: IHighchartsSeriesLabelsSetting) {
            if (!event) return
            serieSetting.serieColor = event
            this.modelChanged()
        },
        onChartTypeChanged() {
            this.widgetModel.settings.series.seriesSettings = []
            this.loadModel()
        }
    }
})
</script>
<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
