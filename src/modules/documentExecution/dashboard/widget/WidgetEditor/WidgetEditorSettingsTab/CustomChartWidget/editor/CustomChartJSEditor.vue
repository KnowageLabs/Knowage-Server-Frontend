<template>
    <div class="cssMirrorContainer" style="height: 500px; width: 100%">
        <knMonaco ref="editor" v-model="model.settings.editor.js" style="height: 500px" language="javascript"></knMonaco>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import descriptor from './CustomChartWidgetAutocomplete.json'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'custom-chart-js-editor',
    components: { knMonaco },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, activeIndex: { type: Number, required: true } },
    data() {
        return {
            descriptor,
            model: {} as IWidget,
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

<style lang="scss">
.CodeMirror-hints {
    z-index: 99999;
}
</style>
