<template>
    <div v-if="iframeModel" class="p-grid p-p-4">
        <Message class="p-col-12 p-mb-3" :closable="false">
            {{ $t('dashboard.widgetEditor.interactions.iframeInteractionHint.partOne') }}
            <br />
            {{ $t('dashboard.widgetEditor.interactions.iframeInteractionHint.partTwo', { parameterPlaceholder: '{}', variablePlaceholder: '{}', value: '{value}' }) }}
        </Message>
        <div v-if="iframeModel" class="p-col-12">
            {{ 'TODO' }}
            {{ iframeModel }}

            <KnMonaco ref="monacoEditor" v-model="iframeModel.json" style="height: 500px" :options="{ theme: 'vs-light' }" :language="'json'" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IFrameInteractionSettings } from '@/modules/documentExecution/dashboard/Dashboard'
import Message from 'primevue/message'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'widget-interactions-iframe',
    components: { Message, KnMonaco },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        dashboardId: { type: String, required: true }
    },
    data() {
        return {
            widget: null as IWidget | null,
            iframeModel: null as IFrameInteractionSettings | null
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
