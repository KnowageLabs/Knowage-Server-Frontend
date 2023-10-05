<template>
    <div class="dashboardEditor">
        <Toolbar class="kn-toolbar kn-toolbar--primary">
            <template #start> {{ $t('dashboard.generalSettings.title') }} </template>
            <template #end>
                <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" @click="saveGeneralSettings" />
                <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" @click="$emit('closeGeneralSettings')" />
            </template>
        </Toolbar>

        <div class="datasetEditor-container kn-overflow">
            <DashboardGeneralSettingsList @selected-option="setSelectedOption"></DashboardGeneralSettingsList>
            <DashboardVariables v-if="selectedOption === 'Variables'" :dashboard-id="dashboardId" :prop-variables="variables" :selected-datasets="selectedDatasets" :selected-datasets-columns-map="selectedDatasetColumnsMap" :profile-attributes="profileAttributes" />
            <DashboardInformation v-if="selectedOption === 'Information'" :dashboard-model-prop="dashboardModel" />
            <DashboardBackground v-if="selectedOption === 'Background'" :dashboard-model-prop="dashboardModel" />
            <MenuWidgets v-if="selectedOption === 'MenuWidgets'" :dashboard-model-prop="dashboardModel" />
            <CssEditor v-if="selectedOption === 'CSS'" :dashboard-model-prop="dashboardModel" />
            <DashboardThemes v-if="selectedOption === 'Themes'" :dashboard-model-prop="dashboardModel" />
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IVariable, IDataset } from '@/modules/documentExecution/dashboard/Dashboard'
import { mapActions } from 'pinia'
import DashboardGeneralSettingsList from './DashboardGeneralSettingsList.vue'
import DashboardInformation from './information/DashboardInformation.vue'
import DashboardBackground from './background/DashboardBackground.vue'
import CssEditor from './cssEditor/DashboardCssEditor.vue'
import MenuWidgets from './menu&widgets/Menu&Widgets.vue'
import DashboardVariables from './DashboardVariables.vue'
import DashboardThemes from './themes/DashboardThemes.vue'
import store from '@/modules/documentExecution/dashboard/Dashboard.store'
import mainStore from '@/App.store'
import deepcopy from 'deepcopy'
import { setVariableValueFromDataset } from './VariablesHelper'

export default defineComponent({
    name: 'dashboard-general-settings',
    components: { DashboardGeneralSettingsList, DashboardVariables, DashboardInformation, DashboardBackground, MenuWidgets, CssEditor, DashboardThemes },
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
            selectedDatasetColumnsMap: {}
        }
    },
    computed: {},
    watch: {},
    created() {
        this.setSelectedOption(this.generalSettingsMode)
        this.loadDashboardModel()
        this.loadVariables()
        this.loadSelectedDatasets()
        this.loadSelectedDatasetColumnNames()
    },
    methods: {
        ...mapActions(store, ['getDashboard']),
        ...mapActions(mainStore, ['getUser']),
        loadDashboardModel() {
            this.dashboardModel = this.getDashboard(this.dashboardId)
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
            this.selectedOption = option
        },
        applySelectedThemeToWidgets() {
            const selectedTheme = this.dashboardModel.configuration.theme.config
            if (!selectedTheme) return

            console.log('----------selectedTheme: ', selectedTheme)

            this.dashboardModel.widgets.forEach((widget) => {
                switch (widget.type) {
                    case 'table':
                        ;['title', 'background', 'borders'].forEach((property: string) => (widget.settings.style[property] = selectedTheme.table.style[property]))
                        // widget.settings.style.t = { ...selectedTheme.table }
                        break
                    case 'selector':
                        widget.settings.style = selectedTheme.selector
                        break
                    case 'html':
                        widget.settings.style = selectedTheme.html
                        break
                    case 'text':
                        widget.settings.style = selectedTheme.text
                        break
                    case 'highcharts':
                    case 'chartJS':
                    case 'vega':
                        widget.settings.style = selectedTheme.chart
                        break
                    case 'customchart':
                        widget.settings.style = selectedTheme.customchart
                        break
                    case 'static-pivot-table':
                    case 'ce-pivot-table':
                        widget.settings.style = selectedTheme.pivot
                        break
                    case 'discovery':
                        widget.settings.style = selectedTheme.discovery
                        break
                    case 'python':
                        widget.settings.style = selectedTheme.python
                        break
                    case 'r':
                        widget.settings.style = selectedTheme.r
                        break
                    case 'selection':
                        widget.settings.style = selectedTheme.activeSelections
                        break
                    case 'image':
                        widget.settings.style = selectedTheme.image
                        break
                    case 'map':
                        widget.settings.style = selectedTheme.map
                        break
                    default:
                        break
                }
            })
            console.log('------ UPDATED DASHBOARD MODEL: ', this.dashboardModel)
        },
        async saveGeneralSettings() {
            for (let i = 0; i < this.variables.length; i++) {
                if (this.variables[i].type === 'dataset') await setVariableValueFromDataset(this.variables[i], this.datasets, this.$http)
            }
            this.dashboardModel.configuration.variables = this.variables

            this.applySelectedThemeToWidgets()
            console.log('THEME', this.dashboardModel.configuration.theme)
            console.log('THEME APPLIED', this.dashboardModel.widgets)
            this.$emit('closeGeneralSettings')
        }
    }
})
</script>
