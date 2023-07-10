<template>
    <div id="container" class="kn-cursor-pointer" @click="executeInteractions">
        <iframe id="iframe" ref="iframeRef" :srcdoc="htmlCode"></iframe>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '../../Dashboard'
import { executeImageWidgetCrossNavigation } from '../interactionsHelpers/InteractionHelper'
import mockedData from './mockedData.json'

export default defineComponent({
    name: 'python-widget-container',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, dashboardId: { type: String, required: true }, editorMode: { type: Boolean } },
    emits: [],
    data() {
        return {
            htmlCode: null as any
        }
    },
    computed: {},
    created() {},
    mounted() {
        this.loadData()
    },
    unmounted() {},
    methods: {
        loadData() {
            this.htmlCode = mockedData.result
            console.log('-------- LOADED MOCKED DATA: ', this.htmlCode)
            console.log('--------  this.$refs.iframeRef: ', this.$refs.iframeRef)
            const iframeRef = this.$refs.iframeRef as any
            if (iframeRef) iframeRef.contentDocument.write(this.htmlCode)
        },
        executeInteractions() {
            console.log('--------- CLICKED!')
            const crossNavigation = this.widgetModel.settings.interactions.crossNavigation
            if (!crossNavigation.enabled) return
            // TODO - Rename
            executeImageWidgetCrossNavigation(crossNavigation, this.dashboardId)
        }
    }
})
</script>

<style lang="scss" scoped>
#container,
#iframe {
    height: 100%;
    width: 100%;
}
</style>
