<template>
    <div v-if="linksModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <!-- Links list -->
            <div class="col-12">
                <div class="row items-center justify-between q-mb-sm">
                    <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.interactions.addLink') }}</span>
                    <q-btn flat dense color="primary" icon="add" :disable="linksDisabled" @click="addLink" />
                </div>

                <div v-for="(link, index) in linksModel.links" :key="index" class="link-row row no-wrap q-mb-sm">
                    <!-- Link content -->
                    <div class="col q-pa-sm">
                        <div class="row q-col-gutter-sm">
                            <!-- Base URL: full width -->
                            <div class="col-6">
                                <q-input v-model="link.baseurl" :label="$t('dashboard.widgetEditor.interactions.basicUrl')" outlined dense :disable="linksDisabled">
                                    <q-tooltip anchor="top middle">{{ link.baseurl }}</q-tooltip>
                                </q-input>
                            </div>
                            <div class="col-6">
                                <q-select v-model="link.action" :options="descriptor.linkTypes" :label="$t('dashboard.widgetEditor.interactions.linkType')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="linksDisabled">
                                    <template #selected-item="slotProps">
                                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.linkTypes, $t) }}</span>
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
                            <!-- Type (table only, col-6) + Link action (col-6 or col-12) -->
                            <div v-if="widgetType === 'table'" class="col-6">
                                <q-select v-model="link.type" :options="descriptor.interactionTypes" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="linksDisabled" @update:model-value="onInteractionTypeChanged(link)">
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

                            <!-- Column (singleColumn) or icon toolbar -->
                            <div v-if="link.type === 'singleColumn'" class="col-6">
                                <q-select v-model="link.column" :options="widgetModel.columns" :label="$t('common.column')" option-label="alias" option-value="columnName" emit-value map-options outlined dense :disable="linksDisabled" />
                            </div>
                            <div v-else-if="link.type === 'icon'" class="col-6">
                                <WidgetEditorStyleToolbar :options="[{ type: 'icon' }]" :prop-model="{ icon: link.icon }" :disabled="linksDisabled" @change="onStyleToolbarChange($event, link)" />
                            </div>

                            <div class="col-12"><q-separator /></div>

                            <!-- Parameters -->
                            <div class="col-12">
                                <TableWidgetLinkParameterList :widget-model="widgetModel" :prop-parameters="link.parameters" :selected-datasets-columns-map="selectedDatasetColumnNameMap" :disabled="linksDisabled" :dashboard-id="dashboardId" @change="onParametersChanged($event, link)" @addParameter="onAddParameter(link)" @delete="onParameterDelete($event, link)" />
                            </div>
                        </div>
                    </div>

                    <!-- Handle: delete -->
                    <div class="kn-action-handle row items-center justify-center" :class="linksDisabled ? 'kn-action-handle-disabled' : ''">
                        <q-btn flat round dense icon="delete" size="sm" :disable="linksDisabled" @click="removeLink(index)" />
                    </div>
                </div>
            </div>

            <!-- Multiselection: table only, at bottom with separator -->
            <template v-if="['table'].includes(widgetModel.type) && linksModel.multiselection">
                <div class="col-12"><q-separator /></div>
                <div class="col-12">
                    <q-toggle v-model="linksModel.multiselection.enabled" :label="$t('dashboard.widgetEditor.interactions.enableMultiselection')" :disable="linksDisabled" dense @update:model-value="toggleMultiselect" />
                </div>
                <div class="col-12">
                    <WidgetEditorStyleToolbar
                        :options="descriptor.styleToolbarSelectionOptions"
                        :prop-model="{
                            color: linksModel.multiselection.properties.color,
                            'background-color': linksModel.multiselection.properties['background-color']
                        }"
                        :disabled="!linksModel.multiselection.enabled"
                        @change="onStyleToolbarChange($event)"
                    />
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IDataset, IWidgetLinks, ITableWidgetLink, IWidgetStyleToolbarModel, IWidgetInteractionParameter, IWidgetInteractions } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../../DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../WidgetInteractionsDescriptor.json'
import WidgetEditorStyleToolbar from '../../styleToolbar/WidgetEditorStyleToolbar.vue'
import TableWidgetLinkParameterList from './WidgetLinkParameterList.vue'

export default defineComponent({
    name: 'table-widget-interactions-links',
    components: { TableWidgetLinkParameterList, WidgetEditorStyleToolbar },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]> },
        selectedDatasets: { type: Array as PropType<IDataset[]> },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            descriptor,
            widget: null as IWidget | null,
            linksModel: null as IWidgetLinks | null,
            selectedDatasetColumnNameMap: {},
            getTranslatedLabel
        }
    },
    computed: {
        linksDisabled() {
            return !this.linksModel || !this.linksModel.enabled
        },
        widgetType() {
            return this.widgetModel?.type
        }
    },
    watch: {
        linksDisabled() {
            this.onLinkEnabledChange()
        }
    },
    created() {
        this.setEventListeners()
        this.loadWidgetModel()
        this.loadLinksModel()
        this.loadSelectedDatasetColumnNames()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnRemovedFromLinks', this.onColumnRemovedFromLinks)
        },
        removeEventListeners() {
            emitter.off('columnRemovedFromLinks', this.onColumnRemovedFromLinks)
        },
        onColumnRemovedFromLinks() {
            this.onColumnRemoved()
        },
        loadWidgetModel() {
            this.widget = this.widgetModel
        },
        loadLinksModel() {
            if (this.widgetModel?.settings?.interactions?.link) this.linksModel = this.widgetModel.settings.interactions.link
        },
        loadSelectedDatasetColumnNames() {
            if (!this.selectedDatasets || this.selectedDatasets.length === 0) return
            this.selectedDatasets.forEach((dataset: IDataset) => this.loadSelectedDatasetColumnName(dataset))
        },
        loadSelectedDatasetColumnName(dataset: IDataset) {
            this.selectedDatasetColumnNameMap[dataset.name] = []
            for (let i = 0; i < dataset.metadata.fieldsMeta.length; i++) {
                this.selectedDatasetColumnNameMap[dataset.name].push(dataset.metadata.fieldsMeta[i].name)
            }
        },
        onInteractionTypeChanged(link: ITableWidgetLink) {
            switch (link.type) {
                case 'allRow':
                    delete link.column
                    delete link.icon
                    break
                case 'singleColumn':
                    delete link.icon
                    break
                case 'icon':
                    delete link.column
            }
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel, link?: ITableWidgetLink) {
            if (link) link.icon = model.icon
            if (this.linksModel && this.linksModel.multiselection) {
                if (model.color !== undefined) this.linksModel.multiselection.properties.color = model.color
                if (model['background-color'] !== undefined) this.linksModel.multiselection.properties['background-color'] = model['background-color']
            }
        },
        onColumnRemoved() {
            this.loadLinksModel()
        },
        onLinkEnabledChange() {
            if (!this.linksModel) return
            if (this.linksModel.enabled && this.linksModel.links.length === 0) {
                this.linksModel.links.push({ type: '', baseurl: '', action: '', parameters: [] })
            }
            this.updateOtherInteractions()
        },
        updateOtherInteractions() {
            if (this.widget && this.linksModel?.enabled && this.widgetType !== 'table') {
                if (this.widget.settings.interactions.selection) this.widget.settings.interactions.selection.enabled = false
                if (this.widget.settings.interactions.crossNavigation) this.widget.settings.interactions.crossNavigation.enabled = false
                if (this.widget.settings.interactions.preview) this.widget.settings.interactions.preview.enabled = false
                if (this.widget.settings.interactions.iframe) this.widget.settings.interactions.iframe.enabled = false
            }
        },
        addLink() {
            if (!this.linksModel || this.linksDisabled) return
            this.linksModel.links.push({ type: '', baseurl: '', action: '', parameters: [] })
        },
        removeLink(index: number) {
            if (!this.linksModel || this.linksDisabled) return
            this.linksModel.links.splice(index, 1)
        },
        onParametersChanged(parameters: IWidgetInteractionParameter[], link: ITableWidgetLink) {
            link.parameters = parameters
        },
        onAddParameter(link: ITableWidgetLink) {
            link.parameters.push({ enabled: true, name: '', type: '', dataType: '', useAsResource: false })
        },
        onParameterDelete(index: number, link: ITableWidgetLink) {
            link.parameters.splice(index, 1)
        },
        toggleMultiselect() {
            const interactions = this.widgetModel?.settings?.interactions as IWidgetInteractions
            if (interactions) {
                Object.entries(interactions).forEach(([key, interaction]) => {
                    if (key !== 'link' && interaction?.enabled) interaction.enabled = false
                })
            }
        }
    }
})
</script>

<style scoped>
.link-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
