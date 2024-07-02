<template>
    <div class="cssMirrorContainer" style="height: 500px; width: 100%">
        <knMonaco ref="editor" v-model="model.settings.editor.css" style="height: 500px" language="css"></knMonaco>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'widget-css-editor',
    components: { knMonaco },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, activeIndex: { type: Number, required: true } },
    data() {
        return {
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
