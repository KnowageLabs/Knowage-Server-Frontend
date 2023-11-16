<template>
    <h1>IT WORKS</h1>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'highcharts-advanced-settings',
    props: { propWidgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            widgetModel: null as IWidget | null
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.widgetModel = this.propWidgetModel
        }
    }
})
</script>
