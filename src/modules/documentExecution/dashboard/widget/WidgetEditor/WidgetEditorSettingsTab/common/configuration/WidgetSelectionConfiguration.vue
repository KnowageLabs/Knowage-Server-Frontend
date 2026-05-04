<template>
    <div v-if="widgetConfiguration" class="q-pa-sm">
        <q-toggle v-model="widgetConfiguration.updateFromSelections" :label="$t('dashboard.widgetEditor.updateFromSelections')" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
export default defineComponent({
    name: 'widget-selection-configuration',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            widgetConfiguration: null as any
        }
    },
    computed: {},
    created() {
        this.loadWidgetSettings()
    },
    methods: {
        loadWidgetSettings() {
            if (this.widgetModel.settings) {
                this.widgetConfiguration = this.widgetModel.settings.configuration
                if (this.widgetConfiguration.updateFromSelections === undefined) this.widgetConfiguration.updateFromSelections = true
            }
        }
    }
})
</script>
