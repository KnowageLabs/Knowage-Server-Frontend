<template>
    <div id="container" class="kn-cursor-pointer">
        <Message v-if="!htmlCode && !loading" class="p-d-flex p-jc-center p-m-2" severity="info" :closable="false">
            {{ $t('dashboard.widgetEditor.python.error') }}
        </Message>
        <iframe id="iframe" ref="iframeRef" :srcdoc="htmlCode"></iframe>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '../../Dashboard'
import Message from 'primevue/message'

export default defineComponent({
    name: 'python-widget-container',
    components: { Message },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, dashboardId: { type: String, required: true }, editorMode: { type: Boolean }, dataToShow: { type: Object as any, required: true } },
    emits: [],
    data() {
        return {
            htmlCode: null as any,
            loading: false
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
            this.loading = true
            this.htmlCode = this.dataToShow ? this.dataToShow.result : null
            const iframeRef = this.$refs.iframeRef as any
            if (iframeRef && this.htmlCode) iframeRef.contentDocument.write(this.htmlCode)
            this.loading = false
        }
    }
})
</script>

<style lang="scss" scoped>
#container,
#iframe {
    height: 100%;
    width: 100%;
    border: none;
}
</style>
