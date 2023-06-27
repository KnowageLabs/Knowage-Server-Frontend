<template>
    <div v-if="svgSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ 'TODO' }}
            {{ svgSettings }}
        </div>
        <div class="p-col-12">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.highcharts.svg.definition') }}</label>
            <div class="p-d-flex p-flex-row p-ai-center">
                <Textarea v-model="svgSettings.definition" class="kn-material-input kn-width-full" rows="4" :auto-resize="true" />
                <i v-tooltip.top="$t('dashboard.widgetEditor.highcharts.svg.hint')" class="pi pi-question-circle kn-cursor-pointer p-ml-2"></i>
            </div>
        </div>

        <div class="input-container p-col-12">
            <Button icon="fas fa-upload fa-1x" class="p-button-text p-button-plain p-ml-2" @click="setSVGUpload" />
            <label for="upload" class="kn-material-input-label">{{ $t('dashboard.widgetEditor.highcharts.svg.upload') }}:</label>
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
import KnInputFile from '@/components/UI/KnInputFile.vue'
import Textarea from 'primevue/textarea'

export default defineComponent({
    name: 'highcharts-svg-settings',
    components: { KnInputFile, Textarea },
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
            console.log('---------- svgToUpload', svgToUpload)
            if (svgToUpload) {
                const reader = new FileReader()
                console.log('---------- reader', reader)
                reader.onload = (e) => {
                    console.log('---------- e', e)
                    const svgString = e.target ? e.target.result : ''
                    const svg = parse(svgString)
                    console.log('---------- svg', svg)
                    const pathElement = this.findNode(svg, 'path')
                    console.log('---------- pathElement', pathElement)
                    if (pathElement && pathElement.properties && pathElement.properties.d && this.model) {
                        console.log('---------- pathElement.properties.d', pathElement.properties.d)
                        let dAttribute = pathElement.properties.d
                        dAttribute = dAttribute.replaceAll(/(\r\n|\n|\r)/gm, '')
                        dAttribute = dAttribute.replaceAll(',', '.')
                        this.model.settings.configuration.svgSettings = { definition: dAttribute }
                        this.svgSettings = this.model.settings.configuration.svgSettings
                        console.log('---------- final dAttribute', dAttribute)
                    } else {
                        //this.setError({ title: this.$t('common.error.generic'), msg: this.$t('dashboard.widgetEditor.highcharts.svg.error') })
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
