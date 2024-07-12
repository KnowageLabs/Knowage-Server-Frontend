<template>
    <div v-if="widgetConfiguration" class="p-grid p-jc-start p-ai-center p-p-4">
        <form class="p-fluid p-formgrid p-grid p-m-1">
            <span class="p-field p-col-12">
                <InputSwitch v-model="widgetConfiguration.updateFromSelections" />
                <label class="kn-material-input-label p-ml-3"> {{ $t('dashboard.widgetEditor.updateFromSelections') }} </label>
            </span>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import InputSwitch from 'primevue/inputswitch'

export default defineComponent({
    name: 'widget-selection-configuration',
    components: { InputSwitch },
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
