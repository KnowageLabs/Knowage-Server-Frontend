<template>
    <div v-if="crossNavigationModel" class="q-px-md q-pb-md">
        {{ crossNavigationModel }}
        <div class="row q-col-gutter-sm">
            <!-- Type: not shown for chart/special widget types -->
            <div v-if="!['html', 'text', 'highcharts', 'chartJS', 'image', 'customchart', 'static-pivot-table', 'map', 'ce-pivot-table'].includes(widgetModel.type)" class="col-6">
                <q-select v-model="crossNavigationModel.type" :options="interactionTypes" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="crossNavigationDisabled" @update:model-value="onInteractionTypeChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, interactionTypes, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section>
                                <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </template>
                </q-select>
            </div>

            <!-- Cross navigation name — always shown, half-width leaves room for col when needed -->
            <div class="col-3">
                <q-select v-model="crossNavigationModel.id" :options="crossNavigationOptions" :label="$t('dashboard.widgetEditor.interactions.crossNavigationName')" option-label="name" option-value="id" emit-value map-options outlined dense :disable="crossNavigationDisabled" @update:model-value="onCrossNavigationSelected" />
            </div>

            <!-- Column: table/discovery + singleColumn type — same row as type when both visible -->
            <div v-if="['table', 'discovery'].includes(widgetModel.type) && crossNavigationModel.type === 'singleColumn'" class="col-3">
                <q-select v-model="crossNavigationModel.column" :options="widgetModel.columns" :label="$t('common.column')" option-label="alias" option-value="id" emit-value map-options outlined dense :disable="crossNavigationDisabled" />
            </div>

            <!-- Icon toolbar: same row as name when icon type active -->
            <div v-if="crossNavigationModel.type === 'icon'" class="col-3">
                <WidgetEditorStyleToolbar :options="[{ type: 'icon' }]" :prop-model="{ icon: crossNavigationModel.icon }" :disabled="crossNavigationDisabled" @change="onStyleToolbarChange($event)" />
            </div>

            <!-- Map label + hint -->
            <template v-if="widgetModel.type === 'map'">
                <div class="col-12">
                    <q-input v-model="crossNavigationModel.label" :label="$t('common.label')" outlined dense :disable="crossNavigationDisabled" />
                    <div class="text-caption q-mt-xs text-grey-7">{{ $t('dashboard.widgetEditor.map.crossNavigationLabelHint') }}</div>
                </div>
            </template>

            <!-- Output parameters -->
            <template v-if="parameterList.length > 0">
                <div class="col-12"><q-separator /></div>
                <div class="col-12">
                    <TableWidgetOutputParametersList :widget-model="widgetModel" :prop-parameters="parameterList" :selected-datasets-columns-map="selectedDatasetsColumnsMap" :disabled="crossNavigationDisabled" @change="onParametersChanged" />
                </div>
            </template>

            <!-- Multiselection: table only, at bottom with separator -->
            <template v-if="['table'].includes(widgetModel.type) && crossNavigationModel.multiselection">
                <div class="col-12"><q-separator /></div>
                <div class="col-12">
                    <q-toggle v-model="crossNavigationModel.multiselection.enabled" :label="$t('dashboard.widgetEditor.interactions.enableMultiselection')" :disable="crossNavigationDisabled" dense @update:model-value="toggleMultiselect" />
                </div>
                <div class="col-12">
                    <WidgetEditorStyleToolbar
                        :options="descriptor.styleToolbarSelectionOptions"
                        :prop-model="{
                            color: crossNavigationModel.multiselection.properties.color,
                            'background-color': crossNavigationModel.multiselection.properties['background-color']
                        }"
                        :disabled="!crossNavigationModel.multiselection.enabled"
                        @change="onStyleToolbarChange($event)"
                    />
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetCrossNavigation, IWidgetInteractionParameter, IDataset, IWidgetStyleToolbarModel, IWidgetInteractions } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { emitter } from '../../../../../../DashboardHelpers'
import descriptor from '../WidgetInteractionsDescriptor.json'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import TableWidgetOutputParametersList from './WidgetOutputParametersList.vue'
import WidgetEditorStyleToolbar from '../../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'table-widget-cross-navigation',
    components: { TableWidgetOutputParametersList, WidgetEditorStyleToolbar },
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
            crossNavigationOptions: [] as { id: number; name: string }[],
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
            if (temp) {
                this.crossNavigationOptions = temp.map((crossNavigation: any) => ({ id: crossNavigation.crossId, name: crossNavigation.crossName }))
                if (this.crossNavigationModel?.name && !this.crossNavigationModel?.id) {
                    // backward-compat: old models only stored name, no id — fill the id from the server list
                    const match = this.crossNavigationOptions.find((opt: any) => opt.name === this.crossNavigationModel!.name)
                    if (match) this.crossNavigationModel.id = match.id
                } else if (this.crossNavigationModel?.id) {
                    // refresh the name in case the cross-navigation was renamed on the server
                    const match = this.crossNavigationOptions.find((opt: any) => opt.id === this.crossNavigationModel!.id)
                    if (match) this.crossNavigationModel.name = match.name
                }
            }
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
        onCrossNavigationSelected(value: number) {
            if (!this.crossNavigationModel) return
            const selected = this.crossNavigationOptions.find((opt: any) => opt.id === value)
            if (selected) {
                this.crossNavigationModel.id = selected.id
                this.crossNavigationModel.name = selected.name
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
            if (this.crossNavigationModel && this.crossNavigationModel.multiselection) {
                if (model.color !== undefined) this.crossNavigationModel.multiselection.properties.color = model.color
                if (model['background-color'] !== undefined) this.crossNavigationModel.multiselection.properties['background-color'] = model['background-color']
            }
        },
        onCrossNavigationEnabledChange() {
            if (this.widget && this.crossNavigationModel?.enabled && this.widgetType !== 'table') {
                if (this.widget.settings.interactions.selection) this.widget.settings.interactions.selection.enabled = false
                if (this.widget.settings.interactions.link) this.widget.settings.interactions.link.enabled = false
                if (this.widget.settings.interactions.preview) this.widget.settings.interactions.preview.enabled = false
                if (this.widget.settings.interactions.iframe) this.widget.settings.interactions.iframe.enabled = false
            }
        },
        toggleMultiselect() {
            const interactions = this.widgetModel?.settings?.interactions as IWidgetInteractions
            if (interactions) {
                Object.entries(interactions).forEach(([key, interaction]) => {
                    if (key !== 'crossNavigation' && interaction?.enabled) interaction.enabled = false
                })
            }
        }
    }
})
</script>
