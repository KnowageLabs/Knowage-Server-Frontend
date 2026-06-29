<template>
    <div v-if="iframeModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <!-- Hint banner -->
            <div class="col-12">
                <q-banner dense rounded class="bg-grey-2 text-body2">
                    {{ $t('dashboard.widgetEditor.interactions.iframeInteractionHint.partOne') }}<br />
                    {{ $t('dashboard.widgetEditor.interactions.iframeInteractionHint.partTwo', { parameterPlaceholder: '{}', variablePlaceholder: '{}', value: '{value}' }) }}
                </q-banner>
            </div>

            <!-- Type (table only, col-6) + Column (singleColumn, col-6) -->
            <div v-if="['table'].includes(widgetModel.type)" class="col-6">
                <q-select v-model="iframeModel.type" :options="descriptor.interactionTypes" :label="$t('common.type')" option-value="value" option-label="label" emit-value map-options outlined dense :disable="iframeDisabled" @update:model-value="onInteractionTypeChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getTranslatedLabel(slotProps.opt.value, descriptor.interactionTypes, $t) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section
                                ><q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </template>
                </q-select>
            </div>
            <div v-if="['table'].includes(widgetModel.type) && iframeModel.type === 'singleColumn'" class="col-6">
                <q-select v-model="iframeModel.column" :options="widgetModel.columns" :label="$t('common.column')" option-label="alias" option-value="id" emit-value map-options outlined dense :disable="iframeDisabled" />
            </div>
            <div v-if="iframeModel.type === 'icon'" class="col-6">
                <WidgetEditorStyleToolbar :options="[{ type: 'icon' }]" :prop-model="{ icon: iframeModel.icon }" :disabled="iframeDisabled" @change="onStyleToolbarChange($event)" />
            </div>

            <!-- JSON editor -->
            <div class="col-12">
                <KnMonaco ref="monacoEditor" v-model="iframeModel.json" style="height: 500px" :options="{ theme: 'vs-light' }" :language="'json'" :text-to-insert="''" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IFrameInteractionSettings, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../WidgetInteractionsDescriptor.json'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import WidgetEditorStyleToolbar from '../../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'widget-interactions-iframe',
    components: { KnMonaco, WidgetEditorStyleToolbar },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            descriptor,
            widget: null as IWidget | null,
            iframeModel: null as IFrameInteractionSettings | null,
            getTranslatedLabel
        }
    },
    computed: {
        iframeDisabled() {
            return !this.iframeModel || !this.iframeModel.enabled
        },
        widgetType() {
            return this.widgetModel?.type
        }
    },
    watch: {
        iframeDisabled() {
            this.onIFrameEnabledChange()
        }
    },
    created() {
        this.loadWidgetModel()
        this.loadIframeInteractionModel()
    },
    methods: {
        loadWidgetModel() {
            this.widget = this.widgetModel
        },
        loadIframeInteractionModel() {
            if (this.widgetModel?.settings?.interactions?.iframe) this.iframeModel = this.widgetModel.settings.interactions.iframe
        },
        onInteractionTypeChanged() {
            if (this.iframeModel && this.iframeModel.type !== 'icon') delete this.iframeModel.icon
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (this.iframeModel) this.iframeModel.icon = model.icon
        },
        onIFrameEnabledChange() {
            if (this.widget && this.iframeModel?.enabled && this.widgetType !== 'table') {
                if (this.widget.settings.interactions.selection) this.widget.settings.interactions.selection.enabled = false
                if (this.widget.settings.interactions.crossNavigation) this.widget.settings.interactions.crossNavigation.enabled = false
                if (this.widget.settings.interactions.preview) this.widget.settings.interactions.preview.enabled = false
                if (this.widget.settings.interactions.link) this.widget.settings.interactions.link.enabled = false
            }
        }
    }
})
</script>
