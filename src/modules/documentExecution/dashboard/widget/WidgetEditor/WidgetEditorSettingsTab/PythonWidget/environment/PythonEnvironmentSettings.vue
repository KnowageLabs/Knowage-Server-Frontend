<template>
    <h1>PYTHON ENVIRONMENT SETTINGS</h1>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue'
import { IWidget } from '../../../../../Dashboard'

export default defineComponent({
    name: 'python-environment-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {}
    },
    created() {},
    methods: {}
})
</script>
