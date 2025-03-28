<template>
    <div class="dashboardEditor" :style="isDashboardHeader ? 'display: flex; flex-direction: column; position: relative' : ''">
        <Toolbar v-if="!isDashboardHeader" class="kn-toolbar kn-toolbar--primary">
            <template #start>{{ widgetTitle }} Widget Editor</template>
            <template #end>
                <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" :disabled="widgetIsInvalid" data-test="save-button" @click="save" />
                <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" data-test="close-button" @click="close" />
            </template>
        </Toolbar>
        <div class="datasetEditor-container kn-overflow">
            <WidgetEditorTabs class="dashboardEditor-tabs" :prop-widget="widget" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :selected-setting-prop="selectedSetting" @settingChanged="onSettingChanged" />

            <div v-if="selectedSetting != 'Gallery'" class="preview-buttons-container p-d-flex" style="position: absolute; top: 38px; right: 10px" :style="{ top: isDashboardHeader ? '0px' : '' }">
                <Button icon="fas fa-magnifying-glass" class="p-button-rounded p-button-text p-button-plain expand-button" @click="togglePreview" />
            </div>

            <WidgetEditorPreview v-if="widget.type != 'static-pivot-table' && selectedSetting != 'Gallery' && !chartPickerVisible && showPreview" :prop-widget="widget" :dashboard-id="dashboardId" :datasets="selectedModelDatasets" :variables="variables" />
        </div>
    </div>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of managing the widget editing.
 */
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IDashboardDataset, IVariable } from '../../Dashboard'
import { createNewWidget, recreateKnowageChartModel } from './helpers/WidgetEditorHelpers'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import WidgetEditorPreview from './WidgetEditorPreview.vue'
import WidgetEditorTabs from './WidgetEditorTabs.vue'
import mainStore from '../../../../../App.store'
import { updateWidgetThemeAndApplyStyle } from '../../generalSettings/themes/ThemesHelper'
import descriptor from './WidgetEditorDescriptor.json'
import dashStore from '../../Dashboard.store'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'widget-editor',
    components: { WidgetEditorPreview, WidgetEditorTabs },
    props: {
        dashboardId: { type: String, required: true },
        propWidget: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    emits: ['close', 'widgetUpdated', 'widgetSaved'],
    setup() {
        const store = mainStore()
        const dashboardStore = dashStore()
        return { store, dashboardStore }
    },
    data() {
        return {
            descriptor,
            widget: {} as any,
            previewData: null as any,
            selectedModelDatasets: [] as IDashboardDataset[],
            selectedDatasets: [] as IDataset[],
            selectedSetting: '',
            chartPickerVisible: false,
            showPreview: false
        }
    },
    computed: {
        isDashboardHeader() {
            return this.widget.settings?.isCustomDashboardHeader
        },
        widgetTitle() {
            return this.widget.settings?.isCustomDashboardHeader ? this.$t('dashboard.generalSettings.customHeader') : this.widget.type
        },
        widgetIsInvalid() {
            let invalid = false
            if (!this.widget.invalid) return invalid
            const invalidPropertyKeys = Object.keys(this.widget.invalid)
            for (let i = 0; i < invalidPropertyKeys.length; i++) {
                if (this.widget.invalid[invalidPropertyKeys[i]]) {
                    invalid = true
                    return invalid
                }
            }
            return invalid
        }
    },
    watch: {
        propWidget() {
            this.loadWidget()
        }
    },
    created() {
        this.setEventListeners()
        this.loadWidget()
        this.loadSelectedModelDatasets()
        this.loadSelectedModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('chartPickerVisible', this.changeChartPickerVisbility)
        },
        removeEventListeners() {
            emitter.off('chartPickerVisible', this.changeChartPickerVisbility)
        },
        loadWidget() {
            if (!this.propWidget) return
            this.widget = this.propWidget.new ? createNewWidget(this.propWidget.type, this.dashboardStore.dashboards[this.dashboardId]) : deepcopy(this.propWidget)
            updateWidgetThemeAndApplyStyle(this.widget, this.dashboardStore.allThemes)
            if (!this.propWidget.new) recreateKnowageChartModel(this.widget)
        },
        loadSelectedModelDatasets() {
            this.selectedModelDatasets = this.dashboardId ? this.dashboardStore.getDashboardSelectedDatasets(this.dashboardId) : {}
        },
        loadSelectedModel() {
            if (!this.datasets) return
            this.selectedDatasets = [] as IDataset[]
            for (let i = 0; i < this.selectedModelDatasets.length; i++) {
                const tempDataset = this.selectedModelDatasets[i]
                const index = this.datasets.findIndex((dataset: any) => dataset.id.dsId === tempDataset.id)
                if (index !== -1)
                    this.selectedDatasets.push({
                        ...this.datasets[index],
                        cache: tempDataset.cache,
                        indexes: tempDataset.indexes ?? [],
                        parameters: tempDataset.parameters as any[],
                        drivers: tempDataset.drivers ?? []
                    })
            }
        },
        save() {
            const tempWidget = deepcopy(this.widget)
            if (!tempWidget) return
            if (tempWidget.settings.isCustomDashboardHeader) {
                this.$emit('widgetSaved', tempWidget)
                return
            }
            if (tempWidget.settings.configuration.updateFromSelections == undefined) tempWidget.settings.configuration.updateFromSelections = true

            if (tempWidget.new) {
                delete tempWidget.new
                this.dashboardStore.createNewWidget(this.dashboardId, tempWidget)
                this.$emit('widgetSaved')
            } else {
                this.dashboardStore.updateWidget(this.dashboardId, tempWidget)
                this.$emit('widgetUpdated')
            }
        },
        close() {
            this.$emit('close')
        },
        onSettingChanged(setting: string) {
            this.selectedSetting = setting
        },
        changeChartPickerVisbility(value: any) {
            this.chartPickerVisible = value
        },
        togglePreview() {
            this.showPreview = !this.showPreview
        }
    }
})
</script>
<style lang="scss">
.widget-editor-card {
    color: rgba(0, 0, 0, 0.87);
    box-shadow: 0 2px 1px -1px rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 1px 3px 0 rgb(0 0 0 / 12%);
    border-radius: 4px;
}

.widget-editor-card-error {
    border-color: rgba(219, 2, 2, 0.87);
    box-shadow: 0 2px 1px -1px rgb(0 0 0 / 20%), 0 1px 1px 0 rgb(0 0 0 / 14%), 0 1px 3px 0 rgb(0 0 0 / 12%);
    border-radius: 4px;
}

.icon-disabled {
    color: #c2c2c2;
}
</style>
