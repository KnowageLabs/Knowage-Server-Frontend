<template>
    <div v-show="model && visible && showDashboard" :id="`dashboard_${model?.configuration?.id}`" :class="mode === 'dashboard-popup' ? 'dashboard-container-popup' : 'dashboard-container'">
        <Button v-if="alwaysShowSelectionButton || store.dashboards[dashboardId]?.selections?.length > 0" icon="fa-regular fa-rectangle-list" class="p-m-3 p-button-rounded p-button-text p-button-plain" style="position: fixed; right: 0; z-index: 999; background-color: white; box-shadow: 0px 2px 3px #ccc" :title="$t('dashboard.selectionsList')" @click="selectionsDialogVisible = true" />

        <div class="dashboard-renderer-container">
            <DashboardHeaderWidget v-if="!loading && showDashboard && model?.configuration?.customHeader && customHeaderVisible && model.configuration.menuWidgets.enableCustomHeader" :dashboard-id="dashboardId" :prop-widget="model?.configuration?.customHeader" :datasets="model.configuration.datasets" :document-drivers="drivers" :variables="model ? model.configuration.variables : []" :custom-chart-gallery-prop="customChartGallery"></DashboardHeaderWidget>

            <div class="dashboard-renderer-core">
                <DashboardRenderer v-if="!loading && visible && showDashboard" :document="document" :model="model" :datasets="datasets" :dashboard-id="dashboardId" :document-drivers="drivers" :variables="model ? model.configuration.variables : []"></DashboardRenderer>
            </div>
        </div>

        <Transition name="editorEnter" appear>
            <DatasetEditor v-if="datasetEditorVisible" :dashboard-id-prop="dashboardId" :available-datasets-prop="datasets" :filters-data-prop="filtersData" :datasets-loaded="datasetsLoaded" @close-dataset-editor="closeDatasetEditor" @dataset-editor-saved="closeDatasetEditor" @all-datasets-loaded="onAllDatasetsLoaded" />
        </Transition>

        <Transition name="editorEnter" appear>
            <DashboardGeneralSettings v-if="generalSettingsVisible" :dashboard-id="dashboardId" :datasets="datasets" :document-drivers="drivers" :profile-attributes="profileAttributes" :general-settings-mode="generalSettingsMode" @close-general-settings="closeGeneralSettings" @save-general-settings="generalSettingsVisible = false"></DashboardGeneralSettings>
        </Transition>

        <Transition>
            <WidgetPickerDialog v-if="widgetPickerVisible" :visible="widgetPickerVisible" @open-new-widget-editor="openNewWidgetEditor" @close-widget-picker="onWidgetPickerClosed" />
        </Transition>
        <DashboardControllerSaveDialog v-if="saveDialogVisible" :visible="saveDialogVisible" @save="saveNewDashboard" @close="saveDialogVisible = false"></DashboardControllerSaveDialog>
        <SelectionsListDialog v-if="selectionsDialogVisible" :visible="selectionsDialogVisible" :document="document" :dashboard-id="dashboardId" @close="selectionsDialogVisible = false" @save="onSelectionsRemove" />
    </div>

    <WidgetEditor v-if="widgetEditorVisible" :dashboard-id="dashboardId" :prop-widget="selectedWidget" :datasets="datasets" :document-drivers="drivers" :variables="model ? model.configuration.variables : []" :custom-chart-gallery-prop="customChartGallery" data-test="widget-editor" @close="closeWidgetEditor" @widget-saved="closeWidgetEditor" @widget-updated="closeWidgetEditor"></WidgetEditor>

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
import { IDashboardDataset, ISelection, IGalleryItem, IDataset, IDashboardView, IVariable, SelectorDataMap, WidgetData } from './Dashboard'
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
import DashboardControllerSaveDialog from './DashboardControllerSaveDialog.vue'
import SelectionsListDialog from './widget/SelectorWidget/SelectionsListDialog.vue'
import DashboardGeneralSettings from './generalSettings/DashboardGeneralSettings.vue'
import deepcopy from 'deepcopy'
import DashboardSaveViewDialog from './DashboardViews/DashboardSaveViewDialog/DashboardSaveViewDialog.vue'
import DashboardSavedViewsDialog from './DashboardViews/DashboardSavedViewsDialog/DashboardSavedViewsDialog.vue'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import DashboardHeaderWidget from './widget/DashboardHeaderWidget/DashboardHeaderWidget.vue'
import { setVairableExecutionDateValue, setVairableLocaleValue, setVariableActiveSelectionValue, setVariableExectuionTimeValue, setVariableValueFromDriver } from './generalSettings/VariablesHelper'
import { getWidgetData } from './DashboardDataProxy'
import { iPythonConfiguration } from '../../managers/functionsCatalog/FunctionsCatalog'
import moment from 'moment'
import dashboardDescriptor from './DashboardDescriptor.json'

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
        filtersData: {
            type: Object as PropType<{
                filterStatus: iParameter[]
                isReadyForExecution: boolean
            }>
        },
        newDashboardMode: { type: Boolean },
        mode: { type: Object as PropType<string | null>, required: true },
        propView: { type: Object as PropType<IDashboardView | null> },
        filtersLoaded: { type: Boolean }
    },
    emits: ['newDashboardSaved', 'executeCrossNavigation', 'dashboardIdSet', 'executeView'],
    provide() {
        return {
            selectorWidgetsInitialData: this.selectorWidgetsData as SelectorDataMap,
            dashboardId: this.dashboardId
        }
    },
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
                crossNavigationsLoaded: false
            },
            selectorWidgetsData: {} as SelectorDataMap
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
            if (!this.showDashboard || !this.visible) return
            await this.getData()
        },
        async propView() {
            if (!this.showDashboard || (!this.filtersData?.isReadyForExecution && !this.newDashboardMode)) return
            await this.getData()
        },
        'filtersData.isReadyForExecution': {
            async handler(newVal) {
                if (this.showDashboard && newVal) await this.getData()
            }
        }
    },
    async mounted() {
        this.setEventListeners()
        if (this.isEnterprise) {
            await this.loadDashboardThemes()
            await this.loadPythonEnvironments()
        }
        if (this.newDashboardMode) await this.getData()
    },
    beforeUnmount() {
        this.emptyStoreValues()
        clearAllDatasetIntervals()
    },
    methods: {
        ...mapState(dashboardStore, ['dashboards']),
        ...mapActions(dashboardStore, ['getDashboardDrivers', 'removeSelections', 'setAllDatasets', 'getSelections', 'setInternationalization', 'getInternationalization', 'setDashboardDocument', 'setDashboardDrivers', 'setProfileAttributes', 'getCrossNavigations', 'setCurrentDashboardView', 'setHTMLGaleryItems', 'setPythonGaleryItems', 'setCustomChartGaleryItems', 'setSelectedSheetIndex', 'setExecutionTime']),
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
            emitter.on('selectionsChanged', this.onSelectionsChanged)
            emitter.on('selectionsDeleted', this.onSelectionsChanged)
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
            emitter.off('selectionsChanged', this.onSelectionsChanged)
            emitter.off('selectionsDeleted', this.onSelectionsChanged)
        },
        async getData() {
            this.loading = true
            if (!this.dashboardId) this.dashboardId = crypto.randomUUID()
            this.$emit('dashboardIdSet', this.dashboardId)
            if (this.filtersData) {
                this.drivers = loadDrivers(this.filtersData, this.model)
                this.currentView.drivers = this.filtersData
            }
            if (!this.initialDataLoadedMap.profileAttributesLoaded) this.loadProfileAttributes()
            await this.loadModel()
            this.setDashboardDrivers(this.dashboardId, this.drivers)
            this.loadOutputParameters()
            await this.loadCrossNavigations()
            this.setCurrentDashboardView(this.dashboardId, this.currentView)
            this.$watch('model.configuration.datasets', (modelDatasets: IDashboardDataset[]) => setDatasetIntervals(modelDatasets, this.datasets))
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
            this.model = (tempModel && this.newDashboardMode) || typeof tempModel.configuration?.id != 'undefined' ? await formatNewModel(tempModel, this.datasets, this.$http, this.dashboardThemes) : await (formatModel(tempModel, this.document, this.datasets, this.drivers, this.profileAttributes, this.$http, this.user) as any)
            setDatasetIntervals(this.model?.configuration.datasets, this.datasets)
            if (this.propView) {
                this.loadSelectedViewForExecution(this.propView)
                applyDashboardViewToModel(this.model, this.selectedViewForExecution)

                this.drivers = loadDrivers(this.propView.drivers, this.model)
                this.setDashboardDrivers(this.dashboardId, this.drivers)
                emitter.emit('loadPivotStates', this.selectedViewForExecution)
            }
            this.updateDatasetDriversWithSidebarValues()

            this.store.setDashboard(this.dashboardId, this.model)
            this.setDashboardDrivers(this.dashboardId, this.drivers)

            await this.fetchAllSelectorDefaultValues()
            this.store.setSelections(this.dashboardId, this.model.configuration.selections, this.$http)
            this.store.setDashboardDocument(this.dashboardId, this.document)
            this.store.setExecutionTime(this.dashboardId, new Date())

            this.updateVariableValuesWithDriverValuesAfterExecution()
        },
        async sleep(time) {
            return new Promise((resolve) => setTimeout(resolve, time))
        },
        async fetchAllSelectorDefaultValues() {
            const selectorWidgets = this.model.widgets.filter((widget) => widget.type === 'selector' && widget.settings.configuration?.defaultValues?.enabled === true)
            const promises = selectorWidgets.map(async (widget) => {
                const selectorDefaultValues = widget.settings.configuration?.defaultValues

                this.initializeWidgetData(widget)

                //Initial Data
                this.selectorWidgetsData[widget.id].initialData = await this.fetchInitialWidgetData(widget)

                //Static Selections, get before selecting default value
                if (widget.settings?.configuration?.updateFromSelections) {
                    this.selectorWidgetsData[widget.id].widgetData = await this.fetchWidgetDataWithStaticSelections(widget)
                }
                this.updateSelectorOptions(widget)

                //Create Dynamic Selections
                const enabledOptions = this.selectorWidgetsData[widget.id].selectorOptions.filter((item) => !item.disabled)
                const selectionValue = this.getSelectionValue(selectorDefaultValues, enabledOptions)
                if (selectionValue) this.createDynamicSelection(widget, selectionValue, selectorDefaultValues)

                //Dynamic Selections, get after a dynamic selection has been created, this will return only selected/available options
                this.selectorWidgetsData[widget.id].widgetData = await this.fetchWidgetDataWithDynamicSelections(widget)
                this.updateSelectorOptions(widget)
            })

            await Promise.all(promises)
        },
        initializeWidgetData(widget: any) {
            this.selectorWidgetsData[widget.id] = {
                widgetData: {} as unknown as WidgetData,
                selectorOptions: [],
                initialData: {} as unknown as WidgetData
            }
        },
        async fetchInitialWidgetData(widget: any) {
            return await getWidgetData(this.dashboardId, widget, this.model?.configuration?.datasets, this.$http, true, [], { searchText: '', searchColumns: [] }, this.model.configuration, null, false)
        },
        async fetchWidgetDataWithStaticSelections(widget: any) {
            const nonDynamicSelections = this.model.configuration.selections.filter((selection) => !selection.dynamic)
            //TODO - should add associative selections here? look at WidgetController.vue, loadInitialData() for associations?
            return await getWidgetData(this.dashboardId, widget, this.model?.configuration?.datasets, this.$http, false, nonDynamicSelections, { searchText: '', searchColumns: [] }, this.model.configuration, null, false)
        },
        async fetchWidgetDataWithDynamicSelections(widget: any) {
            //TODO - should add associative selections here? look at WidgetController.vue, loadInitialData() for associations?
            return await getWidgetData(this.dashboardId, widget, this.model?.configuration?.datasets, this.$http, false, this.model.configuration.selections, { searchText: '', searchColumns: [] }, this.model.configuration, null, false)
        },
        updateSelectorOptions(widget: any) {
            // Use Set for O(1) lookup instead of O(n) findIndex - critical for large datasets (500k+ rows)
            const widgetDataSet = new Set(this.selectorWidgetsData[widget.id].widgetData?.rows?.map((row: any) => row.column_1) || [])

            this.selectorWidgetsData[widget.id].selectorOptions =
                this.selectorWidgetsData[widget.id]?.initialData?.rows?.map((initialOption: any) => ({
                    ...initialOption,
                    disabled: !widgetDataSet.has(initialOption.column_1)
                })) || []
        },
        getSelectionValue(selectorDefaultValues: any, enabledOptions: any[]) {
            let selectionValue = null as any
            switch (selectorDefaultValues.valueType) {
                case 'FIRST':
                    selectionValue = enabledOptions[0] || null
                    break
                case 'LAST':
                    selectionValue = enabledOptions[enabledOptions.length - 1] || null
                    break
                case 'STATIC':
                    if (typeof selectorDefaultValues.value === 'string' && selectorDefaultValues.value.includes(',')) selectionValue = selectorDefaultValues.value.split(',').map((v: string) => v.trim())
                    else selectionValue = selectorDefaultValues.value
                    break
                default:
                    break
            }
            return selectionValue
        },
        createDynamicSelection(widget: any, selectionValue: any, selectorDefaultValues: any) {
            const dynamicSelection = {
                datasetId: widget.dataset as number,
                datasetLabel: this.getDatasetLabel(widget.dataset as number),
                columnName: widget.columns[0]?.columnName ?? '',
                value: [selectorDefaultValues.valueType === 'STATIC' ? selectionValue : selectionValue?.column_1],
                aggregated: false,
                timestamp: new Date().getTime(),
                dynamic: true
            } as ISelection

            if (selectorDefaultValues.valueType === 'STATIC') {
                if (Array.isArray(selectionValue)) dynamicSelection.value = selectionValue
                else dynamicSelection.value = [selectionValue]
            } else dynamicSelection.value = [selectionValue?.column_1]

            if (widget?.settings?.isDateType) {
                const formattedDate = [moment(deepcopy(dynamicSelection.value[0])).format(dashboardDescriptor.selectionsDateFormat)]
                dynamicSelection.value = formattedDate
            }

            const existingSelection = this.model.configuration.selections[this.model.configuration.selections.findIndex((modelSelection: ISelection) => modelSelection.datasetId === dynamicSelection.datasetId && modelSelection.columnName === dynamicSelection.columnName)]

            if (existingSelection) {
                if (existingSelection.dynamic && existingSelection.value.toString() !== dynamicSelection.value.toString()) {
                    existingSelection.value = dynamicSelection.value
                } else return
            } else {
                this.model.configuration.selections.push(dynamicSelection)
            }
        },

        getDatasetLabel(datasetId: number) {
            const index = this.datasets.findIndex((dataset: IDataset) => dataset.id.dsId == datasetId)
            return index !== -1 ? this.datasets[index].label : ''
        },
        updateVariableValuesWithDriverValuesAfterExecution() {
            if (!this.model?.configuration) return
            this.model.configuration.variables = this.model.configuration.variables.map((variable: IVariable) => {
                switch (variable.type) {
                    case 'driver':
                        setVariableValueFromDriver(variable, this.drivers)
                        break
                    case 'executionTime':
                        setVariableExectuionTimeValue(variable, this.dashboardId)
                        break
                    case 'executionDate':
                        setVairableExecutionDateValue(variable, this.dashboardId)
                        break
                    case 'locale':
                        setVairableLocaleValue(variable)
                        break
                    case 'activeSelection':
                        setVariableActiveSelectionValue(variable, this.dashboardId)
                }
                return variable
            })
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
            if (!this.isEnterprise) return
            this.dashboardThemes = []
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/dashboardtheme`).then((response: AxiosResponse<any>) => {
                this.dashboardThemes = response.data
            })
            this.store.setAllThemes(this.dashboardThemes)
        },
        async loadPythonEnvironments() {
            if (!this.isEnterprise) return
            let pythonEnvironments = [] as iPythonConfiguration[]
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/configs/category/PYTHON_CONFIGURATION`)
                .then((response: AxiosResponse<any>) => {
                    pythonEnvironments = response.data ?? []
                })
                .catch(() => {})
            this.store.setPythonEnvironments(pythonEnvironments)
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
            this.setSelectedSheetIndex(0)
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
            setDatasetIntervals(this.model.configuration.datasets, this.datasets)
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
            clearAllDatasetIntervals()

            this.customHeaderVisible = false
        },
        closeGeneralSettings() {
            this.generalSettingsVisible = false
            this.generalSettingsMode = 'General'
            emitter.emit('dashboardGeneralSettingsClosed')
            setDatasetIntervals(this.model.configuration.datasets, this.datasets)

            this.customHeaderVisible = true
        },
        executeCrossNavigation(payload: any) {
            if (payload.dashboardId && payload.dashboardId !== this.dashboardId) return

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
        },
        onSelectionsChanged() {
            this.updateVariableValuesWithDriverValuesAfterExecution()
        },
        updateDatasetDriversWithSidebarValues() {
            if (this.drivers && this.model?.configuration?.datasets) {
                this.model.configuration.datasets.forEach((dataset) => {
                    if (dataset.drivers && dataset.drivers.length > 0) {
                        dataset.drivers.forEach((datasetDriver) => {
                            const matchingDriver = this.drivers.find((driver) => driver.urlName === datasetDriver.urlName)

                            if (matchingDriver) {
                                if (!datasetDriver.parameterValue) datasetDriver.parameterValue = []

                                if (datasetDriver.parameterValue.length > 0) {
                                    datasetDriver.parameterValue.forEach((param) => {
                                        param.value = matchingDriver.value
                                        param.description = matchingDriver.description || ''
                                    })
                                } else {
                                    datasetDriver.parameterValue.push({
                                        value: matchingDriver.value,
                                        description: matchingDriver.description || ''
                                    })
                                }
                            }
                        })
                    }
                })
            }
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
