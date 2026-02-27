<template>
    <q-layout container view="hHh lpr lfr" class="widget-editor-layout" :class="{ 'with-custom-header': isDashboardHeader }">
        <q-header ref="headerRef" bordered>
            <!--  v-if="!isDashboardHeader" -->
            <q-toolbar class="kn-toolbar--primary" v-if="!isDashboardHeader">
                <q-toolbar-title>{{ widgetTitle }} Widget Editor</q-toolbar-title>
                <q-btn flat round dense icon="save" :disable="widgetIsInvalid" data-test="save-button" @click="save" />
                <q-btn flat round dense icon="close" data-test="close-button" @click="close" />
            </q-toolbar>
            <q-tabs v-model="activeTab" align="left" dense class="bg-white text-black">
                <!-- <q-btn class="text-secondary" flat round dense icon="view_sidebar" @click="dataListDrawerOpen = !dataListDrawerOpen" /> -->
                <q-tab v-if="hasDataTab" class="" name="data" :label="$t(widget.type === 'map' ? 'common.layers' : 'common.data')" />
                <q-tab class="q-mr-auto" name="settings" :label="$t('common.settings')" />
                <q-btn v-if="rightDrawerOpen" class="text-secondary" flat round dense icon="refresh" @click="refreshPreview" />
                <!-- <q-btn class="text-secondary" flat round dense icon="preview" @click="rightDrawerOpen = !rightDrawerOpen" /> -->
            </q-tabs>
        </q-header>

        <!-- <q-btn :class="['drawer-attached-btn', 'left-drawer-btn', { open: dataListDrawerOpen, closed: !dataListDrawerOpen }]" round dense icon="view_sidebar" color="secondary" @click="dataListDrawerOpen = !dataListDrawerOpen" />
        <q-btn :class="['drawer-attached-btn', 'right-drawer-btn', { open: rightDrawerOpen, closed: !rightDrawerOpen }]" round dense icon="preview" color="secondary" @click="rightDrawerOpen = !rightDrawerOpen" /> -->

        <q-btn :class="['drawer-attached-btn', 'left-drawer-btn', { open: dataListDrawerOpen, closed: !dataListDrawerOpen }]" round dense :icon="dataListDrawerOpen ? 'chevron_left' : 'chevron_right'" color="secondary" @click="dataListDrawerOpen = !dataListDrawerOpen" />
        <q-btn :class="['drawer-attached-btn', 'right-drawer-btn', { open: rightDrawerOpen, closed: !rightDrawerOpen }]" round dense :icon="rightDrawerOpen ? 'chevron_right' : 'chevron_left'" color="secondary" @click="rightDrawerOpen = !rightDrawerOpen" />

        <q-drawer v-model="dataListDrawerOpen" side="left" :breakpoint="0" bordered :width="leftDrawerWidth" class="resizable-drawer">
            <q-scroll-area :style="{ height: scrollAreaHeight }">
                <div v-show="activeTab === 'data'">
                    <LayersList v-if="widget.type === 'map'" :widget-model="widget" :datasets="datasets" :selected-datasets="selectedDatasets" @layerSelected="onLayerSelected" />
                    <WidgetEditorDataList v-else :widget-model="widget" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" @datasetSelected="onDatasetSelectedFromList" @selectedDatasetColumnsChanged="onSelectedDatasetColumnsChanged" @toggle-list-drag="onToggleListDrag" />
                </div>
                <WidgetEditorSettingsList v-show="activeTab === 'settings' && widget" :widget-model="widget" :propSelectedItem="selectedSetting" :options="settingsDescriptor.settingsListOptions" @itemClicked="onSettingsItemClicked" />
            </q-scroll-area>
            <div class="resize-handle resize-handle-right" @mousedown="handleResizeStartLeft"></div>
        </q-drawer>

        <q-drawer v-model="rightDrawerOpen" side="right" bordered :breakpoint="0" :width="rightDrawerWidth" class="resizable-drawer">
            <WidgetEditorPreview v-if="widget.type !== 'static-pivot-table' && !chartPickerVisible && rightDrawerOpen && showPreview" class="kn-width-full kn-height-full" :prop-widget="widget" :dashboard-id="dashboardId" :datasets="selectedModelDatasets" :variables="variables" />
            <div class="resize-handle resize-handle-left" @mousedown="handleResizeStartRight"></div>
        </q-drawer>

        <q-page-container class="widget-page-container">
            <!-- with some ungodly hacking, this scroll area preserves the whole layout of the editor, i have no idea how it works -->
            <q-scroll-area :style="{ height: scrollAreaHeight }">
                <q-tab-panels v-model="activeTab" keep-alive class="kn-width-full kn-height-full column">
                    <q-tab-panel v-if="hasDataTab" name="data" class="column" style="max-width: 850px !important; justify-self: center">
                        <MapWidgetLayersTab v-if="widget.type === 'map'" :prop-widget="widget" :datasets="datasets" :selected-datasets="selectedDatasets" :layers="layers" :variables="variables" :dashboard-id="dashboardId" :selected-layer="selectedLayer" @layerSelected="onLayerSelected" />
                        <WidgetEditorDataTab v-else :prop-widget="widget" :selected-dataset="selectedDataset" :selected-dataset-columns="selectedDatasetColumns" :list-drag-active="listDragActive" data-test="data-tab" />
                    </q-tab-panel>

                    <q-tab-panel name="settings" class="column" style="max-width: 800px !important; justify-self: center">
                        <WidgetEditorSettingsTab v-if="widget" :prop-widget="widget" :datasets="datasets" :selected-datasets="selectedDatasets" :variables="variables" :dashboard-id="dashboardId" :layers="layers" :selected-setting="selectedSetting" :descriptor="settingsDescriptor" :gallery-items="galleryItems" :custom-chart-gallery="customChartGallery" @settingChanged="onSettingChanged" />
                    </q-tab-panel>
                </q-tab-panels>
            </q-scroll-area>
        </q-page-container>
    </q-layout>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IDashboardDataset, IVariable, IDatasetColumn } from '../../Dashboard'
import { ILayer, IMapWidgetLayer } from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import { createNewWidget, recreateKnowageChartModel, getSettingsDescriptor } from './helpers/WidgetEditorHelpers'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import WidgetEditorDataTab from './WidgetEditorDataTab/WidgetEditorDataTab.vue'
import WidgetEditorDataList from './WidgetEditorDataTab/WidgetEditorDataList/WidgetEditorDataList.vue'
import WidgetEditorSettingsList from './WidgetEditorSettingsTab/WidgetEditorSettingsList.vue'
import WidgetEditorSettingsTab from './WidgetEditorSettingsTab/WidgetEditorSettingsTab.vue'
import WidgetEditorPreview from './WidgetEditorPreview.vue'
import MapWidgetLayersTab from './MapWidget/MapWidgetLayersTab.vue'
import LayersList from './MapWidget/MapWidgetLayersTabList.vue'
import mainStore from '../../../../../App.store'
import { updateWidgetThemeAndApplyStyle } from '../../generalSettings/themes/ThemesHelper'
import descriptor from './WidgetEditorDescriptor.json'
import dashStore from '../../Dashboard.store'
import deepcopy from 'deepcopy'
import { AxiosResponse } from 'axios'
import ChartWidgetChartTypeDropdown from './WidgetEditorDataTab/ChartWidget/common/ChartWidgetChartTypeDropdown.vue'
import { IGalleryItem } from '../../Dashboard'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'widget-editor',
    components: { WidgetEditorDataTab, WidgetEditorDataList, WidgetEditorSettingsList, WidgetEditorSettingsTab, MapWidgetLayersTab, WidgetEditorPreview, LayersList },
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
            chartPickerVisible: false,
            activeTab: 'data',
            selectedDataset: null as IDataset | null,
            selectedDatasetColumns: [] as IDatasetColumn[],
            listDragActive: false,
            layers: [] as ILayer[],
            selectedLayer: null as IMapWidgetLayer | null,
            scrollAreaHeight: '100vh',
            selectedSetting: '',
            settingsDescriptor: {} as any,
            galleryItems: [] as IGalleryItem[],
            customChartGallery: [] as IGalleryItem[],
            isResizingLeft: false,
            isResizingRight: false,
            resizeStartX: 0,
            showPreview: true
        }
    },
    computed: {
        isDashboardHeader() {
            return this.widget.settings?.isCustomDashboardHeader
        },
        widgetTitle() {
            return this.widget.settings?.isCustomDashboardHeader ? this.$t('dashboard.generalSettings.customHeader') : this.widget.type
        },
        hasDataTab() {
            return this.widget && !['selection', 'image', 'spacer'].includes(this.widget.type)
        },
        chartType() {
            return this.widget.settings?.chartModel?.model.chart.type
        },
        leftDrawerWidth() {
            return this.dashboardStore.getDrawerWidth('left')
        },
        rightDrawerWidth() {
            return this.dashboardStore.getDrawerWidth('right')
        },
        dataListDrawerOpen: {
            get() {
                return this.dashboardStore.getDrawerOpenState('left')
            },
            set(value: boolean) {
                this.dashboardStore.setDrawerOpenState('left', value)
            }
        },
        rightDrawerOpen: {
            get() {
                return this.dashboardStore.getDrawerOpenState('right')
            },
            set(value: boolean) {
                this.dashboardStore.setDrawerOpenState('right', value)
            }
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
        },
        chartType() {
            this.computeDescriptor()
        }
    },
    created() {
        this.setEventListeners()
        this.loadWidget()
        this.loadSelectedModelDatasets()
        this.loadSelectedModel()
        if (this.widget.type === 'map') this.loadLayers()
        window.addEventListener('keydown', this.handleKeyDown)
    },
    mounted() {
        this.updateScrollAreaHeight()
        window.addEventListener('resize', () => this.updateScrollAreaHeight())
        document.addEventListener('mousemove', this.handleResizeMove)
        document.addEventListener('mouseup', this.handleResizeEnd)
    },
    unmounted() {
        this.removeEventListeners()
        window.removeEventListener('keydown', this.handleKeyDown)
        window.removeEventListener('resize', () => this.updateScrollAreaHeight())
        document.removeEventListener('mousemove', this.handleResizeMove)
        document.removeEventListener('mouseup', this.handleResizeEnd)
    },
    methods: {
        ...mapActions(dashStore, ['getHTMLGaleryItems', 'getPythonGaleryItems', 'getCustomChartGaleryItems']),
        setEventListeners() {
            emitter.on('chartPickerVisible', this.changeChartPickerVisbility)
        },
        removeEventListeners() {
            emitter.off('chartPickerVisible', this.changeChartPickerVisbility)
        },

        // #region - Editor Setup and Control
        async loadWidget() {
            if (!this.propWidget) return
            this.widget = this.propWidget.new ? createNewWidget(this.propWidget.type, this.dashboardStore.dashboards[this.dashboardId]) : deepcopy(this.propWidget)
            updateWidgetThemeAndApplyStyle(this.widget, this.dashboardStore.allThemes)
            if (!this.propWidget.new) recreateKnowageChartModel(this.widget)

            this.activeTab = this.hasDataTab ? 'data' : 'settings'

            await this.loadGalleries()
            this.computeDescriptor()
        },
        async loadGalleries() {
            if (['html', 'python'].includes(this.widget?.type)) {
                this.galleryItems = this.widget.type === 'html' ? await this.getHTMLGaleryItems(this.dashboardId, this.$http) : await this.getPythonGaleryItems(this.dashboardId, this.$http)
            } else {
                this.galleryItems = []
            }

            if (this.widget?.type === 'customchart') {
                this.customChartGallery = await this.getCustomChartGaleryItems(this.dashboardId, this.$http)
            } else {
                this.customChartGallery = []
            }
        },
        computeDescriptor() {
            this.settingsDescriptor = getSettingsDescriptor(this.widget)

            // Apply post-processing for HTML widgets
            const index = this.settingsDescriptor.settingsListOptions.findIndex((option: any) => option.value === 'Gallery')
            if (index !== -1) this.settingsDescriptor.settingsListOptions[index].disabled = this.galleryItems.length === 0
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
        handleResizeStartLeft(event: MouseEvent) {
            this.isResizingLeft = true
            this.resizeStartX = event.clientX
            event.preventDefault()
        },
        handleResizeStartRight(event: MouseEvent) {
            this.isResizingRight = true
            this.resizeStartX = event.clientX
            event.preventDefault()
        },
        handleResizeMove(event: MouseEvent) {
            if (!this.isResizingLeft && !this.isResizingRight) return

            const delta = event.clientX - this.resizeStartX
            const minWidth = 150
            const maxWidth = window.innerWidth * 0.7

            if (this.isResizingLeft) {
                const newWidth = Math.max(minWidth, Math.min(maxWidth, this.leftDrawerWidth + delta))
                this.dashboardStore.setDrawerWidth('left', newWidth)
            }

            if (this.isResizingRight) {
                const newWidth = Math.max(minWidth, Math.min(maxWidth, this.rightDrawerWidth - delta))
                this.dashboardStore.setDrawerWidth('right', newWidth)
            }

            this.resizeStartX = event.clientX
        },
        handleResizeEnd() {
            this.isResizingLeft = false
            this.isResizingRight = false
        },
        updateScrollAreaHeight() {
            this.$nextTick(() => {
                const headerComponent = this.$refs.headerRef as any
                const pageContainer = this.$el?.querySelector('.widget-page-container')

                if (headerComponent?.$el && pageContainer) {
                    const headerComponentHeight = (headerComponent.$el as HTMLElement).offsetHeight
                    const rect = pageContainer.getBoundingClientRect()
                    let availableHeight = window.innerHeight - rect.top - headerComponentHeight
                    if (this.isDashboardHeader) availableHeight -= 20 //extra padding when widget is dashboard header
                    this.scrollAreaHeight = `${Math.max(availableHeight, 0)}px`
                }
            })
        },
        handleKeyDown(event: KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault()
                if (!this.widgetIsInvalid) this.save()
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
        // #endregion

        // #region - Data Tab
        async loadLayers() {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/layers')
                .then((response: AxiosResponse<any>) => (this.layers = response.data.root))
                .catch(() => {})
        },
        onLayerSelected(layer: IMapWidgetLayer) {
            this.selectedLayer = layer
        },
        onDatasetSelectedFromList(dataset: IDataset) {
            if (this.selectedDataset && dataset.id !== this.selectedDataset.id && this.widget?.settings?.sortingColumn) {
                this.widget.settings.sortingColumn = ''
            }
            this.selectedDataset = dataset
        },
        onSelectedDatasetColumnsChanged(columns: IDatasetColumn[]) {
            this.selectedDatasetColumns = columns
        },
        onToggleListDrag() {
            this.listDragActive = !this.listDragActive
        },
        changeChartPickerVisbility(value: any) {
            this.chartPickerVisible = value
        },
        refreshPreview() {
            this.showPreview = false
            this.$nextTick(() => {
                this.showPreview = true
            })
        },
        // #endregion

        // #region - Settings Tab
        onSettingChanged(setting: string) {
            this.selectedSetting = setting
        },
        onSettingsItemClicked(item: any) {
            this.selectedSetting = item.value
        }
        // #endregion
    }
})
</script>
<style lang="scss">
.widget-editor-card {
    color: rgba(0, 0, 0, 0.87);
    box-shadow:
        0 2px 1px -1px rgb(0 0 0 / 20%),
        0 1px 1px 0 rgb(0 0 0 / 14%),
        0 1px 3px 0 rgb(0 0 0 / 12%);
    border-radius: 4px;
}

.widget-editor-card-error {
    border-color: rgba(219, 2, 2, 0.87);
    box-shadow:
        0 2px 1px -1px rgb(0 0 0 / 20%),
        0 1px 1px 0 rgb(0 0 0 / 14%),
        0 1px 3px 0 rgb(0 0 0 / 12%);
    border-radius: 4px;
}

.widget-editor-layout {
    background-color: white;
    position: absolute;
    z-index: 999;
}
.with-custom-header {
    position: relative;
}
.resizable-drawer {
    position: relative;
}

.resize-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    background-color: transparent;
    transition: background-color 0.2s ease;
    z-index: 1000;

    &:hover {
        background-color: var(--kn-color-default);
    }

    &.resize-handle-right {
        right: 0;
    }

    &.resize-handle-left {
        left: 0;
    }
}

.drawer-attached-btn {
    position: fixed;
    bottom: 2rem; // below header and tabs
    z-index: 999999;
    opacity: 0.9;
    &:hover {
        opacity: 1;
    }

    &.left-drawer-btn {
        &.open {
            left: v-bind('leftDrawerWidth + "px"');
            margin-left: -18px;
        }

        &.closed {
            left: -10px;
        }
    }

    &.right-drawer-btn {
        &.open {
            right: v-bind('rightDrawerWidth + "px"');
            margin-right: -18px;
        }

        &.closed {
            right: -10px;
        }
    }
}
</style>
