<template>
    <div class="dashboardEditor">
        <Toolbar class="kn-toolbar kn-toolbar--primary">
            <template #start>{{ $t('dashboard.generalSettings.title') }}</template>
            <template #end>
                <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" data-test="save-button" @click="saveGeneralSettings" />
                <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" data-test="close-button" @click="$emit('closeGeneralSettings')" />
            </template>
        </Toolbar>

        <div class="datasetEditor-container kn-overflow">
            <DashboardGeneralSettingsList :dashboard-model-prop="dashboardModel" :selected="selectedOption" @selected-option="setSelectedOption"></DashboardGeneralSettingsList>
            <DashboardVariables v-if="selectedOption === 'Variables'" :dashboard-id="dashboardId" :prop-variables="variables" :selected-datasets="selectedDatasets" :selected-datasets-columns-map="selectedDatasetColumnsMap" :profile-attributes="profileAttributes" />
            <DashboardInformation v-if="selectedOption === 'Information'" :dashboard-model-prop="dashboardModel" />
            <DashboardBackground v-if="selectedOption === 'Background'" :dashboard-model-prop="dashboardModel" />
            <MenuWidgets v-if="selectedOption === 'MenuWidgets'" :menu-widgets-config-prop="menuWidgetsConfig" />
            <CssEditor v-if="selectedOption === 'CSS'" :dashboard-model-prop="dashboardModel" />
            <DashboardThemes v-if="isEnterprise && selectedOption === 'Themes'" :dashboard-model-prop="dashboardModel" />
            <div v-if="customHeaderWidgetEditorVisible && customHeaderWidget" class="p-d-flex p-flex-column kn-flex p-mr-3 p-my-3 dashboard-card-shadow kn-overflow dashboard-scrollbar">
                <span class="p-p-3">
                    <InputSwitch v-model="menuWidgetsConfig.enableCustomHeader" />
                    <label class="kn-material-input-label p-ml-3">{{ $t('dashboard.generalSettings.menuWidgets.enableCustomHeader') }}</label>
                </span>
                <WidgetEditor ref="widgetEditor" :dashboard-id="dashboardId" :datasets="datasets" :variables="variables" :prop-widget="customHeaderWidget" :class="{ 'editor-disabled': !menuWidgetsConfig.enableCustomHeader }"></WidgetEditor>
            </div>
            <AiSettings v-if="isEnterprise && selectedOption === 'aisettings'" :dashboard-model-prop="dashboardModel" @change="setAiModel" />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IVariable, IDataset, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions, mapState } from 'pinia'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import DashboardGeneralSettingsList from './DashboardGeneralSettingsList.vue'
import DashboardInformation from './information/DashboardInformation.vue'
import DashboardBackground from './background/DashboardBackground.vue'
import CssEditor from './cssEditor/DashboardCssEditor.vue'
import MenuWidgets from './menu&widgets/Menu&Widgets.vue'
import DashboardVariables from './DashboardVariables.vue'
import DashboardThemes from './themes/DashboardThemes.vue'
import AiSettings from './aisettings/DashboardAiSettings.vue'
import store from '@/modules/documentExecution/dashboard/Dashboard.store'
import mainStore from '@/App.store'
import deepcopy from 'deepcopy'
import { setVariableValueFromDataset } from './VariablesHelper'
import { applySelectedThemeToWidgets } from './themes/ThemesHelper'
import WidgetEditor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditor.vue'
import { createCustomHeaderWidget } from './DashboardGeneralSettingsHelper'
import { IMenuAndWidgets } from '../Dashboard'
import { addMissingMenuWidgetsConfiguration } from '../DashboardHelpers'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import InputSwitch from 'primevue/inputswitch'

export default defineComponent({
    name: 'dashboard-general-settings',
    components: { DashboardGeneralSettingsList, DashboardVariables, DashboardInformation, DashboardBackground, MenuWidgets, CssEditor, DashboardThemes, WidgetEditor, InputSwitch, AiSettings },
    props: {
        dashboardId: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        profileAttributes: { type: Array as PropType<{ name: string; value: string }[]>, required: true },
        generalSettingsMode: { type: String, default: 'General' }
    },
    emits: ['closeGeneralSettings'],
    data() {
        return {
            selectedOption: '' as string,
            dashboardModel: null as any,
            variables: [] as IVariable[],
            selectedDatasets: [] as IDataset[],
            selectedDatasetColumnsMap: {},
            customHeaderWidget: null as IWidget | null,
            customHeaderWidgetEditorVisible: false,
            menuWidgetsConfig: {} as IMenuAndWidgets
        }
    },
    computed: {
        ...mapState(mainStore, ['isEnterprise'])
    },
    watch: {},
    created() {
        this.loadDashboardModel()
        this.setSelectedOption(this.generalSettingsMode)
        this.loadVariables()
        this.loadSelectedDatasets()
        this.loadSelectedDatasetColumnNames()
        this.loadMenuAndWidgetConfiguration()
    },
    methods: {
        ...mapActions(store, ['getDashboard', 'getAllThemes']),
        ...mapActions(mainStore, ['getUser']),
        loadDashboardModel() {
            this.dashboardModel = this.getDashboard(this.dashboardId)
            this.customHeaderWidget = deepcopy(this.dashboardModel.configuration.customHeader)
        },
        loadVariables() {
            if (this.dashboardModel && this.dashboardModel.configuration) this.variables = deepcopy(this.dashboardModel.configuration.variables)
        },
        loadSelectedDatasets() {
            this.selectedDatasets = [] as IDataset[]
            if (this.dashboardModel && this.dashboardModel.configuration) {
                const tempModelDatasets = deepcopy(this.dashboardModel.configuration.datasets)
                for (let i = 0; i < tempModelDatasets.length; i++) {
                    const tempDataset = tempModelDatasets[i]
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
            }
        },
        loadSelectedDatasetColumnNames() {
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return
            this.selectedDatasets.forEach((dataset: IDataset) => this.loadSelectedDatasetColumnName(dataset))
        },
        loadSelectedDatasetColumnName(dataset: IDataset) {
            this.selectedDatasetColumnsMap[dataset.id.dsId] = { name: dataset.name, columns: [] }
            for (let i = 0; i < dataset.metadata.fieldsMeta.length; i++) {
                this.selectedDatasetColumnsMap[dataset.id.dsId].columns.push(dataset.metadata.fieldsMeta[i].name)
            }
        },
        setSelectedOption(option: string) {
            if (option === 'Custom Header') {
                if (!this.customHeaderWidget) this.customHeaderWidget = createCustomHeaderWidget()
                this.customHeaderWidgetEditorVisible = true
            } else {
                this.saveCustomHeader()
                this.customHeaderWidgetEditorVisible = false
            }
            this.selectedOption = option
        },
        loadMenuAndWidgetConfiguration() {
            addMissingMenuWidgetsConfiguration(this.dashboardModel)
            this.menuWidgetsConfig = deepcopy(this.dashboardModel.configuration.menuWidgets) as IMenuAndWidgets
        },
        async saveGeneralSettings() {
            let refreshWidgets = false
            this.saveCustomHeader()

            for (let i = 0; i < this.variables.length; i++) {
                if (this.variables[i].type === 'dataset') {
                    await setVariableValueFromDataset(this.variables[i], this.datasets, this.$http)
                    refreshWidgets = true
                }
            }

            this.dashboardModel.configuration.variables = this.variables
            if (this.isEnterprise && this.dashboardModel.configuration.theme?.id != null) {
                const selectedTheme = this.getSelectedTheme(this.dashboardModel.configuration.theme.id)
                if (selectedTheme) this.dashboardModel.configuration.theme = { ...selectedTheme }
                applySelectedThemeToWidgets(this.dashboardModel.widgets, this.dashboardModel.configuration.theme)
            }
            this.updateWidgetMenuSettings()

            if (refreshWidgets) emitter.emit('refreshAfterGeneralSettingsChange')
            this.$emit('closeGeneralSettings')
        },
        getSelectedTheme(themeId: number | null) {
            const allThemes = this.getAllThemes()
            return allThemes.find((theme: IDashboardTheme) => theme.id === themeId)
        },
        saveCustomHeader() {
            const customHeaderRef = this.$refs.widgetEditor as any
            if (customHeaderRef) this.dashboardModel.configuration.customHeader = deepcopy(customHeaderRef.widget)
        },
        updateWidgetMenuSettings() {
            this.dashboardModel.configuration.menuWidgets = this.menuWidgetsConfig
        },
        setAiModel(aiSettings: any) {
            this.dashboardModel.configuration.aiSettings = aiSettings
        }
    }
})
</script>
<style lang="scss">
.editor-disabled {
    pointer-events: none;
    opacity: 0.6;
}
</style>
