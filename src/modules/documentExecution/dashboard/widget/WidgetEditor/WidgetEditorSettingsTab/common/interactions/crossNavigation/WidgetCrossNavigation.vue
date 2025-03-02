<template>
    <div v-if="crossNavigationModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-grid p-col-12 p-ai-center">
            <div v-if="!['html', 'text', 'highcharts', 'chartJS', 'image', 'customchart', 'static-pivot-table', 'vega', 'map', 'ce-pivot-table'].includes(widgetModel.type)" class="p-col-6 p-sm-12 p-md-6 p-d-flex p-flex-column kn-flex p-px-2">
                <label class="kn-material-input-label"> {{ $t('common.type') }}</label>
                <Dropdown v-model="crossNavigationModel.type" class="kn-material-input" :options="interactionTypes" option-value="value" :disabled="crossNavigationDisabled" @change="onInteractionTypeChanged">
                    <template #value="slotProps">
                        <div>
                            <span>{{ getTranslatedLabel(slotProps.value, interactionTypes, $t) }}</span>
                        </div>
                    </template>
                    <template #option="slotProps">
                        <div>
                            <span>{{ $t(slotProps.option.label) }}</span>
                        </div>
                    </template>
                </Dropdown>
            </div>
        </div>
        <div class="p-grid p-col-12 p-ai-center">
            <div v-if="['table', 'discovery'].includes(widgetModel.type) && crossNavigationModel.type === 'singleColumn'" class="p-sm-12 p-md-5 p-d-flex p-flex-row p-ai-center p-px-2">
                <div class="p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label"> {{ $t('common.column') }}</label>
                    <Dropdown v-model="crossNavigationModel.column" class="kn-material-input" :options="widgetModel.columns" option-label="alias" option-value="id" :disabled="crossNavigationDisabled"> </Dropdown>
                </div>
            </div>
            <div class="p-sm-10 p-md-5 p-d-flex p-flex-row p-ai-center">
                <div class="p-d-flex p-flex-column kn-flex p-mx-2">
                    <label class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.interactions.crossNavigationName') }}</label>
                    <Dropdown v-model="crossNavigationModel.name" class="kn-material-input" :options="crossNavigationOptions" :disabled="crossNavigationDisabled"> </Dropdown>
                </div>
            </div>
            <div v-if="crossNavigationModel.type === 'icon'" class="p-col-2 p-p-4">
                <WidgetEditorStyleToolbar :options="[{ type: 'icon' }]" :prop-model="{ icon: crossNavigationModel.icon }" :disabled="crossNavigationDisabled" @change="onStyleToolbarChange($event)"> </WidgetEditorStyleToolbar>
            </div>
            <div v-if="widgetModel.type === 'map'" class="p-d-flex p-flex-column kn-flex p-pt-2">
                <label class="kn-material-input-label">{{ $t('common.label') }}</label>
                <InputText v-model="crossNavigationModel.label" class="kn-material-input p-inputtext-sm" />
                <small>{{ $t('dashboard.widgetEditor.map.crossNavigationLabelHint') }}</small>
            </div>
        </div>
        <div v-if="crossNavigationModel.parameters" class="p-col-12 p-d-flex p-flex-row p-ai-center p-p-2">
            <TableWidgetOutputParametersList class="kn-flex p-mr-2" :widget-model="widgetModel" :prop-parameters="parameterList" :selected-datasets-columns-map="selectedDatasetsColumnsMap" :disabled="crossNavigationDisabled" @change="onParametersChanged"></TableWidgetOutputParametersList>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetCrossNavigation, IWidgetInteractionParameter, IDataset, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { emitter } from '../../../../../../DashboardHelpers'
import descriptor from '../WidgetInteractionsDescriptor.json'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import Dropdown from 'primevue/dropdown'
import TableWidgetOutputParametersList from './WidgetOutputParametersList.vue'
import WidgetEditorStyleToolbar from '../../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'table-widget-cross-navigation',
    components: { Dropdown, TableWidgetOutputParametersList, WidgetEditorStyleToolbar },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true }
    },
    setup() {
        const store = dashboardStore()
        return { store }
    },
    data() {
        return {
            descriptor,
            widget: null as IWidget | null,
            crossNavigationModel: null as IWidgetCrossNavigation | null,
            crossNavigationOptions: [] as string[],
            outputParameters: [] as any[],
            parameterList: [] as IWidgetInteractionParameter[],
            selectedDatasetsColumnsMap: {},
            getTranslatedLabel
        }
    },
    computed: {
        widgetType() {
            return this.widgetModel.type
        },
        crossNavigationDisabled() {
            return !this.crossNavigationModel || !this.crossNavigationModel.enabled
        },
        interactionTypes() {
            return this.widgetModel && this.widgetModel.type === 'table' ? this.descriptor.interactionTypes : this.descriptor.interactionTypes.slice(0, 2)
        }
    },
    watch: {
        crossNavigationDisabled() {
            this.onCrossNavigationEnabledChange()
        }
    },
    created() {
        this.setEventListeners()
        this.loadWidgetModel()
        this.loadCrossNavigationModel()
        this.loadCrossNavigationOptions()
        this.loadOutputParameters()
        this.loadParameterList()
        this.loadSelectedDatasetColumnNames()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromCrossNavigation', this.onColumnRemovedFromCrossNavigation)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromCrossNavigation', this.onColumnRemovedFromCrossNavigation)
        },
        onColumnRemovedFromCrossNavigation() {
            this.onColumnRemoved()
        },
        loadWidgetModel() {
            this.widget = this.widgetModel
        },
        loadCrossNavigationModel() {
            if (this.widgetModel?.settings?.interactions?.crossNavigation) this.crossNavigationModel = this.widgetModel.settings.interactions.crossNavigation
        },
        loadCrossNavigationOptions() {
            const temp = this.store.getCrossNavigations(this.dashboardId)
            if (temp) this.crossNavigationOptions = temp.map((crossNavigation: any) => crossNavigation.crossName)
        },
        onColumnRemoved() {
            this.loadCrossNavigationModel()
            this.loadParameterList()
        },
        loadOutputParameters() {
            this.outputParameters = this.store.getOutputParameters(this.dashboardId) ?? []
        },
        loadParameterList() {
            if (!this.crossNavigationModel) return

            this.parameterList = []
            for (let i = 0; i < this.outputParameters.length; i++) {
                const outputParameter = this.outputParameters[i]
                const temp = { enabled: false, name: outputParameter.name, type: '' } as IWidgetInteractionParameter
                const index = this.crossNavigationModel.parameters.findIndex((parameter: IWidgetInteractionParameter) => parameter.name === outputParameter.name)
                if (index !== -1) {
                    const modelParameter = this.crossNavigationModel?.parameters[index]
                    temp.enabled = modelParameter.enabled
                    temp.type = modelParameter.type
                    temp.value = modelParameter.value
                    temp.dataType = modelParameter.dataType
                    if (modelParameter.column) temp.column = modelParameter.column
                    if (modelParameter.dataset) temp.dataset = modelParameter.dataset
                }
                this.parameterList.push(temp)
            }
        },
        loadSelectedDatasetColumnNames() {
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return

            this.selectedDatasets.forEach((dataset: IDataset) => this.loadCrossSelectedDatasetColumnName(dataset))
        },
        loadCrossSelectedDatasetColumnName(dataset: IDataset) {
            this.selectedDatasetsColumnsMap[dataset.name] = []
            for (let i = 0; i < dataset.metadata.fieldsMeta.length; i++) {
                this.selectedDatasetsColumnsMap[dataset.name].push(dataset.metadata.fieldsMeta[i].name)
            }
        },
        onInteractionTypeChanged() {
            if (this.crossNavigationModel && this.crossNavigationModel.type !== 'icon') delete this.crossNavigationModel.icon
        },
        onParametersChanged(parameters: IWidgetInteractionParameter[]) {
            if (this.crossNavigationModel) this.crossNavigationModel.parameters = parameters
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (this.crossNavigationModel) this.crossNavigationModel.icon = model.icon
        },
        onCrossNavigationEnabledChange() {
            if (this.widget && this.crossNavigationModel?.enabled && this.widgetType !== 'table') {
                if (this.widget.settings.interactions.selection) this.widget.settings.interactions.selection.enabled = false
                if (this.widget.settings.interactions.link) this.widget.settings.interactions.link.enabled = false
                if (this.widget.settings.interactions.preview) this.widget.settings.interactions.preview.enabled = false
                if (this.widget.settings.interactions.iframe) this.widget.settings.interactions.iframe.enabled = false
            }
        }
    }
})
</script>
