<template>
    <div v-if="svgSettings" class="q-px-md q-pb-md">
        <div class="row q-mb-md">
            <div class="col-12">
                <q-input v-model="svgSettings.definition" :label="$t('dashboard.widgetEditor.highcharts.svg.definition')" type="textarea" outlined dense autogrow :hint="$t('dashboard.widgetEditor.highcharts.svg.hint')">
                    <template #append>
                        <q-btn flat round dense icon="upload" size="md" @click="setSVGUpload">
                            <q-tooltip>{{ $t('dashboard.widgetEditor.highcharts.svg.upload') }}</q-tooltip>
                        </q-btn>
                    </template>
                </q-input>
            </div>
        </div>
        <KnInputFile :change-function="setSVGForUpload" :visibility="true" :trigger-input="triggerSVGUpload" accept=".svg" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { parse } from 'svg-parser'
import { mapActions } from 'pinia'
import mainStore from '@/App.store'
import KnInputFile from '@/components/UI/KnInputFile.vue'

export default defineComponent({
    name: 'highcharts-svg-settings',
    components: { KnInputFile },
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
