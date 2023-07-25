<template>
    <div v-if="iframeModel" class="p-grid p-p-4">
        <Message class="p-col-12 p-mb-3" :closable="false">
            {{ $t('dashboard.widgetEditor.interactions.iframeInteractionHint.partOne') }}
            <br />
            {{ $t('dashboard.widgetEditor.interactions.iframeInteractionHint.partTwo', { parameterPlaceholder: '{}', variablePlaceholder: '{}', value: '{value}' }) }}
        </Message>
        <div class="p-grid p-col-12 p-ai-center">
            <div v-if="['table'].includes(widgetModel.type)" class="p-col-6 p-sm-12 p-md-6 p-d-flex p-flex-column kn-flex p-px-2">
                <label class="kn-material-input-label"> {{ $t('common.type') }}</label>
                <Dropdown v-model="iframeModel.type" class="kn-material-input" :options="descriptor.interactionTypes" option-value="value" :disabled="iframeDisabled" @change="onInteractionTypeChanged">
                    <template #value="slotProps">
                        <div>
                            <span>{{ getTranslatedLabel(slotProps.value, descriptor.interactionTypes, $t) }}</span>
                        </div>
                    </template>
                    <template #option="slotProps">
                        <div>
                            <span>{{ $t(slotProps.option.label) }}</span>
                        </div>
                    </template>
                </Dropdown>
            </div>
            <div v-if="['table'].includes(widgetModel.type) && iframeModel.type === 'singleColumn'" class="p-col-6 p-sm-12 p-md-6 p-d-flex p-flex-row p-ai-center p-px-2">
                <div class="p-d-flex p-flex-column kn-flex">
                    <label class="kn-material-input-label"> {{ $t('common.column') }}</label>
                    <Dropdown v-model="iframeModel.column" class="kn-material-input" :options="widgetModel.columns" option-label="alias" option-value="id" :disabled="iframeDisabled"> </Dropdown>
                </div>
            </div>
            <div v-if="iframeModel.type === 'icon'" class="p-col-2 p-p-4 p-mt-3">
                <WidgetEditorStyleToolbar :options="[{ type: 'icon' }]" :prop-model="{ icon: iframeModel.icon }" :disabled="iframeDisabled" @change="onStyleToolbarChange($event)"> </WidgetEditorStyleToolbar>
            </div>
        </div>

        <div v-if="iframeModel" class="p-col-12">
            <KnMonaco ref="monacoEditor" v-model="iframeModel.json" style="height: 500px" :options="{ theme: 'vs-light' }" :language="'json'" :text-to-insert="''" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IFrameInteractionSettings, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import descriptor from '../WidgetInteractionsDescriptor.json'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import WidgetEditorStyleToolbar from '../../styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'widget-interactions-iframe',
    components: { Dropdown, Message, KnMonaco, WidgetEditorStyleToolbar },
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
            if (this.widget && this.iframeModel?.enabled) {
                if (this.widget.settings.interactions.selection) this.widget.settings.interactions.selection.enabled = false
                if (this.widget.settings.interactions.crossNavigation) this.widget.settings.interactions.crossNavigation.enabled = false
                if (this.widget.settings.interactions.preview) this.widget.settings.interactions.preview.enabled = false
                if (this.widget.settings.interactions.link) this.widget.settings.interactions.link.enabled = false
            }
        }
    }
})
</script>
