<template>
    <h1>TODO - Darko</h1>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'highcharts-sonification-settings',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    components: {},
    data() {
        return {}
    },
    async created() {},
    methods: {}
})
</script>