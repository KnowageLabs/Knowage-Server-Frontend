<template>
    <q-item-section v-if="model" class="row items-center col-shrink">
        <q-toggle v-model="model[property]" :label="title ? $t(title) : ''" @click.stop="onModelChange" dense />
    </q-item-section>
    <q-item-section v-else class="col-shrink">
        <span>{{ title ? $t(title) : '' }}</span>
    </q-item-section>
    <Button v-if="title?.includes('menuConfiguration')" v-tooltip.top="$t('dashboard.widgetEditor.menuConfigurationTooltip')" icon="pi pi-question-circle" class="p-button-text p-button-plain p-button-sm p-p-0 p-ml-auto" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import * as highchartsDefaultValues from '../../../helpers/chartWidget/highcharts/HighchartsDefaultValues'

export default defineComponent({
    name: 'highcharts-widget-settings-accordion-header',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, title: { type: String }, type: { type: String, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            model: null as any,
            property: 'enabled' as string
        }
    },
    computed: {},
    watch: {
        type() {
            this.updateModel()
        }
    },
    mounted() {
        this.setEventListeners()
        this.updateModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.updateModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.updateModel)
        },
        loadModel() {
            if (!this.widgetModel || !this.widgetModel.settings || !this.widgetModel.settings.chartModel) return null
            switch (this.type) {
                case 'MenuConfiguration':
                    return this.widgetModel.settings.configuration.widgetMenu
                case 'ConfigurationOf3D':
                    return this.widgetModel.settings.chartModel.model?.chart?.options3d
                case 'AccessibilitySettings':
                    return this.widgetModel.settings.chartModel.model?.accessibility
                case 'Legend':
                    return this.widgetModel.settings.chartModel.model?.legend
                case 'Tooltip':
                case 'ActivityGaugeTooltip':
                    return this.widgetModel.settings.chartModel.model?.tooltip
                case 'HighchartsXAxisTitleSettings':
                    return this.widgetModel.settings.chartModel.model?.xAxis?.title
                case 'HighchartsYAxisTitleSettings':
                    return this.widgetModel.settings.chartModel.model?.xAxis?.title
                case 'DatetypeSettings':
                    return this.widgetModel.settings.configuration.datetypeSettings
                case 'CategoryThresholdSettings':
                    // Inizializza categoryThreshold se non esiste (widget esistenti)
                    if (!this.widgetModel.settings.configuration.categoryThreshold) {
                        this.widgetModel.settings.configuration.categoryThreshold = highchartsDefaultValues.getDefaultCategoryThreshold()
                    }
                    return this.widgetModel.settings.configuration.categoryThreshold
                case 'GroupingSettings':
                    return this.widgetModel.settings.configuration.splitting
                case 'Title':
                    return this.widgetModel.settings.style.title
                case 'ColumnStyle':
                    return this.widgetModel.settings.style.columns
                case 'ColumnGroupsStyle':
                    return this.widgetModel.settings.style.columnGroups
                case 'BackgroundColorStyle':
                    return this.widgetModel.settings.style.background
                case 'BordersStyle':
                    return this.widgetModel.settings.style.borders
                case 'PaddingStyle':
                    return this.widgetModel.settings.style.padding
                case 'ShadowsStyle':
                    return this.widgetModel.settings.style.shadows
                case 'Drilldown':
                    return this.widgetModel.settings.interactions.drilldown
                case 'Selection':
                    return this.widgetModel.settings.interactions.selection
                case 'CrossNavigation':
                    return this.widgetModel.settings.interactions.crossNavigation
                case 'Link':
                    return this.widgetModel.settings.interactions.link
                case 'Preview':
                    return this.widgetModel.settings.interactions.preview
                case 'ConditionalStyles':
                    return this.widgetModel.settings.series.conditionalStyles
                case 'SonificationSettings':
                    return this.widgetModel.settings.chartModel.model?.sonification
                case 'LimitSettings':
                    return this.widgetModel.settings.configuration.limit
                case 'HelpSettings':
                    return this.widgetModel.settings.help
                default:
                    return null
            }
        },
        updateModel() {
            this.model = this.loadModel()
        },
        onModelChange() {
            switch (this.type) {
                case 'ConfigurationOf3D':
                case 'AccessibilitySettings':
                case 'Legend':
                case 'Tooltip':
                case 'ActivityGaugeTooltip':
                case 'CategoryThresholdSettings':
                    setTimeout(() => emitter.emit('refreshChart', this.widgetModel.id), 250)
                    break
                case 'Header':
                case 'Title':
                case 'BackgroundColorStyle':
                case 'BordersStyle':
                case 'PaddingStyle':
                case 'ShadowsStyle':
                    this.$emit('styleChanged')
            }
        }
    }
})
</script>
