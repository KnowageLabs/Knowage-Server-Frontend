<template>
    <div id="htmlMirrorContainer">
        <knMonaco ref="editor" v-model="model.settings.editor.html" style="height: 500px" language="html"></knMonaco>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'custom-chart-html-editor',
    components: { knMonaco },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        activeIndex: { type: Number, required: true }
    },
    data() {
        return {
            model: {} as IWidget,
            cursorPosition: null,
            code: ''
        }
    },
    watch: {
        widgetModel() {
            this.loadModel()
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel
        }
    }
})
</script>

<style lang="scss" scoped>
#htmlMirrorContainer {
    height: 500px;
    width: 100%;
}
</style>
