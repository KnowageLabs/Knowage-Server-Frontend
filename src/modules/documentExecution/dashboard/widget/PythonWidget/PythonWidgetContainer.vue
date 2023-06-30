<template>
    <div id="container" class="kn-cursor-pointer" @click="executeInteractions">
        {{ 'PYTHON WIDGET CONTAINER' }}
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '../../Dashboard'
import { executeImageWidgetCrossNavigation } from '../interactionsHelpers/InteractionHelper'

export default defineComponent({
    name: 'python-widget-container',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, dashboardId: { type: String, required: true }, editorMode: { type: Boolean } },
    emits: [],
    data() {
        return {}
    },
    computed: {},
    created() {},
    unmounted() {},
    methods: {
        executeInteractions() {
            const crossNavigation = this.widgetModel.settings.interactions.crossNavigation
            if (!crossNavigation.enabled) return
            // TODO - Rename
            executeImageWidgetCrossNavigation(crossNavigation, this.dashboardId)
        }
    }
})
</script>

<style lang="scss" scoped></style>
