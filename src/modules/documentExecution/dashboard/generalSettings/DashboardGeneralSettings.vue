<template>
    <div class="dashboardEditor">
        <Toolbar class="kn-toolbar kn-toolbar--primary">
            <template #start>{{ $t('dashboard.generalSettings.title') }}</template>
            <template #end>
                <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" data-test="save-button" @click="saveGeneralSettings" />
                <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" data-test="close-button" @click="$emit('closeGeneralSettings')" />
            </template>
        </Toolbar>

        <div class="datasetEditor-container">
            <DashboardGeneralSettingsList :dashboard-model-prop="dashboardModel" :selected="selectedOption" @selected-option="setSelectedOption"></DashboardGeneralSettingsList>
            <div v-if="selectedOption !== 'Custom Header'" class="general-settings-content">
                <div class="general-settings-panel-wrapper">
                    <KnHint v-if="!selectedOption || selectedOption === 'General'" class="p-as-center" :title="'common.settings'" :hint="'dashboard.widgetEditor.settings.hint'"></KnHint>
                    <q-list v-else-if="selectedOption !== 'Custom Header'" class="general-settings-accordion" bordered>
                        <q-expansion-item v-model="accordionOpen" :label="selectedOptionLabel" header-class="general-settings-accordion-header">
                            <DashboardVariables v-if="selectedOption === 'Variables'" :dashboard-id="dashboardId" :prop-variables="variables" :selected-datasets="selectedDatasets" :selected-datasets-columns-map="selectedDatasetColumnsMap" :profile-attributes="profileAttributes" />
                            <DashboardInformation v-if="selectedOption === 'Information'" :dashboard-model-prop="dashboardModel" />
                            <DashboardBackground v-if="selectedOption === 'Background'" :dashboard-model-prop="dashboardModel" />
                            <MenuWidgets v-if="selectedOption === 'MenuWidgets'" :menu-widgets-config-prop="menuWidgetsConfig" />
                            <CssEditor v-if="selectedOption === 'CSS'" :dashboard-model-prop="dashboardModel" />
                            <DashboardThemes v-if="isEnterprise && selectedOption === 'Themes'" :dashboard-model-prop="dashboardModel" />
                            <AiSettings v-if="isEnterprise && selectedOption === 'aisettings'" :dashboard-model-prop="dashboardModel" @change="setAiModel" />
                        </q-expansion-item>
                    </q-list>
                </div>
            </div>
            <div v-if="customHeaderWidgetEditorVisible && customHeaderWidget" class="p-d-flex p-flex-column kn-flex q-ma-md" style="border: 1px solid rgba(0, 0, 0, 0.12); border-radius: 4px">
                <q-toggle v-model="menuWidgetsConfig.enableCustomHeader" :label="$t('dashboard.generalSettings.menuWidgets.enableCustomHeader')" />
                <q-separator />
                <WidgetEditor ref="widgetEditor" :dashboard-id="dashboardId" :datasets="datasets" :variables="variables" :prop-widget="customHeaderWidget" :class="{ 'editor-disabled': !menuWidgetsConfig.enableCustomHeader }"></WidgetEditor>
            </div>
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
import WidgetEditor from '@/modules/documentExecution/dashboard/widget/WidgetEditor/WidgetEditor.vue'
import { createCustomHeaderWidget } from './DashboardGeneralSettingsHelper'
import { IMenuAndWidgets } from '../Dashboard'
import { addMissingMenuWidgetsConfiguration } from '../DashboardHelpers'
import descriptor from './DashboardGeneralSettingsDescriptor.json'
import KnHint from '@/components/UI/KnHint.vue'

export default defineComponent({
    name: 'dashboard-general-settings',
    components: { DashboardGeneralSettingsList, DashboardVariables, DashboardInformation, DashboardBackground, MenuWidgets, CssEditor, DashboardThemes, WidgetEditor, AiSettings, KnHint },
    props: {
        dashboardId: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        profileAttributes: { type: Array as PropType<{ name: string; value: string }[]>, required: true },
        generalSettingsMode: { type: String, default: '' }
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
            menuWidgetsConfig: {} as IMenuAndWidgets,
            accordionOpen: true as boolean
        }
    },
    computed: {
        ...mapState(mainStore, ['isEnterprise', 'configurations']),
        selectedOptionLabel(): string {
            const allOptions = [...descriptor.settingsList, { value: 'Themes', label: 'common.themes' }, { value: 'aisettings', label: 'dashboard.generalSettings.aisettings' }, { value: 'Custom Header', label: 'dashboard.generalSettings.menuWidgets.customHeader' }]
            const match = allOptions.find((o: any) => o.value === this.selectedOption)
            return match ? this.$t(match.label) : this.selectedOption
        }
    },
    watch: {
        selectedOption() {
            this.accordionOpen = true
        }
    },
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
            this.updateWidgetMenuSettings()

            if (refreshWidgets) emitter.emit('refreshAfterGeneralSettingsChange')
            this.$emit('closeGeneralSettings')
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

<style scoped lang="scss">
.general-settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.general-settings-panel-wrapper {
    max-width: 800px;
    margin: 0 auto;
}
</style>

<style lang="scss">
.general-settings-accordion {
    border-radius: 4px;

    .general-settings-accordion-header {
        font-weight: 500;
    }
}
</style>
