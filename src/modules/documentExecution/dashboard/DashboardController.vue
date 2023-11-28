<template>
    <div v-show="model && visible && showDashboard" :id="`dashboard_${model?.configuration?.id}`" :class="mode === 'dashboard-popup' ? 'dashboard-container-popup' : 'dashboard-container'">
        <Button
            v-if="alwaysShowSelectionButton || store.dashboards[dashboardId]?.selections?.length > 0"
            icon="fas fa-square-check"
            class="p-m-3 p-button-rounded p-button-text p-button-plain"
            style="position: fixed; right: 0; z-index: 999; background-color: white; box-shadow: 0px 2px 3px #ccc"
            @click="selectionsDialogVisible = true"
        />

        <div class="dashboard-renderer-container">
            <DashboardHeaderWidget
                v-if="!loading && showDashboard && model?.configuration?.customHeader && customHeaderVisible && model.configuration.menuWidgets.enableCustomHeader"
                :dashboard-id="dashboardId"
                :prop-widget="model?.configuration?.customHeader"
                :datasets="model.configuration.datasets"
                :document-drivers="drivers"
                :variables="model ? model.configuration.variables : []"
                :custom-chart-gallery-prop="customChartGallery"
            ></DashboardHeaderWidget>

            <div class="dashboard-renderer-core">
                <DashboardRenderer v-if="!loading && visible && showDashboard" :document="document" :model="model" :datasets="datasets" :dashboard-id="dashboardId" :document-drivers="drivers" :variables="model ? model.configuration.variables : []"></DashboardRenderer>
            </div>
        </div>

        <Transition name="editorEnter" appear>
            <DatasetEditor
                v-if="datasetEditorVisible"
                :dashboard-id-prop="dashboardId"
                :available-datasets-prop="datasets"
                :filters-data-prop="filtersData"
                :datasets-loaded="datasetsLoaded"
                @close-dataset-editor="closeDatasetEditor"
                @dataset-editor-saved="closeDatasetEditor"
                @all-datasets-loaded="onAllDatasetsLoaded"
            />
        </Transition>

        <Transition name="editorEnter" appear>
            <DashboardGeneralSettings
                v-if="generalSettingsVisible"
                :dashboard-id="dashboardId"
                :datasets="datasets"
                :document-drivers="drivers"
                :profile-attributes="profileAttributes"
                :general-settings-mode="generalSettingsMode"
                @close-general-settings="closeGeneralSettings"
                @save-general-settings="generalSettingsVisible = false"
            ></DashboardGeneralSettings>
        </Transition>

        <WidgetPickerDialog v-if="widgetPickerVisible" :visible="widgetPickerVisible" @open-new-widget-editor="openNewWidgetEditor" @close-widget-picker="onWidgetPickerClosed" />
        <DashboardControllerSaveDialog v-if="saveDialogVisible" :visible="saveDialogVisible" @save="saveNewDashboard" @close="saveDialogVisible = false"></DashboardControllerSaveDialog>
        <SelectionsListDialog v-if="selectionsDialogVisible" :visible="selectionsDialogVisible" :dashboard-id="dashboardId" @close="selectionsDialogVisible = false" @save="onSelectionsRemove" />
    </div>

    <WidgetEditor
        v-if="widgetEditorVisible"
        :dashboard-id="dashboardId"
        :prop-widget="selectedWidget"
        :datasets="datasets"
        :document-drivers="drivers"
        :variables="model ? model.configuration.variables : []"
        :custom-chart-gallery-prop="customChartGallery"
        data-test="widget-editor"
        @close="closeWidgetEditor"
        @widget-saved="closeWidgetEditor"
        @widget-updated="closeWidgetEditor"
    ></WidgetEditor>

    <DashboardSaveViewDialog v-if="saveViewDialogVisible" :visible="saveViewDialogVisible" :prop-view="selectedView" :document="document" @close="onSaveViewListDialogClose"></DashboardSaveViewDialog>
    <DashboardSavedViewsDialog v-if="savedViewsListDialogVisible" :visible="savedViewsListDialogVisible" :document="document" @close="savedViewsListDialogVisible = false" @move-view="moveView" @execute-view="executeView"></DashboardSavedViewsDialog>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of creating the dashboard instance and to get initializing informations needed like the theme or the datasets.
 */
import { defineComponent, PropType } from 'vue'
import { AxiosResponse } from 'axios'
import { iParameter } from '@/components/UI/KnParameterSidebar/KnParameterSidebar'
import { IDashboardDataset, ISelection, IGalleryItem, IDataset, IDashboardView } from './Dashboard'
import { emitter, createNewDashboardModel, formatDashboardForSave, formatNewModel, loadDatasets, getFormattedOutputParameters, applyDashboardViewToModel } from './DashboardHelpers'
import { mapActions, mapState } from 'pinia'
import { formatModel } from './helpers/DashboardBackwardCompatibilityHelper'
import { setDatasetIntervals, clearAllDatasetIntervals } from './helpers/datasetRefresh/DatasetRefreshHelpers'
import { loadDrivers } from './helpers/DashboardDriversHelper'
import DashboardRenderer from './DashboardRenderer.vue'
import WidgetPickerDialog from './widget/WidgetPicker/WidgetPickerDialog.vue'
import dashboardStore from './Dashboard.store'
import mainStore from '../../../App.store'
import DatasetEditor from './dataset/DatasetEditor.vue'
import WidgetEditor from './widget/WidgetEditor/WidgetEditor.vue'
import descriptor from './DashboardDescriptor.json'
import cryptoRandomString from 'crypto-random-string'
import DashboardControllerSaveDialog from './DashboardControllerSaveDialog.vue'
import SelectionsListDialog from './widget/SelectorWidget/SelectionsListDialog.vue'
import DashboardGeneralSettings from './generalSettings/DashboardGeneralSettings.vue'
import deepcopy from 'deepcopy'
import DashboardSaveViewDialog from './DashboardViews/DashboardSaveViewDialog/DashboardSaveViewDialog.vue'
import DashboardSavedViewsDialog from './DashboardViews/DashboardSavedViewsDialog/DashboardSavedViewsDialog.vue'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import DashboardHeaderWidget from './widget/DashboardHeaderWidget/DashboardHeaderWidget.vue'

export default defineComponent({
    name: 'dashboard-controller',
    components: {
        DashboardRenderer,
        WidgetPickerDialog,
        DatasetEditor,
        WidgetEditor,
        DashboardControllerSaveDialog,
        SelectionsListDialog,
        DashboardGeneralSettings,
        DashboardSaveViewDialog,
        DashboardSavedViewsDialog,
        DashboardHeaderWidget
    },
    props: {
        visible: { type: Boolean },
        document: { type: Object },
        reloadTrigger: { type: Boolean },
        hiddenFormData: { type: Object },
        filtersData: {
            type: Object as PropType<{
                filterStatus: iParameter[]
                isReadyForExecution: boolean
            }>
        },
        newDashboardMode: { type: Boolean },
        mode: { type: Object as PropType<string | null>, required: true },
        propView: { type: Object as PropType<IDashboardView | null> }
    },
    emits: ['newDashboardSaved', 'executeCrossNavigation', 'dashboardIdSet', 'executeView'],
    setup() {
        const store = dashboardStore()
        const appStore = mainStore()
        return { store, appStore }
    },
    data() {
        return {
            customHeaderVisible: true,
            descriptor,
            model: null as any,
            widgetPickerVisible: false,
            datasetEditorVisible: false,
            datasets: [] as IDataset[],
            widgetEditorVisible: false,
            selectedWidget: null as any,
            crossNavigations: [] as any[],
            profileAttributes: [] as { name: string; value: string }[],
            drivers: [] as any[],
            internationalization: {} as any,
            dashboardId: '',
            saveDialogVisible: false,
            selectionsDialogVisible: false,
            generalSettingsVisible: false,
            loading: false,
            customChartGallery: [] as IGalleryItem[],
            currentView: {
                label: '',
                name: '',
                description: '',
                drivers: {},
                settings: { states: {} },
                visibility: 'public',
                new: true
            } as IDashboardView,
            selectedView: null as IDashboardView | null,
            saveViewDialogVisible: false,
            savedViewsListDialogVisible: false,
            selectedViewForExecution: null as IDashboardView | null,
            generalSettingsMode: 'General' as string,
            datasetsLoaded: false,
            dashboardThemes: [] as IDashboardTheme[],
            initialDataLoadedMap: {
                profileAttributesLoaded: false,
                dashboardModelLoaded: false,
                internationalizationLoaded: false,
                crossNavigationsLoaded: false
            }
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user',
            isEnterprise: 'isEnterprise'
        }),
        showDashboard() {
            return ['dashboard', 'dashboard-popup'].includes('' + this.mode)
        },
        alwaysShowSelectionButton() {
            if (!this.model?.configuration?.menuWidgets?.showSelectionButton) return false
            else return this.model.configuration.menuWidgets.showSelectionButton
        },
        customHeaderHeight() {
            const height = this.model?.configuration?.customHeader.settings.configuration.customDashboardHeaderConfiguration.height
            if (height) return height
            else return 0
        }
    },
    watch: {
        async document() {
            if (!this.showDashboard) return
            await this.getData()
            this.$watch('model.configuration.datasets', (modelDatasets: IDashboardDataset[]) => setDatasetIntervals(modelDatasets, this.datasets))
        },
        async reloadTrigger() {
            if (!this.showDashboard) return
            await this.getData()
        },
        async propView() {
            if (!this.showDashboard) return
            await this.getData()
        },
        async filtersData() {
            if (!this.showDashboard) return
            await this.getData()
        }
    },
    async created() {
        if (!this.showDashboard) return
        this.setEventListeners()
        await this.getData()
        this.$watch('model.configuration.datasets', (modelDatasets: IDashboardDataset[]) => setDatasetIntervals(modelDatasets, this.datasets))
    },
    beforeUnmount() {
        this.emptyStoreValues()
        clearAllDatasetIntervals()
    },
    methods: {
        ...mapActions(dashboardStore, [
            'getDashboardDrivers',
            'removeSelections',
            'setAllDatasets',
            'getSelections',
            'setInternationalization',
            'getInternationalization',
            'setDashboardDocument',
            'setDashboardDrivers',
            'setProfileAttributes',
            'getCrossNavigations',
            'setCurrentDashboardView',
            'setHTMLGaleryItems',
            'setPythonGaleryItems',
            'setCustomChartGaleryItems'
        ]),
        setEventListeners() {
            emitter.on('openNewWidgetPicker', this.openNewWidgetPicker)
            emitter.on('openDatasetManagement', this.openDatasetManagementDialog)
            emitter.on('openWidgetEditor', this.openWidgetEditor)
            emitter.on('saveDashboard', this.onSaveDashboardClicked)
            emitter.on('openDashboardGeneralSettings', this.openGeneralSettings)
            emitter.on('executeCrossNavigation', this.executeCrossNavigation)
            emitter.on('openSaveCurrentViewDialog', this.onOpenSaveCurrentViewDialog)
            emitter.on('openSavedViewsListDialog', this.onOpenSavedViewsListDialog)
            emitter.on('newDashboardClosed', this.onNewDashboardClosed)
        },
        removeEventListeners() {
            emitter.off('openNewWidgetPicker', this.openNewWidgetPicker)
            emitter.off('openDatasetManagement', this.openDatasetManagementDialog)
            emitter.off('openWidgetEditor', this.openWidgetEditor)
            emitter.off('saveDashboard', this.onSaveDashboardClicked)
            emitter.off('openDashboardGeneralSettings', this.openGeneralSettings)
            emitter.off('executeCrossNavigation', this.executeCrossNavigation)
            emitter.off('openSaveCurrentViewDialog', this.onOpenSaveCurrentViewDialog)
            emitter.off('openSavedViewsListDialog', this.onOpenSavedViewsListDialog)
            emitter.off('newDashboardClosed', this.onNewDashboardClosed)
        },
        async getData() {
            this.loading = true
            if (!this.dashboardId) this.dashboardId = cryptoRandomString({ length: 16, type: 'base64' })
            this.$emit('dashboardIdSet', this.dashboardId)
            if (this.filtersData) {
                this.drivers = loadDrivers(this.filtersData, this.model)
                this.currentView.drivers = this.filtersData
            }
            if (!this.initialDataLoadedMap.profileAttributesLoaded) this.loadProfileAttributes()
            if (this.isEnterprise) this.loadDashboardThemes()
            await this.loadModel()
            if (!this.initialDataLoadedMap.internationalizationLoaded) this.loadInternationalization()
            this.setDashboardDrivers(this.dashboardId, this.drivers)
            this.loadOutputParameters()
            await this.loadCrossNavigations()
            this.setCurrentDashboardView(this.dashboardId, this.currentView)
            this.loading = false
        },
        async loadModel() {
            let tempModel = null as any
            if (this.newDashboardMode) {
                tempModel = createNewDashboardModel()
            } else {
                await this.$http
                    .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/documentexecution/` + this.document?.id + '/templates')
                    .then((response: AxiosResponse<any>) => (tempModel = response.data))
                    .catch(() => {})
            }

            this.datasets = this.newDashboardMode ? [] : await loadDatasets(tempModel, this.appStore, this.setAllDatasets, this.$http)
            this.model =
                (tempModel && this.newDashboardMode) || typeof tempModel.configuration?.id != 'undefined' ? await formatNewModel(tempModel, this.datasets, this.$http) : await (formatModel(tempModel, this.document, this.datasets, this.drivers, this.profileAttributes, this.$http, this.user) as any)
            setDatasetIntervals(this.model?.configuration.datasets, this.datasets)
            if (this.propView) {
                this.loadSelectedViewForExecution(this.propView)
                applyDashboardViewToModel(this.model, this.selectedViewForExecution)

                this.drivers = loadDrivers(this.propView.drivers, this.model)
                this.setDashboardDrivers(this.dashboardId, this.drivers)
                emitter.emit('loadPivotStates', this.selectedViewForExecution)
            }
            this.store.setDashboard(this.dashboardId, this.model)
            this.store.setSelections(this.dashboardId, this.model.configuration.selections, this.$http)
            this.store.setDashboardDocument(this.dashboardId, this.document)
        },
        async loadInternationalization() {
            this.initialDataLoadedMap.internationalizationLoaded = true
            this.appStore.setLoading(true)
            const result = (this.appStore.$state as any).user.locale.split('_')
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/i18nMessages/?currCountry=${result[1]}&currLanguage=${result[0]}&currScript=`)
                .then((response: AxiosResponse<any>) => {
                    this.internationalization = response.data
                    this.setInternationalization(response.data)
                })
                .catch(() => {})

            this.appStore.setLoading(false)
        },
        async loadCrossNavigations() {
            if (this.newDashboardMode) return
            this.appStore.setLoading(true)
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/crossNavigation/${this.document?.label}/loadCrossNavigationByDocument`)
                .then((response: AxiosResponse<any>) => (this.crossNavigations = response.data))
                .catch(() => {})
            this.appStore.setLoading(false)
            this.store.setCrossNavigations(this.dashboardId, this.crossNavigations)
        },
        loadOutputParameters() {
            if (this.newDashboardMode) return
            const formattedOutputParameters = this.document ? getFormattedOutputParameters(this.document.outputParameters) : []
            this.store.setOutputParameters(this.dashboardId, formattedOutputParameters)
        },
        loadProfileAttributes() {
            this.initialDataLoadedMap.profileAttributesLoaded = true
            this.profileAttributes = []
            const user = this.appStore.getUser()
            if (user && user.attributes) {
                Object.keys(user.attributes).forEach((key: string) =>
                    this.profileAttributes.push({
                        name: key,
                        value: user.attributes[key]
                    })
                )
            }
            this.setProfileAttributes(this.profileAttributes)
        },
        async loadDashboardThemes() {
            this.dashboardThemes = []
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/dashboardtheme`).then((response: AxiosResponse<any>) => {
                this.dashboardThemes = response.data
            })
            this.store.setAllThemes(this.dashboardThemes)
        },
        loadSelectedViewForExecution(view: IDashboardView) {
            this.selectedViewForExecution = view
        },
        openNewWidgetPicker(event: any) {
            if (event !== this.dashboardId) return
            this.widgetPickerVisible = true
        },
        onWidgetPickerClosed() {
            this.widgetPickerVisible = false
        },
        openDatasetManagementDialog(event: any) {
            if (event !== this.dashboardId) return
            this.datasetEditorVisible = true
            emitter.emit('datasetManagementOpened')
            clearAllDatasetIntervals()
        },
        openWidgetEditor(payload: any) {
            if (payload.dashboardId !== this.dashboardId) return
            this.selectedWidget = payload.widget
            this.setWidgetEditorToVisible()
        },
        openNewWidgetEditor(widget: any) {
            this.selectedWidget = { type: widget?.type, new: true }
            this.setWidgetEditorToVisible()
        },
        setWidgetEditorToVisible() {
            this.widgetPickerVisible = false
            if (!this.widgetEditorVisible) this.widgetEditorVisible = true
            emitter.emit('widgetEditorOpened')
            clearAllDatasetIntervals()
        },
        emptyStoreValues() {
            if (!this.dashboardId) return
            this.store.removeDashboard(this.dashboardId)
            this.store.setCrossNavigations(this.dashboardId, [])
            this.store.setOutputParameters(this.dashboardId, [])
            this.store.setSelections(this.dashboardId, [], this.$http)
            this.setDashboardDrivers(this.dashboardId, [])
            this.setProfileAttributes([])
            this.setHTMLGaleryItems(this.dashboardId, [])
            this.setPythonGaleryItems(this.dashboardId, [])
            this.setCustomChartGaleryItems(this.dashboardId, [])
        },
        closeWidgetEditor() {
            this.widgetEditorVisible = false
            this.selectedWidget = null
            emitter.emit('widgetEditorClosed')
            setDatasetIntervals(this.model.configuration.datasets, this.datasets)
        },
        closeDatasetEditor() {
            this.datasetEditorVisible = false
            emitter.emit('datasetManagementClosed')
        },
        async onSaveDashboardClicked(event: any) {
            if (!this.document || event !== this.dashboardId) return
            if (this.newDashboardMode) {
                this.saveDialogVisible = true
            } else {
                await this.saveDashboard(this.document)
            }
        },
        async saveNewDashboard(document: { name: string; label: string }) {
            await this.saveDashboard(document)
        },
        async saveDashboard(document: any) {
            this.appStore.setLoading(true)
            if (!this.document) return
            const folders = this.newDashboardMode && this.$route.query.folderId ? [this.$route.query.folderId] : []
            const postData = {
                document: {
                    name: document.name,
                    label: document.label,
                    description: document.description,
                    type: 'DASHBOARD'
                },
                customData: {
                    templateContent: this.getTemplateContent()
                },
                action: this.newDashboardMode ? 'DOC_SAVE' : 'MODIFY_COCKPIT',
                folders: folders
            }

            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/saveDocument`, postData)
                .then(() => {
                    this.appStore.setInfo({
                        title: this.$t('common.toast.createTitle'),
                        msg: this.$t('common.toast.success')
                    })
                    this.saveDialogVisible = false
                    if (this.newDashboardMode) this.$emit('newDashboardSaved', document)
                })
                .catch(() => {})

            this.appStore.setLoading(false)
        },
        getTemplateContent() {
            const dashboardModel = deepcopy(this.store.getDashboard(this.dashboardId))
            dashboardModel.configuration.selections = this.getSelections(this.dashboardId)
            formatDashboardForSave(dashboardModel)
            return dashboardModel
        },
        onSelectionsRemove(selections: ISelection[]) {
            this.selectionsDialogVisible = false
            this.removeSelections(selections, this.dashboardId, this.$http)
        },
        openGeneralSettings(event) {
            if (event.dashboardId !== this.dashboardId) return
            this.generalSettingsVisible = true
            this.generalSettingsMode = event.mode ?? 'General'

            this.customHeaderVisible = false
        },
        closeGeneralSettings() {
            this.generalSettingsVisible = false
            this.generalSettingsMode = 'General'
            emitter.emit('dashboardGeneralSettingsClosed')

            this.customHeaderVisible = true
        },
        executeCrossNavigation(payload: any) {
            const crossNavigations = this.getCrossNavigations(this.dashboardId)
            payload.crossNavigations = crossNavigations
            this.$emit('executeCrossNavigation', payload)
        },
        onOpenSaveCurrentViewDialog(event: any) {
            if (!this.document || event !== this.dashboardId) return
            emitter.emit('savePivotStates')
            this.currentView.settings.selections = this.getSelections(this.dashboardId)
            this.currentView.drivers = this.filtersData
            this.selectedView = { ...this.currentView, new: true }
            this.saveViewDialogVisible = true
        },
        onSaveViewListDialogClose() {
            this.saveViewDialogVisible = false
            this.selectedView = null
        },
        onOpenSavedViewsListDialog(event: any) {
            if (!this.document || event !== this.dashboardId) return
            this.savedViewsListDialogVisible = true
        },
        moveView(view: IDashboardView) {
            this.savedViewsListDialogVisible = false
            this.selectedView = view
            this.saveViewDialogVisible = true
        },
        executeView(view: IDashboardView) {
            this.savedViewsListDialogVisible = false
            this.loadSelectedViewForExecution(view)
            this.$emit('executeView', view)
        },
        onAllDatasetsLoaded(event: any) {
            this.datasets = event
            this.datasetsLoaded = true
        },
        onNewDashboardClosed(event: any) {
            if (!this.document || event !== this.dashboardId) return
            this.model = null
            this.emptyStoreValues()
        }
    }
})
</script>

<style lang="scss">
.dashboard-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}
@media screen and (max-width: 600px) {
    .dashboard-container {
        height: calc(100vh - var(--kn-mainmenu-width));
    }
}

.dashboard-renderer-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    flex: 1 1 auto;
    .dashboard-renderer-header {
        width: 100%;
    }
    .dashboard-renderer-core {
        flex: 1 1 auto;
    }
}

.dashboard-container-popup {
    height: 100%;
    flex: 1;
}
</style>
