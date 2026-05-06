<template>
    <div v-if="previewModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div class="col-12">
                <q-select v-model="previewModel.dataset" :options="selectedDatasets" :label="$t('common.dataset')" option-label="name" :option-value="(opt) => opt?.id?.dsId" emit-value map-options outlined dense :disable="previewDisabled" @update:model-value="onDatasetChanged" />
            </div>
            <div v-if="['table', 'discovery'].includes(widgetModel.type) && widgetModel.type !== 'chart' && widgetModel.type !== 'customchart'" class="col-6">
                <q-select v-model="previewModel.type" :options="descriptor.interactionTypes" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="previewDisabled" @update:model-value="onInteractionTypeChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.interactionTypes, $t) }}</span>
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

            <!-- Column (singleColumn) or icon toolbar — col-6, direct download inline -->
            <div v-if="previewModel.type === 'singleColumn'" class="col-6">
                <q-select v-model="previewModel.column" :options="widgetModel.columns" :label="$t('common.column')" option-label="alias" option-value="columnName" emit-value map-options outlined dense :disable="previewDisabled" />
            </div>
            <div v-else-if="previewModel.type === 'icon'" class="col-6">
                <WidgetEditorStyleToolbar :options="[{ type: 'icon' }]" :prop-model="{ icon: previewModel.icon }" :disabled="previewDisabled" @change="onStyleToolbarChange($event)" />
            </div>
            <div class="col-12 q-pb-xs">
                <q-toggle v-model="previewModel.directDownload" :label="$t('dashboard.widgetEditor.interactions.directDownload')" dense :disable="previewDisabled" />
            </div>

            <!-- Parameters -->
            <template v-if="previewModel.parameters && previewModel.parameters.length > 0">
                <div class="col-12"><q-separator /></div>
                <div class="col-12">
                    <TableWidgetPreviewParameterList :widget-model="widgetModel" :prop-parameters="previewModel.parameters" :selected-datasets-columns-map="selectedDatasetColumnNameMap" :dashboard-id="dashboardId" :disabled="previewDisabled" @change="onParametersChanged" />
                </div>
            </template>

            <!-- Multiselection: table only, at bottom with separator -->
            <template v-if="['table'].includes(widgetModel.type) && previewModel.multiselection">
                <div class="col-12"><q-separator /></div>
                <div class="col-12">
                    <q-toggle v-model="previewModel.multiselection.enabled" :label="$t('dashboard.widgetEditor.interactions.enableMultiselection')" :disable="previewDisabled" dense @update:model-value="toggleMultiselect" />
                </div>
                <div class="col-12">
                    <WidgetEditorStyleToolbar
                        :options="descriptor.styleToolbarSelectionOptions"
                        :prop-model="{
                            color: previewModel.multiselection.properties.color,
                            'background-color': previewModel.multiselection.properties['background-color']
                        }"
                        :disabled="!previewModel.multiselection.enabled"
                        @change="onStyleToolbarChange($event)"
                    />
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetInteractionParameter, IDataset, IDatasetParameter, IWidgetStyleToolbarModel, IWidgetPreview, IWidgetInteractions } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { emitter } from '../../../../../../DashboardHelpers'
import descriptor from '../WidgetInteractionsDescriptor.json'
import dashboardStore from '../../../../../../Dashboard.store'
import TableWidgetPreviewParameterList from './WidgetPreviewParameterList.vue'
import WidgetEditorStyleToolbar from '../../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'table-widget-preview',
    components: { TableWidgetPreviewParameterList, WidgetEditorStyleToolbar },
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
            previewModel: null as IWidgetPreview | null,
            dashboardModel: null as any,
            dashboardDatasets: [] as any[],
            selectedDatasetColumnIdMap: {},
            selectedDatasetColumnNameMap: {},
            getTranslatedLabel
        }
    },
    computed: {
        previewDisabled() {
            return !this.previewModel || !this.previewModel.enabled
        },
        widgetType() {
            return this.widgetModel?.type
        }
    },
    watch: {
        previewDisabled() {
            this.onPreviewEnabledChange()
        }
    },
    created() {
        this.setEventListeners()
        this.loadWidgetModel()
        this.loadDashboardModel()
        this.loadPreviewModel()
        this.loadSelectedDatasetColumnNames()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromPreview', this.onColumnRemovedFromPreview)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromPreview', this.onColumnRemovedFromPreview)
        },
        onColumnRemovedFromPreview() {
            this.onColumnRemoved()
        },
        loadWidgetModel() {
            this.widget = this.widgetModel
        },
        loadPreviewModel() {
            if (this.widgetModel?.settings?.interactions?.preview) this.previewModel = this.widgetModel.settings.interactions.preview
        },
        loadDashboardModel() {
            this.dashboardModel = this.store.getDashboard(this.dashboardId)
            this.loadDatasetsFromModel()
        },
        loadDatasetsFromModel() {
            this.dashboardDatasets = this.dashboardModel?.configuration.datasets
        },
        onColumnRemoved() {
            this.loadPreviewModel()
        },
        loadSelectedDatasetColumnNames() {
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return
            this.selectedDatasets.forEach((dataset: IDataset) => this.loadCrossSelectedDatasetColumnName(dataset))
        },
        loadCrossSelectedDatasetColumnName(dataset: IDataset) {
            this.selectedDatasetColumnNameMap[dataset.name] = []
            this.selectedDatasetColumnIdMap[dataset.id.dsId] = []
            for (let i = 0; i < dataset.metadata.fieldsMeta.length; i++) {
                this.selectedDatasetColumnIdMap[dataset.id.dsId].push(dataset.metadata.fieldsMeta[i].name)
                this.selectedDatasetColumnNameMap[dataset.name].push(dataset.metadata.fieldsMeta[i].name)
            }
        },
        onInteractionTypeChanged() {
            if (!this.previewModel) return
            switch (this.previewModel.type) {
                case 'allRow':
                    delete this.previewModel.column
                    delete this.previewModel.icon
                    break
                case 'singleColumn':
                    delete this.previewModel.icon
                    break
                case 'icon':
                    delete this.previewModel.column
            }
        },
        onParametersChanged(parameters: IWidgetInteractionParameter[]) {
            if (this.previewModel) this.previewModel.parameters = parameters
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (this.previewModel) this.previewModel.icon = model.icon
            if (this.previewModel && this.previewModel.multiselection) {
                if (model.color !== undefined) this.previewModel.multiselection.properties.color = model.color
                if (model['background-color'] !== undefined) this.previewModel.multiselection.properties['background-color'] = model['background-color']
            }
        },
        getSelectionDatasetColumnOptions() {
            if (!this.previewModel) return []
            return this.previewModel?.dataset && this.selectedDatasetColumnIdMap ? this.selectedDatasetColumnIdMap[this.previewModel.dataset] : []
        },
        onDatasetChanged() {
            if (!this.previewModel) return
            this.previewModel.column = ''
            this.previewModel.parameters = []
            const index = this.dashboardDatasets.findIndex((dataset: any) => dataset.id === this.previewModel?.dataset)
            if (index !== -1)
                this.previewModel.parameters = this.dashboardDatasets[index].parameters.map((tempParameter: IDatasetParameter) => {
                    return {
                        enabled: true,
                        name: tempParameter.name,
                        type: '',
                        value: ''
                    }
                })
        },
        onPreviewEnabledChange() {
            if (this.widget && this.previewModel?.enabled && this.widgetType !== 'table') {
                if (this.widget.settings.interactions.selection) this.widget.settings.interactions.selection.enabled = false
                if (this.widget.settings.interactions.link) this.widget.settings.interactions.link.enabled = false
                if (this.widget.settings.interactions.crossNavigation) this.widget.settings.interactions.crossNavigation.enabled = false
                if (this.widget.settings.interactions.iframe) this.widget.settings.interactions.iframe.enabled = false
            }
        },
        toggleMultiselect() {
            const interactions = this.widgetModel?.settings?.interactions as IWidgetInteractions
            if (interactions) {
                Object.entries(interactions).forEach(([key, interaction]) => {
                    if (key !== 'preview' && interaction?.enabled) interaction.enabled = false
                })
            }
        }
    }
})
</script>
