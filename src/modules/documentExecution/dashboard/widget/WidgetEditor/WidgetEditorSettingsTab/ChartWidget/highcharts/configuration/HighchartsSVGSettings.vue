<template>
    <div v-if="svgSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <Message class="p-col-12 p-mb-3" :closable="false">{{ $t('dashboard.widgetEditor.highcharts.svg.hint') }}</Message>

        <div class="p-col-12">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.highcharts.svg.definition') }}</label>
            <div class="p-d-flex p-flex-row p-ai-center">
                <Textarea v-model="svgSettings.definition" class="kn-material-input kn-width-full" rows="4" :auto-resize="true" />
                <i v-tooltip.left="$t('dashboard.widgetEditor.highcharts.svg.hint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
            </div>
        </div>

        <div class="p-col-12 p-d-flex p-flex-row p-ai-center p-mt-2">
            <label for="upload" class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.svg.upload') }}:</label>
            <Button icon="fas fa-upload fa-1x" class="p-button-text p-button-plain" @click="setSVGUpload" />
            <KnInputFile :change-function="setSVGForUpload" :visibility="true" :trigger-input="triggerSVGUpload" accept=".svg" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { parse } from 'svg-parser'
import { mapActions } from 'pinia'
import mainStore from '@/App.store'
import Message from 'primevue/message'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import Textarea from 'primevue/textarea'

export default defineComponent({
    name: 'highcharts-svg-settings',
    components: { Message, KnInputFile, Textarea },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            svgSettings: null as any,
            model: null as IWidget | null,
            triggerSVGUpload: false
        }
    },
    created() {
        this.loadSVGSettings()
    },
    methods: {
        ...mapActions(mainStore, ['setError']),
        loadSVGSettings() {
            this.model = this.widgetModel
            if (!this.model.settings?.configuration?.svgSettings) this.model.settings.configuration.svgSettings = { definition: '' }
            this.svgSettings = this.widgetModel.settings.configuration.svgSettings
        },
        setSVGUpload() {
            this.triggerSVGUpload = false
            setTimeout(() => (this.triggerSVGUpload = true), 200)
        },
        setSVGForUpload(event: any) {
            const svgToUpload = event.target.files[0]
            if (svgToUpload) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const svgString = e.target ? e.target.result : ''
                    const svg = parse(svgString)
                    const pathElement = this.findNode(svg, 'path')
                    if (pathElement && pathElement.properties && pathElement.properties.d && this.model) {
                        let dAttribute = pathElement.properties.d
                        dAttribute = dAttribute.replaceAll(/(\r\n|\n|\r)/gm, '')
                        dAttribute = dAttribute.replaceAll(',', '.')
                        this.model.settings.configuration.svgSettings = { definition: dAttribute }
                        this.svgSettings = this.model.settings.configuration.svgSettings
                    } else {
                        this.setError({ title: this.$t('common.error.generic'), msg: this.$t('dashboard.widgetEditor.highcharts.svg.error') })
                    }
                }
                reader.readAsText(svgToUpload)
            }
        },
        findNode(node: any, nodeKey: string) {
            if (node.tagName === nodeKey) {
                return node
            } else if (node.children != null) {
                let result = null as any
                for (let i = 0; result == null && i < node.children.length; i++) {
                    result = this.findNode(node.children[i], nodeKey)
                }
                return result
            }
            return null
        }
    }
})
</script>
