<template>
    <div v-if="selectionModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div v-if="['table'].includes(widgetModel.type)" class="col-6">
                <q-select v-model="selectionModel.type" :options="interactionTypes" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="selectionDisabled" @update:model-value="onInteractionTypeChanged">
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

            <div v-if="['table', 'discovery'].includes(widgetModel.type) && selectionModel.type === 'singleColumn'" class="col-3">
                <q-select v-model="selectionModel.column" :options="widgetModel.columns" :label="$t('common.column')" option-label="alias" option-value="id" emit-value map-options outlined dense :disable="selectionDisabled" />
            </div>

            <div v-if="['table'].includes(widgetModel.type)" class="col-3">
                <q-select v-model="selectionModel.modalColumn" :options="attributeColumns" :label="$t('dashboard.widgetEditor.interactions.modalColumn')" option-label="alias" option-value="id" emit-value map-options outlined dense clearable @update:model-value="selectionChanged" />
            </div>

            <div v-if="selectionModel.type === 'icon'" class="col-3">
                <WidgetEditorStyleToolbar :options="[{ type: 'icon' }]" :prop-model="{ icon: selectionModel.icon }" :disabled="selectionDisabled" @change="onStyleToolbarChange($event)" />
            </div>

            <template v-if="['table'].includes(widgetModel.type) && selectionModel.multiselection">
                <div class="col-12"><q-separator /></div>
                <div class="col-12">
                    <q-toggle v-model="selectionModel.multiselection.enabled" :label="$t('dashboard.widgetEditor.interactions.enableMultiselection')" :disable="selectionDisabled" dense @update:model-value="selectionChanged" />
                </div>
                <div class="col-12">
                    <WidgetEditorStyleToolbar
                        :options="descriptor.styleToolbarSelectionOptions"
                        :prop-model="{
                            color: selectionModel.multiselection.properties.color,
                            'background-color': selectionModel.multiselection.properties['background-color']
                        }"
                        :disabled="!selectionModel.multiselection.enabled"
                        @change="onStyleToolbarChange($event)"
                    />
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetInteractions, IWidgetSelection, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../../DashboardHelpers'
import descriptor from '../WidgetInteractionsDescriptor.json'
import WidgetEditorStyleToolbar from '../../styleToolbar/WidgetEditorStyleToolbar.vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'

export default defineComponent({
    name: 'table-widget-selection',
    components: { WidgetEditorStyleToolbar },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true }
    },
    data() {
        return {
            descriptor,
            widget: null as IWidget | null,
            selectionModel: null as IWidgetSelection | null,
            getTranslatedLabel
        }
    },
    computed: {
        interactionTypes() {
            return this.widgetModel && this.widgetModel.type === 'table' ? this.descriptor.interactionTypes : this.descriptor.interactionTypes.slice(0, 2)
        },
        selectionDisabled() {
            return !this.selectionModel || !this.selectionModel.enabled
        },
        attributeColumns() {
            return this.widgetModel.columns.filter((col) => col.fieldType === 'ATTRIBUTE')
        }
    },
    created() {
        this.loadSelectionModel()
    },
    methods: {
        loadSelectionModel() {
            if (this.widgetModel?.settings?.interactions?.selection) this.selectionModel = this.widgetModel.settings.interactions.selection
        },
        selectionChanged() {
            const interactions = this.widgetModel?.settings?.interactions as IWidgetInteractions
            if (this.selectionModel?.multiselection?.enabled && interactions) {
                Object.entries(interactions).forEach(([key, interaction]) => {
                    if (key !== 'selection' && interaction?.enabled) {
                        interaction.enabled = false
                    }
                })
            }
            emitter.emit('selectionChanged', this.selectionModel)
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.selectionModel) return
            if (this.selectionModel.multiselection) {
                if (model.color !== undefined) this.selectionModel.multiselection.properties.color = model.color
                if (model['background-color'] !== undefined) this.selectionModel.multiselection.properties['background-color'] = model['background-color']
            }
            if (model.icon !== undefined) this.selectionModel.icon = model.icon
            this.selectionChanged()
        },
        onInteractionTypeChanged() {
            if (this.selectionModel && this.selectionModel.type !== 'icon') delete this.selectionModel.icon
        }
    }
})
</script>
