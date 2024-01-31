<template>
    <div v-if="widget" class="p-grid p-jc-center p-ai-center p-p-4"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-menu-configuration',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            widget: null as IWidget | null
        }
    },
    computed: {},
    created() {
        this.loadWidgetSettings()
    },
    methods: {
        loadWidgetSettings() {
            this.widget = this.widgetModel
            if (this.widget.settings?.configuration?.widgetMenu === undefined) this.widget.settings.configuration.widgetMenu = { enabled: true }
        }
    }
})
</script>
