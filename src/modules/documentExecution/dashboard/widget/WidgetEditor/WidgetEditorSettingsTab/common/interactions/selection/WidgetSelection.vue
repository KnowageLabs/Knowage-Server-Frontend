<template>
    <div v-if="selectionModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div v-if="['table'].includes(widgetModel.type)" class="p-sm-12 p-d-flex p-flex-column kn-flex p-px-2">
            <label class="kn-material-input-label"> {{ $t('common.type') }}</label>
            <Dropdown v-model="selectionModel.type" class="kn-material-input" :options="interactionTypes" option-value="value" :disabled="selectionDisabled" @change="onInteractionTypeChanged">
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
        <div v-if="['table', 'discovery'].includes(widgetModel.type) && selectionModel.type === 'singleColumn'" class="p-sm-12 p-md-3 p-d-flex p-flex-row p-ai-center p-px-2">
            <div class="p-d-flex p-flex-column kn-flex">
                <label class="kn-material-input-label"> {{ $t('common.column') }}</label>
                <Dropdown v-model="selectionModel.column" class="kn-material-input" :options="widgetModel.columns" option-label="alias" option-value="id" :disabled="selectionDisabled"> </Dropdown>
            </div>
        </div>
        <div v-if="['table'].includes(widgetModel.type)" class="p-sm-12 p-md-3 p-d-flex p-flex-row p-ai-center p-px-2">
            <div class="p-d-flex p-flex-column kn-flex p-m-2">
                <label class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.interactions.modalColumn') }}</label>
                <Dropdown v-model="selectionModel.modalColumn" class="kn-material-input" :options="attributeColumns" :show-clear="true" option-label="alias" option-value="id" @change="selectionChanged"> </Dropdown>
            </div>
        </div>
        <div v-if="selectionModel.type === 'icon'" class="p-col-2 p-pt-4">
            <WidgetEditorStyleToolbar :options="[{ type: 'icon' }]" :prop-model="{ icon: selectionModel.icon }" :disabled="selectionDisabled" @change="onStyleToolbarChange($event)"> </WidgetEditorStyleToolbar>
        </div>
        <div class="p-col-12 p-grid">
            <div class="p-col-12 p-grid p-ai-center">
                <div v-if="selectionModel.multiselection" class="p-col-12 p-md-4 p-pt-4 p-pr-4">
                    <InputSwitch v-model="selectionModel.multiselection.enabled" :disabled="selectionDisabled" @change="selectionChanged"></InputSwitch>
                    <label class="kn-material-input-label p-m-3">{{ $t('dashboard.widgetEditor.interactions.enableMultiselection') }}</label>
                </div>
                <div v-if="selectionModel.multiselection" class="p-col-12 p-md-4 style-toolbar-container p-pt-3 p-pr-5">
                    <WidgetEditorStyleToolbar
                        :options="descriptor.styleToolbarSelectionOptions"
                        :prop-model="{
                            color: selectionModel.multiselection.properties.color,
                            'background-color': selectionModel.multiselection.properties['background-color']
                        }"
                        :disabled="!selectionModel.multiselection.enabled"
                        @change="onStyleToolbarChange($event)"
                    ></WidgetEditorStyleToolbar>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetSelection, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../../DashboardHelpers'
import descriptor from '../WidgetInteractionsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import WidgetEditorStyleToolbar from '../../styleToolbar/WidgetEditorStyleToolbar.vue'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'

export default defineComponent({
    name: 'table-widget-selection',
    components: { Dropdown, InputSwitch, WidgetEditorStyleToolbar },
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
        widgetType() {
            return this.widgetModel?.type
        },
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
        this.loadWidgetModel()
        this.loadSelectionModel()
    },
    methods: {
        loadWidgetModel() {
            this.widget = this.widgetModel
        },
        loadSelectionModel() {
            if (this.widgetModel?.settings?.interactions?.selection) this.selectionModel = this.widgetModel.settings.interactions.selection
        },
        selectionChanged() {
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

<style lang="scss" scoped>
.style-toolbar-container {
    max-width: 120px;
}
</style>
